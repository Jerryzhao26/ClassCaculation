import React, { useState, useRef } from 'react';
import {
  StudentEnrollment,
  ClassMonthlyAttendance,
  AttendanceRecordRow,
  ClassTypeConfig
} from '../types';
import {
  Sparkles,
  Upload,
  Plus,
  Trash2,
  Check,
  X,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
  Info,
  Calendar,
  CheckCircle,
  HelpCircle,
  Download,
  Layers,
  Coins
} from 'lucide-react';
import { ExcelImportModal } from './ExcelImportModal';
import { generateAndDownloadExcelTemplate } from '../utils/excelParser';

interface AttendanceManagerProps {
  students: StudentEnrollment[];
  attendanceSheets: ClassMonthlyAttendance[];
  classTypes: ClassTypeConfig[];
  selectedMonth: string;
  currentClassName: string;
  setCurrentClassName: (className: string) => void;
  onSaveSheet: (sheet: ClassMonthlyAttendance) => void;
  onSaveMultipleSheets?: (sheets: ClassMonthlyAttendance[]) => void;
  onNavigateTab: (tab: string) => void;
  onUpdateClassCost?: (month: string, className: string, cost: number) => void;
}

export const AttendanceManager: React.FC<AttendanceManagerProps> = ({
  students,
  attendanceSheets,
  classTypes,
  selectedMonth,
  currentClassName,
  setCurrentClassName,
  onSaveSheet,
  onSaveMultipleSheets,
  onNavigateTab,
  onUpdateClassCost
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<{
    className: string;
    totalLessons: number;
    studentRows: { studentName: string; attendance: string[] }[];
  } | null>(null);

  // Find or initialize attendance sheet for this month and class
  const existingSheet = attendanceSheets.find(
    (s) => s.month === selectedMonth && s.className === currentClassName
  );

  // Registered students for this class
  const classRegisteredStudents = students.filter(
    (s) => s.className === currentClassName && s.status === 'active'
  );

  // Current sheet state
  const [totalColumns, setTotalColumns] = useState<number>(
    existingSheet?.totalLessonColumns || 18
  );

  const [classCost, setClassCost] = useState<number>(
    existingSheet?.classCost || 0
  );

  const [rows, setRows] = useState<AttendanceRecordRow[]>(() => {
    if (existingSheet && existingSheet.rows.length > 0) {
      return existingSheet.rows;
    }
    // Default: initialize from registered students
    return classRegisteredStudents.map((s) => ({
      studentName: s.studentName,
      attendance: Array(18).fill('√')
    }));
  });

  // Re-sync when class or month changes
  React.useEffect(() => {
    if (existingSheet) {
      setTotalColumns(existingSheet.totalLessonColumns);
      setRows(existingSheet.rows);
      setClassCost(existingSheet.classCost || 0);
    } else {
      setTotalColumns(18);
      const newRows = classRegisteredStudents.map((s) => ({
        studentName: s.studentName,
        attendance: Array(18).fill('√')
      }));
      setRows(newRows);
      setClassCost(0);
    }
  }, [currentClassName, selectedMonth, attendanceSheets]);

  // Sync missing students from registered enrollment list
  const handleSyncStudents = () => {
    const existingNames = new Set(rows.map((r) => r.studentName.trim()));
    const missingStudents = classRegisteredStudents.filter(
      (s) => !existingNames.has(s.studentName.trim())
    );

    if (missingStudents.length === 0) {
      alert('所有已报名的学生均已在考勤表中！');
      return;
    }

    const addedRows: AttendanceRecordRow[] = missingStudents.map((s) => ({
      studentName: s.studentName,
      attendance: Array(totalColumns).fill('√')
    }));

    setRows([...rows, ...addedRows]);
  };

  // Toggle attendance state for a cell
  const handleCellClick = (rowIndex: number, colIndex: number) => {
    setRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[rowIndex] };
      const currentAtt = [...row.attendance];
      
      const currentVal = currentAtt[colIndex] || '';
      let newVal = '√';
      if (currentVal === '√') newVal = '×';
      else if (currentVal === '×') newVal = '请假';
      else if (currentVal === '请假') newVal = '';
      else newVal = '√';

      currentAtt[colIndex] = newVal;
      row.attendance = currentAtt;
      updated[rowIndex] = row;
      return updated;
    });
  };

  // Set all students in column or row to '√'
  const handleSetAllPresent = () => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        attendance: Array(totalColumns).fill('√')
      }))
    );
  };

  const handleAddColumn = () => {
    setTotalColumns((prev) => prev + 1);
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        attendance: [...r.attendance, '√']
      }))
    );
  };

  const handleRemoveColumn = () => {
    if (totalColumns <= 1) return;
    setTotalColumns((prev) => prev - 1);
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        attendance: r.attendance.slice(0, -1)
      }))
    );
  };

  const handleAddRow = () => {
    const name = prompt('请输入新增学生姓名:');
    if (!name || !name.trim()) return;
    setRows((prev) => [
      ...prev,
      {
        studentName: name.trim(),
        attendance: Array(totalColumns).fill('√')
      }
    ]);
  };

  const handleDeleteRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const sheetData: ClassMonthlyAttendance = {
      id: existingSheet?.id || `att-${selectedMonth}-${currentClassName}`,
      month: selectedMonth,
      className: currentClassName,
      subject: classRegisteredStudents[0]?.subject || '综合科目',
      totalLessonColumns: totalColumns,
      classCost: Number(classCost) || 0,
      rows,
      isSettled: true,
      updatedAt: new Date().toLocaleString()
    };

    onSaveSheet(sheetData);
    alert(`【${currentClassName}】${selectedMonth} 考勤表与成本核算已保存！`);
  };

  // AI Image Recognition via Server Gemini Endpoint
  const processImageFile = async (file: File) => {
    setIsScanning(true);
    setScanError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;

        const res = await fetch('/api/parse-attendance-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type || 'image/png'
          })
        });

        const json = await res.json();

        if (json.success && json.data) {
          setParsedPreview(json.data);
          setShowAiModal(true);
        } else {
          setScanError(json.error || '解析图片失败');
        }
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setScanError(err?.message || '图片读取失败');
      setIsScanning(false);
    }
  };

  // Test Sample Image parser
  const handleTestSampleAi = async () => {
    setIsScanning(true);
    setScanError(null);

    // Mock realistic AI parse from the user's provided sample image
    setTimeout(() => {
      setParsedPreview({
        className: '英语高级班',
        totalLessons: 18,
        studentRows: [
          { studentName: '王沐安', attendance: Array(18).fill('√') },
          { studentName: '周倬玉', attendance: Array(18).fill('√') },
          { studentName: '谢仕卿', attendance: Array(18).fill('√') },
          { studentName: '高浚钦', attendance: Array(18).fill('√') },
          { 
            studentName: '李育慷', 
            attendance: ['√', '√', '×', '√', '√', '√', '√', '√', '√', '√', '√', '×', '√', '√', '√', '√', '√', '√'] 
          },
          { studentName: '史峻逸', attendance: Array(18).fill('√') },
          { 
            studentName: '陈鼎琨', 
            attendance: ['√', '√', '√', '√', '×', '√', '√', '√', '√', '√', '√', '√', '√', '√', '√', '√', '√', '√'] 
          },
          { studentName: '毛玖玖', attendance: Array(18).fill('√') }
        ]
      });
      setIsScanning(false);
      setShowAiModal(true);
    }, 1200);
  };

  const handleApplyAiData = () => {
    if (!parsedPreview) return;

    if (parsedPreview.className && parsedPreview.className !== '未识别班级') {
      setCurrentClassName(parsedPreview.className);
    }

    setTotalColumns(parsedPreview.totalLessons || 18);
    setRows(
      parsedPreview.studentRows.map((r) => ({
        studentName: r.studentName,
        attendance: r.attendance
      }))
    );

    setShowAiModal(false);
    setParsedPreview(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            <span>月度考勤录入与智能核算</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            {selectedMonth} 学生考勤表 (勾/叉核销)
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            系统根据出勤（√）次数，自动精准检索学员在【<span className="font-bold text-indigo-600">{currentClassName}</span>】的专属单价扣减消课额（如：王沐安在本班190元/节，在数学班180元/节）。
          </p>
        </div>

        {/* Class Selection & Excel / AI Upload buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-xl px-3 py-2 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium mr-2">当前班级:</span>
            <select
              value={currentClassName}
              onChange={(e) => setCurrentClassName(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              {classTypes.map((c) => (
                <option key={c.id} value={c.className}>
                  {c.className} ({c.subject})
                </option>
              ))}
            </select>
          </div>

          {/* Excel Multi-Sheet Import Button (PRIMARY) */}
          <button
            onClick={() => setShowExcelModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl shadow-md shadow-emerald-600/30 transition flex items-center space-x-2 text-xs sm:text-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>导入 Excel 考勤表 (含多Sheet)</span>
          </button>

          {/* Hidden File Input for Image AI */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processImageFile(e.target.files[0]);
              }
            }}
            accept="image/*"
            className="hidden"
          />

          {/* AI Scanner Image Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-xl border border-slate-200 transition flex items-center space-x-1.5 text-xs"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>AI 识别中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>图片识别</span>
              </>
            )}
          </button>
        </div>
      </div>

      {scanError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center justify-between">
          <span>AI识别失败: {scanError}</span>
          <button onClick={() => setScanError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Class Financial Profitability & Cost Control Card */}
      {(() => {
        const totalGrossConsumption = rows.reduce((sum, row) => {
          const student = students.find(
            (s) =>
              s.className === currentClassName &&
              s.studentName.trim().toLowerCase() === row.studentName.trim().toLowerCase()
          );
          const unitPrice =
            student?.unitPrice ||
            classTypes.find((c) => c.className === currentClassName)?.unitPrice ||
            180;
          const presentCount = row.attendance.filter((a) => a === '√').length;
          return sum + presentCount * unitPrice;
        }, 0);

        const roundedGrossConsumption = Math.round(totalGrossConsumption * 100) / 100;
        const currentCost = Number(classCost) || 0;
        const netIncome = Math.round((roundedGrossConsumption - currentCost) * 100) / 100;

        return (
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-5 text-white shadow-md border border-indigo-800/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-indigo-100 flex items-center gap-2">
                  【{currentClassName}】{selectedMonth} 班级成本与实际净收入结算
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  实际净收入 = 课销核算金额（已消课金额） - 班级本月总成本（教师课酬、场地费等）
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3.5 bg-slate-950/60 p-3 rounded-xl border border-indigo-500/30">
              {/* Gross Revenue */}
              <div className="text-right">
                <div className="text-[11px] text-indigo-300 font-medium">1. 课销核算金额(毛收入)</div>
                <div className="text-base font-black text-indigo-200">
                  ¥{roundedGrossConsumption.toLocaleString()}
                </div>
              </div>

              <span className="text-indigo-400 font-bold text-lg">-</span>

              {/* Cost Input */}
              <div className="flex flex-col">
                <label className="text-[11px] text-amber-300 font-bold flex items-center mb-0.5">
                  <span>2. 班级本月总成本(元)</span>
                  <span className="text-[10px] text-indigo-300 font-normal ml-1">(后置/随时输入)</span>
                </label>
                <div className="flex items-center bg-slate-900 border border-amber-400/50 rounded-lg px-2 py-1">
                  <span className="text-xs text-amber-400 font-bold mr-1">¥</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={classCost === 0 ? '' : classCost}
                    onChange={(e) => {
                      const newCost = Math.max(0, Number(e.target.value));
                      setClassCost(newCost);
                      if (onUpdateClassCost) {
                        onUpdateClassCost(selectedMonth, currentClassName, newCost);
                      }
                    }}
                    placeholder="请输入成本"
                    className="w-28 bg-transparent text-sm font-black text-amber-300 focus:outline-none"
                  />
                </div>
              </div>

              <span className="text-indigo-400 font-bold text-lg">=</span>

              {/* Net Income */}
              <div className="text-left pl-2 border-l border-indigo-500/40">
                <div className="text-[11px] text-emerald-300 font-bold">3. 班级实际净收入</div>
                <div className={`text-lg font-black ${netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ¥{netIncome.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Legend & Grid Instructions Bar */}
      <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-white flex items-center">
            <Info className="w-4 h-4 text-indigo-400 mr-1.5" />
            考勤图例点击说明：
          </span>
          <span className="flex items-center space-x-1 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center">√</span>
            <span>出勤 (扣1课时)</span>
          </span>
          <span className="flex items-center space-x-1 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            <span className="w-5 h-5 rounded bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center">×</span>
            <span>缺勤 (不扣课时)</span>
          </span>
          <span className="flex items-center space-x-1 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-300 font-medium text-[11px] flex items-center justify-center">假</span>
            <span>请假 (不扣课时)</span>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSyncStudents}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            从报名名册拉取学生
          </button>
          <button
            onClick={handleSetAllPresent}
            className="bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500/40 transition"
          >
            全员设为全勤(√)
          </button>
          <button
            onClick={handleAddColumn}
            className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-500/40 transition flex items-center"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            加1课次列
          </button>
          {totalColumns > 1 && (
            <button
              onClick={handleRemoveColumn}
              className="bg-rose-900/30 hover:bg-rose-900/50 text-rose-300 px-2.5 py-1.5 rounded-lg border border-rose-700/40 transition"
            >
              减1列
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Attendance Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-3 px-3 text-center w-12 border-r border-slate-200">序号</th>
                <th className="py-3 px-4 min-w-[120px] border-r border-slate-200">学生姓名</th>
                <th className="py-3 px-4 min-w-[180px] border-r border-slate-200">报名匹配单价核算</th>
                
                {/* Lesson columns 1..N */}
                {Array.from({ length: totalColumns }).map((_, i) => (
                  <th
                    key={`col-${i}`}
                    className="py-3 px-1 text-center min-w-[36px] max-w-[42px] border-r border-slate-200 bg-indigo-50/50 text-indigo-900"
                  >
                    {i + 1}
                  </th>
                ))}

                <th className="py-3 px-3 text-center min-w-[80px] border-r border-slate-200 bg-emerald-50 text-emerald-900 font-extrabold">
                  出勤小计
                </th>
                <th className="py-3 px-4 text-right min-w-[110px] bg-indigo-50 text-indigo-950 font-extrabold">
                  当月课销金额
                </th>
                <th className="py-3 px-3 text-center w-16">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {rows.map((row, rIndex) => {
                // Find matching student from registration list
                const regStudent = students.find(
                  (s) =>
                    s.studentName.trim().toLowerCase() === row.studentName.trim().toLowerCase() &&
                    s.className === currentClassName
                );

                const presentCount = row.attendance.filter((a) => a === '√').length;
                const unitPrice = regStudent?.unitPrice || 0;
                const monthConsumption = presentCount * unitPrice;

                return (
                  <tr key={`row-${rIndex}`} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono border-r border-slate-200">
                      {rIndex + 1}
                    </td>

                    {/* Editable Student Name */}
                    <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-200">
                      <input
                        type="text"
                        value={row.studentName}
                        onChange={(e) => {
                          const newName = e.target.value;
                          setRows((prev) => {
                            const updated = [...prev];
                            updated[rIndex].studentName = newName;
                            return updated;
                          });
                        }}
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none font-bold text-slate-900"
                      />
                    </td>

                    {/* Registered Unit Price Status */}
                    <td className="py-2.5 px-4 text-xs border-r border-slate-200">
                      {regStudent ? (
                        <div>
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ¥{regStudent.unitPrice}/节
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            (学费¥{regStudent.tuitionFee} ÷ {regStudent.totalLessons}次)
                          </span>
                        </div>
                      ) : (
                        <div className="text-amber-600 font-medium flex items-center space-x-1" title="未在学员报名库找到此学生记录">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>未匹配学费单价</span>
                        </div>
                      )}
                    </td>

                    {/* Attendance Grid Interactive Cells */}
                    {Array.from({ length: totalColumns }).map((_, cIndex) => {
                      const val = row.attendance[cIndex] || '';
                      return (
                        <td
                          key={`cell-${rIndex}-${cIndex}`}
                          onClick={() => handleCellClick(rIndex, cIndex)}
                          className="py-1 px-0.5 text-center border-r border-slate-200 cursor-pointer select-none hover:bg-indigo-50 transition"
                        >
                          <div className="flex items-center justify-center">
                            {val === '√' && (
                              <span className="w-6 h-6 rounded bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs shadow-xs">
                                √
                              </span>
                            )}
                            {val === '×' && (
                              <span className="w-6 h-6 rounded bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-xs shadow-xs">
                                ×
                              </span>
                            )}
                            {val === '请假' && (
                              <span className="w-6 h-6 rounded bg-amber-100 text-amber-800 font-medium text-[10px] flex items-center justify-center shadow-xs">
                                假
                              </span>
                            )}
                            {!val && (
                              <span className="w-6 h-6 rounded hover:bg-slate-200/50 text-slate-300 flex items-center justify-center text-xs">
                                -
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Present Count Subtotal */}
                    <td className="py-2.5 px-3 text-center border-r border-slate-200 bg-emerald-50/50 font-extrabold text-emerald-700">
                      {presentCount} 节
                    </td>

                    {/* Monthly Revenue Calculated */}
                    <td className="py-2.5 px-4 text-right bg-indigo-50/50 font-black text-indigo-700">
                      ¥{monthConsumption.toLocaleString()}
                    </td>

                    {/* Delete Row */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDeleteRow(rIndex)}
                        className="text-slate-400 hover:text-rose-600 transition"
                        title="删除该行"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={totalColumns + 5} className="py-12 text-center text-slate-400">
                    暂无考勤数据，请点击上方“从报名名册拉取”或“上传考勤图片AI识别”
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={handleAddRow}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 px-3 py-2 rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>手动添加学生行</span>
          </button>

          <div className="flex items-center space-x-4">
            <div className="text-right text-xs">
              <span className="text-slate-500">本表包含学生: </span>
              <span className="font-bold text-slate-900">{rows.length}人</span>
              <span className="text-slate-300 mx-2">|</span>
              <span className="text-slate-500">累计消课总节数: </span>
              <span className="font-bold text-emerald-600">
                {rows.reduce((sum, r) => sum + r.attendance.filter((a) => a === '√').length, 0)}节
              </span>
            </div>

            <button
              onClick={handleSave}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-indigo-600/30 transition flex items-center space-x-2 text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              <span>保存并核算本月课销</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Recognized Preview Modal */}
      {showAiModal && parsedPreview && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-emerald-600 font-bold text-base">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <span>AI 考勤表识别结果确认</span>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">识别班级名称:</span>
                <span className="font-bold text-slate-900">{parsedPreview.className}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">识别课次总节数:</span>
                <span className="font-bold text-indigo-600">{parsedPreview.totalLessons} 列</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">识别学生人数:</span>
                <span className="font-bold text-emerald-600">{parsedPreview.studentRows.length} 人</span>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-bold text-slate-700 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">学生姓名</th>
                    <th className="py-2 px-3 text-center">识别出勤节数 (√)</th>
                    <th className="py-2 px-3 text-center">缺勤/未测次 (×)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedPreview.studentRows.map((r, i) => {
                    const presents = r.attendance.filter((a) => a === '√').length;
                    const absents = r.attendance.filter((a) => a === '×' || a === '请假').length;
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-bold text-slate-900">{r.studentName}</td>
                        <td className="py-2 px-3 text-center text-emerald-600 font-bold">{presents} 节</td>
                        <td className="py-2 px-3 text-center text-rose-600">{absents} 节</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold"
              >
                取消
              </button>
              <button
                onClick={handleApplyAiData}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center space-x-1"
              >
                <Check className="w-4 h-4" />
                <span>确认导入该考勤表</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Multi-Sheet Import Modal */}
      <ExcelImportModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        selectedMonth={selectedMonth}
        classTypes={classTypes}
        students={students}
        onImportMultipleSheets={(sheets) => {
          if (onSaveMultipleSheets) {
            onSaveMultipleSheets(sheets);
          } else {
            sheets.forEach((s) => onSaveSheet(s));
          }
        }}
      />
    </div>
  );
};
