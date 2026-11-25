# InspoPic — Visual Inspiration & Object Storage Gallery

**InspoPic** adalah aplikasi web berbagi dan pencarian inspirasi visual bergaya Pinterest. Pengguna dapat mengunggah, menjelajahi, mencari, menyimpan ke koleksi, mengunduh, serta mengelola gambar sebagai referensi ide.

Seluruh aset media gambar disimpan di **Biznet Gio NOS** (*object storage* yang kompatibel dengan protokol S3), sehingga server aplikasi tetap ringan tanpa terbebani penyimpanan file lokal. Sementara itu, metadata gambar dikelola melalui satu file JSON terstruktur (`data/inspopic.json`) di dalam *bucket* yang sama tanpa membutuhkan database relasional.

**Live Demo:** [https://tugas-object-storage.vercel.app](https://tugas-object-storage.vercel.app)  
**Repository:** [https://github.com/nyndaa/Tugas-Object-Storage](https://github.com/nyndaa/Tugas-Object-Storage)

> Proyek ini dikembangkan untuk **Tugas Teori Teknologi Cloud Computing**, Program Studi Informatika, Universitas Teknologi Digital Indonesia, Yogyakarta.  
> Disusun oleh: **Raharjian Sustanadia Wijayanti** (NIM `245410040`).

---

## Fitur Utama

- **Galeri Publik Responsif:** Menampilkan seluruh koleksi gambar dalam tata letak *masonry/grid* responsif yang diurutkan dari unggahan terbaru.
- **Pencarian Real-Time:** Menyaring inspirasi gambar secara instan berdasarkan kata kunci judul.
- **Unggah Gambar ke Object Storage:** Mendukung format **JPG, PNG, WEBP, dan GIF** (maksimal **5 MB**) dengan batas judul hingga 150 karakter.
- **Simpan ke Koleksi (*Tersimpan*):** Menyimpan referensi gambar favorit dari galeri publik dengan pencegahan duplikasi otomatis menggunakan hash **SHA-256** dari URL gambar.
- **Unduh Gambar Aman:** Mengunduh media melalui *endpoint proxy* (`/api/download`) dengan sanitasi nama file otomatis.
- **Manajemen Unggahan (Edit & Hapus):** Mengubah judul gambar atau menghapus unggahan secara menyeluruh—penghapusan otomatis membersihkan file fisik di *bucket* Biznet Gio NOS beserta seluruh entri koleksi yang merujuk padanya.
- **Tautan Publik Langsung:** Setiap gambar yang diunggah memperoleh URL publik yang dapat diakses langsung atau disematkan.
- **Antrian Tulis Terkendali (`withDataLock`):** Mencegah *race condition* atau penimpaan data saat beberapa permintaan penulisan metadata terjadi bersamaan.

---

## Antarmuka Aplikasi

1. **Halaman Utama (`/`):** Dilengkapi *header* navigasi, *hero banner* *"Temukan Inspirasimu"* dengan bilah pencarian, galeri gambar responsif, serta tombol melayang (`+`) untuk mengunggah gambar baru.
2. **Halaman Profil (`/profil`):** Menampilkan kartu profil pengguna, ringkasan statistik jumlah unggahan dan koleksi tersimpan, serta tab navigasi **Unggahanku** dan **Tersimpan**.

---

## Teknologi yang Digunakan

| Kategori | Teknologi |
| :--- | :--- |
| **Frontend** | HTML5, Vanilla JavaScript, Tailwind CSS |
| **Backend** | Node.js, Express.js (v5) |
| **File Upload** | Multer (*Memory Storage*) |
| **Object Storage** | Biznet Gio NOS via `@aws-sdk/client-s3` (*S3-compatible, path-style*) |
| **Metadata Storage** | JSON terstruktur di Object Storage (`data/inspopic.json`) |
| **Utilitas & Keamanan** | `dotenv`, `cors`, `crypto` (SHA-256), validasi origin URL |
| **Deployment** | Vercel (terintegrasi CI/CD dengan GitHub) |
| **Development Tools** | Visual Studio Code, Chrome, CS Browser (S3 Client GUI), Git & GitHub |

---

## Struktur Proyek

```text
Tugas-Object-Storage/
├── data/                   # Seed metadata awal (inspopic.json), diabaikan oleh Git
├── public/                 # Aset frontend statis (HTML, JS, CSS)
├── .env                    # Konfigurasi kredensial Object Storage (tidak di-commit)
├── .gitignore              # Daftar file/folder yang dikecualikan dari repositori
├── inspopic_baru.sql       # Skema SQL referensi pasca-migrasi ke JSON
├── package.json            # Daftar dependensi dan metadata proyek Node.js
├── package-lock.json       # Lockfile dependensi npm
├── server.js               # Server Express, REST API, dan integrasi Biznet Gio NOS
└── README.md               # Dokumentasi lengkap proyek
```

---

## Cara Mengakses & Menjalankan Proyek

### 1. Akses Langsung (Online)
Buka tautan aplikasi yang sudah ter-deploy di Vercel melalui browser:
> [https://tugas-object-storage.vercel.app](https://tugas-object-storage.vercel.app)

### 2. Menjalankan di Komputer Lokal (Local Development)

#### Prasyarat
- **Node.js v18** atau versi lebih baru (menggunakan `fetch` dan `AbortSignal.timeout` bawaan).
- Akun **Biznet Gio NOS** beserta informasi *Bucket*, *Access Key*, dan *Secret Key*.

#### Langkah Instalasi
1. **Clone repositori ini:**
   ```bash
   git clone https://github.com/nyndaa/Tugas-Object-Storage.git
   ```

2. **Masuk ke direktori proyek:**
   ```bash
   cd Tugas-Object-Storage
   ```

3. **Pasang seluruh dependensi:**
   ```bash
   npm install
   ```

4. **Buat dan atur file `.env`** di folder utama proyek (lihat bagian **Konfigurasi Environment** di bawah).

5. *(Opsional)* Letakkan file seed awal di `data/inspopic.json` jika ingin memulai dengan data contoh.

6. **Jalankan server:**
   ```bash
   node server.js
   ```

7. **Buka di browser:**
   Akses alamat berikut pada browser Anda:
   ```text
   http://localhost:3000
   ```

---

## Konfigurasi Environment

Buat file bernama `.env` pada *root* direktori proyek dan isi variabel berikut:

```env
PORT=3000
JWT_SECRET=isi_dengan_string_acak_yang_panjang
BIZNET_REGION=idn
BIZNET_ACCESS_KEY=isi_access_key_anda
BIZNET_SECRET_KEY=isi_secret_key_anda
BIZNET_BUCKET=nama_bucket_anda
BIZNET_ENDPOINT=https://nos.wjv-1.neo.id
```

| Variabel | Keterangan |
| :--- | :--- |
| `PORT` | Nomor port server lokal (default: `3000`) |
| `JWT_SECRET` | Kunci rahasia JWT (disiapkan untuk pengembangan autentikasi lanjutan) |
| `BIZNET_REGION` | Kode region S3 Biznet Gio NOS (default: `idn`) |
| `BIZNET_ACCESS_KEY` | Access Key ID dari akun Biznet Gio NOS |
| `BIZNET_SECRET_KEY` | Secret Access Key dari akun Biznet Gio NOS |
| `BIZNET_BUCKET` | Nama *bucket* tujuan penyimpanan gambar dan metadata |
| `BIZNET_ENDPOINT` | URL endpoint Biznet Gio NOS (tanpa tanda `/` di akhir) |

> **Peringatan Keamanan:** Jangan pernah mengunggah (*commit*) file `.env` ke repositori publik. File ini sudah dimasukkan ke dalam `.gitignore`. Untuk lingkungan produksi di Vercel, masukkan seluruh variabel di atas melalui menu **Project Settings → Environment Variables**.

---

## Arsitektur Penyimpanan Object Storage

Di dalam *bucket* Biznet Gio NOS, struktur objek disusun sebagai berikut:

```text
<nama-bucket>/
├── uploads/<uuid>.<ext>   # File fisik gambar (JPG, PNG, WEBP, GIF)
└── data/inspopic.json     # Pusat metadata (images, saved_images, next_ids)
```

### Format Metadata (`data/inspopic.json`)
```json
{
  "schema_version": 1,
  "images": [
    {
      "id": 3,
      "title": "Inspirasi Ruang Minimalis",
      "image_url": "https://nos.wjv-1.neo.id/<bucket>/uploads/...",
      "object_key": "uploads/...",
      "created_at": "2026-05-10T08:30:00.000Z"
    }
  ],
  "saved_images": [
    {
      "id": 4,
      "image_url": "https://nos.wjv-1.neo.id/<bucket>/uploads/...",
      "title": "Inspirasi Ruang Minimalis",
      "url_hash": "sha256...",
      "created_at": "2026-05-10T09:00:00.000Z"
    }
  ],
  "next_ids": {
    "images": 31,
    "saved_images": 6
  }
}
```

Saat server dijalankan pertama kali dan `data/inspopic.json` belum ditemukan di dalam *bucket*, server secara otomatis membaca seed lokal `data/inspopic.json` (jika tersedia) dan mengunggahnya ke Object Storage, atau membuat struktur JSON kosong baru.

### Catatan Migrasi dari Database Relasional
Versi awal aplikasi menggunakan MariaDB/MySQL (`inspopic.sql` dengan tabel `users`, `images`, dan `saved_images`). Pada arsitektur terkini (`inspopic_baru.sql`), ketergantungan pada database SQL telah digantikan sepenuhnya dengan penyimpanan objek JSON di Biznet Gio NOS untuk memaksimalkan efisiensi *cloud storage*.

---

## Dokumentasi REST API

**Base URL Lokal:** `http://localhost:3000`  
**Base URL Produksi:** `https://tugas-object-storage.vercel.app`

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/images` | Mengambil seluruh daftar gambar (terbaru di atas) dalam format `{ images: [...] }` |
| `POST` | `/upload` | Mengunggah gambar baru (`multipart/form-data` dengan field `image` dan `title`) |
| `PUT` | `/api/images/:id` | Memperbarui judul gambar dengan body JSON `{ "title": "..." }` |
| `DELETE` | `/api/images/:id` | Menghapus metadata gambar, objek fisik di bucket, dan entri tersimpan terkait |
| `GET` | `/api/saved` | Mengambil daftar seluruh gambar yang disimpan ke koleksi |
| `POST` | `/api/saved` | Menyimpan gambar ke koleksi dengan body JSON `{ "image_url": "...", "title": "..." }` |
| `DELETE` | `/api/saved/:id` | Menghapus gambar dari daftar koleksi tersimpan |
| `GET` | `/api/download?url=...&name=...` | Mengunduh gambar secara aman sebagai *attachment* |

### Contoh Pengujian Unggah via cURL
```bash
curl -X POST https://tugas-object-storage.vercel.app/upload \
  -F "image=@foto.jpg" \
  -F "title=Inspirasi Desain Minimalis"
```

### Validasi & Keamanan
- **Proteksi SSRF pada Proxy Unduhan:** Parameter `url` pada `/api/saved` dan `/api/download` divalidasi ketat agar hanya menerima protokol `https` yang berasal dari endpoint dan path bucket aplikasi (`/<bucket>/uploads/`).
- **Filter Tipe & Ukuran File:** Membatasi unggahan hanya untuk format gambar valid (JPG, PNG, WEBP, GIF) maksimal 5 MB.
- **Rollback Otomatis:** Jika penulisan metadata JSON gagal setelah unggahan berhasil, objek gambar yang terlanjur masuk ke bucket akan otomatis dihapus kembali.
- **Sanitasi Nama File:** Membersihkan karakter berbahaya pada parameter nama file saat proses unduhan.

---

## Deployment (Vercel)

1. Unggah (*push*) kode sumber proyek ke repositori GitHub (`https://github.com/nyndaa/Tugas-Object-Storage`).
2. Impor repositori tersebut ke dalam proyek baru di **Vercel**.
3. Tambahkan seluruh variabel pada bagian **Konfigurasi Environment** ke menu **Settings → Environment Variables** di dashboard Vercel.
4. Lakukan deploy; setiap pembaruan `git push` ke branch utama akan memicu proses *build* dan *deploy* otomatis.

---

## Catatan Pengembangan

- Mekanisme `withDataLock` menjaga konsistensi penulisan metadata di dalam satu instance proses Node.js. Pada skala trafik produksi tinggi dengan banyak *instance serverless* paralel, disarankan menggunakan database terkelola atau *distributed lock*.
- Saat ini aplikasi dirancang sebagai galeri terbuka tanpa sistem login berbasis sesi pengguna di sisi server.

---

## Lisensi & Pengembang

Dikembangkan oleh **Raharjian Sustanadia Wijayanti** (NIM `245410040`) untuk keperluan akademik pada mata kuliah **Teknologi Cloud Computing**.  
GitHub: [@nyndaa](https://github.com/nyndaa)