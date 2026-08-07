export interface ClassTypeConfig {
  id: string;
  className: string;
  subject: string;
  defaultTotalLessons: number;
  defaultFee: number;
  unitPrice: number; // defaultFee / defaultTotalLessons
  note?: string;
}

export interface StudentEnrollment {
  id: string;
  studentName: string;
  className: string;
  subject: string;
  tuitionFee: number; // 学费
  totalLessons: number; // 购买总课次
  unitPrice: number; // 单次课价 (tuitionFee / totalLessons)
  enrollmentDate: string; // 报名时间 YYYY-MM-DD
  status: 'active' | 'graduated' | 'suspended';
  note?: string;
}

export interface AttendanceRecordRow {
  studentName: string;
  // Array of lesson statuses for lessons 1..N (e.g. '√' present, '×' absent, '请假' leave, '' empty)
  attendance: string[]; 
  note?: string;
}

export interface ClassMonthlyAttendance {
  id: string;
  month: string; // "YYYY-MM"
  className: string;
  subject?: string;
  totalLessonColumns: number; // e.g. 18
  classCost?: number; // 班级本月总成本（如教师课酬、场地费等）
  rows: AttendanceRecordRow[];
  isSettled: boolean;
  updatedAt: string;
}

export interface StudentMonthlySettlement {
  studentId?: string;
  studentName: string;
  className: string;
  subject: string;
  unitPrice: number;
  tuitionFee: number;
  totalLessons: number;
  
  // Settlement calculations
  monthPresentCount: number; // 本月出勤(消课)节数
  monthAbsentCount: number;  // 本月缺勤节数
  monthDeductCount: number;  // 本月核销课时
  monthConsumptionAmount: number; // 当月课销金额 = monthDeductCount * unitPrice
  
  cumulativeConsumedLessons: number; // 截止当月累计消耗课时
  remainingLessons: number; // 剩余课时 = totalLessons - cumulativeConsumedLessons
  remainingBalance: number; // 剩余学费金额 = remainingLessons * unitPrice
  
  isLowBalance: boolean; // 剩余课时 <= 3 提醒
}

export interface ClassMonthlySummary {
  className: string;
  subject: string;
  studentCount: number;
  totalPresentCount: number;
  totalDeductCount: number;
  totalConsumptionAmount: number; // 课销毛收入
  classCost: number; // 班级本月总成本
  netIncome: number; // 实际净收入 (totalConsumptionAmount - classCost)
  totalRemainingLessons: number;
  totalRemainingBalance: number;
}
