import * as XLSX from 'xlsx';
import { ClassMonthlyAttendance, AttendanceRecordRow, ClassTypeConfig, StudentEnrollment } from '../types';

export interface ParsedSheetData {
  sheetName: string;
  className: string;
  totalLessons: number;
  rows: AttendanceRecordRow[];
}

/**
 * Parses an Excel file (.xlsx / .xls) with multiple sheets.
 * Each sheet is treated as a class attendance sheet.
 */
export async function parseExcelWorkbook(file: File): Promise<ParsedSheetData[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  const resultSheets: ParsedSheetData[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

    if (!rawRows || rawRows.length === 0) continue;

    // Find header row (row containing student name or numbers)
    let headerRowIndex = 0;
    for (let r = 0; r < Math.min(rawRows.length, 5); r++) {
      const row = rawRows[r];
      if (Array.isArray(row) && row.some((cell) => cell && typeof cell === 'string' && (cell.includes('姓名') || cell.includes('学生') || cell.includes('名字')))) {
        headerRowIndex = r;
        break;
      }
    }

    const headerRow = rawRows[headerRowIndex] || [];
    
    // Find column index for Student Name
    let nameColIndex = 0;
    for (let c = 0; c < headerRow.length; c++) {
      const cellVal = String(headerRow[c] || '').trim();
      if (cellVal.includes('姓名') || cellVal.includes('学生') || cellVal.includes('名字') || cellVal.includes('学员')) {
        nameColIndex = c;
        break;
      }
    }

    // Determine lesson columns starting after name col
    let lessonColIndices: number[] = [];
    for (let c = nameColIndex + 1; c < headerRow.length; c++) {
      const val = String(headerRow[c] || '').trim();
      if (val && !val.includes('操作') && !val.includes('金额') && !val.includes('小计') && !val.includes('备注') && !val.includes('单价')) {
        lessonColIndices.push(c);
      }
    }

    if (lessonColIndices.length === 0) {
      // Fallback: assume columns after nameColIndex are lesson columns (up to 30)
      for (let c = nameColIndex + 1; c < Math.min(headerRow.length, nameColIndex + 25); c++) {
        lessonColIndices.push(c);
      }
    }

    const totalLessons = lessonColIndices.length > 0 ? lessonColIndices.length : 18;

    // Parse student data rows
    const studentRows: AttendanceRecordRow[] = [];

    for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      const rawName = row[nameColIndex];
      if (!rawName) continue;
      const studentName = String(rawName).trim();
      if (!studentName || studentName.includes('合计') || studentName.includes('小计') || studentName.includes('备注')) {
        continue;
      }

      const attendance: string[] = [];
      for (let i = 0; i < totalLessons; i++) {
        const colIdx = lessonColIndices[i];
        const cellValue = colIdx !== undefined ? row[colIdx] : '';
        attendance.push(normalizeAttendanceSymbol(cellValue));
      }

      studentRows.push({
        studentName,
        attendance
      });
    }

    if (studentRows.length > 0) {
      resultSheets.push({
        sheetName: sheetName.trim(),
        className: sheetName.trim(),
        totalLessons,
        rows: studentRows
      });
    }
  }

  return resultSheets;
}

/**
 * Normalizes different Excel attendance cell representations into standard '√', '×', '请假', or ''
 */
function normalizeAttendanceSymbol(val: any): string {
  if (val === undefined || val === null) return '';
  const str = String(val).trim().toUpperCase();

  if (['√', 'V', '1', '1.0', '到', '到课', '出勤', '准时', 'YES', 'Y', 'TRUE'].includes(str)) {
    return '√';
  }
  if (['×', 'X', '0', '0.0', '缺勤', '旷课', 'NO', 'N', 'FALSE'].includes(str)) {
    return '×';
  }
  if (['假', '请假', '2', '2.0', '病假', '事假', 'LEAVE'].includes(str)) {
    return '请假';
  }
  if (str === '') return '';

  return str.length > 0 ? str : '';
}

/**
 * Downloads a multi-sheet Excel template pre-filled with the institution's classes and students.
 */
export function generateAndDownloadExcelTemplate(
  classTypes: ClassTypeConfig[],
  students: StudentEnrollment[],
  month: string
) {
  const wb = XLSX.utils.book_new();

  if (classTypes.length === 0) {
    classTypes = [
      { id: '1', className: '英语高级班', subject: '少儿英语', defaultTotalLessons: 18, defaultFee: 3600, unitPrice: 200 }
    ];
  }

  classTypes.forEach((c) => {
    const classStudents = students.filter(
      (s) => s.className === c.className && s.status === 'active'
    );

    const defaultLessons = c.defaultTotalLessons || 18;
    const headerRow = ['序号', '学生姓名', ...Array.from({ length: defaultLessons }, (_, i) => `第${i + 1}节`)];

    const dataRows = (classStudents.length > 0 ? classStudents : [
      { studentName: '张三' },
      { studentName: '李四' }
    ]).map((s, index) => {
      const rowData: any[] = [index + 1, s.studentName];
      for (let i = 0; i < defaultLessons; i++) {
        rowData.push('√'); // Default prefill checkmark
      }
      return rowData;
    });

    const sheetData = [
      [`【${c.className}】${month}考勤记录表 (填写说明: √=出勤, ×=缺勤, 请假=请假)`],
      headerRow,
      ...dataRows
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, c.className.substring(0, 31)); // Sheet name max length 31
  });

  XLSX.writeFile(wb, `智学教务_多班级月度考勤模版_${month}.xlsx`);
}
