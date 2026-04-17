import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Alert } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useAuth } from "../context/AuthContext";
import { getMyBookings } from "../lib/bookings";
import { cn } from "../lib/utils";
import { getMessages, sendMessage } from "../lib/messages";

export default function Chat() {
    const { bookingId = "" } = useParams();
    const location = useLocation();
    const { token, user } = useAuth();

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [text, setText] = useState("");
    const [receiverId, setReceiverId] = useState(location.state?.receiverId || "");
    const [chatTitle, setChatTitle] = useState(location.state?.workerName || "Worker");

    useEffect(() => {
        const loadMessages = async () => {
            try {
                setLoading(true);
                setError("");
                const data = await getMessages(bookingId);
                setMessages(data);
            } catch (err) {
                setError(err?.message || "Failed to load messages.");
            } finally {
                setLoading(false);
            }
        };

        void loadMessages();
    }, [bookingId]);

    useEffect(() => {
        if (receiverId) {
            return;
        }

        const resolveReceiver = async () => {
            try {
                const receiver = await resolveReceiverByBooking({
                    token,
                    bookingId,
                    currentUserId: user?.userId,
                });
                setReceiverId(receiver.id);
                setChatTitle(receiver.name || "Worker");
            } catch {
                // Keep message fetch usable even if recipient cannot be resolved for sending.
            }
        };

        void resolveReceiver();
    }, [bookingId, receiverId, token, user?.userId]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setSending(true);
            setError("");

            const created = await sendMessage(token, {
                receiverId,
                bookingId,
                text,
            });

            setMessages((prev) => [...prev, created]);
            setText("");
        } catch (err) {
            setError(err?.message || "Failed to send message.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Booking Chat</CardTitle>
                    <CardDescription>
                        Booking ID: <span className="font-medium text-slate-700">{bookingId}</span>
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="flex justify-between">
                <Link to="/my-bookings" className="inline-flex">
                    <Button variant="outline">Back to My Bookings</Button>
                </Link>
            </div>

            {error && <Alert variant="error">{error}</Alert>}

            {loading && <Alert>Loading messages...</Alert>}

            {!loading && (
                <Card>
                    <CardContent className="space-y-3 p-4">
                        {messages.length === 0 && (
                            <p className="text-sm text-slate-600">No messages yet. Start the conversation.</p>
                        )}

                        {messages.map((message) => {
                            const messageId = message?._id || message?.id;
                            const isMine = message?.senderId === user?.userId;

                            return (
                                <div
                                    key={messageId}
                                    className={cn(
                                        "w-full rounded-xl border p-3",
                                        isMine
                                            ? "border-emerald-200 bg-emerald-50"
                                            : "border-slate-200 bg-slate-50"
                                    )}
                                >
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        {isMine ? "You" : chatTitle}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-900">{message?.text || ""}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {formatTimestamp(message?.createdAt)}
                                    </p>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="p-4">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
                        <Input
                            type="text"
                            placeholder="Type your message"
                            value={text}
                            onChange={(event) => setText(event.target.value)}
                            disabled={sending || !receiverId}
                        />
                        <Button
                            type="submit"
                            disabled={sending || !receiverId || !text.trim()}
                            className="sm:w-auto"
                        >
                            {sending ? "Sending..." : "Send"}
                        </Button>
                    </form>
                    {!receiverId && (
                        <p className="mt-2 text-xs text-amber-700">
                            Unable to resolve message recipient for this booking.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

async function resolveReceiverByBooking({ token, bookingId, currentUserId }) {
    if (!token || !bookingId) {
        throw new Error("Unable to resolve receiver.");
    }

    const [bookings, workers] = await Promise.all([getMyBookings(token), fetchWorkers()]);

    const booking = bookings.find((item) => (item?._id || item?.id) === bookingId);
    if (!booking) {
        throw new Error("Booking not found.");
    }

    const workerRefRaw = booking?.workerId;
    const workerRef =
        typeof workerRefRaw === "object" && workerRefRaw !== null
            ? workerRefRaw?._id || workerRefRaw?.id
            : workerRefRaw;

    const bookingUserIdRaw = booking?.userId;
    const bookingUserId =
        typeof bookingUserIdRaw === "object" && bookingUserIdRaw !== null
            ? bookingUserIdRaw?._id || bookingUserIdRaw?.id
            : bookingUserIdRaw;

    const worker = workers.find((item) => (item?._id || item?.id) === workerRef);
    const workerUserIdRaw = worker?.userId;
    const workerUserId =
        typeof workerUserIdRaw === "object" && workerUserIdRaw !== null
            ? workerUserIdRaw?._id || workerUserIdRaw?.id
            : workerUserIdRaw;

    if (currentUserId && workerUserId && currentUserId === workerUserId && bookingUserId) {
        return {
            id: bookingUserId,
            name: "Customer",
        };
    }

    if (workerUserId) {
        return {
            id: workerUserId,
            name: worker?.name || "Worker",
        };
    }

    throw new Error("Receiver not found.");
}

async function fetchWorkers() {
    const baseUrl = import.meta.env.VITE_API_URL || "";
    const response = await fetch(`${baseUrl}/api/workers`);

    const contentType = response.headers.get("content-type") || "";
    const hasJson = contentType.includes("application/json");
    const data = hasJson ? await response.json() : [];

    if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch workers.");
    }

    if (!Array.isArray(data)) {
        throw new Error("Invalid workers response format.");
    }

    return data;
}

function formatTimestamp(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleString();
}
