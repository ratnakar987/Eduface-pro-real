
import React, { useState, useRef, useEffect } from 'react';
import { getDB, markAttendance } from '../db';
import { Student, Attendance } from '../types';
import { identifyStudent } from '../geminiService';

const AttendanceScanner: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [identifiedStudent, setIdentifiedStudent] = useState<Student | null>(null);
  const [scanningMessage, setScanningMessage] = useState('Position face in center');
  const [history, setHistory] = useState<any[]>([]);
  const isScanningRef = useRef(false);

  useEffect(() => {
    const db = getDB();
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = db.attendance
      .filter(a => a.date === today)
      .map(a => ({
        ...a,
        studentName: db.students.find(s => s.id === a.studentId)?.fullName || 'Unknown'
      }))
      .reverse();
    setHistory(todayLogs);
    
    return () => { 
      isScanningRef.current = false;
      stopScanner();
    };
  }, []);

  const startScanner = async (mode: 'user' | 'environment' = facingMode) => {
    setIdentifiedStudent(null);
    setIsScanning(true);
    isScanningRef.current = true;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser.");
      }

      // Stop existing tracks if switching and nullify srcObject
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
      scanLoop();
    } catch (err: any) {
      console.error("Camera Error:", err);
      alert(`Camera access error: ${err.message || "Access denied"}`);
      setIsScanning(false);
      isScanningRef.current = false;
    }
  };

  const toggleCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    if (isScanning) {
      startScanner(newMode);
    }
  };

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    isScanningRef.current = false;
    setIdentifiedStudent(null);
  };

  const scanLoop = async () => {
    if (!isScanningRef.current || !videoRef.current) return;
    
    setScanningMessage('Analyzing features...');
    
    const canvas = canvasRef.current!;
    const video = videoRef.current;
    
    if (video.readyState < 2) {
      requestAnimationFrame(scanLoop);
      return;
    }

    // Ultra-downsample for maximum speed: 320px is sufficient for AI face matching
    const maxDim = 320;
    let width = video.videoWidth;
    let height = video.videoHeight;
    
    if (width > height) {
      if (width > maxDim) {
        height *= maxDim / width;
        width = maxDim;
      }
    } else {
      if (height > maxDim) {
        width *= maxDim / height;
        height = maxDim;
      }
    }

    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')?.drawImage(video, 0, 0, width, height);
    const frame = canvas.toDataURL('image/jpeg', 0.3); // Ultra-low quality for instant upload

    const db = getDB();
    const student = await identifyStudent(frame, db.students);

    if (student) {
      setIdentifiedStudent(student);
      setScanningMessage(`Welcome, ${student.fullName}!`);
      
      const att: Attendance = {
        id: Math.random().toString(36).substr(2, 9),
        studentId: student.id,
        date: new Date().toISOString().split('T')[0],
        status: 'Present',
        markedBy: 'AI Facial Recognition'
      };
      
      markAttendance(att);
      
      setHistory(prev => [{
        ...att,
        studentName: student.fullName
      }, ...prev].slice(0, 5));

      setTimeout(() => {
        if (!isScanningRef.current) return;
        setIdentifiedStudent(null);
        setScanningMessage('Scanning next...');
        scanLoop();
      }, 500); // Minimal delay after match
    } else {
      setScanningMessage('Searching...');
      setTimeout(() => {
        if (!isScanningRef.current) return;
        setScanningMessage('Position face in center');
        scanLoop();
      }, 50); // Near-zero delay if no match - even faster now
    }
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-slate-200">
          <div className="relative aspect-video bg-black flex items-center justify-center">
            {isScanning ? (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="w-full h-full object-cover" 
                />
                
                {/* Reliable Circular Cutout using Box Shadow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[65%] aspect-square rounded-full border-4 border-indigo-400/80 pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] z-10 overflow-hidden">
                  {/* Scanning Line */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-indigo-400 shadow-[0_0_15px_rgba(129,140,248,1)] animate-[scan_1.5s_ease-in-out_infinite]"></div>
                </div>

                <button 
                  onClick={toggleCamera}
                  className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white px-3 py-1.5 rounded-lg border border-white/30 backdrop-blur-sm text-xs font-bold transition-all z-10"
                >
                  🔄 Switch Camera
                </button>
              </>
            ) : (
              <div className="text-center text-white p-8">
                <div className="text-6xl mb-4 opacity-50">📸</div>
                <h4 className="text-xl font-bold text-indigo-400">High-Speed Scanner</h4>
                <p className="text-slate-400 mt-2 max-w-sm">AI Biometric Recognition Active</p>
                <div className="flex flex-col space-y-3 mt-8">
                  <button 
                    onClick={() => startScanner()}
                    className="bg-indigo-600 px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition shadow-lg"
                  >
                    Start AI Attendance
                  </button>
                  <button 
                    onClick={toggleCamera}
                    className="text-indigo-300 text-xs font-bold hover:text-white"
                  >
                    Using {facingMode === 'user' ? 'Front' : 'Rear'} Camera (Tap to Switch)
                  </button>
                </div>
              </div>
            )}

            {identifiedStudent && (
              <div className="absolute inset-0 bg-emerald-600/95 flex flex-col items-center justify-center text-white animate-in zoom-in duration-300 z-20">
                <div className="w-40 h-40 rounded-full bg-white text-emerald-600 flex items-center justify-center text-8xl mb-6 font-bold shadow-[0_0_50px_rgba(255,255,255,0.4)] animate-bounce">
                  ✓
                </div>
                <h3 className="text-4xl font-black tracking-tight">ATTENDANCE LOGGED</h3>
                <p className="text-emerald-50 text-xl mt-2 font-medium">{identifiedStudent.fullName}</p>
                <div className="mt-8 px-6 py-2 bg-white/20 rounded-full text-sm font-bold backdrop-blur-md">
                  ID: {identifiedStudent.id}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 flex justify-between items-center bg-slate-50 border-t">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
              <span className="font-bold text-slate-700">{scanningMessage}</span>
            </div>
            {isScanning && (
              <button 
                onClick={stopScanner}
                className="text-red-600 font-bold hover:text-red-700"
              >
                Exit Scanner
              </button>
            )}
          </div>
        </div>

        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 flex items-start space-x-4">
          <div className="bg-indigo-600 text-white w-10 h-10 rounded-lg flex items-center justify-center text-xl">🛡️</div>
          <div>
            <h5 className="font-bold text-indigo-900">Security Note</h5>
            <p className="text-indigo-700 text-sm mt-1">
              Dual camera support allows for both kiosk-style check-ins and teacher-led roving registration.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
        <h4 className="font-bold text-slate-800 border-b pb-4 mb-4">Live Activity</h4>
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-slate-400 text-sm italic py-8 text-center">Ready for input...</p>
          ) : (
            history.map((log, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-slate-50 border border-slate-100 animate-in slide-in-from-right duration-200">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  {log.studentName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{log.studentName}</p>
                  <p className="text-xs text-slate-500">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
};

export default AttendanceScanner;
