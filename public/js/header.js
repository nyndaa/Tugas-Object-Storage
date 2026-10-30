
/**
 * ==========================================
 * INSPOPIC - HEADER SCRIPT
 * Memuat komponen header dan informasi profil.
 * ==========================================
 */

document.addEventListener("DOMContentLoaded", () => {

    /**
     * Memuat header.html ke dalam halaman.
     */
    async function loadHeader() {
        const headerContainer = document.getElementById("header-container");

        // Hentikan jika halaman tidak memiliki header.
        if (!headerContainer) return;

        try {
            const response = await fetch("/header.html");

            if (!response.ok) {
                throw new Error("Gagal memuat header.html");
            }

            headerContainer.innerHTML = await response.text();

            // Tampilkan informasi profil setelah header dimuat.
            renderHeaderProfile();

        } catch (error) {
            console.error("Gagal memuat header:", error);
        }
    }

    /**
     * Mengambil dan menampilkan nama profil.
     * Data profil disimpan sementara di localStorage.
     */
    function renderHeaderProfile() {
        const headerName = document.getElementById("headerProfileName");
        const headerAvatar = document.getElementById("headerAvatarInitial");

        let profileName = "Pengguna InspoPic";

        try {
            const savedProfile = localStorage.getItem("inspopicProfile");

            if (savedProfile) {
                const profile = JSON.parse(savedProfile);

                if (
                    profile &&
                    typeof profile.name === "string" &&
                    profile.name.trim()
                ) {
                    profileName = profile.name.trim();
                }
            }

        } catch (error) {
            console.warn("Data profil tidak dapat dibaca.", error);
        }

        // Perbarui nama profil.
        if (headerName) {
            headerName.textContent = profileName;
        }

        // Perbarui inisial avatar.
        if (headerAvatar) {
            headerAvatar.textContent =
                profileName.charAt(0).toUpperCase() || "U";
        }
    }

    /**
     * Memperbarui header ketika profil berubah.
     */
    window.addEventListener("inspopicProfileUpdated", renderHeaderProfile);

    /**
     * Memperbarui header jika localStorage berubah
     * dari tab browser lainnya.
     */
    window.addEventListener("storage", (event) => {
        if (event.key === "inspopicProfile") {
            renderHeaderProfile();
        }
    });

    // Jalankan pemuatan header.
    loadHeader();

});
