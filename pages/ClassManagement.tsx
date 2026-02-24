
import React, { useState, useEffect } from 'react';
import { Class } from '../types';
import { getDB, saveDB } from '../db';

const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  useEffect(() => {
    setClasses(getDB().classes);
  }, []);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const newClass: Class = {
      id: editingClass?.id || Math.random().toString(36).substr(2, 9),
      className: formData.get('className') as string,
      sections: (formData.get('sections') as string).split(',').map(s => s.trim()),
      classTeacherName: formData.get('teacher') as string,
    };

    const db = getDB();
    if (editingClass) {
      db.classes = db.classes.map(c => c.id === newClass.id ? newClass : c);
    } else {
      db.classes.push(newClass);
    }
    saveDB(db);
    setClasses(db.classes);
    setIsModalOpen(false);
    setEditingClass(null);
  };

  const deleteClass = (id: string) => {
    const db = getDB();
    db.classes = db.classes.filter(c => c.id !== id);
    saveDB(db);
    setClasses(db.classes);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Manage Academic Classes</h3>
        <button
          onClick={() => { setEditingClass(null); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          + Add New Class
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(cls => (
          <div key={cls.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xl font-bold text-slate-800">{cls.className}</h4>
                <p className="text-sm text-slate-500 mt-1">Teacher: {cls.classTeacherName}</p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => { setEditingClass(cls); setIsModalOpen(true); }} className="text-slate-400 hover:text-indigo-600">✏️</button>
                <button onClick={() => deleteClass(cls.id)} className="text-slate-400 hover:text-red-600">🗑️</button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {cls.sections.map(sec => (
                <span key={sec} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">
                  Section {sec}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-xl p-8 shadow-2xl mx-4">
            <h3 className="text-xl font-bold mb-6">{editingClass ? 'Edit Class' : 'Add New Class'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Class Name</label>
                <input
                  name="className"
                  defaultValue={editingClass?.className}
                  required
                  placeholder="e.g. Class 10"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sections (comma separated)</label>
                <input
                  name="sections"
                  defaultValue={editingClass?.sections.join(', ')}
                  required
                  placeholder="A, B, C"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Class Teacher</label>
                <input
                  name="teacher"
                  defaultValue={editingClass?.classTeacherName}
                  required
                  placeholder="Full Name"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
