
export type Gender = 'Male' | 'Female' | 'Other';
export type AttendanceStatus = 'Present' | 'Absent' | 'Late';
export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid';
export type PaymentMode = 'Cash' | 'Card' | 'Online' | 'Cheque';

export interface Class {
  id: string;
  className: string;
  sections: string[];
  classTeacherName: string;
}

export interface Student {
  id: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: string;
  classId: string;
  section: string;
  fatherName: string;
  motherName: string;
  faceReference: string; // Base64 image
  registrationDate: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  markedBy: string; // 'AI Facial Recognition' or 'Manual'
}

export interface FeeStructure {
  id: string;
  classId: string;
  academicYear: string;
  totalFees: number;
}

export interface StudentFee {
  id: string;
  studentId: string;
  academicYear: string;
  totalFees: number;
  paidAmount: number;
  dueDate: string;
}

export interface PaymentHistory {
  id: string;
  studentId: string;
  amountPaid: number;
  paymentDate: string;
  paymentMode: PaymentMode;
  receiptNumber: string;
}

export interface School {
  id: string;
  schoolName: string;
  password: string;
}

export interface DashboardStats {
  totalStudents: number;
  attendanceToday: number;
  feesCollected: number;
  pendingFees: number;
  defaultersCount: number;
}
