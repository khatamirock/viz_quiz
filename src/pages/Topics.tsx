import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../lib/hooks';
import { Topic, Quiz } from '../types';
import { Folder, Plus, Trash2, Edit2, Check, X, Play, ChevronDown, ChevronRight, FileText, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import PasskeyModal from '../components/PasskeyModal';

export default function Topics() {
  const [topics, setTopics] = useData<Topic[]>('/api/topics', []);
  const [quizzes, setQuizzes] = useData<Quiz[]>('/api/quizzes', []); // To check if topic has quizzes
  const [newTopicName, setNewTopicName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [topicToDelete, setTopicToDelete] = useState<string | null>(null);
  const [topicToUpdate, setTopicToUpdate] = useState<{id: string, name: string} | null>(null);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    setError(null);
    
    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTopicName
        })
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create topic');
      }

      const created = await res.json();
      setTopics([...topics, created]);
      setNewTopicName('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdate = async (passkey: string) => {
    if (!topicToUpdate) return;
    const correctPasskey = import.meta.env.VITE_DELETE_PASSKEY || '1234';
    if (passkey !== correctPasskey) {
      alert("ভুল পাস-কী!");
      return;
    }

    try {
      const res = await fetch(`/api/topics/${topicToUpdate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: topicToUpdate.name })
      });
      if (res.ok) {
        setTopics(topics.map(t => t.id === topicToUpdate.id ? { ...t, name: topicToUpdate.name } : t));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTopicToUpdate(null);
    }
  };

  const handleDelete = async (passkey: string) => {
    if (!topicToDelete) return;
    const correctPasskey = import.meta.env.VITE_DELETE_PASSKEY || '1234';
    if (passkey !== correctPasskey) {
      alert("ভুল পাস-কী!");
      return;
    }
    
    try {
      const res = await fetch(`/api/topics/${topicToDelete}`, {
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
    } finally {
      setTopicToDelete(null);
    }
  };

  const handleDeleteQuiz = async (passkey: string) => {
    if (!quizToDelete) return;
    const correctPasskey = import.meta.env.VITE_DELETE_PASSKEY || '1234';
    if (passkey !== correctPasskey) {
      alert("ভুল পাস-কী!");
      return;
    }
    
    try {
      const res = await fetch(`/api/quizzes/${quizToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        setQuizzes(quizzes.filter(q => q.id !== quizToDelete));
      }
    } catch(err) {
      console.error(err);
    } finally {
      setQuizToDelete(null);
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

      <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 sm:items-end mb-8">
           <div className="flex-1 space-y-1 w-full sm:w-auto">
             <label className="text-sm font-medium text-neutral-700">নতুন বিষয়ের নাম</label>
             <input 
               type="text" 
               className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5" 
               placeholder="যেমন: শীর্ষ স্তরের বিষয়..."
               value={newTopicName}
               onChange={e => setNewTopicName(e.target.value)}
             />
           </div>
           
           <button type="submit" className="w-full sm:w-auto justify-center px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg flex items-center space-x-2 font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition">
             <Plus size={18} />
             <span>নতুন বিষয় যুক্ত করুন</span>
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
                onDelete={(id) => setTopicToDelete(id)}
                onUpdate={(id, name) => setTopicToUpdate({id, name})}
                onDeleteQuiz={(id) => setQuizToDelete(id)}
                onCreateSubtopic={async (parentId, name) => {
                  try {
                    const res = await fetch('/api/topics', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name, parentId })
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
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <PasskeyModal 
         isOpen={!!topicToDelete}
         onClose={() => setTopicToDelete(null)}
         onSubmit={handleDelete}
         title="বিষয় মুছুন"
      />
      <PasskeyModal 
         isOpen={!!topicToUpdate}
         onClose={() => setTopicToUpdate(null)}
         onSubmit={handleUpdate}
         title="বিষয় সম্পাদনা করুন"
      />
      <PasskeyModal 
         isOpen={!!quizToDelete}
         onClose={() => setQuizToDelete(null)}
         onSubmit={handleDeleteQuiz}
         title="ক্যুইজ মুছুন"
      />
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
  onDeleteQuiz,
  onCreateSubtopic
}: { 
  topic: Topic,
  quizzes: Quiz[],
  getChildren: (id: string) => Topic[], 
  depth: number,
  onDelete: (id: string) => void,
  onUpdate: (id: string, name: string) => void,
  onDeleteQuiz: (id: string) => void,
  onCreateSubtopic: (parentId: string, name: string) => void
}) {
  const children = getChildren(topic.id);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(topic.name);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddingSubtopic, setIsAddingSubtopic] = useState(false);
  const [newSubtopicName, setNewSubtopicName] = useState('');
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);
  
  const handleSave = () => {
    if (editName.trim() && editName !== topic.name) {
      onUpdate(topic.id, editName.trim());
    } else {
      setEditName(topic.name);
    }
    setIsEditing(false);
  };

  const topicQuizzes = quizzes.filter(q => q.topicId === topic.id);
  const hasContent = children.length > 0 || topicQuizzes.length > 0;

  return (
    <div className="space-y-2">
      <div 
        className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-800 group" 
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
        ) : (
          <>
            <div className="flex-1 flex items-center space-x-2">
               <span className="font-medium cursor-pointer" onClick={() => hasContent && setIsExpanded(!isExpanded)}>{topic.name}</span>
               {topicQuizzes.length > 0 && (
                 <span className="text-xs px-2 py-0.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-full">
                   {topicQuizzes.length} ক্যুইজ
                 </span>
               )}
            </div>
            
            <div className={`relative ${isMenuOpen ? 'opacity-100' : 'opacity-100 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100'} transition-opacity flex items-center`} ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-1.5 rounded-md transition ${isMenuOpen ? 'bg-neutral-200 dark:bg-neutral-700 text-black dark:text-white' : 'text-neutral-500 hover:text-black hover:bg-neutral-200 dark:hover:text-white dark:hover:bg-neutral-700'}`}
              >
                <MoreHorizontal size={16} />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-100 dark:border-neutral-700 py-1 z-10 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-700 mb-1">
                    অ্যাকশন
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsAddingSubtopic(true);
                      setIsExpanded(true); // make sure subtopics are visibly expanded
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center space-x-2"
                  >
                    <Plus size={14} />
                    <span>সাবটপিক যুক্ত করুন</span>
                  </button>
                  
                  <Link
                    to={`/create?topicId=${topic.id}`}
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center space-x-2"
                  >
                    <FileText size={14} />
                    <span>ক্যুইজ তৈরি করুন</span>
                  </Link>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsEditing(true);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center space-x-2"
                  >
                    <Edit2 size={14} />
                    <span>নাম পরিবর্তন করুন</span>
                  </button>

                  <div className="my-1 border-t border-neutral-100 dark:border-neutral-700"></div>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDelete(topic.id);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center space-x-2"
                  >
                    <Trash2 size={14} />
                    <span>মুছুন</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-2">
          {isAddingSubtopic && (
            <div 
              className="flex items-center space-x-3 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30"
              style={{ marginLeft: `${(depth + 1) * 24}px` }}
            >
              <div className="w-6 shrink-0 flex justify-center"><Folder size={18} className="text-blue-300 dark:text-blue-700" /></div>
              <input
                type="text"
                autoFocus
                placeholder="সাবটপিকের নাম..."
                className="flex-1 px-2 py-1 text-sm border border-blue-200 dark:border-blue-800 bg-white dark:bg-neutral-900 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newSubtopicName}
                onChange={e => setNewSubtopicName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (newSubtopicName.trim()) {
                      onCreateSubtopic(topic.id, newSubtopicName.trim());
                      setNewSubtopicName('');
                      setIsAddingSubtopic(false);
                    }
                  }
                  if (e.key === 'Escape') {
                    setIsAddingSubtopic(false);
                    setNewSubtopicName('');
                  }
                }}
              />
              <button 
                onClick={() => {
                  if (newSubtopicName.trim()) {
                    onCreateSubtopic(topic.id, newSubtopicName.trim());
                    setNewSubtopicName('');
                    setIsAddingSubtopic(false);
                  }
                }}
                className="p-1 px-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm"
              >
                যুক্ত করুন
              </button>
              <button 
                onClick={() => {
                  setIsAddingSubtopic(false);
                  setNewSubtopicName('');
                }}
                className="p-1 text-neutral-500 hover:text-black dark:hover:text-white rounded"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {topicQuizzes.map(quiz => (
            <div 
               key={`quiz-${quiz.id}`}
               className="flex items-center space-x-3 p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 group"
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
              onCreateSubtopic={onCreateSubtopic}
            />
          ))}
        </div>
      )}
    </div>
  );
}
