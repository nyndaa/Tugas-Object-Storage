# InspoPic

**InspoPic** adalah aplikasi web berbagi dan pencarian inspirasi visual dengan konsep seperti Pinterest. Pengguna dapat mengunggah, menjelajahi, menyimpan, mengunduh, dan mengelola gambar sebagai referensi ide.

Seluruh file gambar disimpan di **Biznet Gio NOS** (object storage non-AWS yang kompatibel dengan S3), sehingga server aplikasi tidak terbebani penyimpanan media. Metadata gambar disimpan sebagai satu file JSON (`data/inspopic.json`) di bucket yang sama, tanpa database relasional.

> Proyek ini dibuat untuk **Tugas Teori Teknologi Cloud Computing**, Program Studi Informatika, Universitas Teknologi Digital Indonesia, Yogyakarta.
> Disusun oleh: Raharjian Sustanadia Wijayanti (NIM 245410040).

---

## Fitur

- **Galeri publik**: seluruh gambar tampil dalam grid responsif, diurutkan dari yang terbaru.
- **Pencarian**: cari gambar berdasarkan kata kunci judul.
- **Unggah gambar**: format JPG, PNG, WEBP, GIF, maksimal 5 MB, judul maksimal 150 karakter.
- **Simpan ke koleksi** ("Tersimpan"): simpan gambar dari galeri, tanpa duplikat (dicek dengan hash SHA-256 dari URL).
- **Unduh gambar** melalui endpoint proxy dengan nama file yang aman.
- **Edit judul** dan **hapus unggahan**. File fisik di bucket ikut terhapus, begitu pula entri koleksi yang merujuk gambar tersebut.
- **Tautan publik**: setiap gambar mendapat URL endpoint publik yang bisa disematkan atau diakses aplikasi lain.
- **Antrian tulis** (`withDataLock`) agar penulisan metadata tidak saling menimpa dalam satu server.

## Tampilan

1. **Halaman utama**: header dengan logo, hero "Temukan Inspirasimu" dengan search bar, grid gambar, dan tombol melayang (+) untuk unggah.
2. **Halaman profil**: kartu profil, statistik unggahan dan koleksi, serta tab **Unggahanku** dan **Tersimpan**.

## Teknologi

| Kategori | Teknologi |
| --- | --- |
| Frontend | HTML, JavaScript, Tailwind CSS |
| Backend | Node.js, Express 5 |
| Upload | Multer (memory storage) |
| Storage | Biznet Gio NOS via `@aws-sdk/client-s3` (S3-compatible, path-style) |
| Metadata | File JSON di Object Storage |
| Konfigurasi | dotenv, CORS |
| Deployment | Vercel (terhubung ke GitHub) |
| Tools | VS Code, Chrome, CS Browser (S3 client GUI), Git, GitHub |

## Struktur Proyek

```
.
├── public/                # Frontend (index.html, login.html, api.js, index.js, ...)
├── data/                  # Seed metadata lokal (inspopic.json), diabaikan git
├── server.js              # Server Express + integrasi Object Storage
├── package.json
├── .env                   # Kredensial (tidak di-commit)
└── .gitignore
```

## Prasyarat

- Node.js 18 atau lebih baru (server memakai `fetch` dan `AbortSignal.timeout` bawaan)
- Akun Biznet Gio NOS dengan bucket, Access Key, dan Secret Key

## Instalasi dan Menjalankan

```bash
# 1. Pasang dependensi
npm install

# 2. Buat file .env (lihat bagian Konfigurasi)

# 3. (Opsional) Letakkan data awal di data/inspopic.json

# 4. Jalankan server
node server.js
```

Aplikasi berjalan di `http://localhost:3000` (atau sesuai `PORT`).

## Konfigurasi

Buat file `.env` di root proyek:

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
| --- | --- |
| `PORT` | Port server (default `3000`) |
| `JWT_SECRET` | Secret JWT. Belum dipakai di `server.js` saat ini (sisa dari versi dengan login) |
| `BIZNET_REGION` | Region S3 (default `idn`) |
| `BIZNET_ACCESS_KEY` / `BIZNET_SECRET_KEY` | Kredensial Biznet Gio NOS |
| `BIZNET_BUCKET` | Nama bucket |
| `BIZNET_ENDPOINT` | Endpoint NOS, tanpa slash di akhir |

