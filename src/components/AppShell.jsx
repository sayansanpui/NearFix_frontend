import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
    BookCheck,
    Home,
    LayoutDashboard,
    LogIn,
    LogOut,
    Menu,
    MessageSquare,
    UserPlus,
    Wrench,
    X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getDefaultRouteForRole } from "../lib/auth";
import { getWorkerBookingNotificationCount } from "../lib/bookings";
import { getWorkerUnreadCount } from "../lib/messages";
import { cn } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

function navLinkClass({ isActive }) {
    return cn(
        "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
        isActive ? "bg-emerald-100 text-emerald-800" : "text-slate-600 hover:bg-slate-100"
    );
}

export default function AppShell() {
    const { isAuthenticated, role, token, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [workerNotifications, setWorkerNotifications] = useState({
        unreadMessages: 0,
        unseenBookings: 0,
    });

    const dashboardPath = getDefaultRouteForRole(role);
    const dashboardLabel = role === "worker" ? "Worker Dashboard" : "Dashboard";

    const inboxBadgeCount =
        workerNotifications.unreadMessages +
        (location.pathname.startsWith("/worker-inbox") ? 0 : workerNotifications.unseenBookings);

    useEffect(() => {
        if (!isAuthenticated || role !== "worker" || !token) {
            return;
        }

        let isMounted = true;

        const loadNotifications = async () => {
            try {
                const [unreadMessages, unseenBookings] = await Promise.all([
                    getWorkerUnreadCount(token),
                    getWorkerBookingNotificationCount(token),
                ]);

                if (isMounted) {
                    setWorkerNotifications({ unreadMessages, unseenBookings });
                }
            } catch {
                // Keep previous values during transient polling errors.
            }
        };

        void loadNotifications();
        const intervalId = setInterval(() => {
            void loadNotifications();
        }, 30000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [isAuthenticated, role, token]);

    const links = useMemo(() => {
        if (isAuthenticated) {
            const authenticatedLinks = [
                { to: "/", label: "Home", icon: Home },
                {
                    to: dashboardPath,
                    label: dashboardLabel,
                    icon: role === "worker" ? Wrench : LayoutDashboard,
                },
            ];

            if (role === "user") {
                authenticatedLinks.push({
                    to: "/my-bookings",
                    label: "My Bookings",
                    icon: BookCheck,
                });
            }

            if (role === "worker") {
                authenticatedLinks.push({
                    to: "/worker-inbox",
                    label: "Inbox",
                    icon: MessageSquare,
                    badgeCount: inboxBadgeCount,
                });
            }

            return authenticatedLinks;
        }

        return [
            { to: "/", label: "Home", icon: Home },
            { to: "/login", label: "Login", icon: LogIn },
            { to: "/register", label: "Register", icon: UserPlus },
        ];
    }, [dashboardLabel, dashboardPath, inboxBadgeCount, isAuthenticated, role]);

    const handleLogout = () => {
        logout();
        setMobileNavOpen(false);
        navigate("/", { replace: true });
    };

    return (
        <div className="min-h-screen text-slate-900">
            <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute inset-0 bg-[#f6f3ec]" />
                <div className="absolute -top-32 right-[-8rem] h-80 w-80 rounded-full bg-amber-200/60 blur-3xl" />
                <div className="absolute -left-12 top-52 h-72 w-72 rounded-full bg-emerald-200/70 blur-3xl" />
                <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,#1f29370f_1px,transparent_1px),linear-gradient(to_bottom,#1f29370f_1px,transparent_1px)] [background-size:32px_32px]" />
            </div>

            <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-[#f6f3ec]/90 backdrop-blur">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
                    <Link
                        to="/"
                        className="font-display text-xl font-semibold tracking-tight text-slate-900"
                        onClick={() => setMobileNavOpen(false)}
                    >
                        NearFix
                    </Link>

                    <button
                        type="button"
                        className="inline-flex rounded-lg border border-slate-300 p-2 text-slate-700 md:hidden"
                        aria-label="Toggle navigation"
                        onClick={() => setMobileNavOpen((prev) => !prev)}
                    >
                        {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>

                    <nav className="hidden items-center gap-2 md:flex">
                        {links.map((item) => {
                            const Icon = item.icon;

                            return (
                                <NavLink key={item.to} to={item.to} className={navLinkClass} end>
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                    {item.badgeCount > 0 && (
                                        <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[11px] font-semibold text-white">
                                            {item.badgeCount}
                                        </span>
                                    )}
                                </NavLink>
                            );
                        })}

                        {isAuthenticated && (
                            <>
                                <Badge variant={role === "worker" ? "warm" : "default"}>
                                    {role === "worker" ? "Worker" : "User"}
                                </Badge>
                                <Button variant="ghost" onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </Button>
                            </>
                        )}
                    </nav>
                </div>

                {mobileNavOpen && (
                    <div className="border-t border-slate-200 md:hidden">
                        <nav className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-3">
                            {links.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        className={navLinkClass}
                                        end
                                        onClick={() => setMobileNavOpen(false)}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {item.label}
                                        {item.badgeCount > 0 && (
                                            <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[11px] font-semibold text-white">
                                                {item.badgeCount}
                                            </span>
                                        )}
                                    </NavLink>
                                );
                            })}

                            {isAuthenticated && (
                                <Button variant="outline" onClick={handleLogout} className="justify-start">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </Button>
                            )}
                        </nav>
                    </div>
                )}
            </header>

            <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 animate-in">
                <Outlet />
            </main>
        </div>
    );
}