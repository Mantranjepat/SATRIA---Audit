import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, Lock, AlertCircle, Cpu, Eye, EyeOff, KeyRound } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (role: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const { login, failedLoginCount, lockUntilTimestamp, resetAttempts } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live countdown state in seconds
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  useEffect(() => {
    if (!lockUntilTimestamp) {
      setSecondsRemaining(0);
      return;
    }

    const calcSeconds = () => {
      const diff = lockUntilTimestamp - Date.now();
      if (diff <= 0) {
        setSecondsRemaining(0);
      } else {
        setSecondsRemaining(Math.ceil(diff / 1000));
      }
    };

    calcSeconds();
    const interval = setInterval(calcSeconds, 1000);
    return () => clearInterval(interval);
  }, [lockUntilTimestamp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (secondsRemaining > 0) {
      setError(`Login diblokir. Harap tunggu hingga waktu penangguhan selesai (${secondsRemaining} detik lagi).`);
      return;
    }

    if (!username.trim() || !password.trim()) {
      setError('Username dan Password wajib diisi!');
      return;
    }

    setLoading(true);
    setError(null);

    // Minor loading latency to simulate security handshakes
    setTimeout(async () => {
      try {
        const result = await login(username, password);
        if (result.success) {
          // Trigger success redirect logic
          const userSession = JSON.parse(localStorage.getItem('satria_auth_user') || '{}');
          onLoginSuccess(userSession.role || 'AUDITEE');
        } else {
          setError(result.error || 'Autentikasi gagal. Gagal memvalidasi kredensial.');
        }
      } catch (err) {
        setError('Terjadi kendala sistem keamanan saat memproses login.');
      } finally {
        setLoading(false);
      }
    }, 850);
  };

  // Helper shortcuts for examiners to ease testing
  const handleShortcutLogin = (user: string, pass: string) => {
    if (secondsRemaining > 0) {
      setError('Maaf, bypass shortcut dinonaktifkan sementara karena akun terkunci / berada pada progressive delay. Harap gunakan tombol "RESET BRUTE-FORCE COUNTER" di bawah.');
      return;
    }
    setUsername(user);
    setPassword(pass);
    setError(null);
  };

  const isButtonDisabled = loading || secondsRemaining > 0;

  return (
    <div id="login-container" className="min-h-screen w-full bg-[#0b0f19] text-[#f1f5f9] flex items-center justify-center relative overflow-hidden font-sans">
      
      {/* Background aesthetic decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#38bdf8]/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* Cybersecurity matrix overlay grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.4)_1px,transparent_1px)] bg-[size:30px_30px] opacity-25 pointer-events-none"></div>

      <div id="login-card-frame" className="w-full max-w-lg p-1 mx-4 relative">
        {/* Animated glow borders */}
        <div className={`absolute inset-0 bg-gradient-to-r ${secondsRemaining > 0 ? 'from-red-600 via-orange-600 to-rose-600' : 'from-[#38bdf8] via-[#0ea5e9] to-[#059669]'} rounded-2xl blur-lg opacity-40 animate-pulse`}></div>
        
        {/* Actual Form Container */}
        <div className="relative bg-[#111827]/95 border border-[#334155]/60 rounded-2xl p-8 backdrop-blur-md">
          
          {/* Top Security Crest */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className={`w-16 h-16 ${secondsRemaining > 0 ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-38bdf8]/10 border-[#38bdf8]/30 text-[#38bdf8]'} rounded-2xl border flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(56,189,248,0.15)] animate-bounce-slow`}>
              <ShieldCheck className="w-9 h-9" />
            </div>
            <h1 className="text-2xl font-black tracking-wide bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
              SATRIA - SECURITY GATE
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 uppercase tracking-widest font-semibold">
              Sistem Audit Tata Kelola Risiko & Informasi
            </p>
          </div>

          {/* Locked status banner */}
          {secondsRemaining > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 shrink-0 text-xs">
              <div className="flex items-center gap-2 text-red-400 font-extrabold mb-1 uppercase tracking-wider">
                <Lock className="w-4 h-4 shrink-0 text-red-500 animate-pulse" />
                <span>
                  {failedLoginCount >= 5 
                    ? `AKUN TERKUNCI (${2 * (failedLoginCount - 4)} MENIT BLOKIR)` 
                    : "AKUN / SISTEM DITANGGUHKAN"}
                </span>
                <span className="ml-auto font-mono text-red-400 px-1.5 py-0.5 bg-red-500/20 rounded animate-pulse">
                  {secondsRemaining}s
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px] mt-1">
                {failedLoginCount >= 5 
                  ? `Sistem memblokir sementara semua percobaan masuk karena salah password sebanyak ${failedLoginCount} kali. Durasi penalty diblokir selama ${2 * (failedLoginCount - 4)} menit (penambahan kelipatan 2 menit setiap kesalahan berikutnya).`
                  : `Aktivitas tidak sah terdeteksi. Sistem menahan akses masuk selama ${secondsRemaining} detik.`}
              </p>
            </div>
          )}

          {/* Standard dynamic error message */}
          {error && !secondsRemaining && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-6 shrink-0 flex items-start gap-2.5 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Attempt Counter Indicator when failures exist but system is not fully locked */}
          {failedLoginCount > 0 && secondsRemaining === 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 mb-6 flex items-center justify-between text-xs text-amber-400">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>Batas Kegagalan Masuk SPBE</span>
              </div>
              <span className="font-extrabold px-2.5 py-0.5 bg-amber-500/20 rounded-md">
                {failedLoginCount}/5 Attempt
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username block */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#94a3b8] block">ID Akun PNS / Auditor</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isButtonDisabled}
                  placeholder="Masukkan username ID..."
                  className="w-full pl-10 pr-4 py-3 bg-[#0f172a]/95 border border-[#334155] rounded-xl text-sm text-[#f1f5f9] placeholder:text-slate-600 focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password Block */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#94a3b8] block">Kunci Akses Kriptografis</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isButtonDisabled}
                  placeholder="Masukkan password rahasia..."
                  className="w-full pl-10 pr-10 py-3 bg-[#0f172a]/95 border border-[#334155] rounded-xl text-sm text-[#f1f5f9] placeholder:text-slate-600 focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isButtonDisabled}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-[#38bdf8] transition-colors disabled:opacity-40"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isButtonDisabled}
              className={`w-full py-3 ${secondsRemaining > 0 ? 'bg-gradient-to-r from-red-600 to-rose-600 opacity-60 cursor-not-allowed' : 'bg-gradient-to-r from-sky-500 to-emerald-500'} text-white rounded-xl text-sm font-bold tracking-wider uppercase hover:opacity-90 active:scale-[0.98] transition-all duration-150 shadow-[0_0_30px_rgba(56,189,248,0.2)] disabled:pointer-events-none flex items-center justify-center gap-2 mt-4`}
            >
              {loading ? (
                <>
                  <Cpu className="w-4 h-4 animate-spin" />
                  <span>MENGONTROL PROTOKOL AKSES...</span>
                </>
              ) : secondsRemaining > 0 ? (
                <>
                  <Lock className="w-4 h-4 animate-pulse" />
                  <span>SISTEM TERLOCK ({secondsRemaining}s)</span>
                </>
              ) : (
                <span>MASUK KE SISTEM UTAMA</span>
              )}
            </button>
          </form>

          {/* Quick-Testing Helper Section */}
          <div className="mt-8 pt-6 border-t border-[#334155]/60">
            <p className="text-[10px] font-bold text-center uppercase tracking-widest text-[#94a3b8] mb-3.5">
              PINTAS DEVIASI KHUSUS (AKSES PENGUJI)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleShortcutLogin('admin', 'admin123')}
                className="py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-lg text-[10px] font-extrabold text-sky-400 uppercase tracking-wider transition-all duration-200"
              >
                PILIH ADMIN
              </button>
              <button
                type="button"
                onClick={() => handleShortcutLogin('auditor1', 'audit123')}
                className="py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider transition-all duration-200"
              >
                PILIH AUDITOR
              </button>
              <button
                type="button"
                onClick={() => handleShortcutLogin('opd1', 'opd123')}
                className="py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg text-[10px] font-extrabold text-purple-400 uppercase tracking-wider transition-all duration-200"
              >
                PILIH AUDITEE
              </button>
            </div>
            
            {/* Tester Reset Capability Button */}
            <button
              type="button"
              onClick={() => {
                resetAttempts();
                setError(null);
              }}
              className="mt-3.5 w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl text-[10px] font-extrabold text-rose-450 uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Reset Brute-force Counter (Bypass Pengujian)</span>
            </button>
          </div>

          {/* Government Warning Footer */}
          <div className="text-center mt-6 text-[9px] text-[#64748b] leading-relaxed">
            Sistem ini dilindungi oleh Protokol BSSN & Satuan Siber Daerah. Segala akses transaksi dicatat pada audit log kompilasi. Dilarang masuk tanpa izin tertulis yang sah!
          </div>

        </div>
      </div>
    </div>
  );
}
