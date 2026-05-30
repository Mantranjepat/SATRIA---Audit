import React, { useState } from 'react';
import {
  Building2,
  ChevronDown,
  Info,
  Layers
} from 'lucide-react';

import { AuditIdentity } from '../types/audit';
import { calculateAuditDays } from '../utils/auditCalculator';

interface IdentityTabProps {
  identity: AuditIdentity;
  setIdentity: React.Dispatch<React.SetStateAction<AuditIdentity>>;
  darkMode: boolean;
  readOnly?: boolean;
  role?: string;
}

export default function IdentityTab({
  identity,
  setIdentity,
  darkMode,
  readOnly = false,
  role = 'AUDITEE'
}: IdentityTabProps) {

  const [showHelper, setShowHelper] = useState(false);


  // Handle normal input
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLSelectElement |
      HTMLTextAreaElement
    >
  ) => {

    const { name, value } = e.target;

    setIdentity(prev => {

      const updated = {
        ...prev,
        [name]: value
      };

      // Recalculate estimation days automatically
      if (
        name === 'kompleksitasObjek' ||
        name === 'kompleksitasTeknologi' ||
        name === 'sebaranLokasi'
      ) {

        updated.jumlahHariEstimasi = calculateAuditDays(
          updated.kompleksitasObjek,
          updated.kompleksitasTeknologi,
          updated.sebaranLokasi
        );
      }

      return updated;
    });
  };

  // Handle textarea array
  const handleArrayChange = (
    field: 'anggotaAuditor' | 'auditee',
    value: string
  ) => {

    const lines = value
      .split('\n')
      .map(item => item.trim())
      .filter(item => item !== '');

    setIdentity(prev => ({
      ...prev,
      [field]: lines
    }));
  };

  return (
    <div
      id="identity-tab-root"
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in"
    >

      {/* LEFT SIDE */}
      <div
        className={`lg:col-span-2 p-6 rounded-2xl border ${
          darkMode
            ? 'bg-[#1e293b] border-[#334155]'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6 border-b pb-4 dark:border-[#334155]">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-base">
              Identitas Objek Audit SPBE
            </h3>
          </div>
          {readOnly && (
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-widest animate-pulse">
              READ-ONLY MODE (VIEWER)
            </span>
          )}
        </div>

        {readOnly && (
          <div className="mb-5 bg-amber-500/10 border border-amber-500/25 text-amber-400 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Mode Peninjau Aktif</p>
              <p className="mt-0.5 opacity-80">Anda masuk menggunakan peran <strong>VIEWER</strong>. Semua input identitas serta parameter durasi diakumulasi secara otomatis dan tidak diperkenankan untuk dimodifikasi.</p>
            </div>
          </div>
        )}

        {/* Form Grid */}
        <fieldset disabled={readOnly} className="contents">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* OPD */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Nama Instansi / OPD
            </label>

            <input
              type="text"
              name="opd"
              value={identity.opd}
              onChange={handleInputChange}
              disabled={role === 'AUDITEE' || role === 'VIEWER'}
              placeholder="Contoh: Dinas Kominfo Kabupaten Purbalingga"
              className={`px-4 py-2.5 rounded-xl border text-sm outline-none ${
                darkMode
                  ? 'bg-[#0f172a] border-[#334155] text-white focus:border-cyan-400'
                  : 'bg-slate-50 border-slate-200'
              } disabled:opacity-75 disabled:cursor-not-allowed`}
            />
          </div>

          {/* Nama Aplikasi */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Nama Website / Aplikasi
            </label>

            <input
              type="text"
              name="namaAplikasi"
              value={identity.namaAplikasi}
              onChange={handleInputChange}
              placeholder="Contoh: E-Kepegawaian"
              className={`px-4 py-2.5 rounded-xl border text-sm outline-none ${
                darkMode
                  ? 'bg-[#0f172a] border-[#334155] text-white focus:border-cyan-400'
                  : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>

          {/* URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Domain / URL
            </label>

            <input
              type="text"
              name="domainUrl"
              value={identity.domainUrl}
              onChange={handleInputChange}
              placeholder="https://example.go.id"
              className={`px-4 py-2.5 rounded-xl border text-sm outline-none ${
                darkMode
                  ? 'bg-[#0f172a] border-[#334155] text-white focus:border-cyan-400'
                  : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>

          {/* IP */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
              IP Address
            </label>

            <input
              type="text"
              name="ipAddress"
              value={identity.ipAddress}
              onChange={handleInputChange}
              placeholder="103.xxx.xxx.xxx"
              className={`px-4 py-2.5 rounded-xl border text-sm outline-none ${
                darkMode
                  ? 'bg-[#0f172a] border-[#334155] text-white focus:border-cyan-400'
                  : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>

          {/* Ketua Auditor */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Ketua Tim Auditor
            </label>

            <input
              type="text"
              name="ketuaTimAuditor"
              value={identity.ketuaTimAuditor}
              onChange={handleInputChange}
              placeholder="Nama Ketua Tim"
              className={`px-4 py-2.5 rounded-xl border text-sm outline-none ${
                darkMode
                  ? 'bg-[#0f172a] border-[#334155] text-white focus:border-cyan-400'
                  : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>

          {/* Penanggung Jawab */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Penanggung Jawab
            </label>

            <input
              type="text"
              name="penanggungJawab"
              value={identity.penanggungJawab}
              onChange={handleInputChange}
              placeholder="Kepala Bidang / Kepala OPD"
              className={`px-4 py-2.5 rounded-xl border text-sm outline-none ${
                darkMode
                  ? 'bg-[#0f172a] border-[#334155] text-white focus:border-cyan-400'
                  : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>

          {/* Anggota Auditor */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Anggota Tim Auditor
            </label>

            <textarea
              rows={4}
              value={identity.anggotaAuditor.join('\n')}
              onChange={(e) =>
                handleArrayChange('anggotaAuditor', e.target.value)
              }
              placeholder={`1. Agus Sutriatno\n2. Hanifah Khairunisa`}
              className={`px-4 py-2.5 rounded-xl border text-sm outline-none resize-none ${
                darkMode
                  ? 'bg-[#0f172a] border-[#334155] text-white focus:border-cyan-400'
                  : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>

          {/* Auditee */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Auditee / Unit Kerja
            </label>

            <textarea
              rows={4}
              value={identity.auditee.join('\n')}
              onChange={(e) =>
                handleArrayChange('auditee', e.target.value)
              }
              placeholder={`1. Tim SIMPEG BKD\n2. Bidang Infrastruktur`}
              className={`px-4 py-2.5 rounded-xl border text-sm outline-none resize-none ${
                darkMode
                  ? 'bg-[#0f172a] border-[#334155] text-white focus:border-cyan-400'
                  : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>

          {/* Tanggal Audit */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Tanggal Audit
            </label>

            <input
              type="date"
              name="tanggalAudit"
              value={identity.tanggalAudit}
              onChange={handleInputChange}
              className={`px-4 py-2.5 rounded-xl border text-sm outline-none ${
                darkMode
                  ? 'bg-[#0f172a] border-[#334155] text-white focus:border-cyan-400'
                  : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>

          {/* Jenis Audit */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Jenis Audit
            </label>

            <select
              name="jenisAudit"
              value={identity.jenisAudit}
              onChange={handleInputChange}
              className={`px-4 py-2.5 rounded-xl border text-sm outline-none ${
                darkMode
                  ? 'bg-[#0f172a] border-[#334155] text-white focus:border-cyan-400'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <option value="WEBSITE">Website</option>
              <option value="APLIKASI">Aplikasi</option>
              <option value="INFRASTRUKTUR">Infrastruktur</option>
            </select>
          </div>

          {/* Catatan */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Catatan / Ruang Lingkup
            </label>

            <textarea
              name="catatan"
              rows={5}
              value={identity.catatan}
              onChange={handleInputChange}
              placeholder="Deskripsi singkat ruang lingkup audit..."
              className={`px-4 py-2.5 rounded-xl border text-sm outline-none resize-none ${
                darkMode
                  ? 'bg-[#0f172a] border-[#334155] text-white focus:border-cyan-400'
                  : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>
        </div>
      </fieldset>
    </div>

      {/* RIGHT SIDE */}
      <div className="flex flex-col gap-6">

        {/* Calculator */}
        <div
          className={`p-6 rounded-2xl border ${
            darkMode
              ? 'bg-[#1e293b] border-[#334155]'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >

          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-base">
              Kalkulator Durasi Audit
            </h3>
          </div>

          <fieldset disabled={readOnly} className="space-y-4 block">

            {/* Kompleksitas Objek */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Kompleksitas Objek
              </label>

              <select
                name="kompleksitasObjek"
                value={identity.kompleksitasObjek}
                onChange={handleInputChange}
                className={`px-3 py-2 rounded-xl border text-sm ${
                  darkMode
                    ? 'bg-[#0f172a] border-[#334155] text-white'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <option value="Sederhana">Sederhana</option>
                <option value="Sedang">Sedang</option>
                <option value="Kompleks">Kompleks</option>
              </select>
            </div>

            {/* Kompleksitas Teknologi */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Kompleksitas Teknologi
              </label>

              <select
                name="kompleksitasTeknologi"
                value={identity.kompleksitasTeknologi}
                onChange={handleInputChange}
                className={`px-3 py-2 rounded-xl border text-sm ${
                  darkMode
                    ? 'bg-[#0f172a] border-[#334155] text-white'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <option value="Sederhana">Sederhana</option>
                <option value="Sedang">Sedang</option>
                <option value="Kompleks">Kompleks</option>
              </select>
            </div>

            {/* Sebaran Lokasi */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Sebaran Lokasi
              </label>

              <select
                name="sebaranLokasi"
                value={identity.sebaranLokasi}
                onChange={handleInputChange}
                className={`px-3 py-2 rounded-xl border text-sm ${
                  darkMode
                    ? 'bg-[#0f172a] border-[#334155] text-white'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <option value="Terpusat">Terpusat</option>
                <option value="Tersebar">Tersebar</option>
              </select>
            </div>

            {/* Result */}
            <div
              className={`p-4 rounded-xl border text-center ${
                darkMode
                  ? 'bg-cyan-500/10 border-cyan-500/30'
                  : 'bg-emerald-50 border-emerald-100'
              }`}
            >
              <div className="text-xs uppercase tracking-widest mb-1 opacity-75">
                Estimasi Durasi Audit
              </div>

              <div className="text-4xl font-extrabold">
                {identity.jumlahHariEstimasi}
              </div>

              <div className="text-sm opacity-75">
                Hari Kerja
              </div>
            </div>

          </fieldset>
        </div>

        {/* Helper */}
        <div
          className={`p-5 rounded-2xl border ${
            darkMode
              ? 'bg-[#1e293b] border-[#334155]'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >

          <button
            type="button"
            onClick={() => setShowHelper(!showHelper)}
            className="w-full flex items-center justify-between text-sm font-bold"
          >

            <span className="flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400" />
              Panduan Kompleksitas
            </span>

            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                showHelper ? 'rotate-180' : ''
              }`}
            />

          </button>

          {showHelper && (
            <div className="mt-4 text-xs leading-relaxed text-slate-400 space-y-4">

              <div>
                <p className="font-bold text-emerald-500 mb-1">
                  Kompleksitas Objek
                </p>

                <ul className="list-disc pl-4 space-y-1">
                  <li>Sederhana → aplikasi kecil internal</li>
                  <li>Sedang → aplikasi OPD/Pemda</li>
                  <li>Kompleks → aplikasi nasional / layanan publik besar</li>
                </ul>
              </div>

              <div>
                <p className="font-bold text-emerald-500 mb-1">
                  Kompleksitas Teknologi
                </p>

                <ul className="list-disc pl-4 space-y-1">
                  <li>Sederhana → single server/platform</li>
                  <li>Sedang → multi platform & realtime</li>
                  <li>Kompleks → hybrid/cloud/distributed</li>
                </ul>
              </div>

              <div>
                <p className="font-bold text-emerald-500 mb-1">
                  Sebaran Lokasi
                </p>

                <ul className="list-disc pl-4 space-y-1">
                  <li>Terpusat → satu data center</li>
                  <li>Tersebar → banyak lokasi/WAN</li>
                </ul>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}