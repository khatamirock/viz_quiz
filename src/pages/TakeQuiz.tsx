import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Quiz, QuizQuestion } from '../types';
import { useData } from '../lib/hooks';
import { CheckCircle2, XCircle, ArrowRight, Loader2, RefreshCcw } from 'lucide-react';

export default function TakeQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quizzes, setQuizzes, loading, error] = useData<Quiz[]>('/api/quizzes', []);
  
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
         <p>Quiz not found.</p>
         <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-neutral-50">Back to Dashboard</button>
       </div>
    );
  }

  const handleSelect = (index: number) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({ ...prev, [currentIndex]: index }));
  };

  const handleNext = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setSaving(true);
    let correctCount = 0;
    quiz.questions.forEach((q, idx) => {
       if (selectedAnswers[idx] === q.correctAnswerIndex) {
          correctCount++;
       }
    });

    try {
       await fetch('/api/progress', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           quizId,
           score: correctCount,
           totalQuestions: quiz.questions.length
         })
       });
    } catch(e) {
       console.error("Failed to save progress", e);
    }

    setShowResults(true);
    setSaving(false);
  };

  const activeQuestion = quiz.questions[currentIndex];

  if (showResults) {
    let score = 0;
    quiz.questions.forEach((q, idx) => {
       if (selectedAnswers[idx] === q.correctAnswerIndex) score++;
    });
    
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="bg-white p-6 md:p-12 rounded-3xl border border-neutral-200 shadow-sm text-center">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">Quiz Completed</h2>
            <div className="text-5xl md:text-6xl font-bold mb-4">{Math.round((score / quiz.questions.length) * 100)}%</div>
            <p className="text-neutral-500 mb-8">You scored {score} out of {quiz.questions.length}</p>
            
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button 
                onClick={() => {
                  setShowResults(false);
                  setCurrentIndex(0);
                  setSelectedAnswers({});
                }} 
                className="px-6 py-3 rounded-xl border border-neutral-200 font-medium flex items-center space-x-2 hover:bg-neutral-50"
              >
                <RefreshCcw size={18} />
                <span>Retry</span>
              </button>
              <button 
                onClick={() => navigate('/')} 
                className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-neutral-800"
              >
                Dashboard
              </button>
            </div>
         </div>
         
         <div className="space-y-4">
           <h3 className="text-xl font-semibold">Review Answers</h3>
           {quiz.questions.map((q, idx) => {
              const uAns = selectedAnswers[idx];
              const isCorrect = uAns === q.correctAnswerIndex;
              
              return (
                 <div key={q.id} className={`p-6 rounded-2xl border ${isCorrect ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                    <div className="font-medium mb-3">{idx + 1}. {q.question}</div>
                    <div className="space-y-2">
                      {q.options.map((opt, oIdx) => {
                        let style = "text-neutral-500";
                        let icon = null;
                        
                        if (oIdx === q.correctAnswerIndex) {
                           style = "text-green-700 font-medium";
                           icon = <CheckCircle2 size={16} className="text-green-500 mr-2 inline" />;
                        } else if (oIdx === uAns && !isCorrect) {
                           style = "text-red-600 line-through";
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
         <button onClick={() => navigate('/')} className="text-sm text-neutral-500 hover:text-black mb-4">â† Dashboard</button>
         <h1 className="text-2xl font-semibold tracking-tight">{quiz.title}</h1>
         <p className="text-sm text-neutral-500 mt-1">Question {currentIndex + 1} of {quiz.questions.length}</p>
         
         <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-black h-full transition-all duration-300 ease-out" 
              style={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }}
            />
         </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm mt-8">
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
                        ? 'border-black bg-neutral-900 text-white shadow-md' 
                        : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
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

         <div className="mt-8 pt-6 border-t border-neutral-100 flex justify-end">
            <button 
              onClick={handleNext}
              disabled={selectedAnswers[currentIndex] === undefined || saving}
              className="px-6 py-3 bg-black text-white rounded-xl font-medium flex items-center space-x-2 hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>
                     {currentIndex === quiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                  </span>
                  {currentIndex !== quiz.questions.length - 1 && <ArrowRight size={18} />}
                </>
              )}
            </button>
         </div>
      </div>
    </div>
  );
}
