import { useEffect, useMemo, useState } from "react";
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
import { createBooking, getMyBookings } from "../lib/bookings";
import { getDefaultRouteForRole } from "../lib/auth";

function getDistanceValue(worker) {
    const distance = Number(worker?.distance);
    return Number.isFinite(distance) ? distance : null;
}

function sortWorkersByDistance(workers = []) {
    return [...workers].sort((a, b) => {
        const aDistance = getDistanceValue(a);
        const bDistance = getDistanceValue(b);

        if (aDistance === null && bDistance === null) {
            return 0;
        }

        if (aDistance === null) {
            return 1;
        }

        if (bDistance === null) {
            return -1;
        }

        return aDistance - bDistance;
    });
}

function normalizeBookingStatus(status) {
    const normalizedStatus = String(status || "pending").trim().toLowerCase();

    if (normalizedStatus === "confirmed") {
        return "pending";
    }

    if (["pending", "accepted", "rejected", "completed"].includes(normalizedStatus)) {
        return normalizedStatus;
    }

    return "pending";
}

function getWorkerIdFromBooking(booking) {
    const worker = booking?.workerId;
    if (typeof worker === "object" && worker !== null) {
        return worker?._id || worker?.id || "";
    }

    return worker || "";
}

export default function Home() {
    const { isAuthenticated, role, token } = useAuth();
    const navigate = useNavigate();
    const [bookingMessage, setBookingMessage] = useState("");
    const [isBooking, setIsBooking] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [workers, setWorkers] = useState([]);
    const [acceptedWorkerId, setAcceptedWorkerId] = useState("");
    const dashboardPath = getDefaultRouteForRole(role);
    const sortedWorkers = useMemo(() => sortWorkersByDistance(workers), [workers]);
    const actionLabel = !isAuthenticated
        ? "Login to book"
        : isBooking
            ? "Searching for worker..."
            : "Book now";

    useEffect(() => {
        if (!navigator.geolocation) {
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            () => {
                setUserLocation(null);
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000,
            },
        );
    }, []);

    useEffect(() => {
        if (!token || role !== "user") {
            setAcceptedWorkerId("");
            return;
        }

        let isMounted = true;
        let intervalId;

        const loadAcceptedBooking = async () => {
            try {
                const bookings = await getMyBookings(token);
                if (!isMounted) {
                    return;
                }

                const acceptedBooking = bookings.find(
                    (booking) => normalizeBookingStatus(booking?.status) === "accepted",
                );

                setAcceptedWorkerId(
                    acceptedBooking ? getWorkerIdFromBooking(acceptedBooking) : "",
                );
            } catch (error) {
                if (isMounted) {
                    setAcceptedWorkerId("");
                }
            }
        };

        void loadAcceptedBooking();
        intervalId = setInterval(() => {
            void loadAcceptedBooking();
        }, 5000);

        return () => {
            isMounted = false;
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [role, token]);

    const handleWorkerAction = async (worker) => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        if (role !== "user") {
            return;
        }

        const matchedWorker = worker || sortedWorkers[0];
        if (!matchedWorker) {
            setBookingMessage("No workers available to book right now.");
            return;
        }

        try {
            setIsBooking(true);
            setBookingMessage("");
            await createBooking(token, matchedWorker?._id || matchedWorker?.id);
            setBookingMessage("Booking Requested");
        } catch (err) {
            setBookingMessage(err?.message || "Failed to create booking.");
        } finally {
            setIsBooking(false);
        }
    };

    return (
        <div className="space-y-10">
            <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <Card className="overflow-hidden border-none bg-emerald-900 text-slate-100 shadow-xl relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 to-teal-900 opacity-90"></div>
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
                    
                    <CardHeader className="relative z-10">
                        <Badge variant="secondary" className="w-fit bg-emerald-800 text-emerald-100 hover:bg-emerald-700">
                            Local Service Marketplace
                        </Badge>
                        <CardTitle className="mt-3 text-3xl font-display text-white sm:text-4xl">
                            Find trusted workers in minutes
                        </CardTitle>
                        <CardDescription className="text-emerald-100/80 text-base max-w-lg mt-2">
                            NearFix helps users connect with local skilled workers quickly and safely. Register today to experience instant booking.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10 flex flex-wrap gap-3 pb-6 mt-4">
                        {!isAuthenticated && (
                            <>
                                <Link to="/login">
                                    <Button className="bg-emerald-500 hover:bg-emerald-600 border-none text-white shadow-md">
                                        <LogIn className="mr-2 h-4 w-4" />
                                        Login
                                    </Button>
                                </Link>
                                <Link to="/register">
                                    <Button variant="outline" className="text-emerald-900 bg-white hover:bg-emerald-50 border-none shadow-md">
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Create account
                                    </Button>
                                </Link>
                            </>
                        )}

                        {isAuthenticated && (
                            <Link to={dashboardPath}>
                                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md border-none">
                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                    Go to your dashboard
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-md border-slate-200/60">
                    <CardHeader>
                        <CardTitle className="text-xl font-display">Simple user flow</CardTitle>
                        <CardDescription>
                            Clear role-based journey that matches your needs.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ol className="space-y-4 text-sm text-slate-700">
                            <li className="flex gap-3">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">1</div>
                                <div>Register as <span className="font-semibold">user</span> or <span className="font-semibold">worker</span>.</div>
                            </li>
                            <li className="flex gap-3">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">2</div>
                                <div>Login and get auto-redirected to your role dashboard.</div>
                            </li>
                            <li className="flex gap-3">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">3</div>
                                <div>Users browse workers, workers offer services and earn.</div>
                            </li>
                        </ol>
                    </CardContent>
                </Card>
            </section>

            {bookingMessage && <Alert variant="success" className="bg-emerald-50 text-emerald-900 border-emerald-200">{bookingMessage}</Alert>}

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
                                Compare skills, prices, and locations before booking.
                            </p>
                        </div>
                        {role === "user" && (
                            <Badge variant="outline" className="hidden sm:inline-flex bg-white">Ready to book</Badge>
                        )}
                        {!isAuthenticated && (
                            <Link to="/login" className="hidden sm:inline-flex">
                                <Button variant="outline" size="sm" className="bg-white">
                                    Login to start
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        )}
                    </div>
                    
                    <div className="max-h-[800px] overflow-y-auto pr-2 pb-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                        <WorkersGrid
                            onAction={handleWorkerAction}
                            actionLabel={actionLabel}
                            showAction={role !== "worker"}
                            actionDisabled={isBooking}
                            emptyMessage="No worker profiles are available yet."
                            onlyAvailable
                            location={userLocation}
                            onWorkersLoaded={setWorkers}
                        />
                    </div>
                </div>

                {/* Right Side: Sticky Interactive Map */}
                <div className="sticky top-24 pt-1 space-y-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/50 hidden lg:block">
                    <div className="relative z-10 space-y-2">
                        <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                            Interactive Map
                            {userLocation && (
                                <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-widest bg-emerald-100 text-emerald-800 shrink-0">Live tracking</Badge>
                            )}
                        </h3>
                        <p className="text-sm text-slate-500">Find professionals closest to your precise location.</p>
                    </div>
                    <div className="h-[600px] w-full mt-4 overflow-hidden rounded-xl shadow-inner border border-slate-200/50">
                        <WorkersMap onlyAvailable highlightWorkerId={acceptedWorkerId} onMarkerAction={handleWorkerAction} />
                    </div>
                </div>

                {/* Mobile Map View (Fallback) */}
                <div className="space-y-4 lg:hidden mt-8 max-w-full">
                    <div>
                        <h2 className="font-display text-xl font-bold text-slate-900">Interactive map</h2>
                    </div>
                    <div className="h-[400px] w-full overflow-hidden rounded-xl shadow-sm border border-slate-200/50">
                        <WorkersMap onlyAvailable highlightWorkerId={acceptedWorkerId} onMarkerAction={handleWorkerAction} />
                    </div>
                </div>
            </section>
        </div>
    );
}
