import { ClassTypeConfig, StudentEnrollment, ClassMonthlyAttendance } from './types';

export const INITIAL_CLASS_TYPES: ClassTypeConfig[] = [
  {
    id: 'c1',
    className: '英语高级班',
    subject: '少儿英语',
    defaultTotalLessons: 20,
    defaultFee: 3600,
    unitPrice: 180,
    note: '包含18次正式课+2次复习评估课'
  },
  {
    id: 'c2',
    className: '数学思维一班',
    subject: '思维数学',
    defaultTotalLessons: 16,
    defaultFee: 3200,
    unitPrice: 200,
    note: '逻辑思维训练中级课程'
  },
  {
    id: 'c3',
    className: '少儿美术精品班',
    subject: '艺术美术',
    defaultTotalLessons: 12,
    defaultFee: 2160,
    unitPrice: 180,
    note: '创意绘画与色彩表达'
  }
];

export const INITIAL_STUDENTS: StudentEnrollment[] = [
  // Student A: 王沐安 - enrolled in English (190/lesson) and Math (180/lesson)
  {
    id: 's1-eng',
    studentName: '王沐安',
    className: '英语高级班',
    subject: '少儿英语',
    tuitionFee: 3800,
    totalLessons: 20,
    unitPrice: 190,
    enrollmentDate: '2026-07-28',
    status: 'active',
    note: '英语1班专属单价190元/节'
  },
  {
    id: 's1-math',
    studentName: '王沐安',
    className: '数学思维一班',
    subject: '思维数学',
    tuitionFee: 2880,
    totalLessons: 16,
    unitPrice: 180,
    enrollmentDate: '2026-07-28',
    status: 'active',
    note: '数学2班专属单价180元/节'
  },
  // Student B: 周倬玉 - enrolled in English (180/lesson) and Math (180/lesson)
  {
    id: 's2-eng',
    studentName: '周倬玉',
    className: '英语高级班',
    subject: '少儿英语',
    tuitionFee: 3600,
    totalLessons: 20,
    unitPrice: 180,
    enrollmentDate: '2026-07-28',
    status: 'active',
    note: '英语1班专属单价180元/节'
  },
  {
    id: 's2-math',
    studentName: '周倬玉',
    className: '数学思维一班',
    subject: '思维数学',
    tuitionFee: 2880,
    totalLessons: 16,
    unitPrice: 180,
    enrollmentDate: '2026-07-28',
    status: 'active',
    note: '数学2班专属单价180元/节'
  },
  {
    id: 's3',
    studentName: '谢仕卿',
    className: '英语高级班',
    subject: '少儿英语',
    tuitionFee: 4000,
    totalLessons: 20,
    unitPrice: 200,
    enrollmentDate: '2026-07-29',
    status: 'active',
    note: 'VIP定制学费200元/节'
  },
  {
    id: 's4',
    studentName: '高浚钦',
    className: '英语高级班',
    subject: '少儿英语',
    tuitionFee: 3600,
    totalLessons: 20,
    unitPrice: 180,
    enrollmentDate: '2026-07-29',
    status: 'active'
  },
  {
    id: 's5',
    studentName: '李育慷',
    className: '英语高级班',
    subject: '少儿英语',
    tuitionFee: 3600,
    totalLessons: 20,
    unitPrice: 180,
    enrollmentDate: '2026-07-30',
    status: 'active'
  },
  {
    id: 's6',
    studentName: '史峻逸',
    className: '英语高级班',
    subject: '少儿英语',
    tuitionFee: 3600,
    totalLessons: 20,
    unitPrice: 180,
    enrollmentDate: '2026-07-30',
    status: 'active'
  },
  {
    id: 's7',
    studentName: '陈鼎琨',
    className: '英语高级班',
    subject: '少儿英语',
    tuitionFee: 3600,
    totalLessons: 20,
    unitPrice: 180,
    enrollmentDate: '2026-07-31',
    status: 'active'
  },
  {
    id: 's8',
    studentName: '毛玖玖',
    className: '英语高级班',
    subject: '少儿英语',
    tuitionFee: 3600,
    totalLessons: 20,
    unitPrice: 180,
    enrollmentDate: '2026-07-31',
    status: 'active'
  },
  // Math Class Students
  {
    id: 's9',
    studentName: '林之航',
    className: '数学思维一班',
    subject: '思维数学',
    tuitionFee: 3200,
    totalLessons: 16,
    unitPrice: 200,
    enrollmentDate: '2026-08-01',
    status: 'active'
  },
  {
    id: 's10',
    studentName: '张梓涵',
    className: '数学思维一班',
    subject: '思维数学',
    tuitionFee: 3200,
    totalLessons: 16,
    unitPrice: 200,
    enrollmentDate: '2026-08-01',
    status: 'active'
  },
  {
    id: 's11',
    studentName: '陆依晨',
    className: '数学思维一班',
    subject: '思维数学',
    tuitionFee: 3200,
    totalLessons: 16,
    unitPrice: 200,
    enrollmentDate: '2026-08-02',
    status: 'active'
  }
];

const makeArray = (length: number, defaultVal: string) => Array(length).fill(defaultVal);

export const INITIAL_ATTENDANCE_SHEETS: ClassMonthlyAttendance[] = [
  {
    id: 'att-202608-eng',
    month: '2026-08',
    className: '英语高级班',
    subject: '少儿英语',
    totalLessonColumns: 18,
    classCost: 3200, // 教师月薪与课酬总成本
    isSettled: true,
    updatedAt: '2026-08-31 18:00',
    rows: [
      { studentName: '王沐安', attendance: makeArray(18, '√') },
      { studentName: '周倬玉', attendance: makeArray(18, '√') },
      { studentName: '谢仕卿', attendance: makeArray(18, '√') },
      { studentName: '高浚钦', attendance: makeArray(18, '√') },
      { 
        studentName: '李育慷', 
        attendance: ['√', '√', '×', '√', '√', '√', '√', '√', '√', '√', '√', '×', '√', '√', '√', '√', '√', '√'] 
      },
      { studentName: '史峻逸', attendance: makeArray(18, '√') },
      { 
        studentName: '陈鼎琨', 
        attendance: ['√', '√', '√', '√', '×', '√', '√', '√', '√', '√', '√', '√', '√', '√', '√', '√', '√', '√'] 
      },
      { studentName: '毛玖玖', attendance: makeArray(18, '√') }
    ]
  },
  {
    id: 'att-202608-math',
    month: '2026-08',
    className: '数学思维一班',
    subject: '思维数学',
    totalLessonColumns: 12,
    classCost: 2000, // 教师月薪与课酬总成本
    isSettled: true,
    updatedAt: '2026-08-31 18:30',
    rows: [
      { studentName: '王沐安', attendance: makeArray(12, '√') },
      { studentName: '周倬玉', attendance: makeArray(12, '√') },
      { studentName: '林之航', attendance: makeArray(12, '√') },
      { studentName: '张梓涵', attendance: ['√', '√', '√', '√', '√', '×', '√', '√', '√', '√', '√', '√'] },
      { studentName: '陆依晨', attendance: makeArray(12, '√') }
    ]
  }
];
