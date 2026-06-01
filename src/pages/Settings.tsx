import React, { useState, useEffect } from 'react';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">সেটিংস</h1>
        <p className="text-neutral-500">অ্যাপ্লিকেশনের পছন্দসমূহ এবং এপিআই কি কনফিগার করুন।</p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700">জেমিনি এপিআই কি</label>
          <div className="flex space-x-2">
            <input
              type="password"
              className="flex-1 px-4 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
              placeholder="আপনার জেমিনি এপিআই কি দিন..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-black text-white rounded-xl hover:bg-neutral-800 font-medium transition"
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
    </div>
  );
}
