
import React, { useEffect, useState } from 'react';
import { getDB } from '../db';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Student } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    attendanceToday: 0,
    feesCollected: 0,
    pendingFees: 0,
    defaulters: 0
  });

  const [classData, setClassData] = useState<any[]>([]);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [modalStudents, setModalStudents] = useState<Student[]>([]);

  useEffect(() => {
    const db = getDB();
    const today = new Array(0).fill(0); // Dummy for today
    const students = db.students;
    const todayStr = new Date().toISOString().split('T')[0];
    const presentToday = db.attendance.filter(a => a.date === todayStr && a.status === 'Present').length;
    
    const collected = db.payments.reduce((sum, p) => sum + p.amountPaid, 0);
    const totalPossible = db.studentFees.reduce((sum, f) => sum + f.totalFees, 0);
    const pending = totalPossible - collected;
    const defaulters = db.studentFees.filter(f => (f.totalFees - f.paidAmount) > (f.totalFees * 0.5)).length;

    setStats({
      totalStudents: students.length,
      attendanceToday: presentToday,
      feesCollected: collected,
      pendingFees: pending,
      defaulters: defaulters
    });

    // Chart Data
    const distribution = db.classes.map(c => ({
      name: c.className,
      count: db.students.filter(s => s.classId === c.id).length
    }));
    setClassData(distribution);
  }, []);

  const handleCardClick = (label: string) => {
    const db = getDB();
    if (label === 'Total Students') {
      setModalStudents(db.students);
      setSelectedStat(label);
    } else if (label === 'Present Today') {
      const todayStr = new Date().toISOString().split('T')[0];
      const presentIds = db.attendance
        .filter(a => a.date === todayStr && a.status === 'Present')
        .map(a => a.studentId);
      const presentStudents = db.students.filter(s => presentIds.includes(s.id));
      setModalStudents(presentStudents);
      setSelectedStat(label);
    }
  };

  const cards = [
    { label: 'Total Students', value: stats.totalStudents, icon: '👥', color: 'bg-blue-500', clickable: true },
    { label: 'Present Today', value: stats.attendanceToday, icon: '✅', color: 'bg-green-500', clickable: true },
    { label: 'Fees Collected', value: `₹${stats.feesCollected.toLocaleString()}`, icon: '💰', color: 'bg-emerald-500', clickable: false },
    { label: 'Pending Dues', value: `₹${stats.pendingFees.toLocaleString()}`, icon: '⚠️', color: 'bg-orange-500', clickable: false },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div 
            key={i} 
            onClick={() => card.clickable && handleCardClick(card.label)}
            className={`bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center space-x-4 transition-all ${card.clickable ? 'cursor-pointer hover:shadow-md hover:border-indigo-200 active:scale-95' : ''}`}
          >
            <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center text-white text-2xl`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <h3 className="text-2xl font-bold text-slate-800">{card.value}</h3>
              {card.clickable && <p className="text-[10px] text-indigo-500 font-bold mt-1">VIEW LIST →</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-6">Student Distribution by Class</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-6">Defaulters List (Top 5)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-medium">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Pending</th>
                </tr>
              </thead>
              <tbody>
                {getDB().studentFees
                  .filter(f => f.totalFees > f.paidAmount)
                  .sort((a, b) => (b.totalFees - b.paidAmount) - (a.totalFees - a.paidAmount))
                  .slice(0, 5)
                  .map(f => {
                    const student = getDB().students.find(s => s.id === f.studentId);
                    const cls = getDB().classes.find(c => c.id === student?.classId);
                    return (
                      <tr key={f.id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium text-slate-800">{student?.fullName}</td>
                        <td className="px-4 py-3">{cls?.className}</td>
                        <td className="px-4 py-3 text-red-500 font-bold">₹{(f.totalFees - f.paidAmount).toLocaleString()}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {selectedStat && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{selectedStat}</h3>
                <p className="text-indigo-100 text-sm">Showing {modalStudents.length} students</p>
              </div>
              <button 
                onClick={() => setSelectedStat(null)}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {modalStudents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modalStudents.map(student => {
                    const cls = getDB().classes.find(c => c.id === student.classId);
                    return (
                      <div key={student.id} className="flex items-center space-x-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                          {student.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{student.fullName}</p>
                          <p className="text-xs text-slate-500">{cls?.className} • Section {student.section}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{student.id}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400 font-medium">No students found for this category.</p>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t flex justify-end">
              <button 
                onClick={() => setSelectedStat(null)}
                className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
