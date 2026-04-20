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
            <Card className="bg-gradient-to-r from-emerald-900 to-teal-800 text-white overflow-hidden border-none shadow-xl relative">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540898565152-78d1f28b7e28?auto=format&fit=crop&q=80&w=2670&ixlib=rb-4.0.3')] bg-cover bg-center mix-blend-overlay opacity-10"></div>
                
                <CardHeader className="relative z-10">
                    <Badge className="w-fit bg-emerald-500 hover:bg-emerald-400 border-none text-white shadow-sm mb-2">User Dashboard</Badge>
                    <CardTitle className="flex items-center gap-2 text-2xl sm:text-3xl font-display text-white mt-1">
                        <Sparkles className="h-6 w-6 text-amber-300" />
                        Book the right worker quickly
                    </CardTitle>
                    <CardDescription className="text-emerald-50 max-w-xl text-base mt-2">
                        Review worker details and send booking interest from one place.
                    </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 space-y-4 text-sm text-emerald-50 mt-2">
                    <p>
                        Choose a worker and press <strong>Book now</strong> to save a booking.
                    </p>
                    <Link to="/my-bookings" className="inline-flex mt-2">
                        <Button className="bg-white text-emerald-900 hover:bg-emerald-50 shadow-sm border-none">
                            View My Bookings
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            {notice && (
                <Alert variant="success" className="flex items-center gap-2 bg-emerald-50 text-emerald-900 border-emerald-200">
                    <CalendarCheck className="h-5 w-5 text-emerald-600" />
                    {notice}
                </Alert>
            )}

            {/* Split View Layout */}
            <section className="grid gap-8 lg:grid-cols-2 xl:grid-cols-[1.3fr_1fr] items-start">
                
                {/* Left Side: Scrollable Worker Grid */}
                <div className="space-y-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
                                Available workers
                            </h2>
                            <p className="text-slate-600 text-sm mt-1">
                                Browse verified profiles and service rates.
                            </p>
                        </div>
                    </div>
                    
                    <div className="max-h-[800px] overflow-y-auto pr-2 pb-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                        <WorkersGrid
                            onAction={handleBookNow}
                            actionLabel="Book now"
                            showAction
                            emptyMessage="No workers are listed right now. Please check again soon."
                            onlyAvailable
                        />
                    </div>
                </div>

                {/* Right Side: Sticky Interactive Map */}
                <div className="sticky top-24 pt-1 space-y-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/50 hidden lg:block">
                    <div className="relative z-10 space-y-2">
                        <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                            Workers map
                        </h3>
                        <p className="text-sm text-slate-500">Marker popups show each worker name.</p>
                    </div>
                    <div className="h-[600px] w-full mt-4 overflow-hidden rounded-xl shadow-inner border border-slate-200/50">
                        <WorkersMap onlyAvailable onMarkerAction={handleBookNow} />
                    </div>
                </div>

                {/* Mobile Map View (Fallback) */}
                <div className="space-y-4 lg:hidden mt-8 max-w-full">
                    <div>
                        <h2 className="font-display text-xl font-bold text-slate-900">Workers map</h2>
                        <p className="text-slate-600 text-sm">Marker popups show each worker name.</p>
                    </div>
                    <div className="h-[400px] w-full overflow-hidden rounded-xl shadow-sm border border-slate-200/50">
                        <WorkersMap onlyAvailable onMarkerAction={handleBookNow} />
                    </div>
                </div>
            </section>
        </div>
    );
}
