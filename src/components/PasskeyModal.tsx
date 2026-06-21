import React, { useState } from 'react';

interface PasskeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (passkey: string) => void;
  title?: string;
}

export default function PasskeyModal({ isOpen, onClose, onSubmit, title = "পাস-কী দিন" }: PasskeyModalProps) {
  const [passkey, setPasskey] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(passkey);
    setPasskey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-semibold mb-2 text-center">{title}</h3>
        <p className="text-sm text-neutral-500 mb-6 text-center">এই কাজটি করার জন্য আপনাকে পাস-কী দিতে হবে।</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            autoFocus
            className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 bg-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            placeholder="পাস-কী..."
            value={passkey}
            onChange={(e) => setPasskey(e.target.value)}
          />
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-xl font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition"
            >
              নিশ্চিত করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
