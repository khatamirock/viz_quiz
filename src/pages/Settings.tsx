import React, { useState, useEffect } from 'react';
import { DownloadCloud, CheckCircle2, Loader2 } from 'lucide-react';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isDownloadingOffline, setIsDownloadingOffline] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    setApiKey(savedKey);
  }, []);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
    } else {
      localStorage.removeItem('gemini_api_key');
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleDownloadOfflineData = async () => {
    setIsDownloadingOffline(true);
    setOfflineStatus('idle');
    try {
      // Fetch topics and quizzes simultaneously
      const [topicsRes, quizzesRes, progressRes] = await Promise.all([
        fetch('/api/topics'),
        fetch('/api/quizzes'),
        fetch('/api/progress')
      ]);

      if (!topicsRes.ok || !quizzesRes.ok || !progressRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const topics = await topicsRes.json();
      const quizzes = await quizzesRes.json();
      const progress = await progressRes.json();

      // Ensure cache logic from hooks.ts is fed manually
      localStorage.setItem(`cache_/api/topics`, JSON.stringify(topics));
      localStorage.setItem(`cache_/api/quizzes`, JSON.stringify(quizzes));
      localStorage.setItem(`cache_/api/progress`, JSON.stringify(progress));

      setOfflineStatus('success');
      setTimeout(() => setOfflineStatus('idle'), 3000);
    } catch(err) {
      console.error("Offline download failed", err);
      setOfflineStatus('error');
    } finally {
      setIsDownloadingOffline(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">সেটিংস</h1>
        <p className="text-neutral-500">অ্যাপ্লিকেশনের পছন্দসমূহ এবং এপিআই কি কনফিগার করুন।</p>
      </div>

      <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
        <div className="space-y-4">
          <label className="block text-lg font-medium text-neutral-900 dark:text-neutral-100">জেমিনি এপিআই কি</label>
          <div className="flex space-x-2">
            <input
              type="password"
              className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-700 bg-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
              placeholder="আপনার জেমিনি এপিআই কি দিন..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 font-medium transition"
            >
              {isSaved ? 'সংরক্ষিত!' : 'সংরক্ষণ করুন'}
            </button>
          </div>
          <p className="text-sm text-neutral-500 mt-2">
            আপনার জেমিনি এপিআই কি সংগ্রহ করুন <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">গুগল এআই স্টুডিও</a> থেকে।
          </p>
          <p className="text-sm text-neutral-500">
            যদি খালি রাখা হয়, তবে সার্ভারের ডিফল্ট এনভায়রনমেন্ট কি ব্যবহৃত হবে। এখানে কি দিলে তা আপনার বর্তমান সেশনের ডিফল্টটিকে ওভাররাইড করবে।
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                <DownloadCloud size={20} />
             </div>
             <div>
                <label className="block text-lg font-medium text-neutral-900 dark:text-neutral-100">অফলাইন ক্যুইজ এক্সেস</label>
                <p className="text-sm text-neutral-500 mt-1">সব ক্যুইজ এবং বিষয় ডাউনলোড করে রাখুন। অফলাইনে ইন্টারনেট ছাড়া ক্যুইজ অনুশীলন করুন।</p>
             </div>
          </div>
          
          <div className="pt-2">
            <button
              onClick={handleDownloadOfflineData}
              disabled={isDownloadingOffline}
              className="flex items-center space-x-2 px-6 py-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl font-medium transition disabled:opacity-50"
            >
              {isDownloadingOffline ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>ডাউনলোড হচ্ছে...</span>
                </>
              ) : offlineStatus === 'success' ? (
                <>
                  <CheckCircle2 size={18} className="text-green-500" />
                  <span>ডাউনলোড সফল হয়েছে!</span>
                </>
              ) : (
                <>
                  <DownloadCloud size={18} />
                  <span>অফলাইনের জন্য ডাউনলোড করুন</span>
                </>
              )}
            </button>
            {offlineStatus === 'error' && (
              <p className="text-red-500 text-sm mt-3">ডাউনলোডে সমস্যা হয়েছে, আবার চেষ্টা করুন।</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
