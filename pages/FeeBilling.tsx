
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

  const stats = data.reduce((acc, curr) => {
    acc.total += curr.totalFees;
    acc.paid += curr.paidAmount;
    acc.balance += (curr.totalFees - curr.paidAmount);
    return acc;
  }, { total: 0, paid: 0, balance: 0 });

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
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Summary Header - Horizontal on Desktop, Vertical on Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center md:items-start">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Fees</span>
          <span className="text-2xl font-black text-slate-900">₹{stats.total.toLocaleString()}</span>
        </div>
        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col items-center md:items-start">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Collected</span>
          <span className="text-2xl font-black text-emerald-700">₹{stats.paid.toLocaleString()}</span>
        </div>
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 shadow-sm flex flex-col items-center md:items-start">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Total Balance</span>
          <span className="text-2xl font-black text-red-700">₹{stats.balance.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Desktop Header - Hidden on Mobile */}
        <div className="hidden md:grid grid-cols-7 bg-slate-50 border-b px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-widest">
          <div className="col-span-2">Student Name</div>
          <div>Class</div>
          <div className="text-right">Total Fee</div>
          <div className="text-right">Paid</div>
          <div className="text-right">Balance</div>
          <div className="text-center">Action</div>
        </div>

        {/* List Content */}
        <div className="divide-y divide-slate-100">
          {data.map(item => {
            const balance = item.totalFees - item.paidAmount;
            const status = balance === 0 ? 'Paid' : item.paidAmount > 0 ? 'Partial' : 'Unpaid';
            return (
              <div key={item.id} className="p-4 md:px-6 md:py-4 hover:bg-slate-50 transition-colors">
                {/* Mobile View - Vertical Stack */}
                <div className="md:hidden space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">{item.student?.fullName}</h4>
                      <p className="text-sm text-slate-500">{item.className} • {item.section}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      status === 'Paid' ? 'bg-green-100 text-green-700' : 
                      status === 'Partial' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
                      <p className="font-bold text-slate-700">₹{item.totalFees.toLocaleString()}</p>
                    </div>
                    <div className="text-center border-x border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Paid</p>
                      <p className="font-bold text-emerald-600">₹{item.paidAmount.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Due</p>
                      <p className="font-bold text-red-500">₹{balance.toLocaleString()}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => { setSelectedFee(item); setIsPayModalOpen(true); }}
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
                  >
                    COLLECT PAYMENT
                  </button>
                </div>

                {/* Desktop View - Horizontal Row */}
                <div className="hidden md:grid grid-cols-7 items-center">
                  <div className="col-span-2 font-bold text-slate-900">{item.student?.fullName}</div>
                  <div className="text-slate-500 font-medium">{item.className}</div>
                  <div className="text-right font-medium">₹{item.totalFees.toLocaleString()}</div>
                  <div className="text-right font-bold text-emerald-600">₹{item.paidAmount.toLocaleString()}</div>
                  <div className="text-right font-black text-red-500">₹{balance.toLocaleString()}</div>
                  <div className="text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      status === 'Paid' ? 'bg-green-100 text-green-700' : 
                      status === 'Partial' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {status}
                    </span>
                  </div>
                  <div className="text-right">
                    <button 
                      onClick={() => { setSelectedFee(item); setIsPayModalOpen(true); }}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition font-bold text-xs"
                    >
                      COLLECT
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode</label>
                  <select name="mode" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50">
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
                    className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" 
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

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsPayModalOpen(false)}
                  className="w-full py-4 text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
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
