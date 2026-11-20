import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import api, { openBlob, downloadPdf, viewPdf } from './api';

const Ctx = createContext();
const useAuth = () => useContext(Ctx);

const ST = {
  submitted: 'Diajukan',
  under_review: 'Sedang diperiksa',
  revision_required: 'Perlu revisi',
  pending_approval: 'Menunggu Lurah',
  rejected: 'Ditolak',
  approved: 'Disetujui',
  issued: 'Terbit',
};

const COL = {
  submitted: 'bg-slate-100 text-slate-700 border border-slate-200',
  under_review: 'bg-sky-50 text-sky-700 border border-sky-200',
  revision_required: 'bg-amber-50 text-amber-800 border border-amber-200',
  pending_approval: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  rejected: 'bg-rose-50 text-rose-700 border border-rose-200',
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  issued: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold',
};

const ST_WARGA = {
  menunggu_verifikasi: 'Menunggu Verifikasi',
  terverifikasi: 'Terverifikasi',
  ditolak: 'Verifikasi Ditolak',
};

const COL_WARGA = {
  menunggu_verifikasi: 'bg-amber-50 text-amber-800 border border-amber-200',
  terverifikasi: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  ditolak: 'bg-rose-50 text-rose-700 border border-rose-200',
};

const MENU = {
  warga: [
    ['/app', 'Beranda'],
    ['/app/ajukan', 'Ajukan Surat'],
    ['/app/pengajuan', 'Pengajuan Saya'],
    ['/app/surat', 'Surat Saya'],
    ['/app/profil', 'Profil Kependudukan'],
  ],
  petugas: [
    ['/app', 'Beranda'],
    ['/app/verifikasi-warga', 'Verifikasi Warga'],
    ['/app/pengajuan', 'Pemeriksaan Surat Warga'],
    ['/app/surat-masuk', 'Surat Masuk & Disposisi'],
    ['/app/surat-keluar', 'Surat Keluar & Balasan'],
    ['/app/arsip', 'Arsip Surat Warga'],
  ],
  lurah: [
    ['/app', 'Beranda'],
    ['/app/pengajuan', 'Persetujuan Surat Warga'],
    ['/app/surat-keluar', 'Surat Keluar (Buat Surat)'],
    ['/app/surat-masuk', 'Disposisi Surat Masuk'],
    ['/app/arsip', 'Arsip Surat Warga'],
  ],
  admin: [
    ['/app', 'Beranda'],
    ['/app/verifikasi-warga', 'Verifikasi Warga'],
    ['/app/pengajuan', 'Pengajuan Surat Warga'],
    ['/app/surat-masuk', 'Surat Masuk & Disposisi'],
    ['/app/surat-keluar', 'Surat Keluar & Balasan'],
    ['/app/arsip', 'Arsip Surat Warga'],
    ['/app/pengguna', 'Manajemen Pengguna'],
    ['/app/jenis', 'Jenis Surat'],
    ['/app/log', 'Audit Log Aktivitas'],
  ],
};

const em = (e) => e.response?.data?.message || 'Terjadi kesalahan pada sistem, coba lagi.';
const tg = (d) => {
  if (!d) return '-';
  const dt = new Date(typeof d === 'string' ? d.replace(' ', 'T') : d);
  return isNaN(dt.getTime()) ? '-' : dt.toLocaleString('id-ID');
};

const maskId = (str) => {
  if (!str || str.length < 16) return str || '-';
  return str.slice(0, 6) + '******' + str.slice(12);
};

function getPasswordStrength(p) {
  if (!p) return { score: 0, label: '', color: 'bg-slate-200', text: 'text-slate-400', width: '0%' };
  let score = 0;
  if (p.length >= 8) score += 1;
  if (p.length >= 10) score += 1;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score += 1;
  if (/\d/.test(p)) score += 1;
  if (/[^A-Za-z0-9]/.test(p)) score += 1;

  if (score <= 2) return { score: 1, label: 'Lemah', color: 'bg-red-500', text: 'text-red-600', width: '33%' };
  if (score <= 4) return { score: 2, label: 'Sedang', color: 'bg-amber-500', text: 'text-amber-600', width: '66%' };
  return { score: 3, label: 'Kuat (Aman)', color: 'bg-emerald-500', text: 'text-emerald-600', width: '100%' };
}


function Icon({ name, className = 'w-4 h-4' }) {
  switch (name) {
    case 'home':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
    case 'file':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    case 'download':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
    case 'eye':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
    case 'check':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
    case 'shield':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
    case 'inbox':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>;
    case 'send':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
    case 'user':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
    case 'building':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
    case 'alert':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
    case 'lock':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
    case 'logout':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
    case 'clock':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    default:
      return null;
  }
}

const Badge = ({ s }) => (
  <span className={'badge ' + (COL[s] || 'bg-slate-100 text-slate-700')}>
    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70"></span>
    {ST[s] || s}
  </span>
);

const BadgeWarga = ({ s }) => (
  <span className={'badge ' + (COL_WARGA[s] || 'bg-slate-100 text-slate-700')}>
    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70"></span>
    {ST_WARGA[s] || s}
  </span>
);

const Card = ({ title, subtitle, children, rightAction, className = '' }) => (
  <div className={`card ${className}`}>
    {(title || rightAction) && (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          {title && <h2 className="text-base font-bold text-slate-900 tracking-tight sm:text-lg">{title}</h2>}
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {rightAction && <div className="flex items-center gap-2">{rightAction}</div>}
      </div>
    )}
    {children}
  </div>
);

