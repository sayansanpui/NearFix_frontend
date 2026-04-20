import { useState } from "react";
import { ArrowRight, LayoutDashboard, LogIn, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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
import { getDefaultRouteForRole } from "../lib/auth";

export default function Home() {
    const { isAuthenticated, role, token } = useAuth();
    const navigate = useNavigate();
    const [bookingMessage, setBookingMessage] = useState("");
    const dashboardPath = getDefaultRouteForRole(role);

    const handleWorkerAction = async (worker) => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        if (role !== "user") {
            return;
        }

        try {
            await createBooking(token, worker?._id || worker?.id);
            setBookingMessage("Booking Successful");
        } catch (err) {
            setBookingMessage(err?.message || "Failed to create booking.");
        }
    };

    return (
        <div className="space-y-8">
            <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <Card className="overflow-hidden border-none bg-slate-900 text-slate-100 shadow-xl">
                    <CardHeader>
                        <Badge variant="warm" className="w-fit bg-amber-300/20 text-amber-200">
                            Local Service Marketplace
                        </Badge>
                        <CardTitle className="mt-3 text-3xl text-white sm:text-4xl">
                            Find trusted workers in minutes
                        </CardTitle>
                        <CardDescription className="text-slate-300">
                            NearFix helps users connect with local skilled workers, while worker
                            accounts can quickly publish their service profile.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3 pb-6">
                        {!isAuthenticated && (
                            <>
                                <Link to="/login">
                                    <Button>
                                        <LogIn className="mr-2 h-4 w-4" />
                                        Login
                                    </Button>
                                </Link>
                                <Link to="/register">
                                    <Button variant="secondary">
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Create account
                                    </Button>
                                </Link>
                            </>
                        )}

                        {isAuthenticated && (
                            <Link to={dashboardPath}>
                                <Button variant="secondary">
                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                    Go to your dashboard
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Simple user flow</CardTitle>
                        <CardDescription>
                            Clear role-based journey that matches your backend APIs.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ol className="space-y-3 text-sm text-slate-700">
                            <li>
                                <span className="font-semibold text-slate-900">1.</span> Register as
                                <span className="font-semibold"> user</span> or
                                <span className="font-semibold"> worker</span>.
                            </li>
                            <li>
                                <span className="font-semibold text-slate-900">2.</span> Login and get
                                auto-redirected to your role dashboard.
                            </li>
                            <li>
                                <span className="font-semibold text-slate-900">3.</span> Users browse
                                workers, workers create service profiles.
                            </li>
                        </ol>
                    </CardContent>
                </Card>
            </section>

            {bookingMessage && <Alert variant="success">{bookingMessage}</Alert>}

            <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="font-display text-2xl font-semibold text-slate-900">
                            Available workers
                        </h2>
                        <p className="text-slate-600">
                            Compare skills, prices, and locations before booking.
                        </p>
                    </div>
                    {role === "user" && (
                        <Badge className="hidden sm:inline-flex">Ready to book</Badge>
                    )}
                    {!isAuthenticated && (
                        <Link to="/login" className="hidden sm:inline-flex">
                            <Button variant="outline">
                                Login to start
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    )}
                </div>

                <WorkersGrid
                    onAction={handleWorkerAction}
                    actionLabel={isAuthenticated ? "Book now" : "Login to book"}
                    showAction={role !== "worker"}
                    emptyMessage="No worker profiles are available yet."
                    onlyAvailable
                />
            </section>

            <section className="space-y-4">
                <div>
                    <h2 className="font-display text-2xl font-semibold text-slate-900">Workers map</h2>
                    <p className="text-slate-600">
                        Explore worker locations centered around Kolkata.
                    </p>
                </div>
                <WorkersMap onlyAvailable />
            </section>
        </div>
    );
}
