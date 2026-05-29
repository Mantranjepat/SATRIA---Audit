import React, { useState } from 'react';
import { Grid3X3, Info, AlertTriangle, ShieldAlert } from 'lucide-react';
import { FindingItem } from '../types/audit';

interface RiskMatrixTabProps {
  findings: FindingItem[];
  darkMode: boolean;
}

export default function RiskMatrixTab({ findings, darkMode }: RiskMatrixTabProps) {
  const [selectedCell, setSelectedCell] = useState<{ likelihood: number, impact: number } | null>(null);

  // 1-5 coordinates
  const indices = [5, 4, 3, 2, 1]; // Rows (Impact) from top to bottom
  const cols = [1, 2, 3, 4, 5];    // Cols (Likelihood) from left to right

  // Helper labels
  const likelihoodLabels = [
    { val: 1, label: 'Sangat Jarang (S1)', desc: 'Hampir tidak pernah terjadi' },
    { val: 2, label: 'Jarang (S2)', desc: 'Kemungkinan terjadi kecil' },
    { val: 3, label: 'Mungkin (S3)', desc: 'Dapat terjadi sewaktu-waktu' },
    { val: 4, label: 'Sering (S4)', desc: 'Besar peluang terjadi' },
    { val: 5, label: 'Hampir Pasti (S5)', desc: 'Sangat sering terulang' }
  ];

  const impactLabels = [
    { val: 1, label: 'Sangat Kecil (D1)', desc: 'Dampak operasional minimal' },
    { val: 2, label: 'Kecil (D2)', desc: 'Gangguan lokal berdurasi singkat' },
    { val: 3, label: 'Sedang (D3)', desc: 'Layanan publik terganggu sebagian' },
    { val: 4, label: 'Besar (D4)', desc: 'Kerugian finansial/kebocoran data regional' },
    { val: 5, label: 'Sangat Besar (D5)', desc: 'Lumpuh total/Tuntutan hukum nasional' }
  ];

  // Map coordinate to cell danger category
  const getCellSeverityType = (l: number, i: number): 'Low' | 'Medium' | 'High' | 'Critical' => {
    const score = l * i;
    if (score >= 15) return 'Critical';
    if (score >= 9) return 'High';
    if (score >= 4) return 'Medium';
    return 'Low';
  };

  const getCellBgColor = (l: number, i: number) => {
    const type = getCellSeverityType(l, i);
    switch (type) {
      case 'Critical':
        return darkMode 
          ? 'bg-rose-950/70 border-rose-800 text-rose-300 hover:bg-rose-900/80' 
          : 'bg-rose-100 border-rose-300 text-rose-900 hover:bg-rose-200';
      case 'High':
        return darkMode 
          ? 'bg-orange-950/60 border-orange-850 text-orange-300 hover:bg-orange-900/70' 
          : 'bg-orange-100 border-orange-300 text-orange-900 hover:bg-orange-200';
      case 'Medium':
        return darkMode 
          ? 'bg-amber-950/40 border-amber-800 text-amber-300 hover:bg-amber-900/50' 
          : 'bg-amber-100 border-amber-250 text-amber-900 hover:bg-amber-200';
      default:
        return darkMode 
          ? 'bg-emerald-950/25 border-emerald-900/40 text-emerald-300 hover:bg-emerald-900/30' 
          : 'bg-emerald-100 border-emerald-250 text-emerald-900 hover:bg-emerald-200';
    }
  };

  // Get findings currently sitting in this cell
  const getFindingsInCell = (l: number, i: number) => {
    return findings.filter(f => f.likelihood === l && f.impact === i);
  };

  const selectedCellFindings = selectedCell 
    ? getFindingsInCell(selectedCell.likelihood, selectedCell.impact)
    : [];

  return (
    <div id="risk-matrix-tab-root" className="space-y-6 animate-fade-in text-xs">
      
      {/* Intro info card */}
      <div id="matrix-info" className={`p-5 rounded-xl border flex items-start gap-3.5 ${
        darkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="p-2.5 bg-[#38bdf8]/15 text-[#38bdf8] rounded-xl mt-0.5">
          <Grid3X3 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm tracking-tight text-white dark:text-[#f8fafc]">Kualifikasi Peta Panas Risiko (Heatmap Risk Matrix 5x5)</h3>
          <p className="text-[#94a3b8] mt-1 leading-relaxed">
            Peta risiko dihitung mandiri dari perkalian metrik <strong>Likehood (Kemungkinan Terjadi)</strong> dan <strong>Impact (Tingkat Keparahan Dampak)</strong>. 
            Klik salah satu kotak pada matriks untuk memfilter daftar temuan terkait di bawahnya.
          </p>
        </div>
      </div>

      <div id="matrix-layout" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Heatmap Section (Col span 2) */}
        <div id="heatmap-wrapper" className={`xl:col-span-2 p-6 rounded-xl border flex flex-col items-center justify-center ${
          darkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h4 className="font-bold text-sm tracking-tight text-white dark:text-[#f8fafc] self-start mb-6">Peta Sebaran Temuan Aktif</h4>

          {/* Matrix Arena */}
          <div className="w-full max-w-xl flex flex-col gap-1.5 pb-2">
            
            {/* Impact Y-Axis header layout with Matrix columns */}
            {indices.map((iVal) => {
              const rowLabel = impactLabels.find(l => l.val === iVal);
              return (
                <div key={iVal} className="flex gap-2 items-stretch min-h-16">
                  
                  {/* Left Label: Weight description of Impact */}
                  <div className="w-24 flex items-center justify-end text-right pr-2 text-[10px] font-bold text-slate-400 select-none">
                    <span title={rowLabel?.desc}>{rowLabel?.label}</span>
                  </div>

                  {/* 5 matrix cells in row */}
                  <div className="flex-1 grid grid-cols-5 gap-1.5">
                    {cols.map((lVal) => {
                      const cellFindings = getFindingsInCell(lVal, iVal);
                      const isSelected = selectedCell?.likelihood === lVal && selectedCell?.impact === iVal;
                      return (
                        <button
                          key={lVal}
                          onClick={() => setSelectedCell({ likelihood: lVal, impact: iVal })}
                          className={`rounded-xl border p-2 flex flex-col items-center justify-between transition-all relative outline-none cursor-pointer ${getCellBgColor(lVal, iVal)} ${
                            isSelected ? 'ring-2 ring-[#38bdf8] scale-[1.03] z-10' : ''
                          }`}
                        >
                          <span className="text-[10px] font-mono opacity-60 self-start">D{iVal}xS{lVal}</span>
                          
                          {/* Circle indicators of total findings inside */}
                          {cellFindings.length > 0 && (
                            <div className="flex flex-wrap gap-1 justify-center items-center mt-1">
                              {cellFindings.map((f, fIdx) => (
                                <span 
                                  key={fIdx} 
                                  className="w-5 h-5 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center font-bold text-[9px] font-mono shadow-md border dark:border-slate-800"
                                  title={f.deskripsi}
                                >
                                  {f.id}
                                </span>
                              ))}
                            </div>
                          )}

                          <span className="text-[9px] font-semibold tracking-wide opacity-80 mt-1 truncate">
                            {cellFindings.length} Temuan
                          </span>
                        </button>
                      );
                    })}
                  </div>

                </div>
              );
            })}

            {/* Bottom X-Axis Helper label for Likelihood */}
            <div className="flex gap-2">
              <div className="w-24 shrink-0" />
              <div className="flex-1 grid grid-cols-5 gap-1.5 text-center mt-1">
                {likelihoodLabels.map((l) => (
                  <div key={l.val} className="text-[10px] font-bold text-slate-400 select-none" title={l.desc}>
                    {l.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Global Legend helper labels bottom line */}
            <div className="flex gap-3 justify-center items-center mt-6 text-[10px] font-bold">
              <span className="text-slate-400">Arsir Warna:</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30" /> Low (1-3)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30" /> Medium (4-8)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500/20 border border-orange-500/30" /> High (9-14)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/30" /> Critical (&ge;15)</span>
            </div>

          </div>
        </div>

        {/* Selected Cell details side panel */}
        <div id="side-cell-findings" className="flex flex-col gap-4">
          
          <div className={`p-5 rounded-xl border flex-1 flex flex-col ${
            darkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h4 className="font-bold text-sm tracking-tight mb-4 flex items-center gap-1.5 text-white dark:text-[#f8fafc]">
              <Info className="w-4 h-4 text-[#38bdf8]" />
              <span>Detail Temuan di Koordinat Terpilih</span>
            </h4>

            {selectedCell ? (
              <div id="cell-detail-arena" className="flex-1 flex flex-col justify-between">
                
                {/* Info coordinate text */}
                <div className={`p-3.5 rounded-xl border mb-4 text-[11px] ${
                  darkMode ? 'bg-[#0f172a]/60 border-[#334155]' : 'bg-slate-50 border-slate-150'
                }`}>
                  <p className="font-bold text-[#94a3b8]">KOORDINAT: KEMUNGKINAN S{selectedCell.likelihood} x DAMPAK D{selectedCell.impact}</p>
                  <p className="text-slate-500 mt-1">
                    Dampak: <span className="font-bold text-slate-350 dark:text-slate-300">{impactLabels.find(l => l.val === selectedCell.impact)?.label}</span> • 
                    Kemungkinan: <span className="font-bold text-slate-350 dark:text-slate-300">{likelihoodLabels.find(l => l.val === selectedCell.likelihood)?.label}</span>
                  </p>
                </div>

                {/* Scrolled list of findings */}
                <div className="flex-1 space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                  {selectedCellFindings.length > 0 ? (
                    selectedCellFindings.map((f, fIdx) => (
                      <div 
                        key={fIdx} 
                        className={`p-3.5 rounded-xl border flex flex-col gap-2 relative transition hover:border-emerald-500 ${
                          darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-emerald-500">{f.id} ({f.noTemuan})</span>
                          <span className="text-[10px] text-slate-500 font-mono">PIC: {f.pic}</span>
                        </div>
                        <p className="font-semibold leading-relaxed mt-1 text-slate-250 dark:text-slate-100">{f.deskripsi}</p>
                        <div className={`p-2 rounded-lg text-[10px] border mt-1 leading-relaxed ${
                          darkMode ? 'bg-slate-900/60 border-slate-850 text-slate-400' : 'bg-slate-50 border-slate-150 text-slate-650'
                        }`}>
                          <strong>Rekomendasi:</strong> {f.rekomendasi}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                      <p className="text-center font-medium">Bebas Hambatan</p>
                      <p className="text-center text-[10px] text-slate-500 max-w-xs mt-1">Tidak ada temuan yang diklasifikasikan dengan tingkat risiko koordinat terarsir ini.</p>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center py-12">
                <Info className="w-10 h-10 text-slate-500 mb-2" />
                <p className="font-semibold text-xs text-slate-350">Silakan Pilih Kotak Matriks</p>
                <p className="text-[10px] text-slate-500 max-w-xs mt-1">Klik salah satu kotak pada peta sebaran di sebelah kiri untuk menelaah detail temuan siber.</p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