const Field = ({ l, req, err, hint, children }) => (
  <label className="mb-3.5 block">
    <span className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-600">
      <span>
        {l} {req && <span className="text-rose-500">*</span>}
      </span>
      {err && <span className="font-normal normal-case text-rose-500 text-[11px]">{err}</span>}
    </span>
    <div>{children}</div>
    {hint && !err && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
  </label>
);

const Msg = ({ m }) =>
  m ? (
    <div
      className={
        'mb-4 flex items-start gap-2.5 rounded-xl border p-3.5 text-sm ' +
        (m.ok
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
          : 'border-rose-200 bg-rose-50 text-rose-800')
      }
    >
      <span className="font-bold">{m.ok ? '✓' : '!'}</span>
      <span className="leading-snug">{m.t}</span>
    </div>
  ) : null;

const Table = ({ head, rows }) => (
  <div className="w-full overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {head.map((h, i) => (
              <th key={i} className="px-4 py-3 font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length ? (
            rows.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                {r.map((c, j) => (
                  <td key={j} className="px-4 py-3.5 text-slate-700 align-middle">
                    {c}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-10 text-center text-slate-400" colSpan={head.length}>
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <Icon name="file" className="w-8 h-8 text-slate-300" />
                  <span className="text-xs font-medium">Belum ada data tersedia.</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

function useGet(url) {
  const [d, setD] = useState(null);
  const load = useCallback(() => api.get(url).then((r) => setD(r.data)).catch(() => setD([])), [url]);
  useEffect(() => {
    load();
  }, [load]);
  return [d, load];
}

function Provider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const login = (t, u) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };
  const updateUser = (patch) => {
    setUser((prev) => {
      const updated = { ...prev, ...patch };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };
  const logout = () => {
    localStorage.clear();
    setUser(null);
  };
  return <Ctx.Provider value={{ user, login, logout, updateUser }}>{children}</Ctx.Provider>;
}

/* ====================================================================
   HALAMAN PUBLIK: LANDING, LOGIN, REGISTER, VERIFIKASI QR
   ==================================================================== */

const LAYANAN_LIST = [
  { kode: 'SKD', nama: 'Surat Keterangan Domisili', desc: 'Menerangkan alamat tempat tinggal resmi warga di wilayah Sukamaju.', syarat: 'KTP, Kartu Keluarga, Pengantar RT/RW', tag: 'bg-blue-50 text-brand-700 border-blue-200' },
  { kode: 'SKTM', nama: 'Surat Keterangan Tidak Mampu', desc: 'Rekomendasi bantuan sosial, KIP/beasiswa, dan keringanan biaya.', syarat: 'KTP, Kartu Keluarga, Pernyataan Penghasilan', tag: 'bg-blue-50 text-brand-700 border-blue-200' },
  { kode: 'SKU', nama: 'Surat Keterangan Usaha', desc: 'Keterangan izin usaha mikro warga untuk pengajuan legalitas/kredit.', syarat: 'KTP, KK, Foto Usaha', tag: 'bg-blue-50 text-brand-700 border-blue-200' },
  { kode: 'SKCK', nama: 'Pengantar SKCK Kepolisian', desc: 'Surat pengantar permohonan SKCK di Polsek / Polres setempat.', syarat: 'KTP, Kartu Keluarga, Pas Foto', tag: 'bg-blue-50 text-brand-700 border-blue-200' },
  { kode: 'SKBM', nama: 'Surat Keterangan Belum Menikah', desc: 'Keterangan status perkawinan lajang untuk keperluan kerja / KPR.', syarat: 'KTP, KK, Surat Pernyataan Belum Menikah', tag: 'bg-blue-50 text-brand-700 border-blue-200' },
  { kode: 'SKLH', nama: 'Surat Keterangan Kelahiran', desc: 'Keterangan pengantar pencatatan kelahiran anak di Disdukcapil.', syarat: 'KTP Orang Tua, KK, Surat Bidan/RS', tag: 'bg-blue-50 text-brand-700 border-blue-200' },
  { kode: 'SKM', nama: 'Surat Keterangan Kematian', desc: 'Keterangan pencatatan kematian warga untuk pemakaman & taspen.', syarat: 'KTP Almarhum, KTP Pelapor, KK', tag: 'bg-blue-50 text-brand-700 border-blue-200' },
  { kode: 'SPP', nama: 'Surat Keterangan Penghasilan', desc: 'Keterangan rincian penghasilan rata-rata orang tua/wali pemohon.', syarat: 'KTP, Kartu Keluarga, Bukti Usaha/Slip', tag: 'bg-blue-50 text-brand-700 border-blue-200' },
];

function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans text-slate-800 antialiased selection:bg-brand-600 selection:text-white">
      {/* ── NAVBAR ELEGAN & GLASSMORPHISM ── */}
      <header className="border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 shadow-md transition-all duration-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:py-3.5">
          <Link to="/" className="flex items-center gap-3 group">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/30 group-hover:scale-105 transition-transform duration-200">
              <Icon name="building" className="w-5 h-5" />
            </span>
            <div>
              <div className="text-base font-extrabold text-white tracking-tight leading-tight flex items-center gap-2">
                <span>SIPESUR</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <div className="text-[11px] font-semibold text-brand-300 leading-none mt-0.5">Kelurahan Sukamaju</div>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 font-semibold text-slate-200 hover:text-white hover:bg-slate-700 hover:border-slate-600 transition-all duration-200 text-xs sm:text-sm active:scale-95"
            >
              Masuk
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 px-4 sm:px-5 py-2 font-bold text-white shadow-md shadow-brand-600/30 hover:shadow-lg hover:shadow-brand-600/40 hover:-translate-y-0.5 transition-all duration-200 text-xs sm:text-sm active:scale-95"
            >
              Daftar Warga
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO PRESTISIUS BERGAYA MODERN DEEP NAVY ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-[#0c1e33] to-slate-900 text-white py-16 sm:py-24 border-b border-slate-800/80">
        {/* Subtle Ambient Radial Light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] sm:w-[900px] h-[350px] bg-brand-600/25 blur-[120px] rounded-full pointer-events-none -z-0" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-400/30 px-4 py-1.5 text-xs font-semibold text-blue-300 mb-6 backdrop-blur-md shadow-inner animate-in-scale">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
            Pelayanan Administrasi Kependudukan Resmi • Kelurahan Sukamaju
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white mb-6">
            Layanan Surat Kelurahan{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
              Cepat, Sah & Digital
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed mb-9 max-w-2xl mx-auto font-normal">
            Pengurusan surat keterangan warga kini mudah dilakukan secara mandiri dari mana saja. Berkas diperiksa tertib oleh petugas loket dan disahkan dengan Tanda Tangan Elektronik (TTE) resmi Lurah Sukamaju.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <Link
              to="/login"
              className="w-full sm:w-auto min-w-[170px] rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold px-7 py-3 text-sm sm:text-base shadow-lg shadow-brand-600/35 hover:shadow-xl hover:shadow-brand-600/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              Masuk ke Akun
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto min-w-[170px] rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/40 font-semibold px-7 py-3 text-sm sm:text-base backdrop-blur-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              Daftar Warga Baru
            </Link>
          </div>

          {/* 3 Keunggulan Standar - Glassmorphism Card Hover */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left border-t border-white/10 pt-10">
            <div className="p-5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 hover:border-brand-400/40 backdrop-blur-md shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 mb-3 group-hover:scale-110 transition-transform duration-200">
                <Icon name="file" className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold text-white mb-1.5 group-hover:text-blue-300 transition-colors">1. Pengajuan Mandiri</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Warga mengisi formulir dan mengunggah dokumen persyaratan secara mandiri tanpa antre di kantor kelurahan.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 hover:border-brand-400/40 backdrop-blur-md shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 mb-3 group-hover:scale-110 transition-transform duration-200">
                <Icon name="check" className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold text-white mb-1.5 group-hover:text-blue-300 transition-colors">2. Disahkan Resmi Lurah</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Berkas diverifikasi petugas loket dan disahkan dengan Tanda Tangan Elektronik (TTE) resmi oleh Lurah Sukamaju.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 hover:border-brand-400/40 backdrop-blur-md shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 mb-3 group-hover:scale-110 transition-transform duration-200">
                <Icon name="shield" className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold text-white mb-1.5 group-hover:text-blue-300 transition-colors">3. Unduh Dokumen PDF & QR</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Surat yang disetujui langsung terbit dalam format PDF resmi bertanda tangan QR Code siap cetak dan valid.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ALUR PELAYANAN 4 TAHAP TRANSPARAN ── */}
      <section className="py-12 sm:py-16 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              Tata Kelola Transparan
            </span>
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2.5">
              Alur Pengurusan Surat Resmi
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-lg mx-auto">
              Proses administrasi yang tertib, cepat, dan berkekuatan hukum dalam 4 tahapan
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-brand-300 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3 mb-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white font-bold text-sm">1</span>
                <span className="font-bold text-slate-900 text-sm">Pilih & Isi Data</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Warga memilih jenis surat keterangan dan melengkapi formulir serta mengunggah dokumen persyaratan.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-brand-300 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3 mb-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white font-bold text-sm">2</span>
                <span className="font-bold text-slate-900 text-sm">Pemeriksaan Berkas</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Petugas loket memverifikasi data NIK dan kelengkapan dokumen persyaratan pemohon.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-brand-300 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3 mb-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white font-bold text-sm">3</span>
                <span className="font-bold text-slate-900 text-sm">Persetujuan & TTE Lurah</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Lurah memeriksa draf naskah resmi dan memberikan persetujuan Tanda Tangan Elektronik (TTE).
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-brand-300 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3 mb-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-sm">4</span>
                <span className="font-bold text-slate-900 text-sm">Surat Terbit & QR Sah</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dokumen PDF resmi ber-QR Code otomatis terbit dan dapat diunduh seketika untuk keperluan dinas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── DAFTAR JENIS SURAT LAYANAN ── */}
      <section className="py-14 sm:py-20 bg-slate-50/70 border-b border-slate-200/80">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              Katalog Layanan
            </span>
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2.5">
              Jenis Surat Keterangan yang Dilayani
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Memudahkan pengurusan administrasi kependudukan warga dengan ketentuan hukum resmi kelurahan.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LAYANAN_LIST.map((s) => (
              <div
                key={s.kode}
                className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-brand-400/80 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Accent top border glow saat hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-transparent group-hover:bg-gradient-to-r group-hover:from-brand-500 group-hover:to-blue-400 transition-all duration-300"></div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="inline-block rounded-lg px-2.5 py-0.5 font-mono text-[11px] font-bold bg-blue-50 text-brand-700 border border-blue-200/80 group-hover:bg-brand-600 group-hover:text-white transition-colors duration-200">
                      {s.kode}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Format Baku</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1.5 leading-snug group-hover:text-brand-700 transition-colors">{s.nama}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">{s.desc}</p>
                </div>
                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-400 block mb-0.5">Syarat Dokumen:</span>
                  <span className="text-slate-700">{s.syarat}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INFORMASI LOKET & KANTOR ── */}
      <section className="py-10 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-4xl px-4 text-xs text-slate-600">
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/50 via-white to-blue-50/50 p-6 flex flex-col sm:flex-row items-center justify-around gap-4 text-center sm:text-left shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 flex-shrink-0">
                <Icon name="clock" className="w-5 h-5" />
              </span>
              <div>
                <b className="text-slate-900 text-sm block">Jam Operasional Pelayanan</b>
                <span className="text-slate-500">Senin – Jumat (08.00 – 15.00 WIB)</span>
              </div>
            </div>

            <div className="hidden sm:block h-8 w-px bg-blue-200/80"></div>

            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 flex-shrink-0">
                <Icon name="building" className="w-5 h-5" />
              </span>
              <div>
                <b className="text-slate-900 text-sm block">Kantor Kelurahan Sukamaju</b>
                <span className="text-slate-500">Jl. Raya Sukamaju No. 12, Kelurahan Sukamaju</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER RESMI MEWAH ── */}
      <footer className="bg-slate-950 py-6 text-center text-xs text-slate-400 border-t border-slate-900">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>© {new Date().getFullYear()} Pemerintah Kota • Kantor Kelurahan Sukamaju. Seluruh hak cipta dilindungi.</div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>Sistem Informasi Pelayanan Surat (SIPESUR)</span>
            <span>•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Server Aktif
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Center({ title, subtitle, children, maxWidth = 'max-w-md' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-[#0c1e33] to-slate-900 p-4 py-8 relative overflow-hidden font-sans">
      {/* Radiant Glow di latar belakang */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[700px] h-[400px] bg-brand-600/20 blur-[120px] rounded-full pointer-events-none -z-0" />

      <div className={`card w-full ${maxWidth} shadow-2xl border border-white/20 bg-white/95 backdrop-blur-xl relative z-10 animate-in-scale`}>
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <Link to="/" className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1.5 transition-colors">
            <span>←</span> Kembali ke Beranda
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand-600 text-white text-[10px]">
              <Icon name="building" className="w-3 h-3" />
            </span>
            <span className="text-xs font-extrabold text-brand-700 tracking-wider">SIPESUR</span>
          </div>
        </div>
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-xs text-slate-500 leading-relaxed">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ identifier: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [m, setM] = useState();

  const go = async (e) => {
    e.preventDefault();
    setLoading(true);
    setM(null);
    try {
      const { data } = await api.post('/auth/login', f);
      login(data.token, data.user);
      nav('/app');
    } catch (x) {
      setM({ t: em(x) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center
      title="Masuk ke SIPESUR"
      subtitle="Gunakan NIK (Warga), NIP / Username Kedinasan (Petugas/Lurah), atau Email yang terdaftar."
    >
      <form onSubmit={go} className="space-y-3">
        <Field l="NIK / NIP / Username / Email" req>
          <input
            className="inp"
            required
            autoFocus
            placeholder="Contoh: 3201010101900001 / petugas / email@anda.com"
            value={f.identifier}
            onChange={(e) => setF({ ...f, identifier: e.target.value })}
          />
        </Field>
        <Field l="Password" req>
          <div className="relative">
            <input
              className="inp pr-10"
              type={showPw ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={f.password}
              onChange={(e) => setF({ ...f, password: e.target.value })}
            />
            <button
              type="button"
              className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-brand-600"
              onClick={() => setShowPw(!showPw)}
            >
              {showPw ? '🙈 Sembunyikan' : '👁️ Tampilkan'}
            </button>
          </div>
        </Field>

        <Msg m={m} />

        <button className="btn btn-p w-full py-2.5 font-bold shadow-sm" disabled={loading}>
          {loading ? 'Memverifikasi Kredensial…' : 'Masuk ke Sistem'}
        </button>
      </form>

      <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-xs text-slate-700">
        <b className="text-brand-800">Akun Demo Pengujian:</b>
        <div className="mt-1 grid grid-cols-2 gap-1 text-[11px]">
          <span>• Admin: <code className="bg-white px-1 border border-blue-100 rounded">admin</code></span>
          <span>• Petugas: <code className="bg-white px-1 border border-blue-100 rounded">petugas</code></span>
          <span>• Lurah: <code className="bg-white px-1 border border-blue-100 rounded">lurah</code></span>
          <span>• Warga: <code className="bg-white px-1 border border-blue-100 rounded">3201010101900001</code></span>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">Password semua akun uji: <code className="bg-white px-1 border border-blue-100 rounded font-semibold text-brand-700">Password123</code></p>
      </div>

      <p className="mt-5 text-center text-xs sm:text-sm text-slate-600">
        Belum memiliki akun warga?{' '}
        <Link className="font-bold text-brand-600 hover:text-brand-800 underline" to="/register">
          Daftar akun baru di sini
        </Link>
      </p>
    </Center>
  );
}

/**
 * HALAMAN PENDAFTARAN WARGA LENGKAP
 * Desain modern, profesional, inline validation, password strength meter, show/hide toggle.
 */
function Register() {
  const nav = useNavigate();
  const [f, setF] = useState({
    nik: '',
    no_kk: '',
    nama: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: '',
    alamat: '',
    pekerjaan: '',
    telepon: '',
    email: '',
    password: '',
    konfirmasi_password: '',
    setuju_syarat: false,
  });

  const [showPw, setShowPw] = useState(false);
  const [showKpw, setShowKpw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [m, setM] = useState();
  const [successData, setSuccessData] = useState(null);

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setF({ ...f, [k]: val });
  };

  // Validasi Inline
  const nikValid = /^\d{16}$/.test(f.nik);
  const kkValid = /^\d{16}$/.test(f.no_kk);
  const pwStrength = getPasswordStrength(f.password);
  const pwValid = f.password.length >= 8 && /[A-Za-z]/.test(f.password) && /\d/.test(f.password);
  const kpwMatch = f.konfirmasi_password && f.konfirmasi_password === f.password;
  const telpValid = f.telepon.length >= 9;

  const go = async (e) => {
    e.preventDefault();
    setM(null);

    if (!nikValid) return setM({ t: 'NIK harus tepat 16 digit angka.' });
    if (!kkValid) return setM({ t: 'Nomor Kartu Keluarga (KK) harus tepat 16 digit angka.' });
    if (!pwValid) return setM({ t: 'Password minimal 8 karakter dan harus mengombinasikan huruf serta angka.' });
    if (!kpwMatch) return setM({ t: 'Konfirmasi password tidak sesuai dengan password.' });
    if (!f.setuju_syarat) return setM({ t: 'Anda wajib mencentang persetujuan syarat dan ketentuan.' });

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', f);
      setSuccessData(data);
    } catch (x) {
      setM({ t: em(x) });
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <Center title="Pendaftaran Berhasil" subtitle="Akun Anda telah tersimpan di sistem SIPESUR" maxWidth="max-w-lg">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 text-sm text-emerald-950">
          <div className="flex items-center gap-2 font-bold text-emerald-800 text-base">
            <span>✅</span> Registrasi Warga Berhasil
          </div>
          <p className="mt-2 text-slate-700 leading-relaxed">
            Akun Anda dengan NIK <b>{successData.nik_masked}</b> atas nama <b>{f.nama}</b> telah berhasil didaftarkan.
          </p>
          <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 leading-relaxed">
            <b>⏳ Status: Menunggu Verifikasi Petugas</b>
            <p className="mt-1">
              Sesuai SOP pelayanan publik, data kependudukan Anda akan diperiksa secara manual oleh petugas Kelurahan Sukamaju untuk mencocokkan data NIK dan Kartu Keluarga sebelum Anda dapat mengajukan permohonan surat resmi.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <button className="btn btn-p w-full py-2.5 font-bold shadow" onClick={() => nav('/login')}>
            Lanjut ke Halaman Login →
          </button>
          <Link to="/" className="text-center text-xs text-slate-500 hover:text-navy">
            Kembali ke Beranda
          </Link>
        </div>
      </Center>
    );
  }

  return (
    <Center
      title="Pendaftaran Akun Warga"
      subtitle="Silakan isi data kependudukan Anda dengan benar. Data akan diverifikasi oleh petugas kelurahan sebelum layanan surat dapat diakses."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={go} className="space-y-4">
        {/* BAGIAN 1: IDENTITAS KEPENDUDUKAN RESMI */}
        <div className="rounded-lg border border-blue-100 bg-blue-50/20 p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-700">
            1. Identitas Kependudukan Resmi
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              l="Nomor Induk Kependudukan (NIK)"
              req
              hint={f.nik && (nikValid ? '✓ 16 digit valid' : 'Harus tepat 16 digit angka')}
              err={f.nik && !nikValid && !/^\d*$/.test(f.nik) ? 'Hanya boleh berisi angka' : null}
            >
              <input
                className={'inp ' + (f.nik ? (nikValid ? 'border-emerald-500' : 'border-red-400') : '')}
                required
                maxLength={16}
                pattern="\d{16}"
                placeholder="Contoh: 3201010101900001"
                value={f.nik}
                onChange={set('nik')}
              />
            </Field>

            <Field
              l="Nomor Kartu Keluarga (KK)"
              req
              hint={f.no_kk && (kkValid ? '✓ 16 digit valid' : 'Harus tepat 16 digit angka')}
              err={f.no_kk && !kkValid && !/^\d*$/.test(f.no_kk) ? 'Hanya boleh berisi angka' : null}
            >
              <input
                className={'inp ' + (f.no_kk ? (kkValid ? 'border-emerald-500' : 'border-red-400') : '')}
                required
                maxLength={16}
                pattern="\d{16}"
                placeholder="Contoh: 3201010101900002"
                value={f.no_kk}
                onChange={set('no_kk')}
              />
            </Field>
          </div>

          <Field l="Nama Lengkap (Sesuai KTP/KK)" req>
            <input
              className="inp"
              required
              minLength={3}
              placeholder="Contoh: Budi Santoso"
              value={f.nama}
              onChange={set('nama')}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field l="Tempat Lahir" req>
              <input
                className="inp"
                required
                placeholder="Contoh: Bandung"
                value={f.tempat_lahir}
                onChange={set('tempat_lahir')}
              />
            </Field>
            <Field l="Tanggal Lahir" req>
              <input
                className="inp"
                type="date"
                required
                value={f.tanggal_lahir}
                onChange={set('tanggal_lahir')}
              />
            </Field>
            <Field l="Jenis Kelamin" req>
              <select className="inp" required value={f.jenis_kelamin} onChange={set('jenis_kelamin')}>
                <option value="">Pilih</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </Field>
          </div>
        </div>

        {/* BAGIAN 2: ALAMAT & KONTAK */}
        <div className="rounded-lg border border-blue-100 bg-blue-50/20 p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-700">
            2. Alamat & Kontak Aktif
          </h2>
          <Field l="Alamat Lengkap (Jalan, RT/RW, Kelurahan)" req>
            <textarea
              className="inp"
              rows={2}
              required
              minLength={5}
              placeholder="Contoh: Jl. Melati No. 5 RT 02/RW 03, Kelurahan Sukamaju"
              value={f.alamat}
              onChange={set('alamat')}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field l="Pekerjaan">
              <input
                className="inp"
                placeholder="Contoh: Karyawan Swasta"
                value={f.pekerjaan}
                onChange={set('pekerjaan')}
              />
            </Field>
            <Field l="Nomor HP / WhatsApp" req hint={f.telepon && (telpValid ? '✓ Nomor aktif' : 'Minimal 9 digit')}>
              <input
                className="inp"
                type="tel"
                required
                placeholder="Contoh: 081234567890"
                value={f.telepon}
                onChange={set('telepon')}
              />
            </Field>
            <Field l="Email (Opsional)" hint="Untuk notifikasi status">
              <input
                className="inp"
                type="email"
                placeholder="warga@email.com"
                value={f.email}
                onChange={set('email')}
              />
            </Field>
          </div>
        </div>

        {/* BAGIAN 3: KEAMANAN AKUN */}
        <div className="rounded-lg border border-blue-100 bg-blue-50/20 p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-700">
            3. Keamanan Akun
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field l="Password" req>
              <div className="relative">
                <input
                  className={'inp pr-10 ' + (f.password ? (pwValid ? 'border-emerald-500' : 'border-amber-400') : '')}
                  type={showPw ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="Min. 8 karakter (huruf & angka)"
                  value={f.password}
                  onChange={set('password')}
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-brand-600"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {f.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Kekuatan Password:</span>
                    <span className={'font-bold ' + pwStrength.text}>{pwStrength.label}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={'h-full transition-all duration-300 ' + pwStrength.color}
                      style={{ width: pwStrength.width }}
                    />
                  </div>
                </div>
              )}
            </Field>

            <Field
              l="Konfirmasi Password"
              req
              hint={f.konfirmasi_password && (kpwMatch ? '✓ Password cocok' : 'Password belum cocok')}
            >
              <div className="relative">
                <input
                  className={'inp pr-10 ' + (f.konfirmasi_password ? (kpwMatch ? 'border-emerald-500' : 'border-red-400') : '')}
                  type={showKpw ? 'text' : 'password'}
                  required
                  placeholder="Ulangi password di samping"
                  value={f.konfirmasi_password}
                  onChange={set('konfirmasi_password')}
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-brand-600"
                  onClick={() => setShowKpw(!showKpw)}
                >
                  {showKpw ? '🙈' : '👁️'}
                </button>
              </div>
            </Field>
          </div>
        </div>

        {/* PERSETUJUAN SYARAT & KETENTUAN */}
        <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 cursor-pointer hover:bg-slate-50">
          <input
            type="checkbox"
            required
            checked={f.setuju_syarat}
            onChange={set('setuju_syarat')}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
          />
          <span className="leading-relaxed">
            Saya menyatakan dengan sungguh-sungguh bahwa seluruh data identitas (NIK, Kartu Keluarga, dan data diri) yang saya masukkan adalah benar, sah, dan sesuai dengan dokumen kependudukan asli. Saya memahami bahwa data akan diverifikasi oleh petugas kelurahan sebelum akun diaktifkan.
          </span>
        </label>

        <Msg m={m} />

        <button
          className="btn btn-p w-full py-3 font-bold shadow-sm text-base disabled:opacity-50"
          disabled={loading || !f.setuju_syarat}
        >
          {loading ? 'Memproses Pendaftaran…' : 'Daftarkan Akun Warga'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-600">
        Sudah memiliki akun?{' '}
        <Link className="font-bold text-brand-600 hover:text-brand-800 underline" to="/login">
          Masuk di sini
        </Link>
      </p>
    </Center>
  );
}

function Verifikasi() {
  const { kode } = useParams();
  const [r, setR] = useState();

  useEffect(() => {
    api
      .get('/verifikasi/' + kode)
      .then((x) => setR(x.data))
      .catch(() => setR({ valid: false }));
  }, [kode]);

  return (
    <Center title="Verifikasi Keaslian Surat" subtitle="Sistem validasi dokumen digital resmi Kelurahan Sukamaju">
      {!r ? (
        <p className="text-center text-sm text-slate-500 py-4">Memeriksa keaslian dokumen…</p>
      ) : r.valid ? (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 p-4 text-sm text-emerald-950">
          <p className="mb-3 font-bold text-emerald-800 text-base">✓ Dokumen ASLI & Terdaftar Resmi</p>
          <div className="space-y-1 text-xs">
            <p><span className="text-slate-500">Nomor Surat:</span> <b>{r.nomor}</b></p>
            <p><span className="text-slate-500">Jenis Dokumen:</span> <b>{r.jenis}</b></p>
            <p><span className="text-slate-500">Nama Pemohon:</span> <b>{r.pemohon}</b></p>
            <p><span className="text-slate-500">Tanggal Terbit:</span> <b>{tg(r.terbit_at)}</b></p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-950">
          <p className="font-bold text-red-700">✕ Dokumen Tidak Ditemukan</p>
          <p className="mt-1 text-xs text-slate-600">
            Kode verifikasi ini tidak terdaftar di basis data resmi SIPESUR Kelurahan Sukamaju.
          </p>
        </div>
      )}
    </Center>
  );
}

/* ====================================================================
   LAYOUT UTAMA APLIKASI
   ==================================================================== */

function Layout() {
  const { user, logout, updateUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [n] = useGet('/notifikasi');
  const [modalGantiPw, setModalGantiPw] = useState(false);

  const mustChangePw = user?.must_change_password;
  const isPendingWarga = user?.role === 'warga' && user?.status_verifikasi === 'menunggu_verifikasi';
  const unread = (n || []).filter((x) => !x.dibaca).length;

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* ── HEADER MOBILE ELEGAN ── */}
      <header className="flex-shrink-0 z-30 flex items-center justify-between bg-[#0c1e33] px-4 py-3 text-white border-b border-white/10 md:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-xs">
            <Icon name="building" className="w-4 h-4" />
          </span>
          <div>
            <b className="tracking-tight text-sm font-extrabold text-white">SIPESUR</b>
            <span className="text-[10px] text-brand-300 block -mt-0.5 font-medium">Kelurahan Sukamaju</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <Link
              to="/app/notifikasi"
              className="inline-flex items-center justify-center h-7 px-2 rounded-full bg-brand-600 text-white text-[10px] font-bold"
            >
              {unread} baru
            </Link>
          )}
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle Menu Navigasi"
          >
            {open ? (
              <span className="text-base leading-none">✕</span>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
            <span>{open ? 'Tutup' : 'Menu'}</span>
          </button>
        </div>
      </header>

      {/* ── MOBILE BACKDROP OVERLAY ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── SIDEBAR NAVIGATION (100% SATU LAYAR PENUH, ZERO SCROLL UNTUK TOMBOL BAWAH) ── */}
      <aside
        className={
          'fixed inset-y-0 left-0 z-50 flex w-72 h-[100dvh] max-h-[100dvh] flex-col justify-between bg-[#0c1e33] p-4 text-slate-300 border-r border-slate-800/80 shadow-2xl transition-transform duration-300 ease-in-out md:static md:flex md:w-64 md:h-screen md:max-h-screen md:flex-shrink-0 md:translate-x-0 md:shadow-none overflow-hidden ' +
          (open ? 'translate-x-0' : '-translate-x-full md:translate-x-0')
        }
      >
        {/* Atas: Identitas Logo & Profil Pengguna (flex-shrink-0) */}
        <div className="flex-shrink-0 mb-3">
          <div className="flex items-center justify-between gap-2.5 mb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
                <Icon name="building" className="w-5 h-5" />
              </span>
              <div>
                <div className="text-base font-extrabold tracking-tight text-white leading-tight">SIPESUR</div>
                <div className="text-[10px] font-semibold text-brand-300 tracking-wider">KELURAHAN SUKAMAJU</div>
              </div>
            </div>
            {/* Tombol Tutup Khusus Mobile */}
            <button
              type="button"
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg text-sm"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="rounded-xl bg-white/10 p-3 text-xs border border-white/10">
            <div className="font-bold text-white truncate">{user?.nama}</div>
            <div className="mt-0.5 flex items-center justify-between text-slate-300 capitalize text-[11px]">
              <span>Peran: {user?.role}</span>
              {user?.role === 'warga' && <BadgeWarga s={user?.status_verifikasi} />}
            </div>
            {user?.nik_masked && (
              <div className="mt-1 text-[11px] text-slate-400 font-mono">NIK: {user.nik_masked}</div>
            )}
          </div>
        </div>

        {/* Tengah: Menu Navigasi (HANYA BAGIAN INI YANG BOLEH SCROLL JIKA MENU PANJANG) */}
        <nav className="flex-1 min-h-0 overflow-y-auto space-y-1 py-1 pr-1" onClick={() => setOpen(false)}>
          {[...(MENU[user?.role] || []), ['/app/notifikasi', 'Notifikasi' + (unread ? ` (${unread})` : '')]].map(
            ([to, l]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/app'}
                className={({ isActive }) =>
                  'flex items-center justify-between rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-colors ' +
                  (isActive ? 'bg-brand-600 text-white font-bold shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white')
                }
              >
                <span>{l}</span>
              </NavLink>
            )
          )}
        </nav>

        {/* Bawah: Ganti Password & Keluar (FLEX-SHRINK-0 MT-AUTO: 100% SELALU TERLIHAT DI LAYAR TANPA PERLU DI-SCROLL!) */}
        <div className="flex-shrink-0 pt-3 border-t border-white/10 space-y-1.5 mt-auto pb-safe">
          <button
            type="button"
            className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white flex items-center gap-2 transition-colors"
            onClick={() => { setModalGantiPw(true); setOpen(false); }}
          >
            <Icon name="lock" className="w-4 h-4 text-brand-400" />
            <span>Ganti Password</span>
          </button>
          <button
            type="button"
            className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-300 hover:bg-rose-900/30 hover:text-rose-100 flex items-center gap-2 transition-colors"
            onClick={logout}
          >
            <Icon name="logout" className="w-4 h-4 text-rose-400" />
            <span>Keluar dari Akun</span>
          </button>
        </div>
      </aside>

      {/* ── KONTEN KANAN: SATU-SATUNYA BAGIAN YANG DI-SCROLL BEBAS (FULL WIDTH) ── */}
      <main className="flex-1 h-screen md:h-screen min-h-0 overflow-y-auto w-full p-4 sm:p-6 lg:p-8 bg-slate-50 min-w-0">
        <div className="w-full space-y-5 pb-16">
          {/* Banner Peringatan Akun Warga Menunggu Verifikasi */}
          {isPendingWarga && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 shadow-sm flex items-start gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white flex-shrink-0 mt-0.5">
                <Icon name="alert" className="w-4 h-4" />
              </span>
              <div>
                <b className="font-bold text-amber-900">Akun Anda Sedang Dalam Proses Verifikasi Petugas</b>
                <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                  Pendaftaran akun Anda dengan NIK <b>{user.nik_masked}</b> telah tercatat. Petugas kelurahan sedang memverifikasi keabsahan data kependudukan sebelum Anda dapat mengajukan permohonan surat.
                </p>
              </div>
            </div>
          )}

          {/* Banner Peringatan Wajib Ganti Password Sementara bagi Akun Kedinasan */}
          {mustChangePw && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-950 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white flex-shrink-0 mt-0.5">
                  <Icon name="lock" className="w-4 h-4" />
                </span>
                <div>
                  <b className="font-bold text-red-900">Perhatian: Anda Masih Menggunakan Password Sementara</b>
                  <p className="mt-0.5 text-xs text-red-800">
                    Demi keamanan akun kedinasan, silakan perbarui password Anda sekarang.
                  </p>
                </div>
              </div>
              <button
                className="btn btn-d text-xs px-3.5 py-1.5 flex-shrink-0"
                onClick={() => setModalGantiPw(true)}
              >
                Ganti Password Sekarang
              </button>
            </div>
          )}

          <Outlet />
        </div>
      </main>

      {/* MODAL GANTI PASSWORD */}
      {modalGantiPw && (
        <ModalGantiPassword
          onClose={() => setModalGantiPw(false)}
          onSuccess={() => {
            updateUser({ must_change_password: false });
            setModalGantiPw(false);
          }}
        />
      )}
    </div>
  );
}

function ModalGantiPassword({ onClose, onSuccess }) {
  const [f, setF] = useState({ password_lama: '', password_baru: '', konfirmasi_password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [m, setM] = useState();

  const pwStrength = getPasswordStrength(f.password_baru);

  const go = async (e) => {
    e.preventDefault();
    setM(null);
    if (f.password_baru.length < 8) return setM({ t: 'Password baru minimal 8 karakter.' });
    if (f.password_baru !== f.konfirmasi_password) return setM({ t: 'Konfirmasi password baru tidak cocok.' });

    setLoading(true);
    try {
      await api.post('/auth/ganti-password', f);
      alert('Password berhasil diperbarui!');
      onSuccess();
    } catch (x) {
      setM({ t: em(x) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="card w-full max-w-md shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Ganti Password Akun</h2>
            <p className="text-xs text-slate-500">Perbarui kata sandi untuk keamanan akses Anda</p>
          </div>
          <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={go} className="space-y-3">
          <Field l="Password Saat Ini" req>
            <input
              className="inp"
              type="password"
              required
              placeholder="••••••••"
              value={f.password_lama}
              onChange={(e) => setF({ ...f, password_lama: e.target.value })}
            />
          </Field>
          <Field l="Password Baru (Min. 8 Karakter)" req>
            <div className="relative">
              <input
                className="inp pr-10"
                type={showPw ? 'text' : 'password'}
                required
                minLength={8}
                placeholder="••••••••"
                value={f.password_baru}
                onChange={(e) => setF({ ...f, password_baru: e.target.value })}
              />
              <button
                type="button"
                className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                onClick={() => setShowPw(!showPw)}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
            {f.password_baru && (
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Kekuatan:</span>
                <span className={'font-bold ' + pwStrength.text}>{pwStrength.label}</span>
              </div>
            )}
          </Field>
          <Field l="Konfirmasi Password Baru" req>
            <input
              className="inp"
              type="password"
              required
              placeholder="••••••••"
              value={f.konfirmasi_password}
              onChange={(e) => setF({ ...f, konfirmasi_password: e.target.value })}
            />
          </Field>

          <Msg m={m} />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" className="btn btn-o text-xs" onClick={onClose}>
              Batal
            </button>
            <button className="btn btn-p text-xs font-bold" disabled={loading}>
              {loading ? 'Menyimpan…' : 'Simpan Password Baru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const Guard = () => (useAuth().user ? <Layout /> : <Navigate to="/login" />);
const Only = ({ r, children }) => (useAuth().user && r.includes(useAuth().user.role) ? children : <Navigate to="/app" />);

const Bars = ({ t, rows }) => {
  const mx = Math.max(1, ...(rows || []).map((r) => r.n || 0));
  return (
    <Card title={t}>
      {(rows || []).length ? (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.nama} className="text-xs">
              <div className="flex justify-between mb-1">
                <span className="font-medium text-slate-700">{r.nama}</span>
                <b className="font-mono text-slate-900">{r.n}</b>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-brand-600 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round(((r.n || 0) / mx) * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 text-center py-4">Belum ada data tercatat</p>
      )}
    </Card>
  );
};

function Dashboard() {
  const { user } = useAuth();
  const [s] = useGet('/stats');
  if (!s) return <p className="text-sm text-slate-500 py-8 text-center">Memuat data ringkasan…</p>;
  const st = s.status || {};

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // 4 Kartu Metrik Cantik dengan Aksen Warna Lembut
  const metrics = [
    { label: 'Total Permohonan', value: (st.submitted || 0) + (st.under_review || 0) + (st.pending_approval || 0) + (st.approved || 0) + (st.issued || 0), desc: 'Seluruh berkas terdaftar', badge: 'bg-slate-100 text-slate-700', icon: 'file' },
    { label: 'Sedang Diproses', value: (st.under_review || 0) + (st.pending_approval || 0), desc: 'Dalam verifikasi & persetujuan', badge: 'bg-sky-50 text-sky-700 border border-sky-200', icon: 'clock' },
    { label: 'Surat Terbit & Selesai', value: st.issued || 0, desc: 'Telah disahkan & siap unduh', badge: 'bg-emerald-50 text-emerald-800 border border-emerald-200', icon: 'check' },
    { label: 'Perlu Revisi / Catatan', value: (st.revision_required || 0) + (st.rejected || 0), desc: 'Perlu perbaikan berkas pemohon', badge: 'bg-amber-50 text-amber-800 border border-amber-200', icon: 'alert' },
  ];

  return (
    <div className="space-y-5">
      {/* ── HEADER DASHBOARD CANTIK & ELEGAN ── */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-brand-700 mb-1">{dateStr}</div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Selamat Datang, {user.nama}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
              {user.role === 'warga'
                ? 'Pantau tahapan permohonan surat keterangan Anda dan unduh berkas resmi yang telah disahkan Lurah.'
                : user.role === 'petugas'
                ? 'Kelola pemeriksaan berkas permohonan warga dan koordinasikan disposisi persuratan kedinasan.'
                : user.role === 'lurah'
                ? 'Pemeriksaan pengesahan tanda tangan elektronik surat warga dan disposisi surat dinas masuk.'
                : 'Pusat operasional dan tata kelola persuratan resmi Kelurahan Sukamaju.'}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-200 px-3.5 py-1 text-xs font-bold text-brand-800 capitalize shadow-2xs">
            Peran: {user.role}
          </span>
        </div>
      </div>

      {/* ── 4 KARTU METRIK CANTIK ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500">{m.label}</span>
              <span className={`inline-flex items-center justify-center h-6 w-6 rounded-md ${m.badge}`}>
                <Icon name={m.icon} className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-extrabold text-slate-900">{m.value}</div>
              <div className="text-[11px] text-slate-400 mt-1">{m.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── GRAFIK STATISTIK ── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Bars t="Volume Pengajuan Berdasarkan Jenis Surat" rows={s.jenis || []} />
        <Bars t="Statistik Pelayanan 6 Bulan Terakhir" rows={s.bulan || []} />
      </div>

      {/* ── KHUSUS LURAH: PANEL TINDAKAN CEPAT PERSURATAN ── */}
      {user.role === 'lurah' && (
        <Card
          title="Tindakan Kepemimpinan & Pengesahan Surat Lurah"
          subtitle="Pintasan cepat untuk menerbitkan surat dinas keluar, memeriksa persetujuan surat warga, dan disposisi"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Link
              to="/app/surat-keluar"
              className="p-4 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/70 to-white hover:border-brand-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                  <Icon name="file" className="w-5 h-5" />
                </span>
                <span className="font-bold text-slate-900 text-sm group-hover:text-brand-700 transition-colors">
                  Buat Surat Dinas / Keluar
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Terbitkan surat edaran, undangan rapat, surat tugas, atau pengumuman resmi ber-KOP & TTE Lurah.
              </p>
            </Link>

            <Link
              to="/app/pengajuan"
              className="p-4 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white hover:border-emerald-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                  <Icon name="check" className="w-5 h-5" />
                </span>
                <span className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                  Persetujuan Surat Warga
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Periksa draf permohonan surat keterangan warga dan sahkan tanda tangan elektronik (TTE).
              </p>
            </Link>

            <Link
              to="/app/surat-masuk"
              className="p-4 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/70 to-white hover:border-amber-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm group-hover:scale-105 transition-transform">
                  <Icon name="inbox" className="w-5 h-5" />
                </span>
                <span className="font-bold text-slate-900 text-sm group-hover:text-amber-800 transition-colors">
                  Disposisi Surat Masuk
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Berikan instruksi dan lembar disposisi atas surat dinas masuk dari instansi eksternal.
              </p>
            </Link>
          </div>
        </Card>
      )}

      {/* ── KHUSUS WARGA: SURAT TERBIT TERBARU ── */}
      {user.role === 'warga' && (
        <Card
          title="Surat Keterangan Saya yang Telah Terbit"
          subtitle="Dokumen resmi ber-QR Code yang siap diunduh dan dicetak"
          rightAction={
            <Link to="/app/surat" className="text-xs font-bold text-brand-700 hover:underline">
              Lihat Semua Surat →
            </Link>
          }
        >
          <WargaSuratList />
        </Card>
      )}
    </div>
  );
}
/**
 * FITUR VERIFIKASI WARGA OLEH PETUGAS & ADMIN
 */
function VerifikasiWarga() {
  const [filter, setFilter] = useState('menunggu_verifikasi');
  const [rows, load] = useGet('/verifikasi-warga?status=' + filter);
  const [selected, setSelected] = useState(null);
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);
  const [m, setM] = useState();

  const handleVerif = async (hasil) => {
    if (hasil === 'ditolak' && !catatan.trim()) {
      return alert('Alasan penolakan wajib diisi.');
    }
    setLoading(true);
    try {
      await api.post(`/verifikasi-warga/${selected.id}`, { hasil, catatan });
      setSelected(null);
      setCatatan('');
      load();
    } catch (x) {
      alert(em(x));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card
        title="Verifikasi Akun Kependudukan Warga"
        subtitle="Pemeriksaan berkas dan data NIK & No KK warga sebelum dapat mengajukan permohonan surat"
        rightAction={
          <div className="flex gap-2">
            <select
              className="inp text-xs py-1"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="menunggu_verifikasi">⏳ Menunggu Verifikasi</option>
              <option value="terverifikasi">✓ Terverifikasi</option>
              <option value="ditolak">✕ Ditolak</option>
              <option value="all">Semua Status</option>
            </select>
          </div>
        }
      >
        <Table
          head={['Nama Warga', 'NIK (Tersensor)', 'No KK (Tersensor)', 'Telepon / WA', 'Tgl Daftar', 'Status', 'Tindakan']}
          rows={(rows || []).map((r) => [
            <b key="n" className="text-navy">{r.nama}</b>,
            r.nik_masked,
            r.no_kk_masked,
            r.telepon || '-',
            tg(r.created_at),
            <BadgeWarga key="s" s={r.status_verifikasi} />,
            <button
              key="act"
              className="btn btn-p text-xs py-1 px-2.5"
              onClick={() => {
                setSelected(r);
                setCatatan(r.catatan_verifikasi || '');
              }}
            >
              Periksa & Verifikasi
            </button>,
          ])}
        />
      </Card>

      {/* Modal Pemeriksaan Detail Warga */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-lg shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-bold text-navy text-base">Pemeriksaan Identitas Warga</h3>
                <p className="text-xs text-slate-400">Verifikasi manual data kependudukan</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-lg border">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block">Nama Lengkap:</span>
                  <b className="text-navy text-sm">{selected.nama}</b>
                </div>
                <div>
                  <span className="text-slate-400 block">Status Saat Ini:</span>
                  <BadgeWarga s={selected.status_verifikasi} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 block">NIK:</span>
                  <code className="text-xs bg-white px-1.5 py-0.5 rounded font-bold">{selected.nik}</code>
                </div>
                <div>
                  <span className="text-slate-400 block">No. Kartu Keluarga:</span>
                  <code className="text-xs bg-white px-1.5 py-0.5 rounded font-bold">{selected.no_kk}</code>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 block">Tempat / Tgl Lahir:</span>
                  <b>{selected.tempat_lahir}, {selected.tanggal_lahir ? String(selected.tanggal_lahir).slice(0, 10) : '-'}</b>
                </div>
                <div>
                  <span className="text-slate-400 block">Jenis Kelamin:</span>
                  <b>{selected.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</b>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-400 block">Alamat KTP:</span>
                <b>{selected.alamat || '-'}</b>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 block">No. Telepon / WA:</span>
                  <b>{selected.telepon || '-'}</b>
                </div>
                <div>
                  <span className="text-slate-400 block">Email:</span>
                  <b>{selected.email || '-'}</b>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Catatan Petugas (Wajib jika menolak):
              </label>
              <textarea
                className="inp text-xs"
                rows={2}
                placeholder="Contoh: NIK dan nama sesuai data kependudukan."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
              />
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t pt-3">
              <button
                type="button"
                className="btn btn-d text-xs"
                disabled={loading}
                onClick={() => handleVerif('ditolak')}
              >
                ✕ Tolak Verifikasi
              </button>
              <button
                type="button"
                className="btn bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-bold"
                disabled={loading}
                onClick={() => handleVerif('terverifikasi')}
              >
                ✓ Setujui & Verifikasi Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Ajukan() {
  const { user } = useAuth();
  const [js] = useGet('/jenis-surat');
  const [jid, setJid] = useState('');
  const [data, setData] = useState({});
  const [files, setFiles] = useState({});
  const [m, setM] = useState();
  const nav = useNavigate();

  // Warga belum terverifikasi tidak bisa mengajukan surat
  if (user?.role === 'warga' && user?.status_verifikasi !== 'terverifikasi') {
    return (
      <Card title="Pengajuan Surat Ditutup Sementara">
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
          <b className="font-bold text-amber-900 text-base">⏳ Akun Anda Belum Diverifikasi</b>
          <p className="mt-2 text-slate-700 leading-relaxed">
            Demi keamanan data kependudukan dan keabsahan dokumen kenegaraan, permohonan surat hanya dapat dilakukan oleh warga yang akunnya telah diverifikasi oleh petugas kelurahan.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Silakan tunggu petugas memverifikasi data NIK Anda, atau hubungi petugas loket Kelurahan Sukamaju untuk informasi lebih lanjut.
          </p>
        </div>
      </Card>
    );
  }

  const j = (js || []).find((x) => String(x.id) === jid);
  const formFields = j ? (Array.isArray(j.form_fields) ? j.form_fields : JSON.parse(j.form_fields || '[]')) : [];
  const persyaratan = j?.persyaratan || [];

  const send = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('jenis_surat_id', jid);
    fd.append('data_form', JSON.stringify(data));
    Object.entries(files).forEach(([k, f]) => fd.append(k, f));
    try {
      await api.post('/pengajuan', fd);
      nav('/app/pengajuan');
    } catch (x) {
      setM({ t: em(x) });
    }
  };

  return (
    <Card title="Ajukan Permohonan Surat Resmi" subtitle="Pilih jenis surat dan lengkapi data formulir beserta berkas persyaratan">
      <form onSubmit={send}>
        <Field l="Pilih Jenis Surat" req>
          <select
            className="inp"
            value={jid}
            required
            onChange={(e) => {
              setJid(e.target.value);
              setData({});
              setFiles({});
            }}
          >
            <option value="">-- Pilih Jenis Surat Keterangan / Pengantar --</option>
            {(js || []).map((x) => (
              <option key={x.id} value={x.id}>
                [{x.kode}] {x.nama}
              </option>
            ))}
          </select>
        </Field>

        {j && (
          <div className="space-y-4 pt-2">
            <div className="rounded-lg bg-slate-50 p-4 border">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-navy">Formulir Keterangan Khusus</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {formFields.map((f) => (
                  <Field key={f.name} l={f.label} req>
                    <input
                      className="inp"
                      required
                      type={f.name.includes('tanggal') ? 'date' : 'text'}
                      value={data[f.name] || ''}
                      onChange={(e) => setData({ ...data, [f.name]: e.target.value })}
                    />
                  </Field>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-4 border">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-navy">
                Unggah Dokumen Persyaratan (PDF/JPG/PNG, maks. 2 MB)
              </h3>
              <div className="space-y-2">
                {persyaratan.map((p) => (
                  <Field key={p.id} l={p.nama} req>
                    <input
                      type="file"
                      required
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="block text-xs"
                      onChange={(e) => setFiles({ ...files, ['doc_' + p.id]: e.target.files[0] })}
                    />
                  </Field>
                ))}
              </div>
            </div>
          </div>
        )}

        <Msg m={m} />

        <div className="mt-5">
          <button className="btn btn-p py-2.5 px-6 font-bold" disabled={!j}>
            Kirim Permohonan Surat →
          </button>
        </div>
      </form>
    </Card>
  );
}

function List() {
  const { user } = useAuth();
  const [st, setSt] = useState(user?.role === 'lurah' ? 'pending_approval' : '');
  const [rows] = useGet('/pengajuan' + (st ? '?status=' + st : ''));

  return (
    <Card
      title="Daftar Pengajuan Surat Keterangan"
      subtitle="Agenda permohonan surat keterangan kependudukan warga"
      rightAction={
        <select className="inp text-xs py-1.5 max-w-xs font-medium" value={st} onChange={(e) => setSt(e.target.value)}>
          <option value="">Semua Status Pelayanan</option>
          {Object.entries(ST).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      }
    >
      <Table
        head={['Kode Permohonan', 'Jenis Surat', 'Nama Pemohon', 'Tanggal Pengajuan', 'Status', 'Aksi']}
        rows={(rows || []).map((r) => [
          <code key="k" className="font-mono font-bold text-navy text-xs">{r.kode}</code>,
          r.jenis,
          r.pemohon,
          tg(r.created_at),
          <Badge key="b" s={r.status} />,
          <div key="act" className="flex items-center gap-2">
            <Link className="rounded-lg px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors" to={'/app/pengajuan/' + r.id}>
              Detail
            </Link>
            {r.status === 'issued' && (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors"
                onClick={() => downloadPdf('/pengajuan/' + r.id + '/surat', 'Surat-' + r.kode + '.pdf')}
              >
                <Icon name="download" className="w-3.5 h-3.5" />
                <span>Unduh PDF</span>
              </button>
            )}
          </div>,
        ])}
      />
    </Card>
  );
}

function Detail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [d, load] = useGet('/pengajuan/' + id);
  const [cat, setCat] = useState('');
  const [files, setFiles] = useState({});
  const [m, setM] = useState();
  const [loadingAct, setLoadingAct] = useState(false);
  const [tabDraf, setTabDraf] = useState(false);

  if (!d || !d.p) return <p className="text-sm text-slate-500 py-8 text-center">Memuat rincian pengajuan surat…</p>;
  const { p } = d;
  const r = user?.role;
  const s = p.status;

  const formFields = Array.isArray(p.form_fields)
    ? p.form_fields
    : typeof p.form_fields === 'string'
    ? JSON.parse(p.form_fields || '[]')
    : [];
  const formData =
    typeof p.data_form === 'object' && p.data_form !== null
      ? p.data_form
      : typeof p.data_form === 'string'
      ? JSON.parse(p.data_form || '{}')
      : {};

  const act = async (path, body) => {
    setLoadingAct(true);
    try {
      await api.post(`/pengajuan/${id}/${path}`, body);
      setM({ ok: 1, t: 'Tindakan berhasil disimpan.' });
      setCat('');
      setFiles({});
      load();
    } catch (x) {
      setM({ t: em(x) });
    } finally {
      setLoadingAct(false);
    }
  };

  const rev = () => {
    const fd = new FormData();
    Object.entries(files).forEach(([k, f]) => fd.append(k, f));
    act('revisi', fd);
  };

  const canRev = r === 'warga' && s === 'revision_required';

  // Alur tahapan standar
  const steps = [
    { key: 'diajukan', label: '1. Diajukan Warga', done: true },
    { key: 'verifikasi', label: '2. Verifikasi Petugas', done: ['under_review', 'pending_approval', 'approved', 'issued'].includes(s), active: s === 'under_review' },
    { key: 'persetujuan', label: '3. Persetujuan Lurah', done: ['approved', 'issued'].includes(s), active: s === 'pending_approval' },
    { key: 'terbit', label: '4. Surat Terbit & Selesai', done: s === 'issued', active: s === 'approved' },
  ];

  // Template naskah resmi standar
  const templateNaskah = p.template || 'adalah benar warga yang bertempat tinggal di wilayah Kelurahan Sukamaju. Surat keterangan ini diterbitkan secara sah untuk keperluan yang bersangkutan sesuai dengan berkas permohonan yang diajukan.';

  return (
    <div className="space-y-5">
      {/* ── BREADCRUMB & HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Link to="/app/pengajuan" className="hover:text-brand-600">Pengajuan Surat</Link>
            <span>/</span>
            <span className="font-mono text-slate-700">{p.kode}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">{p.jenis}</h1>
          <div className="text-xs text-slate-500 mt-0.5">
            Diajukan pada {tg(p.created_at)} oleh <b className="text-slate-800">{p.pemohon}</b> (NIK: {maskId(p.nik)})
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge s={s} />
        </div>
      </div>

      {/* ── STEPPER ALUR PELAYANAN ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {steps.map((st) => (
            <div
              key={st.key}
              className={`flex items-center gap-2 p-2.5 rounded-lg border ${
                st.done
                  ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900 font-semibold'
                  : st.active
                  ? 'border-brand-300 bg-brand-50/80 text-brand-900 font-bold ring-1 ring-brand-300'
                  : 'border-slate-100 bg-slate-50 text-slate-400'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  st.done
                    ? 'bg-emerald-600 text-white'
                    : st.active
                    ? 'bg-brand-600 text-white animate-pulse'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {st.done ? '✓' : st.active ? '●' : '○'}
              </span>
              <span className="truncate">{st.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── HASIL SETELAH DI-ACC LURAH (SURAT RESMI TELAH TERBIT) ── */}
      {(s === 'issued' || d.surat) && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <Icon name="check" className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wide">
                  Balasan Resmi: Surat Keterangan Telah Disahkan Lurah
                </h3>
                <p className="text-[11px] text-emerald-700">Dokumen berkekuatan hukum dengan Tanda Tangan Elektronik (TTE) & QR Code Lurah</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-200/80 px-3.5 py-1 text-xs font-bold text-emerald-900 border border-emerald-300 shadow-2xs">
              Disahkan & Siap Unduh
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 bg-white/95 p-4 rounded-xl border border-emerald-200 text-xs mb-4 shadow-2xs">
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Nomor Registrasi Surat:</div>
              <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">{d.surat?.nomor || '-'}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Tanggal Pengesahan:</div>
              <div className="font-bold text-slate-800 mt-0.5">{tg(d.surat?.terbit_at)}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Pejabat Penandatangan:</div>
              <div className="font-bold text-slate-800 mt-0.5">{d.surat?.lurah_nama || 'Drs. Hadi Purnomo, M.Si'}</div>
              <div className="text-[10px] text-slate-500">{d.surat?.lurah_jabatan || 'Lurah Sukamaju'}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Kode Verifikasi QR:</div>
              <div className="font-mono font-bold text-slate-800 mt-0.5">{d.surat?.kode_verifikasi || '-'}</div>
            </div>
          </div>

          <div className="rounded-lg bg-white/70 p-3 text-xs text-emerald-900 leading-relaxed mb-4 border border-emerald-200/60">
            <b>Pemberitahuan Pelayanan:</b> Dokumen fisik PDF resmi telah terbit dan siap digunakan. Anda dapat mengunduh berkas digital atau mencetaknya secara mandiri. Berkas ini memiliki kekuatan hukum yang sah.
          </div>

          {/* Tombol Unduh & Pratinjau Dokumen (Responsive Desktop & Mobile) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm py-2.5 px-5 shadow-sm transition-all w-full sm:w-auto"
              onClick={() => downloadPdf(`/pengajuan/${id}/surat`, `Surat-${(d.surat?.nomor || p.kode).replace(/[/\\?%*:|"<>]/g, '_')}.pdf`)}
            >
              <Icon name="download" className="w-4 h-4" />
              <span>Unduh Berkas PDF Resmi</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 font-semibold text-xs sm:text-sm py-2.5 px-4 shadow-2xs transition-colors w-full sm:w-auto"
              onClick={() => viewPdf(`/pengajuan/${id}/surat`)}
            >
              <Icon name="eye" className="w-4 h-4" />
              <span>Buka Pratinjau / Cetak</span>
            </button>
            {d.surat?.kode_verifikasi && (
              <Link
                to={`/verifikasi/${d.surat.kode_verifikasi}`}
                target="_blank"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs sm:text-sm py-2.5 px-4 transition-colors w-full sm:w-auto"
              >
                <Icon name="shield" className="w-4 h-4" />
                <span>Cek Validasi QR</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── KOTAK PENJELASAN DRAF NASKAH & ASAL TEMPLATE (BISA DIBUKA SEBELUM / SESUDAH DISAHKAN) ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 bg-slate-50/80 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Icon name="file" className="w-4 h-4 text-brand-600" />
              <span>Pratinjau Draf Naskah Surat (Template Kelurahan Sukamaju)</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Naskah disusun otomatis dari Template Resmi Master Surat <b>{p.jenis}</b> ({p.jkode})
            </p>
          </div>
          <button
            type="button"
            className="text-xs font-semibold text-brand-700 bg-white hover:bg-brand-50 px-3 py-1.5 rounded-lg border border-slate-300 transition-colors"
            onClick={() => setTabDraf(!tabDraf)}
          >
            {tabDraf ? 'Tutup Pratinjau Naskah' : 'Lihat Susunan Naskah Surat'}
          </button>
        </div>

        {tabDraf && (
          <div className="p-6 bg-slate-100/60">
            {/* LEMBAR SIMULASI SURAT RESMI KELURAHAN */}
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg border border-slate-300 shadow-sm font-serif text-slate-900 text-xs sm:text-sm leading-relaxed">
              {/* KOP SURAT */}
              <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
                <div className="text-xs font-bold uppercase tracking-wider">Pemerintah Kota Contoh</div>
                <div className="text-sm sm:text-base font-extrabold uppercase tracking-tight">Kecamatan Contoh • Kelurahan Sukamaju</div>
                <div className="text-[10px] text-slate-600 font-sans mt-0.5">Jl. Raya Sukamaju No. 12 • Telp: (021) 555-0123 • Kode Pos: 12345</div>
              </div>

              {/* JUDUL */}
              <div className="text-center my-4 font-sans">
                <div className="font-extrabold underline text-sm sm:text-base uppercase tracking-wide">{p.jenis}</div>
                <div className="text-xs font-mono text-slate-600 mt-0.5">
                  Nomor: {d.surat?.nomor || `DRAF / ${p.jkode} / KEL-SKM / ${new Date().getFullYear()}`}
                </div>
              </div>

              {/* PEMBUKA */}
              <p className="mb-3 text-justify">
                Yang bertanda tangan di bawah ini, Lurah Kelurahan Sukamaju, Kecamatan Contoh, Kota Contoh, dengan ini menerangkan bahwa:
              </p>

              {/* DATA IDENTITAS */}
              <div className="my-3 pl-4 space-y-1 font-sans text-xs">
                <div className="grid grid-cols-3"><span className="text-slate-500">Nama Lengkap</span><span className="col-span-2 font-bold">: {p.pemohon}</span></div>
                <div className="grid grid-cols-3"><span className="text-slate-500">NIK</span><span className="col-span-2 font-mono font-bold">: {maskId(p.nik)}</span></div>
                <div className="grid grid-cols-3"><span className="text-slate-500">Tempat, Tgl Lahir</span><span className="col-span-2">: {p.tempat_lahir || '-'}, {p.tanggal_lahir ? String(p.tanggal_lahir).slice(0, 10) : '-'}</span></div>
                <div className="grid grid-cols-3"><span className="text-slate-500">Jenis Kelamin</span><span className="col-span-2">: {p.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span></div>
                <div className="grid grid-cols-3"><span className="text-slate-500">Alamat</span><span className="col-span-2">: {p.alamat || '-'}</span></div>
                <div className="grid grid-cols-3"><span className="text-slate-500">Pekerjaan</span><span className="col-span-2">: {p.pekerjaan || '-'}</span></div>
                {formFields.map((f) => (
                  <div key={f.name} className="grid grid-cols-3">
                    <span className="text-slate-500">{f.label}</span>
                    <span className="col-span-2 font-semibold">: {formData[f.name] || '-'}</span>
                  </div>
                ))}
              </div>

              {/* KLAUSUL TEMPLATE RESMI */}
              <div className="my-4 p-3 bg-slate-50 rounded border border-slate-200 text-justify">
                <p>
                  Berdasarkan basis data kependudukan dan hasil verifikasi berkas permohonan, yang bersangkutan <b>{templateNaskah}</b>
                </p>
              </div>

              <p className="mb-6 text-justify">
                Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
              </p>

              {/* TANDA TANGAN */}
              <div className="flex justify-end pt-2 font-sans text-xs text-right">
                <div>
                  <div>Sukamaju, {d.surat?.terbit_at ? tg(d.surat.terbit_at) : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  <div className="font-bold mt-0.5">Lurah Sukamaju</div>
                  <div className="my-3 flex justify-end">
                    {s === 'issued' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded border border-emerald-300">
                        [TTE Disahkan • QR Code Valid]
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-800 font-medium px-2 py-1 rounded border border-amber-200">
                        [Menunggu ACC & TTE Lurah]
                      </span>
                    )}
                  </div>
                  <div className="font-bold underline">{d.surat?.lurah_nama || 'Drs. Hadi Purnomo, M.Si'}</div>
                  <div className="text-[10px] text-slate-500">NIP. 19750812 200212 1 003</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {s === 'approved' && !d.surat && (
        <div className="rounded-xl border border-blue-300 bg-blue-50/70 p-5 shadow-sm">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Icon name="check" className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-blue-950 uppercase tracking-wide">
              Persetujuan Lurah Diberikan (Menunggu Penerbitan Berkas)
            </h3>
          </div>
          <p className="text-xs text-blue-800 leading-relaxed mb-4">
            Lurah Sukamaju telah memberikan persetujuan ACC. Klik tombol di bawah untuk menerbitkan berkas PDF resmi ber-QR Code.
          </p>
          {['petugas', 'lurah', 'admin'].includes(r) && (
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-2 px-4 shadow-sm"
              onClick={() => act('terbitkan')}
              disabled={loadingAct}
            >
              <Icon name="file" className="w-4 h-4" />
              <span>{loadingAct ? 'Menerbitkan…' : 'Terbitkan Dokumen Resmi Sekarang'}</span>
            </button>
          )}
        </div>
      )}

      {s === 'rejected' && (
        <div className="rounded-xl border border-rose-300 bg-rose-50/80 p-5 shadow-sm">
          <div className="flex items-center gap-2.5 mb-3 border-b border-rose-200 pb-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white">
              <Icon name="alert" className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-rose-950 uppercase tracking-wide">
              Pemberitahuan: Permohonan Tidak Dapat Disetujui
            </h3>
          </div>
          <div className="bg-white p-3.5 rounded-lg border border-rose-200 text-xs text-rose-900 mb-3">
            <div className="font-semibold text-slate-500 text-[11px] mb-1">Alasan Penolakan:</div>
            <p className="font-bold text-rose-800">{p.catatan || 'Dokumen persyaratan tidak memenuhi ketentuan administrasi yang berlaku.'}</p>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed">
            Silakan ajukan permohonan baru dengan berkas persyaratan yang lengkap dan valid, atau kunjungi kantor Kelurahan Sukamaju untuk informasi lebih lanjut.
          </p>
        </div>
      )}

      {s === 'revision_required' && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-5 shadow-sm">
          <div className="flex items-center gap-2.5 mb-3 border-b border-amber-200 pb-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-600 text-white">
              <Icon name="alert" className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-amber-950 uppercase tracking-wide">
              Pemberitahuan: Diperlukan Perbaikan Dokumen Persyaratan
            </h3>
          </div>
          <div className="bg-white p-3.5 rounded-lg border border-amber-200 text-xs text-amber-900 mb-3">
            <div className="font-semibold text-slate-500 text-[11px] mb-1">Catatan Petugas Pemeriksa:</div>
            <p className="font-bold text-amber-800">{p.catatan || 'Mohon lengkapi dan unggah kembali dokumen persyaratan yang diminta.'}</p>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Pilih berkas baru pada daftar dokumen di bawah ini, lalu klik tombol "Kirim Dokumen Revisi" agar petugas dapat memproses ulang.
          </p>
        </div>
      )}

      {/* ── RINCIAN FORMULIR PERMOHONAN ── */}
      <Card title="Data Formulir Permohonan">
        <dl className="grid gap-3 text-xs sm:grid-cols-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
          <div>
            <dt className="text-slate-400 font-medium">Jenis Surat Keterangan:</dt>
            <dd className="font-bold text-slate-900 mt-0.5">{p.jenis} ({p.jkode})</dd>
          </div>
          <div>
            <dt className="text-slate-400 font-medium">Nama Pemohon (Warga):</dt>
            <dd className="font-bold text-slate-900 mt-0.5">{p.pemohon}</dd>
          </div>
          <div>
            <dt className="text-slate-400 font-medium">Nomor Induk Kependudukan (NIK):</dt>
            <dd className="font-mono font-bold text-slate-900 mt-0.5">{maskId(p.nik)}</dd>
          </div>
          <div>
            <dt className="text-slate-400 font-medium">Tanggal Pengajuan Masuk:</dt>
            <dd className="font-bold text-slate-900 mt-0.5">{tg(p.created_at)}</dd>
          </div>
          {formFields.map((f) => (
            <div key={f.name}>
              <dt className="text-slate-400 font-medium">{f.label}:</dt>
              <dd className="font-semibold text-slate-800 mt-0.5">{formData[f.name] || '-'}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {/* ── DOKUMEN PERSYARATAN ── */}
      <Card title="Dokumen Lampiran Persyaratan">
        <div className="divide-y divide-slate-100 text-xs">
          {(d.syarat || []).map((sy) => {
            const dk = (d.dokumen || []).find((x) => x.persyaratan_id === sy.id);
            return (
              <div key={sy.id} className="py-2.5 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-slate-800">{sy.nama}</div>
                  {sy.keterangan && <div className="text-[11px] text-slate-400">{sy.keterangan}</div>}
                </div>
                <div className="flex items-center gap-3">
                  {dk ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 font-bold text-brand-700 hover:underline bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200"
                      onClick={() => viewPdf('/dokumen/' + dk.id + '/file')}
                    >
                      <Icon name="file" className="w-3.5 h-3.5" />
                      <span>{dk.nama_file}</span>
                    </button>
                  ) : (
                    <span className="text-rose-600 font-semibold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 text-[11px]">
                      Belum Diunggah
                    </span>
                  )}
                  {canRev && (
                    <input
                      type="file"
                      className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:bg-brand-600 file:text-white"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setFiles({ ...files, ['doc_' + sy.id]: e.target.files[0] })}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {canRev && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
            <button className="btn btn-p text-xs py-2 px-4" onClick={rev} disabled={loadingAct}>
              {loadingAct ? 'Mengirim…' : 'Kirim Berkas Revisi'}
            </button>
          </div>
        )}
      </Card>

      {/* ── RIWAYAT TAHAPAN & AUDIT ── */}
      <Card title="Riwayat Verifikasi & Catatan Pelayanan">
        <Table
          head={['Waktu', 'Tahapan', 'Hasil Keputusan', 'Pejabat Pemeriksa', 'Catatan Resmi']}
          rows={(d.riwayat || []).map((x) => [
            tg(x.created_at),
            x.tipe,
            <span key="h" className="capitalize font-semibold text-slate-800">{x.hasil}</span>,
            x.oleh,
            x.catatan || '-'
          ])}
        />
      </Card>

      <Msg m={m} />

      {/* ── ACTION BAR UNTUK PETUGAS & LURAH ── */}
      {['petugas', 'lurah', 'admin'].includes(r) && (
        <Card title="Tindakan Keputusan Petugas / Lurah">
          <div className="space-y-3">
            {['under_review', 'pending_approval'].includes(s) && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Instruksi Resmi untuk Pemohon:
                </label>
                <input
                  className="inp text-xs"
                  placeholder="Masukkan catatan alasan perbaikan, disposisi, atau keterangan tambahan…"
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 pt-2">
              {r === 'petugas' && s === 'submitted' && (
                <button className="btn btn-p text-xs py-2.5 px-4 font-bold" onClick={() => act('mulai')} disabled={loadingAct}>
                  Mulai Periksa Berkas Permohonan
                </button>
              )}
              {r === 'petugas' && s === 'under_review' && (
                <>
                  <button className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2.5 px-4 font-bold shadow-sm" onClick={() => act('verifikasi', { hasil: 'lengkap', catatan: cat })} disabled={loadingAct}>
                    ✓ Lengkap (Teruskan ke Lurah)
                  </button>
                  <button className="btn bg-amber-500 hover:bg-amber-600 text-white text-xs py-2.5 px-4 font-bold shadow-sm" onClick={() => act('verifikasi', { hasil: 'revisi', catatan: cat })} disabled={loadingAct}>
                    Minta Revisi Dokumen
                  </button>
                  <button className="btn btn-d text-xs py-2.5 px-4 font-bold" onClick={() => act('verifikasi', { hasil: 'ditolak', catatan: cat })} disabled={loadingAct}>
                    ✕ Tolak Pengajuan
                  </button>
                </>
              )}
              {r === 'lurah' && s === 'pending_approval' && (
                <>
                  <button className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2.5 px-5 font-bold shadow-sm" onClick={() => act('persetujuan', { hasil: 'setuju', catatan: cat })} disabled={loadingAct}>
                    ✓ Berikan Persetujuan (ACC Lurah) & Terbitkan Surat
                  </button>
                  <button className="btn btn-d text-xs py-2.5 px-4 font-bold" onClick={() => act('persetujuan', { hasil: 'tolak', catatan: cat })} disabled={loadingAct}>
                    ✕ Tolak Pengajuan
                  </button>
                </>
              )}
              {['petugas', 'lurah', 'admin'].includes(r) && (s === 'approved' || (!d.surat && s === 'issued')) && (
                <button className="btn btn-p text-xs py-2.5 px-4 font-bold" onClick={() => act('terbitkan')} disabled={loadingAct}>
                  Terbitkan Surat Resmi (PDF + QR)
                </button>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function WargaSuratList() {
  const [rows] = useGet('/surat-saya');
  if (!rows) return <p className="text-sm text-slate-400">Memuat…</p>;
  if (!rows.length) return (
    <div className="text-center py-4 text-slate-400">
      <span className="text-2xl block mb-1">📭</span>
      <p className="text-xs">Belum ada surat terbit.</p>
    </div>
  );
  return (
    <ul className="divide-y text-sm">
      {rows.slice(0, 3).map((s) => (
        <li key={s.id} className="flex items-center justify-between py-2.5 gap-2">
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-700 truncate text-xs">{s.jenis}</div>
            <div className="text-[11px] text-slate-400 font-mono">{s.nomor}</div>
          </div>
          <button
            className="btn btn-p text-[11px] py-1 px-2.5 flex-shrink-0"
            onClick={() => downloadPdf(`/pengajuan/${s.pengajuan_id}/surat`, `Surat-${s.nomor.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`)}
          >
            ⬇ Unduh
          </button>
        </li>
      ))}
    </ul>
  );
}

function SuratSaya() {
  const [rows] = useGet('/surat-saya');
  return (
    <Card
      title="Surat Saya (Dokumen Kependudukan Resmi)"
      subtitle="Daftar surat keterangan resmi yang telah disahkan Lurah dan diterbitkan untuk Anda"
    >
      {!(rows || []).length && rows !== null ? (
        <div className="py-12 text-center text-slate-400">
          <div className="flex justify-center mb-3 text-slate-300">
            <Icon name="file" className="w-12 h-12" />
          </div>
          <p className="text-sm font-semibold text-slate-600">Belum Ada Surat Keterangan yang Diterbitkan</p>
          <p className="text-xs mt-1 text-slate-400 max-w-sm mx-auto">
            Surat yang telah disetujui dan disahkan oleh Lurah akan otomatis tercatat di sini dan siap diunduh kapan saja.
          </p>
          <div className="mt-4">
            <Link to="/app/ajukan" className="btn btn-p text-xs py-2 px-4">
              Ajukan Permohonan Surat Sekarang
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(rows || []).map((s) => (
            <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                    {s.kode}
                  </span>
                  <span className="text-[11px] text-slate-400">{tg(s.terbit_at)}</span>
                </div>
                <h4 className="text-base font-bold text-slate-900">{s.jenis}</h4>
                <div className="font-mono text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-sans">Nomor Dokumen:</span>
                  {s.nomor}
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  Penandatangan: <b>{s.lurah_nama || 'Lurah Sukamaju'}</b> ({s.lurah_jabatan || 'Lurah'})
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 shadow-sm transition-colors"
                  onClick={() => downloadPdf(`/pengajuan/${s.pengajuan_id}/surat`, `Surat-${s.nomor.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`)}
                >
                  <Icon name="download" className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs py-2 px-2.5 transition-colors"
                  onClick={() => viewPdf(`/pengajuan/${s.pengajuan_id}/surat`)}
                  title="Pratinjau Dokumen"
                >
                  <Icon name="eye" className="w-3.5 h-3.5" />
                </button>
                <Link
                  to={`/app/pengajuan/${s.pengajuan_id}`}
                  className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors"
                >
                  Detail
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ====================================================================
   FITUR PERSURATAN DINAS: SURAT MASUK, DISPOSISI LURAH & SURAT BALASAN
   ==================================================================== */

const ST_SM = {
  menunggu_disposisi: 'Menunggu Disposisi',
  didisposisi: 'Didisposisi Lurah',
  dibalas: 'Selesai (Surat Dibalas)',
};

const COL_SM = {
  menunggu_disposisi: 'bg-amber-50 text-amber-800 border border-amber-200',
  didisposisi: 'bg-blue-50 text-blue-800 border border-blue-200',
  dibalas: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
};

const BadgeSM = ({ s }) => (
  <span className={'badge ' + (COL_SM[s] || 'bg-slate-100 text-slate-700')}>
    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70"></span>
    {ST_SM[s] || s}
  </span>
);

function SuratMasuk() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [rows, load] = useGet(`/surat-masuk?status=${filter}&q=${encodeURIComponent(q)}`);

  const [modalTambah, setModalTambah] = useState(false);
  const [selectedSurat, setSelectedSurat] = useState(null);
  const [detailData, setDetailData] = useState(null);

  // Form input surat masuk baru
  const [f, setF] = useState({
    nomor_surat: '',
    pengirim: '',
    tanggal_surat: new Date().toISOString().slice(0, 10),
    perihal: '',
    ringkasan_isi: '',
  });

  // Form disposisi lurah
  const [dispForm, setDispForm] = useState({
    tujuan_disposisi: 'Kasi Pelayanan & Petugas Loket',
    sifat: 'Biasa',
    arahan: '',
  });

  // Form surat balasan
  const [balasForm, setBalasForm] = useState({
    perihal: '',
    isi_surat: '',
  });

  const [loading, setLoading] = useState(false);
  const [m, setM] = useState();

  const loadDetail = async (id) => {
    try {
      const res = await api.get(`/surat-masuk/${id}`);
      setDetailData(res.data);
      setSelectedSurat(res.data.surat);
      setBalasForm({
        perihal: `Tanggapan / Balasan atas Surat Nomor: ${res.data.surat.nomor_surat}`,
        isi_surat: `Sehubungan dengan surat Saudara Nomor ${res.data.surat.nomor_surat} perihal "${res.data.surat.perihal}", bersama ini kami sampaikan bahwa Kelurahan Sukamaju telah menindaklanjuti hal tersebut sesuai dengan ketentuan yang berlaku.`,
      });
    } catch (err) {
      alert(em(err));
    }
  };

  const handleSimpanSuratMasuk = async (e) => {
    e.preventDefault();
    setLoading(true);
    setM(null);
    try {
      await api.post('/surat-masuk', f);
      setModalTambah(false);
      setF({
        nomor_surat: '',
        pengirim: '',
        tanggal_surat: new Date().toISOString().slice(0, 10),
        perihal: '',
        ringkasan_isi: '',
      });
      load();
    } catch (x) {
      setM({ t: em(x) });
    } finally {
      setLoading(false);
    }
  };

  const handleSimpanDisposisi = async (e) => {
    e.preventDefault();
    if (!dispForm.arahan.trim()) return alert('Arahan/instruksi Lurah wajib diisi');
    setLoading(true);
    try {
      await api.post(`/surat-masuk/${selectedSurat.id}/disposisi`, dispForm);
      setDispForm({ tujuan_disposisi: 'Kasi Pelayanan & Petugas Loket', sifat: 'Biasa', arahan: '' });
      await loadDetail(selectedSurat.id);
      load();
    } catch (x) {
      alert(em(x));
    } finally {
      setLoading(false);
    }
  };

  const handleKirimBalasan = async (e) => {
    e.preventDefault();
    if (!balasForm.isi_surat.trim()) return alert('Isi surat balasan wajib diisi');
    setLoading(true);
    try {
      await api.post(`/surat-masuk/${selectedSurat.id}/balas`, balasForm);
      alert('Surat balasan kedinasan resmi berhasil dibuat dan diarsipkan!');
      await loadDetail(selectedSurat.id);
      load();
    } catch (x) {
      alert(em(x));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card
        title="Buku Agenda Surat Masuk & Lembar Disposisi"
        subtitle="Pencatatan surat masuk kedinasan, tindak lanjut instruksi Lurah, dan penerbitan surat balasan resmi"
        rightAction={
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="inp text-xs py-1.5"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="menunggu_disposisi">⏳ Menunggu Disposisi</option>
              <option value="didisposisi">📋 Telah Didisposisi</option>
              <option value="dibalas">✅ Telah Dibalas / Selesai</option>
            </select>
            <input
              className="inp text-xs py-1.5 max-w-xs"
              placeholder="Cari surat / pengirim..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {['petugas', 'admin'].includes(user?.role) && (
              <button
                className="btn btn-p text-xs py-1.5 font-bold"
                onClick={() => setModalTambah(true)}
              >
                + Catat Surat Masuk
              </button>
            )}
          </div>
        }
      >
        <Table
          head={['Nomor Surat', 'Asal Pengirim', 'Perihal & Tanggal', 'Status Disposisi', 'Surat Balasan', 'Tindakan']}
          rows={(rows || []).map((r) => [
            <b key="no" className="font-mono text-xs text-slate-900">{r.nomor_surat}</b>,
            <span key="p" className="text-xs font-semibold text-slate-800">{r.pengirim}</span>,
            <div key="per">
              <div className="text-xs font-medium text-slate-800 leading-tight">{r.perihal}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Tgl Surat: {tg(r.tanggal_surat)}</div>
            </div>,
            <BadgeSM key="st" s={r.status} />,
            r.nomor_surat_balasan ? (
              <span key="sb" className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {r.nomor_surat_balasan}
              </span>
            ) : (
              <span key="sb" className="text-[11px] text-slate-400 italic">Belum dibalas</span>
            ),
            <button
              key="act"
              className="btn btn-o text-xs py-1 px-2.5 font-semibold text-navy hover:border-navy"
              onClick={() => loadDetail(r.id)}
            >
              Lihat Detail & Disposisi →
            </button>,
          ])}
        />
      </Card>

      {/* MODAL CATAT SURAT MASUK */}
      {modalTambah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-lg shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-900 text-base">Catat Surat Masuk Kedinasan Baru</h3>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setModalTambah(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSimpanSuratMasuk} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field l="Nomor Surat Dari Pengirim" req>
                  <input
                    className="inp"
                    required
                    placeholder="Contoh: 005/142/KEC/2026"
                    value={f.nomor_surat}
                    onChange={(e) => setF({ ...f, nomor_surat: e.target.value })}
                  />
                </Field>
                <Field l="Tanggal Surat Pengirim" req>
                  <input
                    className="inp"
                    type="date"
                    required
                    value={f.tanggal_surat}
                    onChange={(e) => setF({ ...f, tanggal_surat: e.target.value })}
                  />
                </Field>
              </div>

              <Field l="Instansi / Asal Pengirim Surat" req>
                <input
                  className="inp"
                  required
                  placeholder="Contoh: Kantor Kecamatan Contoh / Pengurus RW 03"
                  value={f.pengirim}
                  onChange={(e) => setF({ ...f, pengirim: e.target.value })}
                />
              </Field>

              <Field l="Perihal Surat" req>
                <input
                  className="inp"
                  required
                  placeholder="Contoh: Undangan Rapat Koordinasi Wilayah"
                  value={f.perihal}
                  onChange={(e) => setF({ ...f, perihal: e.target.value })}
                />
              </Field>

              <Field l="Ringkasan Isi / Catatan Surat">
                <textarea
                  className="inp"
                  rows={3}
                  placeholder="Tuliskan ringkasan pokok isi surat masuk..."
                  value={f.ringkasan_isi}
                  onChange={(e) => setF({ ...f, ringkasan_isi: e.target.value })}
                />
              </Field>

              <Msg m={m} />

              <div className="mt-4 flex justify-end gap-2 pt-2 border-t">
                <button type="button" className="btn btn-o text-xs" onClick={() => setModalTambah(false)}>
                  Batal
                </button>
                <button className="btn btn-p text-xs font-bold" disabled={loading}>
                  {loading ? 'Menyimpan…' : 'Simpan Surat Masuk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL SURAT MASUK, DISPOSISI LURAH & PEMBUATAN SURAT BALASAN */}
      {selectedSurat && detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="card w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 bg-white space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-xs uppercase font-bold text-slate-400">Arsip Persuratan Kelurahan</span>
                <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                  Surat Masuk: {selectedSurat.nomor_surat}
                </h3>
              </div>
              <button
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                onClick={() => {
                  setSelectedSurat(null);
                  setDetailData(null);
                }}
              >
                ✕
              </button>
            </div>

            {/* Data Surat Masuk */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs space-y-2">
              <div className="grid sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block">Asal Pengirim:</span>
                  <b className="text-slate-900 text-sm">{selectedSurat.pengirim}</b>
                </div>
                <div>
                  <span className="text-slate-400 block">Status Surat:</span>
                  <BadgeSM s={selectedSurat.status} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/80">
                <div>
                  <span className="text-slate-400 block">Perihal:</span>
                  <b className="text-slate-800">{selectedSurat.perihal}</b>
                </div>
                <div>
                  <span className="text-slate-400 block">Tanggal Surat & Diterima:</span>
                  <span>{tg(selectedSurat.tanggal_surat)} (Dicatat: {tg(selectedSurat.created_at)})</span>
                </div>
              </div>

              {selectedSurat.ringkasan_isi && (
                <div className="pt-2 border-t border-slate-200/80">
                  <span className="text-slate-400 block mb-1">Ringkasan Isi Surat:</span>
                  <p className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
                    {selectedSurat.ringkasan_isi}
                  </p>
                </div>
              )}
            </div>

            {/* LEMBAR DISPOSISI LURAH */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
              <div className="flex items-center justify-between mb-3 border-b border-blue-200/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📋</span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Lembar Disposisi Resmi Lurah</h4>
                    <p className="text-[11px] text-slate-500">Instruksi arahan pimpinan kelurahan untuk tindak lanjut</p>
                  </div>
                </div>
              </div>

              {/* Riwayat Disposisi yang sudah ada */}
              {(detailData.disposisi || []).length > 0 ? (
                <div className="space-y-2 mb-3">
                  {detailData.disposisi.map((dp) => (
                    <div key={dp.id} className="rounded-lg bg-white p-3 border border-blue-200/80 text-xs shadow-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-900">
                          Tujuan: <span className="text-navy">{dp.tujuan_disposisi}</span>
                        </span>
                        <span className="rounded bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5">
                          Sifat: {dp.sifat}
                        </span>
                      </div>
                      <div className="text-slate-700 italic my-1.5 p-2 bg-slate-50 rounded border border-slate-100">
                        "{dp.arahan}"
                      </div>
                      <div className="text-[10px] text-slate-400 text-right">
                        Disposisi oleh: {dp.lurah_nama || 'Lurah Sukamaju'} • {tg(dp.tanggal_disposisi)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic mb-3">Belum ada lembar disposisi dari Lurah.</p>
              )}

              {/* Form Input Disposisi bagi Lurah */}
              {user?.role === 'lurah' && (
                <form onSubmit={handleSimpanDisposisi} className="space-y-3 bg-white p-3.5 rounded-lg border border-blue-200">
                  <span className="text-xs font-bold text-navy block">+ Berikan Instruksi Disposisi Baru</span>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <Field l="Diteruskan / Ditujukan Kepada" req>
                      <select
                        className="inp text-xs"
                        value={dispForm.tujuan_disposisi}
                        onChange={(e) => setDispForm({ ...dispForm, tujuan_disposisi: e.target.value })}
                      >
                        <option value="Kasi Pelayanan & Petugas Loket">Kasi Pelayanan & Petugas Loket</option>
                        <option value="Kasi Pemerintahan & Ketentraman">Kasi Pemerintahan & Ketentraman</option>
                        <option value="Kasi Kesejahteraan Masyarakat">Kasi Kesejahteraan Masyarakat</option>
                        <option value="Sekretaris Kelurahan">Sekretaris Kelurahan</option>
                      </select>
                    </Field>
                    <Field l="Sifat Disposisi" req>
                      <select
                        className="inp text-xs"
                        value={dispForm.sifat}
                        onChange={(e) => setDispForm({ ...dispForm, sifat: e.target.value })}
                      >
                        <option value="Biasa">Biasa</option>
                        <option value="Penting">Penting</option>
                        <option value="Segera">Segera (Prioritas)</option>
                        <option value="Rahasia">Rahasia</option>
                      </select>
                    </Field>
                  </div>
                  <Field l="Instruksi / Arahan Tindak Lanjut" req>
                    <textarea
                      className="inp text-xs"
                      rows={2}
                      placeholder="Contoh: Segera pelajari dan buatkan surat balasan resmi konfirmasi kehadiran."
                      value={dispForm.arahan}
                      onChange={(e) => setDispForm({ ...dispForm, arahan: e.target.value })}
                    />
                  </Field>
                  <button className="btn btn-p text-xs py-2 font-bold w-full" disabled={loading}>
                    Simpan Lembar Disposisi Lurah
                  </button>
                </form>
              )}
            </div>

            {/* BAGIAN PENGERJAAN SURAT BALASAN RESMI KEDINASAN */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
              <div className="flex items-center justify-between mb-3 border-b border-emerald-200/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📨</span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Surat Balasan / Jawaban Resmi Kelurahan</h4>
                    <p className="text-[11px] text-slate-500">Penerbitan surat dinas keluar resmi balasan atas surat masuk ini</p>
                  </div>
                </div>
              </div>

              {/* Daftar Balasan yang telah dikerjakan */}
              {(detailData.balasan || []).length > 0 ? (
                <div className="space-y-2 mb-3">
                  {detailData.balasan.map((b) => (
                    <div key={b.id} className="rounded-lg bg-white p-3.5 border border-emerald-200 text-xs shadow-sm space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <div>
                          <span className="font-mono font-bold text-navy text-xs">{b.nomor_surat}</span>
                          <span className="text-slate-500 block text-[11px]">Kepada: {b.tujuan}</span>
                        </div>
                        <button
                          className="btn bg-emerald-700 text-white hover:bg-emerald-800 text-xs py-1 px-3 font-bold"
                          onClick={() => openBlob(`/surat-keluar/${b.id}/pdf`)}
                        >
                          Unduh PDF Surat Balasan
                        </button>
                      </div>
                      <div className="text-slate-800 font-semibold">{b.perihal}</div>
                      <p className="bg-slate-50 p-2 rounded text-slate-600 leading-relaxed text-[11px]">
                        {b.isi_surat}
                      </p>
                      <div className="text-[10px] text-slate-400 text-right pt-1 border-t">
                        Dibuat: {tg(b.created_at)} • Penandatangan: {b.penandatangan || 'Lurah Sukamaju'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic mb-3">Belum ada surat balasan resmi yang dikerjakan.</p>
              )}

              {/* Form Pembuatan Surat Balasan */}
              {['petugas', 'lurah', 'admin'].includes(user?.role) && (
                <form onSubmit={handleKirimBalasan} className="space-y-3 bg-white p-3.5 rounded-lg border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 block">
                      Buat & Terbitkan Surat Balasan Resmi
                    </span>
                    <span className="text-[10px] text-slate-400">Format Dinas Resmi Ber-KOP Kelurahan Sukamaju</span>
                  </div>

                  <Field l="Perihal Surat Balasan" req>
                    <input
                      className="inp text-xs"
                      required
                      value={balasForm.perihal}
                      onChange={(e) => setBalasForm({ ...balasForm, perihal: e.target.value })}
                    />
                  </Field>

                  <Field l="Isi Redaksi Surat Balasan Resmi" req>
                    <textarea
                      className="inp text-xs"
                      rows={4}
                      required
                      placeholder="Tuliskan isi kalimat jawaban/tanggapan resmi dari Kelurahan Sukamaju..."
                      value={balasForm.isi_surat}
                      onChange={(e) => setBalasForm({ ...balasForm, isi_surat: e.target.value })}
                    />
                  </Field>

                  <button className="btn bg-emerald-700 text-white hover:bg-emerald-800 text-xs py-2 font-bold w-full" disabled={loading}>
                    {loading ? 'Menerbitkan Dokumen PDF…' : 'Terbitkan & Arsipkan Surat Balasan Resmi (PDF)'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SuratKeluar() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [rows, load] = useGet(`/surat-keluar?q=${encodeURIComponent(q)}`);
  const [showModal, setShowModal] = useState(false);
  const [f, setF] = useState({ tujuan: '', perihal: '', isi_surat: '' });
  const [loading, setLoading] = useState(false);
  const [m, setM] = useState();

  const handleBuatSurat = async (e) => {
    e.preventDefault();
    setLoading(true);
    setM(null);
    try {
      const res = await api.post('/surat-keluar', f);
      setF({ tujuan: '', perihal: '', isi_surat: '' });
      setShowModal(false);
      alert(`Surat dinas resmi berhasil diterbitkan dengan nomor: ${res.data.nomor_surat}`);
      load();
    } catch (err) {
      setM({ t: em(err) });
    } finally {
      setLoading(false);
    }
  };

  const isPejabat = ['lurah', 'petugas', 'admin'].includes(user?.role);

  return (
    <div className="space-y-4">
      <Card
        title="Buku Agenda Surat Keluar & Surat Dinas Kelurahan"
        subtitle="Daftar surat dinas resmi dan surat balasan yang diterbitkan serta ditandatangani oleh Lurah Sukamaju"
        rightAction={
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="inp text-xs py-1.5 max-w-xs"
              placeholder="Cari nomor, tujuan, perihal..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {isPejabat && (
              <button
                type="button"
                className="btn btn-p text-xs py-1.5 px-3.5 font-bold flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                onClick={() => { setShowModal(true); setM(null); }}
              >
                <span>+ Buat Surat Dinas / Keluar</span>
              </button>
            )}
          </div>
        }
      >
        <Table
          head={['Nomor Surat Keluar', 'Kepada / Tujuan', 'Perihal Surat Dinas', 'Tanggal Terbit', 'Terkait Surat Masuk', 'Dokumen PDF']}
          rows={(rows || []).map((r) => [
            <b key="no" className="font-mono text-xs text-navy">{r.nomor_surat}</b>,
            <span key="tj" className="text-xs font-semibold text-slate-800">{r.tujuan}</span>,
            <div key="per">
              <div className="text-xs font-medium text-slate-800 leading-tight">{r.perihal}</div>
              <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{r.isi_surat}</div>
            </div>,
            <span key="tg" className="text-xs">{tg(r.tanggal_surat || r.created_at)}</span>,
            r.nomor_surat_masuk ? (
              <span key="sm" className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {r.nomor_surat_masuk}
              </span>
            ) : (
              <span key="sm" className="text-[11px] text-brand-700 bg-blue-50 px-2 py-0.5 rounded font-medium">Inisiatif Lurah</span>
            ),
            <button
              key="pdf"
              className="btn bg-emerald-700 text-white hover:bg-emerald-800 text-xs py-1 px-3 font-bold shadow-sm"
              onClick={() => downloadPdf(`/surat-keluar/${r.id}/pdf`, `Surat-Keluar-${r.nomor_surat.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`)}
            >
              Unduh PDF
            </button>,
          ])}
        />
      </Card>

      {/* MODAL PEMBUATAN SURAT DINAS / SURAT KELUAR RESMI OLEH LURAH / PETUGAS */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in-scale">
          <div className="card w-full max-w-xl shadow-2xl border border-slate-200">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Icon name="file" className="w-4 h-4 text-brand-600" />
                  <span>Buat Surat Dinas / Surat Keluar Resmi</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Diterbitkan dengan KOP resmi Kelurahan Sukamaju & disahkan oleh Lurah
                </p>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-sm"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBuatSurat} className="space-y-3.5">
              <Field l="Tujuan / Penerima Surat Dinas" req hint="Contoh: Seluruh Ketua RW/RT se-Kelurahan Sukamaju / Camat Sukamaju / Warga Lingkungan RW 02">
                <input
                  className="inp text-xs"
                  required
                  placeholder="Nama instansi, pejabat, atau kelompok masyarakat penerima..."
                  value={f.tujuan}
                  onChange={(e) => setF({ ...f, tujuan: e.target.value })}
                />
              </Field>

              <Field l="Perihal Surat Dinas" req hint="Contoh: Undangan Rapat Koordinasi Wilayah / Surat Edaran Kebersihan / Surat Pemberitahuan Pelayanan">
                <input
                  className="inp text-xs"
                  required
                  placeholder="Hal / judul pokok surat dinas..."
                  value={f.perihal}
                  onChange={(e) => setF({ ...f, perihal: e.target.value })}
                />
              </Field>

              <Field l="Isi Redaksi Naskah Surat Dinas Resmi" req hint="Tuliskan isi kalimat instruksi, pengumuman, atau keterangan resmi secara lengkap">
                <textarea
                  className="inp text-xs font-serif leading-relaxed"
                  rows={6}
                  required
                  placeholder="Sehubungan dengan rencana pelaksanaan kegiatan kerja bakti lingkungan di wilayah Kelurahan Sukamaju, bersama ini kami sampaikan kepada seluruh warga..."
                  value={f.isi_surat}
                  onChange={(e) => setF({ ...f, isi_surat: e.target.value })}
                />
              </Field>

              <div className="rounded-lg bg-blue-50 border border-blue-200/80 p-3 text-[11px] text-blue-900 leading-relaxed">
                <b>Pengesahan Otomatis:</b> Dokumen fisik PDF akan otomatis dibubuhi KOP Resmi Pemerintah Kota & Kelurahan Sukamaju, Nomor Registrasi Agenda Keluar, serta blok tanda tangan resmi Lurah Sukamaju.
              </div>

              <Msg m={m} />

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  className="btn btn-o text-xs"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>
                <button
                  className="btn btn-p text-xs font-bold py-2.5 px-4 shadow-sm"
                  disabled={loading}
                >
                  {loading ? 'Menerbitkan Dokumen PDF…' : '✓ Terbitkan & Tandatangani Surat Dinas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


function Arsip() {
  const [q, setQ] = useState('');
  const [rows] = useGet('/arsip?q=' + encodeURIComponent(q));
  return (
    <Card
      title="Arsip Surat Kelurahan"
      subtitle="Daftar surat resmi yang telah disetujui dan diterbitkan"
      rightAction={
        <input
          className="inp text-xs py-1 max-w-xs"
          placeholder="Cari nomor, pemohon, jenis surat..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      }
    >
      <Table
        head={['Nomor Surat', 'Jenis Dokumen', 'Pemohon', 'Tanggal Terbit', 'Aksi']}
        rows={(rows || []).map((r) => [
          <b key="no" className="text-navy text-xs">{r.nomor}</b>,
          r.jenis,
          r.pemohon,
          tg(r.terbit_at),
          <button key="d" className="text-navy font-bold underline text-xs" onClick={() => openBlob(`/pengajuan/${r.pengajuan_id}/surat`)}>
            Unduh PDF
          </button>,
        ])}
      />
    </Card>
  );
}

function Profil() {
  const [me] = useGet('/me');
  const [f, setF] = useState(null);
  const [m, setM] = useState();

  useEffect(() => {
    if (me && me.nama && !f) setF({ ...me });
  }, [me, f]);

  if (!f) return <p className="text-sm text-slate-500">Memuat profil…</p>;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.put('/profil', f);
      setM({ ok: 1, t: 'Profil berhasil diperbarui.' });
    } catch (x) {
      setM({ t: em(x) });
    }
  };

  return (
    <Card title="Profil Kependudukan Saya" subtitle="Periksa dan perbarui data profil Anda">
      <form onSubmit={save} className="space-y-3">
        <div className="rounded-lg bg-slate-50 p-3 text-xs border space-y-1">
          <p><span className="text-slate-400">NIK (Tersensor):</span> <b>{f.nik_masked || maskId(f.nik)}</b></p>
          <p><span className="text-slate-400">No. KK (Tersensor):</span> <b>{f.no_kk_masked || maskId(f.no_kk)}</b></p>
          <p><span className="text-slate-400">Status Akun:</span> <BadgeWarga s={f.status_verifikasi} /></p>
        </div>

        <Field l="Nama Lengkap" req>
          <input className="inp" required value={f.nama || ''} onChange={set('nama')} />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field l="Tempat Lahir">
            <input className="inp" value={f.tempat_lahir || ''} onChange={set('tempat_lahir')} />
          </Field>
          <Field l="Tanggal Lahir">
            <input
              className="inp"
              type="date"
              value={(f.tanggal_lahir || '').slice(0, 10)}
              onChange={set('tanggal_lahir')}
            />
          </Field>
        </div>

        <Field l="Alamat Lengkap" req>
          <textarea className="inp" rows={2} required value={f.alamat || ''} onChange={set('alamat')} />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field l="Pekerjaan">
            <input className="inp" value={f.pekerjaan || ''} onChange={set('pekerjaan')} />
          </Field>
          <Field l="Nomor HP / WhatsApp">
            <input className="inp" value={f.telepon || ''} onChange={set('telepon')} />
          </Field>
        </div>

        <Msg m={m} />

        <button className="btn btn-p">Simpan Perubahan Profil</button>
      </form>
    </Card>
  );
}

function Notifikasi() {
  const [n, load] = useGet('/notifikasi');
  const [loading, setLoading] = useState(false);

  const tandaiDibaca = async () => {
    try {
      await api.post('/notifikasi/baca');
      load();
    } catch (e) {
      alert(em(e));
    }
  };

  const hapusSatu = async (id) => {
    try {
      await api.delete(`/notifikasi/${id}`);
      load();
    } catch (e) {
      alert(em(e));
    }
  };

  const bersihkanSemua = async () => {
    if (!window.confirm('Yakin ingin menghapus seluruh riwayat notifikasi?')) return;
    setLoading(true);
    try {
      await api.delete('/notifikasi');
      load();
    } catch (e) {
      alert(em(e));
    } finally {
      setLoading(false);
    }
  };

  const list = n || [];
  const adaBelumDibaca = list.some((x) => !x.dibaca);

  return (
    <Card
      title="Pusat Notifikasi & Pemberitahuan"
      subtitle="Riwayat pemberitahuan status verifikasi berkas dan penerbitan surat Anda"
      rightAction={
        list.length > 0 && (
          <div className="flex items-center gap-2">
            {adaBelumDibaca && (
              <button
                type="button"
                className="btn btn-o text-xs py-1.5 px-3"
                onClick={tandaiDibaca}
              >
                Tandai Dibaca
              </button>
            )}
            <button
              type="button"
              className="btn btn-o text-rose-600 hover:bg-rose-50 hover:border-rose-300 text-xs py-1.5 px-3 font-medium transition-colors"
              onClick={bersihkanSemua}
              disabled={loading}
            >
              Bersihkan Semua
            </button>
          </div>
        )
      }
    >
      <ul className="divide-y divide-slate-100 text-xs">
        {list.length ? (
          list.map((x) => (
            <li
              key={x.id}
              className={`py-3 px-3 rounded-xl transition-colors flex items-start justify-between gap-3 group ${
                x.dibaca ? 'text-slate-600 hover:bg-slate-50/70' : 'font-semibold text-slate-900 bg-blue-50/40 hover:bg-blue-50/70 border border-blue-100/60'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${x.dibaca ? 'bg-slate-300' : 'bg-brand-600'}`} />
                <div className="min-w-0">
                  <p className="leading-snug break-words">{x.pesan}</p>
                  <div className="text-[10px] font-normal text-slate-400 mt-1">{tg(x.created_at)}</div>
                </div>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg opacity-70 group-hover:opacity-100 hover:bg-rose-50 transition-all flex-shrink-0"
                title="Hapus notifikasi ini"
                onClick={() => hapusSatu(x.id)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </li>
          ))
        ) : (
          <li className="py-8 text-center text-slate-400">
            <div className="flex flex-col items-center justify-center gap-1.5">
              <Icon name="inbox" className="w-8 h-8 text-slate-300" />
              <span className="text-xs font-medium">Tidak ada notifikasi aktif saat ini.</span>
            </div>
          </li>
        )}
      </ul>
    </Card>
  );
}

/**
 * MANAJEMEN PENGGUNA (ADMINISTRATOR)
 * Pendaftaran Akun Pemerintahan (Petugas, Lurah, Admin) dengan password sementara.
 */
function Pengguna() {
  const [u, load] = useGet('/admin/users');
  const [f, setF] = useState({
    nama: '',
    username: '',
    nip: '',
    jabatan: '',
    telepon: '',
    email: '',
    password_sementara: '',
    role: 'petugas',
  });
  const [m, setM] = useState();

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const add = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', f);
      setM({ ok: 1, t: `Akun kedinasan ${f.role} (${f.nama}) berhasil dibuat.` });
      setF({
        nama: '',
        username: '',
        nip: '',
        jabatan: '',
        telepon: '',
        email: '',
        password_sementara: '',
        role: 'petugas',
      });
      load();
    } catch (x) {
      setM({ t: em(x) });
    }
  };

  const tog = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/aktif`);
      load();
    } catch (x) {
      setM({ t: em(x) });
    }
  };

  return (
    <div className="space-y-4">
      <Card
        title="Tambah Akun Pemerintahan (Kedinasan)"
        subtitle="Akun Petugas, Lurah, dan Admin dibuat resmi oleh Administrator dengan password sementara."
      >
        <form onSubmit={add} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field l="Nama Lengkap & Gelar" req>
              <input className="inp" required placeholder="Contoh: Siti Rohmah, S.AP" value={f.nama} onChange={set('nama')} />
            </Field>
            <Field l="NIP / Username Kedinasan" req>
              <input className="inp" required placeholder="Contoh: 198505122010012003" value={f.username} onChange={set('username')} />
            </Field>
            <Field l="Peran / Role" req>
              <select className="inp" value={f.role} onChange={set('role')}>
                <option value="petugas">Petugas Pelayanan</option>
                <option value="lurah">Lurah</option>
                <option value="admin">Administrator</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field l="Jabatan Resmi">
              <input className="inp" placeholder="Contoh: Petugas Loket" value={f.jabatan} onChange={set('jabatan')} />
            </Field>
            <Field l="Nomor HP Kedinasan">
              <input className="inp" placeholder="081234567890" value={f.telepon} onChange={set('telepon')} />
            </Field>
            <Field l="Email Kedinasan">
              <input className="inp" type="email" placeholder="pegawai@kelurahan.go.id" value={f.email} onChange={set('email')} />
            </Field>
          </div>

          <Field l="Password Sementara (Min. 8 Karakter)" req hint="Pengguna wajib mengganti password saat login perdana.">
            <input
              className="inp"
              type="text"
              required
              minLength={8}
              placeholder="Contoh: Sukamaju2026!"
              value={f.password_sementara}
              onChange={set('password_sementara')}
            />
          </Field>

          <Msg m={m} />

          <button className="btn btn-p font-bold">Buat Akun Kedinasan →</button>
        </form>
      </Card>

      <Card title="Daftar Pengguna Sistem SIPESUR">
        <Table
          head={['Nama', 'ID / Username', 'Jabatan / NIP', 'Role', 'Status', 'Aksi']}
          rows={(u || []).map((x) => [
            x.nama,
            <code key="u" className="text-xs bg-slate-100 px-1 py-0.5 rounded">{x.username || x.email}</code>,
            x.jabatan || x.nip || '-',
            <span key="r" className="font-bold capitalize text-navy">{x.role}</span>,
            x.aktif ? (
              <span key="s" className="text-emerald-700 font-bold text-xs">Aktif</span>
            ) : (
              <span key="s" className="text-red-600 font-bold text-xs">Nonaktif</span>
            ),
            <button key="t" className="text-navy text-xs underline font-semibold" onClick={() => tog(x.id)}>
              {x.aktif ? 'Nonaktifkan' : 'Aktifkan'}
            </button>,
          ])}
        />
      </Card>
    </div>
  );
}

function Jenis() {
  const [js, load] = useGet('/jenis-surat');
  const [f, setF] = useState({ kode: '', nama: '', template: '', fields: '' });
  const [ps, setPs] = useState({});
  const [m, setM] = useState();
  const [editTplId, setEditTplId] = useState(null);
  const [tplText, setTplText] = useState('');
  const [loadingTpl, setLoadingTpl] = useState(false);

  const call = async (fn) => {
    try {
      await fn();
      setM(null);
      load();
    } catch (x) {
      setM({ t: em(x) });
    }
  };

  const simpanTemplate = async (id) => {
    setLoadingTpl(true);
    try {
      await api.put(`/admin/jenis-surat/${id}/template`, { template: tplText });
      setEditTplId(null);
      setM({ ok: 1, t: 'Template naskah dinas resmi berhasil disimpan ke database.' });
      load();
    } catch (x) {
      setM({ t: em(x) });
    } finally {
      setLoadingTpl(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card
        title="Master Template & Tata Naskah Jenis Surat"
        subtitle="Kelola klausul template resmi, kolom formulir, dan persyaratan dokumen untuk setiap jenis surat kelurahan"
      >
        <div className="rounded-lg bg-blue-50/70 border border-blue-200 p-3.5 text-xs text-blue-900 mb-4">
          <b>ℹ️ Sumber Template Surat Kelurahan:</b>
          <p className="mt-1 leading-relaxed text-blue-800">
            Setiap jenis surat di bawah ini memiliki kalimat template resmi yang tersimpan di basis data kelurahan.
            Saat warga mengajukan surat dan disetujui Lurah, sistem secara otomatis menggabungkan template ini dengan identitas kependudukan pemohon serta membubuhkan QR Code Tanda Tangan Elektronik (TTE) Lurah.
          </p>
        </div>

        <form
          className="grid gap-3 border p-4 rounded-xl bg-slate-50/60"
          onSubmit={(e) => {
            e.preventDefault();
            call(async () => {
              await api.post('/admin/jenis-surat', f);
              setF({ kode: '', nama: '', template: '', fields: '' });
              setM({ ok: 1, t: 'Jenis surat baru berhasil ditambahkan.' });
            });
          }}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700">Tambah Jenis Surat Baru</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="inp text-xs" placeholder="Kode Surat (misal: SKD)" required value={f.kode} onChange={(e) => setF({ ...f, kode: e.target.value })} />
            <input className="inp text-xs" placeholder="Nama Surat (misal: Surat Keterangan Domisili)" required value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} />
          </div>
          <textarea
            className="inp text-xs"
            rows={2}
            placeholder="Template klausul naskah surat (contoh: adalah benar warga yang bertempat tinggal di wilayah Kelurahan Sukamaju...)"
            value={f.template}
            onChange={(e) => setF({ ...f, template: e.target.value })}
          />
          <input
            className="inp text-xs"
            placeholder="Field formulir tambahan (format: key:Label|key2:Label2, misal: keperluan:Keperluan Surat|nama_usaha:Nama Usaha)"
            required
            value={f.fields}
            onChange={(e) => setF({ ...f, fields: e.target.value })}
          />
          <div>
            <button className="btn btn-p text-xs font-bold py-2 px-4">Tambah Master Jenis Surat</button>
          </div>
        </form>

        <div className="mt-3">
          <Msg m={m} />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {(js || []).map((j) => (
          <Card key={j.id} title={`${j.nama} (${j.kode})`} rightAction={
            <button
              className={`btn text-[11px] py-1 px-2.5 ${j.aktif ? 'btn-o text-slate-700' : 'bg-emerald-600 text-white font-bold'}`}
              onClick={() => call(() => api.patch(`/admin/jenis-surat/${j.id}/aktif`))}
            >
              {j.aktif ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          }>
            {/* Box Klausul Template Naskah */}
            <div className="rounded-lg bg-slate-50 border p-3 text-xs mb-3 space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 font-semibold text-[11px]">
                <span>Template Naskah Surat:</span>
                <button
                  type="button"
                  className="text-brand-700 font-bold hover:underline"
                  onClick={() => {
                    if (editTplId === j.id) {
                      setEditTplId(null);
                    } else {
                      setEditTplId(j.id);
                      setTplText(j.template || '');
                    }
                  }}
                >
                  {editTplId === j.id ? 'Batal Ubah' : '✏️ Ubah Template Naskah'}
                </button>
              </div>

              {editTplId === j.id ? (
                <div className="pt-1.5 space-y-2">
                  <textarea
                    className="inp text-xs"
                    rows={3}
                    value={tplText}
                    onChange={(e) => setTplText(e.target.value)}
                    placeholder="Tuliskan klausul resmi naskah surat..."
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="btn btn-o text-[11px] py-1 px-2"
                      onClick={() => setEditTplId(null)}
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      className="btn btn-p text-[11px] py-1 px-3 font-bold"
                      disabled={loadingTpl}
                      onClick={() => simpanTemplate(j.id)}
                    >
                      {loadingTpl ? 'Menyimpan…' : 'Simpan Template'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-700 italic bg-white p-2 rounded border border-slate-200/70 text-[11px] leading-relaxed">
                  "{j.template || 'Belum diatur (menggunakan template default sistem).'}"
                </p>
              )}
            </div>

            {/* Persyaratan Berkas */}
            <div className="text-xs mb-2 font-semibold text-slate-600">Dokumen Persyaratan:</div>
            <ul className="mb-3 text-xs space-y-1">
              {(j.persyaratan || []).map((p) => (
                <li key={p.id} className="flex justify-between items-center border-b border-slate-100 py-1">
                  <span className="text-slate-700">• {p.nama}</span>
                  <button className="text-rose-600 font-semibold text-[11px] hover:underline" onClick={() => call(() => api.delete('/admin/persyaratan/' + p.id))}>
                    Hapus
                  </button>
                </li>
              ))}
              {!(j.persyaratan || []).length && (
                <li className="text-[11px] text-slate-400 italic">Belum ada persyaratan dokumen khusus.</li>
              )}
            </ul>
            <div className="flex gap-2">
              <input
                className="inp text-xs flex-1"
                placeholder="Nama berkas persyaratan (contoh: KTP / KK)"
                value={ps[j.id] || ''}
                onChange={(e) => setPs({ ...ps, [j.id]: e.target.value })}
              />
              <button
                className="btn btn-p text-xs py-1.5 px-3 flex-shrink-0"
                onClick={() =>
                  call(async () => {
                    await api.post('/admin/persyaratan', { jenis_surat_id: j.id, nama: ps[j.id] });
                    setPs({ ...ps, [j.id]: '' });
                  })
                }
              >
                + Tambah
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Log() {
  const [l] = useGet('/admin/logs');
  return (
    <Card title="Audit Log Aktivitas Sistem" subtitle="Catatan seluruh aktivitas pembuatan akun, verifikasi, dan transaksi surat">
      <Table
        head={['Waktu', 'Pengguna', 'Aktivitas', 'Detail', 'IP Address']}
        rows={(l || []).map((x) => [tg(x.created_at), x.nama || 'Sistem / Tamu', <b key="a" className="text-navy text-xs">{x.aksi}</b>, x.detail || '-', x.ip])}
      />
    </Card>
  );
}

export default function App() {
  return (
    <Provider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verifikasi/:kode" element={<Verifikasi />} />
          <Route path="/app" element={<Guard />}>
            <Route index element={<Dashboard />} />
            <Route
              path="verifikasi-warga"
              element={
                <Only r={['petugas', 'admin']}>
                  <VerifikasiWarga />
                </Only>
              }
            />
            <Route
              path="ajukan"
              element={
                <Only r={['warga']}>
                  <Ajukan />
                </Only>
              }
            />
            <Route
              path="profil"
              element={
                <Only r={['warga']}>
                  <Profil />
                </Only>
              }
            />
            <Route path="pengajuan" element={<List />} />
            <Route path="pengajuan/:id" element={<Detail />} />
            <Route
              path="surat"
              element={
                <Only r={['warga']}>
                  <SuratSaya />
                </Only>
              }
            />
            <Route
              path="surat-masuk"
              element={
                <Only r={['petugas', 'lurah', 'admin']}>
                  <SuratMasuk />
                </Only>
              }
            />
            <Route
              path="surat-keluar"
              element={
                <Only r={['petugas', 'lurah', 'admin']}>
                  <SuratKeluar />
                </Only>
              }
            />
            <Route
              path="arsip"
              element={
                <Only r={['petugas', 'lurah', 'admin']}>
                  <Arsip />
                </Only>
              }
            />
            <Route path="notifikasi" element={<Notifikasi />} />
            <Route
              path="pengguna"
              element={
                <Only r={['admin']}>
                  <Pengguna />
                </Only>
              }
            />
            <Route
              path="jenis"
              element={
                <Only r={['admin']}>
                  <Jenis />
                </Only>
              }
            />
            <Route
              path="log"
              element={
                <Only r={['admin']}>
                  <Log />
                </Only>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}
