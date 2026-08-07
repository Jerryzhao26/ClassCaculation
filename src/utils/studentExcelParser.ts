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
 * Safely parse numbers from string or Excel values (e.g., "3,800元" -> 3800)
 */
function parseCleanNumber(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const cleaned = String(val).replace(/[^\d.]/g, '');
  if (!cleaned) return null;
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Safely parse Excel date serials or strings into YYYY-MM-DD format
 */
function parseExcelDate(val: any): string {
  if (!val) return new Date().toISOString().split('T')[0];
  if (typeof val === 'number') {
    // Excel date serial number (epoch Dec 30 1899)
    const dateObj = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split('T')[0];
    }
  }
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      return val.toISOString().split('T')[0];
    }
  }
  const str = String(val).trim();
  const match = str.match(/(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  if (match) {
    const y = match[1];
    const m = match[2].padStart(2, '0');
    const d = match[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return new Date().toISOString().split('T')[0];
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

    // Find the actual header row by scoring rows based on column name matches
    let bestHeaderRowIndex = -1;
    let maxScore = -1;

    for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
      const row = rawRows[r];
      if (!Array.isArray(row) || row.length <= 1) continue; // Ignore banner title rows with 1 cell

      const rowStr = row.map((c) => String(c || '').trim()).join(' ');
      
      // Skip title banner rows
      if (rowStr.includes('模版') || rowStr.includes('批量导入') || rowStr.includes('请保留表头')) {
        continue;
      }

      let score = 0;
      if (rowStr.includes('姓名') || rowStr.includes('学员') || rowStr.includes('学生')) score += 2;
      if (rowStr.includes('班级') || rowStr.includes('班型') || rowStr.includes('课程')) score += 2;
      if (rowStr.includes('科目') || rowStr.includes('学科')) score += 1;
      if (rowStr.includes('学费') || rowStr.includes('金额') || rowStr.includes('费用')) score += 2;
      if (rowStr.includes('课次') || rowStr.includes('课时') || rowStr.includes('次数')) score += 2;
      if (rowStr.includes('单价') || rowStr.includes('每节')) score += 1;
      if (rowStr.includes('日期') || rowStr.includes('报名')) score += 1;
      if (rowStr.includes('备注')) score += 1;

      if (score > maxScore) {
        maxScore = score;
        bestHeaderRowIndex = r;
      }
    }

    const headerRowIndex = bestHeaderRowIndex >= 0 ? bestHeaderRowIndex : 0;
    const headerRow = (rawRows[headerRowIndex] || []).map((c) => String(c || '').trim());

    // Map column indices
    let nameCol = headerRow.findIndex(
      (c) => c.includes('姓名') || c.includes('学员') || (c.includes('学生') && !c.includes('模版') && !c.includes('教务'))
    );
    let classCol = headerRow.findIndex((c) => c.includes('班级') || c.includes('班型') || c.includes('课程'));
    let subjectCol = headerRow.findIndex((c) => c.includes('科目') || c.includes('学科'));
    let feeCol = headerRow.findIndex(
      (c) => c.includes('学费') || c.includes('金额') || c.includes('费用') || c.includes('总价')
    );
    let lessonsCol = headerRow.findIndex(
      (c) => c.includes('课次') || c.includes('课时') || c.includes('购买次数') || c.includes('次数')
    );
    let priceCol = headerRow.findIndex((c) => c.includes('单价') || c.includes('课价') || c.includes('每节'));
    let dateCol = headerRow.findIndex((c) => c.includes('日期') || c.includes('时间') || c.includes('报名'));
    let noteCol = headerRow.findIndex((c) => c.includes('备注') || c.includes('说明'));

    // If nameCol wasn't found by exact keyword, search for second column if index 0 is "序号"
    if (nameCol === -1 && headerRow.length > 1) {
      if (headerRow[0].includes('序号') || headerRow[0] === 'ID') {
        nameCol = 1;
      } else {
        nameCol = 0;
      }
    }

    // Fallback default class name from Sheet title
    const defaultClassNameFromSheet = sheetName.trim();

    for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      const rawName = nameCol >= 0 ? row[nameCol] : row[0];
      if (!rawName) continue;

      const studentName = String(rawName).trim();

      // Skip invalid / header / instruction / sample keywords
      if (
        !studentName ||
        studentName === '序号' ||
        studentName === '学生姓名' ||
        studentName === '学员姓名' ||
        studentName.includes('示例') ||
        studentName.includes('合计') ||
        studentName.includes('小计') ||
        studentName.includes('说明') ||
        studentName.includes('注：')
      ) {
        continue;
      }

      // Class Name
      let className = classCol >= 0 && row[classCol] ? String(row[classCol]).trim() : defaultClassNameFromSheet;
      if (!className || className === 'Sheet1' || className === '工作表1' || className === '学员报名明细') {
        className = classTypes[0]?.className || '英语高级班';
      }

      // Match class subject
      const matchingClassConfig = classTypes.find((c) => c.className === className);

      // Subject
      let subject = subjectCol >= 0 && row[subjectCol] ? String(row[subjectCol]).trim() : matchingClassConfig?.subject || '综合科目';

      // Tuition Fee
      const rawFee = feeCol >= 0 ? row[feeCol] : null;
      const parsedFee = parseCleanNumber(rawFee);
      const tuitionFee = parsedFee !== null && parsedFee > 0 ? parsedFee : matchingClassConfig?.defaultFee || 3600;

      // Total Lessons
      const rawLessons = lessonsCol >= 0 ? row[lessonsCol] : null;
      const parsedLessons = parseCleanNumber(rawLessons);
      const totalLessons = parsedLessons !== null && parsedLessons > 0 ? parsedLessons : matchingClassConfig?.defaultTotalLessons || 20;

      // Unit Price
      const rawPrice = priceCol >= 0 ? row[priceCol] : null;
      const parsedPrice = parseCleanNumber(rawPrice);
      let unitPrice = 0;
      if (parsedPrice !== null && parsedPrice > 0) {
        unitPrice = parsedPrice;
      } else {
        unitPrice = totalLessons > 0 ? Math.round((tuitionFee / totalLessons) * 100) / 100 : 180;
      }

      // Date
      const enrollmentDate = parseExcelDate(dateCol >= 0 ? row[dateCol] : null);

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
    ['【珞珞的珈课销】学生报名学费批量导入模版 (请保留表头列名，填好后上传)'],
    headers,
    ...sampleData
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 20 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 36 },
    { wch: 18 },
    { wch: 24 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, '学员报名明细');
  XLSX.writeFile(wb, `珞珞的珈课销_学员报名学费导入模版.xlsx`);
}
