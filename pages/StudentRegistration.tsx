
import React, { useState, useRef, useEffect } from 'react';
import { getDB, addStudent } from '../db';
import { Class, Student, Gender } from '../types';
import { checkDuplicateFace } from '../geminiService';

const StudentRegistration: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [duplicateStudent, setDuplicateStudent] = useState<Student | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setClasses(getDB().classes);
  }, []);

  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    setIsCapturing(true);
    setError(null);
    setSuccess(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser.");
      }

      // Stop existing tracks if any and nullify srcObject
      if (videoRef.current && videoRef.current.srcObject) {
        const existingStream = videoRef.current.srcObject as MediaStream;
        existingStream.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: mode, 
            width: { ideal: 1280 }, 
            height: { ideal: 720 } 
          } 
        });
      } catch (fallbackErr) {
        console.warn("Ideal constraints failed, falling back to basic video", fallbackErr);
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera Error:", err);
      setError(`Unable to access camera: ${err.message || "Please allow permissions."}`);
      setIsCapturing(false);
    }
  };

  const toggleCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    if (isCapturing) {
      startCamera(newMode);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Higher quality (0.85) to ensure AI gets clear facial features
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFaceImage(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (!faceImage) {
      setError("Facial capture is mandatory for registration.");
      return;
    }

    setIsChecking(true);
    setError(null);
    setSuccess(null);
    setDuplicateStudent(null);

    const db = getDB();
    const existingStudents = db.students;

    // MANDATORY AI DUPLICATE CHECK
    const duplicate = await checkDuplicateFace(faceImage, existingStudents);
    
    if (duplicate) {
      console.warn("Duplicate registration attempt blocked for face matching ID:", duplicate.id);
      setDuplicateStudent(duplicate);
      setIsChecking(false);
      return; // HARD STOP
    }

    const formData = new FormData(form);
    const dob = `${formData.get('dobYear')}-${formData.get('dobMonth')}-${formData.get('dobDay')}`;
    
    const newStudent: Student = {
      id: `STU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      fullName: formData.get('fullName') as string,
      gender: formData.get('gender') as Gender,
      dateOfBirth: dob,
      classId: formData.get('classId') as string,
      section: formData.get('section') as string,
      fatherName: formData.get('fatherName') as string,
      motherName: formData.get('motherName') as string,
      faceReference: faceImage,
      registrationDate: new Date().toISOString().split('T')[0],
    };

    addStudent(newStudent);
    setSuccess(`Registration Successful! Student ${newStudent.fullName} assigned ID: ${newStudent.id}`);
    setIsChecking(false);
    setFaceImage(null);
    form.reset();
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);
  const months = [
    { val: '01', label: 'Jan' }, { val: '02', label: 'Feb' }, { val: '03', label: 'Mar' },
    { val: '04', label: 'Apr' }, { val: '05', label: 'May' }, { val: '06', label: 'Jun' },
    { val: '07', label: 'Jul' }, { val: '08', label: 'Aug' }, { val: '09', label: 'Sep' },
    { val: '10', label: 'Oct' }, { val: '11', label: 'Nov' }, { val: '12', label: 'Dec' }
  ];
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative">
      {duplicateStudent && (
        <div className="absolute inset-0 z-[100] bg-slate-900/90 flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-10 max-w-md w-full shadow-2xl border-4 border-red-500 text-center scale-up-center">
            <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-inner">
              🔒
            </div>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">Access Denied</h3>
            <p className="text-slate-600 mt-4 text-lg font-medium leading-relaxed">
              Biometric mismatch detected. This individual is already in the system.
            </p>
            <div className="mt-8 p-6 bg-red-50 rounded-2xl border border-red-200">
              <p className="text-sm uppercase tracking-widest text-red-600 font-bold mb-1">Registered Account</p>
              <p className="font-bold text-slate-800 text-xl">{duplicateStudent.fullName}</p>
              <p className="text-sm text-slate-500 font-mono mt-1">ID: {duplicateStudent.id}</p>
            </div>
            <button 
              onClick={() => { setDuplicateStudent(null); setFaceImage(null); }}
              className="mt-8 w-full py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg hover:shadow-red-500/30"
            >
              Reset Registration Form
            </button>
          </div>
        </div>
      )}

      <div className="bg-indigo-600 p-8 text-white">
        <h3 className="text-2xl font-bold">Student Biometric Enrollment</h3>
        <div className="flex justify-between items-center mt-1">
          <p className="text-indigo-100 opacity-90">Powered by Gemini AI Facial Recognition</p>
          <button 
            type="button"
            onClick={toggleCamera}
            className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg border border-white/30 transition-all font-bold flex items-center space-x-1"
          >
            <span>🔄</span>
            <span>Switch to {facingMode === 'user' ? 'Rear' : 'Front'} Camera</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleRegister} className="p-8 space-y-10">
        {error && (
          <div className="bg-red-50 border-l-8 border-red-500 p-6 text-red-800 flex items-center space-x-4 animate-bounce">
            <span className="text-3xl">⚠️</span>
            <p className="font-bold text-lg">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border-l-8 border-emerald-500 p-6 text-emerald-800 flex items-center space-x-4">
            <span className="text-3xl">⭐</span>
            <p className="font-bold text-lg">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-lg font-bold text-slate-800">1. Facial Capture</label>
              {faceImage && <span className="text-emerald-600 font-bold text-sm flex items-center">✓ Captured</span>}
            </div>
            <div className="relative aspect-square bg-slate-100 rounded-[2rem] overflow-hidden border-4 border-dashed border-slate-300 flex flex-col items-center justify-center group transition-all hover:border-indigo-400">
              {faceImage ? (
                <img src={faceImage} className="w-full h-full object-cover" alt="Captured student face" />
              ) : isCapturing ? (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-8">
                  <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 group-hover:scale-110 transition-transform">
                    👤
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Camera inactive</p>
                </div>
              )}
              
              <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-3 px-6">
                {!isCapturing && !faceImage && (
                  <button type="button" onClick={() => startCamera()} className="bg-indigo-600 text-white w-full py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all font-bold flex items-center justify-center space-x-2">
                    <span>📷</span>
                    <span>Initialize Camera</span>
                  </button>
                )}
                {isCapturing && (
                  <div className="flex flex-col w-full space-y-2">
                    <button type="button" onClick={capturePhoto} className="bg-red-600 text-white w-full py-4 rounded-2xl shadow-xl hover:bg-red-700 transition-all font-bold flex items-center justify-center space-x-2 animate-pulse">
                      <span className="w-3 h-3 bg-white rounded-full"></span>
                      <span>Capture Biometric</span>
                    </button>
                    <button type="button" onClick={toggleCamera} className="bg-slate-700 text-white w-full py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all">
                      Switch Camera
                    </button>
                  </div>
                )}
                {faceImage && !isCapturing && (
                  <button type="button" onClick={() => { setFaceImage(null); setDuplicateStudent(null); }} className="bg-slate-900 text-white w-full py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all font-bold flex items-center justify-center space-x-2">
                    <span>🔄</span>
                    <span>Retake Scan</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-lg font-bold text-slate-800">2. Academic Information</h4>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Full Student Name</label>
                <input name="fullName" required className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium" placeholder="Legal Full Name" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Gender</label>
                  <select name="gender" required className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Birth Date</label>
                  <div className="grid grid-cols-3 gap-2">
                    <select name="dobDay" required className="w-full px-2 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium text-sm">
                      <option value="">Day</option>
                      {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select name="dobMonth" required className="w-full px-2 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium text-sm">
                      <option value="">Month</option>
                      {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                    </select>
                    <select name="dobYear" required className="w-full px-2 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium text-sm">
                      <option value="">Year</option>
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Assigned Class</label>
                  <select 
                    name="classId" 
                    required 
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                  >
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Section</label>
                  <select name="section" required className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium">
                    <option value="">Select Section</option>
                    {selectedClass?.sections.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-slate-100">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Guardian / Parent Context</label>
                <div className="space-y-4">
                  <input name="fatherName" required placeholder="Father's Full Name" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-medium" />
                  <input name="motherName" required placeholder="Mother's Full Name" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-medium" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center pt-8 border-t-2 border-slate-100">
          <button
            type="submit"
            disabled={isChecking}
            className={`w-full md:w-auto px-16 py-5 rounded-2xl text-white text-xl font-black shadow-2xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-3 ${
              isChecking ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isChecking ? (
              <>
                <span className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>BIOMETRIC VALIDATION...</span>
              </>
            ) : (
              <span>FINALIZE ENROLLMENT</span>
            )}
          </button>
        </div>
      </form>
      <canvas ref={canvasRef} className="hidden" />
      <style>{`
        .scale-up-center {
          animation: scale-up-center 0.3s cubic-bezier(0.390, 0.575, 0.565, 1.000) both;
        }
        @keyframes scale-up-center {
          0% { transform: scale(0.5); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default StudentRegistration;
