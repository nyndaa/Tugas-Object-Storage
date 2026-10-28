
document.addEventListener("DOMContentLoaded", () => {
    // Memuat header.html ke halaman
    async function loadHeader() {
        const headerContainer = document.getElementById("header-container");

        // Jika halaman tidak memiliki tempat untuk header, hentikan
        if (!headerContainer) return;

        try {
            const response = await fetch("/header.html");

            if (!response.ok) {
                throw new Error("Gagal memuat header.html");
            }

            headerContainer.innerHTML = await response.text();

            // Tampilkan nama dan inisial profil
            renderHeaderProfile();
        } catch (error) {
            console.error("Gagal memuat header:", error);
        }
    }

    // Mengambil data profil dari localStorage
    function renderHeaderProfile() {
        const headerName = document.getElementById("headerProfileName");
        const headerAvatar = document.getElementById("headerAvatarInitial");

        let profileName = "Pengguna InspoPic";

        try {
            const savedProfile = localStorage.getItem("inspopicProfile");

            if (savedProfile) {
                const profile = JSON.parse(savedProfile);

                if (profile && typeof profile.name === "string" && profile.name.trim()) {
                    profileName = profile.name.trim();
                }
            }
        } catch (error) {
            console.warn("Data profil tidak dapat dibaca.", error);
        }

        if (headerName) {
            headerName.textContent = profileName;
        }

        if (headerAvatar) {
            headerAvatar.textContent = profileName.charAt(0).toUpperCase() || "U";
        }
    }

    // Memperbarui header ketika profil diubah
    window.addEventListener("inspopicProfileUpdated", renderHeaderProfile);

    // Memperbarui header jika localStorage berubah dari tab lain
    window.addEventListener("storage", (event) => {
        if (event.key === "inspopicProfile") {
            renderHeaderProfile();
        }
    });

    loadHeader();
});
