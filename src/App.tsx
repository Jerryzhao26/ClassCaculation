import React, { useState, useEffect } from 'react';
import {
  StudentEnrollment,
  ClassMonthlyAttendance,
  ClassTypeConfig
} from './types';
import {
  INITIAL_CLASS_TYPES,
  INITIAL_STUDENTS,
  INITIAL_ATTENDANCE_SHEETS
} from './initialData';
import { calculateStudentSettlement } from './utils/calc';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { AttendanceManager } from './components/AttendanceManager';
import { StudentManager } from './components/StudentManager';
import { ClassTypeManager } from './components/ClassTypeManager';
import { SettlementReport } from './components/SettlementReport';
import { ConfirmModal } from './components/ConfirmModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [currentClassName, setCurrentClassName] = useState('英语高级班');
  const [isInitModalOpen, setIsInitModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Auto hide toast
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // Persistence State
  const [classTypes, setClassTypes] = useState<ClassTypeConfig[]>(() => {
    const saved = localStorage.getItem('zhixue_class_types');
    return saved ? JSON.parse(saved) : INITIAL_CLASS_TYPES;
  });

  const [students, setStudents] = useState<StudentEnrollment[]>(() => {
    const saved = localStorage.getItem('zhixue_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [attendanceSheets, setAttendanceSheets] = useState<ClassMonthlyAttendance[]>(() => {
    const saved = localStorage.getItem('zhixue_attendance_sheets');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE_SHEETS;
  });

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('zhixue_class_types', JSON.stringify(classTypes));
  }, [classTypes]);

  useEffect(() => {
    localStorage.setItem('zhixue_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('zhixue_attendance_sheets', JSON.stringify(attendanceSheets));
  }, [attendanceSheets]);

  // Export Local Backup JSON
  const handleExportBackup = () => {
    const backupData = {
      appName: '珞珞的珈课销核算系统',
      version: '1.0',
      exportTime: new Date().toLocaleString(),
      selectedMonth,
      classTypes,
      students,
      attendanceSheets
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `珞珞的珈课销核算系统_全量数据备份_${selectedMonth}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import Local Backup JSON
  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        let restoredCount = 0;

        if (data.students && Array.isArray(data.students)) {
          setStudents(data.students);
          restoredCount += data.students.length;
        }
        if (data.classTypes && Array.isArray(data.classTypes)) {
          setClassTypes(data.classTypes);
        }
        if (data.attendanceSheets && Array.isArray(data.attendanceSheets)) {
          setAttendanceSheets(data.attendanceSheets);
        }
        if (data.selectedMonth) {
          setSelectedMonth(data.selectedMonth);
        }

        alert(`数据备份成功恢复！已同步 ${restoredCount} 条学生档案与相关月度考勤表。`);
      } catch (err: any) {
        alert(`解析备份文件失败: ${err?.message || '文件格式不正确'}`);
      }
    };
    reader.readAsText(file);
  };

  // Initialize (Clear All Existing Data)
  const handleInitializeData = () => {
    setIsInitModalOpen(true);
  };

  const executeInitializeData = () => {
    setClassTypes([]);
    setStudents([]);
    setAttendanceSheets([]);
    setCurrentClassName('');
    localStorage.setItem('zhixue_class_types', JSON.stringify([]));
    localStorage.setItem('zhixue_students', JSON.stringify([]));
    localStorage.setItem('zhixue_attendance_sheets', JSON.stringify([]));
    setToastMsg('系统已被初始化，已有学生、班型和考勤数据已全部清空。');
  };

  // Handlers for Student CRUD
  const handleAddStudent = (newStudent: StudentEnrollment) => {
    setStudents((prev) => [newStudent, ...prev]);
  };

  const handleBatchAddStudents = (newStudents: StudentEnrollment[]) => {
    setStudents((prev) => [...newStudents, ...prev]);
  };

  const handleUpdateStudent = (updated: StudentEnrollment) => {
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  // Handlers for Class Type CRUD
  const handleAddClassType = (newClass: ClassTypeConfig) => {
    setClassTypes((prev) => [...prev, newClass]);
  };

  const handleUpdateClassType = (updated: ClassTypeConfig) => {
    setClassTypes((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleDeleteClassType = (id: string) => {
    setClassTypes((prev) => prev.filter((c) => c.id !== id));
  };

  // Handlers for Attendance Save
  const handleSaveAttendanceSheet = (savedSheet: ClassMonthlyAttendance) => {
    setAttendanceSheets((prev) => {
      const index = prev.findIndex(
        (s) => s.month === savedSheet.month && s.className === savedSheet.className
      );
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = savedSheet;
        return updated;
      }
      return [savedSheet, ...prev];
    });
  };

  const handleSaveMultipleSheets = (savedSheets: ClassMonthlyAttendance[]) => {
    setAttendanceSheets((prev) => {
      let updated = [...prev];
      savedSheets.forEach((sheet) => {
        const index = updated.findIndex(
          (s) => s.month === sheet.month && s.className === sheet.className
        );
        if (index >= 0) {
          updated[index] = sheet;
        } else {
          updated.unshift(sheet);
        }
      });
      return updated;
    });
  };

  // Handler for Updating Class Monthly Cost Anytime
  const handleUpdateClassCost = (month: string, className: string, cost: number) => {
    setAttendanceSheets((prev) => {
      const index = prev.findIndex(
        (s) => s.month === month && s.className === className
      );
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = { ...updated[index], classCost: cost, updatedAt: new Date().toLocaleString() };
        return updated;
      } else {
        const classStudents = students.filter((s) => s.className === className);
        const subject = classStudents[0]?.subject || '综合科目';
        const newSheet: ClassMonthlyAttendance = {
          id: `att-${month}-${className}`,
          month,
          className,
          subject,
          totalLessonColumns: 18,
          classCost: cost,
          rows: [],
          isSettled: true,
          updatedAt: new Date().toLocaleString()
        };
        return [newSheet, ...prev];
      }
    });
  };

  // Navigation Helper
  const handleNavigateTab = (tab: string, className?: string) => {
    if (className) {
      setCurrentClassName(className);
    }
    setActiveTab(tab);
  };

  // Low balance student count for badge
  const lowBalanceCount = students.filter(
    (s) => s.status === 'active' && calculateStudentSettlement(s, selectedMonth, attendanceSheets).isLowBalance
  ).length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        onInitializeData={handleInitializeData}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        lowBalanceCount={lowBalanceCount}
      />

      <main className="flex-1 pb-16">
        {activeTab === 'dashboard' && (
          <Dashboard
            students={students}
            attendanceSheets={attendanceSheets}
            classTypes={classTypes}
            selectedMonth={selectedMonth}
            onNavigateTab={handleNavigateTab}
            onUpdateClassCost={handleUpdateClassCost}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceManager
            students={students}
            attendanceSheets={attendanceSheets}
            classTypes={classTypes}
            selectedMonth={selectedMonth}
            currentClassName={currentClassName}
            setCurrentClassName={setCurrentClassName}
            onSaveSheet={handleSaveAttendanceSheet}
            onSaveMultipleSheets={handleSaveMultipleSheets}
            onNavigateTab={handleNavigateTab}
            onUpdateClassCost={handleUpdateClassCost}
          />
        )}

        {activeTab === 'settlement' && (
          <SettlementReport
            students={students}
            attendanceSheets={attendanceSheets}
            classTypes={classTypes}
            selectedMonth={selectedMonth}
          />
        )}

        {activeTab === 'students' && (
          <StudentManager
            students={students}
            classTypes={classTypes}
            attendanceSheets={attendanceSheets}
            selectedMonth={selectedMonth}
            onAddStudent={handleAddStudent}
            onBatchAddStudents={handleBatchAddStudents}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        )}

        {activeTab === 'classes' && (
          <ClassTypeManager
            classTypes={classTypes}
            onAddClassType={handleAddClassType}
            onUpdateClassType={handleUpdateClassType}
            onDeleteClassType={handleDeleteClassType}
          />
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 text-xs py-4 px-6 text-center border-t border-slate-800 print:hidden">
        <p>珞珞的珈课销核算系统 · 班型课销精算管理 © 2026</p>
      </footer>

      {/* Confirmation Modal for System Initialization */}
      <ConfirmModal
        isOpen={isInitModalOpen}
        onClose={() => setIsInitModalOpen(false)}
        onConfirm={executeInitializeData}
        title="初始化系统确认"
        description="确定要初始化系统并清空所有已有数据吗？此操作将彻底删除所有已录入的学生档案、学费缴费记录、班型单价配置以及各月份考勤销课记录，清空后数据无法恢复。"
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center space-x-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
