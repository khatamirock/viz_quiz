import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { BookOpen, FolderOpen, LayoutDashboard, BrainCircuit, Upload, Play, CheckCircle, Settings as SettingsIcon } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const navItems = [
    { name: 'ড্যাশবোর্ড', path: '/', icon: LayoutDashboard },
    { name: 'বিষয়সমূহ', path: '/topics', icon: FolderOpen },
    { name: 'ক্যুইজ তৈরি', path: '/create', icon: Upload },
    { name: 'সেটিংস', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-neutral-50 text-neutral-900 font-sans">
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-neutral-200 flex flex-col shrink-0">
        <div className="p-4 md:p-6 border-b border-neutral-100 flex items-center space-x-3">
          <div className="p-2 bg-black text-white rounded-xl">
            <BrainCircuit size={24} />
          </div>
          <span className="font-semibold text-lg tracking-tight">VisionQuiz</span>
        </div>
        
        <nav className="flex md:flex-col overflow-x-auto p-2 md:p-4 space-x-2 md:space-x-0 md:space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 md:space-x-3 px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap ${
                  isActive 
                    ? 'bg-neutral-100 text-black font-medium' 
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-black'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-black' : 'text-neutral-500'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto bg-neutral-50">
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
