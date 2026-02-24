
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ClassManagement from './pages/ClassManagement';
import StudentRegistration from './pages/StudentRegistration';
import AttendanceScanner from './pages/AttendanceScanner';
import FeeBilling from './pages/FeeBilling';
import Reports from './pages/Reports';
import AiAssistant from './pages/AiAssistant';
import Auth from './pages/Auth';
import { getCurrentSchool } from './db';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const school = getCurrentSchool();
    setIsLoggedIn(!!school);
  }, []);

  if (isLoggedIn === null) return null;

  if (!isLoggedIn) {
    return (
      <Router>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/classes" element={<ClassManagement />} />
          <Route path="/registration" element={<StudentRegistration />} />
          <Route path="/attendance" element={<AttendanceScanner />} />
          <Route path="/fees" element={<FeeBilling />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/assistant" element={<AiAssistant />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
