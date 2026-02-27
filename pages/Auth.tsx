
import React, { useState, useEffect } from 'react';
import { getDB, registerSchool, setCurrentSchool } from '../db';
import { School } from '../types';
import { db as fsDb, isUsingFirebase } from '../firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [schoolName, setSchoolName] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [userName, setUserName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (isUsingFirebase() && fsDb) {
        // Firebase Logic
        const schoolsRef = collection(fsDb, 'schools');
        if (isLogin) {
          const q = query(schoolsRef, where("userName", "==", userName), where("password", "==", password));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const schoolData = querySnapshot.docs[0].data() as School;
            const school = { ...schoolData, id: querySnapshot.docs[0].id };
            setCurrentSchool(school);
            window.location.reload();
          } else {
            setError('Invalid User ID or password');
          }
        } else {
          const q = query(schoolsRef, where("userName", "==", userName));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            setError('User ID already registered');
            setIsLoading(false);
            return;
          }

          const newSchool = {
            schoolName,
            schoolAddress,
            userName,
            mobileNumber,
            email,
            password,
            createdAt: new Date().toISOString()
          };

          const docRef = await addDoc(schoolsRef, newSchool);
          setSuccessMessage('Registration successful! Please sign in with your User ID.');
          setIsLogin(true);
          setPassword(''); // Clear password for security
        }
      } else {
        // LocalStorage Fallback
        const db = getDB();
        if (isLogin) {
          const school = db.schools.find(s => s.userName === userName && s.password === password);
          if (school) {
            setCurrentSchool(school);
            setTimeout(() => window.location.reload(), 500);
          } else {
            setError('Invalid User ID or password');
          }
        } else {
          const exists = db.schools.some(s => s.userName === userName);
          if (exists) {
            setError('User ID already registered');
            setIsLoading(false);
            return;
          }

          const newSchool: School = {
            id: Math.random().toString(36).substr(2, 9),
            schoolName,
            schoolAddress,
            userName,
            mobileNumber,
            email,
            password
          };

          registerSchool(newSchool);
          setSuccessMessage('Registration successful! Please sign in with your User ID.');
          setIsLogin(true);
          setPassword(''); // Clear password for security
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className={`w-full ${isLogin ? 'max-w-md' : 'max-w-2xl'} bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500`}>
        <div className="bg-indigo-600 p-8 text-white text-center">
          <h1 className="text-4xl font-black tracking-tight">EduFace Pro</h1>
          <p className="text-indigo-100 mt-2 font-medium">
            {isLogin ? 'Welcome back to your school portal' : 'Register your school to get started'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm font-bold animate-shake">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 text-emerald-700 text-sm font-bold animate-in fade-in slide-in-from-top-2">
              {successMessage}
            </div>
          )}

          <div className={`grid grid-cols-1 ${isLogin ? '' : 'md:grid-cols-2'} gap-6`}>
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">School Name</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🏫</span>
                    <input
                      type="text"
                      required
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                      placeholder="Enter school name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">School Address</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">📍</span>
                    <input
                      type="text"
                      required
                      value={schoolAddress}
                      onChange={(e) => setSchoolAddress(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                      placeholder="Enter school address"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Mobile Number</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">📱</span>
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                      placeholder="Enter mobile number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">✉️</span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">User ID (User Name)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">👤</span>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                  placeholder="Enter User ID"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔒</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>PROCESSING...</span>
              </>
            ) : (
              <span>{isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}</span>
            )}
          </button>

          {!isUsingFirebase() && (
            <p className="text-[10px] text-center text-slate-400 mt-4">
              Running in Local Mode. Configure Firebase in .env for cloud storage.
            </p>
          )}

          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-600 font-bold hover:underline"
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
