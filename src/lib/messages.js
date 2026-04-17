export async function getMessages(bookingId) {
    if (!bookingId) {
        throw new Error("Booking is missing.");
    }

    const baseUrl = import.meta.env.VITE_API_URL || "";
    const response = await fetch(`${baseUrl}/api/messages/${bookingId}`);

    const contentType = response.headers.get("content-type") || "";
    const hasJson = contentType.includes("application/json");
    const data = hasJson ? await response.json() : null;

    if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch messages.");
    }

    if (!Array.isArray(data)) {
        throw new Error("Invalid messages response format.");
    }

    return data;
}

export async function sendMessage(token, { receiverId, bookingId, text }) {
    if (!token) {
        throw new Error("Please login to send a message.");
    }

    if (!receiverId || !bookingId || !text?.trim()) {
        throw new Error("receiverId, bookingId, and text are required.");
    }

    const baseUrl = import.meta.env.VITE_API_URL || "";
    const response = await fetch(`${baseUrl}/api/messages`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            receiverId,
            bookingId,
            text: text.trim(),
        }),
    });

    const contentType = response.headers.get("content-type") || "";
    const hasJson = contentType.includes("application/json");
    const data = hasJson ? await response.json() : null;

    if (!response.ok) {
        throw new Error(data?.message || "Failed to send message.");
    }

    return data;
}
