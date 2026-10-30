
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs/promises");

const {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
    DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

// ==================================================
// 1. KONFIGURASI DASAR
// ==================================================

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const endpoint = (process.env.BIZNET_ENDPOINT || "").replace(/\/+$/, "");
const bucket = process.env.BIZNET_BUCKET || "";
const region = process.env.BIZNET_REGION || "idn";

const accessKeyId = process.env.BIZNET_ACCESS_KEY;
const secretAccessKey = process.env.BIZNET_SECRET_KEY;

const storageConfigured = Boolean(
    endpoint && bucket && accessKeyId && secretAccessKey
);

// Lokasi penyimpanan metadata di Object Storage
const DATA_OBJECT_KEY = "data/inspopic.json";

// File lokal hanya digunakan sebagai data awal/migrasi
const LOCAL_SEED_PATH = path.join(
    __dirname,
    "data",
    "inspopic.json"
);

// ==================================================
// 2. MIDDLEWARE
// ==================================================

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ==================================================
// 3. KONEKSI BIZNET NEO OBJECT STORAGE
// ==================================================

const s3 = storageConfigured
    ? new S3Client({
        endpoint,
        region,
        forcePathStyle: true,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    })
    : null;

// ==================================================
// 4. KONFIGURASI UPLOAD GAMBAR
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
                new Error(
                    "Format yang diizinkan: JPG, PNG, WEBP, atau GIF."
                )
            );
        }

        callback(null, true);
    },
});

// ==================================================
// 5. STRUKTUR DATA JSON
// ==================================================

function createEmptyData() {
    return {
        schema_version: 1,
        images: [],
        saved_images: [],
        next_ids: {
            images: 1,
            saved_images: 1,
        },
    };
}

// Menyesuaikan struktur data agar konsisten
function normalizeData(data = {}) {
    const images = Array.isArray(data.images)
        ? data.images
        : [];

    const savedImages = Array.isArray(data.saved_images)
        ? data.saved_images
        : [];

    const highestImageId = images.reduce(
        (max, item) => Math.max(max, Number(item.id) || 0),
        0
    );

    const highestSavedId = savedImages.reduce(
        (max, item) => Math.max(max, Number(item.id) || 0),
        0
    );

    return {
        schema_version: 1,

        images,
        saved_images: savedImages,

        next_ids: {
            images: Math.max(
                Number(data.next_ids?.images) || 1,
                highestImageId + 1
            ),

            saved_images: Math.max(
                Number(data.next_ids?.saved_images) || 1,
                highestSavedId + 1
            ),
        },
    };
}

// ==================================================
// 6. MEMBACA OBJECT STORAGE
// ==================================================

async function streamToString(stream) {
    const chunks = [];

    for await (const chunk of stream) {
        chunks.push(
            Buffer.isBuffer(chunk)
                ? chunk
                : Buffer.from(chunk)
        );
    }

    return Buffer.concat(chunks).toString("utf8");
}

function isObjectNotFound(error) {
    return (
        error.name === "NoSuchKey" ||
        error.name === "NotFound" ||
        error.$metadata?.httpStatusCode === 404
    );
}

async function readLocalSeed() {
    try {
        const content = await fs.readFile(
            LOCAL_SEED_PATH,
            "utf8"
        );

        return normalizeData(JSON.parse(content));
    } catch (error) {
        if (error.code === "ENOENT") {
            return createEmptyData();
        }

        throw error;
    }
}

// Membaca metadata dari Biznet
async function readData() {
    if (!s3) {
        throw new Error(
            "Biznet Object Storage belum dikonfigurasi."
        );
    }

    try {
        const result = await s3.send(
            new GetObjectCommand({
                Bucket: bucket,
                Key: DATA_OBJECT_KEY,
            })
        );

        const content = await streamToString(result.Body);

        return normalizeData(JSON.parse(content));

    } catch (error) {
        if (!isObjectNotFound(error)) {
            throw error;
        }

        console.log(
            "Metadata belum ditemukan. Memeriksa file data awal..."
        );

        // Jika metadata belum ada, gunakan file migrasi lokal
        const initialData = await readLocalSeed();

        await writeData(initialData);

        console.log(
            "Metadata awal berhasil disimpan ke Object Storage."
        );

        return initialData;
    }
}

// ==================================================
// 7. MENYIMPAN METADATA KE OBJECT STORAGE
// ==================================================

async function writeData(data) {
    if (!s3) {
        throw new Error(
            "Biznet Object Storage belum dikonfigurasi."
        );
    }

    const normalizedData = normalizeData(data);

    await s3.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: DATA_OBJECT_KEY,

            Body: JSON.stringify(
                normalizedData,
                null,
                2
            ),

            ContentType: "application/json; charset=utf-8",
        })
    );

    return normalizedData;
}

// ==================================================
// 8. ANTRIAN OPERASI DATA
// ==================================================

// Mencegah dua proses tulis dalam satu server
// saling menimpa metadata secara bersamaan.

