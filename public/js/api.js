/**
 * ==========================================
 * INSPOPIC - API HELPER
 * Mengelola request ke backend Express.
 * ==========================================
 */

async function apiFetch(url, options = {}) {
    // Jangan menetapkan Content-Type untuk FormData.
    // Browser akan mengatur multipart boundary secara otomatis.
    const response = await fetch(url, options);

    // Backend mungkin mengirim JSON atau respons kosong.
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.message ||
            data.error ||
            `Permintaan gagal (${response.status}).`
        );
    }

    return data;
}
