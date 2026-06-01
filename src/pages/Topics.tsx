import React, { useState } from 'react';
import { useData } from '../lib/hooks';
import { Topic, Quiz } from '../types';
import { Folder, Plus, Trash2, Edit2, Check, X, Play, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Topics() {
  const [topics, setTopics] = useData<Topic[]>('/api/topics', []);
  const [quizzes, setQuizzes] = useData<Quiz[]>('/api/quizzes', []); // To check if topic has quizzes
  const [newTopicName, setNewTopicName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    setError(null);
    
    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTopicName,
          parentId: selectedParentId || undefined
        })
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create topic');
      }

      const created = await res.json();
      setTopics([...topics, created]);
      setNewTopicName('');
      setSelectedParentId('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdate = async (id: string, newName: string) => {
    try {
      const res = await fetch(`/api/topics/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      if (res.ok) {
        setTopics(topics.map(t => t.id === id ? { ...t, name: newName } : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    const passkey = import.meta.env.VITE_DELETE_PASSKEY || '1234';
    const input = window.prompt("মুছে ফেলার জন্য পাস-কী দিন:");
    if (input !== passkey) {
      alert("ভুল পাস-কী!");
      return;
    }
    
    try {
      const res = await fetch(`/api/topics/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const fetchRes = await fetch('/api/topics');
        if (fetchRes.ok) {
          const freshTopics = await fetchRes.json();
          setTopics(freshTopics);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    const passkey = import.meta.env.VITE_DELETE_PASSKEY || '1234';
    const input = window.prompt("মুছে ফেলার জন্য পাস-কী দিন:");
    if (input !== passkey) {
      alert("ভুল পাস-কী!");
      return;
    }
    
    try {
      const res = await fetch(`/api/quizzes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setQuizzes(quizzes.filter(q => q.id !== id));
      }
    } catch(err) {
      console.error(err);
    }
  };

  const topLevel = topics.filter(t => !t.parentId);
  const getChildren = (parentId: string) => topics.filter(t => t.parentId === parentId);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">বিষয়সমূহের গঠন</h1>
        <p className="text-neutral-500">নেস্টেড বিষয়ের ক্যাটাগরি তৈরি করে আপনার ক্যুইজগুলো যৌক্তিকভাবে সাজান। আপনি এগুলোর নাম পরিবর্তন বা মুছে ফেলার কাজও করতে পারেন।</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-neutral-200">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 sm:items-end mb-8">
           <div className="flex-1 space-y-1 w-full sm:w-auto">
             <label className="text-sm font-medium text-neutral-700">বিষয়ের নাম</label>
             <input 
               type="text" 
               className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5" 
               placeholder="যেমন: পদার্থবিজ্ঞান, অধ্যায় ১, গতিবিদ্যা..."
               value={newTopicName}
               onChange={e => setNewTopicName(e.target.value)}
             />
           </div>
           <div className="flex-1 space-y-1 w-full sm:w-auto">
             <label className="text-sm font-medium text-neutral-700">পেরেন্ট বিষয় (ঐচ্ছিক)</label>
             <select 
               className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
               value={selectedParentId}
               onChange={e => setSelectedParentId(e.target.value)}
             >
                <option value="">কোনোটি না (শীর্ষ স্তর)</option>
                {topics.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
             </select>
           </div>
           <button type="submit" className="w-full sm:w-auto justify-center px-4 py-2 bg-black text-white rounded-lg flex items-center space-x-2 font-medium hover:bg-neutral-800 transition">
             <Plus size={18} />
             <span>বিষয় যুক্ত করুন</span>
           </button>
        </form>

        <div className="space-y-4">
          <h2 className="text-lg font-medium border-b border-neutral-100 pb-2">বিষয়ের স্তর</h2>
          {topLevel.length === 0 && <p className="text-sm text-neutral-500">এখনও কোনো বিষয় তৈরি করা হয়নি।</p>}
          <div className="space-y-2">
            {topLevel.map(topic => (
              <TopicItem 
                key={topic.id} 
                topic={topic}
                quizzes={quizzes}
                getChildren={getChildren} 
                depth={0} 
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                onDeleteQuiz={handleDeleteQuiz}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TopicItem({ 
  topic,
  quizzes,
  getChildren, 
  depth,
  onDelete,
  onUpdate,
  onDeleteQuiz
}: { 
  topic: Topic,
  quizzes: Quiz[],
  getChildren: (id: string) => Topic[], 
  depth: number,
  onDelete: (id: string) => void,
  onUpdate: (id: string, name: string) => void,
  onDeleteQuiz: (id: string) => void
}) {
  const children = getChildren(topic.id);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(topic.name);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleSave = () => {
    if (editName.trim() && editName !== topic.name) {
      onUpdate(topic.id, editName.trim());
    } else {
      setEditName(topic.name);
    }
    setIsEditing(false);
  };

  const [showConfirm, setShowConfirm] = useState(false);
  const topicQuizzes = quizzes.filter(q => q.topicId === topic.id);
  const hasContent = children.length > 0 || topicQuizzes.length > 0;

  return (
    <div className="space-y-2">
      <div 
        className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg border border-neutral-100 group" 
        style={{ marginLeft: `${depth * 24}px` }}
      >
        <button 
          onClick={() => hasContent && setIsExpanded(!isExpanded)}
          className={`p-1 -ml-1 rounded flex items-center justify-center shrink-0 w-6 h-6 ${hasContent ? 'hover:bg-neutral-200 text-neutral-600' : 'text-transparent cursor-default'}`}
        >
          {hasContent && (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
        </button>
        <Folder size={18} className="text-neutral-400 shrink-0" />
        {isEditing ? (
          <div className="flex items-center space-x-2 flex-1">
            <input
              type="text"
              autoFocus
              className="flex-1 px-2 py-1 text-sm border border-neutral-300 rounded focus:outline-none"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') {
                  setEditName(topic.name);
                  setIsEditing(false);
                }
              }}
            />
            <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={16} /></button>
            <button onClick={() => {
              setEditName(topic.name);
              setIsEditing(false);
            }} className="p-1 text-red-600 hover:bg-red-50 rounded"><X size={16} /></button>
          </div>
        ) : showConfirm ? (
          <div className="flex items-center space-x-2 flex-1 text-sm text-red-600 font-medium">
             <span className="flex-1">বিষয় এবং ক্যুইজ মুছবেন?</span>
             <button onClick={() => onDelete(topic.id)} className="px-2 py-1 bg-red-100 hover:bg-red-200 rounded">হ্যাঁ</button>
             <button onClick={() => setShowConfirm(false)} className="px-2 py-1 bg-neutral-200 hover:bg-neutral-300 rounded text-neutral-800">না</button>
          </div>
        ) : (
          <>
            <div className="flex-1 flex items-center space-x-2">
               <span className="font-medium cursor-pointer" onClick={() => hasContent && setIsExpanded(!isExpanded)}>{topic.name}</span>
               {topicQuizzes.length > 0 && (
                 <span className="text-xs px-2 py-0.5 bg-neutral-200 text-neutral-600 rounded-full">
                   {topicQuizzes.length} ক্যুইজ
                 </span>
               )}
            </div>
            <div className="opacity-100 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex space-x-2">
              <button 
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-200 rounded-md"
              >
                <Edit2 size={14} />
              </button>
              <button 
                onClick={() => setShowConfirm(true)}
                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </>
        )}
      </div>
      
      {isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-2">
          {topicQuizzes.map(quiz => (
            <div 
               key={`quiz-${quiz.id}`}
               className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-neutral-100 group"
               style={{ marginLeft: `${(depth + 1) * 24}px` }}
            >
              <div className="w-6 shrink-0 flex items-center justify-center">
                 <FileText size={16} className="text-blue-400" />
              </div>
              <div className="flex-1">
                 <div className="font-medium text-sm">{quiz.title}</div>
                 <div className="text-xs text-neutral-500">{quiz.questions.length}টি প্রশ্ন</div>
              </div>
              <div className="flex space-x-2">
                 <button
                    onClick={() => onDeleteQuiz(quiz.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-neutral-100 rounded-md"
                    title="ক্যুইজ মুছুন"
                 >
                    <Trash2 size={14} />
                 </button>
                 <Link
                     to={`/edit-quiz/${quiz.id}`}
                     className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-md flex items-center space-x-1 text-xs font-medium"
                     title="সম্পাদনা করুন"
                   >
                     <Edit2 size={14} />
                     <span className="hidden sm:inline">সম্পাদনা</span>
                 </Link>
                 <Link
                     to={`/quiz/${quiz.id}`}
                     className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md flex items-center space-x-1 text-xs font-medium"
                     title="ক্যুইজ শুরু করুন"
                   >
                     <Play size={14} fill="currentColor" />
                     <span className="hidden sm:inline">শুরু করুন</span>
                 </Link>
              </div>
            </div>
          ))}
          {children.map(child => (
            <TopicItem 
              key={child.id} 
              topic={child}
              quizzes={quizzes}
              getChildren={getChildren} 
              depth={depth + 1} 
              onDelete={onDelete}
              onUpdate={onUpdate}
              onDeleteQuiz={onDeleteQuiz}
            />
          ))}
        </div>
      )}
    </div>
  );
}
