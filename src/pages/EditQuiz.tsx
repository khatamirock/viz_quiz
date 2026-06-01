import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Quiz, QuizQuestion } from '../types';
import { useData } from '../lib/hooks';
import { Loader2, Save, Trash2, Plus, ArrowLeft } from 'lucide-react';
import PasskeyModal from '../components/PasskeyModal';

export default function EditQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quizzes, setQuizzes, loading, error] = useData<Quiz[]>('/api/quizzes', []);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [saving, setSaving] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);

  const originalQuiz = quizzes.find(q => q.id === quizId);

  useEffect(() => {
    if (originalQuiz && !editingQuiz) {
      // deep clone the quiz
      setEditingQuiz(JSON.parse(JSON.stringify(originalQuiz)));
    }
  }, [originalQuiz, editingQuiz]);

  if (loading) {
    return <div className="flex h-[60vh] justify-center items-center"><Loader2 className="animate-spin text-neutral-400" size={32} /></div>;
  }

  if (error || (!originalQuiz && !loading)) {
    return (
       <div className="text-center py-20 text-neutral-500">
         <p>ক্যুইজ পাওয়া যায়নি। (Quiz not found)</p>
         <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-neutral-50">ড্যাশবোর্ডে ফিরে যান</button>
       </div>
    );
  }

  if (!editingQuiz) return null;

  const updateQuestion = (index: number, updatedQuestion: QuizQuestion) => {
    const questions = [...editingQuiz.questions];
    questions[index] = updatedQuestion;
    setEditingQuiz({ ...editingQuiz, questions });
  };

  const updateOption = (qIndex: number, oIndex: number, text: string) => {
    const q = editingQuiz.questions[qIndex];
    if (!q) return;
    const options = [...q.options];
    options[oIndex] = text;
    updateQuestion(qIndex, { ...q, options });
  };

  const removeQuestion = (passkey: string) => {
    if (questionToDelete === null) return;
    const correctPasskey = import.meta.env.VITE_DELETE_PASSKEY || '1234';
    if (passkey !== correctPasskey) {
      alert("ভুল পাস-কী!");
      return;
    }

    const questions = editingQuiz.questions.filter((_, i) => i !== questionToDelete);
    setEditingQuiz({ ...editingQuiz, questions });
    setQuestionToDelete(null);
  };

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: Date.now().toString(),
      question: 'নতুন প্রশ্ন',
      options: ['অপশন ১', 'অপশন ২', 'অপশন ৩', 'অপশন ৪'],
      correctAnswerIndex: 0
    };
    setEditingQuiz({ ...editingQuiz, questions: [...editingQuiz.questions, newQuestion] });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // API call to save the quiz
      // Since useData doesn't have an update method for an individual item by default, 
      // we usually update the whole array or we might have an API endpoint like PUT /api/quizzes/:id
      // Let's assume we can just replace the whole array via POST /api/quizzes or PUT /api/quizzes/:id
      // Wait, let's look at how adding a quiz works in CreateQuiz.tsx
      const res = await fetch(`/api/quizzes/${editingQuiz.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingQuiz)
      });
      if (res.ok) {
         await res.json();
         // find index in quizzes array
         const newQuizzes = quizzes.map(q => q.id === editingQuiz.id ? editingQuiz : q);
         setQuizzes(newQuizzes);
         navigate('/');
      } else {
        alert('ত্রুটি হয়েছে (Error saving quiz)');
      }
    } catch (e) {
      console.error(e);
      alert('ত্রুটি হয়েছে (Error saving quiz)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
      <div className="flex items-center justify-between mt-2">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-neutral-500 hover:text-black mb-2 flex items-center gap-1">
            <ArrowLeft size={16} /> ফিরে যান
          </button>
          <h1 className="text-2xl font-semibold tracking-tight">ক্যুইজ সম্পাদনা করুন: {editingQuiz.title}</h1>
          <p className="text-sm text-neutral-500 mt-1">ভুল প্রশ্ন বা অপশনগুলো এখান থেকে সংশোধন করুন।</p>
        </div>
        <button 
           onClick={handleSave} 
           disabled={saving || editingQuiz.questions.length === 0}
           className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span>সংরক্ষণ করুন</span>
        </button>
      </div>

      <div className="space-y-6">
        {editingQuiz.questions.map((q, qIndex) => (
          <div key={q.id} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm relative">
             <button 
                onClick={() => setQuestionToDelete(qIndex)}
                className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-md transition"
                title="প্রশ্ন মুছুন"
             >
                <Trash2 size={18} />
             </button>
             
             <div className="mb-4 pr-8">
                <label className="block text-sm font-medium text-neutral-700 mb-1">প্রশ্ন {qIndex + 1}</label>
                <textarea 
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 resize-y"
                  value={q.question}
                  onChange={(e) => updateQuestion(qIndex, { ...q, question: e.target.value })}
                  rows={2}
                />
             </div>

             <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">অপশন ও সঠিক উত্তর</label>
                {q.options.map((opt, oIndex) => (
                   <div key={oIndex} className="flex items-center space-x-3">
                     <input 
                       type="radio" 
                       name={`correct-${q.id}`} 
                       className="w-4 h-4 text-black focus:ring-black cursor-pointer"
                       checked={q.correctAnswerIndex === oIndex}
                       onChange={() => updateQuestion(qIndex, { ...q, correctAnswerIndex: oIndex })}
                       title="সঠিক উত্তর হিসেবে সেট করুন"
                     />
                     <input 
                       type="text" 
                       className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 ${
                          q.correctAnswerIndex === oIndex ? 'border-green-400 bg-green-50' : 'border-neutral-300'
                       }`}
                       value={opt}
                       onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                     />
                   </div>
                ))}
             </div>
          </div>
        ))}
      </div>

      <button 
         onClick={addQuestion}
         className="w-full py-4 border-2 border-dashed border-neutral-300 rounded-2xl text-neutral-500 font-medium hover:bg-neutral-50 hover:text-black hover:border-neutral-400 transition flex items-center justify-center space-x-2"
      >
         <Plus size={20} />
         <span>নতুন প্রশ্ন যুক্ত করুন</span>
      </button>      
      
      <PasskeyModal 
        isOpen={questionToDelete !== null}
        onClose={() => setQuestionToDelete(null)}
        onSubmit={removeQuestion}
      />
    </div>
  );
}
