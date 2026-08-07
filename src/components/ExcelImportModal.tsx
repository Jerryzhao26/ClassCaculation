import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Layers,
  Users
} from 'lucide-react';
import { parseExcelWorkbook, generateAndDownloadExcelTemplate, ParsedSheetData } from '../utils/excelParser';
import { ClassTypeConfig, StudentEnrollment, ClassMonthlyAttendance } from '../types';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string;
  classTypes: ClassTypeConfig[];
  students: StudentEnrollment[];
  onImportMultipleSheets: (sheets: ClassMonthlyAttendance[]) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  classTypes,
  students,
  onImportMultipleSheets
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedSheets, setParsedSheets] = useState<ParsedSheetData[]>([]);
  const [selectedSheetIndices, setSelectedSheetIndices] = useState<number[]>([]);
  const [activeSheetTab, setActiveSheetTab] = useState(0);
  const [sheetCosts, setSheetCosts] = useState<Record<number, number>>({});

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg(null);
    setFileName(file.name);

    try {
      const sheets = await parseExcelWorkbook(file);
      if (sheets.length === 0) {
        setErrorMsg('未能解析到有效考勤Sheet页，请检查Excel文件格式。');
        setParsedSheets([]);
        setSelectedSheetIndices([]);
        setSheetCosts({});
      } else {
        setParsedSheets(sheets);
        // Select all sheets by default
        setSelectedSheetIndices(sheets.map((_, i) => i));
        setActiveSheetTab(0);
        
        // Initialize costs from existing attendanceSheets if available
        const initialCosts: Record<number, number> = {};
        sheets.forEach((s, idx) => {
          initialCosts[idx] = 0;
        });
        setSheetCosts(initialCosts);
      }
    } catch (err: any) {
      setErrorMsg(`读取Excel文件出错: ${err?.message || '文件损坏或格式不支持'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSheetSelect = (index: number) => {
    if (selectedSheetIndices.includes(index)) {
      setSelectedSheetIndices(selectedSheetIndices.filter((i) => i !== index));
    } else {
      setSelectedSheetIndices([...selectedSheetIndices, index]);
    }
  };

  const handleConfirmImport = () => {
    if (selectedSheetIndices.length === 0) {
      alert('请至少选择一个工作表Sheet进行导入！');
      return;
    }

    const attendanceSheetsToImport: ClassMonthlyAttendance[] = selectedSheetIndices.map((idx) => {
      const parsed = parsedSheets[idx];
      const matchingClass = classTypes.find((c) => c.className === parsed.className);
      const cost = sheetCosts[idx] || 0;

      return {
        id: `att-${selectedMonth}-${parsed.className}`,
        month: selectedMonth,
        className: parsed.className,
        subject: matchingClass?.subject || '综合科目',
        totalLessonColumns: parsed.totalLessons,
        classCost: cost,
        rows: parsed.rows,
        isSettled: true,
        updatedAt: new Date().toLocaleString()
      };
    });

    onImportMultipleSheets(attendanceSheetsToImport);
    alert(`成功批量导入/覆盖 ${attendanceSheetsToImport.length} 个班级的月度考勤数据！`);
    onClose();
  };

  const activeSheet = parsedSheets[activeSheetTab];

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                Excel 多 Sheet 班级考勤数据导入
              </h3>
              <p className="text-xs text-slate-500">
                支持一次性读取包含多个班级 Sheet 页的 `.xlsx` / `.xls` 考勤表
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Zone & Template DL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 border-2 border-dashed border-emerald-200 bg-emerald-50/40 rounded-2xl p-5 text-center flex flex-col items-center justify-center hover:bg-emerald-50/70 transition cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls"
              className="hidden"
            />
            <Upload className="w-8 h-8 text-emerald-600 mb-2 animate-bounce" />
            <span className="font-bold text-slate-900 text-sm">
              {fileName ? `已选择文件: ${fileName}` : '点击或拖拽上传 Excel 多Sheet考勤文件'}
            </span>
            <span className="text-xs text-slate-500 mt-1">
              自动识别每个 Sheet 工作表对应的班级名称与学生勾/叉打卡状态
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between text-xs space-y-3">
            <div>
              <div className="font-bold text-slate-900 mb-1 flex items-center">
                <HelpCircle className="w-4 h-4 text-indigo-600 mr-1" />
                表格模板规范说明:
              </div>
              <ul className="text-slate-600 space-y-1 list-disc list-inside">
                <li>每个 Sheet 名称即为班级名称</li>
                <li>列包含学生姓名及课次打勾(√)状态</li>
                <li>自动适配多种打卡标识(√ / × / 请假)</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => generateAndDownloadExcelTemplate(classTypes, students, selectedMonth)}
              className="w-full bg-white hover:bg-slate-100 text-slate-800 font-bold py-2 px-3 rounded-xl border border-slate-300 shadow-xs transition flex items-center justify-center space-x-1.5"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>下载全班级标准 Excel 模板</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading && (
          <div className="py-8 text-center space-y-2">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-600 font-bold">正在读取解析 Excel 多个班级 Sheet 工作表中...</p>
          </div>
        )}

        {/* Parsed Preview Section */}
        {parsedSheets.length > 0 && !loading && (
          <div className="flex-1 min-h-0 flex flex-col space-y-3 overflow-hidden border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center">
                <Layers className="w-4 h-4 text-emerald-600 mr-1" />
                解析成功！共检测到 {parsedSheets.length} 个班级 Sheet 页：
              </span>
              <span className="text-xs text-slate-500 font-medium">
                勾选导入 {selectedSheetIndices.length} / {parsedSheets.length} 个班级
              </span>
            </div>

            {/* Sheet Tabs */}
            <div className="flex space-x-2 overflow-x-auto no-scrollbar py-1">
              {parsedSheets.map((sheet, index) => {
                const isSelected = selectedSheetIndices.includes(index);
                const isActive = activeSheetTab === index;

                return (
                  <div
                    key={index}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                    onClick={() => setActiveSheetTab(index)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleToggleSheetSelect(index);
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>{sheet.className}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-indigo-500 text-indigo-100' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {sheet.rows.length}人
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Selected Sheet Content Table Preview */}
            {activeSheet && (
              <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden flex flex-col bg-slate-50/50">
                <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap justify-between items-center text-xs gap-2">
                  <span className="font-bold text-slate-800 flex items-center">
                    <Users className="w-4 h-4 text-indigo-600 mr-1.5" />
                    当前Sheet预览: <span className="text-indigo-600 ml-1 mr-3">{activeSheet.className}</span>
                    <span className="text-slate-500 font-normal">
                      (学员: <strong className="text-slate-900">{activeSheet.rows.length}</strong> 人 | 列数: <strong className="text-slate-900">{activeSheet.totalLessons}</strong> 节)
                    </span>
                  </span>

                  {/* Class Cost Input for active sheet */}
                  <div className="flex items-center space-x-1 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-xl">
                    <span className="text-amber-800 font-bold text-[11px]">【{activeSheet.className}】本月成本:</span>
                    <span className="text-amber-600 font-bold ml-1">¥</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={sheetCosts[activeSheetTab] === 0 || sheetCosts[activeSheetTab] === undefined ? '' : sheetCosts[activeSheetTab]}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value));
                        setSheetCosts((prev) => ({ ...prev, [activeSheetTab]: val }));
                      }}
                      placeholder="0"
                      className="w-20 bg-white border border-amber-300 rounded px-1.5 py-0.5 font-bold text-amber-900 focus:outline-none text-right"
                    />
                    <span className="text-slate-400 text-[10px] ml-1">(也可导入后随时修改)</span>
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-2">
                  <table className="w-full text-left border-collapse text-xs bg-white rounded-lg shadow-2xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="p-2 text-center w-10">序号</th>
                        <th className="p-2">学生姓名</th>
                        {Array.from({ length: Math.min(activeSheet.totalLessons, 12) }).map((_, i) => (
                          <th key={i} className="p-1 text-center w-8 bg-indigo-50/50">
                            {i + 1}
                          </th>
                        ))}
                        {activeSheet.totalLessons > 12 && <th className="p-1 text-center">...</th>}
                        <th className="p-2 text-center font-bold text-emerald-700">出勤节数</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeSheet.rows.slice(0, 8).map((r, rIdx) => {
                        const presentCount = r.attendance.filter((a) => a === '√').length;
                        return (
                          <tr key={rIdx} className="hover:bg-slate-50">
                            <td className="p-2 text-center text-slate-400">{rIdx + 1}</td>
                            <td className="p-2 font-bold text-slate-900">{r.studentName}</td>
                            {r.attendance.slice(0, Math.min(activeSheet.totalLessons, 12)).map((att, colIdx) => (
                              <td key={colIdx} className="p-1 text-center font-bold">
                                {att === '√' ? (
                                  <span className="text-emerald-600">√</span>
                                ) : att === '×' ? (
                                  <span className="text-rose-500">×</span>
                                ) : att === '请假' ? (
                                  <span className="text-amber-500">假</span>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            ))}
                            {activeSheet.totalLessons > 12 && <td className="p-1 text-center text-slate-400">...</td>}
                            <td className="p-2 text-center font-bold text-emerald-600">{presentCount} 节</td>
                          </tr>
                        );
                      })}
                      {activeSheet.rows.length > 8 && (
                        <tr>
                          <td colSpan={15} className="p-2 text-center text-slate-400 text-[11px] italic">
                            ... 等共 {activeSheet.rows.length} 名学生打卡记录
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-xs"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={selectedSheetIndices.length === 0 || parsedSheets.length === 0}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>确认导入已选 {selectedSheetIndices.length} 个班级 Sheet 考勤数据</span>
          </button>
        </div>
      </div>
    </div>
  );
};
