import { FindingItem } from '../types/audit';

export const initialFindings: FindingItem[] = [
  {
    id: "F-01",
    noTemuan: "A.3.1-01",
    kategori: "Kredensial & Autentikasi",
    deskripsi: "Kebijakan kompleksitas kata sandi aplikasi SIMPEG sangat longgar (6 karakter tanpa syarat huruf besar/simbol) dan tidak memberlakukan kedaluwarsa password berskala.",
    rekomendasi: "Ubah konfigurasi backend auth: minimal 8 karakter, wajib kombinasi huruf kapital, angka, simbol spesifik, dan masa aktif maksimal 90 hari.",
    statusTindakLanjut: "Open",
    pic: "Eko Setiawan - Tim BKD",
    targetSelesai: "2026-06-30",
    likelihood: 4,
    impact: 4,
    severity: "High"
  },
  {
    id: "F-02",
    noTemuan: "A.3.1-02",
    kategori: "Bypass Mekanisme Akun Lockout",
    deskripsi: "Situs SIMPEG tidak memberlakukan pembatasan percobaan login (maximum login attempts) sehingga rentan terhadap brute force attack secara agresif.",
    rekomendasi: "Tambahkan middleware express-rate-limit atau sejenis pada API login dan terapkan lockout akun sementara (30 menit) setelah 5 kali gagal berturut-turut.",
    statusTindakLanjut: "In Progress",
    pic: "Ahmad Dani - Aptika Diskominfo",
    targetSelesai: "2026-06-20",
    likelihood: 5,
    impact: 4,
    severity: "High"
  },
  {
    id: "F-03",
    noTemuan: "A.3.6-01",
    kategori: "Kebocoran Data Sensitif (Information Leakage)",
    deskripsi: "Tumpukan log kesalahan database (stack trace) terekspos mentah-mentah ke penjelajah web saat terjadi gangguan interkoneksi database server.",
    rekomendasi: "Nonaktifkan display error detail di production web server. Tampilkan pesan kesalahan generik nan ramah sedangkan record aslinya ditampung di file secure log.",
    statusTindakLanjut: "Resolved",
    pic: "Andri - Dev Team",
    targetSelesai: "2026-06-10",
    likelihood: 2,
    impact: 3,
    severity: "Medium"
  },
  {
    id: "F-04",
    noTemuan: "A.3.7-01",
    kategori: "Eksploitasi Unduhan File (Insecure Direct Object Reference)",
    deskripsi: "Unggahan dokumen SK Kepegawaian (PDF) tersimpan di direktori web publik /uploads/ tanpa proteksi autentikasi sesi, sehingga dapat diunduh bebas oleh non-pegawai.",
    rekomendasi: "Pindahkan direktori penyimpanan dokumen SK ke luar public_html dan buat controller download ber-autentikasi yang memeriksa hak kepemilikan dokumen sebelum menyajikan file stream.",
    statusTindakLanjut: "Open",
    pic: "Hendra Wijaya - Infokom",
    targetSelesai: "2026-07-15",
    likelihood: 3,
    impact: 5,
    severity: "High"
  },
  {
    id: "F-05",
    noTemuan: "A.3.12-01",
    kategori: "Kerentanan Otorisasi Endpoint API",
    deskripsi: "Endpoint API penting `/api/v1/profile` untuk mengambil data NIP dan rincian identitas PNS dapat diakses eksternal tanpa token Bearer.",
    rekomendasi: "Terapkan perlindungan authorization header token JWT verification valid pada rute API profil tersebut guna memverifikasi token sesi pemilih data.",
    statusTindakLanjut: "Open",
    pic: "Dev Team SIMPEG",
    targetSelesai: "2026-06-25",
    likelihood: 4,
    impact: 5,
    severity: "Critical"
  }
];
