require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mysql = require("mysql2/promise");
const crypto = require("crypto");
const path = require("path");

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  PutBucketPolicyCommand,
} = require("@aws-sdk/client-s3");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ==================================================
// 1. VALIDASI KONFIGURASI
// ==================================================

const endpoint = (process.env.BIZNET_ENDPOINT || "").replace(/\/+$/, "");
const bucket = process.env.BIZNET_BUCKET || "";

const hasStorageCredentials =
  Boolean(process.env.BIZNET_ACCESS_KEY) &&
  Boolean(process.env.BIZNET_SECRET_KEY);

const storageConfigured =
  Boolean(endpoint) && Boolean(bucket) && hasStorageCredentials;

if (endpoint) {
  try {
    const parsedEndpoint = new URL(endpoint);

    if (
      parsedEndpoint.protocol !== "https:" &&
      parsedEndpoint.protocol !== "http:"
    ) {
      throw new Error("Endpoint harus menggunakan HTTP atau HTTPS.");
    }
  } catch {
    throw new Error("BIZNET_ENDPOINT bukan URL yang valid.");
  }
}

console.log("=== KONFIGURASI OBJECT STORAGE ===");
console.log("Endpoint:", endpoint);
console.log("Region:", process.env.BIZNET_REGION);
console.log("Bucket:", bucket);
console.log("Credentials tersedia:", hasStorageCredentials);
console.log("=================================");

// ==================================================
// 2. MIDDLEWARE
// ==================================================

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ==================================================
// 3. KONEKSI MYSQL
// ==================================================

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "inspopic",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/* ==================================================
   4. KONEKSI BIZNET OBJECT STORAGE
   ================================================== */

const region = process.env.BIZNET_REGION || "idn";

const s3 = storageConfigured
  ? new S3Client({
      endpoint,
      region,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.BIZNET_ACCESS_KEY,
        secretAccessKey: process.env.BIZNET_SECRET_KEY,
      },
    })
  : null;

// ==================================================
// 5. KONFIGURASI UPLOAD
// ==================================================

const allowedTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter(req, file, callback) {
    if (!allowedTypes[file.mimetype]) {
      return callback(
        new Error("Format yang diizinkan: JPG, PNG, WEBP, atau GIF.")
      );
    }

    callback(null, true);
  },
});

// ==================================================
// 9. GALERI PUBLIK
// ==================================================

app.get("/api/images", async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         id,
         title,
         image_url,
         created_at
       FROM images
       ORDER BY created_at DESC`
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// ==================================================
// 11. UPLOAD GAMBAR KE BIZNET OBJECT STORAGE
// ==================================================

app.post("/upload", upload.single("image"), async (req, res, next) => {
  let objectKey;
  let uploadedToStorage = false;

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Pilih gambar terlebih dahulu.",
      });
    }

    const title = String(req.body?.title || "").trim();

    if (!title || title.length > 150) {
      return res.status(400).json({
        message: "Judul wajib diisi dan maksimal 150 karakter.",
      });
    }

    if (!storageConfigured || !s3) {
      return res.status(503).json({
        message: "Konfigurasi Biznet belum lengkap. Periksa file .env.",
      });
    }

    const extension = allowedTypes[req.file.mimetype];
    objectKey = `uploads/${crypto.randomUUID()}.${extension}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        ACL: "public-read",
      })
    );

    uploadedToStorage = true;

    const encodedKey = objectKey
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");

    const imageUrl = `${endpoint}/${encodeURIComponent(bucket)}/${encodedKey}`;

    const [result] = await pool.execute(
      `INSERT INTO images (title, image_url, object_key)
       VALUES (?, ?, ?)`,
      [title, imageUrl, objectKey]
    );

    return res.status(201).json({
      message: "Gambar berhasil diunggah.",
      image: {
        id: result.insertId,
        title,
        image_url: imageUrl,
      },
    });
  } catch (error) {
    if (uploadedToStorage && objectKey && s3) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: objectKey,
          })
        );
      } catch (deleteError) {
        console.error(
          "Gagal menghapus objek setelah upload gagal:",
          deleteError.message
        );
      }
    }
    next(error);
  }
});

// ==================================================
// 12. DAFTAR GAMBAR TERSIMPAN
// ==================================================

