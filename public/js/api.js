async function apiFetch(url, options = {}) {
    const response = await fetch(url, options);

    const contentType =
        response.headers.get("content-type") || "";

    let data = {};

    if (contentType.includes("application/json")) {
        data = await response.json().catch(() => ({}));
    } else {
        data = await response.text().catch(() => "");
    }

    if (!response.ok) {
        const message =
            data.message ||
            data.error ||
            (typeof data === "string" && data) ||
            `Permintaan gagal (${response.status}).`;

        throw new Error(message);
    }

    return data;
}