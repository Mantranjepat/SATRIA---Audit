import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  FileText, 
  CheckSquare, 
  Grid3X3, 
  AlertTriangle, 
  FileSpreadsheet, 
  Sun, 
  Moon,
  UserCheck,
  Database,
  Users,
  LogOut,
  Shield
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (mode: boolean) => void;
}

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  darkMode, 
  setDarkMode 
}: SidebarProps) {
  const { user, logout } = useAuth();
  
  // Base navigation items
  const baseNavItems = [
    { id: 'dashboard', name: 'Dashboard Audit', icon: LayoutDashboard },
    { id: 'identity', name: 'Identitas Objek', icon: FileText },
    { id: 'checklist', name: 'Checklist Evaluasi', icon: CheckSquare },
    { id: 'risk', name: 'Risk Heatmap 5x5', icon: Grid3X3 },
    { id: 'findings', name: 'Temuan Audit (& PIC)', icon: AlertTriangle },
    { id: 'conclusion', name: 'Kesimpulan & Laporan', icon: FileSpreadsheet },
  ];

  // If user is Admin, append Database & User Management menu options
  const navItems = user?.role === 'ADMIN' 
    ? [
        ...baseNavItems, 
        { id: 'database', name: 'Database Supabase', icon: Database },
        { id: 'users', name: 'Manajemen User', icon: Users }
      ]
    : baseNavItems;

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrator';
      case 'AUDITOR': return 'Auditor Utama';
      case 'AUDITEE': return 'OPD / Auditee';
      default: return 'Viewer / Pimpinan';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'text-rose-450 bg-rose-500/10 border-rose-500/20';
      case 'AUDITOR': return 'text-emerald-450 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-amber-450 bg-amber-500/10 border-amber-500/20';
    }
  };

  return (
    <aside id="sidebar-container" className={`w-72 border-r flex flex-col transition-all duration-300 ${
      darkMode 
        ? 'bg-[#1e293b] border-[#334155] text-slate-100' 
        : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* Brand Header */}
      <div id="sidebar-brand" className={`p-6 border-b flex items-center gap-3 ${
        darkMode ? 'border-[#334155]' : 'border-slate-100'
      }`}>
        <div id="brand-logo-bg" className="bg-[#38bdf8]/10 p-2 rounded-lg text-[#38bdf8]">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h1 id="brand-title" className="font-extrabold tracking-wider text-base leading-tight text-[#38bdf8]">SATRIA</h1>
          <p id="brand-subtitle" className={`text-[11px] font-medium tracking-wide ${darkMode ? 'text-[#94a3b8]' : 'text-slate-500'}`}>
           Sistem Audit Tata Kelola Risiko dan Informasi
          </p>
        </div>
      </div>

      {/* Nav Items */}
      <nav id="sidebar-navbar" className="flex-1 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all duration-200 border-l-4 ${
                isActive
                  ? 'bg-[#334155] text-[#38bdf8] border-[#38bdf8]'
                  : darkMode
                    ? 'border-transparent text-[#94a3b8] hover:bg-[#334155]/40 hover:text-white'
                    : 'border-transparent text-slate-600 hover:bg-slate-150 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#38bdf8]' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* User Session Info */}
      {user && (
        <div id="sidebar-author" className={`p-4 mx-4 mb-3 rounded-xl border flex flex-col gap-3.5 ${
          darkMode 
            ? 'bg-[#0f172a]/85 border-[#334155]' 
            : 'bg-slate-50 border-slate-150'
        }`}>
          <div id="auditor-meta-header" className="flex items-center gap-3">
            <div id="auditor-icon-wrap" className="w-9 h-9 rounded-full bg-[#38bdf8]/10 text-[#38bdf8] flex items-center justify-center shrink-0">
              {user.role === 'ADMIN' ? (
                <Shield className="w-4.5 h-4.5 text-rose-450" />
              ) : (
                <UserCheck className="w-4.5 h-4.5 text-[#38bdf8]" />
              )}
            </div>
            <div className="overflow-hidden">
              <p id="auditor-val" className="text-xs font-bold truncate text-[#f8fafc] dark:text-[#f8fafc] text-slate-800" title={user.name}>
                {user.name}
              </p>
              <span className={`inline-block py-0.5 px-2 rounded-full text-[9px] font-bold uppercase tracking-wider border mt-1 ${getRoleBadgeColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </span>
            </div>
          </div>
          
          <button
            onClick={() => logout()}
            className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Sistem (Log Out)</span>
          </button>
        </div>
      )}

      {/* Theme Switcher Bottom Panel */}
      <div id="sidebar-footer" className={`p-4 border-t flex items-center justify-between ${
        darkMode ? 'border-[#334155]' : 'border-slate-100'
      }`}>
        <span id="theme-label" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mode Tampilan</span>
        <button
          id="theme-toggle-btn"
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-xl border transition-all duration-200 ${
            darkMode 
              ? 'bg-[#334155] border-[#334155] text-yellow-400 hover:bg-[#1e293b]' 
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
          title="Ubah Tema"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
