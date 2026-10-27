/**
 * ==========================================
 * INSPOPIC - HOME PAGE JAVASCRIPT
 * Galeri, pencarian, upload, dan modal gambar.
 * ==========================================
 */

document.addEventListener("DOMContentLoaded", () => {
    // ------------------------------------------
    // 1. ELEMEN HALAMAN
    // ------------------------------------------

    const gallery = document.getElementById("image-gallery");
    const uploadModal = document.getElementById("uploadModal");
    const imageModal = document.getElementById("imageModal");

    const uploadForm = document.getElementById("uploadForm");
    const uploadStatus = document.getElementById("uploadStatus");
    const uploadSubmit = document.getElementById("uploadSubmit");

    const fileInput = document.getElementById("fileInput");
    const imageTitleInput = document.getElementById("imageTitle");

    const selectedImagePreview =
        document.getElementById("selectedImagePreview");

    const imageModalTitle =
        document.getElementById("imageModalTitle");

    const imageActionStatus =
        document.getElementById("imageActionStatus");

    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");
    const searchStatus = document.getElementById("searchStatus");
    const emptySearch = document.getElementById("emptySearch");

    let selectedImageUrl = "";
    let selectedImageTitle = "";

    // ------------------------------------------
    // 2. MEMUAT HEADER DAN FOOTER
    // ------------------------------------------

    async function loadComponent(containerId, filePath) {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            const response = await fetch(filePath);

            if (!response.ok) {
                throw new Error(`Gagal memuat ${filePath}`);
            }

            container.innerHTML = await response.text();
        } catch (error) {
            console.error("Kesalahan komponen:", error);
        }
    }

    loadComponent("header-container", "/header.html");
    loadComponent("footer-container", "/footer.html");

    // ------------------------------------------
    // 3. MODAL
    // ------------------------------------------

    function showModal(modal) {
        if (!modal) return;

        modal.classList.remove("hidden");
        modal.classList.add("flex");
        document.body.classList.add("modal-open");
    }

    function hideModal(modal) {
        if (!modal) return;

        modal.classList.add("hidden");
        modal.classList.remove("flex");

        const anotherModalOpen = [uploadModal, imageModal].some(
            item => item && !item.classList.contains("hidden")
        );

        if (!anotherModalOpen) {
            document.body.classList.remove("modal-open");
        }
    }

    document.getElementById("openUploadModal")
        ?.addEventListener("click", () => {
            if (uploadStatus) uploadStatus.textContent = "";
            showModal(uploadModal);
        });

    document.getElementById("closeUploadModal")
        ?.addEventListener("click", () => hideModal(uploadModal));

    document.getElementById("closeImageModal")
        ?.addEventListener("click", () => hideModal(imageModal));

    [uploadModal, imageModal].forEach(modal => {
        modal?.addEventListener("click", event => {
            if (event.target === modal) hideModal(modal);
        });
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            hideModal(uploadModal);
            hideModal(imageModal);
        }
    });

    // ------------------------------------------
    // 4. PENCARIAN GALERI
    // ------------------------------------------

    function filterGallery() {
        if (!gallery) return;

        const keyword = (searchInput?.value || "")
            .trim()
            .toLocaleLowerCase("id");

        const cards = gallery.querySelectorAll(".masonry-item");
        let visibleCount = 0;

        cards.forEach(card => {
            const image = card.querySelector(".gallery-image");

            const title = (
                card.dataset.title ||
                image?.alt ||
                ""
            ).toLocaleLowerCase("id");

            const matches = title.includes(keyword);

            card.classList.toggle("is-hidden", !matches);

            if (matches) visibleCount++;
        });

        if (emptySearch) {
            emptySearch.classList.toggle("hidden", visibleCount > 0);
        }

        if (searchStatus) {
            searchStatus.textContent = keyword
                ? `${visibleCount} gambar ditemukan`
                : `${visibleCount} gambar tersedia`;
        }
    }

    searchInput?.addEventListener("input", filterGallery);

    searchForm?.addEventListener("submit", event => {
        event.preventDefault();
        filterGallery();
    });

    const query = new URLSearchParams(window.location.search).get("q");

    if (query && searchInput) {
        searchInput.value = query;
    }

    // ------------------------------------------
    // 5. MEMBUAT KARTU GALERI
    // ------------------------------------------

    function createGalleryCard(item) {
        const imageUrl = item.image_url || item.url;

        if (!imageUrl) return null;

        const title = item.title || "Gambar InspoPic";

        const card = document.createElement("article");
        card.className = "masonry-item group";
        card.dataset.title = title;

        const image = document.createElement("img");
        image.src = imageUrl;
        image.alt = title;
        image.loading = "lazy";
        image.className =
            "gallery-image transition duration-300 group-hover:scale-[1.02]";

        image.addEventListener("error", () => {
            console.error("Gambar gagal dimuat:", imageUrl);
        });

        const button = document.createElement("button");
        button.type = "button";
        button.className =
            "save-image-btn absolute bottom-3 right-3 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white opacity-100 shadow transition hover:bg-red-700 sm:opacity-0 sm:group-hover:opacity-100";
        button.textContent = "Pilih Gambar";
        button.dataset.image = imageUrl;
        button.dataset.title = title;

        card.append(image, button);

        return card;
    }

    // ------------------------------------------
    // 6. MENGAMBIL GALERI DARI BACKEND
    // ------------------------------------------

    async function loadGallery() {
        if (!gallery) return;

        gallery.setAttribute("aria-busy", "true");

        try {
            const data = await apiFetch("/api/images");

            const images = Array.isArray(data)
                ? data
                : Array.isArray(data.images)
                    ? data.images
                    : [];

            gallery.replaceChildren();

            images.forEach(item => {
                const card = createGalleryCard(item);
                if (card) gallery.appendChild(card);
            });

            filterGallery();
        } catch (error) {
            console.error("Gagal memuat galeri:", error);

            if (searchStatus) {
                searchStatus.textContent =
                    "Galeri gagal dimuat. Silakan muat ulang halaman.";
            }
        } finally {
            gallery.removeAttribute("aria-busy");
        }
    }

    // ------------------------------------------
    // 7. MEMILIH GAMBAR DAN MEMBUKA MODAL
    // ------------------------------------------

    gallery?.addEventListener("click", event => {
        const target = event.target;
        if (!(target instanceof Element)) return;

        const button = target.closest(".save-image-btn");
        const clickedImage = target.closest(".gallery-image");

        if (!button && !clickedImage) return;

        const card = (button || clickedImage).closest(".masonry-item");
        const cardImage = card?.querySelector(".gallery-image");

        if (!cardImage) return;

        selectedImageUrl = button?.dataset.image || cardImage.src;

        selectedImageTitle =
            button?.dataset.title ||
            card.dataset.title ||
            cardImage.alt ||
            "Gambar InspoPic";

        if (selectedImagePreview) {
            selectedImagePreview.src = selectedImageUrl;
            selectedImagePreview.alt = selectedImageTitle;
        }

        if (imageModalTitle) {
            imageModalTitle.textContent = selectedImageTitle;
        }

        if (imageActionStatus) imageActionStatus.textContent = "";

        showModal(imageModal);
    });

    // ------------------------------------------
    // 8. SIMPAN GAMBAR KE DATABASE MYSQL (/api/saved)
    // ------------------------------------------

    document.getElementById("saveSelectedImage")
        ?.addEventListener("click", async () => {
            if (!selectedImageUrl) return;

            if (imageActionStatus) {
                imageActionStatus.textContent = "Menyimpan gambar ke profil...";
                imageActionStatus.className = "mt-3 text-center text-sm text-gray-500";
            }

            try {
                const result = await apiFetch("/api/saved", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        image_url: selectedImageUrl,
                        title: selectedImageTitle || "Gambar InspoPic",
                    }),
                });

                if (imageActionStatus) {
                    imageActionStatus.textContent = "✓ " + (result.message || "Gambar berhasil disimpan.");
                    imageActionStatus.className = "mt-3 text-center text-sm font-semibold text-green-600";
                }
            } catch (error) {
                console.error("Gagal menyimpan gambar:", error);

                if (imageActionStatus) {
                    imageActionStatus.textContent =
                        error.message || "Gagal menyimpan gambar. Coba lagi.";
                    imageActionStatus.className = "mt-3 text-center text-sm font-semibold text-red-600";
                }
            }
        });

    // ------------------------------------------
    // 8.5 BUKA GAMBAR ASLI
    // ------------------------------------------

    document.getElementById("openOriginalImage")
        ?.addEventListener("click", () => {
            if (selectedImageUrl) {
                window.open(
                    selectedImageUrl,
                    "_blank",
                    "noopener,noreferrer"
                );
            }
        });

        // ------------------------------------------
    // 8.1 UNDUH GAMBAR KE LAPTOP/HP VIA SERVER PROXY
    // ------------------------------------------

    document.getElementById("downloadImage")
        ?.addEventListener("click", () => {
            if (!selectedImageUrl) return;

            if (imageActionStatus) {
                imageActionStatus.textContent = "✓ Unduhan dimulai...";
                imageActionStatus.className = "mt-3 text-center text-sm font-semibold text-green-600";
            }

            // Panggil endpoint /api/download di server
            const downloadUrl = `/api/download?url=${encodeURIComponent(selectedImageUrl)}&name=${encodeURIComponent(selectedImageTitle || "gambar-inspopic")}`;

            window.location.href = downloadUrl;
        });
    // ------------------------------------------
    // 9. UPLOAD GAMBAR KE BACKEND
    // ------------------------------------------

    uploadForm?.addEventListener("submit", async event => {
        event.preventDefault();

        const file = fileInput?.files?.[0];
        const title = imageTitleInput?.value.trim() || "";

        if (!file) {
            if (uploadStatus) {
                uploadStatus.textContent = "Pilih gambar terlebih dahulu.";
                uploadStatus.className =
                    "mt-4 text-center text-sm text-red-600";
            }
            return;
        }

        if (!title) {
            if (uploadStatus) {
                uploadStatus.textContent = "Judul gambar wajib diisi.";
                uploadStatus.className =
                    "mt-4 text-center text-sm text-red-600";
            }
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
        ];

        if (!allowedTypes.includes(file.type)) {
            if (uploadStatus) {
                uploadStatus.textContent = "Format gambar tidak didukung.";
                uploadStatus.className =
                    "mt-4 text-center text-sm text-red-600";
            }
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            if (uploadStatus) {
                uploadStatus.textContent = "Ukuran gambar maksimal 5 MB.";
                uploadStatus.className =
                    "mt-4 text-center text-sm text-red-600";
            }
            return;
        }

        const formData = new FormData();
        formData.append("image", file);
        formData.append("title", title);

        if (uploadSubmit) {
            uploadSubmit.disabled = true;
            uploadSubmit.textContent = "Mengunggah...";
        }

        if (uploadStatus) {
            uploadStatus.textContent = "Sedang mengunggah gambar...";
            uploadStatus.className =
                "mt-4 text-center text-sm text-blue-600";
        }

        try {
            const result = await apiFetch("/upload", {
                method: "POST",
                body: formData
            });

            const uploadedImage = result.image;

            if (!uploadedImage?.image_url) {
                throw new Error(
                    "Upload diproses, tetapi URL gambar tidak ditemukan."
                );
            }

            const card = createGalleryCard({
                ...uploadedImage,
                title: uploadedImage.title || title
            });

            if (card && gallery) {
                gallery.prepend(card);
            }

            if (searchInput) searchInput.value = "";
            filterGallery();

            if (uploadStatus) {
                uploadStatus.textContent =
                    result.message || "Gambar berhasil diunggah.";

                uploadStatus.className =
                    "mt-4 text-center text-sm text-green-600";
            }

            uploadForm.reset();

            await loadGallery();

            setTimeout(() => hideModal(uploadModal), 900);
        } catch (error) {
            console.error("Upload gagal:", error);

            if (uploadStatus) {
                uploadStatus.textContent =
                    error.message || "Terjadi kesalahan saat upload.";

                uploadStatus.className =
                    "mt-4 text-center text-sm text-red-600";
            }
        } finally {
            if (uploadSubmit) {
                uploadSubmit.disabled = false;
                uploadSubmit.textContent = "Upload Gambar";
            }
        }
    });

    // ------------------------------------------
    // 10. INISIALISASI GALERI
    // ------------------------------------------

    loadGallery();
});