
/**
 * ==========================================
 * INSPOPIC - PROFILE JAVASCRIPT
 * ==========================================
 * Mengelola:
 * - Informasi profil pengguna
 * - Edit profil melalui localStorage
 * - Galeri gambar unggahan
 * - Galeri gambar tersimpan
 * - Edit judul gambar
 * - Hapus gambar dan data tersimpan
 *
 * Penyimpanan:
 * - Profil pengguna: localStorage browser
 * - Metadata gambar: Biznet Neo Object Storage
 *   melalui REST API backend.
 * - File gambar: Biznet Neo Object Storage
 * ==========================================
 */

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. ELEMEN HALAMAN
    // ==========================================

    const profileName = document.getElementById("profileName");
    const profileUsername = document.getElementById("profileUsername");
    const profileBio = document.getElementById("profileBio");
    const profileLocation = document.getElementById("profileLocation");
    const avatarInitial = document.getElementById("avatarInitial");

    // Modal edit profil
    const modal = document.getElementById("editProfileModal");
    const form = document.getElementById("editProfileForm");

    const editName = document.getElementById("editName");
    const editUsername = document.getElementById("editUsername");
    const editBio = document.getElementById("editBio");
    const editLocation = document.getElementById("editLocation");

    const bioCount = document.getElementById("bioCount");
    const status = document.getElementById("editProfileStatus");

    // Galeri profil
    const gallery = document.getElementById("profileGallery");
    const emptyGallery = document.getElementById("emptyGallery");

    const galleryHeading = document.getElementById("galleryHeading");
    const galleryDescription = document.getElementById("galleryDescription");
    const emptyGalleryTitle = document.getElementById("emptyGalleryTitle");
    const emptyGalleryText = document.getElementById("emptyGalleryText");

    // Statistik
    const statImages = document.getElementById("statImages");
    const statSaved = document.getElementById("statSaved");

    // Tab galeri
    const tabs = document.querySelectorAll(".profile-tab");

    // Modal edit judul gambar
    const editTitleModal = document.getElementById("editTitleModal");
    const editTitleForm = document.getElementById("editTitleForm");
    const imageTitleInput = document.getElementById("imageTitleInput");
    const editTitleStatus = document.getElementById("editTitleStatus");

    let currentEditImageId = null;


    // ==========================================
    // 2. DATA PROFIL PENGGUNA
    // ==========================================

    const defaultProfile = {
        name: "Pengguna InspoPic",
        username: "pengguna",
        bio: "Mengumpulkan inspirasi kecil untuk hari-hari yang lebih indah.",
        location: "Indonesia"
    };

    let profile = { ...defaultProfile };

    /**
     * Mengambil data profil dari localStorage.
     * Jika data tidak tersedia atau tidak valid,
     * gunakan profil default.
     */
    function loadProfile() {
        try {
            const savedProfile = localStorage.getItem("inspopicProfile");

            if (!savedProfile) return;

            const parsed = JSON.parse(savedProfile);

            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                return;
            }

            profile = {
                name: typeof parsed.name === "string"
                    ? parsed.name
                    : defaultProfile.name,

                username: typeof parsed.username === "string"
                    ? parsed.username
                    : defaultProfile.username,

                bio: typeof parsed.bio === "string"
                    ? parsed.bio
                    : defaultProfile.bio,

                location: typeof parsed.location === "string"
                    ? parsed.location
                    : defaultProfile.location
            };

        } catch (error) {
            console.warn("Data profil lokal tidak dapat dibaca:", error);
        }
    }


    // ==========================================
    // 3. MENAMPILKAN PROFIL
    // ==========================================

    /**
     * Memperbarui tampilan informasi profil.
     */
    function renderProfile() {
        if (profileName) {
            profileName.textContent = profile.name;
        }

        if (profileUsername) {
            profileUsername.textContent = `@${profile.username}`;
        }

        if (profileBio) {
            profileBio.textContent = profile.bio || "Belum ada bio.";
        }

        if (profileLocation) {
            profileLocation.textContent = profile.location || "Lokasi belum diatur";
        }

        if (avatarInitial) {
            avatarInitial.textContent =
                profile.name.trim().charAt(0).toUpperCase() || "U";
        }

        // Header disinkronkan melalui header.js.
    }


    // ==========================================
    // 4. MEMUAT KOMPONEN HEADER DAN FOOTER
    // ==========================================

    /**
     * Memuat komponen HTML eksternal.
     */
    async function loadComponent(containerId, filePath) {
        const container = document.getElementById(containerId);

        if (!container) return;

        try {
            const response = await fetch(filePath);

            if (!response.ok) {
                throw new Error(`Gagal memuat ${filePath}`);
            }

            container.innerHTML = await response.text();

            // Sinkronisasi tampilan profil setelah komponen dimuat.
            renderProfile();

        } catch (error) {
            console.error("Gagal memuat komponen:", error);
        }
    }


    // ==========================================
    // 5. MODAL EDIT PROFIL
    // ==========================================

    /**
     * Membuka modal edit profil.
     */
    function openModal() {
        if (!modal) return;

        if (editName) editName.value = profile.name;
        if (editUsername) editUsername.value = profile.username;
        if (editBio) editBio.value = profile.bio;
        if (editLocation) editLocation.value = profile.location;

        if (bioCount && editBio) {
            bioCount.textContent = editBio.value.length;
        }

        if (status) {
            status.textContent = "";
            status.classList.add("hidden");
        }

        modal.classList.remove("hidden");
        modal.classList.add("flex");

        document.body.classList.add("modal-open");

        editName?.focus();
    }

    /**
     * Menutup modal edit profil.
     */
    function closeModal() {
        if (!modal) return;

        modal.classList.add("hidden");
        modal.classList.remove("flex");

        document.body.classList.remove("modal-open");
    }

    document.getElementById("openEditProfile")
        ?.addEventListener("click", openModal);

    document.getElementById("closeEditProfile")
        ?.addEventListener("click", closeModal);

    document.getElementById("cancelEditProfile")
        ?.addEventListener("click", closeModal);

    // Menutup modal ketika pengguna mengklik area luar.
    modal?.addEventListener("click", event => {
        if (event.target === modal) {
            closeModal();
        }
    });


    // ==========================================
    // 6. MENGHITUNG KARAKTER BIO
    // ==========================================

    editBio?.addEventListener("input", () => {
        if (bioCount) {
            bioCount.textContent = editBio.value.length;
        }
    });


    // ==========================================
    // 7. MENYIMPAN EDIT PROFIL
    // ==========================================

    form?.addEventListener("submit", event => {
        event.preventDefault();

        const name = editName?.value.trim() || "";
        const username = editUsername?.value.trim() || "";
        const bio = editBio?.value.trim() || "";
        const location = editLocation?.value.trim() || "";

        // Validasi input wajib.
        if (!name || !username) {
            alert("Nama dan username wajib diisi.");
            return;
        }

        const updatedProfile = {
            name,
            username,
            bio,
            location
        };

        try {
            // Profil disimpan secara lokal di browser.
            localStorage.setItem(
                "inspopicProfile",
                JSON.stringify(updatedProfile)
            );

            profile = updatedProfile;

            renderProfile();

            // Memberi tahu header.js bahwa profil berubah.
            window.dispatchEvent(
                new Event("inspopicProfileUpdated")
            );

            closeModal();

        } catch (error) {
            console.error("Gagal menyimpan profil:", error);
            alert("Gagal menyimpan perubahan profil.");
        }
    });


    // ==========================================
    // 8. DATA GALERI PROFIL
    // ==========================================

    let activeTab = "uploads";

    /**
     * Data gambar yang ditampilkan pada profil.
     *
     * uploads = gambar yang diunggah pengguna.
     * saved   = gambar yang disimpan pengguna.
     *
     * Data diambil dari backend, bukan database lokal.
     */
    const profileImages = {
        uploads: [],
        saved: []
    };

    /**
     * Menyesuaikan format respons backend.
     * Mendukung respons array langsung maupun objek.
     */
    function extractItems(data, possibleKeys = []) {
        if (Array.isArray(data)) {
            return data;
        }

        if (!data || typeof data !== "object") {
            return [];
        }

        for (const key of possibleKeys) {
            if (Array.isArray(data[key])) {
                return data[key];
            }
        }

        return [];
    }


    // ==========================================
    // 9. MODAL EDIT JUDUL GAMBAR
    // ==========================================

    /**
     * Membuka modal edit judul gambar.
     */
    function openEditTitleModal(id, currentTitle) {
        currentEditImageId = id;

        if (imageTitleInput) {
            imageTitleInput.value = currentTitle;
        }

        if (editTitleStatus) {
            editTitleStatus.textContent = "";
        }

        if (editTitleModal) {
            editTitleModal.classList.remove("hidden");
            editTitleModal.classList.add("flex");

            document.body.classList.add("modal-open");

            imageTitleInput?.focus();
        }
    }

    /**
     * Menutup modal edit judul gambar.
     */
    function closeEditTitleModal() {
        if (!editTitleModal) return;

        editTitleModal.classList.add("hidden");
        editTitleModal.classList.remove("flex");

        document.body.classList.remove("modal-open");

        currentEditImageId = null;
    }

    document.getElementById("closeEditTitleModal")
        ?.addEventListener("click", closeEditTitleModal);

    document.getElementById("cancelEditTitle")
        ?.addEventListener("click", closeEditTitleModal);

    editTitleModal?.addEventListener("click", event => {
        if (event.target === editTitleModal) {
            closeEditTitleModal();
        }
    });


    // ==========================================
    // 10. UPDATE JUDUL GAMBAR
    // ==========================================

    editTitleForm?.addEventListener("submit", async event => {
        event.preventDefault();

        const newTitle = imageTitleInput?.value.trim();

        if (!newTitle || currentEditImageId === null) {
            return;
        }

        try {
            if (editTitleStatus) {
                editTitleStatus.textContent = "Menyimpan...";
            }

            if (typeof apiFetch !== "function") {
                throw new Error("Fungsi apiFetch tidak tersedia.");
            }

            // Mengirim perubahan judul ke backend.
            await apiFetch(`/api/images/${encodeURIComponent(currentEditImageId)}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: newTitle
                })
            });

            // Memperbarui data lokal setelah backend berhasil.
            const item = profileImages.uploads.find(
                image => Number(image.id) === Number(currentEditImageId)
            );

            if (item) {
                item.title = newTitle;
            }

            renderGallery();
            closeEditTitleModal();

        } catch (error) {
            console.error("Gagal memperbarui judul:", error);

            if (editTitleStatus) {
                editTitleStatus.textContent =
                    error.message || "Gagal memperbarui judul.";
            }
        }
    });


    // ==========================================
    // 11. DELETE GAMBAR
    // ==========================================

    /**
     * Menghapus gambar unggahan atau gambar tersimpan.
     *
     * uploads -> DELETE /api/images/:id
     * saved   -> DELETE /api/saved/:id
     */
    async function deleteImage(id, tabName) {
        const isUpload = tabName === "uploads";

        const confirmation = confirm(
            isUpload
                ? "Apakah kamu yakin ingin menghapus gambar ini?"
                : "Apakah kamu yakin ingin menghapus gambar tersimpan ini?"
        );

        if (!confirmation) return;

        try {
            if (typeof apiFetch !== "function") {
                throw new Error("Fungsi apiFetch tidak tersedia.");
            }

            const endpoint = isUpload
                ? `/api/images/${encodeURIComponent(id)}`
                : `/api/saved/${encodeURIComponent(id)}`;

            // Hapus data melalui backend terlebih dahulu.
            await apiFetch(endpoint, {
                method: "DELETE"
            });

            // Perbarui tampilan setelah backend berhasil.
            profileImages[tabName] = profileImages[tabName].filter(
                item => Number(item.id) !== Number(id)
            );

            renderGallery();

        } catch (error) {
            console.error("Gagal menghapus gambar:", error);

            alert(error.message || "Gagal menghapus gambar.");
        }
    }


    // ==========================================
    // 12. MEMBUAT KARTU GAMBAR PROFIL
    // ==========================================

    /**
     * Membuat kartu gambar dengan tombol edit dan hapus.
     */
    function createProfileCard(item, tabName) {
        const imageUrl = item.image_url || item.url;

        if (!imageUrl) return null;

        const title = item.title || "Gambar InspoPic";

        const card = document.createElement("article");

        card.className = [
            "pin-card",
            "relative",
            "group",
            "rounded-2xl",
            "overflow-hidden",
            "bg-white",
            "shadow-sm",
            "border",
            "border-gray-100",
            "p-2",
            "mb-4"
        ].join(" ");

        card.dataset.tab = tabName;

        // Gambar.
        const image = document.createElement("img");

        image.src = imageUrl;
        image.alt = title;
        image.loading = "lazy";

        image.className = "w-full rounded-xl object-cover";

        // Judul gambar.
        const heading = document.createElement("h3");

        heading.className =
            "mt-2 px-1 font-semibold text-sm text-gray-800 truncate";

        heading.textContent = title;

        // Container tombol aksi.
        const actionContainer = document.createElement("div");

        actionContainer.className = [
            "absolute",
            "top-3",
            "right-3",
            "flex",
            "gap-1.5",
            "opacity-0",
            "group-hover:opacity-100",
            "transition",
            "duration-200"
        ].join(" ");


        // --------------------------------------
        // Tombol Edit
        // Hanya tersedia untuk gambar unggahan.
        // --------------------------------------

        if (tabName === "uploads") {
            const editBtn = document.createElement("button");

            editBtn.type = "button";

            editBtn.className =
                "bg-white/90 text-gray-700 hover:text-red-600 rounded-full p-2 text-xs font-bold shadow-md transition hover:bg-white";

            editBtn.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                </svg>
            `;

            editBtn.title = "Edit Judul";
            editBtn.setAttribute("aria-label", "Edit judul gambar");

            editBtn.addEventListener("click", event => {
                event.stopPropagation();

                openEditTitleModal(item.id, title);
            });

            actionContainer.appendChild(editBtn);
        }


        // --------------------------------------
        // Tombol Hapus
        // --------------------------------------

        const deleteBtn = document.createElement("button");

        deleteBtn.type = "button";

        deleteBtn.className =
            "bg-red-600 text-white rounded-full p-2 text-xs font-bold shadow-md transition hover:bg-red-700";

        deleteBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
            </svg>
        `;

        deleteBtn.title = "Hapus Gambar";
        deleteBtn.setAttribute("aria-label", "Hapus gambar");

        deleteBtn.addEventListener("click", event => {
            event.stopPropagation();

            deleteImage(item.id, tabName);
        });

        actionContainer.appendChild(deleteBtn);

        // Menyatukan seluruh elemen kartu.
        card.append(image, heading, actionContainer);

        return card;
    }


    // ==========================================
    // 13. MENAMPILKAN GALERI
    // ==========================================

    function renderGallery() {
        if (!gallery) return;

        gallery.replaceChildren();

        const items = profileImages[activeTab] || [];

        items.forEach(item => {
            const card = createProfileCard(item, activeTab);

            if (card) {
                gallery.appendChild(card);
            }
        });

        const hasItems = gallery.children.length > 0;

        // Mengatur galeri kosong atau berisi.
        gallery.classList.toggle("hidden", !hasItems);

        emptyGallery?.classList.toggle("hidden", hasItems);

        // Judul galeri.
        if (galleryHeading) {
            galleryHeading.textContent =
                activeTab === "uploads"
                    ? "Gambar yang kamu unggah"
                    : "Gambar tersimpan";
        }

        // Deskripsi galeri.
        if (galleryDescription) {
            galleryDescription.textContent =
                activeTab === "uploads"
                    ? "Inspirasi yang kamu bagikan kepada dunia."
                    : "Kumpulan gambar yang ingin kamu lihat kembali.";
        }

        // Judul ketika galeri kosong.
        if (emptyGalleryTitle) {
            emptyGalleryTitle.textContent =
                activeTab === "uploads"
                    ? "Belum ada unggahan"
                    : "Belum ada gambar tersimpan";
        }

        // Deskripsi ketika galeri kosong.
        if (emptyGalleryText) {
            emptyGalleryText.textContent =
                activeTab === "uploads"
                    ? "Unggah gambar pertamamu untuk mulai membangun galeri inspirasi."
                    : "Simpan gambar favoritmu untuk menemukannya kembali di sini.";
        }

        // Memperbarui statistik.
        if (statImages) {
            statImages.textContent = profileImages.uploads.length;
        }

        if (statSaved) {
            statSaved.textContent = profileImages.saved.length;
        }
    }


    // ==========================================
    // 14. TAB UNGGAHAN DAN GAMBAR TERSIMPAN
    // ==========================================

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            activeTab = tab.dataset.tab === "saved"
                ? "saved"
                : "uploads";

            tabs.forEach(item => {
                const isActive = item === tab;

                item.classList.toggle("border-red-600", isActive);
                item.classList.toggle("text-red-600", isActive);
                item.classList.toggle("font-bold", isActive);

                item.classList.toggle("border-transparent", !isActive);
                item.classList.toggle("text-gray-500", !isActive);
                item.classList.toggle("font-semibold", !isActive);
            });

            renderGallery();
        });
    });


    // ==========================================
    // 15. MEMUAT DATA GAMBAR DARI BACKEND
    // ==========================================

    /**
     * Mengambil data gambar dari REST API.
     *
     * GET /api/images
     * GET /api/saved
     *
     * Metadata gambar disimpan di Biznet Object Storage
     * melalui backend Express.
     */
    async function loadProfileImages() {
        if (typeof apiFetch !== "function") {
            console.error("apiFetch belum tersedia. Periksa urutan script.");
            return;
        }

        try {
            const [uploadsResult, savedResult] = await Promise.all([
                apiFetch("/api/images"),
                apiFetch("/api/saved")
            ]);

            // Normalisasi respons backend.
            profileImages.uploads = extractItems(
                uploadsResult,
                ["images", "uploads", "items"]
            );

            profileImages.saved = extractItems(
                savedResult,
                ["saved", "images", "items"]
            );

            renderGallery();

        } catch (error) {
            console.error("Gagal memuat data profil:", error);
        }
    }


    // ==========================================
    // 16. MENUTUP MODAL DENGAN TOMBOL ESCAPE
    // ==========================================

    document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;

        if (editTitleModal && !editTitleModal.classList.contains("hidden")) {
            closeEditTitleModal();
            return;
        }

        if (modal && !modal.classList.contains("hidden")) {
            closeModal();
        }
    });


    // ==========================================
    // 17. INISIALISASI HALAMAN
    // ==========================================

    // Memuat data profil lokal.
    loadProfile();

    // Menampilkan profil.
    renderProfile();

    // Memuat komponen footer.
    loadComponent("footer-container", "/footer.html");

    // Menampilkan galeri awal.
    renderGallery();

    // Mengambil data gambar dari backend.
    loadProfileImages();

});
