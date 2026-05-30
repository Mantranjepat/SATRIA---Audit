import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, UserRole } from '../types/audit';
import { 
  Users, 
  Trash2, 
  UserPlus, 
  Shield, 
  UserCheck, 
  Mail, 
  Building, 
  X, 
  Check, 
  AlertCircle 
} from 'lucide-react';

interface UserManagementProps {
  darkMode: boolean;
}

export default function UserManagement({ darkMode }: UserManagementProps) {
  const { user: currentUser, usersList, addUser, deleteUser, updateUserRole } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New user values
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('AUDITOR');
  const [opd, setOpd] = useState('');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !fullName.trim() || !email.trim() || !opd.trim()) {
      setError('Seluruh input data pegawai wajib diisi!');
      return;
    }

    // Validate unique username
    const usernameExists = usersList.some(
      u => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (usernameExists) {
      setError(`Username '${username}' sudah diregistrasikan di database SATRIA.`);
      return;
    }

    addUser({
      username: username.trim().toLowerCase(),
      name: fullName.trim(),
      email: email.trim(),
      role: role,
      opd: opd.trim()
    });

    // Reset Form
    setUsername('');
    setFullName('');
    setEmail('');
    setRole('AUDITOR');
    setOpd('');
    setShowAddModal(false);
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-widest">
            <Shield className="w-3 h-3" />
            <span>Administrator</span>
          </span>
        );
      case 'AUDITOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
            <UserCheck className="w-3 h-3" />
            <span>Auditor Utama</span>
          </span>
        );
      case 'AUDITEE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">
            <Building className="w-3 h-3 animate-pulse" />
            <span>Auditee / OPD</span>
          </span>
        );
      case 'VIEWER':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-widest">
            <Users className="w-3 h-3" />
            <span>Viewer / Pimpinan</span>
          </span>
        );
    }
  };

  return (
    <div id="user-management-panel" className="space-y-6 animate-fade-in">
      
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Manajemen Otorisasi Pengguna (RBAC)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Daftarkan pegawai siber daerah, sesuaikan role, dan batasi hak akses audit secara real-time.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4.5 py-2.5 bg-sky-500 hover:bg-sky-400 text-[#0f172a] rounded-xl text-xs font-bold shadow-lg shadow-sky-500/15 transition active:scale-95 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrasi User Baru</span>
        </button>
      </div>

      {/* Directory Grid */}
      <div className={`border rounded-xl overflow-hidden ${
        darkMode ? 'border-[#334155]' : 'border-slate-200 shadow-sm'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-xs font-bold uppercase tracking-wider border-b ${
                darkMode ? 'bg-[#0f172a]/80 border-[#334155] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <th className="py-4 px-6">NAMA PEGAWAI</th>
                <th className="py-4 px-6">USERNAME ID</th>
                <th className="py-4 px-6">INSTANSI/OPD</th>
                <th className="py-4 px-6">HAK AKSES SISTEM</th>
                <th className="py-4 px-6 text-center w-36">UBAH ROLE</th>
                <th className="py-4 px-4 text-center w-20">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {usersList.map((userRow) => {
                const isSelf = currentUser && currentUser.id === userRow.id;
                return (
                  <tr 
                    key={userRow.id}
                    className={`text-xs transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/20 ${
                      darkMode ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    
                    {/* User Profile */}
                    <td className="py-4.5 px-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold flex items-center gap-1.5">
                          {userRow.name} 
                          {isSelf && (
                            <span className="px-1.5 py-0.5 text-[8px] font-black bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded font-mono">
                              ANDA (SELF)
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" />
                          {userRow.email}
                        </span>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="py-4.5 px-6 font-mono text-cyan-400 font-semibold">
                      @{userRow.username}
                    </td>

                    {/* Agency Department */}
                    <td className="py-4.5 px-6 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                        <span className="truncate max-w-xs">{userRow.opd || 'Umum'}</span>
                      </div>
                    </td>

                    {/* Role Display */}
                    <td className="py-4.5 px-6">
                      {getRoleBadge(userRow.role)}
                    </td>

                    {/* Change Role Inline */}
                    <td className="py-4.5 px-6 text-center">
                      <select
                        value={userRow.role}
                        disabled={isSelf}
                        onChange={(e) => updateUserRole(userRow.id, e.target.value as UserRole)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold border outline-none cursor-pointer ${
                          darkMode 
                            ? 'bg-[#0f172a] border-[#334155] text-slate-200' 
                            : 'bg-white border-slate-200 text-slate-705'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="AUDITOR">AUDITOR</option>
                        <option value="AUDITEE">AUDITEE</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    </td>

                    {/* Action Deletion */}
                    <td className="py-4.5 px-4 text-center">
                      <button
                        onClick={() => deleteUser(userRow.id)}
                        disabled={isSelf}
                        className={`p-2 rounded-xl border transition text-rose-500 active:scale-90 ${
                          darkMode 
                            ? 'bg-[#0f172a] border-[#334155] hover:bg-rose-950/20 hover:border-rose-900/30' 
                            : 'bg-slate-50 border-slate-200 hover:bg-rose-50'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                        title={isSelf ? "Tidak dapat menghapus diri sendiri" : "Hapus Pengguna"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Add User Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateUser}
            className={`w-full max-w-xl rounded-2xl border overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-scale-up ${
              darkMode ? 'bg-[#1e293b] border-[#334155] text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            
            {/* Modal Head */}
            <div className={`p-6 border-b flex items-center justify-between ${
              darkMode ? 'border-[#334155]' : 'border-slate-100'
            }`}>
              <span className="font-extrabold text-base text-white dark:text-[#f8fafc] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-sky-400" />
                <span>Registrasi Pegawai Daerah Baru</span>
              </span>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)} 
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Error alerts */}
            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Modal Fields */}
            <div className="p-6 space-y-4 text-xs overflow-y-auto">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username ID */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">Username Akun</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: auditor2"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.trim().toLowerCase())}
                    className={`px-3 py-2 rounded-xl border outline-none ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-sky-400' : 'bg-white border-slate-200 text-slate-900 focus:border-sky-500'
                    }`}
                  />
                  <span className="text-[9px] text-slate-500">Gunakan karakter huruf atau angka saja</span>
                </div>

                {/* Email Address */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">Alamat Email (PNS)</label>
                  <input
                    type="email"
                    required
                    placeholder="Contoh: agus@pemda.go.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`px-3 py-2 rounded-xl border outline-none ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-sky-400' : 'bg-white border-slate-200 text-slate-900 focus:border-sky-500'
                    }`}
                  />
                </div>
              </div>

              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">Nama Lengkap Pegawai & Gelar</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ir. Agus Sutriatno, M.Kom"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`px-3 py-2 rounded-xl border outline-none ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-sky-400' : 'bg-white border-slate-200 text-slate-900 focus:border-sky-500'
                  }`}
                />
              </div>

              {/* OPD / Instansi */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">Dinas / Instansi Daerah (OPD)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dinas Komunikasi dan Informatika Kabupaten Purbalingga"
                  value={opd}
                  onChange={(e) => setOpd(e.target.value)}
                  className={`px-3 py-2 rounded-xl border outline-none ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-sky-400' : 'bg-white border-slate-200 text-slate-900 focus:border-sky-500'
                  }`}
                />
              </div>

              {/* Role Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">Hak Akses & Otoritas Peran</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className={`px-3 py-2 rounded-xl border outline-none font-semibold ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-905'
                  }`}
                >
                  <option value="ADMIN">ADMINISTRATOR (Akses penuh termasuk RBAC & rekayasa pengguna)</option>
                  <option value="AUDITOR">AUDITOR (Dapat mengisi evaluasi siber & membuat program audit)</option>
                  <option value="AUDITEE">AUDITEE (Melakukan evaluasi mandiri & menyertakan dokumen bukti)</option>
                  <option value="VIEWER">VIEWER (Hanya pratinjau statistik & compliance score secara pasif)</option>
                </select>
                <div className="mt-1 bg-sky-500/10 p-2 text-sky-400 rounded-lg text-[10px] leading-relaxed">
                  <strong>Pemberitahuan Kredensial Pengujian:</strong> Setelah registrasi, sistem siber daerah akan memicu password penilai standar: <code>audit123</code> untuk login simulasi audit.
                </div>
              </div>

            </div>

            {/* Modal Foot */}
            <div className={`p-6 border-t flex items-center justify-end gap-3 ${
              darkMode ? 'border-slate-850 bg-slate-950/30' : 'border-slate-100 bg-slate-50/50'
            }`}>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className={`px-4 py-2 rounded-xl border font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                  darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-750'
                }`}
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 transition font-bold text-[#0f172a] shadow-lg shadow-sky-500/10"
              >
                Registrasikan Pegawai
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