let dataQueue = Promise.resolve();

function withDataLock(task) {
    const operation = dataQueue.then(task, task);

    dataQueue = operation.catch(() => {});

    return operation;
}

// ==================================================
// 9. UTILITAS URL GAMBAR
// ==================================================

function createImageUrl(objectKey) {
    const encodedKey = objectKey
        .split("/")
        .map((part) => encodeURIComponent(part))
        .join("/");

    return `${endpoint}/${encodeURIComponent(bucket)}/${encodedKey}`;
}

// Memastikan URL hanya berasal dari bucket InspoPic
function isValidImageUrl(value) {
    try {
        const parsed = new URL(value);
        const expected = new URL(`${endpoint}/`);

        return (
            parsed.protocol === "https:" &&
            parsed.origin === expected.origin &&
            parsed.pathname.startsWith(
                `/${encodeURIComponent(bucket)}/uploads/`
            )
        );
    } catch {
        return false;
    }
}

// ==================================================
// 10. GALERI PUBLIK
// ==================================================

app.get("/api/images", async (req, res, next) => {
    try {
        const data = await withDataLock(readData);

        const images = [...data.images].sort(
            (a, b) =>
                new Date(b.created_at) - new Date(a.created_at)
        );

        return res.json({
            images,
        });

    } catch (error) {
        next(error);
    }
});

// ==================================================
// 11. UPLOAD GAMBAR KE OBJECT STORAGE
// ==================================================

app.post(
    "/upload",
    upload.single("image"),
    async (req, res, next) => {
        let objectKey;
        let uploadedToStorage = false;

        try {
            if (!req.file) {
                return res.status(400).json({
                    message: "Pilih gambar terlebih dahulu.",
                });
            }

            const title = String(
                req.body?.title || ""
            ).trim();

            if (!title || title.length > 150) {
                return res.status(400).json({
                    message:
                        "Judul wajib diisi dan maksimal 150 karakter.",
                });
            }

            if (!storageConfigured || !s3) {
                return res.status(503).json({
                    message:
                        "Konfigurasi Biznet belum lengkap. Periksa file .env.",
                });
            }

            const extension = allowedTypes[req.file.mimetype];

            objectKey = `uploads/${crypto.randomUUID()}.${extension}`;

            // Upload file gambar
            await s3.send(
                new PutObjectCommand({
                    Bucket: bucket,
                    Key: objectKey,
                    Body: req.file.buffer,
                    ContentType: req.file.mimetype,
                })
            );

            uploadedToStorage = true;

            const imageUrl = createImageUrl(objectKey);

            // Simpan metadata gambar ke JSON Object Storage
            const image = await withDataLock(async () => {
                const data = await readData();

                const newImage = {
                    id: data.next_ids.images++,
                    title,
                    image_url: imageUrl,
                    object_key: objectKey,
                    created_at: new Date().toISOString(),
                };

                data.images.push(newImage);

                await writeData(data);

                return newImage;
            });

            return res.status(201).json({
                message: "Gambar berhasil diunggah.",
                image,
            });

        } catch (error) {
            // Jika metadata gagal disimpan, hapus file
            // yang sudah telanjur diunggah.
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
                        "Gagal membersihkan file:",
                        deleteError.message
                    );
                }
            }

            next(error);
        }
    }
);

// ==================================================
// 12. DAFTAR GAMBAR TERSIMPAN
// ==================================================

app.get("/api/saved", async (req, res, next) => {
    try {
        const data = await withDataLock(readData);

        const savedImages = [...data.saved_images].sort(
            (a, b) =>
                new Date(b.created_at) - new Date(a.created_at)
        );

        // Mempertahankan format array agar kompatibel
        // dengan frontend lama.
        return res.json(savedImages);

    } catch (error) {
        next(error);
    }
});

// ==================================================
// 13. SIMPAN GAMBAR DARI GALERI
// ==================================================

app.post("/api/saved", async (req, res, next) => {
    try {
        const imageUrl = String(
            req.body?.image_url || ""
        ).trim();

        const title = String(
            req.body?.title || "Gambar tersimpan"
        ).trim();

        if (
            !imageUrl ||
            imageUrl.length > 2048 ||
            !title ||
            title.length > 150 ||
            !isValidImageUrl(imageUrl)
        ) {
            return res.status(400).json({
                message: "URL atau judul gambar tidak valid.",
            });
        }

        const urlHash = crypto
            .createHash("sha256")
            .update(imageUrl)
            .digest("hex");

        await withDataLock(async () => {
            const data = await readData();

            const existing = data.saved_images.find(
                (item) => item.url_hash === urlHash
            );

            if (existing) {
                existing.title = title;
            } else {
                data.saved_images.push({
                    id: data.next_ids.saved_images++,
                    image_url: imageUrl,
                    title,
                    url_hash: urlHash,
                    created_at: new Date().toISOString(),
                });
            }

            await writeData(data);
        });

        return res.status(201).json({
            message: "Gambar berhasil disimpan.",
        });

    } catch (error) {
        next(error);
    }
});

