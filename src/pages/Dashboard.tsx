import React, { useState } from 'react';
import { useData } from '../lib/hooks';
import { Topic, Quiz, QuizAttempt } from '../types';
import { Link } from 'react-router-dom';
import { Folder, Play, CheckCircle, BarChart2, Trash2, Edit2, Loader2 } from 'lucide-react';
import PasskeyModal from '../components/PasskeyModal';

export default function Dashboard() {
  const [quizzes, setQuizzes, loadingQuizzes, errorQuizzes] = useData<Quiz[]>('/api/quizzes', []);
  const [attempts, setAttempts, loadingAttempts, errorAttempts] = useData<QuizAttempt[]>('/api/progress', []);
  const [topics, setTopics, loadingTopics, errorTopics] = useData<Topic[]>('/api/topics', []);
  
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);

  if (loadingQuizzes || loadingAttempts || loadingTopics) {
    return <div className="flex h-[60vh] justify-center items-center"><Loader2 className="animate-spin text-neutral-400" size={32} /></div>;
  }

  if (errorQuizzes || errorAttempts || errorTopics) {
    return (
      <div className="flex flex-col h-[60vh] justify-center items-center text-center space-y-4">
         <div className="bg-red-50 text-red-600 p-4 rounded-xl max-w-md">
            <h3 className="font-semibold mb-1">ডেটা লোড করতে সমস্যা হয়েছে</h3>
            <p className="text-sm opacity-90">হয়ত আপনি অফলাইনে আছেন এবং কোনো অফলাইন ডেটা সেভ করা নেই। অনুগ্রহ করে ইন্টারনেট সংযোগ চেক করুন।</p>
         </div>
      </div>
    );
  }

  const totalTaken = attempts.length;

  const handleDeleteQuiz = async (passkey: string) => {
    if (!quizToDelete) return;
    const correctPasskey = import.meta.env.VITE_DELETE_PASSKEY || '1234';
    if (passkey !== correctPasskey) {
      alert("ভুল পাস-কী!");
      return;
    }
    
    try {
      const res = await fetch(`/api/quizzes/${quizToDelete}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setQuizzes(quizzes.filter(q => q.id !== quizToDelete));
      }
    } catch(err) {
      console.error(err);
    } finally {
      setQuizToDelete(null);
    }
  };

  const getTopicFamily = (parentTopicId: string) => {
    let ids = new Set<string>([parentTopicId]);
    let added = true;
    while(added) {
      added = false;
      topics.forEach(t => {
        if (t.parentId && ids.has(t.parentId) && !ids.has(t.id)) {
          ids.add(t.id);
          added = true;
        }
      });
    }
    return ids;
  };

  const parentTopics = topics.filter(t => !t.parentId);
  const parentScores = parentTopics.map(parentTopic => {
    const familyIds = getTopicFamily(parentTopic.id);
    const familyQuizIds = new Set(quizzes.filter(q => familyIds.has(q.topicId)).map(q => q.id));
    const familyAttempts = attempts.filter(att => familyQuizIds.has(att.quizId));
    
    const score = familyAttempts.length > 0 
      ? Math.round(familyAttempts.reduce((acc, att) => acc + (att.score / att.totalQuestions), 0) / familyAttempts.length * 100) 
      : 0;
    
    return {
      id: parentTopic.id,
      name: parentTopic.name,
      score,
      attemptsCount: familyAttempts.length
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">ড্যাশবোর্ড</h1>
        <p className="text-neutral-500">স্বাগতম। আপনার ক্যুইজ পারফরম্যান্স ট্র্যাক করুন এবং শেখা শুরু করুন।</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center space-x-3 mb-4 text-neutral-600 dark:text-neutral-400">
            <CheckCircle size={20} />
            <span className="font-medium">সম্পন্ন করা ক্যুইজ</span>
          </div>
          <span className="text-4xl font-semibold">{totalTaken}</span>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center space-x-3 mb-4 text-neutral-600 dark:text-neutral-400">
            <Folder size={20} />
            <span className="font-medium">মোট বিষয়</span>
          </div>
          <span className="text-4xl font-semibold">{topics.length}</span>
        </div>
      </div>

      {parentScores.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold tracking-tight mb-4 flex items-center gap-2">
            <BarChart2 size={20} />
            বিষয় অনুযায়ী গড় স্কোর
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {parentScores.map(ts => (
               <div key={ts.id} className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-medium text-lg leading-tight mr-4">{ts.name}</span>
                    <span className="text-xs px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                      {ts.attemptsCount} বার
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold">{ts.score}%</span>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-4">সাম্প্রতিক ক্যুইজগুলো</h2>
        {quizzes.length === 0 ? (
          <div className="text-center p-12 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-dashed">
             <p className="text-neutral-500 mb-4">এখনও কোনো ক্যুইজ নেই।</p>
             <Link to="/create" className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition">
               প্রথম ক্যুইজ তৈরি করুন
             </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {[...quizzes].reverse().map(quiz => (
               <QuizCard key={quiz.id} quiz={quiz} topics={topics} onDelete={() => setQuizToDelete(quiz.id)} />
             ))}
          </div>
        )}
      </div>
      
      <PasskeyModal 
        isOpen={!!quizToDelete}
        onClose={() => setQuizToDelete(null)}
        onSubmit={handleDeleteQuiz}
      />
    </div>
  );
}

function QuizCard({ quiz, topics, onDelete }: { quiz: Quiz, topics: Topic[], onDelete: () => void }) {
  return (
    <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col group">
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-medium text-lg">{quiz.title}</h3>
        <button 
          onClick={onDelete}
          className="text-neutral-400 hover:text-red-500 p-1 rounded-md opacity-100 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
          title="ক্যুইজ মুছুন"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <p className="text-sm text-neutral-500 mb-4 flex-1">
        {quiz.questions.length}টি প্রশ্ন • বিষয়: {topics.find(t => t.id === quiz.topicId)?.name || 'অজানা'}
      </p>
      <div className="flex items-center space-x-4 mt-auto">
        <Link to={`/quiz/${quiz.id}`} className="inline-flex items-center space-x-2 text-sm font-medium text-black dark:text-white hover:opacity-70 transition">
          <Play size={16} />
          <span>ক্যুইজ শুরু করুন</span>
        </Link>
        <Link to={`/edit-quiz/${quiz.id}`} className="inline-flex items-center space-x-2 text-sm font-medium text-neutral-500 hover:text-black transition">
          <Edit2 size={16} />
          <span>সম্পাদনা</span>
        </Link>
      </div>
    </div>
  );
}
