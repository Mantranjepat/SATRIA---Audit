import React from 'react';
import { ShieldCheck, Calendar, Clock, ChevronRight } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  activeTabName: string;
  opdName: string;
  appName: string;
}

export default function Header({ darkMode, activeTabName, opdName, appName }: HeaderProps) {
  // Format current UTC time on 2026-05-29T16:30:58Z or local representation
  const formattedDate = "Kamis, 29 Mei 2026";
  const formattedTime = "16:30 UTC";

  return (
    <header id="app-top-header" className={`border-b px-8 py-4 flex items-center justify-between transition-all duration-300 ${
      darkMode 
        ? 'bg-[#1e293b] border-[#334155] text-[#f8fafc]' 
        : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* Breadcrumb / Section Label */}
      <div id="breadcrumb-area" className="flex items-center gap-2">
        <span id="breadcrumb-main" className={`text-xs font-bold uppercase tracking-widest ${
          darkMode ? 'text-[#94a3b8]' : 'text-slate-500'
        }`}>
          Sistem Audit SPBE
        </span>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span id="breadcrumb-current" className={`text-sm font-bold ${darkMode ? 'text-[#38bdf8]' : 'text-emerald-600'}`}>
          {activeTabName}
        </span>
      </div>

      {/* Center metadata display on target of assessment */}
      <div id="assessment-target-badge" className={`hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
        darkMode 
          ? 'bg-[#0f172a]/60 border-[#334155] text-[#f8fafc]' 
          : 'bg-slate-50 border-slate-200 text-slate-700'
      }`}>
        <span id="badge-opd-label" className="text-[#94a3b8]">Target:</span>
        <span id="badge-opd-val" className="font-bold text-[#38bdf8]">{appName || "Aplikasi Daerah"}</span>
        <span id="badge-divider" className="text-slate-300 dark:text-[#334155]">|</span>
        <span id="badge-opd-name" className="text-emerald-500 font-bold">{opdName || "Dinas Terkait"}</span>
      </div>

      {/* Date-time Indicators */}
      <div id="header-time-info" className="flex items-center gap-4 text-xs">
        <div id="date-indicator" className={`flex items-center gap-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          <Calendar className="w-3.5 h-3.5 text-[#94a3b8]" />
          <span>{formattedDate}</span>
        </div>
        <div id="time-indicator" className={`flex items-center gap-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          <Clock className="w-3.5 h-3.5 text-[#94a3b8]" />
          <span className="font-mono">{formattedTime}</span>
        </div>
      </div>
    </header>
  );
}
