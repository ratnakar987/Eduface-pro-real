
import React, { useState, useEffect } from 'react';
import { getDB, registerSchool, setCurrentSchool } from '../db';
import { School } from '../types';
import { db as fsDb, isUsingFirebase } from '../firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [schoolName, setSchoolName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isUsingFirebase() && fsDb) {
        // Firebase Logic
        const schoolsRef = collection(fsDb, 'schools');
        if (isLogin) {
          const q = query(schoolsRef, where("schoolName", "==", schoolName), where("password", "==", password));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const schoolData = querySnapshot.docs[0].data() as School;
            const school = { ...schoolData, id: querySnapshot.docs[0].id };
            setCurrentSchool(school);
            window.location.reload();
          } else {
            setError('Invalid school name or password');
          }
        } else {
          const q = query(schoolsRef, where("schoolName", "==", schoolName));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            setError('School name already registered');
            setIsLoading(false);
            return;
          }

          const newSchool = {
            schoolName,
            password,
            createdAt: new Date().toISOString()
          };

          const docRef = await addDoc(schoolsRef, newSchool);
          const school = { ...newSchool, id: docRef.id } as School;
          setCurrentSchool(school);
          window.location.reload();
        }
      } else {
        // LocalStorage Fallback (Faster for dev/demo)
        const db = getDB();
        if (isLogin) {
          const school = db.schools.find(s => s.schoolName === schoolName && s.password === password);
          if (school) {
            setCurrentSchool(school);
            // Simulate network delay for "feel"
            setTimeout(() => window.location.reload(), 500);
          } else {
            setError('Invalid school name or password');
          }
        } else {
          const exists = db.schools.some(s => s.schoolName === schoolName);
          if (exists) {
            setError('School name already registered');
            setIsLoading(false);
            return;
          }

          const newSchool: School = {
            id: Math.random().toString(36).substr(2, 9),
            schoolName,
            password
          };

          registerSchool(newSchool);
          setCurrentSchool(newSchool);
          setTimeout(() => window.location.reload(), 500);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during authentication');
    } finally {
      if (error) setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
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

          <div className="space-y-4">
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
