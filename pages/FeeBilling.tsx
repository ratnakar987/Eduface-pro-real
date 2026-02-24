
import React, { useState, useEffect } from 'react';
import { getDB, addPayment } from '../db';
import { Student, StudentFee, PaymentHistory, PaymentMode } from '../types';

const FeeBilling: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [selectedFee, setSelectedFee] = useState<any | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const db = getDB();
    const studentsWithFees = db.studentFees.map(f => {
      const student = db.students.find(s => s.id === f.studentId);
      const cls = db.classes.find(c => c.id === student?.classId);
      const history = db.payments.filter(p => p.studentId === f.studentId);
      return { ...f, student, className: cls?.className, history };
    });
    setData(studentsWithFees);
  };

  const handlePayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const amount = Number(formData.get('amount'));
    
    if (amount <= 0 || !selectedFee) return;

    const paymentDate = formData.get('paymentDate') as string || new Date().toISOString().split('T')[0];

    const newPayment: PaymentHistory = {
      id: Math.random().toString(36).substr(2, 9),
      studentId: selectedFee.studentId,
      amountPaid: amount,
      paymentDate: paymentDate,
      paymentMode: formData.get('mode') as PaymentMode,
      receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
    };

    addPayment(newPayment);
    setIsPayModalOpen(false);
    refreshData();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-700">Student Name</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Class</th>
              <th className="px-6 py-4 font-semibold text-slate-700 text-right">Total Fee</th>
              <th className="px-6 py-4 font-semibold text-slate-700 text-right">Paid</th>
              <th className="px-6 py-4 font-semibold text-slate-700 text-right">Balance</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map(item => {
              const balance = item.totalFees - item.paidAmount;
              const status = balance === 0 ? 'Paid' : item.paidAmount > 0 ? 'Partial' : 'Unpaid';
              return (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-medium text-slate-900">{item.student?.fullName}</td>
                  <td className="px-6 py-4 text-slate-500">{item.className}</td>
                  <td className="px-6 py-4 text-right">₹{item.totalFees.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-green-600">₹{item.paidAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-bold text-red-500">₹{balance.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      status === 'Paid' ? 'bg-green-100 text-green-700' : 
                      status === 'Partial' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => { setSelectedFee(item); setIsPayModalOpen(true); }}
                      className="bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition text-xs font-bold"
                    >
                      COLLECT FEE
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isPayModalOpen && selectedFee && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-indigo-600 p-6 text-white">
              <h3 className="text-xl font-bold">Collect Payment</h3>
              <p className="text-indigo-100 text-sm mt-1">{selectedFee.student?.fullName} • {selectedFee.className}</p>
            </div>
            <form onSubmit={handlePayment} className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg flex justify-between items-center mb-2">
                <span className="text-sm text-slate-500">Remaining Balance:</span>
                <span className="text-lg font-bold text-red-600">₹{(selectedFee.totalFees - selectedFee.paidAmount).toLocaleString()}</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount to Pay</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400">₹</span>
                  <input 
                    name="amount" 
                    type="number" 
                    required 
                    defaultValue={selectedFee.totalFees - selectedFee.paidAmount}
                    max={selectedFee.totalFees - selectedFee.paidAmount}
                    className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode</label>
                  <select name="mode" className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="Cash">Cash</option>
                    <option value="Online">Online Transfer</option>
                    <option value="Card">Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date</label>
                  <input 
                    name="paymentDate" 
                    type="date" 
                    required 
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
              </div>

              {selectedFee.history && selectedFee.history.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Payment History</label>
                  <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
                    {selectedFee.history.map((h: any) => (
                      <div key={h.id} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded border border-slate-100">
                        <div>
                          <span className="font-bold text-slate-700">₹{h.amountPaid.toLocaleString()}</span>
                          <span className="text-slate-400 mx-2">•</span>
                          <span className="text-slate-500">{h.paymentMode}</span>
                        </div>
                        <span className="text-slate-500 font-mono">{h.paymentDate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsPayModalOpen(false)}
                  className="flex-1 py-2 text-slate-600 border border-slate-200 rounded-lg font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeBilling;
