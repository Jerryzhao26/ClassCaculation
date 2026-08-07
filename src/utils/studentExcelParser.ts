import * as XLSX from 'xlsx';
import { StudentEnrollment, ClassTypeConfig } from '../types';

export interface ParsedStudentRow {
  studentName: string;
  className: string;
  subject: string;
  tuitionFee: number;
  totalLessons: number;
  unitPrice: number;
  enrollmentDate: string;
  note: string;
  isValid: boolean;
  errorMsg?: string;
}

/**
 * Parses an Excel file (.xlsx / .xls) containing student enrollment records.
 * Supports multiple sheets or single sheet.
 */
export async function parseStudentExcelWorkbook(
  file: File,
  classTypes: ClassTypeConfig[]
): Promise<ParsedStudentRow[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  const parsedStudents: ParsedStudentRow[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

    if (!rawRows || rawRows.length === 0) continue;

    // Find header row
    let headerRowIndex = -1;
    for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
      const row = rawRows[r];
      if (
        Array.isArray(row) &&
        row.some(
          (cell) =>
            cell &&
            typeof cell === 'string' &&
            (cell.includes('姓名') || cell.includes('学生') || cell.includes('学员'))
        )
      ) {
        headerRowIndex = r;
        break;
      }
    }

    // If no header found, assume row 0 is header
    if (headerRowIndex === -1) headerRowIndex = 0;

    const headerRow = (rawRows[headerRowIndex] || []).map((c) => String(c || '').trim());

    // Map column indices
    let nameCol = headerRow.findIndex((c) => c.includes('姓名') || c.includes('学生') || c.includes('学员'));
    let classCol = headerRow.findIndex((c) => c.includes('班级') || c.includes('班型') || c.includes('课程'));
    let subjectCol = headerRow.findIndex((c) => c.includes('科目') || c.includes('学科'));
    let feeCol = headerRow.findIndex((c) => c.includes('学费') || c.includes('金额') || c.includes('费用') || c.includes('总价'));
    let lessonsCol = headerRow.findIndex((c) => c.includes('课次') || c.includes('课时') || c.includes('购买次数'));
    let priceCol = headerRow.findIndex((c) => c.includes('单价') || c.includes('课价') || c.includes('每节'));
    let dateCol = headerRow.findIndex((c) => c.includes('日期') || c.includes('时间') || c.includes('报名'));
    let noteCol = headerRow.findIndex((c) => c.includes('备注') || c.includes('说明'));

    // Fallback if sheet name itself is a class name and classCol wasn't found
    const defaultClassNameFromSheet = sheetName.trim();

    for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      const rawName = nameCol >= 0 ? row[nameCol] : row[0];
      if (!rawName) continue;
      const studentName = String(rawName).trim();
      if (!studentName || studentName.includes('示例') || studentName.includes('合计') || studentName.includes('说明')) {
        continue;
      }

      // Class Name
      let className = classCol >= 0 && row[classCol] ? String(row[classCol]).trim() : defaultClassNameFromSheet;
      if (!className || className === 'Sheet1' || className === '工作表1') {
        className = classTypes[0]?.className || '通用课程班';
      }

      // Match class subject
      const matchingClassConfig = classTypes.find((c) => c.className === className);

      // Subject
      let subject = subjectCol >= 0 && row[subjectCol] ? String(row[subjectCol]).trim() : matchingClassConfig?.subject || '综合科目';

      // Tuition Fee
      const rawFee = feeCol >= 0 ? row[feeCol] : null;
      const tuitionFee = rawFee !== null && rawFee !== undefined && !isNaN(Number(rawFee)) ? Math.max(0, Number(rawFee)) : matchingClassConfig?.defaultFee || 3600;

      // Total Lessons
      const rawLessons = lessonsCol >= 0 ? row[lessonsCol] : null;
      const totalLessons = rawLessons !== null && rawLessons !== undefined && !isNaN(Number(rawLessons)) ? Math.max(1, Number(rawLessons)) : matchingClassConfig?.defaultTotalLessons || 20;

      // Unit Price
      const rawPrice = priceCol >= 0 ? row[priceCol] : null;
      let unitPrice = 0;
      if (rawPrice !== null && rawPrice !== undefined && !isNaN(Number(rawPrice)) && Number(rawPrice) > 0) {
        unitPrice = Number(rawPrice);
      } else {
        unitPrice = totalLessons > 0 ? Math.round((tuitionFee / totalLessons) * 100) / 100 : 180;
      }

      // Date
      let enrollmentDate = dateCol >= 0 && row[dateCol] ? String(row[dateCol]).trim() : new Date().toISOString().split('T')[0];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(enrollmentDate)) {
        enrollmentDate = new Date().toISOString().split('T')[0];
      }

      // Note
      const note = noteCol >= 0 && row[noteCol] ? String(row[noteCol]).trim() : '';

      parsedStudents.push({
        studentName,
        className,
        subject,
        tuitionFee,
        totalLessons,
        unitPrice,
        enrollmentDate,
        note,
        isValid: Boolean(studentName && className && tuitionFee > 0 && totalLessons > 0)
      });
    }
  }

  return parsedStudents;
}

/**
 * Downloads a standardized Student Enrollment Excel Template file.
 */
export function generateStudentEnrollmentTemplate(classTypes: ClassTypeConfig[]) {
  const wb = XLSX.utils.book_new();

  const headers = [
    '序号',
    '学生姓名(*必填)',
    '报读班级(*必填)',
    '所属科目',
    '缴纳学费(*元)',
    '购买课次(*节)',
    '消课单价(元/节,留空自动按学费÷课次计算)',
    '报名日期(YYYY-MM-DD)',
    '备注信息'
  ];

  const sampleData = [
    [1, '王沐安', classTypes[0]?.className || '英语高级班', classTypes[0]?.subject || '少儿英语', 3800, 20, 190, '2026-07-28', '英语专属190元/节'],
    [2, '周倬玉', classTypes[0]?.className || '英语高级班', classTypes[0]?.subject || '少儿英语', 3600, 20, 180, '2026-07-28', '标准学费报名'],
    [3, '王沐安', classTypes[1]?.className || '数学思维一班', classTypes[1]?.subject || '思维数学', 2880, 16, 180, '2026-07-28', '数学专属180元/节']
  ];

  const sheetData = [
    ['【智学教务】学生报名学费批量导入模版 (请保留表头列名，填好后上传)'],
    headers,
    ...sampleData
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 32 },
    { wch: 16 },
    { wch: 24 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, '学员报名明细');
  XLSX.writeFile(wb, `智学教务_学员报名学费导入模版.xlsx`);
}
