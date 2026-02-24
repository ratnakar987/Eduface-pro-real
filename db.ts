
import { Student, Class, Attendance, FeeStructure, StudentFee, PaymentHistory, School } from './types';

const STORAGE_KEY = 'school_management_db';
const SESSION_KEY = 'school_management_session';

interface DB {
  students: Student[];
  classes: Class[];
  attendance: Attendance[];
  feeStructures: FeeStructure[];
  studentFees: StudentFee[];
  payments: PaymentHistory[];
  schools: School[];
}

const initialDB: DB = {
  students: [],
  classes: [
    { id: '1', className: 'Class 1', sections: ['A', 'B'], classTeacherName: 'Mrs. Sharma' },
    { id: '2', className: 'Class 2', sections: ['A'], classTeacherName: 'Mr. Khan' },
  ],
  attendance: [],
  feeStructures: [
    { id: '1', classId: '1', academicYear: '2024-25', totalFees: 50000 },
    { id: '2', classId: '2', academicYear: '2024-25', totalFees: 55000 },
  ],
  studentFees: [],
  payments: [],
  schools: [],
};

export const getDB = (): DB => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return initialDB;
  
  try {
    const db = JSON.parse(stored);
    // Migration: Ensure all properties from initialDB exist
    return {
      ...initialDB,
      ...db,
      // Ensure arrays are initialized if missing in old data
      students: db.students || [],
      classes: db.classes || initialDB.classes,
      attendance: db.attendance || [],
      feeStructures: db.feeStructures || initialDB.feeStructures,
      studentFees: db.studentFees || [],
      payments: db.payments || [],
      schools: db.schools || [],
    };
  } catch (e) {
    console.error("Failed to parse DB", e);
    return initialDB;
  }
};

export const saveDB = (db: DB) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

export const addStudent = (student: Student) => {
  const db = getDB();
  db.students.push(student);
  
  // Initialize student fees
  const structure = db.feeStructures.find(fs => fs.classId === student.classId);
  if (structure) {
    db.studentFees.push({
      id: Math.random().toString(36).substr(2, 9),
      studentId: student.id,
      academicYear: structure.academicYear,
      totalFees: structure.totalFees,
      paidAmount: 0,
      dueDate: '2024-12-31'
    });
  }
  
  saveDB(db);
};

export const markAttendance = (att: Attendance) => {
  const db = getDB();
  // Don't mark twice for same student on same day
  const existing = db.attendance.find(a => a.studentId === att.studentId && a.date === att.date);
  if (!existing) {
    db.attendance.push(att);
    saveDB(db);
  }
};

export const addPayment = (payment: PaymentHistory) => {
  const db = getDB();
  db.payments.push(payment);
  
  const fee = db.studentFees.find(sf => sf.studentId === payment.studentId);
  if (fee) {
    fee.paidAmount += payment.amountPaid;
  }
  
  saveDB(db);
};

export const registerSchool = (school: School) => {
  const db = getDB();
  db.schools.push(school);
  saveDB(db);
};

export const getCurrentSchool = (): School | null => {
  const stored = localStorage.getItem(SESSION_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const setCurrentSchool = (school: School | null) => {
  if (school) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(school));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
};
