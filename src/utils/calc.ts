import {
  StudentEnrollment,
  ClassMonthlyAttendance,
  StudentMonthlySettlement,
  ClassMonthlySummary
} from '../types';

/**
 * Calculates monthly settlement statistics for a single student for a given month.
 */
export function calculateStudentSettlement(
  student: StudentEnrollment,
  targetMonth: string,
  allAttendanceSheets: ClassMonthlyAttendance[]
): StudentMonthlySettlement {
  // Find all attendance sheets for this student's class up to targetMonth
  const relevantSheets = allAttendanceSheets.filter(
    (sheet) => sheet.className === student.className && sheet.month <= targetMonth
  );

  let cumulativeConsumed = 0;
  let monthPresentCount = 0;
  let monthAbsentCount = 0;
  let monthDeductCount = 0;

  for (const sheet of relevantSheets) {
    const studentRow = sheet.rows.find(
      (r) => r.studentName.trim().toLowerCase() === student.studentName.trim().toLowerCase()
    );

    if (studentRow) {
      // Present count for this sheet
      const present = studentRow.attendance.filter((item) => item === '√').length;
      const absent = studentRow.attendance.filter((item) => item === '×' || item === '请假').length;

      // Deduct count (by default, '√' deducts 1 lesson. If institute deducts for unexcused '×', logic can adapt)
      const deduct = present;

      cumulativeConsumed += deduct;

      if (sheet.month === targetMonth) {
        monthPresentCount = present;
        monthAbsentCount = absent;
        monthDeductCount = deduct;
      }
    }
  }

  const unitPrice = student.unitPrice || (student.totalLessons > 0 ? student.tuitionFee / student.totalLessons : 0);
  const monthConsumptionAmount = monthDeductCount * unitPrice;
  const remainingLessons = Math.max(0, student.totalLessons - cumulativeConsumed);
  const remainingBalance = remainingLessons * unitPrice;
  const isLowBalance = remainingLessons <= 3;

  return {
    studentId: student.id,
    studentName: student.studentName,
    className: student.className,
    subject: student.subject,
    unitPrice: Math.round(unitPrice * 100) / 100,
    tuitionFee: student.tuitionFee,
    totalLessons: student.totalLessons,
    monthPresentCount,
    monthAbsentCount,
    monthDeductCount,
    monthConsumptionAmount: Math.round(monthConsumptionAmount * 100) / 100,
    cumulativeConsumedLessons: cumulativeConsumed,
    remainingLessons,
    remainingBalance: Math.round(remainingBalance * 100) / 100,
    isLowBalance
  };
}

/**
 * Calculates monthly class summary statistics.
 */
export function calculateClassSummary(
  className: string,
  targetMonth: string,
  students: StudentEnrollment[],
  allAttendanceSheets: ClassMonthlyAttendance[]
): ClassMonthlySummary {
  const classStudents = students.filter((s) => s.className === className);
  const subject = classStudents[0]?.subject || '未分类';

  // Find attendance sheet for this class & targetMonth to get classCost
  const targetSheet = allAttendanceSheets.find(
    (sheet) => sheet.className === className && sheet.month === targetMonth
  );
  const classCost = targetSheet?.classCost || 0;

  let totalPresentCount = 0;
  let totalDeductCount = 0;
  let totalConsumptionAmount = 0;
  let totalRemainingLessons = 0;
  let totalRemainingBalance = 0;

  for (const s of classStudents) {
    const settlement = calculateStudentSettlement(s, targetMonth, allAttendanceSheets);
    totalPresentCount += settlement.monthPresentCount;
    totalDeductCount += settlement.monthDeductCount;
    totalConsumptionAmount += settlement.monthConsumptionAmount;
    totalRemainingLessons += settlement.remainingLessons;
    totalRemainingBalance += settlement.remainingBalance;
  }

  const roundedConsumption = Math.round(totalConsumptionAmount * 100) / 100;
  const netIncome = Math.round((roundedConsumption - classCost) * 100) / 100;

  return {
    className,
    subject,
    studentCount: classStudents.length,
    totalPresentCount,
    totalDeductCount,
    totalConsumptionAmount: roundedConsumption,
    classCost,
    netIncome,
    totalRemainingLessons,
    totalRemainingBalance: Math.round(totalRemainingBalance * 100) / 100
  };
}

/**
 * Generates a CSV string from structured data for export.
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent =
    '\uFEFF' + // UTF-8 BOM
    [headers.join(','), ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join(
      '\n'
    );

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
