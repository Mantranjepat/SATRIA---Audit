import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardTab from './components/DashboardTab';
import IdentityTab from './components/IdentityTab';
import ChecklistTab from './components/ChecklistTab';
import RiskMatrixTab from './components/RiskMatrixTab';
import FindingsTab from './components/FindingsTab';
import SummaryTab from './components/SummaryTab';
import DatabaseTab from './components/DatabaseTab';
import UserManagement from './components/UserManagement';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';

import { useAuth } from './context/AuthContext';
import { useIdleTimeout } from './hooks/useIdleTimeout';
import { AuditIdentity, ChecklistItem, FindingItem } from './types/audit';
import { initialChecklist } from './data/checklistData';
import { initialFindings } from './data/findingsData';
import { RefreshCw, CheckCircle2, ShieldAlert, Lock, Unlock } from 'lucide-react';

export default function App() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Active user session monitoring: autologout after 10m idle
  useIdleTimeout(() => {
    if (user) {
      logout();
      // Safe visual confirmation
      console.log('Session has expired due to 10 minutes of inactivity.');
    }
  }, 600000);

  // Handle successful login redirect according to user role
  const handleLoginSuccess = (role: string) => {
    if (role === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    } else if (role === 'AUDITOR') {
      navigate('/auditor/dashboard', { replace: true });
    } else {
      navigate('/auditee/dashboard', { replace: true });
    }
  };

  return (
    <Routes>
      {/* Login Gate */}
      <Route 
        path="/login" 
        element={
          user ? (
            <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : user.role === 'AUDITOR' ? '/auditor/dashboard' : '/auditee/dashboard'} replace />
          ) : (
            <Login onLoginSuccess={handleLoginSuccess} />
          )
        } 
      />

      {/* Role-Based Active Workspace Routes */}
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Workspace role="ADMIN" />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/admin/database" 
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Workspace role="ADMIN" initialTab="database" />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/auditor/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['AUDITOR']}>
            <Workspace role="AUDITOR" />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/auditee/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['AUDITEE', 'VIEWER']}>
            <Workspace role="AUDITEE" />
          </ProtectedRoute>
        } 
      />

      {/* Wildcard Fallback */}
      <Route 
        path="*" 
        element={
          <Navigate 
            to={
              user 
                ? (user.role === 'ADMIN' ? '/admin/dashboard' : user.role === 'AUDITOR' ? '/auditor/dashboard' : '/auditee/dashboard') 
                : '/login'
            } 
            replace 
          />
        } 
      />
    </Routes>
  );
}

