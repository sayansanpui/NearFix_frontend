import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Sparkles } from "lucide-react";
import WorkersMap from "../components/WorkersMap";
import WorkersGrid from "../components/WorkersGrid";
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
import { createBooking } from "../lib/bookings";

export default function Dashboard() {
    const { token } = useAuth();
    const [notice, setNotice] = useState("");

    const handleBookNow = async (worker) => {
        try {
            await createBooking(token, worker?._id || worker?.id);
            setNotice("Booking Successful");
        } catch (err) {
            setNotice(err?.message || "Failed to create booking.");
        }
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <Badge className="w-fit">User Dashboard</Badge>
                    <CardTitle className="mt-2 flex items-center gap-2 text-2xl">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        Book the right worker quickly
                    </CardTitle>
                    <CardDescription>
                        Review worker details and send booking interest from one place.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700">
                    <p>
                        Choose a worker and press <strong>Book now</strong> to save a booking.
                    </p>
                    <Link to="/my-bookings" className="inline-flex">
                        <Button variant="outline">View My Bookings</Button>
                    </Link>
                </CardContent>
            </Card>

            {notice && (
                <Alert variant="success" className="flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4" />
                    {notice}
                </Alert>
            )}

            <section className="space-y-4">
                <div>
                    <h2 className="font-display text-2xl font-semibold text-slate-900">
                        Available workers
                    </h2>
                    <p className="text-slate-600">Browse verified profiles and service rates.</p>
                </div>

                <WorkersGrid
                    onAction={handleBookNow}
                    actionLabel="Book now"
                    showAction
                    emptyMessage="No workers are listed right now. Please check again soon."
                />
            </section>

            <section className="space-y-4">
                <div>
                    <h2 className="font-display text-2xl font-semibold text-slate-900">Workers map</h2>
                    <p className="text-slate-600">Marker popups show each worker name.</p>
                </div>
                <WorkersMap />
            </section>
        </div>
    );
}
