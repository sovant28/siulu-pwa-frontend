# Siulu PWA Design System & Typography Standards 🏔️📱

Dokumen ini berisi panduan ukuran font (typography scaling) dan struktur header yang telah disesuaikan agar memiliki keterbacaan tinggi setara dengan aplikasi Facebook mobile. Gunakan panduan ini sebagai template wajib untuk pembuatan halaman-halaman berikutnya pada aplikasi **Siulu PWA**.

---

## 1. Standar Header & Navigasi

Setiap sub-halaman baru wajib memiliki struktur header atas yang konsisten (menggunakan model grid 3-kolom untuk navigasi kembali dan judul halaman):

*   **Logo Utama ("siulu"):** `text-3xl font-black text-[#BE1641] tracking-tight`
*   **Judul Halaman (Row 2):** `text-lg font-black text-slate-800 text-center select-none`
*   **Tombol Kembali (Back Button):** Lingkaran background abu-abu terang dengan ikon ArrowLeft berukuran `w-4.5 h-4.5 text-slate-800`.
*   **Struktur Grid Header:**
    ```javascript
    <header className="sticky top-0 z-40 bg-white/95 px-6 pt-[calc(env(safe-area-inset-top)+10px)] pb-3 flex flex-col space-y-4 backdrop-blur-md">
      {/* Row 1: Logo */}
      <div className="text-center w-full">
        <span className="text-3xl font-black text-[#BE1641] tracking-tight select-none">siulu</span>
      </div>
      {/* Row 2: Navigation */}
      <div className="grid grid-cols-3 items-center w-full">
        <button className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center ...">
          <ArrowLeft className="w-4.5 h-4.5 text-slate-800" />
        </button>
        <span className="text-lg font-black text-slate-800 text-center select-none whitespace-nowrap">
          Nama Halaman Baru
        </span>
        <div className="w-9 h-9" /> {/* Spacer Penyeimbang */}
      </div>
    </header>
    ```

---

## 2. Skala Font & Keterbacaan (Typography Scale)

Gunakan kelas Tailwind CSS berikut untuk menjamin teks mudah dibaca di layar HP resolusi tinggi:

| Tipe Teks | Ukuran Tailwind | Ukuran Pixel | Contoh Penggunaan |
| :--- | :--- | :--- | :--- |
| **Judul Halaman Utama** | `text-2xl font-black` | 24px | Judul utama destinasi/event pada halaman detail |
| **Judul Bagian / Seksi** | `text-lg font-bold` | 18px | Sub-judul bagian (*"Tentang Tempat Ini"*, *"Lokasi"*) |
| **Judul Item List** | `text-base font-bold` | 16px | Judul tempat/event di card daftar (*list item*) |
| **Paragraf Deskripsi** | `text-base leading-relaxed` | 16px | Paragraf cerita deskripsi lengkap (Facebook feed-style) |
| **Sub-judul Info / Metadata** | `text-sm font-bold` | 14px | Info baris detail (wilayah, tanggal, jam operasional) |
| **Teks Input & Tombol Utama**| `text-base font-medium` | 16px | Input kolom chat, input pencarian, tombol aksi utama |
| **Badge / Tag Kecil** | `text-xs font-bold` | 12px | Label tombol kategori di beranda, sub-info card kecil |

---

## 3. Aturan Tambahan Keterbacaan & Tata Letak

1.  **Kontras Warna:** Hindari teks berwarna abu-abu terlalu tipis. Gunakan minimal `text-slate-800` (atau `text-slate-700` untuk teks sekunder) agar rasio kontrasnya ramah di mata wisatawan segala usia.
2.  **Mencegah Overflow pada Kategori:** Untuk grid baris (seperti 4 kolom kategori Beranda), pertahankan teks label di `text-xs` (12px) agar kata panjang tidak terbungkus (*wrap*) ke bawah dan merusak simetri visual.
3.  **Tinggi Pembatas Deskripsi:** Saat menggunakan fitur *truncate* deskripsi ("Selengkapnya"), gunakan `max-h-[7rem]` agar teks deskripsi berukuran `text-base` terpotong tepat di sela spasi baris.
