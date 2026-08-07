import React, { useState } from 'react';
import {
  StudentEnrollment,
  ClassMonthlyAttendance,
  ClassTypeConfig
} from '../types';
import { calculateStudentSettlement, exportToCSV } from '../utils/calc';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Coins,
  Clock,
  Filter,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface SettlementReportProps {
  students: StudentEnrollment[];
  attendanceSheets: ClassMonthlyAttendance[];
  classTypes: ClassTypeConfig[];
  selectedMonth: string;
}

export const SettlementReport: React.FC<SettlementReportProps> = ({
  students,
  attendanceSheets,
  classTypes,
  selectedMonth
}) => {
  const [classFilter, setClassFilter] = useState('ALL');

  const activeStudents = students.filter((s) => s.status === 'active');

  const filteredStudents = activeStudents.filter(
    (s) => classFilter === 'ALL' || s.className === classFilter
  );

  const settlements = filteredStudents.map((student) =>
    calculateStudentSettlement(student, selectedMonth, attendanceSheets)
  );

  // Totals
  const totalMonthConsumption = settlements.reduce(
    (sum, item) => sum + item.monthConsumptionAmount,
    0
  );
  const totalMonthDeduct = settlements.reduce(
    (sum, item) => sum + item.monthDeductCount,
    0
  );
  const totalRemainingLessons = settlements.reduce(
    (sum, item) => sum + item.remainingLessons,
    0
  );
  const totalRemainingBalance = settlements.reduce(
    (sum, item) => sum + item.remainingBalance,
    0
  );

  // Class Costs & Net Profit
  const totalClassCosts = attendanceSheets
    .filter((s) => s.month === selectedMonth && (classFilter === 'ALL' || s.className === classFilter))
    .reduce((sum, s) => sum + (s.classCost || 0), 0);

  const totalNetIncome = totalMonthConsumption - totalClassCosts;

  const handleExportCSV = () => {
    const headers = [
      '序号',
      '学生姓名',
      '报读班级',
      '所属科目',
      '缴纳总学费',
      '购买总课次',
      '单次课价(元/节)',
      '当月出勤消课节数',
      '当月课销核算金额(元)',
      '截止当月累计消课',
      '剩余课时',
      '剩余金额储备(元)',
      '预警状态'
    ];

    const rows = settlements.map((item, index) => [
      index + 1,
      item.studentName,
      item.className,
      item.subject,
      item.tuitionFee,
      item.totalLessons,
      item.unitPrice,
      item.monthDeductCount,
      item.monthConsumptionAmount,
      item.cumulativeConsumedLessons,
      item.remainingLessons,
      item.remainingBalance,
      item.isLowBalance ? '剩余课时不足预警' : '正常'
    ]);

    const filename = `机构月度课销核算表_${selectedMonth}_${classFilter}.csv`;
    exportToCSV(filename, headers, rows);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto print:p-0 print:m-0">
      {/* Top Banner & Export Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            <span>月度课销财务与课时对账</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            {selectedMonth} 月度课销核算清算表
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            严谨匹配学生报名学费与当月考勤打勾记录，自动阶段精算各学员、各班级月度消耗总额与剩余课时。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Class Filter */}
          <div className="flex items-center bg-slate-100 rounded-xl px-3 py-2 border border-slate-200 text-xs">
            <Filter className="w-4 h-4 text-slate-400 mr-2" />
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="ALL">全校所有班级 ({activeStudents.length}人)</option>
              {classTypes.map((c) => (
                <option key={c.id} value={c.className}>
                  {c.className}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center space-x-1.5 text-xs sm:text-sm"
          >
            <Download className="w-4 h-4" />
            <span>导出 Excel (CSV)</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded-xl border border-slate-200 transition flex items-center space-x-1.5 text-xs sm:text-sm"
          >
            <Printer className="w-4 h-4" />
            <span>打印对账单</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 print:grid-cols-5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">课销核算毛金额</div>
          <div className="text-xl sm:text-2xl font-black text-indigo-600 mt-1">
            ¥{totalMonthConsumption.toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200 bg-amber-50/30 shadow-xs">
          <div className="text-xs text-amber-800 font-bold">班级当月总成本</div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 mt-1">
            -¥{totalClassCosts.toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200 bg-emerald-50/40 shadow-xs">
          <div className="text-xs text-emerald-800 font-black">实际净收益(净收入)</div>
          <div className={`text-xl sm:text-2xl font-black mt-1 ${totalNetIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ¥{totalNetIncome.toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">当月消课总节数</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
            {totalMonthDeduct} <span className="text-xs font-normal text-slate-500">课时</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">剩余学费储备池</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            ¥{totalRemainingBalance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center w-12 border-r border-slate-200">序号</th>
                <th className="py-3.5 px-4 border-r border-slate-200">学生姓名</th>
                <th className="py-3.5 px-4 border-r border-slate-200">班级课程</th>
                <th className="py-3.5 px-4 text-right border-r border-slate-200">缴纳学费</th>
                <th className="py-3.5 px-4 text-center border-r border-slate-200">购买课次</th>
                <th className="py-3.5 px-4 text-right border-r border-slate-200 bg-indigo-50/50 text-indigo-950 font-black">
                  单次课价
                </th>
                <th className="py-3.5 px-4 text-center border-r border-slate-200 bg-emerald-50 text-emerald-950 font-black">
                  当月消课节数
                </th>
                <th className="py-3.5 px-4 text-right border-r border-slate-200 bg-indigo-50 text-indigo-950 font-black">
                  当月课销金额
                </th>
                <th className="py-3.5 px-4 text-center border-r border-slate-200">累计消耗</th>
                <th className="py-3.5 px-4 text-center border-r border-slate-200">剩余课时</th>
                <th className="py-3.5 px-4 text-right border-r border-slate-200">剩余资金余额</th>
                <th className="py-3.5 px-4 text-center">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {settlements.map((item, index) => (
                <tr key={`${item.studentName}-${item.className}`} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 text-center text-slate-400 font-mono border-r border-slate-200">
                    {index + 1}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 border-r border-slate-200">
                    {item.studentName}
                  </td>
                  <td className="py-3.5 px-4 border-r border-slate-200">
                    <span className="font-semibold">{item.className}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right border-r border-slate-200">
                    ¥{item.tuitionFee.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center border-r border-slate-200">
                    {item.totalLessons} 节
                  </td>
                  <td className="py-3.5 px-4 text-right border-r border-slate-200 bg-indigo-50/30 font-black text-indigo-700">
                    ¥{item.unitPrice}/节
                  </td>
                  <td className="py-3.5 px-4 text-center border-r border-slate-200 bg-emerald-50/30 font-black text-emerald-600 text-base">
                    {item.monthDeductCount} 节
                  </td>
                  <td className="py-3.5 px-4 text-right border-r border-slate-200 bg-indigo-50/50 font-black text-indigo-700 text-base">
                    ¥{item.monthConsumptionAmount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center border-r border-slate-200 text-slate-600">
                    {item.cumulativeConsumedLessons} 节
                  </td>
                  <td className="py-3.5 px-4 text-center border-r border-slate-200">
                    <span
                      className={`font-black px-2 py-0.5 rounded ${
                        item.isLowBalance
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'text-slate-900'
                      }`}
                    >
                      {item.remainingLessons} 节
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right border-r border-slate-200 text-slate-600">
                    ¥{item.remainingBalance.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {item.isLowBalance ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-200 inline-flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-0.5 text-amber-600" />
                        预警
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded-full inline-flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-0.5 text-emerald-500" />
                        正常
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {settlements.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    当前筛选条件下暂无学员对账数据
                  </td>
                </tr>
              )}
            </tbody>

            {settlements.length > 0 && (
              <tfoot>
                <tr className="bg-indigo-50/80 font-black text-slate-900 border-t-2 border-indigo-200">
                  <td className="py-4 px-4 text-center" colSpan={3}>
                    清算阶段合计
                  </td>
                  <td className="py-4 px-4 text-right">
                    ¥{settlements.reduce((sum, i) => sum + i.tuitionFee, 0).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {settlements.reduce((sum, i) => sum + i.totalLessons, 0)} 节
                  </td>
                  <td className="py-4 px-4 text-right text-indigo-800">
                    均价核算
                  </td>
                  <td className="py-4 px-4 text-center text-emerald-700 text-base">
                    {totalMonthDeduct} 节
                  </td>
                  <td className="py-4 px-4 text-right text-indigo-700 text-lg">
                    ¥{totalMonthConsumption.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {settlements.reduce((sum, i) => sum + i.cumulativeConsumedLessons, 0)} 节
                  </td>
                  <td className="py-4 px-4 text-center text-indigo-900 text-base">
                    {totalRemainingLessons} 节
                  </td>
                  <td className="py-4 px-4 text-right">
                    ¥{totalRemainingBalance.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-center"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
