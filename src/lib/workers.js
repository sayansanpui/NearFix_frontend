export async function getWorkers({ onlyAvailable = false, lat, lng } = {}) {
    const baseUrl = import.meta.env.VITE_API_URL || "";
    const latitude = Number(lat);
    const longitude = Number(lng);
    const queryParams = new URLSearchParams();

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        queryParams.set("lat", String(latitude));
        queryParams.set("lng", String(longitude));
    }

    const endpoint = queryParams.toString()
        ? `${baseUrl}/api/workers?${queryParams.toString()}`
        : `${baseUrl}/api/workers`;

    const response = await fetch(endpoint, {
        cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "";
    const hasJson = contentType.includes("application/json");
    const data = hasJson ? await response.json() : null;

    if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch workers.");
    }

    if (!Array.isArray(data)) {
        throw new Error("Invalid workers response format.");
    }

    if (!onlyAvailable) {
        return data;
    }

    return data.filter((worker) => worker?.availability === true);
}

export async function createWorkerProfile(token, payload) {
    if (!token) {
        throw new Error("Please login to create your worker profile.");
    }

    const baseUrl = import.meta.env.VITE_API_URL || "";
    const response = await fetch(`${baseUrl}/api/workers`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    const data = await readJsonResponse(response);

    if (!response.ok) {
        throw new Error(data?.message || "Failed to create worker profile.");
    }

    return data;
}

export async function getMyWorkerProfile(token) {
    if (!token) {
        throw new Error("Please login to view your worker profile.");
    }

    const baseUrl = import.meta.env.VITE_API_URL || "";
    const response = await fetch(`${baseUrl}/api/workers/me`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await readJsonResponse(response);

    if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch worker profile.");
    }

    return data;
}

export async function updateMyWorkerProfile(token, payload) {
    if (!token) {
        throw new Error("Please login to update your worker profile.");
    }

    const baseUrl = import.meta.env.VITE_API_URL || "";
    const response = await fetch(`${baseUrl}/api/workers/me`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    const data = await readJsonResponse(response);

    if (!response.ok) {
        throw new Error(data?.message || "Failed to update worker profile.");
    }

    return data;
}

export async function deleteMyWorkerProfile(token) {
    if (!token) {
        throw new Error("Please login to delete your worker profile.");
    }

    const baseUrl = import.meta.env.VITE_API_URL || "";
    const response = await fetch(`${baseUrl}/api/workers/me`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await readJsonResponse(response);

    if (!response.ok) {
        throw new Error(data?.message || "Failed to delete worker profile.");
    }

    return data;
}

export async function toggleWorkerAvailability(token, availability) {
    if (!token) {
        throw new Error("Please login to update worker availability.");
    }

    if (typeof availability !== "boolean") {
        throw new Error("availability must be true or false.");
    }

    const baseUrl = import.meta.env.VITE_API_URL || "";
    const response = await fetch(`${baseUrl}/api/workers/availability`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ availability }),
    });

    const data = await readJsonResponse(response);

    if (!response.ok) {
        throw new Error(data?.message || "Failed to update availability.");
    }

    return data;
}

async function readJsonResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    const hasJson = contentType.includes("application/json");
    return hasJson ? await response.json() : null;
}