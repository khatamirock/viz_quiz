import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Topics from './pages/Topics';
import CreateQuiz from './pages/CreateQuiz';
import TakeQuiz from './pages/TakeQuiz';
import Settings from './pages/Settings';

import EditQuiz from './pages/EditQuiz';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/create" element={<CreateQuiz />} />
          <Route path="/quiz/:quizId" element={<TakeQuiz />} />
          <Route path="/edit-quiz/:quizId" element={<EditQuiz />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
