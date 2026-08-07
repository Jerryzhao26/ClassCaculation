import React, { useState } from 'react';
import {
  StudentEnrollment,
  ClassMonthlyAttendance,
  ClassTypeConfig
} from '../types';
import { calculateStudentSettlement, calculateClassSummary } from '../utils/calc';
import {
  Coins,
  Clock,
  Users,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Send,
  Copy,
  Check,
  Edit3
} from 'lucide-react';
import { ClassCostBatchModal } from './ClassCostBatchModal';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface DashboardProps {
  students: StudentEnrollment[];
  attendanceSheets: ClassMonthlyAttendance[];
  classTypes: ClassTypeConfig[];
  selectedMonth: string;
  onNavigateTab: (tab: string, className?: string) => void;
  onUpdateClassCost: (month: string, className: string, cost: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  students,
  attendanceSheets,
  classTypes,
  selectedMonth,
  onNavigateTab,
  onUpdateClassCost
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);

  // Active students only
  const activeStudents = students.filter((s) => s.status === 'active');

  // Compute all settlements for current month
  const studentSettlements = activeStudents.map((s) =>
    calculateStudentSettlement(s, selectedMonth, attendanceSheets)
  );

  // Total Metrics
  const totalConsumptionAmount = studentSettlements.reduce(
    (sum, item) => sum + item.monthConsumptionAmount,
    0
  );

  const totalMonthDeductCount = studentSettlements.reduce(
    (sum, item) => sum + item.monthDeductCount,
    0
  );

  const lowBalanceStudents = studentSettlements.filter((item) => item.isLowBalance);

  // Get distinct classes
  const uniqueClasses = Array.from(
    new Set([
      ...classTypes.map((c) => c.className),
      ...activeStudents.map((s) => s.className)
    ])
  );

  const classSummaries = uniqueClasses.map((cName) =>
    calculateClassSummary(cName, selectedMonth, activeStudents, attendanceSheets)
  );

  const totalClassCost = classSummaries.reduce((sum, c) => sum + c.classCost, 0);
  const totalNetIncome = totalConsumptionAmount - totalClassCost;

  // Prepare chart data
  const chartData = classSummaries
    .filter((c) => c.studentCount > 0)
    .map((c) => ({
      name: c.className,
      value: c.totalConsumptionAmount,
      lessons: c.totalDeductCount,
      students: c.studentCount
    }));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  const handleCopyNotice = (studentName: string, className: string, remainingLessons: number) => {
    const text = `【智学教务提醒】家长您好，${studentName}同学在《${className}》课程的剩余课时仅剩 ${remainingLessons} 节。为保证孩子顺利跟班上课，请及时联系老师办理续费，感谢您的支持！`;
    navigator.clipboard.writeText(text);
    setCopiedId(studentName);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-[#f8fafc] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Month Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>{selectedMonth} 阶段月度课销核算期</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              全校课销与月度考勤结算大盘
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              本月共有 <span className="font-semibold text-white">{activeStudents.length}</span> 名学生在读，
              <span className="font-semibold text-white">{classSummaries.length}</span> 个班型课程。自动根据单次课价与实际考勤出勤次数核算阶段收入。
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigateTab('attendance')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2 text-sm"
            >
              <span>上传/录入本月考勤</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Profitability & Cost Balance Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {selectedMonth} 全校实际净收入汇总
            </span>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className={`text-2xl sm:text-3xl font-black ${totalNetIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ¥{totalNetIncome.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                (已从课销毛金额中扣除各班级运营成本)
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:gap-5 text-xs bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
          <div>
            <span className="text-slate-500 font-medium">课销毛收入: </span>
            <span className="font-bold text-indigo-600 ml-1">
              ¥{totalConsumptionAmount.toLocaleString()}
            </span>
          </div>
          <span className="text-slate-300 font-bold">-</span>
          <div>
            <span className="text-slate-500 font-medium">各班总成本: </span>
            <span className="font-bold text-amber-600 ml-1">
              ¥{totalClassCost.toLocaleString()}
            </span>
          </div>
          <span className="text-slate-300 font-bold">=</span>
          <div>
            <span className="text-slate-500 font-medium">实际净收益: </span>
            <span className={`font-black ml-1 ${totalNetIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ¥{totalNetIncome.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-5 border-l-4 border-indigo-500 border-y border-r border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">本月课销核算总额</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              ¥{totalConsumptionAmount.toLocaleString()}
            </div>
            <p className="text-xs text-emerald-600 mt-1 font-bold flex items-center">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500 mr-1" />
              按各学员单次课价 × 出勤节数
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-5 border-l-4 border-emerald-500 border-y border-r border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">已耗消课总节数</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalMonthDeductCount} <span className="text-sm font-medium text-slate-500">课次</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              全校打勾打卡有效出勤节数
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-5 border-l-4 border-amber-400 border-y border-r border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">在读学生总数</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {activeStudents.length} <span className="text-sm font-medium text-slate-500">名</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              涵盖 {classTypes.length} 个教学科目/班型
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl p-5 border-l-4 border-rose-500 border-y border-r border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">剩余课时预警人次</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              lowBalanceStudents.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl sm:text-3xl font-black ${
              lowBalanceStudents.length > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}>
              {lowBalanceStudents.length} <span className="text-sm font-medium text-slate-500">人</span>
            </div>
            <p className="text-xs text-rose-600 mt-1 font-bold">
              剩余课时 ≤ 3 节（需催费）
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart & Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Consumption Bar Chart */}
        <div className="lg:col-col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">各班级当月课销金额分布</h3>
              <p className="text-xs text-slate-500">单位：元（RMB）</p>
            </div>
            <button
              onClick={() => onNavigateTab('settlement')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              查看完整核算明细
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: any) => [`¥${value}`, '月度课销金额']}
                    labelFormatter={(name) => `班级: ${name}`}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                暂无课销数据
              </div>
            )}
          </div>
        </div>

        {/* Low Balance Alert Panel */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-base">课时预警与续费提醒</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                {lowBalanceStudents.length} 人预警
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              以下学生剩余课时少于等于 3 节，请及时联系家长办理续费：
            </p>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {lowBalanceStudents.length > 0 ? (
                lowBalanceStudents.map((item) => (
                  <div
                    key={`${item.studentName}-${item.className}`}
                    className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">{item.studentName}</span>
                        <span className="text-xs text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {item.className}
                        </span>
                      </div>
                      <div className="text-xs text-amber-800 mt-1 font-medium">
                        剩余 <span className="text-amber-600 font-bold text-sm">{item.remainingLessons}</span> 节
                        <span className="text-slate-400 ml-1.5">(预存余额 ¥{item.remainingBalance})</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopyNotice(item.studentName, item.className, item.remainingLessons)}
                      className="flex items-center space-x-1 text-xs bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-medium px-2.5 py-1.5 rounded-lg transition"
                      title="复制家长催费短信"
                    >
                      {copiedId === item.studentName ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-amber-700" />
                          <span>提醒</span>
                        </>
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="text-xs text-slate-500 font-medium">全部学生课时充沛，无续费预警</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <button
              onClick={() => onNavigateTab('students')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              前往学员管理列表查看完整名册 →
            </button>
          </div>
        </div>
      </div>

      {/* Class Monthly Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">各班级 {selectedMonth} 课销核算表</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              汇总各班级报名人数、消课节数、消课金额、本月运营成本与实际净收益
            </p>
          </div>
          <div className="flex items-center space-x-2.5 self-start sm:self-auto">
            <button
              onClick={() => setIsCostModalOpen(true)}
              className="text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span>录入/修改各班成本</span>
            </button>
            <button
              onClick={() => onNavigateTab('attendance')}
              className="text-xs font-medium text-indigo-600 hover:bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl transition"
            >
              录入/编辑考勤记录
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-6">班级名称</th>
                <th className="py-3.5 px-4">所属科目</th>
                <th className="py-3.5 px-4 text-center">班级人数</th>
                <th className="py-3.5 px-4 text-center">本月消课总节数</th>
                <th className="py-3.5 px-4 text-right">课销核算毛额</th>
                <th className="py-3.5 px-4 text-right text-amber-800 font-bold bg-amber-50/40 min-w-[150px]">
                  班级本月总成本 (点击修改)
                </th>
                <th className="py-3.5 px-4 text-right text-emerald-700 font-black">实际净收入</th>
                <th className="py-3.5 px-4 text-center">剩余总课时</th>
                <th className="py-3.5 px-4 text-right">剩余资金储备</th>
                <th className="py-3.5 px-6 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {classSummaries.map((cls) => (
                <tr key={cls.className} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 px-6 font-bold text-slate-900">{cls.className}</td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-md">
                      {cls.subject}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center font-semibold text-slate-900">{cls.studentCount} 人</td>
                  <td className="py-4 px-4 text-center text-emerald-600 font-bold">{cls.totalPresentCount} 节</td>
                  <td className="py-4 px-4 text-right font-extrabold text-indigo-600 text-base">
                    ¥{cls.totalConsumptionAmount.toLocaleString()}
                  </td>
                  
                  {/* Inline Cost Editor */}
                  <td className="py-3.5 px-4 text-right bg-amber-50/20">
                    <div className="inline-flex items-center space-x-1 bg-amber-50/80 hover:bg-amber-100/80 border border-amber-300 rounded-lg px-2 py-1 transition focus-within:ring-2 focus-within:ring-amber-500">
                      <span className="text-xs text-amber-700 font-bold">¥</span>
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
                        placeholder="0"
                        className="w-20 bg-transparent text-sm font-bold text-amber-900 text-right focus:outline-none"
                        title="点击直接输入或修改成本"
                      />
                    </div>
                  </td>

                  <td className={`py-4 px-4 text-right font-black text-base ${cls.netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ¥{cls.netIncome.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-center text-slate-600">{cls.totalRemainingLessons} 节</td>
                  <td className="py-4 px-4 text-right text-slate-600">¥{cls.totalRemainingBalance.toLocaleString()}</td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => onNavigateTab('attendance', cls.className)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      查看考勤表
                    </button>
                  </td>
                </tr>
              ))}
              {classSummaries.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 text-sm">
                    尚无班级及考勤数据
                  </td>
                </tr>
              )}
            </tbody>
            {classSummaries.length > 0 && (
              <tfoot>
                <tr className="bg-indigo-50/50 font-bold text-slate-900 border-t border-indigo-100">
                  <td className="py-4 px-6">全校合计</td>
                  <td className="py-4 px-4 text-slate-500 text-xs">全校全科目</td>
                  <td className="py-4 px-4 text-center">{activeStudents.length} 人</td>
                  <td className="py-4 px-4 text-center text-emerald-700">{totalMonthDeductCount} 节</td>
                  <td className="py-4 px-4 text-right text-indigo-700 text-base">
                    ¥{totalConsumptionAmount.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right text-amber-700 font-bold">
                    -¥{totalClassCost.toLocaleString()}
                  </td>
                  <td className={`py-4 px-4 text-right font-black text-lg ${totalNetIncome >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    ¥{totalNetIncome.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {classSummaries.reduce((sum, c) => sum + c.totalRemainingLessons, 0)} 节
                  </td>
                  <td className="py-4 px-4 text-right">
                    ¥{classSummaries.reduce((sum, c) => sum + c.totalRemainingBalance, 0).toLocaleString()}
                  </td>
                  <td className="py-4 px-6"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Batch Cost Modal */}
      <ClassCostBatchModal
        isOpen={isCostModalOpen}
        onClose={() => setIsCostModalOpen(false)}
        selectedMonth={selectedMonth}
        classTypes={classTypes}
        students={students}
        attendanceSheets={attendanceSheets}
        onUpdateClassCost={onUpdateClassCost}
      />
    </div>
  );
};
