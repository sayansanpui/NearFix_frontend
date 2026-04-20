export async function createBooking(token, workerId) {
    if (!token) {
        throw new Error("Please login to create a booking.");
    }

    if (!workerId) {
        throw new Error("Worker is missing.");
    }

    const baseUrl = import.meta.env.VITE_API_URL || "";
    const response = await fetch(`${baseUrl}/api/bookings`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ workerId }),
    });

    const contentType = response.headers.get("content-type") || "";
    const hasJson = contentType.includes("application/json");
    const data = hasJson ? await response.json() : null;

    if (!response.ok) {
        throw new Error(data?.message || "Failed to create booking.");
    }

    return data;
}

export async function getMyBookings(token) {
    if (!token) {
        throw new Error("Please login to view your bookings.");
    }

    const baseUrl = import.meta.env.VITE_API_URL || "";
    const response = await fetch(`${baseUrl}/api/bookings/my`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const contentType = response.headers.get("content-type") || "";
    const hasJson = contentType.includes("application/json");
    const data = hasJson ? await response.json() : null;

    if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch bookings.");
    }

    if (!Array.isArray(data)) {
        throw new Error("Invalid bookings response format.");
    }

    return data;
}

export async function getWorkerBookings(token) {
    if (!token) {
        throw new Error("Please login to view worker bookings.");
    }

    const baseUrl = import.meta.env.VITE_API_URL || "";
    const response = await fetch(`${baseUrl}/api/bookings/worker`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const contentType = response.headers.get("content-type") || "";
    const hasJson = contentType.includes("application/json");
    const data = hasJson ? await response.json() : null;

    if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch worker bookings.");
    }

    if (!Array.isArray(data)) {
        throw new Error("Invalid worker bookings response format.");
    }

    return data;
}

export async function updateBookingStatus(token, bookingId, status) {
    if (!token) {
        throw new Error("Please login to update booking status.");
    }

    if (!bookingId) {
        throw new Error("Booking is missing.");
    }

    const normalizedStatus = String(status || "").trim().toLowerCase();
    const allowedStatuses = new Set(["accepted", "rejected", "completed", "pending"]);
    if (!allowedStatuses.has(normalizedStatus)) {
        throw new Error("Invalid booking status.");
    }

    const baseUrl = import.meta.env.VITE_API_URL || "";
    const endpoints = [
        `${baseUrl}/api/bookings/${bookingId}/status`,
        `${baseUrl}/api/bookings/${bookingId}`,
    ];

    let lastErrorMessage = "Failed to update booking status.";

    for (let index = 0; index < endpoints.length; index += 1) {
        const response = await fetch(endpoints[index], {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: normalizedStatus }),
        });

        const data = await readJsonResponse(response);

        if (response.ok) {
            return data;
        }

        lastErrorMessage = data?.message || lastErrorMessage;

        // Retry with fallback endpoint if route is not found.
        if (response.status === 404 && index < endpoints.length - 1) {
            continue;
        }

        throw new Error(lastErrorMessage);
    }

    throw new Error(lastErrorMessage);
}

export async function getBookingParticipants(token, bookingId) {
    if (!token) {
        throw new Error("Please login to access booking participants.");
    }

    if (!bookingId) {
        throw new Error("Booking is missing.");
    }

    const baseUrl = import.meta.env.VITE_API_URL || "";
    const response = await fetch(`${baseUrl}/api/bookings/${bookingId}/participants`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const contentType = response.headers.get("content-type") || "";
    const hasJson = contentType.includes("application/json");
    const data = hasJson ? await response.json() : null;

    if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch booking participants.");
    }

    return data;
}

export async function getWorkerBookingNotificationCount(token) {
    if (!token) {
        throw new Error("Please login to view booking notifications.");
    }

    const baseUrl = import.meta.env.VITE_API_URL || "";
    const response = await fetch(`${baseUrl}/api/bookings/worker-notification-count`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const contentType = response.headers.get("content-type") || "";
    const hasJson = contentType.includes("application/json");
    const data = hasJson ? await response.json() : null;

    if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch booking notifications.");
    }

    const unseenBookingCount = Number(data?.unseenBookingCount || 0);
    return Number.isFinite(unseenBookingCount) ? unseenBookingCount : 0;
}

async function readJsonResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    const hasJson = contentType.includes("application/json");
    return hasJson ? await response.json() : null;
}