// Unified stateful workspace layout supporting dynamic role injection
function Workspace({ role, initialTab = 'dashboard' }: { role: 'ADMIN' | 'AUDITOR' | 'AUDITEE', initialTab?: string }) {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>(initialTab);
  const [darkMode, setDarkMode] = useState<boolean>(true); // Default to cyberpunk dark look
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // Core Audit State
  const [identity, setIdentity] = useState<AuditIdentity>({
    opd: "Dinas Komunikasi dan Informatika Kabupaten Purbalingga",
    namaAplikasi: "APLIKASI E-KEPEGAWAIAN",
    domainUrl: "https://ekepegawaian.purbalinggakab.go.id",
    ipAddress: "103.111.43.2",
    ketuaTimAuditor: "Anna S.D. Wibowo",
    anggotaAuditor: [
      "Agus Sutriatno",
      "Hanifah Khairunisa"
    ],
    auditee: [
      "Tim SIMPEG BKD",
      "Bidang Infrastruktur"
    ],
    penanggungJawab: "Kepala Bidang Aptika",
    tanggalAudit: "2026-05-29",
    jenisAudit: "WEBSITE",
    catatan: "Sistem aplikasi SIMPEG (Sistem Informasi Manajemen Kepegawaian) merupakan poros utama data aparatur sipil negara di lingkungan Pemerintah Kabupaten Purbalingga, meliputi pelaporan administratif, kepangkatan, dan data kepegawaian internal daerah.",
    kompleksitasObjek: "Sedang",
    kompleksitasTeknologi: "Sedang",
    sebaranLokasi: "Terpusat",
    jumlahHariEstimasi: 6
  });

  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);
  const [findings, setFindings] = useState<FindingItem[]>(initialFindings);
  const [isAuditLocked, setIsAuditLocked] = useState<boolean>(false);

  // Reset tab only if active role is unauthorized for the current tab to prevent hanging states
  useEffect(() => {
    if (role !== 'ADMIN' && (currentTab === 'database' || currentTab === 'users')) {
      setCurrentTab('dashboard');
    }
  }, [role, currentTab]);

  // Handle HTML document body theme class toggling
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Auditor Capability: "Membuat Audit Baru" from scratch
  const handleCreateNewAudit = () => {
    if (window.confirm("Apakah Anda yakin ingin MEMBUAT AUDIT BARU? Semua data pengisian checklist evaluasi, identitas, dan temuan saat ini akan di-reset (kembali kosong).")) {
      setIdentity({
        opd: "Dinas / Badan Baru Pemda Kabupaten Purbalingga",
        namaAplikasi: "SISTEM INFORMASI BARU",
        domainUrl: "https://",
        ipAddress: "0.0.0.0",
        ketuaTimAuditor: user?.name || "Auditor Utama",
        anggotaAuditor: [],
        auditee: [],
        penanggungJawab: "Penanggung Jawab Teknis OPD",
        tanggalAudit: new Date().toISOString().split('T')[0],
        jenisAudit: "WEBSITE",
        catatan: "Catatan ruang lingkup audit objek keamanan SPBE baru daerah.",
        kompleksitasObjek: "Rendah",
        kompleksitasTeknologi: "Rendah",
        sebaranLokasi: "Terpusat",
        jumlahHariEstimasi: 1
      });

      // Reset checklist to pristine default "Belum Evaluasi" configuration
      const blankChecklist = initialChecklist.map(item => ({
        ...item,
        evaluasiDesain: 'Tidak Memadai' as any,
        evaluasiImplementasi: 'Belum Sesuai' as any,
        evaluasiEfektivitas: 'Belum Efektif' as any,
        kesimpulanAudit: 'Tidak Sesuai' as any,
        catatanAuditor: '',
        rekomendasi: '',
        evidenceName: '',
        lastModified: ''
      }));
      setChecklist(blankChecklist);

      // Reset findings to empty
      setFindings([]);
      setIsAuditLocked(false);

      // Trigger user success toast notification
      setShowNotification("Audit Baru Berhasil Dibuat! Silakan isi data identitas.");
      setCurrentTab('identity');
      setTimeout(() => setShowNotification(null), 4000);
    }
  };

  // Convert current state tabs to descriptive breadcrumbs names
  const getTabName = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard Analytics';
      case 'identity': return 'Identitas Objek Audit';
      case 'checklist': return 'Checklist Evaluasi';
      case 'risk': return 'Risk Heatmap 5x5';
      case 'findings': return 'Temuan Audit (CAPA)';
      case 'conclusion': return 'Kesimpulan & Laporan';
      case 'database': return 'Database Center Supabase';
      case 'users': return 'Otorisasi Pengguna (RBAC)';
      default: return 'Monitoring';
    }
  };

  const readOnly = role === 'AUDITEE';

  // Render tab contents based on selected id and roles
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardTab 
            checklist={checklist} 
            findings={findings} 
            darkMode={darkMode} 
            onNavigate={setCurrentTab}
          />
        );
      case 'identity':
        return (
          <IdentityTab 
            identity={identity} 
            setIdentity={setIdentity} 
            darkMode={darkMode}
            readOnly={readOnly}
          />
        );
      case 'checklist':
        return (
          <ChecklistTab 
            checklist={checklist} 
            setChecklist={setChecklist} 
            darkMode={darkMode}
            readOnly={readOnly}
            role={role}
            isAuditLocked={isAuditLocked}
          />
        );
      case 'risk':
        return (
          <RiskMatrixTab 
            findings={findings} 
            darkMode={darkMode}
          />
        );
      case 'findings':
        return (
          <FindingsTab 
            findings={findings} 
            setFindings={setFindings} 
            darkMode={darkMode}
            readOnly={readOnly}
            role={role}
          />
        );
      case 'conclusion':
        return (
          <SummaryTab 
            identity={identity} 
            checklist={checklist} 
            findings={findings} 
            darkMode={darkMode}
          />
        );
      case 'database':
        if (role !== 'ADMIN') {
          return (
            <div className="text-center py-20 px-4">
              <div className="max-w-md mx-auto p-8 rounded-2xl border border-red-500/20 bg-red-500/5 text-center">
                <h3 className="text-lg font-bold text-red-400 mb-2">Akses Ditolak!</h3>
                <p className="text-xs text-slate-400">Anda tidak memiliki hak akses yang memadai untuk instrumen manajemen database Supabase.</p>
              </div>
            </div>
          );
        }
        return (
          <DatabaseTab 
            darkMode={darkMode}
            checklist={checklist}
            findings={findings}
            identity={identity}
          />
        );
      case 'users':
        if (role !== 'ADMIN') {
          return <div className="text-center py-12 font-bold text-red-500">Akses Ditolak!</div>;
        }
        return <UserManagement darkMode={darkMode} />;
      default:
        return <div className="text-center py-12">Tab Belum Diimplementasikan</div>;
    }
  };

  return (
    <div id="workspace-viewport" className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${
      darkMode ? 'dark bg-[#0f172a] text-[#f8fafc]' : 'bg-slate-50/60 text-slate-800'
    }`}>
      
      {/* Dynamic Sidebar Navigation */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode}
      />

      {/* Workspace Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Dynamic header */}
        <Header 
          darkMode={darkMode} 
          activeTabName={`${getTabName(currentTab)} [${role} MODE]`}
          opdName={identity.opd}
          appName={identity.namaAplikasi}
        />

        {/* Global Action Banner for Auditor and Viewer */}
        <div className="px-8 mt-4">
          {/* Success notifications */}
          {showNotification && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="font-bold">{showNotification}</span>
            </div>
          )}

          {/* Conditional Auditor "Create New Audit" & "Lock/Unlock" Quick Bar */}
          {(role === 'AUDITOR' || role === 'ADMIN') && (
            <div className="flex flex-col gap-3">
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                darkMode ? 'bg-indigo-950/20 border-indigo-500/20' : 'bg-indigo-50/60 border-indigo-150 shadow-sm'
              }`}>
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping shrink-0" />
                  <p className="text-xs text-indigo-400 font-semibold leading-relaxed">
                    Gunakan Pintasan Otoritas Auditor untuk mereset dan memprogram <strong>Audit Keamanan SPBE Baru</strong>.
                  </p>
                </div>
                <button
                  onClick={handleCreateNewAudit}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-600/10 transition active:scale-95 cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Buat Program Audit Baru</span>
                </button>
              </div>

              {/* Sesi lock/unlock control section */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                darkMode ? 'bg-slate-900/60 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    isAuditLocked 
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {isAuditLocked ? <Lock className="w-4.5 h-4.5" /> : <Unlock className="w-4.5 h-4.5" />}
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-300 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Status Periode Audit:</span>
                      {isAuditLocked ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500 text-white animate-pulse">SESI DITUTUP (DIKUNCI)</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500 text-white">SESI TERBUKA (OPEN)</span>
                      )}
                    </h5>
                    <p className={`text-[11px] mt-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isAuditLocked 
                        ? 'Auditee (OPD) tidak dapat memodifikasi desain & implementasi kontrol saat ini. Anda dapat mengunci untuk melakukan pelaporan final.' 
                        : 'Auditee (OPD) diberikan akses penuh untuk mengisi secara mandiri / merubah jawaban evaluasi desain & implementasi kontrol.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsAuditLocked(!isAuditLocked);
                    setShowNotification(
                      !isAuditLocked 
                        ? "Sesi Audit berhasil DIKUNCI. Auditee tidak dapat mengubah data checklist." 
                        : "Sesi Audit berhasil DIBUKA kembali. Auditee dapat mengubah data checklist."
                    );
                    setTimeout(() => setShowNotification(null), 4000);
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition active:scale-95 cursor-pointer shrink-0 border ${
                    isAuditLocked 
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/15'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/15'
                  }`}
                >
                  {isAuditLocked ? (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Buka Sesi Audit (Unlock)</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Tutup Sesi Audit (Lock)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Conditional Auditee announcement pill */}
          {role === 'AUDITEE' && (
            <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
              isAuditLocked
                ? 'bg-rose-950/20 border-rose-500/20 text-rose-400'
                : 'bg-emerald-950/10 border-emerald-500/20 text-emerald-400'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isAuditLocked ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
                  {isAuditLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5 animate-pulse" />}
                </div>
                <div>
                  <h5 className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span>Akses Portal Auditee (OPD) Purbalingga</span>
                    {isAuditLocked ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-400 animate-pulse">STATUS: TERKUNCI</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400">STATUS: AKTIF & TERBUKA</span>
                    )}
                  </h5>
                  <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {isAuditLocked
                      ? 'Waktu pengisian audit telah DITUTUP oleh tim Auditor Utama. Penilaian kelayakan desain dan implementas kontrol saat ini terkunci.'
                      : 'Sesi audit sedang TERBUKA. Anda diizinkan mengevaluasi Desain & Implementasi kontrol secara mandiri serta melengkapi dokumen eviden dukung.'}
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded text-[10px] font-black font-mono shrink-0 ${
                isAuditLocked ? 'bg-rose-500/20' : 'bg-emerald-500/20'
              }`}>
                AUDITEE / OPD
              </span>
            </div>
          )}
        </div>

        {/* Content Viewport */}
        <main id="workspace-viewport-scroll" className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {renderTabContent()}
          </div>
        </main>
      </div>

    </div>
  );
}
