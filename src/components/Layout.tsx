import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { BookOpen, FolderOpen, LayoutDashboard, BrainCircuit, Upload, Play, CheckCircle, Settings as SettingsIcon, Moon, Sun } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const navItems = [
    { name: 'ড্যাশবোর্ড', path: '/', icon: LayoutDashboard },
    { name: 'বিষয়সমূহ', path: '/topics', icon: FolderOpen },
    { name: 'ক্যুইজ তৈরি', path: '/create', icon: Upload },
    { name: 'সেটিংস', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans">
      <aside className="w-full md:w-64 bg-white dark:bg-neutral-900 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 flex flex-col shrink-0 transition-colors">
        <div className="p-4 md:p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-xl transition-colors">
              <BrainCircuit size={24} />
            </div>
            <span className="font-semibold text-lg tracking-tight">VisionQuiz</span>
          </div>
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-2 text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
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
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white font-medium' 
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-black dark:text-white' : 'text-neutral-500 dark:text-neutral-400'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto bg-neutral-50 dark:bg-neutral-950 transition-colors">
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
