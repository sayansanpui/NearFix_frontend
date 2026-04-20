import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { MessageSquare, LayoutList, CalendarCheck, Clock, XCircle, CheckCircle2, Navigation } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { useAuth } from "../context/AuthContext";
import { getMyBookings } from "../lib/bookings";
import { cn } from "../lib/utils";

export default function MyBookings() {
    const { token } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("active");

    const loadBookings = async () => {
        try {
            setLoading(true);
            setError("");

            const [bookingsData, workersData] = await Promise.all([
                getMyBookings(token),
                fetchWorkers(),
            ]);

            const workerInfoById = new Map(
                workersData.map((worker) => {
                    const workerId = worker?._id || worker?.id;
                    const workerUserIdRaw = worker?.userId;
                    const workerUserId =
                        typeof workerUserIdRaw === "object" && workerUserIdRaw !== null
                            ? workerUserIdRaw?._id || workerUserIdRaw?.id
                            : workerUserIdRaw;

                    return [
                        workerId,
                        {
                            name: worker?.name || "Unknown",
                            userId: workerUserId || "",
                            skill: worker?.skill || "General",
                        },
                    ];
                })
            );

            const normalized = bookingsData.map((booking) => {
                const workerId = booking?.workerId;
                const workerRef =
                    typeof workerId === "object" && workerId !== null
                        ? workerId?._id || workerId?.id
                        : workerId;

                const inlineWorkerName =
                    typeof workerId === "object" && workerId !== null ? workerId?.name : "";
                const workerInfo = workerInfoById.get(workerRef);

                return {
                    id: booking?._id || booking?.id,
                    workerName: inlineWorkerName || workerInfo?.name || "Unknown worker",
                    workerSkill: workerInfo?.skill || "General",
                    status: normalizeBookingStatus(booking?.status),
                    receiverId: workerInfo?.userId || "",
                    createdAt: booking?.createdAt || new Date().toISOString(),
                };
            });

            // Sort newest first
            normalized.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setBookings(normalized);
        } catch (err) {
            setError(err?.message || "Failed to load bookings.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let intervalId;

        if (token) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            void loadBookings();
            intervalId = setInterval(() => {
                void loadBookings();
            }, 5000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [token]);

    const activeBookings = bookings.filter(b => ["pending", "accepted"].includes(b.status));
    const pastBookings = bookings.filter(b => ["rejected", "completed", "cancelled"].includes(b.status));

    const displayedBookings = activeTab === "active" ? activeBookings : pastBookings;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">My Bookings</h1>
                <p className="mt-2 text-slate-600">Track and manage your requested services.</p>
            </div>

            {/* Custom Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab("active")}
                    className={cn(
                        "px-6 py-2 rounded-lg text-sm font-medium transition-all shadow-sm",
                        activeTab === "active" 
                            ? "bg-white text-emerald-700 shadow-sm border border-slate-200/60" 
                            : "text-slate-600 hover:text-slate-900 shadow-none border-transparent"
                    )}
                >
                    Active ({activeBookings.length})
                </button>
                <button
                    onClick={() => setActiveTab("past")}
                    className={cn(
                        "px-6 py-2 rounded-lg text-sm font-medium transition-all shadow-sm",
                        activeTab === "past" 
                            ? "bg-white text-emerald-700 shadow-sm border border-slate-200/60" 
                            : "text-slate-600 hover:text-slate-900 shadow-none border-transparent"
                    )}
                >
                    Past ({pastBookings.length})
                </button>
            </div>

            {error && <Alert variant="error">{error}</Alert>}

            {/* List */}
            <div className="space-y-4">
                {displayedBookings.length === 0 && !loading && (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center bg-slate-50 flex flex-col items-center justify-center">
                        <LayoutList className="h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="font-display text-lg font-semibold text-slate-900">No {activeTab} bookings</h3>
                        <p className="mt-2 mb-6 text-slate-500 max-w-sm">
                            You don't have any {activeTab} service requests at the moment.
                        </p>
                        {activeTab === "active" && (
                            <Link to="/dashboard">
                                <Button className="bg-emerald-600 hover:bg-emerald-700">Browse professionals</Button>
                            </Link>
                        )}
                    </div>
                )}

                {displayedBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                ))}
            </div>
        </div>
    );
}

