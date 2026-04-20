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
import { getBookingParticipants } from "../lib/bookings";
import { cn } from "../lib/utils";
import { getMessages, sendMessage } from "../lib/messages";

export default function Chat() {
    const { bookingId = "" } = useParams();
    const location = useLocation();
    const { token, user, role } = useAuth();
    const receiverIdFromState = location.state?.receiverId || "";
    const counterpartNameFromState =
        location.state?.counterpartName || location.state?.workerName || "Conversation";

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [text, setText] = useState("");
    const [receiverId, setReceiverId] = useState(receiverIdFromState);
    const [chatTitle, setChatTitle] = useState(counterpartNameFromState);

    useEffect(() => {
        let isActive = true;

        const fetchMessagesForBooking = async ({ silent } = { silent: false }) => {
            try {
                const messagesData = await getMessages(token, bookingId);

                if (!isActive) {
                    return;
                }

                setMessages(messagesData);
                if (!silent) {
                    setError("");
                }
            } catch (err) {
                if (!isActive || silent) {
                    return;
                }

                setError(err?.message || "Failed to load messages.");
            }
        };

        const loadChatData = async () => {
            try {
                setLoading(true);
                setError("");

                const participantsData = await getBookingParticipants(token, bookingId).catch(() => null);
                await fetchMessagesForBooking();

                if (!isActive) {
                    return;
                }

                const workerUserId =
                    normalizeEntityId(participantsData?.worker?.userId) ||
                    normalizeEntityId(participantsData?.worker?.id);
                const customerUserId =
                    normalizeEntityId(participantsData?.user?.userId) ||
                    normalizeEntityId(participantsData?.user?.id);

                const roleBasedReceiverId = role === "worker" ? customerUserId : workerUserId;
                const resolvedReceiverId =
                    receiverIdFromState ||
                    roleBasedReceiverId ||
                    normalizeEntityId(participantsData?.receiverId) ||
                    "";

                setReceiverId(resolvedReceiverId);

                const nextTitle =
                    counterpartNameFromState !== "Conversation"
                        ? counterpartNameFromState
                        : user?.userId === normalizeEntityId(participantsData?.user?.id)
                            ? participantsData?.worker?.name || "Worker"
                            : participantsData?.user?.name || "Customer";

                if (nextTitle) {
                    setChatTitle(nextTitle);
                }
            } catch (err) {
                if (!isActive) {
                    return;
                }

                setError(err?.message || "Failed to load messages.");
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        if (token) {
            void loadChatData();
        }

        const pollingId = window.setInterval(() => {
            if (!token || !bookingId) {
                return;
            }

            void fetchMessagesForBooking({ silent: true });
        }, 3000);

        return () => {
            isActive = false;
            window.clearInterval(pollingId);
        };
    }, [
        bookingId,
        counterpartNameFromState,
        receiverIdFromState,
        role,
        token,
        user?.userId,
    ]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!receiverId) {
            setError("Unable to resolve message recipient for this booking.");
            return;
        }

        try {
            setSending(true);
            setError("");

            const created = await sendMessage(token, {
                receiverId,
                bookingId,
                text,
            });

            if (!created) {
                throw new Error("Failed to send message.");
            }

            const refreshedMessages = await getMessages(token, bookingId);
            setMessages(refreshedMessages);
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
                <Link to={role === "worker" ? "/worker-inbox" : "/my-bookings"} className="inline-flex">
                    <Button variant="outline">
                        {role === "worker" ? "Back to Worker Inbox" : "Back to My Bookings"}
                    </Button>
                </Link>
            </div>

            {error && <Alert variant="error">{error}</Alert>}

            {loading && <Alert>Loading messages...</Alert>}

            {!loading && !error && (
                <Card>
                    <CardContent className="space-y-3 p-4">
                        {messages.length === 0 && (
                            <p className="text-sm text-slate-600">No messages yet. Start the conversation.</p>
                        )}

                        {messages.map((message) => {
                            const messageId = message?._id || message?.id;
                            const isMine = normalizeEntityId(message?.senderId) === user?.userId;

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

function normalizeEntityId(value) {
    if (!value) {
        return "";
    }

    if (typeof value === "object") {
        return value?._id || value?.id || "";
    }

    return value;
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
