import React from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Award, 
  FileCheck,
  Calendar,
  UserCheck,
  Layers,
  ChevronRight,
  ShieldCheck,
  Building2,
  Info
} from 'lucide-react';
import { AuditIdentity, ChecklistItem, FindingItem } from '../types/audit';
import { calculateStatistics } from '../utils/auditCalculator';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SummaryTabProps {
  identity: AuditIdentity;
  checklist: ChecklistItem[];
  findings: FindingItem[];
  darkMode: boolean;
}

export default function SummaryTab({ identity, checklist, findings, darkMode }: SummaryTabProps) {
  const stats = calculateStatistics(checklist);

  // Filter out high-priority recommendations (all items which are Non-compliant / "Tidak Memadai")
  const highPriorityControls = checklist.filter(item => item.kesimpulanAudit === 'Tidak Memadai');
  const mediumPriorityControls = checklist.filter(item => item.kesimpulanAudit === 'Perlu Peningkatan');

  // Trigger print view or simulated export JSON
  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Preload official Purbalingga logo from Wikimedia (has open CORS policy)
      const loadLogo = (): Promise<string | null> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Lambang_Kabupaten_Purbalingga.png/150px-Lambang_Kabupaten_Purbalingga.png';
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
              } else {
                resolve(null);
              }
            } catch (canvasErr) {
              console.warn('Canvas conversion failed, showing fallback logo:', canvasErr);
              resolve(null);
            }
          };
          img.onerror = () => {
            console.warn('Network logo load failed, showing fallback logo');
            resolve(null);
          };
          // Timeout after 3 seconds to avoid blocking the user
          setTimeout(() => resolve(null), 3000);
        });
      };

      const logoBase64 = await loadLogo();

      // Helper to draw horizontal line
      const drawLine = (y: number, thickness: number = 0.5, color: [number, number, number] = [0, 0, 0]) => {
        doc.setDrawColor(color[0], color[1], color[2]);
        doc.setLineWidth(thickness);
        doc.line(20, y, pageWidth - 20, y);
      };

      // Draw Official Header (Letterhead / Kop Surat)
      const drawKopSurat = (yStart: number) => {
        // Draw Logo (Left side)
        if (logoBase64) {
          doc.addImage(logoBase64, 'PNG', 20, yStart - 5, 16, 20);
        } else {
          // Programmatic Seal Fallback
          doc.setDrawColor(5, 150, 105); // emerald-600
          doc.setFillColor(241, 245, 249); // slate-100
          doc.setLineWidth(0.5);
          doc.circle(28, yStart + 5, 8, 'FD'); // Outer circle of seal
          doc.setDrawColor(217, 119, 6); // amber-600
          doc.circle(28, yStart + 5, 6.5, 'D'); // Inner circle of seal
          doc.setTextColor(5, 150, 105);
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(7);
          doc.text("SPBE", 28, yStart + 4.5, { align: 'center' });
          doc.setFontSize(5);
          doc.text("KAB.PBG", 28, yStart + 7.5, { align: 'center' });
        }

        // Department details (Centered on the page)
        doc.setTextColor(15, 23, 42); // slate-900
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.text("PEMERINTAH KABUPATEN PURBALINGGA", pageWidth / 2, yStart - 2, { align: 'center' });

        doc.setFontSize(13);
        doc.text("DINAS KOMUNIKASI DAN INFORMATIKA", pageWidth / 2, yStart + 4, { align: 'center' });

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text("Jalan Jenderal Sudirman No. 100 Purbalingga - 53311 | Telepon (0281) 891011", pageWidth / 2, yStart + 9, { align: 'center' });
        doc.text("Pos-el: diskominfo@purbalinggakab.go.id | Laman: purbalinggakab.go.id", pageWidth / 2, yStart + 13, { align: 'center' });

        // Official double-line under letterhead spanning X=20 to X=190
        drawLine(yStart + 17, 0.8, [15, 23, 42]);
        drawLine(yStart + 18.2, 0.2, [15, 23, 42]);

        // Report Title
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42); 
        doc.text("LAPORAN HASIL EVALUASI KEAMANAN SPBE - RESMI", pageWidth / 2, yStart + 26, { align: 'center' });
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text("Nomor: 800 / 025 / SPBE / 2026", pageWidth / 2, yStart + 31, { align: 'center' });
      };

      drawKopSurat(20);

      // Metadata Section
      doc.setTextColor(15, 23, 42);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text("I. INFORMASI UMUM OBJEK EVALUASI", 20, 62);

      const anggotaStr = identity.anggotaAuditor && identity.anggotaAuditor.length > 0 
        ? identity.anggotaAuditor.join(", ") 
        : "-";

      const metadataRows = [
        ["Instansi Pemerintah", `: ${identity.opd || "Dinas Komunikasi dan Informatika Kabupaten Purbalingga"}`],
        ["Tanggal Pemeriksaan", `: ${identity.tanggalAudit || "2026-05-29"}`],
        ["Sistem/Aplikasi", `: ${identity.namaAplikasi || "APLIKASI E-KEPEGAWAIAN"}`],
        ["Jenis Audit / Evaluasi", `: ${identity.jenisAudit || "WEBSITE"}`],
        ["Domain URL", `: ${identity.domainUrl || "https://ekepegawaian.purbalinggakab.go.id"}`],
        ["Ketua Tim Auditor", `: ${identity.ketuaTimAuditor || "Anna S.D. Wibowo"}`],
        ["Tim Anggota Auditor", `: ${anggotaStr}`],
        ["Kompleksitas Objek", `: ${identity.kompleksitasObjek || "Sedang"}`],
        ["Lokasi Peladen", `: ${identity.sebaranLokasi || "Terpusat"}`],
        ["Durasi Evaluasi", `: ${identity.jumlahHariEstimasi || "6"} Hari Kerja`]
      ];

      autoTable(doc, {
        startY: 65,
        body: metadataRows,
        theme: 'plain',
        styles: {
          fontSize: 8.5,
          cellPadding: { top: 1.5, bottom: 1.5, left: 0, right: 0 },
          textColor: [15, 23, 42],
          font: 'Helvetica',
          valign: 'top'
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
          1: { cellWidth: 130 }
        },
        margin: { left: 20, right: 20 }
      });

      const yAfterMeta = (doc as any).lastAutoTable.finalY + 10;

      // Assessment Scores banner (Bounded by margins left: 20, right: 20 -> width = 170)
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text("II. TINGKAT KEPATUHAN & HASIL PENILAIAN SECURITY", 20, yAfterMeta);

      const scoreBoxY = yAfterMeta + 3;
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(20, scoreBoxY, pageWidth - 40, 24, 'F');
      
      // Draw left heavy border accent
      doc.setFillColor(5, 150, 105); // emerald-600
      doc.rect(20, scoreBoxY, 2, 24, 'F');

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.setFont('Helvetica', 'bold');
      doc.text("STATUS AKHIR EVALUASI:", 26, scoreBoxY + 8);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`Tingkat Kepatuhan Keamanan SPBE diperoleh dengan menguji pemenuhan pedoman BSSN 2021.`, 26, scoreBoxY + 14);
      doc.text(`Kriteria Memadai: ${stats.memadaiCount} | Perlu Peningkatan: ${stats.perluPeningkatanCount} | Tidak Memadai: ${stats.tidakMemadaiCount}`, 26, scoreBoxY + 19);

      // Compliance Score Circle simulation
      doc.setFillColor(5, 150, 105); // emerald-600
      doc.rect(pageWidth - 55, scoreBoxY + 2, 35, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`${stats.complianceScore}%`, pageWidth - 37.5, scoreBoxY + 9, { align: 'center' });
      doc.setFontSize(7);
      doc.text(stats.ratingLevel, pageWidth - 37.5, scoreBoxY + 15, { align: 'center' });

      // Checklist Detail Table Header
      const yChecklistHeading = scoreBoxY + 32;
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'bold');
      doc.text("III. DETAILED AUDIT CHECKLIST & RECOMMENDATIONS", 20, yChecklistHeading);

      const checklistHeaders = [["ID", "Sub-Klausul / Pasal", "Kriteria Pengendalian Keamanan", "Kesimpulan Evaluasi", "Rekomendasi Utama"]];
      const checklistRows = checklist.map(c => [
        c.id,
        c.pasal,
        c.kriteria,
        c.kesimpulanAudit,
        c.rekomendasi || "-"
      ]);

      autoTable(doc, {
        startY: yChecklistHeading + 3,
        head: checklistHeaders,
        body: checklistRows,
        theme: 'grid',
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          textColor: [15, 23, 42],
          lineColor: [226, 232, 240],
          font: 'Helvetica'
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center'
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 10, halign: 'center' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 55 },
          3: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
          4: { cellWidth: 52 }
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 3) {
            const val = data.cell.raw as string;
            if (val === 'Tidak Memadai') {
              data.cell.styles.textColor = [225, 29, 72]; // rose-600
            } else if (val === 'Perlu Peningkatan') {
              data.cell.styles.textColor = [217, 119, 6]; // amber-600
            } else if (val === 'Memadai') {
              data.cell.styles.textColor = [5, 150, 105]; // emerald-600
            }
          }
        },
        margin: { left: 20, right: 20 }
      });

      const yFindingsHeading = (doc as any).lastAutoTable.finalY + 10;

      // Check if we need a new page for Findings section or can draw on same page
      let currentY = yFindingsHeading;
      if (currentY > pageHeight - 50) {
        doc.addPage();
        currentY = 20;
      }

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'bold');
      doc.text("IV. DAFTAR TEMUAN SIBER & STATUS TINDAK LANJUT", 20, currentY);

      const findingsHeaders = [["ID", "Kategori Temuan", "Kerentanan & Deskripsi Dampak / Rekomendasi", "PIC", "Target", "Status Lanjut"]];
      const findingsRows = findings.map(f => [
        f.id,
        f.kategori,
        `Temuan No: ${f.noTemuan}\n${f.deskripsi}\nRemediasi: ${f.rekomendasi}`,
        f.pic || "-",
        f.targetSelesai || "-",
        f.statusTindakLanjut
      ]);

      autoTable(doc, {
        startY: currentY + 3,
        head: findingsHeaders,
        body: findingsRows,
        theme: 'grid',
        styles: {
          fontSize: 7,
          cellPadding: 2,
          textColor: [15, 23, 42],
          lineColor: [226, 232, 240],
          font: 'Helvetica'
        },
        headStyles: {
          fillColor: [5, 115, 85], // Teal background
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
          halign: 'center'
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 10, halign: 'center' },
          1: { cellWidth: 25 },
          2: { cellWidth: 65 },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 25, halign: 'center' },
          5: { cellWidth: 25, halign: 'center', fontStyle: 'bold' }
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 5) {
            const val = data.cell.raw as string;
            if (val === 'Open') {
              data.cell.styles.textColor = [225, 29, 72]; // rose-600
            } else if (val === 'In Progress') {
              data.cell.styles.textColor = [217, 119, 6]; // amber-600
            } else if (val === 'Resolved') {
              data.cell.styles.textColor = [5, 150, 105]; // emerald-600
            }
          }
        },
        margin: { left: 20, right: 20 }
      });

      const ySignatures = (doc as any).lastAutoTable.finalY + 15;
      let signY = ySignatures;

      if (signY > pageHeight - 65) {
        doc.addPage();
        signY = 25;
      }

      // Signatures
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8.5);
      doc.setFont('Helvetica', 'normal');

      // Left Column Signature
      doc.text("Mengetahui / Memvalidasi,", 50, signY, { align: 'center' });
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("Sekretaris Daerah / Penanggung Jawab Klien", 50, signY + 4, { align: 'center' });

      doc.setFont('Helvetica', 'normal');
      doc.text("______________________________________", 50, signY + 24, { align: 'center' });
      doc.text("NIP. 19740510 200012 1 001", 50, signY + 29, { align: 'center' });

      // Right Column Signature
      doc.setTextColor(100, 116, 139);
      const dateStr = `Purbalingga, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      doc.text(dateStr, pageWidth - 50, signY, { align: 'center' });
      doc.text("Dibuat oleh,", pageWidth - 50, signY + 4, { align: 'center' });
      doc.setTextColor(5, 150, 105);
      doc.setFont('Helvetica', 'bold');
      doc.text("Ketua Tim Auditor", pageWidth - 50, signY + 8, { align: 'center' });

      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(identity.ketuaTimAuditor || "Anna S.D. Wibowo", pageWidth - 50, signY + 24, { align: 'center' });
      doc.setFont('Helvetica', 'bold');
      doc.text("Certified BSSN Cyber Auditor", pageWidth - 50, signY + 29, { align: 'center' });

      // Tim Anggota Auditor (Team members list)
      if (identity.anggotaAuditor && identity.anggotaAuditor.length > 0) {
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text("Anggota Tim Auditor:", pageWidth - 50, signY + 34, { align: 'center' });
        
        identity.anggotaAuditor.forEach((member, idx) => {
          doc.text(`- ${member}`, pageWidth - 50, signY + 38 + (idx * 3.5), { align: 'center' });
        });
      }

      // Page Numbering Footer on all pages
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(`Dokumen Resmi SPBE | Halaman ${i} dari ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
        doc.text("BSSN Standard Formulir B4 (2021)", 20, pageHeight - 8);
        doc.text("CONFIDENTIAL", pageWidth - 20, pageHeight - 8, { align: 'right' });
      }

      doc.save(`Laporan_Audit_SPBE_${identity.namaAplikasi.replace(/\s+/g, '_') || 'APLIKASI'}.pdf`);
    } catch (err) {
      console.error('Gagal generate PDF:', err);
      alert('Gagal mengekspor PDF Laporan otomatis. Silakan coba tombol "Cetak PDF Laporan" atau refresh halaman.');
    }
  };

  const handleExportJSON = () => {
    const reportData = {
      laporanMetaData: {
        waktuGenerate: new Date().toISOString(),
        pembuat: identity.ketuaTimAuditor,
        skorKepatuhanAkhir: stats.complianceScore,
        tingkatKeamanan: stats.ratingLevel
      },
      identitasObjekAudit: identity,
      daftarTemuanEvaluasi: findings,
      ringkasanMetrik: stats,
      daftarKontrolAuditDetail: checklist.map(c => ({
        id: c.id,
        kriteria: c.kriteria,
        pasal: c.pasal,
        evaluasiDesain: c.evaluasiDesain,
        evaluasiImplementasi: c.evaluasiImplementasi,
        evaluasiEfektivitas: c.evaluasiEfektivitas,
        kesimpulanAudit: c.kesimpulanAudit,
        catatanAuditor: c.catatanAuditor,
        rekomendasi: c.rekomendasi
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Hasil_Audit_Keamanan_SPBE_${identity.namaAplikasi.replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="summary-tab-root" className="space-y-6 animate-fade-in text-xs">
      
      {/* Top action header */}
      <div id="summary-action-banner" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 id="summary-title" className="text-xl font-bold tracking-tight">Kompilasi Kesimpulan & Ekspor Laporan</h2>
          <p id="summary-subtitle" className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Koleksi ini merepresentasikan naskah laporan hasil evaluasi teknis sesuai standard formulir BSSN 2021.
          </p>
        </div>
        <div id="summary-actions-grid" className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/10 transition active:scale-95 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-100" />
            <span>Unduh Laporan PDF Resmi</span>
          </button>
          <button
            onClick={handlePrint}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition active:scale-95 cursor-pointer ${
              darkMode 
                ? 'bg-[#0f172a] border-[#334155] text-slate-200 hover:bg-[#334155]' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
            }`}
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Cetak Tampilan Layar</span>
          </button>
          <button
            onClick={handleExportJSON}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition active:scale-95 cursor-pointer ${
              darkMode 
                ? 'bg-[#0f172a] border-[#334155] text-slate-200 hover:bg-[#334155]' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
            }`}
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Ekspor JSON</span>
          </button>
        </div>
      </div>

      {/* Main printable report body layout */}
      <div 
        id="print-area" 
        className={`p-8 rounded-2xl border print:border-none print:shadow-none print:bg-white print:text-black ${
          darkMode ? 'bg-[#1e293b] border-[#334155] text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        {/* Document Header Cop (Government Style) */}
        <div id="report-header-cop" className="relative flex flex-col md:flex-row items-center border-b-4 border-double border-slate-700 dark:border-slate-300 pb-4 text-center">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Lambang_Kabupaten_Purbalingga.png/120px-Lambang_Kabupaten_Purbalingga.png" 
            alt="Logo Purbalingga" 
            className="w-16 h-20 object-contain md:absolute md:left-4 shrink-0 filter drop-shadow-sm select-none" 
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 space-y-1 text-center">
            <h1 className="text-xs sm:text-sm font-extrabold tracking-wider text-slate-500 dark:text-slate-400 uppercase select-none">
              PEMERINTAH KABUPATEN PURBALINGGA
            </h1>
            <h2 className="text-base sm:text-xl font-black tracking-wide text-slate-800 dark:text-white uppercase leading-tight">
              DINAS KOMUNIKASI DAN INFORMATIKA
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Jalan Jenderal Sudirman No. 100 Purbalingga - 53311 | Telepon (0281) 891011
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-none">
              Pos-el: diskominfo@purbalinggakab.go.id | Laman: purbalinggakab.go.id
            </p>
          </div>
        </div>
        <div className="text-center mt-6 mb-8 space-y-1">
          <h2 className="text-xs sm:text-sm font-extrabold tracking-wider text-slate-800 dark:text-white uppercase">
            LAPORAN HASIL EVALUASI KEAMANAN SPBE - RESMI
          </h2>
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
            Nomor: 800 / 025 / SPBE / 2026
          </p>
        </div>

        {/* Section 1: Metadata Audit */}
        <div id="section-meta" className="mt-6 space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-500 border-b pb-1 dark:border-[#334155]">
            I. INFORMASI UMUM OBJEK EVALUASI
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-[11px]">
            <div className="space-y-2">
              <p><strong className="text-slate-400">Instansi Pemerintah:</strong> <br /><span className="text-sm font-bold">{identity.opd || 'Belum diisi'}</span></p>
              <p><strong className="text-slate-400">Website / Sistem Aplikasi:</strong> <br /><span className="text-sm font-bold text-emerald-500">{identity.namaAplikasi || 'Belum diisi'}</span></p>
              <p><strong className="text-slate-400">Domain / URL Akses:</strong> <br /><span className="font-mono text-xs">{identity.domainUrl || 'Belum diisi'}</span></p>
            </div>
            <div className="space-y-2">
              <p><strong className="text-slate-400">Ketua Tim Auditor:</strong> <br /><span className="font-bold text-sm">{identity.ketuaTimAuditor || 'Belum diisi'}</span></p>
              <p><strong className="text-slate-400">Tanggal Pemeriksaan:</strong> <br /><span className="font-mono">{identity.tanggalAudit || 'Belum diisi'}</span></p>
              <p><strong className="text-slate-400">Durasi Kerja Evaluasi:</strong> <br /><span>{identity.jumlahHariEstimasi} Hari Pelaksanaan</span></p>
            </div>
            <div className="space-y-2">
              <p><strong className="text-slate-400">Kompleksitas Objek Audit:</strong> <br /><span>{identity.kompleksitasObjek}</span></p>
              <p><strong className="text-slate-400">Kompleksitas Teknologi:</strong> <br /><span>{identity.kompleksitasTeknologi}</span></p>
              <p><strong className="text-slate-400">Sebaran Lokasi Peladen:</strong> <br /><span>{identity.sebaranLokasi}</span></p>
            </div>
          </div>
        </div>

        {/* Section 2: Ringkasan Skor Akhir & Kesimpulan Penilaian */}
        <div id="section-score-summary" className="mt-8 space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-500 border-b pb-1 dark:border-[#334155]">
            II. HASIL PENILAIAN & TINGKAT KEPATUHAN (SPI)
          </h3>

          <div className={`p-6 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center border ${
            darkMode ? 'bg-[#0f172a]/60 border-[#334155]' : 'bg-slate-50 border-slate-150'
          }`}>
            {/* Score circle */}
            <div className="flex flex-col items-center justify-center text-center border-r md:border-r border-slate-350 dark:border-slate-800 py-2 pr-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skor Akhir Kepatuhan</span>
              <span className="text-5xl font-black text-emerald-500 mt-2">{stats.complianceScore}%</span>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Sertifikasi Grade BSSN</p>
            </div>

            {/* Rating details display */}
            <div className="space-y-2 md:col-span-2 pl-2">
              <div className="flex items-center gap-2">
                <strong className="text-slate-400">Kualifikasi Keamanan:</strong>
                <span className={`text-base font-extrabold ${stats.ratingColor}`}>{stats.ratingLevel}</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Evaluasi menunjukkan bahwa pemenuhan pedoman manajemen siber serta pengendalian teknis aplikasi website pengaman dinas memiliki kualifikasi <strong>{stats.ratingLevel}</strong>. 
                Terdapat <strong>{highPriorityControls.length} kontrol No. kriteria</strong> berkategori belum memadai (Non-compliant) dan <strong>{mediumPriorityControls.length} kriteria</strong> berstatus perlu peningkatan.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Prioritas Perbaikan Kerja (Tabel Perbaikan Penting) */}
        <div id="section-recs-priority" className="mt-8 space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-500 border-b pb-1 dark:border-[#334155]">
            III. ARTIKEL PRIORITAS REKOMENDASI UTAMA & PROGRAM TINDAK LANJUT
          </h3>

          <div className="space-y-4">
            
            {/* Critical priority */}
            {highPriorityControls.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="font-extrabold text-[11px] text-rose-500 flex items-center gap-1.5 uppercase">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>Prioritas Utama (Tutup Celah Kritis / Tidak Memadai)</span>
                </h4>
                <div id="priority-list-red" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {highPriorityControls.slice(0, 4).map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-xl border flex gap-3 ${
                        darkMode ? 'bg-rose-950/15 border-rose-900/40 text-rose-200' : 'bg-rose-50 border-rose-100 text-rose-900'
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="font-bold text-xs">Kontrol No {item.id}</strong>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500 font-bold">{item.pasal}</span>
                        </div>
                        <p className="font-medium mt-1 text-slate-350 dark:text-slate-300 leading-normal">{item.kriteria}</p>
                        <div className="mt-2 text-[10px] bg-slate-900/60 dark:bg-slate-900/70 p-2 rounded text-slate-300 border border-slate-800">
                          <strong>Koreksi Rekomendasi:</strong> {item.rekomendasi}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Secondary priority */}
            {mediumPriorityControls.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <h4 className="font-extrabold text-[11px] text-amber-500 flex items-center gap-1.5 uppercase">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Prioritas Menengah (Hardening Sistem / Perlu Peningkatan)</span>
                </h4>
                <div id="priority-list-yellow" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mediumPriorityControls.slice(0, 4).map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-xl border flex gap-3 ${
                        darkMode ? 'bg-amber-950/15 border-amber-900/40 text-amber-200' : 'bg-amber-50 border-amber-100 text-amber-900'
                      }`}
                    >
                      <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="font-bold text-xs">Kontrol No {item.id}</strong>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 font-bold">{item.pasal}</span>
                        </div>
                        <p className="font-medium mt-1 text-slate-350 dark:text-slate-300 leading-normal">{item.kriteria}</p>
                        <div className="mt-2 text-[10px] bg-slate-900/60 dark:bg-slate-900/70 p-2 rounded text-slate-300 border border-slate-800">
                          <strong>Rekomendasi Keamanan:</strong> {item.rekomendasi}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Section 3.5: Daftar Detail Checklist Evaluasi (Only shown in print layout) */}
        <div id="print-checklist-section" className="hidden print:block mt-8 space-y-4 page-break-before">
          <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-600 border-b pb-1 dark:border-none">
            IV. TABEL DETAIL KONTROL EVALUASI KEAMANAN SPBE
          </h3>
          <table className="w-full text-[10px] border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-800">
                <th className="border border-slate-300 p-1.5 text-center w-12 font-bold">ID</th>
                <th className="border border-slate-300 p-1.5 text-center w-24 font-bold">Pasal</th>
                <th className="border border-slate-300 p-1.5 text-left font-bold">Kriteria Pengendalian Keamanan</th>
                <th className="border border-slate-300 p-1.5 text-center w-24 font-bold">Kesimpulan</th>
                <th className="border border-slate-300 p-1.5 text-left font-bold">Rekomendasi Utama</th>
              </tr>
            </thead>
            <tbody>
              {checklist.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-slate-900">{item.id}</td>
                  <td className="border border-slate-300 p-1.5 text-center font-bold text-slate-650">{item.pasal}</td>
                  <td className="border border-slate-300 p-1.5 leading-normal text-slate-900">{item.kriteria}</td>
                  <td className={`border border-slate-300 p-1.5 text-center font-extrabold ${
                    item.kesimpulanAudit === 'Tidak Memadai' ? 'text-red-600' :
                    item.kesimpulanAudit === 'Perlu Peningkatan' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>{item.kesimpulanAudit}</td>
                  <td className="border border-slate-300 p-1.5 text-slate-700 leading-normal">{item.rekomendasi || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 3.6: Daftar Temuan Keamanan & Kerentanan (Only shown in print layout) */}
        <div id="print-findings-section" className="hidden print:block mt-8 space-y-4 page-break-before">
          <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-600 border-b pb-1 dark:border-none">
            V. DAFTAR TEMUAN KERENTANAN SIBER & STATUS TINDAK LANJUT
          </h3>
          <table className="w-full text-[10px] border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-800">
                <th className="border border-slate-300 p-1.5 text-center w-12 font-bold">ID</th>
                <th className="border border-slate-300 p-1.5 text-left w-32 font-bold">Kategori Temuan</th>
                <th className="border border-slate-300 p-1.5 text-left font-bold">Deskripsi Temuan & Kerentanan</th>
                <th className="border border-slate-300 p-1.5 text-left font-bold">Rekomendasi / Remediasi</th>
                <th className="border border-slate-300 p-1.5 text-center w-24 font-bold">PIC & Target</th>
                <th className="border border-slate-300 p-1.5 text-center w-20 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {findings.map((finding) => (
                <tr key={finding.id} className="hover:bg-slate-50">
                  <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-slate-900">{finding.id}</td>
                  <td className="border border-slate-300 p-1.5 font-bold text-slate-700">{finding.kategori}</td>
                  <td className="border border-slate-300 p-1.5 leading-normal text-slate-900">
                    <div className="font-bold text-slate-850">No. Temuan: {finding.noTemuan}</div>
                    <div className="text-slate-650 mt-0.5">{finding.deskripsi}</div>
                  </td>
                  <td className="border border-slate-300 p-1.5 text-emerald-800 leading-normal font-medium">{finding.rekomendasi}</td>
                  <td className="border border-slate-300 p-1.5 text-center leading-normal text-slate-600">
                    <div>{finding.pic || '-'}</div>
                    <div className="text-[9px] font-mono mt-0.5">{finding.targetSelesai || '-'}</div>
                  </td>
                  <td className={`border border-slate-300 p-1.5 text-center font-extrabold ${
                    finding.statusTindakLanjut === 'Open' ? 'text-red-600' :
                    finding.statusTindakLanjut === 'In Progress' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>{finding.statusTindakLanjut}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 4: Signature / Sign Off Block */}
        <div id="section-signatures" className="mt-12 pt-8 border-t border-dashed dark:border-[#334155] grid grid-cols-2 gap-6 text-center text-[10px] text-slate-400 select-none">
          <div className="space-y-12">
            <p>Mengetahui / Memvalidasi,<br /><strong className="text-slate-200 dark:text-[#f8fafc] text-xs">Sekretaris Daerah / Pejabat Penanggung Jawab Klien</strong></p>
            <div>
              <p className="underline font-bold text-slate-300 dark:text-slate-200">______________________________________</p>
              <p className="font-bold font-mono">NIP. 19740510 200012 1 001</p>
            </div>
          </div>
          <div className="space-y-12">
            <p>Purbalingga, 29 Mei 2026<br />Dibuat oleh,<br /><strong className="text-emerald-500 text-xs">Ketua Tim Auditor</strong></p>
            <div>
              <p className="underline font-bold text-slate-300 dark:text-slate-200">{identity.ketuaTimAuditor || "..................................................."}</p>
              <p className="font-bold font-mono">Certified BSSN Cyber Auditor</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
