import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { getDB } from '../db';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AiAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I am your EduFace Pro AI Command Center. Ask me anything about the school's data, such as total students, today's attendance, or fee status." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setIsLoading(true);

    try {
      const db = getDB();
      // Prepare a summarized context of the current database state
      const dbContext = {
        studentCount: db.students.length,
        classes: db.classes.map(c => ({
          name: c.className,
          studentCount: db.students.filter(s => s.classId === c.id).length
        })),
        attendanceToday: db.attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length,
        financials: {
          collected: db.payments.reduce((sum, p) => sum + p.amountPaid, 0),
          totalDue: db.studentFees.reduce((sum, f) => sum + f.totalFees - f.paidAmount, 0)
        }
      };

      // Initialize with strict API key reference from environment variables
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            role: 'user',
            parts: [{
              text: `You are a professional administrative assistant for "EduFace Pro", a school management system.
              
              Current School Data Summary:
              ${JSON.stringify(dbContext, null, 2)}
              
              Guidelines:
              1. Answer accurately based on the data provided above.
              2. Be professional, concise, and helpful.
              3. If the user asks about something not in the data, explain that you only have access to current registration, attendance, and fee records.
              4. Format numbers and currency (₹) clearly.
              
              User Question: ${userQuery}`
            }]
          }
        ]
      });

      const reply = response.text || "I apologize, I'm having trouble processing that data right now.";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error("Assistant Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I encountered an error connecting to the AI brain. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-12rem)]">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
        {/* Chat Header */}
        <div className="bg-indigo-600 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">
              🤖
            </div>
            <div>
              <h3 className="font-bold text-lg leading-none">AI Command Center</h3>
              <p className="text-indigo-100 text-xs mt-1">Real-time School Insights</p>
            </div>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest bg-indigo-500 px-3 py-1 rounded-full border border-indigo-400/30">
            Active Logic: Gemini Flash
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                m.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-100 rounded-2xl p-4 flex space-x-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. How many students are enrolled in Class 1?"
            className="flex-1 px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium text-sm"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:shadow-none flex items-center space-x-2"
          >
            <span>Ask AI</span>
          </button>
        </form>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          "Total students?",
          "Attendance today",
          "Fee defaulters",
          "Class 2 count"
        ].map(suggestion => (
          <button
            key={suggestion}
            onClick={() => setInput(suggestion)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AiAssistant;