"use client";

const words: Record<string, string> = {
  global: "Navigasi & identitas", home: "Beranda", skills: "Keahlian", projects: "Proyek", contact: "Kontak",
  project_detail: "Detail proyek", resume: "CV / Resume", social_links: "Tautan sosial", nav_links: "Menu navigasi",
  selected_project_count: "Jumlah proyek unggulan di beranda", fallback_cv_url: "Tautan CV cadangan",
  hero: "Hero", title: "Judul", description: "Deskripsi", label: "Label", value: "Nilai", role: "Peran",
  period: "Periode", href: "Tautan", id: "ID", tag: "Tag", version: "Versi", highlights: "Sorotan CV",
  capabilities: "Kapabilitas", process_steps: "Tahapan kerja", milestones: "Riwayat pengalaman", telemetry: "Telemetri",
  eyebrow: "Label bagian", brand: "Identitas", name: "Nama", descriptor: "Keterangan", footer: "Footer",
  text: "Teks", availability: "Ketersediaan", button: "Tombol", mobile: "Mobile", menu: "Menu", open: "Buka",
  close: "Tutup", aria: "Aksesibilitas", resume_button_label: "Label tombol CV", hero_title: "Judul utama",
  hero_description: "Deskripsi utama", primary: "Utama", secondary: "Sekunder", action: "Aksi", stack: "Teknologi",
  tech_stack: "Teknologi utama", metrics: "Metrik", selected: "Pilihan", work: "Karya", profile: "Profil",
  discipline: "Disiplin", fallback: "Cadangan", bio: "Biografi", cv: "CV", principle: "Prinsip", process: "Proses",
  brief: "Brief", builder: "Penyusun", focus: "Fokus", expectation: "Ekspektasi", prefix: "Awalan", project_types: "Layanan",
  latency: "Latensi", protocol: "Protokol", packets: "Paket", nodes: "Node", node: "Node", status: "Status",
  filter: "Filter", search_placeholder: "Placeholder pencarian", all_category_label: "Label semua kategori", index: "Direktori",
  displayed_suffix: "Label jumlah ditampilkan", card: "Kartu", competencies: "Kompetensi", specifications: "Spesifikasi",
  table_headers: "Judul kolom tabel", timeline: "Linimasa", cta: "Ajakan", form: "Formulir", email: "Email",
  placeholder: "Placeholder", message: "Pesan", submit: "Kirim", submitting: "Saat mengirim", success: "Berhasil",
  error: "Gagal", toast: "Notifikasi", prefill: "Isian awal", general: "Umum", detail: "Detail", required: "Wajib diisi",
  invalid: "Tidak valid", back: "Kembali", demo: "Demo", github: "GitHub", about: "Tentang", category: "Kategori",
  architecture: "Arsitektur", gallery: "Galeri", empty: "Kosong", title_template: "Format judul (gunakan {name})",
  download: "Unduh", filename: "Nama file", unavailable_message: "Pesan saat CV belum tersedia", current_focus_label: "Label fokus saat ini",
  all_projects_label: "Label tautan katalog", video_title: "Judul video demo", video_action_label: "Label tautan video",
  no_results_title: "Judul pencarian kosong", no_results_message: "Pesan pencarian kosong",
};
const labelFor = (key: string) => words[key] || key.split("_").map((word) => words[word] || word).join(" ");
const inputClass = "w-full rounded-lg border border-editorial-line-strong bg-editorial-surface px-3 py-2.5 text-sm text-editorial-ink focus:border-editorial-technical focus:outline-none";

function blank(value: unknown, key = ""): unknown {
  if (Array.isArray(value)) return [];
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, blank(item, name)]));
  if (typeof value === "number") return 0;
  return key === "id" ? `item_${crypto.randomUUID()}` : "";
}

export default function ContentFields({ value, schema, onChange, field = "" }: {
  value: unknown; schema: unknown; onChange: (value: unknown) => void; field?: string;
}) {
  if (Array.isArray(value)) {
    const template = Array.isArray(schema) ? schema[0] : undefined;
    return <fieldset className="space-y-3 rounded-lg border border-editorial-line p-4">
      <legend className="px-2 text-sm font-semibold text-editorial-technical">{labelFor(field)}</legend>
      {value.map((item, index) => <div key={index} className="space-y-3 rounded-lg bg-editorial-paper-deep p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-editorial-muted">
          <span>Item {index + 1}</span>
          <div className="flex gap-3">
            <button type="button" disabled={index === 0} aria-label={`Naikkan item ${index + 1}`} onClick={() => {
              const next = [...value]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; onChange(next);
            }}>↑</button>
            <button type="button" disabled={index === value.length - 1} aria-label={`Turunkan item ${index + 1}`} onClick={() => {
              const next = [...value]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; onChange(next);
            }}>↓</button>
            <button type="button" className="text-editorial-danger" onClick={() => onChange(value.filter((_, i) => i !== index))}>Hapus</button>
          </div>
        </div>
        <ContentFields value={item} schema={template} field={typeof item === "string" ? "value" : ""}
          onChange={(nextItem) => onChange(value.map((current, i) => i === index ? nextItem : current))} />
      </div>)}
      <button type="button" className="text-sm font-semibold text-editorial-technical" onClick={() => onChange([...value, blank(template ?? "")])}>+ Tambah item</button>
    </fieldset>;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const defaults = (schema || {}) as Record<string, unknown>;
    return <div className="space-y-5">{Object.entries(record).map(([key, item]) => <ContentFields key={key} field={key}
      value={item} schema={defaults[key]} onChange={(next) => onChange({ ...record, [key]: next })} />)}</div>;
  }
  const text = String(value ?? "");
  const multiline = /description|bio|message|principle_text/.test(field) || text.includes("\n");
  return <label className="block">
    <span className="mb-1.5 block text-sm font-semibold text-editorial-technical">{labelFor(field)}</span>
    {multiline ? <textarea rows={3} className={inputClass} value={text} onChange={(event) => onChange(event.target.value)} />
      : <input className={inputClass} type={typeof value === "number" ? "number" : "text"} min={0} step={1}
          value={text} onChange={(event) => onChange(typeof value === "number" ? Math.max(0, Math.trunc(Number(event.target.value))) : event.target.value)} />}
  </label>;
}
