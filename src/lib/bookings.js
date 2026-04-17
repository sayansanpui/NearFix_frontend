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
