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
import { getWorkerBookings } from "../lib/bookings";

export default function WorkerInbox() {
    const { token } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadWorkerBookings = async () => {
            try {
                setLoading(true);
                setError("");
                const data = await getWorkerBookings(token);
                setBookings(Array.isArray(data) ? data : []);
            } catch (err) {
                setError(err?.message || "Failed to load worker inbox.");
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            void loadWorkerBookings();
        }
    }, [token]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Worker Inbox</CardTitle>
                    <CardDescription>
                        Bookings assigned to you. Open chat to talk with customers.
                    </CardDescription>
                </CardHeader>
            </Card>

            {error && <Alert variant="error">{error}</Alert>}

            {loading && <Alert>Loading your inbox...</Alert>}

            {!loading && !error && bookings.length === 0 && (
                <Card>
                    <CardContent className="space-y-3 p-6">
                        <p className="text-slate-700">No bookings assigned to you yet.</p>
                        <Link to="/worker-dashboard" className="inline-flex">
                            <Button variant="outline">Back to Worker Dashboard</Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {!loading && !error && bookings.length > 0 && (
                <div className="space-y-3">
                    {bookings.map((booking) => {
                        const bookingId = booking?.bookingId || booking?._id || booking?.id;
                        const customerName = booking?.user?.name || "Customer";
                        const customerId = booking?.user?.id || "";

                        return (
                            <Card key={bookingId}>
                                <CardContent className="flex items-center justify-between gap-3 p-4">
                                    <div>
                                        <p className="font-medium text-slate-900">{customerName}</p>
                                        <p className="text-xs text-slate-500">Booking: {bookingId}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Badge>{booking?.status || "confirmed"}</Badge>
                                        <Link
                                            to={`/chat/${bookingId}`}
                                            state={{
                                                receiverId: customerId,
                                                counterpartName: customerName,
                                            }}
                                            className="inline-flex"
                                        >
                                            <Button size="sm" variant="outline">Open Chat</Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}