import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle, 
  X, 
  User, 
  Calendar,
  Layers,
  HelpCircle,
  Search,
  Filter,
  Wrench,
  UploadCloud,
  XCircle
} from 'lucide-react';
import { FindingItem } from '../types/audit';
import { getSeverityLevel } from '../utils/auditCalculator';

interface FindingsTabProps {
  findings: FindingItem[];
  setFindings: React.Dispatch<React.SetStateAction<FindingItem[]>>;
  darkMode: boolean;
  readOnly?: boolean;
  role?: 'ADMIN' | 'AUDITOR' | 'AUDITEE';
  isAuditLocked?: boolean;
}

export default function FindingsTab({ 
  findings, 
  setFindings, 
  darkMode, 
  readOnly = false,
  role = 'AUDITOR',
  isAuditLocked = false
}: FindingsTabProps) {
  const isLockedForAuditee = role === 'AUDITEE' && isAuditLocked;
  const isFullyReadOnly = readOnly || isLockedForAuditee;

  const [search, setSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [editingFinding, setEditingFinding] = useState<FindingItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // States for new Finding creation
  const [newFinding, setNewFinding] = useState<Omit<FindingItem, 'id' | 'severity'>>({
    noTemuan: '',
    kategori: 'Autentikasi',
    deskripsi: '',
    rekomendasi: '',
    statusTindakLanjut: 'Open',
    pic: '',
    targetSelesai: '',
    likelihood: 3,
    impact: 3
  });

  const severityOptions = ['All', 'Critical', 'High', 'Medium', 'Low'];
  const statusOptions = ['All', 'Open', 'In Progress', 'Resolved'];

  const handleCreateFinding = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedSeverity = getSeverityLevel(newFinding.likelihood, newFinding.impact);
    const added: FindingItem = {
      ...newFinding,
      id: `F-${Date.now().toString().slice(-4)}`,
      severity: resolvedSeverity
    };

    setFindings(prev => [added, ...prev]);
    setShowAddForm(false);
    // Reset new form
    setNewFinding({
      noTemuan: '',
      kategori: 'Autentikasi',
      deskripsi: '',
      rekomendasi: '',
      statusTindakLanjut: 'Open',
      pic: '',
      targetSelesai: '',
      likelihood: 3,
      impact: 3
    });
  };

  const handleUpdateFinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFinding) return;

    const resolvedSeverity = getSeverityLevel(editingFinding.likelihood, editingFinding.impact);
    const updated: FindingItem = {
      ...editingFinding,
      severity: resolvedSeverity
    };

    setFindings(prev => prev.map(f => f.id === updated.id ? updated : f));
    setEditingFinding(null);
  };

  const handleDeleteFinding = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus temuan ini?')) {
      setFindings(prev => prev.filter(f => f.id !== id));
    }
  };

  // Filters mapping
  const filteredFindings = findings.filter(f => {
    const matchesKeyword = f.deskripsi.toLowerCase().includes(search.toLowerCase()) || 
                           f.pic.toLowerCase().includes(search.toLowerCase()) || 
                           f.noTemuan.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = selectedSeverity === 'All' || f.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'All' || f.statusTindakLanjut === selectedStatus;
    
    return matchesKeyword && matchesSeverity && matchesStatus;
  });

  const getSeverityBadge = (sev: 'Low' | 'Medium' | 'High' | 'Critical') => {
    switch (sev) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm shadow-rose-500/15">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>Kritis</span>
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-900 shadow-sm shadow-amber-500/15">
            <span>Tinggi</span>
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-400 text-slate-900 shadow-sm">
            <span>Sedang</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-200 text-sky-850 dark:bg-sky-500/10 dark:text-sky-400">
            <span>Low</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: 'Open' | 'In Progress' | 'Resolved') => {
    switch (status) {
      case 'Open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <span>Open (Belum Selesai)</span>
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <span>In Progress</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <span>Resolved</span>
          </span>
        );
    }
  };

  return (
    <div id="findings-tab-root" className="space-y-6 animate-fade-in relative">
      
      {/* Header and top trigger button */}
      <div id="findings-header" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 id="tab-title" className="text-xl font-bold tracking-tight">Daftar Temuan & Rencana Tindak Lanjut</h2>
          <p id="tab-subtitle" className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Kelola, klasifikasikan tingkat risiko, dan tugaskan PIC penyelesaian temuan audit secara terstruktur.
          </p>
        </div>
        {role === 'ADMIN' || role === 'AUDITOR' ? (
          <button
            id="btn-add-finding"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/10 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Temuan Baru</span>
          </button>
        ) : role === 'AUDITEE' ? (
          <span className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 uppercase tracking-wider font-mono">
            RUANG REMEDIASl OPD
          </span>
        ) : (
          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-widest animate-pulse">
            READ-ONLY MODE (VIEWER)
          </span>
        )}
      </div>

      {/* Audit Findings Search & Filter toolbar */}
      <div id="findings-filters" className={`p-5 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
        darkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Keyword Search */}
        <div id="search-box" className="w-full md:w-80 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari deskripsi, PIC, nometuan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none text-xs transition ${
              darkMode 
                ? 'bg-[#0f172a]/60 border-[#334155] text-white focus:border-[#38bdf8]' 
                : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
            }`}
          />
        </div>

        {/* Severity & Status filters */}
        <div id="filter-selectors" className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Severity filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-slate-400 shrink-0">Severitas:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className={`w-full sm:w-36 px-3 py-2 rounded-xl text-xs outline-none border ${
                darkMode ? 'bg-[#0f172a]/60 border-[#334155] text-white focus:border-[#38bdf8]' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              {severityOptions.map((o, idx) => (
                <option key={idx} value={o}>
                  {o === 'All' ? 'Semua Severitas' : o}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-slate-400 shrink-0">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`w-full sm:w-36 px-3 py-2 rounded-xl text-xs outline-none border ${
                darkMode ? 'bg-[#0f172a]/60 border-[#334155] text-white focus:border-[#38bdf8]' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              {statusOptions.map((o, idx) => (
                <option key={idx} value={o}>
                  {o === 'All' ? 'Semua Status' : o}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table for Findings */}
      <div id="findings-table-container" className={`border rounded-xl overflow-hidden ${
        darkMode ? 'border-[#334155]' : 'border-slate-200 shadow-sm'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-xs font-bold uppercase tracking-wider border-b ${
                darkMode ? 'bg-[#0f172a]/80 border-[#334155] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <th className="py-4.5 px-6 w-14 text-center">ID</th>
                <th className="py-4.5 px-6 w-32">KATEGORI</th>
                <th className="py-4.5 px-6">DESKRIPSI & REKOMENDASI</th>
                <th className="py-4.5 px-6 w-32">SEVERITAS</th>
                <th className="py-4.5 px-6 w-36">PIC & TARKT SELST</th>
                <th className="py-4.5 px-6 w-36">STATUS</th>
                {(!readOnly || role === 'AUDITEE') && <th className="py-4.5 px-4 w-28 text-center">AKSI</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
              {filteredFindings.length > 0 ? (
                filteredFindings.map((finding) => (
                  <tr 
                    key={finding.id} 
                    id={`finding-${finding.id}`}
                    className={`text-xs transition-colors hover:bg-slate-55/50 dark:hover:bg-slate-900/30 ${
                      darkMode ? 'text-slate-200' : 'text-slate-850'
                    }`}
                  >
                    {/* Finding Number */}
                    <td className="py-4 px-6 text-center font-bold font-mono text-slate-400">
                      <div>{finding.id}</div>
                      <div className="text-[10px] text-slate-500 whitespace-nowrap mt-0.5">{finding.noTemuan}</div>
                    </td>

                    {/* Category Label */}
                    <td className="py-4 px-6 font-semibold">
                      {finding.kategori}
                    </td>

                    {/* Desc and recommendation values */}
                    <td className="py-4 px-6 space-y-2 max-w-sm">
                      <p className="font-semibold leading-relaxed">{finding.deskripsi}</p>
                      <div className={`p-2.5 rounded-xl border text-[11px] ${
                        darkMode ? 'bg-slate-950/40 border-slate-850 text-slate-300' : 'bg-emerald-50/40 border-slate-150 text-slate-600'
                      }`}>
                        <strong>Rekomendasi:</strong> {finding.rekomendasi}
                      </div>

                      {/* Display Auditee Response if present */}
                      {(finding.klarifikasiAuditee || finding.buktiPerbaikan || finding.buktiFile) && (
                        <div className={`p-3 rounded-xl border text-[11px] space-y-1.5 font-sans ${
                          darkMode ? 'bg-[#818cf8]/5 border-[#818cf8]/20 text-[#c7d2fe]' : 'bg-indigo-50 border-indigo-100 text-indigo-900'
                        }`}>
                          <div className="font-extrabold text-[10px] uppercase tracking-wider text-[#818cf8] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#818cf8]" />
                            <span>Aktivitas Remediasi Instansi OPD (Auditee)</span>
                          </div>
                          {finding.klarifikasiAuditee && (
                            <p className="leading-relaxed"><strong className="opacity-75">Klarifikasi:</strong> "{finding.klarifikasiAuditee}"</p>
                          )}
                          {finding.buktiPerbaikan && (
                            <p className="leading-relaxed"><strong className="opacity-75">Solusi Keamanan:</strong> {finding.buktiPerbaikan}</p>
                          )}
                          {finding.buktiFile && (
                            <div className="flex items-center gap-1 font-mono text-[9px] mt-1 bg-indigo-500/10 p-1 px-2 border border-indigo-500/20 rounded-lg w-fit text-[#818cf8]">
                              <span>📎 FILE BUKTI: {finding.buktiFile}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Severity colored badge */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1 items-start">
                        {getSeverityBadge(finding.severity)}
                        <span className="text-[9px] text-slate-400">Skor: {finding.likelihood * finding.impact} (L:{finding.likelihood} x I:{finding.impact})</span>
                      </div>
                    </td>

                    {/* Assignee / Deadline */}
                    <td className="py-4 px-6 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-350 dark:text-slate-300 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{finding.pic}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>Deadline: {finding.targetSelesai || 'Belum diatur'}</span>
                      </div>
                    </td>

                    {/* Progress Action Status */}
                    <td className="py-4 px-6">
                      {getStatusBadge(finding.statusTindakLanjut)}
                    </td>

                    {/* Edit and Delete action controls */}
                    {(!readOnly || role === 'AUDITEE') && (
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-sans">
                          {role === 'AUDITEE' ? (
                            <button
                              onClick={() => setEditingFinding({ ...finding })}
                              className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${
                                darkMode 
                                  ? 'bg-[#818cf8]/10 border-[#818cf8]/35 text-[#a5b4fc] hover:bg-[#818cf8]/20' 
                                  : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-slate-100'
                              }`}
                              title="Unggah Bukti & Klarifikasi"
                            >
                              <Wrench className="w-3.5 h-3.5 text-[#818cf8]" />
                              <span>Remediasi</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingFinding({ ...finding })}
                                className={`p-2 rounded-xl border transition active:scale-95 cursor-pointer ${
                                  darkMode 
                                    ? 'bg-[#0f172a] border-[#334155] text-[#38bdf8] hover:bg-[#334155]' 
                                    : 'bg-slate-50 border-slate-200 text-emerald-600 hover:bg-slate-100'
                                }`}
                                title="Ubah Rencana"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteFinding(finding.id)}
                                className={`p-2 rounded-xl border transition text-rose-500 active:scale-95 cursor-pointer ${
                                  darkMode 
                                    ? 'bg-[#0f172a] border-[#334155] hover:bg-rose-950/20 hover:border-rose-900/30' 
                                    : 'bg-slate-50 border-slate-200 hover:bg-rose-50'
                                }`}
                                title="Hapus Temuan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={readOnly ? 6 : 7} className="py-12 text-center text-slate-400">
                    <AlertTriangle className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs">Tidak ada temuan yang cocok dengan filter yang dipilih.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP: Add Finding Form Modal */}
      {showAddForm && (
        <div id="add-modal-overlay" className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateFinding}
            className={`w-full max-w-2xl rounded-2xl border overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-scale-up ${
              darkMode ? 'bg-[#1e293b] border-[#334155] text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className={`p-6 border-b flex items-center justify-between ${
              darkMode ? 'border-[#334155]' : 'border-slate-100'
            }`}>
              <span className="font-bold text-base text-white dark:text-[#f8fafc]">Registrasi Temuan Baru</span>
              <button type="button" onClick={() => setShowAddForm(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-[#94a3b8] uppercase tracking-wide text-[10px]">Kode Temuan / No Kriteria</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: A.3.1-01"
                    value={newFinding.noTemuan}
                    onChange={(e) => setNewFinding(prev => ({ ...prev, noTemuan: e.target.value }))}
                    className={`px-3 py-2 rounded-xl outline-none border ${
                      darkMode ? 'bg-[#0f172a]/60 border-[#334155] text-white focus:border-[#38bdf8]' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-[#94a3b8] uppercase tracking-wide text-[10px]">Kategori Pembagian</label>
                  <select
                    value={newFinding.kategori}
                    onChange={(e) => setNewFinding(prev => ({ ...prev, kategori: e.target.value }))}
                    className={`px-3 py-2 rounded-xl outline-none border ${
                      darkMode ? 'bg-[#0f172a]/60 border-[#334155] text-white focus:border-[#38bdf8]' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="Autentikasi">Autentikasi</option>
                    <option value="Manajemen Sesi">Manajemen Sesi</option>
                    <option value="Validator Input">Validasi Input</option>
                    <option value="Keamanan API">Keamanan API</option>
                    <option value="Kebocoran Data">Proteksi Data</option>
                    <option value="Server Hardening">Keamanan Konfigurasi</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-400 uppercase tracking-wide text-[10px]">Uraian Deskripsi Temuan</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail temuan audit siber..."
                  value={newFinding.deskripsi}
                  onChange={(e) => setNewFinding(prev => ({ ...prev, deskripsi: e.target.value }))}
                  className={`px-3 py-2 rounded-xl outline-none border resize-none ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-400 uppercase tracking-wide text-[10px]">Saran Rekomendasi Mitigasi</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Isikan saran peningkatan pengamanan teknis..."
                  value={newFinding.rekomendasi}
                  onChange={(e) => setNewFinding(prev => ({ ...prev, rekomendasi: e.target.value }))}
                  className={`px-3 py-2 rounded-xl outline-none border resize-none ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-400 uppercase tracking-wide text-[10px]">Person In Charge (PIC)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Tim IT Aptika Diskominfo"
                    value={newFinding.pic}
                    onChange={(e) => setNewFinding(prev => ({ ...prev, pic: e.target.value }))}
                    className={`px-3 py-2 rounded-xl outline-none border ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-400 uppercase tracking-wide text-[10px]">Target Selesai Tindak Lanjut</label>
                  <input
                    type="date"
                    required
                    value={newFinding.targetSelesai}
                    onChange={(e) => setNewFinding(prev => ({ ...prev, targetSelesai: e.target.value }))}
                    className={`px-3 py-2 rounded-xl outline-none border ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Likelihood & Impact selection to calculate severity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 dark:border-slate-800">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-slate-400 uppercase tracking-wide text-[10px]">Metrik Likehood (Kemungkinan: 1-5)</label>
                    <span className="font-bold text-emerald-500 font-mono text-sm">{newFinding.likelihood}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={newFinding.likelihood}
                    onChange={(e) => setNewFinding(prev => ({ ...prev, likelihood: parseInt(e.target.value) }))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-slate-400 uppercase tracking-wide text-[10px]">Metrik Dampak (Impact: 1-5)</label>
                    <span className="font-bold text-emerald-500 font-mono text-sm">{newFinding.impact}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={newFinding.impact}
                    onChange={(e) => setNewFinding(prev => ({ ...prev, impact: parseInt(e.target.value) }))}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>

              {/* Real-time calculated Severity view */}
              <div className={`p-3.5 rounded-xl text-center border flex items-center justify-between ${
                darkMode ? 'bg-slate-950/60 border-slate-850' : 'bg-slate-50 border-slate-110'
              }`}>
                <span className="font-bold text-slate-400 text-[10px] uppercase">Prediksi Severitas (Score: {newFinding.likelihood * newFinding.impact}):</span>
                {getSeverityBadge(getSeverityLevel(newFinding.likelihood, newFinding.impact))}
              </div>

            </div>

            <div className={`p-6 border-t flex items-center justify-end gap-3 ${
              darkMode ? 'border-slate-800 bg-slate-950/30' : 'border-slate-100 bg-slate-50/50'
            }`}>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className={`px-4 py-2 rounded-xl border font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                  darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-700'
                }`}
              >
                Batal
              </button>
              <button 
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-600/10 transition"
              >
                Tambahkan Temuan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POPUP: Edit Finding Form Modal */}
      {editingFinding && role !== 'AUDITEE' && (
        <div id="edit-modal-overlay" className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleUpdateFinding}
            className={`w-full max-w-2xl rounded-2xl border overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-scale-up ${
              darkMode ? 'bg-[#1e293b] border-[#334155] text-[#f8fafc]' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className={`p-6 border-b flex items-center justify-between ${
              darkMode ? 'border-[#334155]' : 'border-slate-100'
            }`}>
              <span className="font-bold text-sm text-white dark:text-[#f8fafc]">Modifikasi Rencana Tindak Lanjut: {editingFinding.id}</span>
              <button type="button" onClick={() => setEditingFinding(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-[#94a3b8] uppercase tracking-wide text-[10px]">Kode Kriteria (No)</label>
                  <input
                    type="text"
                    required
                    value={editingFinding.noTemuan}
                    onChange={(e) => setEditingFinding(prev => prev ? ({ ...prev, noTemuan: e.target.value }) : null)}
                    className={`px-3 py-2 rounded-xl border outline-none ${
                      darkMode ? 'bg-[#0f172a]/60 border-[#334155] text-white focus:border-[#38bdf8]' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-[#94a3b8] uppercase tracking-wide text-[10px]">Status Kerentanan</label>
                  <select
                    value={editingFinding.statusTindakLanjut}
                    onChange={(e) => setEditingFinding(prev => prev ? ({ ...prev, statusTindakLanjut: e.target.value as any }) : null)}
                    className={`px-3 py-2 rounded-xl border outline-none ${
                      darkMode ? 'bg-[#0f172a]/60 border-[#334155] text-white focus:border-[#38bdf8]' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved (Tutup Celah)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-[#94a3b8] uppercase tracking-wide text-[10px]">Kategori Pembagian</label>
                  <input
                    type="text"
                    required
                    value={editingFinding.kategori}
                    onChange={(e) => setEditingFinding(prev => prev ? ({ ...prev, kategori: e.target.value }) : null)}
                    className={`px-3 py-2 rounded-xl border outline-none ${
                      darkMode ? 'bg-[#0f172a]/60 border-[#334155] text-white focus:border-[#38bdf8]' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#94a3b8] uppercase tracking-wide text-[10px]">Deskripsi Lengkap Temuan</label>
                <textarea
                  rows={3}
                  required
                  value={editingFinding.deskripsi}
                  onChange={(e) => setEditingFinding(prev => prev ? ({ ...prev, deskripsi: e.target.value }) : null)}
                  className={`px-3 py-2 rounded-xl outline-none border resize-none ${
                    darkMode ? 'bg-[#0f172a]/60 border-[#334155] text-white focus:border-[#38bdf8]' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#94a3b8] uppercase tracking-wide text-[10px]">Rekomendasi Perbaikan Teknis</label>
                <textarea
                  rows={3}
                  required
                  value={editingFinding.rekomendasi}
                  onChange={(e) => setEditingFinding(prev => prev ? ({ ...prev, rekomendasi: e.target.value }) : null)}
                  className={`px-3 py-2 rounded-xl outline-none border resize-none ${
                    darkMode ? 'bg-[#0f172a]/60 border-[#334155] text-white focus:border-[#38bdf8]' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-[#94a3b8] uppercase tracking-wide text-[10px]">Person In Charge (PIC)</label>
                  <input
                    type="text"
                    required
                    value={editingFinding.pic}
                    onChange={(e) => setEditingFinding(prev => prev ? ({ ...prev, pic: e.target.value }) : null)}
                    className={`px-3 py-2 rounded-xl border outline-none ${
                      darkMode ? 'bg-[#0f172a]/60 border-[#334155] text-white focus:border-[#38bdf8]' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-[#94a3b8] uppercase tracking-wide text-[10px]">Target Penyelesaian</label>
                  <input
                    type="date"
                    required
                    value={editingFinding.targetSelesai}
                    onChange={(e) => setEditingFinding(prev => prev ? ({ ...prev, targetSelesai: e.target.value }) : null)}
                    className={`px-3 py-2 rounded-xl border outline-none ${
                      darkMode ? 'bg-[#0f172a]/60 border-[#334155] text-white focus:border-[#38bdf8]' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Likelihood / Impact modifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 dark:border-[#334155]">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-slate-400 uppercase tracking-wide text-[10px]">Metrik Likelihood ({editingFinding.likelihood})</label>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={editingFinding.likelihood}
                    onChange={(e) => setEditingFinding(prev => prev ? ({ ...prev, likelihood: parseInt(e.target.value) }) : null)}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-slate-400 uppercase tracking-wide text-[10px]">Metrik Dampak ({editingFinding.impact})</label>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={editingFinding.impact}
                    onChange={(e) => setEditingFinding(prev => prev ? ({ ...prev, impact: parseInt(e.target.value) }) : null)}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>

              {/* Server Calculated dynamic display */}
              <div className={`p-3.5 rounded-xl text-center border flex items-center justify-between ${
                darkMode ? 'bg-[#0f172a]/60 border-[#334155]' : 'bg-slate-50 border-slate-110'
              }`}>
                <span className="font-bold text-slate-400 text-[10px] uppercase">Tingkat Severitas (Skor: {editingFinding.likelihood * editingFinding.impact}):</span>
                {getSeverityBadge(getSeverityLevel(editingFinding.likelihood, editingFinding.impact))}
              </div>

            </div>

            <div className={`p-6 border-t flex items-center justify-end gap-3 ${
              darkMode ? 'border-[#334155] bg-slate-950/30' : 'border-slate-100 bg-slate-50/50'
            }`}>
              <button 
                type="button" 
                onClick={() => setEditingFinding(null)}
                className={`px-4 py-2 rounded-xl border font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                  darkMode ? 'border-[#334155] text-slate-400' : 'border-slate-200 text-slate-700'
                }`}
              >
                Batal
              </button>
              <button 
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-600/10 transition"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POPUP: Remediasi & Tindak Lanjut Form Modal for AUDITEE */}
      {editingFinding && role === 'AUDITEE' && (
        <div id="auditee-modal-overlay" className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              setFindings(prev => prev.map(f => f.id === editingFinding.id ? editingFinding : f));
              setEditingFinding(null);
            }}
            className={`w-full max-w-2xl rounded-2xl border overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-scale-up ${
              darkMode ? 'bg-[#1e293b] border-[#334155] text-[#f8fafc]' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            {/* Modal Header */}
            <div className={`p-5 border-b flex items-center justify-between ${
              darkMode ? 'border-[#334155] bg-[#0f172a]/40' : 'border-slate-100 bg-slate-50/50'
            }`}>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                  <Wrench className="w-5 h-5 text-[#818cf8]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#818cf8]">FORM RESPON KLARIFIKASI & TINDAK LANJUT</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Instansi Pelaksana Penanganan Temuan Siber Daerah</p>
                </div>
              </div>
              <button type="button" onClick={() => setEditingFinding(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              
              {/* SECTION 1: Detail Temuan dari Auditor (Read-Only) */}
              <div className={`p-4 rounded-xl border space-y-3 ${
                darkMode ? 'bg-[#0f172a]/70 border-[#334155]' : 'bg-slate-100/50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800 border-slate-200/55">
                  <span className="font-extrabold text-[10px] uppercase text-[#94a3b8] tracking-wider">Identifikasi Kerentanan Temuan</span>
                  <span className="font-mono font-bold bg-[#334155] text-slate-200 px-2 py-0.5 rounded text-[10px]">
                    No: {editingFinding.noTemuan}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
                  <div>
                    <span className="opacity-60 text-[10px] block font-bold uppercase">Kategori Kriteria</span>
                    <span className="font-semibold">{editingFinding.kategori}</span>
                  </div>
                  <div>
                    <span className="opacity-60 text-[10px] block font-bold uppercase">Sifat Ancaman / Severitas</span>
                    <span className="font-semibold flex items-center gap-1.5 mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${
                        editingFinding.severity === 'Tinggi' ? 'bg-red-500' : editingFinding.severity === 'Sedang' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      {editingFinding.severity}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t dark:border-slate-800 border-slate-200/55 text-[11px]">
                  <p className="leading-relaxed"><strong className="opacity-80">Rincian Temuan:</strong> {editingFinding.deskripsi}</p>
                  <p className="leading-relaxed text-indigo-400 dark:text-[#a5b4fc]"><strong className="opacity-80 text-slate-350 dark:text-slate-300">Rekomendasi Auditor:</strong> {editingFinding.rekomendasi}</p>
                </div>
              </div>

              {/* SECTION 2: Form Input Remediasi (Editable) */}
              <div className="space-y-4 font-sans">
                
                {isLockedForAuditee && (
                  <div className="p-3.5 rounded-xl border bg-rose-500/10 border-rose-500/30 text-rose-400 flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    <div>
                      <strong className="block text-[11px] uppercase tracking-wider">Akses Terkunci (Sesi Ditutup)</strong>
                      <p className="text-[10px] leading-relaxed opacity-90">Periode audit ini telah ditutup/dikunci oleh Auditor Utama. Anda tidak diperkenankan mengajukan tanggapan, mengunggah bukti, atau mengganti status.</p>
                    </div>
                  </div>
                )}

                {/* Klarifikasi Resmi */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-extrabold text-slate-400 uppercase tracking-widest text-[9px] flex items-center gap-1">
                    <span>1. Klarifikasi Tanggapan Resmi Instansi (OPD)</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    disabled={isFullyReadOnly}
                    rows={2}
                    value={editingFinding.klarifikasiAuditee || ''}
                    onChange={(e) => setEditingFinding(prev => prev ? ({ ...prev, klarifikasiAuditee: e.target.value }) : null)}
                    placeholder="Contoh: Kami mengonfirmasi adanya port default MySQL yang terbuka secara publik. Setelah evaluasi, kami memutuskan untuk menutup akses eksternal port tersebut dan membatasi koneksi hanya ke localhost..."
                    className={`p-3 border rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500 max-h-24 ${
                      isFullyReadOnly ? 'opacity-65 cursor-not-allowed bg-slate-100 dark:bg-[#0a0f1d]' : ''
                    } ${
                      darkMode ? 'bg-[#0f172a] border-[#334155] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                {/* Deskripsi Tindak Lanjut Teknis */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-extrabold text-slate-400 uppercase tracking-widest text-[9px] flex items-center gap-1">
                    <span>2. Langkah Penanganan & Remediasi Teknis yang Diambil</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    disabled={isFullyReadOnly}
                    rows={2}
                    value={editingFinding.buktiPerbaikan || ''}
                    onChange={(e) => setEditingFinding(prev => prev ? ({ ...prev, buktiPerbaikan: e.target.value }) : null)}
                    placeholder="Contoh: Telah dikonfigurasikan firewall rule (iptables/ufw) untuk menonaktifkan akses port 3306 dari luar daerah. Layanan database sekarang diakses aman menggunakan VPN internal Kemenkominfo..."
                    className={`p-3 border rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500 max-h-24 ${
                      isFullyReadOnly ? 'opacity-65 cursor-not-allowed bg-slate-100 dark:bg-[#0a0f1d]' : ''
                    } ${
                      darkMode ? 'bg-[#0f172a] border-[#334155] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Upload Eviden Simulated Container */}
                  <div className="flex flex-col gap-1.5 focus-within:ring-1 focus-within:ring-indigo-500">
                    <label className="font-extrabold text-slate-400 uppercase tracking-widest text-[9px]">3. Unggah Dokumen / Gambar Eviden</label>
                    <div className={`p-4 rounded-xl border border-dashed flex flex-col items-center justify-center text-center gap-2 ${
                      isFullyReadOnly ? 'opacity-50 cursor-not-allowed' : ''
                    } ${
                      darkMode ? 'bg-[#0f172a]/50 border-slate-700/80' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <UploadCloud className="w-8 h-8 text-indigo-400" />
                      
                      {editingFinding.buktiFile ? (
                        <div className="space-y-1">
                          <p className="text-[10px] text-emerald-400 font-mono font-bold">✓ Terunggah Berhasil</p>
                          <p className="text-[9px] text-[#818cf8] font-mono break-all font-semibold">{editingFinding.buktiFile}</p>
                          {!isFullyReadOnly && (
                            <button
                              type="button"
                              onClick={() => setEditingFinding(prev => prev ? ({ ...prev, buktiFile: '' }) : null)}
                              className="text-[9px] text-rose-500 underline font-black uppercase tracking-wider block mx-auto cursor-pointer"
                            >
                              Hapus File
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            {isFullyReadOnly ? 'Kunci aktif: upload dinonaktifkan.' : 'Simulasi Unggah Berkas Eviden dengan cepat:'}
                          </p>
                          {/* Simulated Template Selection Fast-Track */}
                          {!isFullyReadOnly && (
                            <div className="flex flex-wrap justify-center gap-1.5">
                              {[
                                'sk_bupati_remediasi_spbe.pdf',
                                'remediasi_port_firewall.png',
                                'bukti_ssl_tls_patched.pdf',
                                'mfa_enforcement_log.conf'
                              ].map((presetName) => (
                                <button
                                  key={presetName}
                                  type="button"
                                  onClick={() => {
                                    setEditingFinding(prev => prev ? ({ ...prev, buktiFile: presetName }) : null);
                                  }}
                                  className={`px-2 py-1 rounded text-[8px] font-mono cursor-pointer transition ${
                                    darkMode 
                                      ? 'bg-[#334155] text-slate-350 hover:bg-slate-700 text-slate-100 hover:text-white' 
                                      : 'bg-white shadow border border-slate-150 text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  {presetName}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Tindak Lanjut Selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-extrabold text-slate-400 uppercase tracking-widest text-[9px] flex items-center gap-1">
                      <span>4. Ajukan Status Penanganan Baru</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { label: 'OPEN (Belum Ditindaklanjut)', val: 'Open', color: 'border-red-500 bg-red-500/10 text-red-400' },
                        { label: 'IN PROGRESS (Tahap Penanganan)', val: 'In Progress', color: 'border-amber-500 bg-amber-500/10 text-amber-400' },
                        { label: 'RESOLVED (Tuntas Diatasi)', val: 'Resolved', color: 'border-emerald-500 bg-emerald-500/10 text-emerald-400' }
                      ].map((st) => {
                        const isSel = editingFinding.statusTindakLanjut === st.val;
                        return (
                          <button
                            key={st.val}
                            type="button"
                            disabled={isFullyReadOnly}
                            onClick={() => {
                              setEditingFinding(prev => prev ? ({ ...prev, statusTindakLanjut: st.val as any }) : null);
                            }}
                            className={`p-3.5 rounded-xl border-2 text-left font-bold transition flex items-center justify-between ${
                              isFullyReadOnly ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                            } ${
                              isSel 
                                ? st.color 
                                : darkMode 
                                  ? 'bg-[#0f172a] border-transparent hover:border-slate-700 text-slate-400' 
                                  : 'bg-white border-slate-100 hover:border-slate-250 text-slate-650'
                            }`}
                          >
                            <span>{st.label}</span>
                            {isSel && <span className="w-2.5 h-2.5 bg-current rounded-full" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Actions */}
            <div className={`p-6 border-t flex items-center justify-end gap-3 ${
              darkMode ? 'border-[#334155] bg-[#0f172a]/20' : 'border-slate-100 bg-slate-50/50'
            }`}>
              <button 
                type="button" 
                onClick={() => setEditingFinding(null)}
                className={`px-4 py-2 rounded-xl border font-bold hover:bg-slate-100 dark:hover:bg-slate-850 transition cursor-pointer ${
                  darkMode ? 'border-[#334155] text-slate-400' : 'border-slate-200 text-slate-700'
                }`}
              >
                Batal
              </button>
              {isLockedForAuditee ? (
                <button 
                  type="button"
                  disabled
                  className="px-5 py-2.5 rounded-xl bg-slate-600/30 border border-slate-600/30 text-slate-400 font-bold tracking-wide opacity-50 cursor-not-allowed"
                >
                  Sesi Terkunci
                </button>
              ) : (
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold tracking-wide shadow-lg shadow-indigo-600/10 transition active:scale-95 cursor-pointer"
                >
                  Simpan Respon Tindak Lanjut
                </button>
              )}
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
