import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Copy, 
  Check, 
  Terminal, 
  ExternalLink, 
  ShieldCheck, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle,
  FileText,
  UploadCloud,
  Layers,
  Activity,
  UserCheck
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { ChecklistItem, FindingItem, AuditIdentity } from '../types/audit';

interface DatabaseTabProps {
  darkMode: boolean;
  checklist: ChecklistItem[];
  findings: FindingItem[];
  identity: AuditIdentity;
}

export default function DatabaseTab({ darkMode, checklist, findings, identity }: DatabaseTabProps) {
  // Navigation tabs of Database tab itself
  const [dbSubTab, setDbSubTab] = useState<'schema' | 'rls' | 'integrasi'>('schema');
  const [copied, setCopied] = useState<boolean>(false);
  
  // Connection state
  const [supabaseUrl, setSupabaseUrl] = useState<string>(() => localStorage.getItem('satria_supabase_url') || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>(() => localStorage.getItem('satria_supabase_key') || '');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Tables record count representation (simulated or fetched from live DB)
  const [liveCounts, setLiveCounts] = useState<{ [key: string]: number | null }>({
    opd: null,
    users: null,
    audit_periode: null,
    audit_indikator: null,
    temuan_audit: null,
  });

  const sqlSchemaCode = `-- ==========================================================
-- SYSTEM: SATRIA v2 (Sistem Audit Tata Kelola Risiko dan Informasi)
-- SUB-SYSTEM: SUPABASE POSTGRESQL SCHEMAS & DEFINITIONS
-- DATE: 2026-05-29
-- ==========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. ENUM TYPES SETUP
create type user_role as enum ('admin', 'ketua_auditor', 'anggota_auditor', 'auditee', 'penanggung_jawab');
create type period_status as enum ('draft', 'berjalan', 'selesai');
create type audit_status as enum ('draft', 'assigned', 'in_progress', 'review', 'completed', 'archived');
create type assignment_status as enum ('not_started', 'in_progress', 'submitted', 'reviewed', 'closed');
create type verifikasi_status as enum ('draft', 'submitted', 'verified', 'rejected');
create type member_role as enum ('ketua', 'anggota', 'auditee');
create type risk_level as enum ('low', 'medium', 'high', 'critical');
create type severity_level as enum ('low', 'medium', 'high', 'critical');
create type tindak_lanjut_status as enum ('open', 'progress', 'closed');

-- 2. CREATE TABLE: OPD
create table public.opd (
    id uuid primary key default gen_random_uuid(),
    nama_opd text not null unique,
    alamat text,
    kontak text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. CREATE PROFILE TABLE: USERS (EXTENDED PROFILE FOR SUPABASE AUTH SCHEMA JOIN)
create table public.users (
    id uuid primary key references auth.users on delete cascade,
    nama text not null,
    email text unique not null,
    role user_role not null default 'auditee'::user_role,
    opd_id uuid references public.opd(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ADD FOREIGN KEY RELATIONSHIP AT TABLE public.opd FOR penanggung_jawab_id
alter table public.opd add column penanggung_jawab_id uuid references public.users(id) on delete set null;

-- 4. CREATE TABLE: AUDIT_PERIODE
create table public.audit_periode (
    id uuid primary key default gen_random_uuid(),
    tahun integer not null check (tahun >= 2000),
    nama_audit text not null,
    deskripsi text,
    status period_status not null default 'draft'::period_status,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. CREATE TABLE: AUDIT
create table public.audit (
    id uuid primary key default gen_random_uuid(),
    audit_periode_id uuid not null references public.audit_periode(id) on delete cascade,
    nama_audit text not null,
    status audit_status not null default 'draft'::audit_status,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. CREATE TABLE: AUDIT_ASSIGNMENT (CORE MULTI-OPD LAYER)
create table public.audit_assignment (
    id uuid primary key default gen_random_uuid(),
    audit_id uuid not null references public.audit(id) on delete cascade,
    opd_id uuid not null references public.opd(id) on delete cascade,
    status assignment_status not null default 'not_started'::assignment_status,
    total_skor numeric(5,2) not null default 0.00,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(audit_id, opd_id)
);

-- 7. CREATE TABLE: AUDIT_TIM
create table public.audit_tim (
    id uuid primary key default gen_random_uuid(),
    audit_id uuid not null references public.audit(id) on delete cascade,
    ketua_tim_id uuid references public.users(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. CREATE TABLE: AUDIT_TIM_MEMBER
create table public.audit_tim_member (
    id uuid primary key default gen_random_uuid(),
    audit_tim_id uuid not null references public.audit_tim(id) on delete cascade,
    user_id uuid not null references public.users(id) on delete cascade,
    role member_role not null default 'anggota'::member_role,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(audit_tim_id, user_id)
);

-- 9. CREATE TABLE: AUDIT_KATEGORI
create table public.audit_kategori (
    id uuid primary key default gen_random_uuid(),
    nama_kategori text not null,
    parent_id uuid references public.audit_kategori(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. CREATE TABLE: AUDIT_INDIKATOR
create table public.audit_indikator (
    id uuid primary key default gen_random_uuid(),
    kategori_id uuid not null references public.audit_kategori(id) on delete cascade,
    pertanyaan text not null,
    bobot numeric(5,2) not null default 1.00,
    standar_acuan text
);

-- 11. CREATE TABLE: AUDIT_JAWABAN (MULTI OPD SAFE)
create table public.audit_jawaban (
    id uuid primary key default gen_random_uuid(),
    audit_assignment_id uuid not null references public.audit_assignment(id) on delete cascade,
    indikator_id uuid not null references public.audit_indikator(id) on delete cascade,
    user_id uuid references public.users(id) on delete set null,
    opd_id uuid not null references public.opd(id) on delete cascade,
    jawaban text,
    skor numeric(5,2) not null default 0.00,
    status_verifikasi verifikasi_status not null default 'draft'::verifikasi_status,
    catatan_auditor text,
    evidence_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(audit_assignment_id, indikator_id, opd_id)
);

-- 12. CREATE TABLE: TEMUAN_AUDIT
create table public.temuan_audit (
    id uuid primary key default gen_random_uuid(),
    audit_assignment_id uuid not null references public.audit_assignment(id) on delete cascade,
    opd_id uuid not null references public.opd(id) on delete cascade,
    kategori_id uuid not null references public.audit_kategori(id) on delete cascade,
    deskripsi_temuan text not null,
    severity severity_level not null default 'medium'::severity_level,
    rekomendasi text,
    status_tindak_lanjut tindak_lanjut_status not null default 'open'::tindak_lanjut_status,
    pic_user_id uuid references public.users(id) on delete set null,
    target_selesai date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 13. CREATE TABLE: AUDIT_SCORE
create table public.audit_score (
    id uuid primary key default gen_random_uuid(),
    audit_assignment_id uuid not null references public.audit_assignment(id) on delete cascade,
    total_skor numeric(5,2) not null default 0.00,
    compliance_percentage numeric(5,2) not null default 0.00,
    risk_level risk_level not null default 'medium'::risk_level,
    calculated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(audit_assignment_id)
);

-- 14. CREATE TABLE: AUDIT_LAPORAN
create table public.audit_laporan (
    id uuid primary key default gen_random_uuid(),
    audit_assignment_id uuid not null references public.audit_assignment(id) on delete cascade,
    kesimpulan text,
    skor_akhir numeric(5,2) not null default 0.00,
    tingkat_keamanan text,
    rekomendasi_utama text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(audit_assignment_id)
);

-- ==========================================================
-- INDEX OPTIMIZATIONS FOR HIGH-SPEED LOOKUPS
-- ==========================================================
create index idx_users_opd on public.users(opd_id);
create index idx_assignment_lookup on public.audit_assignment(audit_id, opd_id);
create index idx_tim_member_lookup on public.audit_tim_member(audit_tim_id, user_id);
create index idx_jawab_assignment_indikator on public.audit_jawaban(audit_assignment_id, indikator_id);
create index idx_temuan_assignment_relation on public.temuan_audit(audit_assignment_id);
`;

  const rlsScriptCode = `-- ==========================================================
-- SATRIA v2: ROW LEVEL SECURITY & POLICY SCHEMAS
-- STRICTLY PREVENTS CROSS-OPD EXPOSURES (MULTI-OPD ISOLATIONS)
-- ==========================================================

-- Enable Row Level Security
alter table public.opd enable row level security;
alter table public.users enable row level security;
alter table public.audit_periode enable row level security;
alter table public.audit enable row level security;
alter table public.audit_assignment enable row level security;
alter table public.audit_tim enable row level security;
alter table public.audit_tim_member enable row level security;
alter table public.audit_kategori enable row level security;
alter table public.audit_indikator enable row level security;
alter table public.audit_jawaban enable row level security;
alter table public.temuan_audit enable row level security;
alter table public.audit_score enable row level security;
alter table public.audit_laporan enable row level security;

-- Setup Security Helpers
create or replace function public.get_auth_role()
returns user_role as $$
  select role from public.users where id = auth.uid();
$$ language sql security definer;

create or replace function public.get_auth_opd()
returns uuid as $$
  select opd_id from public.users where id = auth.uid();
$$ language sql security definer;

-- Helper to check if current authenticated user belongs to the audit's team
create or replace function public.is_user_on_audit_team(audit_id uuid)
returns boolean as $$
  select exists (
    select 1 
    from public.audit_tim t
    join public.audit_tim_member m on m.audit_tim_id = t.id
    where t.audit_id = $1 and m.user_id = auth.uid()
  );
$$ language sql security definer;

-- RLS RULES: OPD
create policy "Enable select for authenticated users" on public.opd
    for select using (auth.uid() is not null);

create policy "Enable all actions for admin users" on public.opd
    for all using (public.get_auth_role() = 'admin');

-- RLS RULES: USERS
create policy "Enable select user profile" on public.users
    for select using (auth.uid() is not null);

create policy "Enable update self profile" on public.users
    for update using (id = auth.uid());

create policy "Admin manages all roles" on public.users
    for all using (public.get_auth_role() = 'admin');

-- RLS RULES: AUDIT & PERIOD
create policy "Select for authenticated users on audit" on public.audit
    for select using (
        public.get_auth_role() in ('admin', 'ketua_auditor', 'anggota_auditor') or
        exists (
            select 1 
            from public.audit_assignment ass 
            where ass.audit_id = id and ass.opd_id = public.get_auth_opd()
        )
    );

create policy "Admin & Auditor manage audit" on public.audit
    for all using (public.get_auth_role() in ('admin', 'ketua_auditor'));

-- RLS RULES: AUDIT_ASSIGNMENT (ISOLASI MULTI-OPD)
create policy "Auditor and Admin see all assignments" on public.audit_assignment
    for select using (public.get_auth_role() in ('admin', 'ketua_auditor', 'anggota_auditor'));

create policy "Auditee see self assignment" on public.audit_assignment
    for select using (opd_id = public.get_auth_opd());

create policy "Auditee update status/total on self assignment" on public.audit_assignment
    for update using (opd_id = public.get_auth_opd());

create policy "Auditor and Admin manage assignments" on public.audit_assignment
    for all using (public.get_auth_role() in ('admin', 'ketua_auditor'));

-- RLS RULES: AUDIT_TIM & MEMBER
create policy "Select tim member if authenticated" on public.audit_tim_member for select using (auth.uid() is not null);
create policy "Auditor manage team" on public.audit_tim_member for all using (public.get_auth_role() in ('admin', 'ketua_auditor'));

create policy "Select tim if authenticated" on public.audit_tim for select using (auth.uid() is not null);
create policy "Auditor manage team parent" on public.audit_tim for all using (public.get_auth_role() in ('admin', 'ketua_auditor'));

-- RLS RULES: AUDIT_KATEGORI & INDIKATOR
create policy "Allow select master specifications" on public.audit_kategori for select using (auth.uid() is not null);
create policy "Manage categories by admin" on public.audit_kategori for all using (public.get_auth_role() = 'admin');

create policy "Allow select indicators" on public.audit_indikator for select using (auth.uid() is not null);
create policy "Manage indicators by admin" on public.audit_indikator for all using (public.get_auth_role() = 'admin');

-- RLS RULES: AUDIT_JAWABAN (EVALUASI CHECKLIST)
create policy "Auditors manage answers" on public.audit_jawaban
    for all using (
        public.get_auth_role() in ('admin', 'ketua_auditor', 'anggota_auditor')
    );

create policy "Auditees can view answers for their OPD" on public.audit_jawaban
    for select using (
        opd_id = public.get_auth_opd()
    );

create policy "Auditees can upload/update evidence to self answers" on public.audit_jawaban
    for update using (
        opd_id = public.get_auth_opd()
    );

-- RLS RULES: TEMUAN_AUDIT & TINDAK LANJUT
create policy "Auditors can manage all findings" on public.temuan_audit
    for all using (public.get_auth_role() in ('admin', 'ketua_auditor', 'anggota_auditor'));

create policy "Auditees and PIC can read their OPD's findings" on public.temuan_audit
    for select using (
        pic_user_id = auth.uid() or
        opd_id = public.get_auth_opd()
    );

create policy "Auditees can edit to update progress" on public.temuan_audit
    for update using (
        pic_user_id = auth.uid() or
        opd_id = public.get_auth_opd()
    );

-- RLS RULES: AUDIT_SCORE & LAPORAN
create policy "View scores and reports" on public.audit_score for select using (
    public.get_auth_role() in ('admin', 'ketua_auditor', 'anggota_auditor') or
    exists (
        select 1 
        from public.audit_assignment ass 
        where ass.id = audit_assignment_id and ass.opd_id = public.get_auth_opd()
    )
);

create policy "Manage scores" on public.audit_score for all using (public.get_auth_role() in ('admin', 'ketua_auditor'));

create policy "View reports" on public.audit_laporan for select using (
    public.get_auth_role() in ('admin', 'ketua_auditor', 'anggota_auditor') or
    exists (
        select 1 
        from public.audit_assignment ass 
        where ass.id = audit_assignment_id and ass.opd_id = public.get_auth_opd()
    )
);

create policy "Manage reports" on public.audit_laporan for all using (public.get_auth_role() in ('admin', 'ketua_auditor'));

-- AUTOMATIC AUTH PROFILE CREATION SYNC MECHANISM
create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public.users (id, nama, email, role, opd_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama', 'Pegawai Daerah'),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'auditee'::user_role),
    null
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();



-- =========================================================================================
-- ALTERNATIF TROUBLESHOOTING / BYPASS PERMISSION (SANGAT DIREKOMENDASIKAN UNTUK SYNC SEED DI AWAL)
-- JIKA ANDA MENGALAMI ERROR: "new row violates row-level security policy for table"
-- Jalankan query berikut di Supabase SQL Editor untuk MENONAKTIFKAN RLS pada tabel-tabel terkait:
-- =========================================================================================

-- ALTER TABLE public.opd DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.audit_periode DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.audit DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.audit_assignment DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.audit_tim DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.audit_tim_member DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.audit_kategori DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.audit_indikator DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.audit_jawaban DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.temuan_audit DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.audit_score DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.audit_laporan DISABLE ROW LEVEL SECURITY;

-- ATAU JIKA MAU MERILEKSKAN AKSES ANONIM (BILA INGIN RLS AKTIF TAPI SYNC CLIENT BISA MASUK):
-- CREATE POLICY "Allow anon insert on opd" ON public.opd FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow anon select on opd" ON public.opd FOR SELECT USING (true);
-- CREATE POLICY "Allow anon insert on audit_periode" ON public.audit_periode FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow anon select on audit_periode" ON public.audit_periode FOR SELECT USING (true);
-- CREATE POLICY "Allow anon insert on audit" ON public.audit FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow anon select on audit" ON public.audit FOR SELECT USING (true);
-- CREATE POLICY "Allow anon insert on audit_assignment" ON public.audit_assignment FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow anon select on audit_assignment" ON public.audit_assignment FOR SELECT USING (true);
-- CREATE POLICY "Allow anon insert on audit_kategori" ON public.audit_kategori FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow anon select on audit_kategori" ON public.audit_kategori FOR SELECT USING (true);
-- CREATE POLICY "Allow anon insert on audit_indikator" ON public.audit_indikator FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow anon select on audit_indikator" ON public.audit_indikator FOR SELECT USING (true);
-- CREATE POLICY "Allow anon insert on audit_jawaban" ON public.audit_jawaban FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow anon select on audit_jawaban" ON public.audit_jawaban FOR SELECT USING (true);
-- CREATE POLICY "Allow anon insert on temuan_audit" ON public.temuan_audit FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow anon select on temuan_audit" ON public.temuan_audit FOR SELECT USING (true);
`;

  // Handle copy text action
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Save Supabase config when changed
  useEffect(() => {
    localStorage.setItem('satria_supabase_url', supabaseUrl);
    localStorage.setItem('satria_supabase_key', supabaseAnonKey);
  }, [supabaseUrl, supabaseAnonKey]);

  // Test live connection directly
  const testConnection = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      setErrorMessage('Isi link Supabase URL dan Anon Key terlebih dahulu.');
      setConnectionStatus('failed');
      return;
    }

    setConnectionStatus('testing');
    setErrorMessage('');

    try {
      // Connect client
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }
      });

      // Try fetching a quick count on OPD to verify connection and key privileges
      const { data, count, error } = await supabase
        .from('opd')
        .select('*', { count: 'exact', head: true });

      if (error) {
        // If the table doesn't exist, it still means we CONNECTED, but schema is missing
        if (error.code === 'PGRST116' || error.message.includes('not found') || error.message.includes('relation "public.opd" does not exist')) {
          setConnectionStatus('success');
          setErrorMessage('Koneksi TERHUBUNG, namun tabel public.opd belum dideploy di database Supabase Anda. Selesaikan migrasi SQL terlebih dahulu.');
          setLiveCounts({
            opd: 0,
            users: 0,
            audit_periode: 0,
            audit_indikator: 0,
            temuan_audit: 0,
          });
          return;
        }
        throw error;
      }

      // Success fetching!
      setConnectionStatus('success');
      
      // Let's do parallel count checks for key tables to update counts
      const tables = ['opd', 'users', 'audit_periode', 'audit_indikator', 'temuan_audit'];
      const counts: { [key: string]: number | null } = {};
      
      for (const table of tables) {
        const { count: c } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        counts[table] = c !== null ? c : 0;
      }
      setLiveCounts(counts);

    } catch (err: any) {
      console.error(err);
      setConnectionStatus('failed');
      setErrorMessage(err.message || 'Koneksi gagal. Cek URL, Kunci, atau konfig CORS database Supabase Anda.');
    }
  };

  // Perform dynamic synchronizer or generate SQL insert seeds
  const handleExportStateSeed = () => {
    // Generate checklist seeding SQL
    let seedSql = `-- ==========================================
-- SATRIA SEEDING SCRIPT: DATA INISIAL CHECKLIST & TEMUAN
-- ==========================================\n\n`;

    seedSql += `-- 1. SEEDING DAFTAR KATEGORI & INDIKATOR AUDIT SPBE (${checklist.length} Indikator)\n`;
    seedSql += `INSERT INTO public.audit_kategori (id, nama_kategori, parent_id) \nVALUES ('c9dfb83b-fb8a-4416-8db8-1e434f0e74b1', 'Standard Tata Kelola Keamanan SPBE Pemda', NULL) ON CONFLICT DO NOTHING;\n\n`;

    checklist.forEach((item, index) => {
      const q = item.kriteria.replace(/'/g, "''");
      const acuan = item.pasal.replace(/'/g, "''");
      const indId = `00000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`;
      
      seedSql += `INSERT INTO public.audit_indikator (id, kategori_id, pertanyaan, bobot, standar_acuan) 
VALUES ('${indId}', 'c9dfb83b-fb8a-4416-8db8-1e434f0e74b1', '${q}', 1.00, '${acuan}') ON CONFLICT DO NOTHING;\n`;
    });

    seedSql += `\n-- 2. SEEDING TEMUAN AUDIT YANG AKTIF DI UI (${findings.length} Temuan)\n`;
    findings.forEach(item => {
      const desc = item.deskripsi.replace(/'/g, "''");
      const rec = item.rekomendasi.replace(/'/g, "''");
      const sev = item.severity.toLowerCase();
      const status = item.statusTindakLanjut === 'Open' ? 'open' : item.statusTindakLanjut === 'In Progress' ? 'progress' : 'closed';
      
      seedSql += `INSERT INTO public.temuan_audit (id, audit_assignment_id, opd_id, kategori_id, deskripsi_temuan, severity, rekomendasi, status_tindak_lanjut, pic_user_id, target_selesai) 
VALUES (gen_random_uuid(), 'MASUKKAN_ID_ASSIGNMENT_YANG_SESUAI', 'MASUKKAN_ID_OPD_YANG_SESUAI', 'c9dfb83b-fb8a-4416-8db8-1e434f0e74b1', '${desc}', '${sev}', '${rec}', '${status}', NULL, '${item.targetSelesai}'::date);\n`;
    });

    const fileBlob = new Blob([seedSql], { type: 'text/sql' });
    const fileUrl = URL.createObjectURL(fileBlob);
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `satria_seeds_${identity.opd.toLowerCase().replace(/\s+/g, '_')}.sql`;
    link.click();
    URL.revokeObjectURL(fileUrl);
  };

  // Perform dynamic real-time upload simulation or direct data initialization for the testing user
  const handlePushChecksToLiveDb = async () => {
    if (connectionStatus !== 'success' || !supabaseUrl || !supabaseAnonKey) return;
    setIsSyncing(true);
    setSyncLogs(['Inisialisasi Sinkronisasi...', 'Mendeteksi sisa tabel...']);

    const addLog = (log: string) => setSyncLogs(p => [...p, log]);

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }
      });

      // 1. Create OPD entry if empty
      const cleanOpdName = identity.opd || "OPD Purbalingga";

      addLog(`Mengecek eksistensi OPD: "${cleanOpdName}"`);
      
      // Select or insert OPD
      let opdId = '';
      const { data: oData, error: oError } = await supabase
        .from('opd')
        .select('id')
        .eq('nama_opd', cleanOpdName)
        .maybeSingle();

      if (oError) throw oError;

      if (oData) {
        opdId = oData.id;
        addLog(`OPD ditemukan dengan ID: ${opdId}`);
      } else {
        addLog(`OPD belum terdaftar. Mendaftarkan OPD baru...`);
        const { data: newOpd, error: newOpdErr } = await supabase
          .from('opd')
          .insert({
            nama_opd: cleanOpdName,
            alamat: 'Jl. Pemuda No. 1, Kab. Purbalingga',
            penanggung_jawab_id: null,
            kontak: 'Diskominfo Pemda'
          })
          .select('id')
          .single();

        if (newOpdErr) throw newOpdErr;
        opdId = newOpd.id;
        addLog(`OPD Sukses didaftarkan dengan ID: ${opdId}`);
      }

      // 2. Create Audit Periode
      addLog('Mencari atau Membuat Periode Audit Tahun 2026...');
      let apId = '';
      const { data: apData, error: apErr } = await supabase
        .from('audit_periode')
        .select('id')
        .eq('tahun', 2026)
        .eq('nama_audit', 'Audit SPBE Kabupaten Purbalingga')
        .maybeSingle();

      if (apErr) throw apErr;

      if (apData) {
        apId = apData.id;
        addLog(`Periode Audit ditemukan: ${apId}`);
      } else {
        const { data: newAp, error: newApErr } = await supabase
          .from('audit_periode')
          .insert({
            tahun: 2026,
            nama_audit: 'Audit SPBE Kabupaten Purbalingga',
            deskripsi: 'Evaluasi Penilaian Tingkat Keamanan Informasi Pemerintah Daerah',
            status: 'berjalan'
          })
          .select('id')
          .single();
        if (newApErr) throw newApErr;
        apId = newAp.id;
        addLog(`Periode Audit baru berhasil dibuat: ${apId}`);
      }

      // 3. Create Audit (No opd_id in audit v2 schema!)
      addLog('Mendaftarkan Sesi Evaluasi Utama...');
      let auditId = '';
      const { data: newAudit, error: newAuditErr } = await supabase
        .from('audit')
        .insert({
          audit_periode_id: apId,
          nama_audit: 'Evaluasi SATRIA Keamanan SPBE ' + cleanOpdName,
          status: 'in_progress'
        })
        .select('id')
        .single();

      if (newAuditErr) {
        addLog('Peringatan: Gagal membuat entri audit penugasan. Periksa relasi foreign key dari database.');
        throw newAuditErr;
      }
      auditId = newAudit.id;
      addLog(`Evaluasi Sesi SATRIA Aktif ID: ${auditId}`);

      // 4. Create Audit Assignment
      addLog(`Membuat Assignment Penugasan Multi-OPD untuk ${cleanOpdName}...`);
      let assignmentId = '';
      const { data: newAss, error: newAssErr } = await supabase
        .from('audit_assignment')
        .insert({
          audit_id: auditId,
          opd_id: opdId,
          status: 'in_progress',
          total_skor: 0.00
        })
        .select('id')
        .single();
      
      if (newAssErr) throw newAssErr;
      assignmentId = newAss.id;
      addLog(`Penugasan terdaftar dengan ID Assignment: ${assignmentId}`);

      // 5. Create Audit Kategori
      addLog('Mencari atau Membuat Master Kategori Audit...');
      let katId = '';
      const { data: katData, error: katErr } = await supabase
        .from('audit_kategori')
        .select('id')
        .eq('nama_kategori', 'Standar Keamanan Informasi')
        .maybeSingle();
      
      if (katErr) throw katErr;
      if (katData) {
        katId = katData.id;
      } else {
        const { data: newKat, error: newKatErr } = await supabase
          .from('audit_kategori')
          .insert({
            nama_kategori: 'Standar Keamanan Informasi',
            parent_id: null
          })
          .select('id')
          .single();
        if (newKatErr) throw newKatErr;
        katId = newKat.id;
      }
      addLog(`Kategori Audit teridentifikasi: ${katId}`);

      // 6. Seeding Checklists
      addLog(`Menyiapkan inisialisasi master data standard & jawaban (${checklist.length} checklist...)`);
      
      const unikIndikatorMap = checklist.slice(0, 15).map(item => ({
        kategori_id: katId,
        pertanyaan: item.kriteria,
        bobot: 1.00,
        standar_acuan: item.pasal
      }));

      addLog(`Mengunggah 15 Indikator acuan utama ke PostgreSQL...`);
      const { data: insertedInds, error: indErr } = await supabase
        .from('audit_indikator')
        .insert(unikIndikatorMap)
        .select('id, pertanyaan');

      if (indErr) throw indErr;
      addLog(`Sukses mengunggah master indikator.`);

      // Create answers mapping
      if (insertedInds && insertedInds.length > 0) {
        addLog('Memetakan relasi jawaban...');
        const jawabanToInsert = insertedInds.map((ind: any, index) => {
          const original = checklist[index];
          return {
            audit_assignment_id: assignmentId,
            indikator_id: ind.id,
            user_id: null,
            opd_id: opdId,
            jawaban: original.kesimpulanAudit,
            skor: original.kesimpulanAudit === 'Memadai' ? 3.00 : original.kesimpulanAudit === 'Perlu Peningkatan' ? 1.50 : 0.00,
            status_verifikasi: 'draft',
            catatan_auditor: original.catatanAuditor,
            evidence_url: original.evidenceName
          };
        });

        const { error: ansErr } = await supabase
          .from('audit_jawaban')
          .insert(jawabanToInsert);

        if (ansErr) throw ansErr;
        addLog('Mengaitkan 15 draf lembar jawaban OPD berhasil terhubung!');
      }

      // 7. Upload Findings
      addLog(`Memroses pengunggahan ${findings.length} Data Temuan Kerja yang tercatat...`);
      const findingsToInsert = findings.map(f => ({
        audit_assignment_id: assignmentId,
        opd_id: opdId,
        kategori_id: katId,
        deskripsi_temuan: f.deskripsi,
        severity: f.severity.toLowerCase() as any,
        rekomendasi: f.rekomendasi,
        status_tindak_lanjut: (f.statusTindakLanjut === 'Open' ? 'open' : f.statusTindakLanjut === 'In Progress' ? 'progress' : 'closed') as any,
        pic_user_id: null,
        target_selesai: f.targetSelesai
      }));

      const { error: fErr } = await supabase
        .from('temuan_audit')
        .insert(findingsToInsert);

      if (fErr) throw fErr;
      addLog('Siklus data Rencana Tindak Lanjut Terdaftar!');

      addLog('==== SINKRONISASI SUKSES PENUH ====');
      addLog('Semua representasi data SATRIA v2 kini sinkron di database Supabase.');
      
      // Update count list
      testConnection();

    } catch (pushErr: any) {
      console.error(pushErr);
      const errMsg = pushErr.message || 'Kegagalan validasi schema';
      addLog(`Fatal Error: ${errMsg}`);
      if (errMsg.toLowerCase().includes('row-level security') || errMsg.toLowerCase().includes('rls') || errMsg.toLowerCase().includes('violates row-level security')) {
        addLog('💡 TIPS SOLUSI RLS:');
        addLog('Error ini terjadi karena Row Level Security (RLS) aktif pada database Supabase Anda, tetapi tidak mengizinkan penulisan anonim (unauthenticated).');
        addLog('Silakan jalankan perintah SQL berikut di Supabase SQL Editor Anda untuk menonaktifkan RLS sementara agar uji sinkronisasi dari browser dapat berjalan aman:');
        addLog('ALTER TABLE public.opd DISABLE ROW LEVEL SECURITY;');
        addLog('ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;');
        addLog('ALTER TABLE public.audit_periode DISABLE ROW LEVEL SECURITY;');
        addLog('ALTER TABLE public.audit DISABLE ROW LEVEL SECURITY;');
        addLog('ALTER TABLE public.audit_assignment DISABLE ROW LEVEL SECURITY;');
        addLog('ALTER TABLE public.audit_tim DISABLE ROW LEVEL SECURITY;');
        addLog('ALTER TABLE public.audit_tim_member DISABLE ROW LEVEL SECURITY;');
        addLog('ALTER TABLE public.audit_kategori DISABLE ROW LEVEL SECURITY;');
        addLog('ALTER TABLE public.audit_indikator DISABLE ROW LEVEL SECURITY;');
        addLog('ALTER TABLE public.audit_jawaban DISABLE ROW LEVEL SECURITY;');
        addLog('ALTER TABLE public.temuan_audit DISABLE ROW LEVEL SECURITY;');
        addLog('ALTER TABLE public.audit_score DISABLE ROW LEVEL SECURITY;');
        addLog('ALTER TABLE public.audit_laporan DISABLE ROW LEVEL SECURITY;');
        addLog('Atau beralihlah ke tab "Kebijakan Keamanan & RLS" jika ingin membuat kebijakan (policies) yang lebih longgar bagi pengguna anonim.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div id="database-tab-root" className="space-y-6 animate-fade-in text-xs">
      
      {/* Intro descriptive card */}
      <div id="database-header-banner" className={`p-6 rounded-2xl border ${
        darkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database className="w-6 h-6 text-[#38bdf8]" />
              <h2 className="text-xl font-bold tracking-tight text-white dark:text-[#f8fafc] flex items-center gap-2">
                SATRIA Database Center
                <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-full font-mono border border-sky-400/20">
                  SUPABASE POSTGRESQL Ready
                </span>
              </h2>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Sistem database relasional SATRIA dirancang presisi untuk mengelola data audit keamanan siber instansi, multi-OPD tenant separation, 
              kristalisasi temuan, prioritas tindak lanjut (PIC), draf indikator SPBE, heatmap risiko, hingga cetak laporan formal.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href="https://supabase.com" 
              target="_blank" 
              rel="prefetch referrer" 
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition hover:bg-slate-800 ${
                darkMode ? 'border-[#334155] text-slate-300' : 'border-slate-200 text-slate-700'
              }`}
            >
              Supabase Cloud <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Database internal subtabs */}
        <div id="db-panel-tabs" className="flex items-center gap-2 mt-6 border-t border-slate-700 pt-4">
          <button
            type="button"
            onClick={() => setDbSubTab('schema')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              dbSubTab === 'schema' 
                ? 'bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Skema Migrasi SQL
          </button>

          <button
            type="button"
            onClick={() => setDbSubTab('rls')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              dbSubTab === 'rls' 
                ? 'bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Kebijakan Keamanan & RLS
          </button>

          <button
            type="button"
            onClick={() => setDbSubTab('integrasi')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              dbSubTab === 'integrasi' 
                ? 'bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Live Sync & Pengujian
          </button>
        </div>
      </div>

      {/* Main Panel Content depending on SubTab select */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* SubTab Views (Col span 3) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* TAB 1: Migrations SQL */}
          {dbSubTab === 'schema' && (
            <div className={`p-6 rounded-2xl border flex flex-col space-y-4 ${
              darkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">Script Skema DDL Postgres</h3>
                  <p className="text-[10px] text-slate-400">Jalankan di Supabase SQL Editor untuk membangun struktur instansi.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(sqlSchemaCode)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-500/10 text-[#38bdf8] border border-sky-400/20 hover:bg-sky-500/20 font-bold transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Tersalin' : 'Salin SQL'}
                </button>
              </div>

              {/* DDL Code Box */}
              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-850 text-slate-300 font-mono text-[10px] overflow-x-auto overflow-y-auto max-h-96 leading-relaxed">
                  {sqlSchemaCode}
                </pre>
              </div>

              {/* Seeding guide */}
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-850 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-slate-300">Bagaimana Cara Inisialisasi SQL di Supabase?</p>
                  <ul className="list-decimal pl-4 space-y-1 text-slate-400 text-[11px]">
                    <li>Login ke dashboard <a href="https://supabase.com" target="_blank" className="text-[#38bdf8] underline">Supabase</a> web portal.</li>
                    <li>Buka menu <strong>"SQL Editor"</strong> pada bilah sisi kiri dashboard proyek baru Anda.</li>
                    <li>Tekan tombol <strong>"+ New Query"</strong> untuk membuat lembar kosong baru.</li>
                    <li><em>Paste</em> seluruh kode skema di atas ke dalam editor, lalu jalankan/run!</li>
                    <li>Skema relasi, Enum kustom, kunci foreign UUID, dan indeks performansi akan otomatis terbentuk dan siap digunakan.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Row Level Security (RLS) */}
          {dbSubTab === 'rls' && (
            <div className={`p-6 rounded-2xl border flex flex-col space-y-6 ${
              darkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">Row Level Security (RLS) & Multi-OPD</h3>
                  <p className="text-[10px] text-slate-400">Pengamanan akses data multitenant secara database-level.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(rlsScriptCode)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-500/10 text-[#38bdf8] border border-sky-400/20 hover:bg-sky-500/20 font-bold transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Tersalin' : 'Salin RLS'}
                </button>
              </div>

              {/* Detailed Explanation on Role Matrices */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-xs text-[#38bdf8] uppercase">Matriks Akses Berbasis Role (RBAC)</h4>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Keamanan data siber tidak hanya dikontrol pada logic client, melainkan di-enforce langsung di PostgreSQL Supabase:
                  </p>
                  <ul className="space-y-1.5 pl-4 list-disc text-slate-300 text-[11px]">
                    <li><strong>Admin:</strong> Memiliki akses penuh (all CRUD) untuk seluruh OPD dan master indikator.</li>
                    <li><strong>Ketua & Anggota Auditor:</strong> Menilai sebaran checklist, meregistrasi temuan baru, dan membuat draft rekomendasi formal.</li>
                    <li><strong>Auditee / OPD:</strong> Hanya bisa melihat (SELECT) instrumen audit instansinya sendiri, dan didesain diizinkan mengunggah dokumen evidence pelengkap.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-xs text-emerald-400 uppercase">Isolasi Multi-OPD (Tenant Isolation)</h4>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Dengan mengaitkan kolom <code>opd_id</code> pada profil users dan tabel audits:
                  </p>
                  <pre className="p-2 rounded-lg bg-slate-950 font-mono text-[9px] text-[#3dffd2]">
                    {`USING (opd_id = public.get_auth_opd())`}
                  </pre>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Sistem otomatis memisahkan data tanpa khawatir ada OPD lain yang dapat membaca atau membocorkan draf temuan siber OPD Purbalingga lainnya.
                  </p>
                </div>

              </div>

              {/* Code display of RLS Script */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-400 uppercase text-[10px]">Polisi RLS SQL:</span>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-850 text-slate-300 font-mono text-[9px] overflow-x-auto max-h-60 leading-relaxed">
                  {rlsScriptCode}
                </pre>
              </div>

            </div>
          )}

          {/* TAB 3: LIVE SYNC & TESTING */}
          {dbSubTab === 'integrasi' && (
            <div className={`p-6 rounded-2xl border flex flex-col space-y-6 ${
              darkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-slate-200'
            }`}>
              <div>
                <h3 className="font-bold text-sm text-white">Hubungkan SATRIA dengan Database Supabase Anda</h3>
                <p className="text-[10px] text-slate-400">Gunakan form pengujian ini untuk mencoba interoperabilitas secara real-time langsung ke cloud.</p>
              </div>

              {/* Config Form fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Supabase API URL</label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="Contoh: https://xomyr6efgyewnliiw2i.supabase.co"
                    className="px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white outline-none focus:border-[#38bdf8]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Supabase ANON KEY</label>
                  <input
                    type="password"
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey..."
                    className="px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white outline-none focus:border-[#38bdf8]"
                  />
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={testConnection}
                  disabled={connectionStatus === 'testing'}
                  className="px-4 py-2 text-xs font-bold bg-[#38bdf8] text-slate-950 hover:bg-sky-400 rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4 text-slate-950 fill-slate-950" />
                  {connectionStatus === 'testing' ? 'Menghubungkan...' : 'Pengujian Koneksi Database'}
                </button>

                <button
                  type="button"
                  onClick={handleExportStateSeed}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Unduh File Seed (.SQL)
                </button>
              </div>

              {/* Error or Success notification box */}
              {connectionStatus === 'success' && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="font-bold">Sukses Terkoneksi!</p>
                      <p className="text-[10px] text-emerald-500/80">Aplikasi SATRIA mendeteksi pangkalan data Supabase berfungsi dengan normal.</p>
                    </div>
                  </div>

                  {/* Seed state button shown only if connection is successful */}
                  <div className="border-t border-emerald-500/10 pt-3 space-y-2">
                    <p className="text-[11px] text-slate-300">
                      Anda dapat melakukan <strong>Direct Push</strong> secara real-time untuk memigrasikan data checklist ({checklist.length} butir) 
                      dan data evaluasi temuan ({findings.length} temuan) dari aplikasi visual ini langsung ke database Supabase yang Anda hubungkan!
                    </p>
                    <button
                      type="button"
                      disabled={isSyncing}
                      onClick={handlePushChecksToLiveDb}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-400 text-slate-950 font-bold text-[11px] hover:bg-emerald-300 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <UploadCloud className="w-4 h-4" />
                      {isSyncing ? 'Sedang Sinkronisasi...' : 'Unggah Data Saat Ini ke Supabase'}
                    </button>
                  </div>
                </div>
              )}

              {connectionStatus === 'failed' && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">Koneksi Gagal / Perlu Konfigurasi</span>
                    <p className="text-slate-300 text-[10px] mt-1 pr-4">
                      {errorMessage || "Supabase URL atau Anon Key tidak valid. Pastikan Anda telah men-deploy silsilah Tabel di PostgreSQL terlebih dahulu."}
                    </p>
                  </div>
                </div>
              )}

              {/* Sync Logs */}
              {syncLogs.length > 0 && (
                <div className="space-y-1">
                  <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    Log Sinkronisasi Transaksi Database:
                  </span>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-900 font-mono text-[9px] text-sky-300 space-y-1 h-32 overflow-y-auto">
                    {syncLogs.map((log, idx) => (
                      <div key={idx} className={log.includes('Gagal') ? 'text-rose-400' : log.includes('SUKSES') ? 'text-emerald-400 font-bold' : ''}>
                        &gt; {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Database Status Side widgets (Col span 1) */}
        <div className="space-y-6">
          
          {/* OPD & Auditor context widget */}
          <div className={`p-5 rounded-2xl border ${
            darkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-slate-200'
          }`}>
            <h4 className="font-bold text-xs uppercase tracking-wide text-emerald-500 mb-4 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#38bdf8]" />
              Identitas Klien (Target)
            </h4>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">OPD Auditee:</span>
                <p className="font-semibold text-slate-200">{identity.opd}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Website Target:</span>
                <p className="font-semibold text-slate-200 truncate" title={identity.domainUrl}>{identity.domainUrl}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Ketua Tim Auditor:</span>
                <p className="font-semibold text-slate-200">{identity.ketuaTimAuditor}</p>
              </div>

              <div className="border-t border-slate-700 pt-3">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Estimasi Penugasan:</span>
                <span className="text-xl font-extrabold text-[#38bdf8] mr-1">{identity.jumlahHariEstimasi}</span>
                <span className="text-xs text-slate-300">Hari Kerja</span>
              </div>
            </div>
          </div>

          {/* Database Live Stats */}
          <div className={`p-5 rounded-2xl border ${
            darkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-slate-200'
          }`}>
            <h4 className="font-bold text-xs uppercase tracking-wide text-emerald-500 mb-4 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#38bdf8]" />
              Status Tabel Supabase
            </h4>

            <div className="space-y-3 text-[11px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Tabel 1: <code>opd</code></span>
                <span className={`font-mono font-bold ${liveCounts.opd !== null ? 'text-green-400' : 'text-slate-500'}`}>
                  {liveCounts.opd !== null ? `${liveCounts.opd} baris` : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Tabel 2: <code>users</code></span>
                <span className={`font-mono font-bold ${liveCounts.users !== null ? 'text-green-400' : 'text-slate-500'}`}>
                  {liveCounts.users !== null ? `${liveCounts.users} baris` : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Tabel 3: <code>audit_periode</code></span>
                <span className={`font-mono font-bold ${liveCounts.audit_periode !== null ? 'text-green-400' : 'text-slate-500'}`}>
                  {liveCounts.audit_periode !== null ? `${liveCounts.audit_periode} baris` : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Tabel 4: <code>audit_indikator</code></span>
                <span className={`font-mono font-bold ${liveCounts.audit_indikator !== null ? 'text-green-400' : 'text-slate-500'}`}>
                  {liveCounts.audit_indikator !== null ? `${liveCounts.audit_indikator} baris` : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between pb-1">
                <span className="text-slate-400">Tabel 5: <code>temuan_audit</code></span>
                <span className={`font-mono font-bold ${liveCounts.temuan_audit !== null ? 'text-green-400' : 'text-slate-500'}`}>
                  {liveCounts.temuan_audit !== null ? `${liveCounts.temuan_audit} baris` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
