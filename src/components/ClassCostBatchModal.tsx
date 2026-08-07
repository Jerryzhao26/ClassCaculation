import React, { useState } from 'react';
import { Coins, X, Check, Calculator, Info } from 'lucide-react';
import { ClassTypeConfig, ClassMonthlyAttendance, StudentEnrollment } from '../types';
import { calculateClassSummary } from '../utils/calc';

interface ClassCostBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string;
  classTypes: ClassTypeConfig[];
  students: StudentEnrollment[];
  attendanceSheets: ClassMonthlyAttendance[];
  onUpdateClassCost: (month: string, className: string, cost: number) => void;
}

export const ClassCostBatchModal: React.FC<ClassCostBatchModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  classTypes,
  students,
  attendanceSheets,
  onUpdateClassCost,
}) => {
  if (!isOpen) return null;

  // Active students
  const activeStudents = students.filter((s) => s.status === 'active');

  // Unique classes
  const uniqueClasses = Array.from(
    new Set([
      ...classTypes.map((c) => c.className),
      ...activeStudents.map((s) => s.className),
    ])
  );

  const classSummaries = uniqueClasses.map((cName) =>
    calculateClassSummary(cName, selectedMonth, activeStudents, attendanceSheets)
  );

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                【{selectedMonth}】各班级月度成本录入与管理
              </h3>
              <p className="text-xs text-slate-500">
                可随时补录或修改各班级本月的教师课酬、场地水电等运营成本，即时精算班级实际净收益
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

        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-800 flex items-start space-x-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">后期随时补充/修改说明:</span>
            <span>导入 Excel 考勤表后，您可以随时在此处为每个班级设定或更新本月成本。修改后将自动同步到仪表盘、考勤页和月度清算对账单中。</span>
          </div>
        </div>

        {/* Classes Cost Table */}
        <div className="flex-1 min-h-0 overflow-y-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-slate-100 font-bold text-slate-700 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4">班级名称</th>
                <th className="py-3 px-4 text-center">本月上课人数</th>
                <th className="py-3 px-4 text-right">课销毛额 (已消课)</th>
                <th className="py-3 px-4 text-center min-w-[160px]">本月总成本 (元)</th>
                <th className="py-3 px-4 text-right font-black text-emerald-700">实际净收益</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {classSummaries.map((cls, idx) => {
                return (
                  <tr key={`${cls.className}-${idx}`} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{cls.className}</td>
                    <td className="py-3 px-4 text-center text-slate-600">{cls.studentCount} 人</td>
                    <td className="py-3 px-4 text-right font-bold text-indigo-600">
                      ¥{cls.totalConsumptionAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center bg-white border border-amber-300 rounded-xl px-2.5 py-1 shadow-2xs focus-within:ring-2 focus-within:ring-amber-500">
                        <span className="text-xs text-amber-600 font-bold mr-1">¥</span>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={cls.classCost === 0 ? '' : cls.classCost}
                          onChange={(e) =>
                            onUpdateClassCost(
                              selectedMonth,
                              cls.className,
                              Math.max(0, Number(e.target.value))
                            )
                          }
                          placeholder="请输入成本"
                          className="w-24 bg-transparent text-sm font-bold text-amber-800 text-right focus:outline-none"
                        />
                      </div>
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-black text-sm ${
                        cls.netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      ¥{cls.netIncome.toLocaleString()}
                    </td>
                  </tr>
                );
              })}

              {classSummaries.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    暂无班级数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 transition"
          >
            <Check className="w-4 h-4" />
            <span>完成录入并保存</span>
          </button>
        </div>
      </div>
    </div>
  );
};
