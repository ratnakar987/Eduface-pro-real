
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getCurrentSchool, setCurrentSchool } from '../db';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const school = getCurrentSchool();

  const handleLogout = () => {
    setCurrentSchool(null);
    window.location.reload();
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/classes', label: 'Classes', icon: '🏫' },
    { path: '/registration', label: 'Registration', icon: '📝' },
    { path: '/attendance', label: 'AI Attendance', icon: '📸' },
    { path: '/fees', label: 'Fees & Billing', icon: '💰' },
    { path: '/reports', label: 'Reports', icon: '📈' },
    { path: '/assistant', label: 'AI Assistant', icon: '🤖' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 relative">
      {/* Sidebar - Desktop Only */}
      <nav className="hidden md:flex md:flex-col md:w-64 bg-slate-900 text-white flex-shrink-0">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-indigo-400">EduFace Pro</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">School Management</p>
        </div>
        <div className="mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-6 py-4 transition-colors ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Home Button & Menu */}
      <div className="md:hidden">
        {/* Floating Home Button */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl border-4 border-white flex items-center justify-center text-3xl active:scale-90 transition-transform"
        >
          {isMobileMenuOpen ? '✕' : '🏠'}
        </button>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[55] bg-slate-900/95 backdrop-blur-md p-8 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-10 duration-300">
            <div className="grid grid-cols-2 gap-4">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl transition-all ${
                      isActive ? 'bg-indigo-600 text-white scale-105 shadow-xl shadow-indigo-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span className="text-3xl mb-2">{item.icon}</span>
                    <span className="text-sm font-bold text-center">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-12 text-center">
              <h1 className="text-2xl font-bold text-indigo-400">EduFace Pro</h1>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Mobile Navigation Hub</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
        <header className="bg-white border-b px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <h1 className="md:hidden text-xl font-bold text-indigo-600">EduFace</h1>
            <h2 className="text-lg md:text-xl font-semibold text-slate-800 border-l-2 md:border-l-0 border-slate-200 pl-3 md:pl-0">
              {navItems.find(n => n.path === location.pathname)?.label || 'Page'}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">School</span>
              <span className="text-sm font-bold text-slate-800">{school?.schoolName}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors group"
              title="Logout"
            >
              <span className="text-xl group-hover:scale-110 transition-transform inline-block">🚪</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              {school?.schoolName.charAt(0)}
            </div>
          </div>
        </header>
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
