import React from 'react';
import { 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  Database, 
  Activity, 
  Settings, 
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Award
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line,
  AreaChart,
  Area
} from 'recharts';
import { ChecklistItem, FindingItem } from '../types/audit';
import { calculateStatistics } from '../utils/auditCalculator';

interface DashboardTabProps {
  checklist: ChecklistItem[];
  findings: FindingItem[];
  darkMode: boolean;
  onNavigate: (tab: string) => void;
}

export default function DashboardTab({ checklist, findings, darkMode, onNavigate }: DashboardTabProps) {
  const stats = calculateStatistics(checklist);

  // Group findings count by severity
  const criticalFindings = findings.filter(f => f.severity === 'Critical').length;
  const highFindings = findings.filter(f => f.severity === 'High').length;
  const mediumFindings = findings.filter(f => f.severity === 'Medium').length;
  const lowFindings = findings.filter(f => f.severity === 'Low').length;

  // Pie chart data for severity
  const severityData = [
    { name: 'Kritis (Critical)', value: criticalFindings, color: '#F43F5E' },
    { name: 'Tinggi (High)', value: highFindings, color: '#FB923C' },
    { name: 'Sedang (Medium)', value: mediumFindings, color: '#FBBF24' },
    { name: 'Rendah (Low)', value: lowFindings, color: '#38BDF8' }
  ].filter(item => item.value > 0);

  // Bar chart data for Control Assessment
  const controlBreakdownData = [
    { name: 'Memadai', jumlah: stats.memadaiCount, fill: '#10B981' },
    { name: 'Perlu Peningkatan', jumlah: stats.perluPeningkatanCount, fill: '#F59E0B' },
    { name: 'Tidak Memadai', jumlah: stats.tidakMemadaiCount, fill: '#EF4444' }
  ];

  // Radar chart data for compliance by categories (grouped)
  const categories: string[] = [
    'Pedoman Manajemen',
    'Standar Teknis SPBE',
    'Autentikasi',
    'Manajemen Sesi',
    'Kontrol Akses',
    'Validasi Input',
    'Kriptografi',
    'Eror dan Pencatatan Log',
    'Proteksi Data',
    'Keamanan Komunikasi',
    'Logika Bisnis',
    'File',
    'Keamanan API dan Web Service',
    'Keamanan Konfigurasi'
  ];

  const categoryRadarData = categories.map(cat => {
    const items = checklist.filter(item => item.kategori === cat);
    const total = items.length;
    const evaluated = items.filter(i => i.kesimpulanAudit !== 'Belum Dilakukan Evaluasi').length;
    const memadai = items.filter(i => i.kesimpulanAudit === 'Memadai').length;
    const partial = items.filter(i => i.kesimpulanAudit === 'Perlu Peningkatan').length;
    
    // Weighted score for compliance %
    let compliancePct = 100;
    if (evaluated > 0) {
      compliancePct = Math.round(((memadai * 100) + (partial * 50)) / total);
    } else {
      // dummy baseline based on standard profiles if none evaluated yet
      compliancePct = total > 0 ? (memadai / total) * 100 : 80;
    }

    return {
      category: cat.length > 20 ? cat.substring(0, 15) + '...' : cat,
      'Compliance %': compliancePct
    };
  });

  // Mock historic trend for the Line Chart representing last 5 audit cycle simulations
  const historicTrendData = [
    { cycle: 'Audit 2024 (I)', 'Skor Kepatuhan': 35, 'Temuan Mayor': 16 },
    { cycle: 'Audit 2024 (II)', 'Skor Kepatuhan': 48, 'Temuan Mayor': 11 },
    { cycle: 'Audit 2025 (I)', 'Skor Kepatuhan': 55, 'Temuan Mayor': 8 },
    { cycle: 'Audit 2025 (II)', 'Skor Kepatuhan': 62, 'Temuan Mayor': 6 },
    { cycle: 'Siklus Sekarang', 'Skor Kepatuhan': stats.complianceScore, 'Temuan Mayor': findings.length }
  ];

  return (
    <div id="dashboard-tab-root" className="space-y-6 animate-fade-in">
      
      {/* Intro section resembling government custom banner */}
      <div id="dashboard-hero-banner" className={`p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        darkMode 
          ? 'bg-gradient-to-r from-[#1e293b]/90 to-[#0f172a]/70 border-[#334155]' 
          : 'bg-gradient-to-r from-emerald-50 to-slate-100 border-slate-200'
      }`}>
        <div id="banner-text">
          <h2 id="banner-title" className="text-xl font-bold tracking-tight text-white dark:text-[#f8fafc]">Peta Keamanan & Kepatuhan SPBE Daerah</h2>
          <p id="banner-description" className={`text-sm mt-1 leading-relaxed ${darkMode ? 'text-[#94a3b8]' : 'text-slate-600'}`}>
            Berdasarkan lampiran teknik penilaian dari <strong>Peraturan BSSN Nomor 4 Tahun 2021</strong>. 
            Silakan tinjau kriteria kelayakan di tab checklist siber.
          </p>
        </div>
        <button
          id="hero-navigate-checklist"
          onClick={() => onNavigate('checklist')}
          className="flex items-center gap-1.5 px-4.5 py-2.5 bg-[#38bdf8] hover:bg-[#38bdf8]/90 text-[#0f172a] rounded-xl text-xs font-bold shadow-md transition-all shrink-0 active:scale-95 cursor-pointer"
        >
          <span>Mulai Koreksi Evaluasi</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Key Performance Indicators (KPIs) */}
      <div id="dashboard-kpis-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Compliance Rating Indicator */}
        <div id="card-compliance" className={`p-5 rounded-xl border transition-all ${
          darkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">Compliance Score</span>
            <div className="p-2 bg-[#38bdf8]/15 text-[#38bdf8] rounded-lg">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-[#38bdf8]">{stats.complianceScore}%</span>
            <span className={`text-xs font-bold ${stats.ratingColor}`}>({stats.ratingLevel})</span>
          </div>
          <div className="mt-3.5">
            <div className="w-full bg-slate-200 dark:bg-[#334155] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#38bdf8] to-[#818cf8] h-full rounded-full transition-all duration-500" 
                style={{ width: `${stats.complianceScore}%` }}
              />
            </div>
            <p className="text-[10px] text-[#94a3b8] mt-2">Bobot pemenuhan kontrol terarsir</p>
          </div>
        </div>

        {/* Total Assessed Controls */}
        <div id="card-checklist-progress" className={`p-5 rounded-xl border transition-all ${
          darkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">Progress Audit</span>
            <div className="p-2 bg-[#38bdf8]/15 text-[#38bdf8] rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex gap-2 items-baseline">
            <span className="text-3xl font-extrabold tracking-tight text-white">{stats.assessedControls}</span>
            <span className="text-[#94a3b8] text-xs">/ {stats.totalControls} Kontrol</span>
          </div>
          <div className="mt-4 flex gap-1.5 items-center">
            <span className={`text-xs font-bold text-[#22c55e]`}>
              {stats.totalControls > 0 ? Math.round((stats.assessedControls / stats.totalControls) * 100) : 0}% Selesai
            </span>
            <span className="text-[#94a3b8] text-[10px]">• 15 Kategori Terintegrasi</span>
          </div>
        </div>

        {/* Total Findings Active */}
        <div id="card-total-findings" className={`p-5 rounded-xl border transition-all ${
          darkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">Total Temuan</span>
            <div className={`p-2 rounded-lg ${findings.length > 0 ? 'bg-rose-500/10 text-[#ef4444]' : 'bg-emerald-500/10 text-emerald-500'}`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex gap-2 items-baseline">
            <span className="text-3xl font-extrabold tracking-tight text-[#ef4444]">{findings.length}</span>
            <span className="text-xs font-bold text-[#94a3b8]">
              ({findings.filter(f => f.statusTindakLanjut !== 'Resolved').length} Aktif)
            </span>
          </div>
          <p className="text-[10px] text-[#94a3b8] mt-5">
            {criticalFindings} Kritis, {highFindings} Tinggi, {mediumFindings} Sedang
          </p>
        </div>

        {/* Action Status */}
        <div id="card-action-status" className={`p-5 rounded-xl border transition-all ${
          darkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">Tingkat Risiko</span>
            <div className="p-2 bg-amber-500/10 text-[#f97316] rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex gap-2 items-baseline">
            <span className={`text-2xl font-extrabold tracking-tight ${
              criticalFindings > 0 ? 'text-[#ef4444]' : highFindings > 0 ? 'text-[#f97316]' : 'text-[#eab308]'
            }`}>
              {criticalFindings > 0 ? 'CRITICAL' : highFindings > 0 ? 'HIGH' : 'MEDIUM'}
            </span>
          </div>
          <p className="text-[10px] text-[#94a3b8] mt-6 leading-relaxed">
            Dipetakan mandiri pada koordinat matriks standard BSSN
          </p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div id="charts-grid-main" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Radar Chart: Compliance mapping per Category */}
        <div id="chart-radar-container" className={`p-6 rounded-xl border ${
          darkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h3 className="text-sm font-bold tracking-tight mb-4 flex items-center gap-1.5 text-white dark:text-[#f8fafc]">
            <span>Matriks Otoritas Kepatuhan per Topik Keamanan</span>
          </h3>
          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={categoryRadarData}>
                <PolarGrid stroke={darkMode ? "#334155" : "#E2E8F0"} />
                <PolarAngleAxis dataKey="category" stroke={darkMode ? "#94A3B8" : "#475569"} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={darkMode ? "#475569" : "#CBD5E1"} />
                <Radar 
                  name="Skor Kepatuhan %" 
                  dataKey="Compliance %" 
                  stroke="#38bdf8" 
                  fill="#38bdf8" 
                  fillOpacity={0.25} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#0f172a' : '#FFFFFF', 
                    borderColor: '#38bdf8',
                    borderRadius: '8px',
                    color: darkMode ? '#f8fafc' : '#0F172A'
                  }} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Timeline / Historic Trend Line Chart */}
        <div id="chart-line-container" className={`p-6 rounded-xl border ${
          darkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h3 className="text-sm font-bold tracking-tight mb-4 flex items-center gap-1.5 text-white dark:text-[#f8fafc]">
            <TrendingUp className="w-4 h-4 text-[#38bdf8]" />
            <span>Kinerja Audit Kepatuhan Historis & Siklus Rilis</span>
          </h3>
          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFindings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="cycle" stroke={darkMode ? "#94a3b8" : "#475569"} />
                <YAxis stroke={darkMode ? "#94a3b8" : "#475569"} />
                <CartesianGridVertical stroke={darkMode ? "#1E293B" : "#F1F5F9"} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1e293b' : '#FFFFFF', 
                    borderRadius: '12px',
                    borderColor: darkMode ? '#334155' : '#E2E8F0'
                  }} 
                />
                <Legend />
                <Area type="monotone" dataKey="Skor Kepatuhan" stroke="#38bdf8" fillOpacity={1} fill="url(#colorCompliance)" strokeWidth={3} />
                <Area type="monotone" dataKey="Temuan Mayor" stroke="#ef4444" fillOpacity={1} fill="url(#colorFindings)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts row */}
      <div id="charts-grid-secondary" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pie chart: Findings Breakdown */}
        <div id="chart-pie-findings" className={`p-6 rounded-xl border lg:col-span-1 ${
          darkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h3 className="text-sm font-bold tracking-tight mb-4 text-white dark:text-[#f8fafc]">Proporsi Severitas Temuan</h3>
          {findings.length > 0 ? (
            <div className="h-64 w-full flex flex-col justify-between text-xs">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#0f172a' : '#FFFFFF',
                        borderRadius: '8px', 
                        borderColor: '#38bdf8' 
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {severityData.map((item, id) => (
                  <div key={id} className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate text-slate-400">{item.name}: <span className="font-bold text-slate-200 dark:text-[#f8fafc]">{item.value}</span></span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <CheckCircle className="w-12 h-12 text-emerald-500 mb-2" />
              <p className="text-xs">Tidak ada temuan aktif (100% Bersih)</p>
            </div>
          )}
        </div>

        {/* Bar chart: Controls status */}
        <div id="chart-bar-controls" className={`p-6 rounded-xl border lg:col-span-2 ${
          darkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h3 className="text-sm font-bold tracking-tight mb-4 text-white dark:text-[#f8fafc]">Evaluasi Struktur Desain & Implementasi Kontrol</h3>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={controlBreakdownData} barSize={40}>
                <XAxis dataKey="name" stroke={darkMode ? "#94a3b8" : "#475569"} />
                <YAxis stroke={darkMode ? "#94a3b8" : "#475569"} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#0f172a' : '#FFFFFF',
                    borderRadius: '8px', 
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                  }}
                />
                <Bar dataKey="jumlah" radius={[10, 10, 0, 0]}>
                  {controlBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline helper for Grid lines in charts to support dark/light cleanly
function CartesianGridVertical({ stroke }: { stroke: string }) {
  return (
    <g>
      <line x1="0" y1="0" x2="1000" y2="0" stroke={stroke} strokeDasharray="3 3" />
    </g>
  );
}
