
import React, { useState, useEffect } from 'react';
import { getDB } from '../db';

const Reports: React.FC = () => {
  const [type, setType] = useState<'attendance' | 'fees'>('attendance');
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const db = getDB();
    if (type === 'attendance') {
      const grouped = db.attendance.reduce((acc: any, curr) => {
        const student = db.students.find(s => s.id === curr.studentId);
        if (!acc[curr.studentId]) {
          acc[curr.studentId] = {
            name: student?.fullName,
            presents: 0,
            absents: 0,
            total: 0
          };
        }
        if (curr.status === 'Present') acc[curr.studentId].presents++;
        else acc[curr.studentId].absents++;
        acc[curr.studentId].total++;
        return acc;
      }, {});
      setData(Object.values(grouped));
    } else {
      const summary = db.studentFees.map(f => {
        const student = db.students.find(s => s.id === f.studentId);
        return {
          name: student?.fullName,
          total: f.totalFees,
          paid: f.paidAmount,
          pending: f.totalFees - f.paidAmount
        };
      });
      setData(summary);
    }
  }, [type]);

  return (
    <div className="space-y-6">
      <div className="flex space-x-1 p-1 bg-slate-200 rounded-lg w-fit">
        <button 
          onClick={() => setType('attendance')}
          className={`px-6 py-2 rounded-md font-bold text-sm transition ${type === 'attendance' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:text-slate-800'}`}
        >
          Attendance Summary
        </button>
        <button 
          onClick={() => setType('fees')}
          className={`px-6 py-2 rounded-md font-bold text-sm transition ${type === 'fees' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:text-slate-800'}`}
        >
          Financial Reports
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800">
            {type === 'attendance' ? 'Monthly Attendance Report' : 'Consolidated Fee Report'}
          </h3>
          <button className="text-indigo-600 text-sm font-bold border border-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50">
            📥 Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 border-b">Student Name</th>
                {type === 'attendance' ? (
                  <>
                    <th className="px-4 py-3 border-b">Total Days</th>
                    <th className="px-4 py-3 border-b">Present</th>
                    <th className="px-4 py-3 border-b">Percentage</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 border-b">Total Fees</th>
                    <th className="px-4 py-3 border-b">Amount Paid</th>
                    <th className="px-4 py-3 border-b">Balance Dues</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-4 py-4 font-medium text-slate-800">{row.name}</td>
                  {type === 'attendance' ? (
                    <>
                      <td className="px-4 py-4">{row.total}</td>
                      <td className="px-4 py-4 text-green-600">{row.presents}</td>
                      <td className="px-4 py-4 font-bold">{Math.round((row.presents/row.total)*100)}%</td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-4">₹{row.total.toLocaleString()}</td>
                      <td className="px-4 py-4 text-green-600">₹{row.paid.toLocaleString()}</td>
                      <td className="px-4 py-4 text-red-600 font-bold">₹{row.pending.toLocaleString()}</td>
                    </>
                  )}
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-400 italic">No data records found for selected period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
