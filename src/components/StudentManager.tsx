import React, { useState } from 'react';
import { StudentEnrollment, ClassTypeConfig, ClassMonthlyAttendance } from '../types';
import { calculateStudentSettlement } from '../utils/calc';
import { StudentExcelImportModal } from './StudentExcelImportModal';
import {
  UserPlus,
  Search,
  Filter,
  AlertTriangle,
  Edit2,
  Trash2,
  Coins,
  Calendar,
  CheckCircle2,
  X,
  CreditCard,
  Plus,
  FileSpreadsheet,
  Receipt,
  RotateCcw
} from 'lucide-react';

interface StudentManagerProps {
  students: StudentEnrollment[];
  classTypes: ClassTypeConfig[];
  attendanceSheets: ClassMonthlyAttendance[];
  selectedMonth: string;
  onAddStudent: (student: StudentEnrollment) => void;
  onBatchAddStudents?: (students: StudentEnrollment[]) => void;
  onUpdateStudent: (student: StudentEnrollment) => void;
  onDeleteStudent: (id: string) => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  students,
  classTypes,
  attendanceSheets,
  selectedMonth,
  onAddStudent,
  onBatchAddStudents,
  onUpdateStudent,
  onDeleteStudent
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [showLowBalanceOnly, setShowLowBalanceOnly] = useState(false);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentEnrollment | null>(null);

