import { EvaluasiDesain, EvaluasiImplementasi, EvaluasiEfektivitas, KesimpulanAuditType, ChecklistItem, FindingItem } from '../types/audit';

// 1. Calculate Audit Execution Days from the SPBE 3x3 lookup table
export function calculateAuditDays(
  objek: 'Sederhana' | 'Sedang' | 'Kompleks',
  teknologi: 'Sederhana' | 'Sedang' | 'Kompleks',
  lokasi: 'Terpusat' | 'Tersebar'
): number {
  if (objek === 'Sederhana') {
    if (teknologi === 'Sederhana') return lokasi === 'Terpusat' ? 2 : 3;
    if (teknologi === 'Sedang') return lokasi === 'Terpusat' ? 3 : 4;
    if (teknologi === 'Kompleks') return lokasi === 'Terpusat' ? 4 : 5;
  }
  if (objek === 'Sedang') {
    if (teknologi === 'Sederhana') return lokasi === 'Terpusat' ? 5 : 6;
    if (teknologi === 'Sedang') return lokasi === 'Terpusat' ? 6 : 7;
    if (teknologi === 'Kompleks') return lokasi === 'Terpusat' ? 7 : 8;
  }
  if (objek === 'Kompleks') {
    if (teknologi === 'Sederhana') return lokasi === 'Terpusat' ? 8 : 9;
    if (teknologi === 'Sedang') return lokasi === 'Terpusat' ? 9 : 10;
    if (teknologi === 'Kompleks') return 10; // Terpusat 10, Tersebar 10
  }
  return 5; // Default fallback
}

// 2. Evaluate Dynamic audit conclusion based on the design-implementation-effectiveness matrix (PDF page 2)
export function getKesimpulanDetail(
  desain: EvaluasiDesain,
  implementasi: EvaluasiImplementasi,
  efektivitas: EvaluasiEfektivitas
): KesimpulanAuditType {
  if (desain === 'Belum Dinilai' || implementasi === 'Belum Dinilai' || efektivitas === 'Belum Dinilai') {
    return 'Belum Dilakukan Evaluasi';
  }

  // Desain: Memadai
  if (desain === 'Memadai') {
    if (implementasi === 'Sesuai dengan Desain') {
      if (efektivitas === 'Efektif') return 'Memadai';
      if (efektivitas === 'Perlu Peningkatan') return 'Memadai';
      if (efektivitas === 'Belum Efektif') return 'Perlu Peningkatan';
    }
    if (implementasi === 'Tidak Sesuai dengan Desain' || implementasi === 'Belum Sesuai') {
      if (efektivitas === 'Efektif') return 'Perlu Peningkatan';
      if (efektivitas === 'Perlu Peningkatan') return 'Tidak Memadai';
      if (efektivitas === 'Belum Efektif') return 'Tidak Memadai';
    }
  }

  // Desain: Perlu Peningkatan
  if (desain === 'Perlu Peningkatan') {
    if (implementasi === 'Sesuai dengan Desain') {
      if (efektivitas === 'Efektif') return 'Memadai';
      if (efektivitas === 'Perlu Peningkatan') return 'Perlu Peningkatan';
      if (efektivitas === 'Belum Efektif') return 'Tidak Memadai';
    }
    if (implementasi === 'Tidak Sesuai dengan Desain' || implementasi === 'Belum Sesuai') {
      if (efektivitas === 'Efektif') return 'Tidak Memadai';
      if (efektivitas === 'Perlu Peningkatan') return 'Tidak Memadai';
      if (efektivitas === 'Belum Efektif') return 'Tidak Memadai';
    }
  }

  // Desain: Tidak Memadai
  if (desain === 'Tidak Memadai') {
    return 'Tidak Memadai';
  }

  return 'Tidak Memadai'; // Fallback
}

// 3. Compute stats summary: total, compliant, non-compliant, percent scores
export interface AuditStatistics {
  totalControls: number;
  assessedControls: number;
  memadaiCount: number;
  perluPeningkatanCount: number;
  tidakMemadaiCount: number;
  complianceScore: number; // percentage of (Memadai + 0.5 * Perlu Peningkatan) / assessed
  ratingLevel: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang' | 'Sangat Kurang';
  ratingColor: string;
}

export function calculateStatistics(checklist: ChecklistItem[]): AuditStatistics {
  const totalControls = checklist.length;
  let assessedControls = 0;
  let memadaiCount = 0;
  let perluPeningkatanCount = 0;
  let tidakMemadaiCount = 0;

  checklist.forEach(item => {
    if (item.kesimpulanAudit !== 'Belum Dilakukan Evaluasi') {
      assessedControls++;
      if (item.kesimpulanAudit === 'Memadai') memadaiCount++;
      else if (item.kesimpulanAudit === 'Perlu Peningkatan') perluPeningkatanCount++;
      else if (item.kesimpulanAudit === 'Tidak Memadai') tidakMemadaiCount++;
    }
  });

  // Score calculation: Memadai gets 100%, Perlu Peningkatan gets 50%, Tidak Memadai gets 0%
  let complianceScore = 0;
  if (assessedControls > 0) {
    complianceScore = Math.round(
      ((memadaiCount * 100 + perluPeningkatanCount * 50) / assessedControls)
    );
  }

  let ratingLevel: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang' | 'Sangat Kurang' = 'Sangat Kurang';
  let ratingColor = 'text-red-500';

  if (complianceScore >= 85) {
    ratingLevel = 'Sangat Baik';
    ratingColor = 'text-emerald-500';
  } else if (complianceScore >= 70) {
    ratingLevel = 'Baik';
    ratingColor = 'text-teal-500';
  } else if (complianceScore >= 55) {
    ratingLevel = 'Cukup';
    ratingColor = 'text-amber-500';
  } else if (complianceScore >= 40) {
    ratingLevel = 'Kurang';
    ratingColor = 'text-orange-500';
  } else {
    ratingLevel = 'Sangat Kurang';
    ratingColor = 'text-rose-600';
  }

  return {
    totalControls,
    assessedControls,
    memadaiCount,
    perluPeningkatanCount,
    tidakMemadaiCount,
    complianceScore,
    ratingLevel,
    ratingColor
  };
}

// 4. Calculate Risk matrix severity (5x5 matrix mapping likelihood/impact to rating)
export function getSeverityLevel(likelihood: number, impact: number): 'Low' | 'Medium' | 'High' | 'Critical' {
  const score = likelihood * impact;
  if (score >= 15) return 'Critical';
  if (score >= 9) return 'High';
  if (score >= 4) return 'Medium';
  return 'Low';
}
