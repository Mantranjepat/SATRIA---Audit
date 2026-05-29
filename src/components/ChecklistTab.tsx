import React, { useState } from 'react';
import { 
  CheckSquare, 
  Search, 
  Filter, 
  ChevronRight, 
  HelpCircle, 
  Info,
  Sliders,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Play,
  Upload,
  ExternalLink,
  Edit2,
  X,
  FileText
} from 'lucide-react';
import { ChecklistItem, ChecklistKategori, EvaluasiDesain, EvaluasiImplementasi, EvaluasiEfektivitas, KesimpulanAuditType } from '../types/audit';
import { getKesimpulanDetail } from '../utils/auditCalculator';

interface ChecklistTabProps {
  checklist: ChecklistItem[];
  setChecklist: React.Dispatch<React.SetStateAction<ChecklistItem[]>>;
  darkMode: boolean;
  readOnly?: boolean;
  role?: 'ADMIN' | 'AUDITOR' | 'AUDITEE';
  isAuditLocked?: boolean;
}

export default function ChecklistTab({ 
  checklist, 
  setChecklist, 
  darkMode, 
  readOnly = false,
  role = 'AUDITOR',
  isAuditLocked = false
}: ChecklistTabProps) {
  const [search, setSearch] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);

  // File Upload states for Modal simulation
  const [evidenceName, setEvidenceName] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Success Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Distinct Categories list
  const categories: string[] = [
    'All',
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
    'Pengendalian Kode Berbahaya',
    'Logika Bisnis',
    'File',
    'Keamanan API dan Web Service',
    'Keamanan Konfigurasi'
  ];

  const statusValues = ['All', 'Memadai', 'Perlu Peningkatan', 'Tidak Memadai', 'Belum Dilakukan Evaluasi'];

  const isAuditee = role === 'AUDITEE';
  const isLockedForAuditee = isAuditee && isAuditLocked;
  const isFullyReadOnly = (readOnly && !isAuditee) || isLockedForAuditee;

  // Filter items
  const filteredChecklist = checklist.filter(item => {
    const matchesSearch = item.kriteria.toLowerCase().includes(search.toLowerCase()) || 
                          item.catatanAuditor.toLowerCase().includes(search.toLowerCase()) ||
                          item.pasal.toLowerCase().includes(search.toLowerCase());
    const matchesKategori = selectedKategori === 'All' || item.kategori === selectedKategori;
    const matchesStatus = selectedStatus === 'All' || item.kesimpulanAudit === selectedStatus;
    return matchesSearch && matchesKategori && matchesStatus;
  });

  // Handle individual modal edit trigger
  const startEditing = (item: ChecklistItem) => {
    setEditingItem({ ...item });
    setEvidenceName(item.evidenceName || '');
  };

  // Helper trigger for custom toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Drag and drop logic for evidence simulation
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFullyReadOnly) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFullyReadOnly) return;
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setEvidenceName(file.name);
      triggerToast(`File "${file.name}" berhasil ditarik.`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFullyReadOnly) return;
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEvidenceName(file.name);
      triggerToast(`File "${file.name}" berhasil diunggah.`);
    }
  };

  // Save the modified item & compute automatic Kesimpulan Audit via matrix
  const handleSaveItem = () => {
    if (!editingItem) return;

    // Auto-calculate Conclusion using the evaluation matrix
    const computedConclusion = getKesimpulanDetail(
      editingItem.evaluasiDesain,
      editingItem.evaluasiImplementasi,
      editingItem.evaluasiEfektivitas
    );

    const updatedItem = {
      ...editingItem,
      kesimpulanAudit: computedConclusion,
      evidenceName: evidenceName || undefined,
      evidenceUrl: evidenceName ? "#" : undefined
    };

    setChecklist(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    setEditingItem(null);
    setEvidenceName('');
    triggerToast(`Kontrol No ${updatedItem.id} berhasil diperbarui (Status: ${computedConclusion}).`);
  };

  // Render Status Badges
  const getConclusionBadge = (status: KesimpulanAuditType) => {
    switch (status) {
      case 'Memadai':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Memadai</span>
          </span>
        );
      case 'Perlu Peningkatan':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Perlu Peningkatan</span>
          </span>
        );
      case 'Tidak Memadai':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            <span>Tidak Memadai</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/25">
            <Clock className="w-3.5 h-3.5" />
            <span>Belum Dievaluasi</span>
          </span>
        );
    }
  };

  return (
    <div id="checklist-tab-root" className="space-y-6 animate-fade-in relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div id="checklist-toast" className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-slate-900 border border-emerald-500 text-slate-100 px-5 py-3 rounded-2xl shadow-2xl animate-fade-in-up">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Control Search & Filtering Toolbar */}
      <div id="filter-toolbar" className={`p-5 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
        darkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Search Input */}
        <div id="search-container" className="w-full md:w-80 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari kriteria, pasal, kata kunci..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none text-xs transition ${
              darkMode 
                ? 'bg-[#0f172a]/60 border-[#334155] text-white focus:border-[#38bdf8]' 
                : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
            }`}
          />
        </div>

        {/* Filters Select boxes */}
        <div id="filter-selectors" className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Sliders className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
              className={`w-full sm:w-48 px-3 py-2 rounded-xl text-xs outline-none border ${
                darkMode ? 'bg-[#0f172a]/60 border-[#334155] text-white focus:border-[#38bdf8]' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat === 'All' ? 'Semua Kategori (15 Kategori)' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`w-full sm:w-44 px-3 py-2 rounded-xl text-xs outline-none border ${
                darkMode ? 'bg-[#0f172a]/60 border-[#334155] text-white focus:border-[#38bdf8]' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              {statusValues.map((stat, idx) => (
                <option key={idx} value={stat}>
                  {stat === 'All' ? 'Semua Status' : stat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Checklist Grid */}
      <div id="checklist-table-wrapper" className={`border rounded-xl overflow-hidden ${
        darkMode ? 'border-[#334155]' : 'border-slate-200 shadow-sm'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-xs font-bold uppercase tracking-wider border-b ${
                darkMode ? 'bg-[#0f172a]/80 border-[#334155] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <th className="py-4.5 px-6 w-14">NO</th>
                <th className="py-4.5 px-6">KRITERIA KEAMANAN SPBE (BSSN-4/2021)</th>
                <th className="py-4.5 px-6 w-40">PASAL</th>
                <th className="py-4.5 px-6 w-56">KESIMPULAN AUDIT</th>
                <th className="py-4.5 px-6 w-24 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
              {filteredChecklist.length > 0 ? (
                filteredChecklist.map((item) => (
                  <tr 
                    key={item.id} 
                    id={`row-${item.id}`}
                    className={`text-xs transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30 ${
                      darkMode ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    {/* Unique Identifier */}
                    <td className="py-4 px-6 font-mono font-bold text-slate-400 text-center">
                      {item.id}
                    </td>

                    {/* Criteria Details */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold leading-relaxed">{item.kriteria}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                            item.area === 'AREA MANAJEMEN' 
                              ? 'bg-blue-500/10 text-blue-400' 
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {item.area === 'AREA MANAJEMEN' ? 'MANAJEMEN' : 'TEKNIS WEBSITE'}
                          </span>
                          <span className="text-[10px] text-slate-400">• Kategori: {item.kategori}</span>
                          {item.evidenceName && (
                            <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-semibold">
                              <FileText className="w-3 h-3" />
                              <span>Eviden Terlampir</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Source Clause Reference */}
                    <td className="py-4 px-6 text-slate-400 font-medium">
                      {item.pasal}
                    </td>

                    {/* Dynamic Conclusion Badge */}
                    <td className="py-4 px-6">
                      {getConclusionBadge(item.kesimpulanAudit)}
                    </td>

                    {/* Interactive Edit / Inspection Action */}
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => startEditing(item)}
                        className={`p-2 rounded-xl border transition active:scale-90 cursor-pointer ${
                          darkMode 
                            ? 'bg-[#0f172a] border-[#334155] text-[#38bdf8] hover:bg-[#334155]' 
                            : 'bg-slate-50 border-slate-200 text-emerald-600 hover:bg-slate-100'
                        }`}
                        title={
                          isFullyReadOnly 
                            ? "Lihat Detail Penilaian (Sesi Terkunci)" 
                            : isAuditee 
                              ? "Ubah Desain & Implementasi" 
                              : "Evaluasi Kontrol Lengkap"
                        }
                      >
                        {isFullyReadOnly ? (
                          <Search className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <Edit2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Info className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs">Tidak ada kriteria evaluasi yang cocok dengan filter Anda.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editing Modal details panel */}
      {editingItem && (
        <div id="evaluasi-modal-overlay" className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            id="evaluasi-modal-card" 
            className={`w-full max-w-3xl rounded-2xl border overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-scale-up ${
              darkMode ? 'bg-[#1e293b] border-[#334155] text-[#f8fafc]' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            {/* Modal Header */}
            <div className={`p-6 border-b flex items-start justify-between ${
              darkMode ? 'border-[#334155]' : 'border-slate-100'
            }`}>
              <div className="flex gap-3">
                <div id="modal-logo" className="p-2.5 bg-[#38bdf8]/15 text-[#38bdf8] rounded-xl max-h-min self-center">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#38bdf8] uppercase tracking-wider">{editingItem.kategori} (Kontrol No {editingItem.id})</span>
                  <h4 className="font-bold text-base leading-tight mt-1">Penilaian Kontrol Keamanan SPBE</h4>
                </div>
              </div>
              <button 
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 transition"
              >
                <X className="w-5 h-5 text-slate-400 cursor-pointer" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              
              {/* Lock/Read-Only warning specifically for Auditee */}
              {isAuditee && (
                <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 font-sans ${
                  isAuditLocked 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}>
                  {isAuditLocked ? (
                    <>
                      <XCircle className="w-4 h-4 shrink-0 text-rose-500 animate-pulse" />
                      <div>
                        <strong className="block text-[11px] uppercase tracking-wider text-rose-400">Akses Ditutup (Read-Only)</strong>
                        <p className="text-[10px] opacity-90 leading-relaxed text-rose-300">Sesi audit ini telah dikunci oleh Auditor Utama. Anda tidak diizinkan mengubah jawaban atau mengunggah bukti.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <strong className="block text-[11px] uppercase tracking-wider text-emerald-400 font-bold">Akses Interaktif Terbuka (Mandiri)</strong>
                        <p className="text-[10px] opacity-90 leading-relaxed text-emerald-300">Sebagai Auditee OPD, anda berhak menilai dan mengoreksi kriteria evaluasi <strong>Desain Kontrol</strong> & <strong>Implementasi Kontrol</strong> serta mengunggah file bukti pendukung.</p>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              {/* Question Statement card */}
              <div className={`p-4 rounded-xl border ${
                darkMode ? 'bg-[#0f172a]/60 border-[#334155]' : 'bg-slate-50 border-slate-150'
              }`}>
                <p className="font-semibold leading-relaxed text-sm">{editingItem.kriteria}</p>
                <p className="text-slate-400 mt-2 font-medium">Berdasarkan Regulasi: <strong>{editingItem.pasal} BSSN No 4/2021</strong></p>
              </div>

              {/* Three Way Matrix Evaluation Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Desain */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-400 uppercase tracking-widest text-[9px] flex items-center gap-1">
                    <span>1. Evaluasi Desain Kontrol</span>
                    {!isFullyReadOnly && <span className="text-emerald-500 font-black">•</span>}
                  </label>
                  <select
                    disabled={isFullyReadOnly}
                    value={editingItem.evaluasiDesain}
                    onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, evaluasiDesain: e.target.value as EvaluasiDesain }) : null)}
                    className={`px-3 py-2.5 rounded-xl outline-none text-xs border ${
                      isFullyReadOnly ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''
                    } ${
                      darkMode ? 'bg-[#0f172a]/60 border-[#334155] text-white focus:border-[#38bdf8]' : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                    }`}
                  >
                    <option value="Memadai">Memadai</option>
                    <option value="Perlu Peningkatan">Perlu Peningkatan</option>
                    <option value="Tidak Memadai">Tidak Memadai</option>
                  </select>
                </div>

                {/* 2. Implementasi */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-400 uppercase tracking-widest text-[9px] flex items-center gap-1">
                    <span>2. Evaluasi Implementasi Kontrol</span>
                    {!isFullyReadOnly && <span className="text-emerald-500 font-black">•</span>}
                  </label>
                  <select
                    disabled={isFullyReadOnly}
                    value={editingItem.evaluasiImplementasi}
                    onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, evaluasiImplementasi: e.target.value as EvaluasiImplementasi }) : null)}
                    className={`px-3 py-2.5 rounded-xl outline-none text-xs border ${
                      isFullyReadOnly ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''
                    } ${
                      darkMode ? 'bg-[#0f172a]/60 border-[#334155] text-white focus:border-[#38bdf8]' : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                    }`}
                  >
                    <option value="Sesuai dengan Desain">Sesuai dengan Desain</option>
                    <option value="Tidak Sesuai dengan Desain">Tidak Sesuai (Penyimpangan)</option>
                    <option value="Belum Sesuai">Belum Sesuai / Belum Ada</option>
                  </select>
                </div>

                {/* 3. Efektivitas */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-400 uppercase tracking-widest text-[9px] flex items-center gap-1">
                    <span>3. Evaluasi Efektivitas Kontrol</span>
                    {isAuditee && <span className="text-amber-500 font-bold font-mono text-[8px] uppercase font-sans">[Auditor Only]</span>}
                  </label>
                  <select
                    disabled={isFullyReadOnly || isAuditee}
                    value={editingItem.evaluasiEfektivitas}
                    onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, evaluasiEfektivitas: e.target.value as EvaluasiEfektivitas }) : null)}
                    className={`px-3 py-2.5 rounded-xl outline-none text-xs border ${
                      (isFullyReadOnly || isAuditee) ? 'opacity-65 cursor-not-allowed bg-slate-100 dark:bg-[#0a0f1d]' : ''
                    } ${
                      darkMode ? 'bg-[#0f172a]/60 border-[#334155] text-white focus:border-[#38bdf8]' : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                    }`}
                  >
                    <option value="Efektif">Efektif</option>
                    <option value="Perlu Peningkatan">Perlu Peningkatan</option>
                    <option value="Belum Efektif">Belum Efektif</option>
                  </select>
                </div>

              </div>

              {/* LIVE Matrix Lookup Preview Indicator */}
              <div id="live-conclusion-preview" className={`p-4 rounded-xl text-center border flex items-center justify-between gap-4 ${
                darkMode ? 'bg-[#0f172a]/60 border-[#334155]' : 'bg-slate-50 border-slate-100'
              }`}>
                <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">Kesimpulan Otomatis (Matriks Laporan):</span>
                {getConclusionBadge(
                  getKesimpulanDetail(
                    editingItem.evaluasiDesain,
                    editingItem.evaluasiImplementasi,
                    editingItem.evaluasiEfektivitas
                  )
                )}
              </div>

              {/* Auditor notes and recommendation textareas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#94a3b8] uppercase tracking-wider text-[10px] flex items-center justify-between">
                    <span>Catatan Temuan Auditor</span>
                    {isAuditee && <span className="text-amber-500 font-bold font-mono text-[8px] uppercase">[Auditor Only]</span>}
                  </label>
                  <textarea
                    disabled={isFullyReadOnly || isAuditee}
                    rows={3}
                    placeholder="Masukkan uraian penemuan yang mendalam..."
                    value={editingItem.catatanAuditor}
                    onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, catatanAuditor: e.target.value }) : null)}
                    className={`px-3 py-2 rounded-xl outline-none border resize-none ${
                      (isFullyReadOnly || isAuditee) ? 'opacity-65 cursor-not-allowed bg-slate-100 dark:bg-[#0a0f1d]' : ''
                    } ${
                      darkMode 
                        ? 'bg-[#0f172a]/60 border-[#334155] text-white focus:border-[#38bdf8]' 
                        : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#94a3b8] uppercase tracking-wider text-[10px] flex items-center justify-between">
                    <span>Rekomendasi Perbaikan</span>
                    {isAuditee && <span className="text-amber-500 font-bold font-mono text-[8px] uppercase">[Auditor Only]</span>}
                  </label>
                  <textarea
                    disabled={isFullyReadOnly || isAuditee}
                    rows={3}
                    placeholder="Masukkan arahan/langkah-langkah mitigasi celah keamanan..."
                    value={editingItem.rekomendasi}
                    onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, rekomendasi: e.target.value }) : null)}
                    className={`px-3 py-2 rounded-xl outline-none border resize-none ${
                      (isFullyReadOnly || isAuditee) ? 'opacity-65 cursor-not-allowed bg-slate-100 dark:bg-[#0a0f1d]' : ''
                    } ${
                      darkMode 
                        ? 'bg-[#0f172a]/60 border-[#334155] text-white focus:border-[#38bdf8]' 
                        : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                    }`}
                  />
                </div>

              </div>

              {/* Simulated Evidence Upload panel */}
              <div className="flex flex-col gap-2">
                <label className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Upload Eviden / Bukti Dukung (Screenshot, PDF, Naskah Dokumen)</label>
                <div 
                  id="drag-upload-container"
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition cursor-pointer ${
                    dragActive
                      ? 'border-emerald-500 bg-emerald-500/5'
                      : darkMode
                        ? 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                        : 'border-slate-250 bg-slate-50 hover:border-slate-350'
                  }`}
                >
                  <input 
                    type="file" 
                    id="evidence-file-input" 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                  <label htmlFor="evidence-file-input" className="cursor-pointer flex flex-col items-center justify-center gap-1.5">
                    <Upload className="w-7 h-7 text-slate-400" />
                    <span>
                      <strong className="text-emerald-500 decoration-none hover:underline">Tarik file di sini</strong> atau klik untuk memilih file
                    </span>
                    <span className="text-[10px] text-slate-500">Mendukung Gambar Screenshot, PDF, & Dokumen Kerja</span>
                  </label>
                </div>

                {evidenceName && (
                  <div className={`px-4 py-2 rounded-xl border flex items-center justify-between ${
                    darkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-150'
                  }`}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-medium font-mono truncate max-w-md">{evidenceName}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setEvidenceName('')}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                      title="Hapus file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className={`p-6 border-t flex items-center justify-end gap-3 ${
              darkMode ? 'border-slate-800 bg-slate-950/30' : 'border-slate-100 bg-slate-50/50'
            }`}>
              {isFullyReadOnly ? (
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-6 py-2 rounded-xl bg-[#38bdf8] text-[#0f172a] font-bold shadow-lg transition active:scale-95"
                >
                  Selesai Meninjau
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className={`px-4 py-2 rounded-xl border font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 ${
                      darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveItem}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-600/10 transition active:scale-95"
                  >
                    Simpan & Update
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
