import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Quiz, QuizQuestion } from '../types';
import { useData } from '../lib/hooks';
import { CheckCircle2, XCircle, ArrowRight, Loader2, RefreshCcw, Play } from 'lucide-react';

export default function TakeQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quizzes, setQuizzes, loading, error] = useData<Quiz[]>('/api/quizzes', []);
  
  const [isStarted, setIsStarted] = useState(false);
  const [questionLimit, setQuestionLimit] = useState<number | 'all'>('all');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [saving, setSaving] = useState(false);

  const quiz = quizzes.find(q => q.id === quizId);

  if (loading) {
    return <div className="flex h-[60vh] justify-center items-center"><Loader2 className="animate-spin text-neutral-400" size={32} /></div>;
  }

  if (error || !quiz) {
    return (
       <div className="text-center py-20 text-neutral-500">
         <p>ক্যুইজ পাওয়া যায়নি।</p>
         <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-neutral-50">ড্যাশবোর্ডে ফিরে যান</button>
       </div>
    );
  }

  const handleSelect = (index: number) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({ ...prev, [currentIndex]: index }));
  };

  const handleNext = () => {
    if (currentIndex < quizQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setSaving(true);
    let correctCount = 0;
    quizQuestions.forEach((q, idx) => {
       if (selectedAnswers[idx] === q.correctAnswerIndex) {
          correctCount++;
       }
    });

    try {
       const res = await fetch('/api/progress', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           quizId,
           score: correctCount,
           totalQuestions: quizQuestions.length
         })
       });
       if (!res.ok) throw new Error('Offline');
    } catch(e) {
       console.log("Offline mode: saving progress locally", e);
       const offlineAttempts = JSON.parse(localStorage.getItem('offline_progress') || '[]');
       offlineAttempts.push({
           quizId,
           score: correctCount,
           totalQuestions: quizQuestions.length,
           date: Date.now()
       });
       localStorage.setItem('offline_progress', JSON.stringify(offlineAttempts));
       
       // Update cached progress for immediate UI update
       const cachedProgress = JSON.parse(localStorage.getItem('cache_/api/progress') || '[]');
       cachedProgress.push({
           id: Date.now().toString(),
           quizId,
           score: correctCount,
           totalQuestions: quizQuestions.length,
           date: Date.now()
       });
       localStorage.setItem('cache_/api/progress', JSON.stringify(cachedProgress));
    }

    setShowResults(true);
    setSaving(false);
  };

  if (!isStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <button onClick={() => navigate('/')} className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white mb-4">← ড্যাশবোর্ড</button>
        <div className="bg-white dark:bg-neutral-900 p-8 md:p-12 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm text-center">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">{quiz.title}</h1>
            <p className="text-neutral-500 mb-8">মোট প্রশ্ন: {quiz.questions.length}টি</p>

            <div className="max-w-xs mx-auto text-left space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">আপনি কয়টি প্রশ্নের উত্তর দিতে চান?</label>
                  <select 
                    value={questionLimit}
                    onChange={(e) => setQuestionLimit(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
                  >
                    <option value="all">সবগুলো ({quiz.questions.length}টি)</option>
                    {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].filter(n => n < quiz.questions.length).map(n => (
                        <option key={n} value={n}>{n}টি প্রশ্ন</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={() => {
                     let q = [...quiz.questions];
                     if (questionLimit !== 'all') {
                        q = q.sort(() => 0.5 - Math.random()).slice(0, questionLimit);
                     }
                     setQuizQuestions(q);
                     setIsStarted(true);
                  }}
                  className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium flex justify-center items-center space-x-2 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition"
                >
                  <Play size={18} fill="currentColor" />
                  <span>ক্যুইজ শুরু করুন</span>
                </button>
            </div>
        </div>
      </div>
    );
  }

  const activeQuestion = quizQuestions[currentIndex];

  if (showResults) {
    let score = 0;
    quizQuestions.forEach((q, idx) => {
       if (selectedAnswers[idx] === q.correctAnswerIndex) score++;
    });
    
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-neutral-900 p-6 md:p-12 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm text-center">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">ক্যুইজ সম্পন্ন</h2>
            <div className="text-5xl md:text-6xl font-bold mb-4">{Math.round((score / quizQuestions.length) * 100)}%</div>
            <p className="text-neutral-500 mb-8">আপনি {quizQuestions.length} এর মধ্যে {score} পেয়েছেন</p>
            
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button 
                onClick={() => {
                  setShowResults(false);
                  setIsStarted(false);
                  setCurrentIndex(0);
                  setSelectedAnswers({});
                }} 
                className="px-6 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 font-medium flex items-center space-x-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 justify-center"
              >
                <RefreshCcw size={18} />
                <span>আবার চেষ্টা করুন</span>
              </button>
              <button 
                onClick={() => navigate('/')} 
                className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 flex items-center justify-center"
              >
                ড্যাশবোর্ড
              </button>
            </div>
         </div>
         
         <div className="space-y-4">
           <h3 className="text-xl font-semibold">উত্তর পর্যালোচনা করুন</h3>
           {quizQuestions.map((q, idx) => {
              const uAns = selectedAnswers[idx];
              const isCorrect = uAns === q.correctAnswerIndex;
              
              return (
                 <div key={q.id} className={`p-6 rounded-2xl border ${isCorrect ? 'bg-green-50/50 dark:bg-green-900/20 border-green-100 dark:border-green-900/50' : 'bg-red-50/50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50'}`}>
                    <div className="font-medium mb-3">{idx + 1}. {q.question}</div>
                    <div className="space-y-2">
                      {q.options.map((opt, oIdx) => {
                        let style = "text-neutral-500";
                        let icon = null;
                        
                        if (oIdx === q.correctAnswerIndex) {
                           style = "text-green-700 dark:text-green-400 font-medium";
                           icon = <CheckCircle2 size={16} className="text-green-500 mr-2 inline" />;
                        } else if (oIdx === uAns && !isCorrect) {
                           style = "text-red-600 dark:text-red-400 line-through";
                           icon = <XCircle size={16} className="text-red-500 mr-2 inline" />;
                        }
                        
                        return (
                          <div key={oIdx} className={`text-sm ${style} flex items-center`}>
                            {icon || <span className="w-6 inline-block" />}
                            {opt}
                          </div>
                        );
                      })}
                    </div>
                 </div>
              )
           })}
         </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
         <button onClick={() => navigate('/')} className="text-sm text-neutral-500 hover:text-black mb-4">← ড্যাশবোর্ড</button>
         <h1 className="text-2xl font-semibold tracking-tight">{quiz.title}</h1>
         <p className="text-sm text-neutral-500 mt-1">প্রশ্ন {currentIndex + 1} / {quizQuestions.length}</p>
         
         <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-black dark:bg-white h-full transition-all duration-300 ease-out" 
              style={{ width: `${((currentIndex + 1) / quizQuestions.length) * 100}%` }}
            />
         </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm mt-8">
         <h2 className="text-xl font-medium tracking-tight mb-8 leading-relaxed">
            {activeQuestion.question}
         </h2>
         
         <div className="space-y-3">
            {activeQuestion.options.map((option, idx) => {
               const isSelected = selectedAnswers[currentIndex] === idx;
               return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${
                      isSelected 
                        ? 'border-black dark:border-neutral-500 bg-neutral-900 dark:bg-neutral-800 text-white shadow-md' 
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                     <div className="flex items-center space-x-3">
                       <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium ${
                         isSelected ? 'border-white/30 text-white' : 'border-neutral-300 text-neutral-500'
                       }`}>
                         {String.fromCharCode(65 + idx)}
                       </div>
                       <span>{option}</span>
                     </div>
                  </button>
               );
            })}
         </div>

         <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
            <button 
              onClick={handleNext}
              disabled={selectedAnswers[currentIndex] === undefined || saving}
              className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium flex items-center space-x-2 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>সংরক্ষণ করা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <span>
                     {currentIndex === quizQuestions.length - 1 ? 'ক্যুইজ শেষ করুন' : 'পরবর্তী প্রশ্ন'}
                  </span>
                  {currentIndex !== quizQuestions.length - 1 && <ArrowRight size={18} />}
                </>
              )}
            </button>
         </div>
      </div>
    </div>
  );
}