// ==================================================
// 14. DOWNLOAD GAMBAR
// ==================================================

app.get("/api/download", async (req, res) => {
    try {
        const imageUrl = String(req.query.url || "");
        const filename = String(
            req.query.name || "gambar-inspopic"
        );

        if (!isValidImageUrl(imageUrl)) {
            return res.status(400).send(
                "URL gambar tidak valid."
            );
        }

        const response = await fetch(imageUrl, {
            signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
            return res.status(404).send(
                "Gambar tidak ditemukan."
            );
        }

        const contentType =
            response.headers.get("content-type") || "";

        const extensionMap = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
            "image/gif": "gif",
        };

        const extension = extensionMap[
            contentType.split(";")[0].trim()
        ];

        if (!extension) {
            return res.status(415).send(
                "Format gambar tidak didukung."
            );
        }

        const safeFilename = filename
            .replace(/[^\w\s-]/g, "_")
            .trim()
            .slice(0, 100) || "gambar-inspopic";

        const buffer = Buffer.from(
            await response.arrayBuffer()
        );

        res.setHeader("Content-Type", contentType);

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${safeFilename}.${extension}"`
        );

        return res.send(buffer);

    } catch (error) {
        console.error(
            "Gagal mengunduh gambar:",
            error.message
        );

        return res.status(500).send(
            "Terjadi kesalahan saat mengunduh gambar."
        );
    }
});

// ==================================================
// 15. HAPUS GAMBAR DARI DAFTAR TERSIMPAN
// ==================================================

app.delete("/api/saved/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID gambar tidak valid.",
            });
        }

        const deleted = await withDataLock(async () => {
            const data = await readData();

            const index = data.saved_images.findIndex(
                (item) => Number(item.id) === id
            );

            if (index === -1) {
                return false;
            }

            data.saved_images.splice(index, 1);

            await writeData(data);

            return true;
        });

        if (!deleted) {
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
// 16. HAPUS GAMBAR UTAMA
// ==================================================

app.delete("/api/images/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID gambar tidak valid.",
            });
        }

        const deletedImage = await withDataLock(async () => {
            const data = await readData();

            const index = data.images.findIndex(
                (item) => Number(item.id) === id
            );

            if (index === -1) {
                return null;
            }

            const image = data.images[index];

            // Hapus metadata dari JSON
            data.images.splice(index, 1);

            // Hapus juga koleksi tersimpan yang merujuk gambar ini
            data.saved_images = data.saved_images.filter(
                (item) => item.image_url !== image.image_url
            );

            await writeData(data);

            return image;
        });

        if (!deletedImage) {
            return res.status(404).json({
                message: "Gambar tidak ditemukan.",
            });
        }

        // Hapus file fisik setelah metadata diperbarui
        if (deletedImage.object_key) {
            try {
                await s3.send(
                    new DeleteObjectCommand({
                        Bucket: bucket,
                        Key: deletedImage.object_key,
                    })
                );
            } catch (error) {
                console.error(
                    "Metadata terhapus, tetapi file gagal dihapus:",
                    error.message
                );
            }
        }

        return res.json({
            message: "Unggahan berhasil dihapus.",
        });

    } catch (error) {
        next(error);
    }
});

// ==================================================
// 17. EDIT JUDUL GAMBAR
// ==================================================

app.put("/api/images/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        const title = String(
            req.body?.title || ""
        ).trim();

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID gambar tidak valid.",
            });
        }

        if (!title || title.length > 150) {
            return res.status(400).json({
                message:
                    "Judul wajib diisi dan maksimal 150 karakter.",
            });
        }

        const updated = await withDataLock(async () => {
            const data = await readData();

            const image = data.images.find(
                (item) => Number(item.id) === id
            );

            if (!image) {
                return false;
            }

            image.title = title;

            await writeData(data);

            return true;
        });

        if (!updated) {
            return res.status(404).json({
                message: "Gambar tidak ditemukan.",
            });
        }

        return res.json({
            message: "Judul gambar berhasil diperbarui.",
            title,
        });

    } catch (error) {
        next(error);
    }
});

// ==================================================
// 18. HALAMAN UTAMA
// ==================================================

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

// ==================================================
// 19. PENANGANAN ERROR
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

    if (
        err.message &&
        err.message.startsWith("Format yang diizinkan:")
    ) {
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
// 20. MENJALANKAN SERVER
// ==================================================

app.listen(PORT, () => {
    console.log("------------------------------------");
    console.log("InspoPic berjalan!");
    console.log(`http://localhost:${PORT}`);
    console.log("------------------------------------");

    if (storageConfigured) {
        console.log("Biznet Object Storage: TERKONFIGURASI");
        console.log("Metadata: data/inspopic.json");
        console.log("Gambar: uploads/");
    } else {
        console.warn(
            "Biznet belum dikonfigurasi. Periksa file .env."
        );
    }
});
