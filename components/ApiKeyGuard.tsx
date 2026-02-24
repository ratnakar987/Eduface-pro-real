import React, { useState, useEffect } from 'react';

// The window.aistudio object is assumed to be provided by the environment.
// Removing local declaration to avoid "All declarations of 'aistudio' must have identical modifiers" error.

const ApiKeyGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const checkKey = async () => {
    try {
      // Accessing aistudio via type casting to avoid global declaration conflicts
      const selected = await (window as any).aistudio.hasSelectedApiKey();
      setHasKey(selected);
    } catch (e) {
      setHasKey(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkKey();

    // Listen for billing errors from the service
    const handleError = () => {
      setHasKey(false);
    };
    window.addEventListener('aistudio:billing_error', handleError);
    return () => window.removeEventListener('aistudio:billing_error', handleError);
  }, []);

  const handleOpenSelect = async () => {
    // Accessing aistudio via type casting to avoid global declaration conflicts
    await (window as any).aistudio.openSelectKey();
    // Assume success as per guidelines to mitigate race conditions
    setHasKey(true);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">Billing Setup Required</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            EduFace Pro uses advanced Gemini AI features. To deploy and use this application on Google Cloud, you must select an API key from a 
            <span className="text-indigo-400 font-semibold"> paid GCP project</span>.
          </p>

          <div className="space-y-4">
            <button
              onClick={handleOpenSelect}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              Select Paid Project API Key
            </button>
            
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full py-3 text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              View Billing Documentation ↗
            </a>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              Secure Enterprise Deployment
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ApiKeyGuard;