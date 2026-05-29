export interface AuditIdentity {
  opd: string;
  namaAplikasi: string;
  domainUrl: string;
  ipAddress: string;
  ketuaTimAuditor: string;
  anggotaAuditor: string[];
  auditee: string[];
  penanggungJawab: string;
  tanggalAudit: string;
  jenisAudit: string;
  catatan: string;
  kompleksitasObjek: 'Sederhana' | 'Sedang' | 'Kompleks';
  kompleksitasTeknologi: 'Sederhana' | 'Sedang' | 'Kompleks';
  sebaranLokasi: 'Terpusat' | 'Tersebar';
  jumlahHariEstimasi: number;
}

export type EvaluasiDesain = 'Memadai' | 'Perlu Peningkatan' | 'Tidak Memadai' | 'Belum Dinilai';
export type EvaluasiImplementasi = 'Sesuai dengan Desain' | 'Tidak Sesuai dengan Desain' | 'Belum Sesuai' | 'Belum Dinilai';
export type EvaluasiEfektivitas = 'Efektif' | 'Perlu Peningkatan' | 'Belum Efektif' | 'Belum Dinilai';
export type KesimpulanAuditType = 'Memadai' | 'Perlu Peningkatan' | 'Tidak Memadai' | 'Belum Dilakukan Evaluasi';

export type ChecklistKategori = 
  | 'Pedoman Manajemen' 
  | 'Standar Teknis SPBE' 
  | 'Autentikasi' 
  | 'Manajemen Sesi' 
  | 'Kontrol Akses' 
  | 'Validasi Input' 
  | 'Kriptografi' 
  | 'Eror dan Pencatatan Log' 
  | 'Proteksi Data' 
  | 'Keamanan Komunikasi' 
  | 'Pengendalian Kode Berbahaya' 
  | 'Logika Bisnis' 
  | 'File' 
  | 'Keamanan API dan Web Service' 
  | 'Keamanan Konfigurasi';

export interface ChecklistItem {
  id: number;
  kriteria: string;
  pasal: string;
  kategori: ChecklistKategori;
  area: 'AREA MANAJEMEN' | 'STANDAR TEKNIS WEBSITE' | 'STANDAR TEKNIS SPBE';
  evaluasiDesain: EvaluasiDesain;
  evaluasiImplementasi: EvaluasiImplementasi;
  evaluasiEfektivitas: EvaluasiEfektivitas;
  kesimpulanAudit: KesimpulanAuditType;
  catatanAuditor: string;
  rekomendasi: string;
  evidenceName?: string;
  evidenceUrl?: string;
}

export interface FindingItem {
  id: string;
  noTemuan: string;
  kategori: string;
  deskripsi: string;
  rekomendasi: string;
  statusTindakLanjut: 'Open' | 'In Progress' | 'Resolved';
  pic: string;
  targetSelesai: string;
  likelihood: number; // 1-5
  impact: number;     // 1-5
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  klarifikasiAuditee?: string; // Klarifikasi dari OPD/Auditee
  buktiPerbaikan?: string;    // Penjelasan langkah perbaikan
  buktiFile?: string;          // Unggahan file URL/nama file bukti perbaikan
}

export type UserRole = 'ADMIN' | 'AUDITOR' | 'AUDITEE' | 'VIEWER';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  email: string;
  opd?: string;
}

