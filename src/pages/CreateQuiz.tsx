import React, { useState, useRef } from 'react';
import { useData } from '../lib/hooks';
import { Topic, Quiz } from '../types';
import { UploadCloud, Loader2, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CreateQuiz() {
  const [topics] = useData<Topic[]>('/api/topics', []);
  const [quizzes] = useData<Quiz[]>('/api/quizzes', []);
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  
  const [mode, setMode] = useState<'new' | 'append'>('new');
  const [topicId, setTopicId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !textContent.trim()) {
       setError("Please select an image or paste some text.");
       return;
    }
    
    if (mode === 'new' && (!topicId || !title)) {
       setError("Please fill all required fields.");
       return;
    }
    
    if (mode === 'append' && !selectedQuizId) {
       setError("Please select a quiz to append to.");
       return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    if (file) formData.append('image', file);
    if (textContent.trim()) formData.append('textContent', textContent.trim());

    if (mode === 'new') {
      formData.append('topicId', topicId);
      formData.append('title', title);
    } else {
      formData.append('quizId', selectedQuizId);
    }

    try {
      const customApiKey = localStorage.getItem('gemini_api_key') || '';
      if (customApiKey) {
        formData.append('customApiKey', customApiKey);
      }

      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
         const data = await res.json();
         throw new Error(data.error || 'Failed to generate quiz');
      }

      const generatedQuiz: Quiz = await res.json();
      navigate(`/quiz/${generatedQuiz.id}`);
    } catch (err: any) {
       setError(err.message);
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <div>
         <h1 className="text-3xl font-semibold tracking-tight mb-2">Extract Questions</h1>
         <p className="text-neutral-500">Upload a picture of a textbook page or paste lesson text. Our AI will automatically extract and format the questions into a quiz.</p>
      </div>

      <form onSubmit={handleGenerate} className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm space-y-6">
         {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
               {error}
            </div>
         )}
         
         <div className="flex space-x-2 p-1 bg-neutral-100 rounded-lg">
           <button
             type="button"
             onClick={() => setMode('new')}
             className={`flex-1 py-2 text-sm font-medium rounded-md transition ${mode === 'new' ? 'bg-white shadow-sm text-black' : 'text-neutral-500 hover:text-black'}`}
           >
             Create New Quiz
           </button>
           <button
             type="button"
             onClick={() => setMode('append')}
             className={`flex-1 py-2 text-sm font-medium rounded-md transition ${mode === 'append' ? 'bg-white shadow-sm text-black' : 'text-neutral-500 hover:text-black'}`}
           >
             Add to Existing Quiz
           </button>
         </div>

         {mode === 'new' ? (
           <>
             <div className="space-y-1">
                <label className="block text-sm font-medium text-neutral-700">Quiz Title</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  placeholder="e.g. History Chapter 4 Review"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required={mode === 'new'}
                />
             </div>

             <div className="space-y-1">
                <label className="block text-sm font-medium text-neutral-700">Topic</label>
                <select 
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  required={mode === 'new'}
                >
                  <option value="" disabled>Select a topic</option>
                  {topics.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {topics.length === 0 && (
                  <p className="text-xs text-neutral-500 mt-1">Make sure you create a topic first in the Topics tab.</p>
                )}
             </div>
           </>
         ) : (
           <div className="space-y-1">
              <label className="block text-sm font-medium text-neutral-700">Select Existing Quiz</label>
              <select 
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                required={mode === 'append'}
              >
                <option value="" disabled>Select a quiz to append to</option>
                {quizzes.map(q => (
                  <option key={q.id} value={q.id}>
                    {q.title} ({topics.find(t => t.id === q.topicId)?.name || 'Unknown Topic'})
                  </option>
                ))}
              </select>
              {quizzes.length === 0 && (
                <p className="text-xs text-neutral-500 mt-1">You don't have any quizzes yet to append to.</p>
              )}
           </div>
         )}

         <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">Upload Image</label>
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                file ? 'border-green-500 bg-green-50' : 'border-neutral-300 hover:bg-neutral-50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
               {file ? (
                 <div className="flex flex-col items-center justify-center space-y-2 text-green-700">
                   <ImageIcon size={32} />
                   <span className="font-medium">{file.name}</span>
                   <span className="text-xs opacity-80 pl-2">Click to change</span>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center space-y-3 text-neutral-500">
                   <UploadCloud size={40} className="text-neutral-400" />
                   <div>
                     <p className="font-medium text-neutral-700">Click to upload or drag and drop</p>
                     <p className="text-sm mt-1">PNG, JPG, JPEG up to 10MB</p>
                   </div>
                 </div>
               )}
            </div>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={(e) => {
                 if (e.target.files && e.target.files.length > 0) {
                    setFile(e.target.files[0]);
                 }
              }}
            />
         </div>

         <div className="flex items-center space-x-4 my-2">
           <div className="flex-1 h-px bg-neutral-200"></div>
           <span className="text-sm font-medium text-neutral-400">OR</span>
           <div className="flex-1 h-px bg-neutral-200"></div>
         </div>

         <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">Paste Text</label>
            <textarea
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 min-h-[120px] resize-y"
              placeholder="Paste your educational text, lesson notes, or existing questions here..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
            />
         </div>

         <button 
           type="submit" 
           disabled={loading}
           className="w-full py-3 bg-black text-white rounded-xl font-medium flex justify-center items-center space-x-2 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
         >
           {loading ? (
             <>
               <Loader2 className="animate-spin" size={20} />
               <span>Extracting Questions using AI...</span>
             </>
           ) : (
             <span>{mode === 'new' ? 'Generate New Quiz' : 'Add Questions to Quiz'}</span>
           )}
         </button>
      </form>
    </div>
  );
}
