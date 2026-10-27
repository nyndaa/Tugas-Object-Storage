/**
 * ==========================================
 * INSPOPIC - PROFILE JAVASCRIPT
 * Profil, unggahan, gambar tersimpan, dan tab.
 * ==========================================
 */

document.addEventListener("DOMContentLoaded", () => {
    // ------------------------------------------
    // 1. ELEMEN HALAMAN
    // ------------------------------------------

    const profileName = document.getElementById("profileName");
    const profileUsername = document.getElementById("profileUsername");
    const profileBio = document.getElementById("profileBio");
    const profileLocation = document.getElementById("profileLocation");
    const avatarInitial = document.getElementById("avatarInitial");

    const modal = document.getElementById("editProfileModal");
    const form = document.getElementById("editProfileForm");

    const editName = document.getElementById("editName");
    const editUsername = document.getElementById("editUsername");
    const editBio = document.getElementById("editBio");
    const editLocation = document.getElementById("editLocation");

    const bioCount = document.getElementById("bioCount");
    const status = document.getElementById("editProfileStatus");

    const gallery = document.getElementById("profileGallery");
    const emptyGallery = document.getElementById("emptyGallery");

    const galleryHeading = document.getElementById("galleryHeading");
    const galleryDescription = document.getElementById("galleryDescription");
    const emptyGalleryTitle = document.getElementById("emptyGalleryTitle");
    const emptyGalleryText = document.getElementById("emptyGalleryText");

    const statImages = document.getElementById("statImages");
    const statSaved = document.getElementById("statSaved");

    const tabs = document.querySelectorAll(".profile-tab");

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
            renderProfile();
        } catch (error) {
            console.error("Gagal memuat komponen:", error);
        }
    }

    loadComponent("header-container", "/header.html");
    loadComponent("footer-container", "/footer.html");

    // ------------------------------------------
    // 3. DATA PROFIL
    // ------------------------------------------

    const defaultProfile = {
        name: "Pengguna InspoPic",
        username: "pengguna",
        bio: "Mengumpulkan inspirasi kecil untuk hari-hari yang lebih indah.",
        location: "Indonesia"
    };

    let profile = { ...defaultProfile };

    try {
        const savedProfile = localStorage.getItem("inspopicProfile");

        if (savedProfile) {
            const parsed = JSON.parse(savedProfile);

            if (parsed && typeof parsed === "object") {
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
            }
        }
    } catch (error) {
        console.warn("Data profil lokal tidak dapat dibaca.", error);
    }

    // ------------------------------------------
    // 4. MENAMPILKAN PROFIL
    // ------------------------------------------

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
            profileLocation.textContent =
                profile.location || "Lokasi belum diatur";
        }

        if (avatarInitial) {
            avatarInitial.textContent =
                profile.name.trim().charAt(0).toUpperCase() || "U";
        }

        const headerAvatar = document.querySelector(
            "#header-container a[href='/profile.html'] span"
        );

        if (headerAvatar && avatarInitial) {
            headerAvatar.textContent = avatarInitial.textContent;
        }
    }

    renderProfile();

    // ------------------------------------------
    // 5. MODAL EDIT PROFIL
    // ------------------------------------------

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

    modal?.addEventListener("click", event => {
        if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", event => {
        if (
            event.key === "Escape" &&
            modal &&
            !modal.classList.contains("hidden")
        ) {
            closeModal();
        }
    });

    editBio?.addEventListener("input", () => {
        if (bioCount) bioCount.textContent = editBio.value.length;
    });

    // ------------------------------------------
    // 6. MENYIMPAN EDIT PROFIL
    // ------------------------------------------

    form?.addEventListener("submit", event => {
        event.preventDefault();

        const name = editName?.value.trim() || "";
        const username = editUsername?.value.trim() || "";
        const bio = editBio?.value.trim() || "";
        const location = editLocation?.value.trim() || "";

        function showEditStatus(text, type = "error") {
            if (!status) return;

            status.textContent = text;
            status.className = type === "success"
                ? "text-sm text-green-600"
                : "text-sm text-red-600";
        }

        if (!name || !username) {
            showEditStatus("Nama dan username wajib diisi.");
            return;
        }

        if (!/^[A-Za-z0-9_]+$/.test(username)) {
            showEditStatus(
                "Username hanya boleh berisi huruf, angka, dan garis bawah."
            );
            return;
        }

        const updatedProfile = {
            name,
            username,
            bio,
            location
        };

        try {
            localStorage.setItem(
                "inspopicProfile",
                JSON.stringify(updatedProfile)
            );

            profile = updatedProfile;
            renderProfile();

            showEditStatus("Profil berhasil diperbarui.", "success");

            setTimeout(closeModal, 500);
        } catch (error) {
            console.error("Gagal menyimpan profil:", error);
            showEditStatus("Profil tidak dapat disimpan di browser ini.");
        }
    });

    // ------------------------------------------
    // 7. TAB UNGGAHAN DAN GAMBAR TERSIMPAN
    // ------------------------------------------

    let activeTab = "uploads";

    const profileImages = {
        uploads: [],
        saved: []
    };

    /**
     * Menormalkan respons API menjadi array.
     */
    function extractItems(data, possibleKeys) {
        if (Array.isArray(data)) return data;

        for (const key of possibleKeys) {
            if (Array.isArray(data?.[key])) {
                return data[key];
            }
        }

        return [];
    }

    /**
     * Membuat kartu gambar dengan DOM API agar judul
     * tidak dimasukkan sebagai HTML mentah.
     */
    function createProfileCard(item, tabName) {
        const imageUrl = item.image_url || item.url;

        if (!imageUrl) return null;

        const title = item.title || "Gambar InspoPic";

        const card = document.createElement("article");
        card.className = "pin-card";
        card.dataset.tab = tabName;

        const image = document.createElement("img");
        image.src = imageUrl;
        image.alt = title;
        image.loading = "lazy";
        image.className = "w-full rounded-xl object-cover";

        const heading = document.createElement("h3");
        heading.className = "mt-2 font-semibold";
        heading.textContent = title;

        card.append(image, heading);

        return card;
    }

    /**
     * Merender tab aktif dan memperbarui statistik.
     */
    function renderGallery() {
        if (!gallery) return;

        gallery.replaceChildren();

        const items = profileImages[activeTab] || [];

        items.forEach(item => {
            const card = createProfileCard(item, activeTab);
            if (card) gallery.appendChild(card);
        });

        const hasItems = gallery.children.length > 0;

        gallery.classList.toggle("hidden", !hasItems);
        emptyGallery?.classList.toggle("hidden", hasItems);

        if (galleryHeading) {
            galleryHeading.textContent = activeTab === "uploads"
                ? "Gambar yang kamu unggah"
                : "Gambar tersimpan";
        }

        if (galleryDescription) {
            galleryDescription.textContent = activeTab === "uploads"
                ? "Inspirasi yang kamu bagikan kepada dunia."
                : "Kumpulan gambar yang ingin kamu lihat kembali.";
        }

        if (emptyGalleryTitle) {
            emptyGalleryTitle.textContent = activeTab === "uploads"
                ? "Belum ada unggahan"
                : "Belum ada gambar tersimpan";
        }

        if (emptyGalleryText) {
            emptyGalleryText.textContent = activeTab === "uploads"
                ? "Unggah gambar pertamamu untuk mulai membangun galeri inspirasi."
                : "Simpan gambar favoritmu untuk menemukannya kembali di sini.";
        }

        if (statImages) {
            statImages.textContent = profileImages.uploads.length;
        }

        if (statSaved) {
            statSaved.textContent = profileImages.saved.length;
        }
    }

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

    // ------------------------------------------
    // 8. MEMUAT DATA DARI BACKEND
    // ------------------------------------------

    async function loadProfileImages() {
        if (typeof apiFetch !== "function") {
            console.error("api.js belum dimuat.");
            return;
        }

        try {
            const [uploadsResult, savedResult] = await Promise.all([
                apiFetch("/api/images"),
                apiFetch("/api/saved")
            ]);

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

            if (emptyGalleryTitle) {
                emptyGalleryTitle.textContent = "Data gagal dimuat";
            }

            if (emptyGalleryText) {
                emptyGalleryText.textContent =
                    error.message || "Silakan coba muat ulang halaman.";
            }
        }
    }

    renderGallery();
    loadProfileImages();
});