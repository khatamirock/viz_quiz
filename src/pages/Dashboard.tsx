import React, { useState } from 'react';
import { useData } from '../lib/hooks';
import { Topic, Quiz, QuizAttempt } from '../types';
import { Link } from 'react-router-dom';
import { Folder, Play, CheckCircle, BarChart2, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const [quizzes, setQuizzes] = useData<Quiz[]>('/api/quizzes', []);
  const [attempts] = useData<QuizAttempt[]>('/api/progress', []);
  const [topics] = useData<Topic[]>('/api/topics', []);

  const totalTaken = attempts.length;
  const avgScore = attempts.length > 0 
    ? Math.round(attempts.reduce((acc, att) => acc + (att.score / att.totalQuestions), 0) / attempts.length * 100) 
    : 0;

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setQuizzes(quizzes.filter(q => q.id !== quizId));
      }
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Dashboard</h1>
        <p className="text-neutral-500">Welcome back. Track your quiz performance and start learning.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-4 text-neutral-600">
            <CheckCircle size={20} />
            <span className="font-medium">Quizzes Completed</span>
          </div>
          <span className="text-4xl font-semibold">{totalTaken}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-4 text-neutral-600">
            <BarChart2 size={20} />
            <span className="font-medium">Average Score</span>
          </div>
          <span className="text-4xl font-semibold">{avgScore}%</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-4 text-neutral-600">
            <Folder size={20} />
            <span className="font-medium">Total Topics</span>
          </div>
          <span className="text-4xl font-semibold">{topics.length}</span>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-4">Recent Quizzes</h2>
        {quizzes.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-2xl border border-neutral-200 border-dashed">
             <p className="text-neutral-500 mb-4">No quizzes created yet.</p>
             <Link to="/create" className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 transition">
               Create your first quiz
             </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {[...quizzes].reverse().map(quiz => (
               <QuizCard key={quiz.id} quiz={quiz} topics={topics} onDelete={() => handleDeleteQuiz(quiz.id)} />
             ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuizCard({ quiz, topics, onDelete }: { quiz: Quiz, topics: Topic[], onDelete: () => void }) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col group">
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-medium text-lg">{quiz.title}</h3>
        {showConfirm ? (
          <div className="flex space-x-1 text-sm bg-red-50 p-1 rounded">
             <button onClick={onDelete} className="text-red-600 font-medium hover:underline">Yes</button>
             <span className="text-red-400">/</span>
             <button onClick={() => setShowConfirm(false)} className="text-neutral-500 hover:underline">No</button>
          </div>
        ) : (
          <button 
            onClick={() => setShowConfirm(true)}
            className="text-neutral-400 hover:text-red-500 p-1 rounded-md opacity-100 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            title="Delete Quiz"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      <p className="text-sm text-neutral-500 mb-4 flex-1">
        {quiz.questions.length} questions • Topic: {topics.find(t => t.id === quiz.topicId)?.name || 'Unknown'}
      </p>
      <Link to={`/quiz/${quiz.id}`} className="inline-flex items-center space-x-2 text-sm font-medium text-black hover:opacity-70 transition">
        <Play size={16} />
        <span>Start Quiz</span>
      </Link>
    </div>
  );
}
