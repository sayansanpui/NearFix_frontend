import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Alert } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../context/AuthContext";
import { getBookingParticipants } from "../lib/bookings";
import { cn } from "../lib/utils";
import { getMessages, sendMessage } from "../lib/messages";
import { ArrowLeft, Send } from "lucide-react";

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
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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

    const initial = chatTitle.charAt(0).toUpperCase();

    return (
        <div className="flex h-[calc(100vh-80px)] max-h-[800px] flex-col mx-auto max-w-3xl overflow-hidden rounded-2xl bg-[#ede9e3] shadow-lg border border-slate-200">
            
            {/* WhatsApp-like Header */}
            <div className="flex shrink-0 items-center gap-3 bg-emerald-800 px-4 py-3 text-white shadow-md z-10">
                <Link to={role === "worker" ? "/worker-inbox" : "/my-bookings"}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-emerald-700 rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-800 shadow-sm border border-emerald-200">
                    {initial}
                </div>
                
                <div className="flex flex-col">
                    <span className="font-display text-base font-bold leading-tight">{chatTitle}</span>
                    <span className="text-xs text-emerald-200 font-medium tracking-wide">
                        {loading ? "Connecting..." : "Tap here for info"}
                    </span>
                </div>
            </div>

            {/* Error Area */}
            {error && (
                <div className="shrink-0 p-3 bg-rose-50 border-b border-rose-100">
                    <Alert variant="error" className="py-2 mb-0">{error}</Alert>
                </div>
            )}

            {/* Messages Area - WhatsApp chat background pattern could be added here */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Date Header Placeholder */}
                <div className="flex justify-center mb-6">
                    <span className="bg-emerald-900/10 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm shadow-sm ring-1 ring-white/50">
                        Chat Started
                    </span>
                </div>

                {loading ? (
                    <div className="flex justify-center pt-10">
                        <span className="bg-white/80 px-4 py-2 rounded-full text-sm font-medium text-slate-500 shadow-sm">Loading messages...</span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex justify-center pt-10">
                        <span className="bg-white/80 px-4 py-2 rounded-xl text-sm font-medium text-slate-500 shadow-sm">
                            No messages yet. Say hi! 👋
                        </span>
                    </div>
                ) : (
                    messages.map((message) => {
                        const messageId = message?._id || message?.id;
                        const isMine = normalizeEntityId(message?.senderId) === user?.userId;

                        return (
                            <div
                                key={messageId}
                                className={cn(
                                    "flex w-full group",
                                    isMine ? "justify-end" : "justify-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "relative max-w-[80%] rounded-2xl px-4 py-2 shadow-sm text-[15px]",
                                        isMine
                                            ? "bg-emerald-600 justify-end text-white rounded-tr-sm"
                                            : "bg-white text-slate-800 rounded-tl-sm border border-slate-100"
                                    )}
                                >
                                    <p className="leading-relaxed whitespace-pre-wrap break-words">{message?.text || ""}</p>
                                    <div className={cn(
                                        "flex justify-end mt-1",
                                        isMine ? "text-emerald-200" : "text-slate-400"
                                    )}>
                                        <p className="text-[10px] font-medium tracking-wide">
                                            {formatTimestamp(message?.createdAt)}
                                        </p>
                                    </div>
                                    
                                    {/* Tail */}
                                    <div className={cn(
                                        "absolute top-0 w-3 h-3 -mt-px",
                                        isMine 
                                            ? "-right-1.5 bg-emerald-600 rounded-bl-sm transform-gpu -skew-y-12 shrink-0" 
                                            : "-left-1.5 bg-white border-l border-t border-slate-100 rounded-br-sm transform-gpu skew-y-12 shrink-0"
                                    )} style={{ clipPath: isMine ? "polygon(0 0, 100% 0, 0 100%)" : "polygon(0 0, 100% 0, 100% 100%)" }}></div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Sticky Input Area */}
            <div className="shrink-0 bg-white/90 backdrop-blur-md p-3 border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 transition-all">
                <form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-4xl mx-auto">
                    <div className="flex-1 relative bg-slate-100 rounded-2xl shadow-inner border border-slate-200 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 overflow-hidden transition-all duration-200">
                        <Input
                            type="text"
                            placeholder="Message..."
                            value={text}
                            onChange={(event) => setText(event.target.value)}
                            disabled={sending || !receiverId || loading}
                            className="w-full bg-transparent border-0 px-4 py-3.5 focus-visible:ring-0 shadow-none rounded-none outline-none h-12 box-border text-[15px]"
                        />
                    </div>
                    {/* Only show send button clearly active when there's text */}
                    <Button
                        type="submit"
                        size="icon"
                        disabled={sending || !receiverId || !text.trim()}
                        className={cn(
                            "h-12 w-12 rounded-full shrink-0 shadow-md transition-all duration-200",
                            text.trim() ? "bg-emerald-600 hover:bg-emerald-700 scale-100" : "bg-slate-200 text-slate-400 scale-95"
                        )}
                    >
                        <Send className="h-5 w-5 ml-1 inline-block shrink-0" />
                    </Button>
                </form>
                {!receiverId && !loading && (
                    <p className="mt-2 text-xs text-amber-700 text-center font-medium">
                        Unable to resolve message recipient for this booking.
                    </p>
                )}
            </div>
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

    // Return just the time like WhatsApp e.g. "10:45 AM"
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
