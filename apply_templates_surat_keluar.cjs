const fs = require('fs');
const path = require('path');

const appPath = path.resolve('sipesur/frontend/src/App.jsx');
let code = fs.readFileSync(appPath, 'utf8');

const tplDef = `const TEMPLATE_SURAT_DINAS = [
  {
    nama: '1. Surat Undangan Rapat Koordinasi Wilayah',
    tujuan: 'Seluruh Ketua RW dan RT se-Kelurahan Sukamaju',
    perihal: 'Undangan Rapat Koordinasi Evaluasi Wilayah & Pelayanan',
    isi_surat: \`Sehubungan dengan pelaksanaan evaluasi program kerja kelurahan dan pembahasan ketentraman lingkungan, bersama ini kami mengharapkan kehadiran Bapak/Ibu pada:

Hari / Tanggal : Senin, [Isi Tanggal Rapat]
Waktu          : Pukul 09.00 WIB s.d. Selesai
Tempat         : Aula Kantor Kelurahan Sukamaju
Acara          : Rapat Koordinasi Ketentraman Lingkungan & Evaluasi Pelayanan Warga

Mengingat pentingnya agenda tersebut, dimohon Bapak/Ibu hadir tepat pada waktunya.\`
  },
  {
    nama: '2. Surat Edaran Kerja Bakti & Kebersihan',
    tujuan: 'Seluruh Warga Masyarakat Kelurahan Sukamaju',
    perihal: 'Surat Edaran Pelaksanaan Kerja Bakti & Antisipasi Banjir',
    isi_surat: \`Dalam rangka menjaga kebersihan lingkungan, mengantisipasi genangan air, serta mencegah wabah penyakit di musim penghujan, Kelurahan Sukamaju menghimbau kepada seluruh warga untuk melaksanakan kerja bakti massal pada:

Hari / Tanggal : Minggu, [Isi Tanggal Kerja Bakti]
Waktu          : Pukul 07.00 WIB s.d. Selesai
Lokasi         : Lingkungan RT dan RW masing-masing
Fokus Kerja    : Pembersihan saluran air/drainase, pemilahan sampah, dan pemangkasan dahan pohon rawan tumbang.

Partisipasi dan kerja sama seluruh lapisan warga sangat diharapkan demi keasrian dan kenyamanan lingkungan kita bersama.\`
  },
  {
    nama: '3. Surat Pemberitahuan Jadwal Pelayanan',
    tujuan: 'Warga Masyarakat dan Pengurus Lingkungan RT/RW',
    perihal: 'Pemberitahuan Penyesuaian Jadwal Loket Pelayanan',
    isi_surat: \`Diberitahukan kepada seluruh warga masyarakat Kelurahan Sukamaju bahwa sehubungan dengan adanya agenda [Tuliskan Nama Kegiatan / Hari Libur], jam operasional loket pelayanan tatap muka di kantor kelurahan pada [Tuliskan Tanggal] disesuaikan menjadi:

- Jam Layanan Tatap Muka: Pukul 08.00 s.d. 12.00 WIB.
- Layanan Persuratan Online (SIPESUR): Tetap dapat diakses 24 jam secara mandiri melalui website.

Pelayanan administrasi akan beroperasi normal kembali pada hari kerja berikutnya.\`
  },
  {
    nama: '4. Surat Perintah Tugas (SPT)',
    tujuan: 'Staf Pelaksana & Pamong Kelurahan Sukamaju',
    perihal: 'Surat Perintah Tugas Monitoring & Pendampingan Wilayah',
    isi_surat: \`Lurah Kelurahan Sukamaju dengan ini menugaskan kepada staf yang ditunjuk untuk:

1. Melaksanakan monitoring dan pendampingan kegiatan kemasyarakatan di wilayah RW binaan.
2. Melakukan inventarisasi aspirasi warga terkait sarana prasarana lingkungan.
3. Melaporkan hasil kegiatan kepada Lurah Sukamaju setelah pelaksanaan tugas selesai.

Surat perintah tugas ini diberikan untuk dilaksanakan dengan penuh rasa tanggung jawab.\`
  },
  {
    nama: '5. Surat Keterangan / Rekomendasi Resmi Lurah',
    tujuan: 'Pihak / Instansi Terkait',
    perihal: 'Surat Rekomendasi Resmi Kelurahan Sukamaju',
    isi_surat: \`Berdasarkan permohonan yang diajukan dan hasil pemeriksaan berkas administrasi di kantor kelurahan, bersama ini Lurah Sukamaju memberikan rekomendasi resmi kepada pihak terkait untuk [Tuliskan Keperluan / Kegiatan yang Direkomendasikan].

Rekomendasi ini diberikan dengan ketentuan yang bersangkutan tetap mematuhi seluruh peraturan perundang-undangan yang berlaku di wilayah Kelurahan Sukamaju.\`
  }
];
`;

const suratKeluarStart = 'function SuratKeluar() {';
const arsipStart = 'function Arsip() {';

const idx1 = code.indexOf(suratKeluarStart);
const idx2 = code.indexOf(arsipStart);