> ⚠️ **Jangan pernah meng-commit `.env`** atau membagikan isinya. File ini sudah tercantum di `.gitignore`. Di Vercel, isi variabel yang sama lewat *Project Settings → Environment Variables*.

## Penyimpanan Data

Di bucket, objek disimpan seperti ini:

```
<bucket>/
├── uploads/<uuid>.<ext>   # file gambar
└── data/inspopic.json     # metadata (images, saved_images, next_ids)
```

Format `inspopic.json`:

```json
{
  "schema_version": 1,
  "images": [
    { "id": 3, "title": "...", "image_url": "https://...", "object_key": "uploads/...", "created_at": "..." }
  ],
  "saved_images": [
    { "id": 4, "image_url": "https://...", "title": "...", "url_hash": "sha256...", "created_at": "..." }
  ],
  "next_ids": { "images": 31, "saved_images": 6 }
}
```

Saat pertama kali dijalankan, jika `data/inspopic.json` belum ada di bucket, server membacanya dari seed lokal `data/inspopic.json` dan mengunggahnya ke Object Storage. Jika seed lokal juga tidak ada, server memulai dengan data kosong.

### Migrasi dari MySQL

Versi awal memakai MariaDB (`inspopic.sql`, dengan tabel `users`, `images`, `saved_images`). Versi sekarang (`inspopic_baru.sql`) menghapus tabel `users` dan kolom `user_id`. Data hasil migrasi ada di `inspopic.json`, sedangkan file gambar tetap berada di Object Storage.

## Dokumentasi API

Base URL: `http://localhost:3000`

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| `GET` | `/api/images` | Daftar semua gambar (terbaru dulu), respons `{ images: [...] }` |
| `POST` | `/upload` | Unggah gambar. `multipart/form-data` dengan field `image` (file) dan `title` |
| `PUT` | `/api/images/:id` | Ubah judul. Body JSON `{ "title": "..." }` |
| `DELETE` | `/api/images/:id` | Hapus gambar, file di bucket, dan entri tersimpan terkait |
| `GET` | `/api/saved` | Daftar gambar tersimpan (array) |
| `POST` | `/api/saved` | Simpan gambar. Body JSON `{ "image_url": "...", "title": "..." }` |
| `DELETE` | `/api/saved/:id` | Hapus dari daftar tersimpan |
| `GET` | `/api/download?url=...&name=...` | Unduh gambar sebagai attachment |

Contoh unggah dengan cURL:

```bash
curl -X POST http://localhost:3000/upload \
  -F "image=@foto.jpg" \
  -F "title=Nailong gemas"
```

### Validasi dan keamanan

- URL gambar pada `/api/saved` dan `/api/download` hanya diterima jika berasal dari bucket aplikasi (`https`, origin endpoint, path `/<bucket>/uploads/`), sehingga endpoint unduh tidak bisa dipakai sebagai proxy ke situs lain.
- Tipe file dibatasi ke JPG, PNG, WEBP, GIF; ukuran maksimal 5 MB.
- Jika penyimpanan metadata gagal setelah unggah, file yang sudah terkirim ke bucket dihapus kembali.
- Nama file unduhan dibersihkan dari karakter berbahaya.

## Deployment (Vercel)

1. Push kode ke repositori GitHub.
2. Impor repositori di Vercel.
3. Atur Environment Variables sesuai bagian Konfigurasi.
4. Setiap `git push` memicu build dan deploy otomatis. File media tetap di Biznet Gio NOS.

Folder `data/` dan `.env` masuk `.gitignore`, jadi tidak ikut ter-deploy. Metadata dibaca dari Object Storage.

## Catatan Pengembangan

- Semua operasi baca-tulis metadata melewati satu antrian di dalam proses. Kunci ini tidak melindungi dari penulisan bersamaan antar-instance (misalnya beberapa instance serverless di Vercel). Untuk trafik tinggi, pertimbangkan database atau penguncian terdistribusi.
- Aplikasi saat ini tidak memiliki autentikasi di sisi server: siapa pun dapat mengunggah, mengubah, dan menghapus gambar lewat API.

## Lisensi

Proyek ini dibuat untuk keperluan akademik.
