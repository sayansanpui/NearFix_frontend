import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { useAuth } from "../context/AuthContext";
import { getMyBookings } from "../lib/bookings";

export default function MyBookings() {
    const { token } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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
                    workerName:
                        inlineWorkerName || workerInfo?.name || "Unknown worker",
                    status: booking?.status || "confirmed",
                    receiverId: workerInfo?.userId || "",
                };
            });

            setBookings(normalized);
        } catch (err) {
            setError(err?.message || "Failed to load bookings.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadBookings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">My Bookings</CardTitle>
                    <CardDescription>Booked workers with current booking status.</CardDescription>
                </CardHeader>
            </Card>

            {error && <Alert variant="error">{error}</Alert>}

            {loading && <Alert>Loading your bookings...</Alert>}

            {!loading && !error && bookings.length === 0 && (
                <Card>
                    <CardContent className="space-y-3 p-6">
                        <p className="text-slate-700">No bookings found yet.</p>
                        <Link to="/dashboard" className="inline-flex">
                            <Button variant="outline">Browse workers</Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {!loading && !error && bookings.length > 0 && (
                <div className="space-y-3">
                    {bookings.map((booking) => (
                        <Card key={booking.id}>
                            <CardContent className="flex items-center justify-between gap-3 p-4">
                                <p className="font-medium text-slate-900">{booking.workerName}</p>
                                <div className="flex items-center gap-2">
                                    <Badge>{booking.status}</Badge>
                                    <Link
                                        to={`/chat/${booking.id}`}
                                        state={{
                                            receiverId: booking.receiverId,
                                            workerName: booking.workerName,
                                        }}
                                        className="inline-flex"
                                    >
                                        <Button size="sm" variant="outline">Chat</Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
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
