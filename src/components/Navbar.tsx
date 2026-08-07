import React, { useRef } from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  UserCheck,
  BookOpen,
  FileSpreadsheet,
  Trash2,
  Sparkles,
  School,
  Download,
  Upload,
  Database
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  onInitializeData: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  lowBalanceCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedMonth,
  setSelectedMonth,
  onInitializeData,
  onExportBackup,
  onImportBackup,
  lowBalanceCount,
}) => {
  const restoreFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportBackup(file);
      e.target.value = ''; // reset input
    }
  };
  return (
    <header className="bg-white text-slate-800 border-b border-slate-200/80 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Institution Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <School className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-lg tracking-tight text-slate-900">珞珞的珈课销核算系统</h1>
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full">
                  月度阶段精算版
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">小型培训机构多科目·多班型·单价计销</p>
            </div>
          </div>

          {/* Month Selector & Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex items-center bg-indigo-50/80 rounded-full px-3.5 py-1.5 border border-indigo-100">
              <span className="text-xs font-bold text-indigo-700 mr-2">📅 核算周期:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs text-indigo-900 font-bold focus:outline-none cursor-pointer"
              />
            </div>

            {/* Hidden Backup File Input */}
            <input
              type="file"
              ref={restoreFileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />

            {/* Export Backup Button */}
            <button
              onClick={onExportBackup}
              title="将全部学生报名、班级及考勤表导出保存为本地JSON备份文件"
              className="flex items-center space-x-1.5 text-xs text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-200/80 transition font-bold shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>导出数据备份</span>
            </button>

            {/* Import Backup Button */}
            <button
              onClick={() => restoreFileInputRef.current?.click()}
              title="从本地上传恢复JSON备份数据"
              className="hidden md:flex items-center space-x-1.5 text-xs text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full border border-indigo-200/80 transition font-bold shadow-2xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>恢复备份</span>
            </button>

            <button
              onClick={onInitializeData}
              title="初始化系统，清空所有已有数据"
              className="flex items-center space-x-1.5 text-xs text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-full border border-rose-200/80 transition font-bold shadow-2xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>初始化系统</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1.5 overflow-x-auto no-scrollbar border-t border-slate-100 py-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>课销概览大盘</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-4 h-4 text-emerald-500" />
            <span>月度考勤与AI识图</span>
            <span className={`flex items-center text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              activeTab === 'attendance' ? 'bg-emerald-400/30 text-white' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <Sparkles className="w-3 h-3 mr-0.5" />
              AI
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settlement')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'settlement'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>月度课销核算表</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition whitespace-nowrap relative ${
              activeTab === 'students'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>学生报名与学费</span>
            {lowBalanceCount > 0 && (
              <span className="ml-1 px-2 py-0.2 text-[10px] font-black bg-rose-500 text-white rounded-full animate-pulse">
                {lowBalanceCount} 预警
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('classes')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'classes'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>班型与单价设置</span>
          </button>
        </div>
      </div>
    </header>
  );
};
