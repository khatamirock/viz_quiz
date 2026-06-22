import React, { useMemo } from 'react';
import { useData } from '../lib/hooks';
import { Quiz, QuizAttempt } from '../types';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, TrendingUp, Calendar, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function History() {
  const [attempts, , loadingAttempts, errorAttempts] = useData<QuizAttempt[]>('/api/progress', []);
  const [quizzes, , loadingQuizzes, errorQuizzes] = useData<Quiz[]>('/api/quizzes', []);

  const stats = useMemo(() => {
    if (!attempts.length) return { totalAttempts: 0, averageScore: 0, perfectScores: 0 };
    
    let totalScorePercentages = 0;
    let perfectScores = 0;

    attempts.forEach(a => {
      const percentage = (a.score / a.totalQuestions) * 100;
      totalScorePercentages += percentage;
      if (percentage === 100) perfectScores++;
    });

    return {
      totalAttempts: attempts.length,
      averageScore: Math.round(totalScorePercentages / attempts.length),
      perfectScores
    };
  }, [attempts]);

  const sortedAttempts = useMemo(() => {
    return [...attempts].sort((a, b) => b.date - a.date);
  }, [attempts]);

  const chartData = useMemo(() => {
    // Reverse for chronological order (oldest to newest)
    const chrono = [...sortedAttempts].reverse();
    return chrono.map((a, index) => {
      const p = Math.round((a.score / a.totalQuestions) * 100);
      const quiz = quizzes.find(q => q.id === a.quizId);
      const name = quiz ? quiz.title : 'অজানা ক্যুইজ';
      return {
        name: `অংশগ্রহণ ${index + 1}`,
        score: p,
        quizName: name,
        fullDate: new Date(a.date).toLocaleDateString('bn-BD', {
          month: 'short', day: 'numeric'
        })
      };
    });
  }, [sortedAttempts, quizzes]);

  if (loadingAttempts || loadingQuizzes) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  if (errorAttempts || errorQuizzes) {
    return (
       <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
          ডেটা লোড করতে সমস্যা হয়েছে।
       </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">ক্যুইজ ইতিহাস</h1>
          <p className="text-neutral-500 mt-1">আপনার পূর্ববর্তী ক্যুইজের ফলাফল এবং অগ্রগতি দেখুন।</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 justify-between p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col">
          <div className="flex items-center space-x-3 mb-2 text-neutral-600 dark:text-neutral-400">
            <Clock size={20} />
            <span className="font-medium">মোট অংশগ্রহণ</span>
          </div>
          <div className="text-3xl font-bold text-black dark:text-white">{stats.totalAttempts}</div>
        </div>
        
        <div className="bg-white dark:bg-neutral-900 justify-between p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col">
          <div className="flex items-center space-x-3 mb-2 text-neutral-600 dark:text-neutral-400">
            <TrendingUp size={20} />
            <span className="font-medium">গড় নম্বর</span>
          </div>
          <div className="text-3xl font-bold text-black dark:text-white">{stats.averageScore}%</div>
        </div>

        <div className="bg-white dark:bg-neutral-900 justify-between p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col">
          <div className="flex items-center space-x-3 mb-2 text-neutral-600 dark:text-neutral-400">
            <CheckCircle2 size={20} />
            <span className="font-medium">শতভাগ সঠিক</span>
          </div>
          <div className="text-3xl font-bold text-black dark:text-white">{stats.perfectScores}</div>
        </div>
      </div>

      {sortedAttempts.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-dashed mt-8">
           <div className="flex justify-center mb-4"><Activity size={48} className="text-neutral-300 dark:text-neutral-700" /></div>
           <p className="text-neutral-500 mb-6">আপনি এখনও কোনো ক্যুইজে অংশগ্রহণ করেননি।</p>
           <Link to="/" className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition">
             ড্যাশবোর্ডে ফিরে যান
           </Link>
        </div>
      ) : (
        <>
          {chartData.length > 1 && (
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm mt-8">
              <h3 className="text-lg font-medium mb-6 flex items-center space-x-2">
                <Activity size={20} className="text-neutral-500 dark:text-neutral-400" />
                <span>অগ্রগতি চার্ট</span>
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#525252" opacity={0.2} />
                    <XAxis dataKey="fullDate" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => [`${value}%`, 'নম্বর']}
                      labelFormatter={(label, payload) => payload[0]?.payload.quizName || label}
                    />
                    <Area type="monotone" dataKey="score" stroke="#8884d8" fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden mt-8">
            <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
               <h3 className="font-medium text-lg tracking-tight">সব অংশগ্রহণ</h3>
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800 text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-50/30 dark:bg-neutral-900/30">
                    <th className="px-6 py-4 font-medium">ক্যুইজ</th>
                    <th className="px-6 py-4 font-medium">তারিখ</th>
                    <th className="px-6 py-4 font-medium">নম্বর</th>
                    <th className="px-6 py-4 font-medium text-right">শতকরা হার</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {sortedAttempts.map((attempt) => {
                    const quiz = quizzes.find(q => q.id === attempt.quizId);
                    const quizName = quiz ? quiz.title : 'অজানা ক্যুইজ';
                    const date = new Date(attempt.date).toLocaleString('bn-BD', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    });
                    const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
                    
                    let percentageColor = "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20";
                    if (percentage >= 80) percentageColor = "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
                    if (percentage < 50) percentageColor = "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";

                    return (
                      <tr key={attempt.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{quizName}</div>
                          {!quiz && <div className="text-xs text-neutral-400 mt-1">এই ক্যুইজটি মুছে ফেলা হয়েছে</div>}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                          <div className="flex items-center space-x-2">
                            <Calendar size={14} className="text-neutral-400" />
                            <span>{date}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-neutral-700 dark:text-neutral-300">
                          {attempt.score} <span className="text-neutral-400 mx-1">/</span> {attempt.totalQuestions}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className={`inline-flex items-center px-2.5 py-1 rounded-lg font-bold text-sm border border-transparent ${percentageColor}`}>
                            {percentage}%
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="block md:hidden divide-y divide-neutral-100 dark:divide-neutral-800">
              {sortedAttempts.map((attempt) => {
                const quiz = quizzes.find(q => q.id === attempt.quizId);
                const quizName = quiz ? quiz.title : 'অজানা ক্যুইজ';
                const date = new Date(attempt.date).toLocaleString('bn-BD', {
                  year: 'numeric', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                });
                const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
                
                let percentageColor = "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900/50";
                if (percentage >= 80) percentageColor = "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50";
                if (percentage < 50) percentageColor = "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50";

                return (
                  <div key={attempt.id} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{quizName}</div>
                        {!quiz && <div className="text-xs text-neutral-400 mt-1">মুছে ফেলা হয়েছে</div>}
                      </div>
                      <div className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-bold ${percentageColor}`}>
                        {percentage}%
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm text-neutral-500 dark:text-neutral-400">
                      <div className="flex items-center space-x-1.5">
                        <Calendar size={12} />
                        <span>{date}</span>
                      </div>
                      <div className="font-medium text-neutral-700 dark:text-neutral-300">
                        {attempt.score} / {attempt.totalQuestions}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
