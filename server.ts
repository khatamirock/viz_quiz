import express from 'express';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import { GoogleGenAI } from '@google/genai';
import mongoose from 'mongoose';

const upload = multer({ storage: multer.memoryStorage() });

// --- MongoDB Configuration ---

// Setup models
const TopicSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  parentId: { type: String }
});
const TopicModel = mongoose.model('Topic', TopicSchema);

const QuizSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  topicId: { type: String, required: true },
  title: { type: String, required: true },
  questions: [{
    id: String,
    question: String,
    options: [String],
    correctAnswerIndex: Number
  }],
  createdAt: Number
});
const QuizModel = mongoose.model('Quiz', QuizSchema);

const AttemptSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  quizId: { type: String, required: true },
  score: Number,
  totalQuestions: Number,
  date: Number
});
const AttemptModel = mongoose.model('Attempt', AttemptSchema);

let isConnected = false;
async function connectDB() {
  if (isConnected) return true;
  if (!process.env.MONGODB_URI) {
    return false; // Fallback to local files
  }
  
  if (mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      isConnected = true;
    } catch (error) {
      console.error("MongoDB connection error:", error);
      return false;
    }
  }
  return true;
}

// --- Local File Fallback (For Development/Preview) ---
const KV_FILE = 'kv_store.json';
type KVStore = Record<string, any>;

async function getKV(): Promise<KVStore> {
  try {
    const data = await fs.readFile(KV_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

async function setKV(data: KVStore): Promise<void> {
  await fs.writeFile(KV_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Helper to decide where to store data based on environment
async function getData<T>(collection: string): Promise<T[]> {
  const isMongoConnected = await connectDB();
  if (isMongoConnected) {
    if (collection === 'topics') return (await TopicModel.find({}, '-_id -__v').lean()) as unknown as T[];
    if (collection === 'quizzes') return (await QuizModel.find({}, '-_id -__v').lean()) as unknown as T[];
    if (collection === 'attempts') return (await AttemptModel.find({}, '-_id -__v').lean()) as unknown as T[];
  }
  
  const store = await getKV();
  return (store[collection] as T[]) || [];
}

async function insertData<T extends {id: string}>(collection: string, doc: T): Promise<void> {
  const isMongoConnected = await connectDB();
  if (isMongoConnected) {
    if (collection === 'topics') await TopicModel.create(doc);
    if (collection === 'quizzes') await QuizModel.create(doc);
    if (collection === 'attempts') await AttemptModel.create(doc);
    return;
  }

  const store = await getKV();
  const arr = (store[collection] as T[]) || [];
  arr.push(doc);
  store[collection] = arr;
  await setKV(store);
}

// Data models interfaces
export interface Topic {
  id: string;
  name: string;
  parentId?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Quiz {
  id: string;
  topicId: string;
  title: string;
  questions: QuizQuestion[];
  createdAt: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  date: number;
}

export const app = express();
app.use(express.json());

// Wait to initialize Gemini so that missing API keys do not block app startup.
function getGeminiClient(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

// --- API Routes ---

  // Topics
  app.get('/api/topics', async (req, res) => {
    try {
      const topics = await getData<Topic>('topics');
      res.json(topics);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/topics', async (req, res) => {
    try {
      const { name, parentId } = req.body;
      const newTopic: Topic = {
        id: uuidv4(),
        name,
        parentId,
      };
      await insertData('topics', newTopic);
      res.json(newTopic);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Quizzes
  app.get('/api/quizzes', async (req, res) => {
    try {
      const quizzes = await getData<Quiz>('quizzes');
      res.json(quizzes);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/quizzes/:topicId', async (req, res) => {
    try {
      const { topicId } = req.params;
      const quizzes = await getData<Quiz>('quizzes');
      const filtered = quizzes.filter(q => q.topicId === topicId);
      res.json(filtered);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Create Quiz manually or edit
  app.post('/api/quizzes', async (req, res) => {
     try {
       const { topicId, title, questions } = req.body;
       const newQuiz: Quiz = {
         id: uuidv4(),
         topicId,
         title,
         questions: questions.map((q: any) => ({ ...q, id: uuidv4() })),
         createdAt: Date.now()
       };
       await insertData('quizzes', newQuiz);
       res.json(newQuiz);
     } catch (e: any) {
       res.status(500).json({ error: e.message });
     }
  });

  // Generate Quiz from Image using Gemini
  app.post('/api/generate-quiz', upload.single('image'), async (req, res) => {
    try {
      const file = req.file;
      const { topicId, title } = req.body;

      if (!file) {
        res.status(400).json({ error: 'No image uploaded' });
        return;
      }

      if (!topicId || !title) {
        res.status(400).json({ error: 'Topic ID and Title are required' });
        return;
      }

      const client = getGeminiClient();
      
      const prompt = `You are an AI assistant designed to extract multiple choice questions from textbook images.
Please extract all readable questions from the image and format them as multiple-choice questions.
If no options are present in the text, generate 3 plausible distractors and one correct option and infer the correct answer.
If options are present, use those exactly. 
Return the output ONLY as a JSON array of objects, structured like this:
[
  {
    "question": "The question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 0
  }
]
No other text, markdown, or explanations outside the JSON array.`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: file.buffer.toString('base64'),
                  mimeType: file.mimetype,
                }
              }
            ]
          }
        ],
        config: {
            temperature: 0.2,
            responseMimeType: "application/json"
        }
      });

      const responseText = response.text || '[]';
      let extractedQuestions = [];
      try {
        extractedQuestions = JSON.parse(responseText.trim().replace(/^\\s*\\x60\\x60\\x60json\\n/, '').replace(/\\n\\x60\\x60\\x60\\s*$/, ''));
      } catch (parseError) {
        console.error("Gemini Response parsing error:", parseError, "\\nResponse Text:", responseText);
        res.status(500).json({ error: 'Failed to parse AI response into JSON. Check server logs.' });
        return;
      }

      if (!Array.isArray(extractedQuestions)) {
         res.status(500).json({ error: 'AI response was not an array.' });
         return;
      }

      const formattedQuestions: QuizQuestion[] = extractedQuestions.map((q: any) => ({
        id: uuidv4(),
        question: q.question || "Unknown Question",
        options: Array.isArray(q.options) ? q.options : ["A", "B", "C", "D"],
        correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0
      }));

      const newQuiz: Quiz = {
        id: uuidv4(),
        topicId,
        title,
        questions: formattedQuestions,
        createdAt: Date.now()
      };
      await insertData('quizzes', newQuiz);

      res.json(newQuiz);
    } catch (e: any) {
       console.error("Error generating quiz:", e);
       res.status(500).json({ error: e.message || 'Error communicating with AI model' });
    }
  });

  // Progress Tracking
  app.get('/api/progress', async (req, res) => {
    try {
      const attempts = await getData<QuizAttempt>('attempts');
      res.json(attempts);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/progress', async (req, res) => {
     try {
       const { quizId, score, totalQuestions } = req.body;
       const newAttempt: QuizAttempt = {
         id: uuidv4(),
         quizId,
         score,
         totalQuestions,
         date: Date.now()
       };
       await insertData('attempts', newAttempt);
       res.json(newAttempt);
     } catch(e: any) {
       res.status(500).json({ error: e.message });
     }
  });


  // --- Vite Middleware ---
async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Only run the server natively if we are not in a Vercel Serverless environment
if (!process.env.VERCEL) {
  startServer();
}
