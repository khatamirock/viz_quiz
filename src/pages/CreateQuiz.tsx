import React, { useState, useRef } from 'react';
import { useData } from '../lib/hooks';
import { Topic, Quiz } from '../types';
import { UploadCloud, Loader2, Image as ImageIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function CreateQuiz() {
  const [topics] = useData<Topic[]>('/api/topics', []);
  const [quizzes] = useData<Quiz[]>('/api/quizzes', []);
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTopicId = searchParams.get('topicId') || '';

  const [mode, setMode] = useState<'new' | 'append'>('new');
  const [topicId, setTopicId] = useState<string>(initialTopicId);
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
         <h1 className="text-3xl font-semibold tracking-tight mb-2">প্রশ্ন বের করুন</h1>
         <p className="text-neutral-500">বইয়ের পাতার ছবি আপলোড করুন অথবা পড়ার বিষয়বস্তু পেস্ট করুন। আমাদের এআই স্বয়ংক্রিয়ভাবে সেখান থেকে ক্যুইজ তৈরি করবে। (TSV ফরম্যাটে টেক্সট দিলে সাথে সাথেই ক্যুইজ তৈরি হবে)</p>
      </div>

      <form onSubmit={handleGenerate} className="bg-white dark:bg-neutral-900 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
         {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
               {error}
            </div>
         )}
         
         <div className="flex space-x-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
             <button
             type="button"
             onClick={() => setMode('new')}
             className={`flex-1 py-2 text-sm font-medium rounded-md transition ${mode === 'new' ? 'bg-white dark:bg-neutral-700 shadow-sm text-black dark:text-white' : 'text-neutral-500 hover:text-black dark:hover:text-white'}`}
           >
             নতুন ক্যুইজ তৈরি করুন
           </button>
           <button
             type="button"
             onClick={() => setMode('append')}
             className={`flex-1 py-2 text-sm font-medium rounded-md transition ${mode === 'append' ? 'bg-white dark:bg-neutral-700 shadow-sm text-black dark:text-white' : 'text-neutral-500 hover:text-black dark:hover:text-white'}`}
           >
             বিদ্যমান ক্যুইজে যুক্ত করুন
           </button>
         </div>

         {mode === 'new' ? (
           <>
             <div className="space-y-1">
                <label className="block text-sm font-medium text-neutral-700">ক্যুইজের শিরোনাম</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
                  placeholder="যেমন: ইতিহাস অধ্যায় ৪"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required={mode === 'new'}
                />
             </div>

             <div className="space-y-1">
                <label className="block text-sm font-medium text-neutral-700">বিষয়</label>
                <select 
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  required={mode === 'new'}
                >
                  <option value="" disabled>একটি বিষয় নির্বাচন করুন</option>
                  {topics.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {topics.length === 0 && (
                  <p className="text-xs text-neutral-500 mt-1">প্রথমে বিষয়সমূহ ট্যাব থেকে একটি বিষয় তৈরি করে নিন।</p>
                )}
             </div>
           </>
         ) : (
           <div className="space-y-1">
              <label className="block text-sm font-medium text-neutral-700">বিদ্যমান ক্যুইজ নির্বাচন করুন</label>
              <select 
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                required={mode === 'append'}
              >
                <option value="" disabled>যুক্ত করার জন্য একটি ক্যুইজ বেছে নিন</option>
                {quizzes.map(q => (
                  <option key={q.id} value={q.id}>
                    {q.title} ({topics.find(t => t.id === q.topicId)?.name || 'অজানা বিষয়'})
                  </option>
                ))}
              </select>
              {quizzes.length === 0 && (
                <p className="text-xs text-neutral-500 mt-1">যুক্ত করার মতো কোনো ক্যুইজ নেই।</p>
              )}
           </div>
         )}

         <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">ছবি আপলোড করুন</label>
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                file ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
               {file ? (
                 <div className="flex flex-col items-center justify-center space-y-2 text-green-700">
                   <ImageIcon size={32} />
                   <span className="font-medium">{file.name}</span>
                   <span className="text-xs opacity-80 pl-2">পরিবর্তন করতে ক্লিক করুন</span>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center space-y-3 text-neutral-500">
                   <UploadCloud size={40} className="text-neutral-400" />
                   <div>
                     <p className="font-medium text-neutral-700">ছবি আপলোড করতে ক্লিক করুন অথবা টেনে আনুন</p>
                     <p className="text-sm mt-1">PNG, JPG, JPEG সর্বোচ্চ ১০এমবি (10MB)</p>
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
            <label className="block text-sm font-medium text-neutral-700">টেক্সট পেস্ট করুন</label>
            <textarea
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 bg-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 min-h-[120px] resize-y"
              placeholder="আপনার পড়ার বিষয়বস্তু বা পরীক্ষার নোট এখানে পেস্ট করুন..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
            />
         </div>

         <button 
           type="submit" 
           disabled={loading}
           className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium flex justify-center items-center space-x-2 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
         >
           {loading ? (
             <>
               <Loader2 className="animate-spin" size={20} />
               <span>এআই দিয়ে ক্যুইজ তৈরি করা হচ্ছে...</span>
             </>
           ) : (
             <span>{mode === 'new' ? 'নতুন ক্যুইজ তৈরি করুন' : 'ক্যুইজে প্রশ্ন যুক্ত করুন'}</span>
           )}
         </button>
      </form>
    </div>
  );
}
