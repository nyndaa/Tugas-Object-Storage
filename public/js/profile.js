/**
 * ==========================================
 * INSPOPIC - PROFILE JAVASCRIPT
 * Profil, unggahan, gambar tersimpan, tab, update & delete.
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

    // Modal Edit Judul Gambar
    const editTitleModal = document.getElementById("editTitleModal");
    const editTitleForm = document.getElementById("editTitleForm");
    const imageTitleInput = document.getElementById("imageTitleInput");
    const editTitleStatus = document.getElementById("editTitleStatus");
    let currentEditImageId = null;

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
                    name: typeof parsed.name === "string" ? parsed.name : defaultProfile.name,
                    username: typeof parsed.username === "string" ? parsed.username : defaultProfile.username,
                    bio: typeof parsed.bio === "string" ? parsed.bio : defaultProfile.bio,
                    location: typeof parsed.location === "string" ? parsed.location : defaultProfile.location
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
    if (profileName) profileName.textContent = profile.name;
    if (profileUsername) profileUsername.textContent = `@${profile.username}`;
    if (profileBio) profileBio.textContent = profile.bio || "Belum ada bio.";
    if (profileLocation) profileLocation.textContent = profile.location || "Lokasi belum diatur";

    if (avatarInitial) {
        avatarInitial.textContent = profile.name.trim().charAt(0).toUpperCase() || "U";
    }
    // Header disinkronkan oleh header.js (event inspopicProfileUpdated)
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

        if (bioCount && editBio) bioCount.textContent = editBio.value.length;

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

    document.getElementById("openEditProfile")?.addEventListener("click", openModal);
    document.getElementById("closeEditProfile")?.addEventListener("click", closeModal);
    document.getElementById("cancelEditProfile")?.addEventListener("click", closeModal);

    modal?.addEventListener("click", event => {
        if (event.target === modal) closeModal();
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

        if (!name || !username) {
            alert("Nama dan username wajib diisi.");
            return;
        }

        const updatedProfile = { name, username, bio, location };

        try {
            localStorage.setItem("inspopicProfile", JSON.stringify(updatedProfile));
            profile = updatedProfile;
            renderProfile();

            window.dispatchEvent(new Event("inspopicProfileUpdated"));

            closeModal();
        } catch (error) {
            console.error("Gagal menyimpan profil:", error);
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

    function extractItems(data, possibleKeys) {
        if (Array.isArray(data)) return data;
        for (const key of possibleKeys) {
            if (Array.isArray(data?.[key])) return data[key];
        }
        return [];
    }

    // --- FUNGSI EDIT JUDUL (UPDATE) ---
    function openEditTitleModal(id, currentTitle) {
        currentEditImageId = id;
        if (imageTitleInput) imageTitleInput.value = currentTitle;
        if (editTitleStatus) editTitleStatus.textContent = "";

        if (editTitleModal) {
            editTitleModal.classList.remove("hidden");
            editTitleModal.classList.add("flex");
            document.body.classList.add("modal-open");
        }
    }

    function closeEditTitleModal() {
        if (editTitleModal) {
            editTitleModal.classList.add("hidden");
            editTitleModal.classList.remove("flex");
            document.body.classList.remove("modal-open");
        }
    }

    document.getElementById("closeEditTitleModal")?.addEventListener("click", closeEditTitleModal);
    document.getElementById("cancelEditTitle")?.addEventListener("click", closeEditTitleModal);

    editTitleForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const newTitle = imageTitleInput?.value.trim();

        if (!newTitle || !currentEditImageId) return;

        try {
            if (editTitleStatus) editTitleStatus.textContent = "Menyimpan...";

            await apiFetch(`/api/images/${currentEditImageId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: newTitle }),
            });

            // Update di lokal
            const item = profileImages.uploads.find(img => img.id === currentEditImageId);
            if (item) item.title = newTitle;

            renderGallery();
            closeEditTitleModal();
        } catch (err) {
            if (editTitleStatus) editTitleStatus.textContent = err.message || "Gagal memperbarui judul.";
        }
    });

    // --- FUNGSI HAPUS GAMBAR (DELETE) ---
    async function deleteImage(id, tabName) {
        if (!confirm("Apakah kamu yakin ingin menghapus gambar ini?")) return;

        try {
            const endpoint = tabName === "uploads" ? `/api/images/${id}` : `/api/saved/${id}`;
            await apiFetch(endpoint, { method: "DELETE" });

            profileImages[tabName] = profileImages[tabName].filter(item => item.id !== id);
            renderGallery();
        } catch (error) {
            alert(error.message || "Gagal menghapus gambar.");
        }
    }

    // --- MEMBUAT KARTU GAMBAR DENGAN TOMBOL EDIT & HAPUS ---
    function createProfileCard(item, tabName) {
        const imageUrl = item.image_url || item.url;
        if (!imageUrl) return null;

        const title = item.title || "Gambar InspoPic";

        const card = document.createElement("article");
        card.className = "pin-card relative group rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 p-2 mb-4";
        card.dataset.tab = tabName;

        const image = document.createElement("img");
        image.src = imageUrl;
        image.alt = title;
        image.loading = "lazy";
        image.className = "w-full rounded-xl object-cover";

        const heading = document.createElement("h3");
        heading.className = "mt-2 px-1 font-semibold text-sm text-gray-800 truncate";
        heading.textContent = title;

        // Container Tombol Aksi (Edit & Delete)
        const actionContainer = document.createElement("div");
        actionContainer.className = "absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition duration-200";

        // Tombol Edit (Hanya untuk Unggahan)
        if (tabName === "uploads") {
            const editBtn = document.createElement("button");
            editBtn.type = "button";
            editBtn.className = "bg-white/90 text-gray-700 hover:text-red-600 rounded-full p-2 text-xs font-bold shadow-md transition hover:bg-white";
            editBtn.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                </svg>
            `;
            editBtn.title = "Edit Judul";
            editBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                openEditTitleModal(item.id, title);
            });
            actionContainer.appendChild(editBtn);
        }

        // Tombol Hapus
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "bg-red-600 text-white rounded-full p-2 text-xs font-bold shadow-md transition hover:bg-red-700";
        deleteBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
        `;
        deleteBtn.title = "Hapus Gambar";
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteImage(item.id, tabName);
        });

        actionContainer.appendChild(deleteBtn);
        card.append(image, heading, actionContainer);
        return card;
    }

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
            galleryHeading.textContent = activeTab === "uploads" ? "Gambar yang kamu unggah" : "Gambar tersimpan";
        }

        if (galleryDescription) {
            galleryDescription.textContent = activeTab === "uploads" ? "Inspirasi yang kamu bagikan kepada dunia." : "Kumpulan gambar yang ingin kamu lihat kembali.";
        }

        if (emptyGalleryTitle) {
            emptyGalleryTitle.textContent = activeTab === "uploads" ? "Belum ada unggahan" : "Belum ada gambar tersimpan";
        }

        if (emptyGalleryText) {
            emptyGalleryText.textContent = activeTab === "uploads" ? "Unggah gambar pertamamu untuk mulai membangun galeri inspirasi." : "Simpan gambar favoritmu untuk menemukannya kembali di sini.";
        }

        if (statImages) statImages.textContent = profileImages.uploads.length;
        if (statSaved) statSaved.textContent = profileImages.saved.length;
    }

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            activeTab = tab.dataset.tab === "saved" ? "saved" : "uploads";

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
        if (typeof apiFetch !== "function") return;

        try {
            const [uploadsResult, savedResult] = await Promise.all([
                apiFetch("/api/images"),
                apiFetch("/api/saved")
            ]);

            profileImages.uploads = extractItems(uploadsResult, ["images", "uploads", "items"]);
            profileImages.saved = extractItems(savedResult, ["saved", "images", "items"]);

            renderGallery();
        } catch (error) {
            console.error("Gagal memuat data profil:", error);
        }
    }

    renderGallery();
    loadProfileImages();
});