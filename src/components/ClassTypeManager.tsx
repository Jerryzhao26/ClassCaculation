import React, { useState } from 'react';
import { ClassTypeConfig } from '../types';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Coins,
  Check,
  X,
  Sparkles
} from 'lucide-react';

interface ClassTypeManagerProps {
  classTypes: ClassTypeConfig[];
  onAddClassType: (config: ClassTypeConfig) => void;
  onUpdateClassType: (config: ClassTypeConfig) => void;
  onDeleteClassType: (id: string) => void;
}

export const ClassTypeManager: React.FC<ClassTypeManagerProps> = ({
  classTypes,
  onAddClassType,
  onUpdateClassType,
  onDeleteClassType
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassTypeConfig | null>(null);

  const [formData, setFormData] = useState({
    className: '',
    subject: '少儿英语',
    defaultTotalLessons: 20,
    defaultFee: 3600,
    note: ''
  });

  const handleOpenAdd = () => {
    setEditingClass(null);
    setFormData({
      className: '',
      subject: '少儿英语',
      defaultTotalLessons: 20,
      defaultFee: 3600,
      note: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: ClassTypeConfig) => {
    setEditingClass(item);
    setFormData({
      className: item.className,
      subject: item.subject,
      defaultTotalLessons: item.defaultTotalLessons,
      defaultFee: item.defaultFee,
      note: item.note || ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.className.trim()) {
      alert('请填写班级名称！');
      return;
    }

    const unitPrice =
      formData.defaultTotalLessons > 0 ? formData.defaultFee / formData.defaultTotalLessons : 0;

    if (editingClass) {
      onUpdateClassType({
        ...editingClass,
        className: formData.className.trim(),
        subject: formData.subject.trim(),
        defaultTotalLessons: Number(formData.defaultTotalLessons),
        defaultFee: Number(formData.defaultFee),
        unitPrice: Math.round(unitPrice * 100) / 100,
        note: formData.note
      });
    } else {
      onAddClassType({
        id: `c-${Date.now()}`,
        className: formData.className.trim(),
        subject: formData.subject.trim(),
        defaultTotalLessons: Number(formData.defaultTotalLessons),
        defaultFee: Number(formData.defaultFee),
        unitPrice: Math.round(unitPrice * 100) / 100,
        note: formData.note
      });
    }

    setShowModal(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>机构科目与班型定价策略</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            班型科目与单价规则设置
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            预设各班级的默认购买课次与参考标准学费。学员报名时以此为默认参考，且可为单个学生在特定班级中单独定制专属学费与单价。
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-indigo-600/30 transition flex items-center space-x-2 text-sm self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>新建班型课程</span>
        </button>
      </div>

      {/* Class Type Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classTypes.map((item) => {
          const unitPrice = item.unitPrice || (item.defaultTotalLessons > 0 ? item.defaultFee / item.defaultTotalLessons : 0);

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-lg text-slate-900">{item.className}</span>
                  <span className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                    {item.subject}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>标准学费金额:</span>
                    <span className="font-bold text-slate-900">¥{item.defaultFee}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>包含标准课次:</span>
                    <span className="font-bold text-slate-900">{item.defaultTotalLessons} 节</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-indigo-900">核算单次课价:</span>
                    <span className="font-black text-indigo-600 text-base">
                      ¥{unitPrice.toFixed(2)}/节
                    </span>
                  </div>
                </div>

                {item.note && (
                  <p className="text-xs text-slate-400 mt-3 italic">
                    备注: {item.note}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="flex items-center space-x-1 text-xs text-slate-600 hover:text-indigo-600 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>修改定价</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`确定要删除班型【${item.className}】吗？`)) {
                      onDeleteClassType(item.id);
                    }
                  }}
                  className="flex items-center space-x-1 text-xs text-slate-400 hover:text-rose-600 font-medium px-2 py-1.5 rounded-lg hover:bg-rose-50 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>删除</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingClass ? '修改班型与定价规则' : '新增机构班型'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs md:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">班级/班型名称 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如：英语高级班 / 数学思维一班"
                  value={formData.className}
                  onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">所属教学科目</label>
                <input
                  type="text"
                  required
                  placeholder="例如：少儿英语 / 思维数学"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">标准学费 (元)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.defaultFee}
                    onChange={(e) => setFormData({ ...formData, defaultFee: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">标准购买课次 (节)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.defaultTotalLessons}
                    onChange={(e) => setFormData({ ...formData, defaultTotalLessons: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-xs flex justify-between items-center">
                <span className="font-bold text-indigo-900">推导默认单节课价:</span>
                <span className="font-black text-indigo-700 text-lg">
                  ¥{(formData.defaultTotalLessons > 0 ? formData.defaultFee / formData.defaultTotalLessons : 0).toFixed(2)}/节
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">备注/课程说明</label>
                <textarea
                  rows={2}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/30"
                >
                  保存设置
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