if (idx1 === -1 || idx2 === -1) {
  console.error('Boundaries not found!', { idx1, idx2 });
  process.exit(1);
}

const newSuratKeluar = tplDef + `function SuratKeluar() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [rows, load] = useGet(\`/surat-keluar?q=\${encodeURIComponent(q)}\`);
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
      alert(\`Surat dinas resmi berhasil diterbitkan dengan nomor: \${res.data.nomor_surat}\`);
      load();
    } catch (err) {
      setM({ t: em(err) });
    } finally {
      setLoading(false);
    }
  };

  const terapkanTemplate = (tpl) => {
    setF({
      tujuan: tpl.tujuan,
      perihal: tpl.perihal,
      isi_surat: tpl.isi_surat,
    });
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
                onClick={() => {
                  setShowModal(true);
                  setM(null);
                  if (!f.isi_surat) {
                    terapkanTemplate(TEMPLATE_SURAT_DINAS[0]);
                  }
                }}
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
              onClick={() => downloadPdf(\`/surat-keluar/\${r.id}/pdf\`, \`Surat-Keluar-\${r.nomor_surat.replace(/[/\\\\?%*:|"<>]/g, '_')}.pdf\`)}
            >
              Unduh PDF
            </button>,
          ])}
        />
      </Card>

      {/* MODAL PEMBUATAN SURAT DINAS LURAH DENGAN PILIHAN TEMPLATE */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in-scale">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Icon name="file" className="w-4 h-4 text-brand-600" />
                  <span>Buat Surat Dinas / Surat Keluar Lurah</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tersedia template naskah baku kedinasan. Lurah tinggal memilih template & menyesuaikan kata-katanya.
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

            {/* KOTAK PILIHAN TEMPLATE NASKAH RESMI */}
            <div className="rounded-xl bg-blue-50/80 border border-blue-200 p-3.5 mb-4 text-xs">
              <div className="flex items-center justify-between gap-2 mb-2 font-bold text-brand-800">
                <span className="flex items-center gap-1.5">
                  <Icon name="check" className="w-4 h-4 text-brand-600" />
                  <span>Pilih Template Naskah Surat Dinas (Otomatis Terisi):</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Tinggal isi kata-katanya</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2.5">
                {TEMPLATE_SURAT_DINAS.map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="text-left p-2 rounded-lg border border-blue-200 bg-white hover:border-brand-500 hover:bg-blue-50/50 transition-all font-semibold text-slate-800 text-[11px] truncate"
                    onClick={() => terapkanTemplate(tpl)}
                  >
                    {tpl.nama}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 italic">
                *Klik salah satu template di atas untuk otomatis mengisi Tujuan, Perihal, dan Redaksi Surat di bawah.
              </p>
            </div>

            <form onSubmit={handleBuatSurat} className="space-y-3.5">
              <Field l="Tujuan / Kepada Yth." req hint="Contoh: Seluruh Ketua RW/RT se-Kelurahan Sukamaju / Camat Sukamaju">
                <input
                  className="inp text-xs"
                  required
                  placeholder="Nama penerima surat dinas..."
                  value={f.tujuan}
                  onChange={(e) => setF({ ...f, tujuan: e.target.value })}
                />
              </Field>

              <Field l="Perihal Surat Dinas" req hint="Contoh: Undangan Rapat Koordinasi Wilayah / Surat Edaran Kebersihan">
                <input
                  className="inp text-xs"
                  required
                  placeholder="Perihal pokok surat dinas..."
                  value={f.perihal}
                  onChange={(e) => setF({ ...f, perihal: e.target.value })}
                />
              </Field>

              <Field l="Isi Redaksi Naskah Surat Dinas (Sesuaikan Kata-katanya)" req hint="Format sudah tersusun rapi. Silakan sesuaikan tanggal, waktu, atau rincian kata-katanya">
                <textarea
                  className="inp text-xs font-serif leading-relaxed"
                  rows={8}
                  required
                  placeholder="Isi redaksi surat dinas..."
                  value={f.isi_surat}
                  onChange={(e) => setF({ ...f, isi_surat: e.target.value })}
                />
              </Field>

              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-[11px] text-emerald-900 leading-relaxed">
                <b>Pengesahan PDF Otomatis:</b> Berkas PDF resmi akan langsung tercetak dengan <b>KOP Pemerintah Kota & Kelurahan Sukamaju</b>, <b>Nomor Surat Agenda</b>, salam pembuka/penutup dinas, dan <b>Tanda Tangan Elektronik Lurah Sukamaju</b>.
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
                  {loading ? 'Menerbitkan Dokumen PDF…' : '✓ Terbitkan & Tandatangani Surat Dinas (PDF)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

`;

code = code.slice(0, idx1) + newSuratKeluar + code.slice(idx2);
fs.writeFileSync(appPath, code, 'utf8');
console.log('SuratKeluar upgraded with ready-to-use templates! New length:', code.length);
`;

fs.writeFileSync('sipesur/apply_templates_surat_keluar.cjs', code, 'utf8');