app.get("/api/saved", async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, image_url, title, created_at
       FROM saved_images
       ORDER BY created_at DESC`
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// ==================================================
// 13. SIMPAN GAMBAR DARI GALERI
// ==================================================

app.post("/api/saved", async (req, res, next) => {
  try {
    const imageUrl = String(req.body?.image_url || "").trim();
    const title = String(req.body?.title || "Gambar tersimpan").trim();

    let parsedUrl;

    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return res.status(400).json({
        message: "URL gambar tidak valid.",
      });
    }

    if (
      !["http:", "https:"].includes(parsedUrl.protocol) ||
      imageUrl.length > 2048 ||
      !title ||
      title.length > 150
    ) {
      return res.status(400).json({
        message: "URL atau judul tidak valid.",
      });
    }

    const urlHash = crypto
      .createHash("sha256")
      .update(imageUrl)
      .digest("hex");

    const [existing] = await pool.execute(
      `SELECT id FROM saved_images WHERE url_hash = ? LIMIT 1`,
      [urlHash]
    );

    if (existing.length > 0) {
      await pool.execute(
        `UPDATE saved_images SET title = ? WHERE id = ?`,
        [title, existing[0].id]
      );
    } else {
      await pool.execute(
        `INSERT INTO saved_images (image_url, title, url_hash)
         VALUES (?, ?, ?)`,
        [imageUrl, title, urlHash]
      );
    }

    return res.status(201).json({
      message: "Gambar berhasil disimpan.",
    });
  } catch (error) {
    next(error);
  }
});

// ==================================================
// 13.5 ENDPOINT PROXY DOWNLOAD GAMBAR (BARU)
// ==================================================

app.get("/api/download", async (req, res) => {
  try {
    const imageUrl = req.query.url;
    const filename = req.query.name || "gambar-inspopic";

    if (!imageUrl) {
      return res.status(400).send("URL gambar diperlukan.");
    }

    const response = await fetch(imageUrl);

    if (!response.ok) {
      return res.status(404).send("Gambar tidak ditemukan.");
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
      ? "webp"
      : contentType.includes("gif")
      ? "gif"
      : "jpg";

    const safeFilename = filename.replace(/[^\w\s-]/gi, "_").trim();

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFilename}.${ext}"`
    );

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return res.send(buffer);
  } catch (error) {
    console.error("Gagal mendownload via proxy:", error);
    res.status(500).send("Terjadi kesalahan saat mengunduh gambar.");
  }
});

// ==================================================
// 14. HAPUS GAMBAR DARI DAFTAR TERSIMPAN
// ==================================================

app.delete("/api/saved/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "ID gambar tidak valid.",
      });
    }

    const [result] = await pool.execute(
      `DELETE FROM saved_images WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Gambar tersimpan tidak ditemukan.",
      });
    }

    return res.json({
      message: "Gambar dihapus dari daftar tersimpan.",
    });
  } catch (error) {
    next(error);
  }
});

// ==================================================
// 15. HALAMAN UTAMA
// ==================================================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==================================================
// 15.5 FIX KEAMANAN BUCKET BIZNET
// ==================================================

app.get("/buka-kunci", async (req, res) => {
  try {
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "PublicReadGetObject",
          Effect: "Allow",
          Principal: "*",
          Action: "s3:GetObject",
          Resource: `arn:aws:s3:::${bucket}/*`,
        },
      ],
    };

    const command = new PutBucketPolicyCommand({
      Bucket: bucket,
      Policy: JSON.stringify(policy),
    });

    await s3.send(command);
    res.send(
      "<h1>SUKSES!</h1><p>Gudang Biznet sekarang sudah terbuka untuk publik. Silakan coba upload gambar lagi di InspoPic.</p>"
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("GAGAL MEMBUKA KUNCI: " + error.message);
  }
});

// ==================================================
// 16. PENANGANAN ERROR
// ==================================================

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? "Ukuran gambar maksimal 5 MB."
          : err.message,
    });
  }

  if (err.message && err.message.startsWith("Format yang diizinkan:")) {
    return res.status(400).json({
      message: err.message,
    });
  }

  console.error("Kesalahan server:", err);

  return res.status(500).json({
    message: "Terjadi kesalahan pada server.",
  });
});

// ==================================================
// 17. MENJALANKAN SERVER
// ==================================================

async function startServer() {
  const connection = await pool.getConnection();
  connection.release();

  app.listen(PORT, () => {
    console.log(`InspoPic berjalan di http://localhost:${PORT}`);

    if (!storageConfigured) {
      console.warn(
        "Biznet belum dikonfigurasi lengkap. Fitur upload belum tersedia."
      );
    }
  });
}

startServer().catch((error) => {
  console.error(
    "Gagal memulai server. Periksa konfigurasi MySQL:",
    error.message
  );
  process.exit(1);
});

// ==================================================
// 11.5 HAPUS GAMBAR UTAMA (UNGGAHAN)
// ==================================================

app.delete("/api/images/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ message: "ID gambar tidak valid." });
    }

    // Ambil object_key gambar dari database
    const [rows] = await pool.execute(
      `SELECT object_key FROM images WHERE id = ? LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Gambar tidak ditemukan." });
    }

    const objectKey = rows[0].object_key;

    // Hapus data dari database MySQL
    await pool.execute(`DELETE FROM images WHERE id = ?`, [id]);

    // Hapus file dari Biznet Object Storage jika S3 aktif
    if (s3 && objectKey) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: objectKey,
          })
        );
      } catch (s3Error) {
        console.error("Gagal menghapus file dari Biznet Storage:", s3Error.message);
      }
    }

    return res.json({ message: "Unggahan berhasil dihapus." });
  } catch (error) {
    next(error);
  }
});

// ==================================================
// 11.6 EDIT JUDUL GAMBAR (UPDATE)
// ==================================================

app.put("/api/images/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const title = String(req.body?.title || "").trim();

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ message: "ID gambar tidak valid." });
    }

    if (!title || title.length > 150) {
      return res.status(400).json({ message: "Judul wajib diisi dan maksimal 150 karakter." });
    }

    const [result] = await pool.execute(
      `UPDATE images SET title = ? WHERE id = ?`,
      [title, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Gambar tidak ditemukan." });
    }

    return res.json({ message: "Judul gambar berhasil diperbarui.", title });
  } catch (error) {
    next(error);
  }
});