  // Top Up Modal State
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpTarget, setTopUpTarget] = useState<StudentEnrollment | null>(null);
  const [topUpFee, setTopUpFee] = useState<number>(3600);
  const [topUpLessons, setTopUpLessons] = useState<number>(20);

  // Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundTarget, setRefundTarget] = useState<StudentEnrollment | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    studentName: '',
    className: classTypes[0]?.className || '英语高级班',
    subject: classTypes[0]?.subject || '少儿英语',
    tuitionFee: classTypes[0]?.defaultFee || 3600,
    totalLessons: classTypes[0]?.defaultTotalLessons || 20,
    customUnitPrice: 0,
    useCustomUnitPrice: false,
    enrollmentDate: new Date().toISOString().split('T')[0],
    note: ''
  });

  // Handle class selection in form -> auto fill default fee and lessons
  const handleClassChangeInForm = (className: string) => {
    const selectedClass = classTypes.find((c) => c.className === className);
    const fee = selectedClass?.defaultFee || 3600;
    const lessons = selectedClass?.defaultTotalLessons || 20;
    setFormData((prev) => ({
      ...prev,
      className,
      subject: selectedClass?.subject || '综合',
      tuitionFee: fee,
      totalLessons: lessons,
      customUnitPrice: lessons > 0 ? Math.round((fee / lessons) * 100) / 100 : 0
    }));
  };

  // Unit price live calculated or overridden
  const calculatedUnitPrice = formData.useCustomUnitPrice
    ? formData.customUnitPrice
    : formData.totalLessons > 0
    ? Math.round((formData.tuitionFee / formData.totalLessons) * 100) / 100
    : 0;

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    const defaultClass = classTypes[0];
    const fee = defaultClass?.defaultFee || 3600;
    const lessons = defaultClass?.defaultTotalLessons || 20;
    setFormData({
      studentName: '',
      className: defaultClass?.className || '英语高级班',
      subject: defaultClass?.subject || '少儿英语',
      tuitionFee: fee,
      totalLessons: lessons,
      customUnitPrice: lessons > 0 ? Math.round((fee / lessons) * 100) / 100 : 0,
      useCustomUnitPrice: false,
      enrollmentDate: new Date().toISOString().split('T')[0],
      note: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (student: StudentEnrollment) => {
    setEditingStudent(student);
    const defaultCalculated = student.totalLessons > 0 ? student.tuitionFee / student.totalLessons : 0;
    const isCustom = Math.abs(defaultCalculated - student.unitPrice) > 0.1;

    setFormData({
      studentName: student.studentName,
      className: student.className,
      subject: student.subject,
      tuitionFee: student.tuitionFee,
      totalLessons: student.totalLessons,
      customUnitPrice: student.unitPrice,
      useCustomUnitPrice: isCustom,
      enrollmentDate: student.enrollmentDate,
      note: student.note || ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName.trim()) {
      alert('请填写学员姓名！');
      return;
    }

    const finalUnitPrice = formData.useCustomUnitPrice
      ? Number(formData.customUnitPrice)
      : formData.totalLessons > 0
      ? Math.round((formData.tuitionFee / formData.totalLessons) * 100) / 100
      : 0;

    if (editingStudent) {
      const updated: StudentEnrollment = {
        ...editingStudent,
        studentName: formData.studentName.trim(),
        className: formData.className,
        subject: formData.subject,
        tuitionFee: Number(formData.tuitionFee),
        totalLessons: Number(formData.totalLessons),
        unitPrice: finalUnitPrice,
        enrollmentDate: formData.enrollmentDate,
        note: formData.note
      };
      onUpdateStudent(updated);
    } else {
      const newStudent: StudentEnrollment = {
        id: `s-${Date.now()}`,
        studentName: formData.studentName.trim(),
        className: formData.className,
        subject: formData.subject,
        tuitionFee: Number(formData.tuitionFee),
        totalLessons: Number(formData.totalLessons),
        unitPrice: finalUnitPrice,
        enrollmentDate: formData.enrollmentDate,
        status: 'active',
        note: formData.note
      };
      onAddStudent(newStudent);
    }

    setShowModal(false);
  };

  // Top Up Action
  const handleOpenTopUp = (student: StudentEnrollment) => {
    setTopUpTarget(student);
    const matchedClass = classTypes.find((c) => c.className === student.className);
    setTopUpFee(matchedClass?.defaultFee || 3600);
    setTopUpLessons(matchedClass?.defaultTotalLessons || 20);
    setShowTopUpModal(true);
  };

  const handleConfirmTopUp = () => {
    if (!topUpTarget) return;

    const newTotalFee = topUpTarget.tuitionFee + Number(topUpFee);
    const newTotalLessons = topUpTarget.totalLessons + Number(topUpLessons);
    const newUnitPrice = newTotalFee / newTotalLessons;

    const updated: StudentEnrollment = {
      ...topUpTarget,
      tuitionFee: newTotalFee,
      totalLessons: newTotalLessons,
      unitPrice: Math.round(newUnitPrice * 100) / 100,
      note: `${topUpTarget.note || ''} (于${new Date().toLocaleDateString()}续费${topUpFee}元增加${topUpLessons}课时)`
    };

    onUpdateStudent(updated);
    setShowTopUpModal(false);
    setTopUpTarget(null);
    alert(`成功为【${topUpTarget.studentName}】续费增加 ${topUpLessons} 课时！`);
  };

  // Refund Action
  const handleOpenRefund = (student: StudentEnrollment) => {
    const settlement = calculateStudentSettlement(student, selectedMonth, attendanceSheets);
    if (settlement.remainingLessons <= 0) {
      alert(`学员【${student.studentName}】当前剩余课时为 0 节，已被清零或无剩余学费。`);
      return;
    }
    setRefundTarget(student);
    setShowRefundModal(true);
  };

  const handleConfirmRefund = () => {
    if (!refundTarget) return;

    const settlement = calculateStudentSettlement(refundTarget, selectedMonth, attendanceSheets);
    const consumed = settlement.cumulativeConsumedLessons;
    const refundLessons = settlement.remainingLessons;
    const refundBalance = settlement.remainingBalance;

    const newTuitionFee = Math.round(consumed * refundTarget.unitPrice * 100) / 100;
    const updated: StudentEnrollment = {
      ...refundTarget,
      totalLessons: consumed, // 将总购课次调整为已核销课时，剩余课时自动归零
      tuitionFee: newTuitionFee, // 缴纳学费调整为已销学费
      status: 'graduated', // 标记为结清/退费
      note: `${refundTarget.note || ''} (于${new Date().toLocaleDateString()}办理缺勤退费: 清退剩余${refundLessons}节课时，应退款¥${refundBalance})`.trim()
    };

    onUpdateStudent(updated);
    setShowRefundModal(false);
    setRefundTarget(null);
    alert(`已成功为【${refundTarget.studentName}】办理缺勤退费！\n清退剩余 ${refundLessons} 节课时，退款金额 ¥${refundBalance.toLocaleString()} 元，剩余课时与学费已归零。`);
  };

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'ALL' || student.className === classFilter;

    if (showLowBalanceOnly) {
      const settlement = calculateStudentSettlement(student, selectedMonth, attendanceSheets);
      return matchesSearch && matchesClass && settlement.isLowBalance;
    }

    return matchesSearch && matchesClass;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Coins className="w-4 h-4" />
            <span>学员学费与课次管理</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            学生报名与【学员+班级】单价绑定档案
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            单价与 <span className="font-bold text-indigo-600">单个学员在具体班级</span> 绑定。例如：学员A在英语1班为190元/节，在语文2班为180元/节；学员B在英语1班为180元/节，在语文2班为180元/节。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setShowExcelImportModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/30 transition flex items-center space-x-2 text-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>批量导入学生 (Excel)</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/30 transition flex items-center space-x-2 text-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>录入新学员报名学费</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="搜索学生姓名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Class Filter */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none w-full sm:w-auto"
            >
              <option value="ALL">全部班型课程 ({students.length}人)</option>
              {classTypes.map((c) => (
                <option key={c.id} value={c.className}>
                  {c.className}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Low Balance Filter Checkbox */}
        <button
          onClick={() => setShowLowBalanceOnly(!showLowBalanceOnly)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-xl border transition ${
            showLowBalanceOnly
              ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className={`w-4 h-4 ${showLowBalanceOnly ? 'text-amber-600' : 'text-slate-400'}`} />
          <span>仅显示预警学生 (≤3节)</span>
        </button>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-6">学生姓名</th>
                <th className="py-3.5 px-4">报读班级</th>
                <th className="py-3.5 px-4 text-right">缴纳学费</th>
                <th className="py-3.5 px-4 text-center">总购买课次</th>
                <th className="py-3.5 px-4 text-right bg-indigo-50/60 text-indigo-900 font-extrabold">
                  计算单次课价
                </th>
                <th className="py-3.5 px-4 text-center">累计消课</th>
                <th className="py-3.5 px-4 text-center">剩余课时</th>
                <th className="py-3.5 px-4 text-right">剩余资金余额</th>
                <th className="py-3.5 px-6 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredStudents.map((student) => {
                const settlement = calculateStudentSettlement(student, selectedMonth, attendanceSheets);

                return (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      <div className="flex items-center space-x-2">
                        <span>{student.studentName}</span>
                        {settlement.isLowBalance && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded border border-amber-200">
                            预警
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block font-normal mt-0.5">
                        报名日期: {student.enrollmentDate}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-800 rounded-md">
                        {student.className}
                      </span>
                      <span className="text-xs text-slate-400 block mt-0.5">{student.subject}</span>
                    </td>

                    <td className="py-4 px-4 text-right font-bold text-slate-900">
                      ¥{student.tuitionFee.toLocaleString()}
                    </td>

                    <td className="py-4 px-4 text-center font-bold text-slate-900">
                      {student.totalLessons} 节
                    </td>

                    <td className="py-4 px-4 text-right bg-indigo-50/30 font-black text-indigo-700 text-base">
                      ¥{student.unitPrice}/节
                    </td>

                    <td className="py-4 px-4 text-center text-emerald-600 font-bold">
                      {settlement.cumulativeConsumedLessons} 节
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span
                        className={`font-black text-sm px-2 py-0.5 rounded ${
                          settlement.remainingLessons <= 3
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'text-slate-900'
                        }`}
                      >
                        {settlement.remainingLessons} 节
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right text-slate-600">
                      ¥{settlement.remainingBalance.toLocaleString()}
                    </td>

                    <td className="py-4 px-6 text-center space-x-1.5">
                      <button
                        onClick={() => handleOpenTopUp(student)}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1.5 rounded-lg border border-emerald-200 transition cursor-pointer"
                        title="续费加报课时"
                      >
                        续费
                      </button>
                      <button
                        onClick={() => handleOpenRefund(student)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-1.5 rounded-lg border border-rose-200 transition cursor-pointer"
                        title="缺勤退费处理，剩余课时与学费清零"
                      >
                        退费
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(student)}
                        className="text-slate-400 hover:text-indigo-600 transition p-1 cursor-pointer"
                        title="编辑资料"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`确定要删除学生【${student.studentName}】的报名档案吗？`)) {
                            onDeleteStudent(student.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                        title="删除记录"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    未找到符合条件的学员报名记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingStudent ? '修改学员报名信息' : '录入新学员学费与课次'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs md:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">学员姓名 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如：王沐安"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">报读班型/班级 *</label>
                <select
                  value={formData.className}
                  onChange={(e) => handleClassChangeInForm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {classTypes.map((c) => (
                    <option key={c.id} value={c.className}>
                      {c.className} ({c.subject})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">缴纳学费金额 (元) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.tuitionFee}
                    onChange={(e) => setFormData({ ...formData, tuitionFee: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">购买课次 (节) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.totalLessons}
                    onChange={(e) => setFormData({ ...formData, totalLessons: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Calculated Unit Price Live Highlight Box */}
              <div className="p-4 bg-indigo-50/80 rounded-xl border border-indigo-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-indigo-900 font-medium block">
                      【{formData.studentName || '该学员'}】在【{formData.className}】的绑定单价：
                    </span>
                    <span className="text-sm font-black text-indigo-950">消课核算单次课价</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-indigo-700">
                      ¥{calculatedUnitPrice.toFixed(2)}
                    </span>
                    <span className="text-xs text-indigo-600 block">/ 节</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-indigo-100 flex items-center justify-between text-xs">
                  <label className="flex items-center space-x-2 text-indigo-900 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.useCustomUnitPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          useCustomUnitPrice: e.target.checked,
                          customUnitPrice:
                            formData.customUnitPrice ||
                            (formData.totalLessons > 0 ? formData.tuitionFee / formData.totalLessons : 0)
                        })
                      }
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>自定义指定该学生专属单价</span>
                  </label>

                  {formData.useCustomUnitPrice && (
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-500">定制单价:</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.customUnitPrice}
                        onChange={(e) => setFormData({ ...formData, customUnitPrice: Number(e.target.value) })}
                        className="w-20 bg-white border border-indigo-300 rounded px-2 py-0.5 font-bold text-indigo-700 text-right"
                      />
                      <span className="text-slate-500">元/节</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">报名缴费日期</label>
                <input
                  type="date"
                  value={formData.enrollmentDate}
                  onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">备注信息</label>
                <textarea
                  rows={2}
                  placeholder="优惠说明、特殊定制单价原因等..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/30"
                >
                  确认保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Renew / Top Up Modal */}
      {showTopUpModal && topUpTarget && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-emerald-600 font-bold text-base">
                <CreditCard className="w-5 h-5 text-emerald-500" />
                <span>为【{topUpTarget.studentName}】办理续费加报</span>
              </div>
              <button onClick={() => setShowTopUpModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div>当前班级: <span className="font-bold text-slate-900">{topUpTarget.className}</span></div>
              <div>原学费: ¥{topUpTarget.tuitionFee} (对应总课次 {topUpTarget.totalLessons}节)</div>
            </div>

            <div className="space-y-3 text-xs md:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">本次续费金额 (元)</label>
                <input
                  type="number"
                  value={topUpFee}
                  onChange={(e) => setTopUpFee(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">本次增加课次 (节)</label>
                <input
                  type="number"
                  value={topUpLessons}
                  onChange={(e) => setTopUpLessons(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-bold text-slate-900"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs">
                续费后累计学费: <span className="font-bold">¥{topUpTarget.tuitionFee + topUpFee}</span>，
                累计课次: <span className="font-bold">{topUpTarget.totalLessons + topUpLessons}节</span>。
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTopUpModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmTopUp}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/30"
              >
                确认完成续费
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Refund Modal */}
      {showRefundModal && refundTarget && (() => {
        const settlement = calculateStudentSettlement(refundTarget, selectedMonth, attendanceSheets);
        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2 text-rose-600 font-bold text-base">
                  <Receipt className="w-5 h-5 text-rose-500" />
                  <span>【{refundTarget.studentName}】缺勤退费与剩余清零</span>
                </div>
                <button onClick={() => setShowRefundModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200/80 text-rose-800 text-xs leading-relaxed font-medium">
                点击确认退费后，系统将把该学员购买总课次调整为实际已消课时（<strong>{settlement.cumulativeConsumedLessons}节</strong>），将剩余课时（<strong>{settlement.remainingLessons}节</strong>）与剩余学费池（<strong>¥{settlement.remainingBalance.toLocaleString()}</strong>）彻底清零归零。
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">报读班级:</span>
                  <span className="font-bold text-slate-900">{refundTarget.className} ({refundTarget.subject})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">课程绑定单价:</span>
                  <span className="font-bold text-indigo-700">¥{refundTarget.unitPrice} / 节</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">原始缴纳学费:</span>
                  <span>¥{refundTarget.tuitionFee} (共 {refundTarget.totalLessons} 节)</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="text-slate-500">截止当前累计已消课时:</span>
                  <span className="font-bold text-emerald-600">{settlement.cumulativeConsumedLessons} 节 (对应课销学费 ¥{Math.round(settlement.cumulativeConsumedLessons * refundTarget.unitPrice)})</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200 pt-2 font-bold">
                  <span className="text-rose-700 font-extrabold">拟清退剩余课时:</span>
                  <span className="text-rose-700 font-extrabold text-sm">{settlement.remainingLessons} 节</span>
                </div>
                <div className="flex justify-between items-center bg-rose-100/70 p-2.5 rounded-lg border border-rose-200">
                  <span className="text-rose-900 font-black text-xs">拟退还学费总额:</span>
                  <span className="text-rose-700 font-black text-lg">¥{settlement.remainingBalance.toLocaleString()} 元</span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRefund}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-600/30 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Receipt className="w-4 h-4" />
                  <span>确认退费并清零</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Excel Student Import Modal */}
      <StudentExcelImportModal
        isOpen={showExcelImportModal}
        onClose={() => setShowExcelImportModal(false)}
        classTypes={classTypes}
        onBatchAddStudents={(imported) => {
          if (onBatchAddStudents) {
            onBatchAddStudents(imported);
          } else {
            imported.forEach((s) => onAddStudent(s));
          }
        }}
      />
    </div>
  );
};
