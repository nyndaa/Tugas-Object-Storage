/**
 * ==========================================
 * INSPOPIC - AUTHENTICATION
 * Mengelola login dan registrasi pengguna.
 * ==========================================
 */

document.addEventListener("DOMContentLoaded", () => {
    const message = document.getElementById("auth-message");
    const loginButton = document.getElementById("login-button");
    const registerButton = document.getElementById("register-button");

    /**
     * Menampilkan pesan kepada pengguna.
     */
    function showMessage(text, type = "error") {
        if (!message) return;

        message.textContent = text;
        message.className = type === "success"
            ? "text-sm text-green-600"
            : type === "loading"
                ? "text-sm text-blue-600"
                : "text-sm text-red-600";
    }

    /**
     * Memproses login atau registrasi.
     */
    async function submitAuth(mode) {
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const usernameInput = document.getElementById("username");

        if (!emailInput || !passwordInput) {
            showMessage("Form autentikasi tidak ditemukan.");
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showMessage("Email dan password wajib diisi.");
            return;
        }

        const payload = { email, password };

        if (mode === "register") {
            if (!usernameInput) {
                showMessage("Kolom username tidak ditemukan.");
                return;
            }

            payload.username = usernameInput.value.trim();

            if (!payload.username) {
                showMessage("Username wajib diisi.");
                return;
            }
        }

        const activeButton = mode === "login"
            ? loginButton
            : registerButton;

        if (activeButton) activeButton.disabled = true;

        showMessage("Memproses...", "loading");

        try {
            const response = await fetch(`/api/auth/${mode}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.error ||
                    "Autentikasi gagal."
                );
            }

            if (!data.token) {
                throw new Error("Server tidak mengirim token login.");
            }

            // Simpan sesi hanya setelah autentikasi berhasil.
            sessionStorage.setItem("inspopic_token", data.token);

            if (data.user) {
                sessionStorage.setItem(
                    "inspopic_user",
                    JSON.stringify(data.user)
                );
            } else {
                sessionStorage.removeItem("inspopic_user");
            }

            showMessage("Berhasil. Mengalihkan halaman...", "success");
            window.location.href = "/";
        } catch (error) {
            console.error("Kesalahan autentikasi:", error);
            showMessage(error.message || "Terjadi kesalahan.");
        } finally {
            if (activeButton) activeButton.disabled = false;
        }
    }

    loginButton?.addEventListener("click", () => {
        submitAuth("login");
    });

    registerButton?.addEventListener("click", () => {
        submitAuth("register");
    });

    // Tekan Enter pada form juga dapat mengirim autentikasi.
    document.querySelectorAll("form").forEach(form => {
        form.addEventListener("submit", event => {
            if (
                event.target.querySelector("#email") &&
                event.target.querySelector("#password")
            ) {
                event.preventDefault();

                const mode = registerButton &&
                    document.getElementById("username")
                    ? "register"
                    : "login";

                submitAuth(mode);
            }
        });
    });
});