function BookingCard({ booking }) {
    const isPending = booking.status === "pending";
    const isAccepted = booking.status === "accepted";
    const isCompleted = booking.status === "completed";
    const isRejected = booking.status === "rejected";

    const badgeStyle = isPending
        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
        : isAccepted
            ? "bg-green-100 text-green-800 border-green-200"
            : isCompleted
                ? "bg-blue-100 text-blue-800 border-blue-200"
                : "bg-red-100 text-red-800 border-red-200";

    const statusLabel = isPending ? "Waiting for worker to accept" 
                      : isAccepted ? "Worker is on the way" 
                      : formatStatusLabel(booking.status);

    const Icon = isPending ? Clock : isAccepted ? Navigation : isCompleted ? CheckCircle2 : XCircle;

    return (
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all space-y-5 relative overflow-hidden">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-700 shrink-0">
                        {booking.workerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-display text-lg font-bold text-slate-900 line-clamp-1">{booking.workerName}</h3>
                        <p className="text-sm text-slate-500 mt-0.5">{booking.workerSkill}</p>
                    </div>
                </div>

                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    <Badge variant="outline" className={cn("px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-bold border", badgeStyle)}>
                        <Icon className="h-3.5 w-3.5 mr-1" />
                        {booking.status}
                    </Badge>
                </div>
            </div>

            {/* Timeline for active bookings */}
            {(isPending || isAccepted || isCompleted) && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="flex items-center text-sm font-medium text-slate-700 mb-3 ml-2">
                        {statusLabel}
                    </div>
                    <div className="flex items-center px-2">
                        {/* Step 1: Requested */}
                        <div className="relative flex flex-col items-center flex-1">
                            <div className="h-3 w-3 rounded-full bg-emerald-500 z-10 shrink-0"></div>
                            <div className="absolute top-1.5 left-1/2 w-full h-[2px] bg-emerald-500 -ml-[4px]"></div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-2">Requested</span>
                        </div>

                        {/* Step 2: Accepted */}
                        <div className="relative flex flex-col items-center flex-1">
                            <div className={cn("h-3 w-3 rounded-full z-10 shrink-0 relative", isAccepted || isCompleted ? "bg-emerald-500" : "bg-slate-300")}>
                                {isPending && <div className="absolute -inset-1 rounded-full border border-emerald-500 animate-ping opacity-75"></div>}
                            </div>
                            <div className={cn("absolute top-1.5 left-1/2 w-full h-[2px] -ml-[4px]", isCompleted ? "bg-emerald-500" : "bg-slate-200")}></div>
                            <span className={cn("text-[10px] font-bold uppercase tracking-wider mt-2", isAccepted || isCompleted ? "text-slate-800" : "text-slate-400")}>Accepted</span>
                        </div>

                        {/* Step 3: Completed */}
                        <div className="relative flex flex-col items-center flex-1">
                            {/* We align the last item to the right edge essentially by adjusting the container */}
                            <div className={cn("h-3 w-3 rounded-full z-10 shrink-0 relative lg:translate-x-4", isCompleted ? "bg-emerald-500" : "bg-slate-300")}>
                                {isAccepted && <div className="absolute -inset-1 rounded-full border border-emerald-500 animate-ping opacity-75"></div>}
                            </div>
                            <span className={cn("text-[10px] font-bold uppercase tracking-wider mt-2 lg:translate-x-4 text-center", isCompleted ? "text-slate-800" : "text-slate-400")}>Completed</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                    to={`/chat/${booking.id}`}
                    state={{
                        receiverId: booking.receiverId,
                        workerName: booking.workerName,
                    }}
                    className="flex-1 sm:flex-none"
                >
                    <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 h-10 shadow-sm">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Open chat
                    </Button>
                </Link>

                {isPending && (
                    <Button variant="outline" className="flex-1 sm:flex-none text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 h-10 transition-colors">
                        Cancel Request
                    </Button>
                )}
            </div>
        </div>
    );
}

function normalizeBookingStatus(status) {
    const normalizedStatus = String(status || "pending").trim().toLowerCase();
    if (normalizedStatus === "confirmed") return "pending";
    if (["pending", "accepted", "rejected", "completed", "cancelled"].includes(normalizedStatus)) {
        return normalizedStatus;
    }
    return "pending";
}

function formatStatusLabel(status) {
    const normalizedStatus = normalizeBookingStatus(status);
    return normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
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

