import React, { useState } from 'react';
import { useData } from '../lib/hooks';
import { Topic } from '../types';
import { Folder, Plus, ChevronRight, Hash } from 'lucide-react';

export default function Topics() {
  const [topics, setTopics] = useData<Topic[]>('/api/topics', []);
  const [newTopicName, setNewTopicName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    
    const res = await fetch('/api/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newTopicName,
        parentId: selectedParentId || undefined
      })
    });
    
    if (res.ok) {
      const created = await res.json();
      setTopics([...topics, created]);
      setNewTopicName('');
      setSelectedParentId('');
    }
  };

  const topLevel = topics.filter(t => !t.parentId);
  
  const getChildren = (parentId: string) => topics.filter(t => t.parentId === parentId);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Topics structure</h1>
        <p className="text-neutral-500">Organize your quizzes logically by creating nested topic categories.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-neutral-200">
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 sm:items-end mb-8">
           <div className="flex-1 space-y-1 w-full sm:w-auto">
             <label className="text-sm font-medium text-neutral-700">Topic Name</label>
             <input 
               type="text" 
               className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5" 
               placeholder="e.g. Physics, Chapter 1, Kinematics..."
               value={newTopicName}
               onChange={e => setNewTopicName(e.target.value)}
             />
           </div>
           <div className="flex-1 space-y-1 w-full sm:w-auto">
             <label className="text-sm font-medium text-neutral-700">Parent Topic (Optional)</label>
             <select 
               className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
               value={selectedParentId}
               onChange={e => setSelectedParentId(e.target.value)}
             >
                <option value="">None (Top Level)</option>
                {topics.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
             </select>
           </div>
           <button type="submit" className="w-full sm:w-auto justify-center px-4 py-2 bg-black text-white rounded-lg flex items-center space-x-2 font-medium hover:bg-neutral-800 transition">
             <Plus size={18} />
             <span>Add Topic</span>
           </button>
        </form>

        <div className="space-y-4">
          <h2 className="text-lg font-medium border-b border-neutral-100 pb-2">Topic Hierarchy</h2>
          {topLevel.length === 0 && <p className="text-sm text-neutral-500">No topics created yet.</p>}
          <div className="space-y-2">
            {topLevel.map(topic => (
              <TopicItem key={topic.id} topic={topic} getChildren={getChildren} depth={0} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TopicItem({ topic, getChildren, depth }: { topic: Topic, getChildren: (id: string) => Topic[], depth: number }) {
  const children = getChildren(topic.id);
  
  return (
    <div className="space-y-2">
      <div 
        className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg border border-neutral-100" 
        style={{ marginLeft: `${depth * 24}px` }}
      >
        <Folder size={18} className="text-neutral-400" />
        <span className="font-medium">{topic.name}</span>
      </div>
      {children.map(child => (
        <TopicItem key={child.id} topic={child} getChildren={getChildren} depth={depth + 1} />
      ))}
    </div>
  );
}
