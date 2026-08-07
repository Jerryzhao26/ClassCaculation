import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Users,
  Coins,
  Check
} from 'lucide-react';
import {
  parseStudentExcelWorkbook,
  generateStudentEnrollmentTemplate,
  ParsedStudentRow
} from '../utils/studentExcelParser';
import { StudentEnrollment, ClassTypeConfig } from '../types';

interface StudentExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classTypes: ClassTypeConfig[];
  onBatchAddStudents: (newStudents: StudentEnrollment[]) => void;
}

export const StudentExcelImportModal: React.FC<StudentExcelImportModalProps> = ({
  isOpen,
  onClose,
  classTypes,
  onBatchAddStudents
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg(null);
    setFileName(file.name);

    try {
      const rows = await parseStudentExcelWorkbook(file, classTypes);
      if (rows.length === 0) {
        setErrorMsg('未能从 Excel 中识别出有效的学生报名数据，请检查表头字段。');
        setParsedRows([]);
        setSelectedIndices([]);
      } else {
        setParsedRows(rows);
        // Select all valid rows by default
        const validIndices = rows
          .map((r, i) => (r.isValid ? i : -1))
          .filter((i) => i !== -1);
        setSelectedIndices(validIndices);
      }
    } catch (err: any) {
      setErrorMsg(`读取 Excel 文件出错: ${err?.message || '格式不支持'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIndices.length === parsedRows.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(parsedRows.map((_, i) => i));
    }
  };

  const handleToggleSelectRow = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const handleConfirmImport = () => {
    if (selectedIndices.length === 0) {
      alert('请至少勾选一位要导入的学生！');
      return;
    }

    const studentsToImport: StudentEnrollment[] = selectedIndices.map((idx, i) => {
      const row = parsedRows[idx];
      return {
        id: `s-imp-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        studentName: row.studentName,
        className: row.className,
        subject: row.subject,
        tuitionFee: row.tuitionFee,
        totalLessons: row.totalLessons,
        unitPrice: row.unitPrice,
        enrollmentDate: row.enrollmentDate,
        status: 'active',
        note: row.note || '通过Excel批量导入'
      };
    });

    onBatchAddStudents(studentsToImport);
    alert(`成功批量导入 ${studentsToImport.length} 条学生报名档案！`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                Excel 学员报名档案批量导入
              </h3>
              <p className="text-xs text-slate-500">
                支持导入 Excel 表格，一次性录入多名学员的学费、购买课次与特定班级单价
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

        {/* Upload Zone & Template */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="md:col-span-2 border-2 border-dashed border-indigo-200 bg-indigo-50/40 rounded-2xl p-5 text-center flex flex-col items-center justify-center hover:bg-indigo-50/70 transition cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls"
              className="hidden"
            />
            <Upload className="w-8 h-8 text-indigo-600 mb-2 animate-bounce" />
            <span className="font-bold text-slate-900 text-sm">
              {fileName ? `已选择文件: ${fileName}` : '点击或拖拽上传学员报名 Excel 文件'}
            </span>
            <span className="text-xs text-slate-500 mt-1">
              可自动识别姓名、班级、学费、课次以及特定班级专属消课单价
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between text-xs space-y-3">
            <div>
              <div className="font-bold text-slate-900 mb-1 flex items-center">
                <HelpCircle className="w-4 h-4 text-indigo-600 mr-1" />
                数据格式提示:
              </div>
              <ul className="text-slate-600 space-y-1 list-disc list-inside">
                <li>必填字段：姓名、报读班级、学费、课次</li>
                <li>若单价留空，系统自动按（学费 ÷ 课次）计算</li>
                <li>同名学员可报读不同班级，拥有不同单价</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => generateStudentEnrollmentTemplate(classTypes)}
              className="w-full bg-white hover:bg-slate-100 text-slate-800 font-bold py-2 px-3 rounded-xl border border-slate-300 shadow-xs transition flex items-center justify-center space-x-1.5"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              <span>下载学员报名标准模板</span>
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
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-600 font-bold">正在解析 Excel 学员报名数据中...</p>
          </div>
        )}

        {/* Parsed Preview Table */}
        {parsedRows.length > 0 && !loading && (
          <div className="flex-1 min-h-0 flex flex-col space-y-3 overflow-hidden border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center">
                <Coins className="w-4 h-4 text-indigo-600 mr-1" />
                解析出 {parsedRows.length} 条数据，已勾选 {selectedIndices.length} 条准备导入：
              </span>
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                {selectedIndices.length === parsedRows.length ? '全不选' : '全选'}
              </button>
            </div>

            <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="p-2.5 text-center w-10">选择</th>
                    <th className="p-2.5">学员姓名</th>
                    <th className="p-2.5">报读班级</th>
                    <th className="p-2.5">科目</th>
                    <th className="p-2.5 text-right">缴纳学费</th>
                    <th className="p-2.5 text-center">购买课次</th>
                    <th className="p-2.5 text-right text-indigo-700">消课单价</th>
                    <th className="p-2.5">报名日期</th>
                    <th className="p-2.5">备注</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.map((row, idx) => {
                    const isSelected = selectedIndices.includes(idx);
                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-indigo-50/50 transition cursor-pointer ${
                          isSelected ? 'bg-indigo-50/20' : ''
                        }`}
                        onClick={() => handleToggleSelectRow(idx)}
                      >
                        <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(idx)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-2.5 font-bold text-slate-900">{row.studentName}</td>
                        <td className="p-2.5 font-medium text-indigo-900">{row.className}</td>
                        <td className="p-2.5 text-slate-500">{row.subject}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">¥{row.tuitionFee}</td>
                        <td className="p-2.5 text-center font-semibold text-slate-700">{row.totalLessons} 节</td>
                        <td className="p-2.5 text-right font-black text-indigo-700">¥{row.unitPrice}/节</td>
                        <td className="p-2.5 text-slate-500">{row.enrollmentDate}</td>
                        <td className="p-2.5 text-slate-400 truncate max-w-[120px]">{row.note || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
            disabled={selectedIndices.length === 0}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/30 transition flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>确认导入已选 {selectedIndices.length} 条学生档案</span>
          </button>
        </div>
      </div>
    </div>
  );
};
