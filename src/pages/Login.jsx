import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Wrench } from "lucide-react";
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
import { Label } from "../components/ui/label";
import { useAuth } from "../context/AuthContext.jsx";
import { getDefaultRouteForRole } from "../lib/auth";

const initialForm = {
    email: "",
    password: "",
};

export default function Login() {
    const [form, setForm] = useState(initialForm);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { login, isAuthenticated, role } = useAuth();
    const infoMessage = location.state?.message || "";

    useEffect(() => {
        if (isAuthenticated) {
            navigate(getDefaultRouteForRole(role), { replace: true });
        }
    }, [isAuthenticated, navigate, role]);

    const resolveRedirectPath = (nextRole) => {
        const from = location.state?.from;
        if (
            typeof from === "string" &&
            !["/login", "/register", "/unauthorized"].includes(from)
        ) {
            return from;
        }

        return getDefaultRouteForRole(nextRole);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        const { email, password } = form;
        if (!email || !password) {
            setError("Email and password are required.");
            return;
        }

        try {
            setIsSubmitting(true);
            const baseUrl = import.meta.env.VITE_API_URL || "";
            const response = await axios.post(`${baseUrl}/api/auth/login`, form);
            const token = response?.data?.token;
            if (!token) {
                throw new Error("Missing token");
            }

            const loggedUser = login(token);
            if (!loggedUser?.role) {
                throw new Error("Invalid login response.");
            }

            navigate(resolveRedirectPath(loggedUser.role), { replace: true });
        } catch (err) {
            setError(err?.response?.data?.message || "Login failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex w-full mt-4 md:mt-10 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/50">
            {/* Left side: Information / Graphic */}
            <div className="relative hidden w-1/2 flex-col justify-between bg-emerald-900 p-10 text-white lg:flex">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 opacity-90"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
                
                <div className="relative z-10 flex items-center gap-2">
                    <Wrench className="h-8 w-8 text-emerald-400" />
                    <span className="font-display text-2xl font-bold tracking-tight">NearFix</span>
                </div>
                
                <div className="relative z-10 mt-20 space-y-6">
                    <h2 className="font-display text-4xl font-semibold leading-tight">
                        Expert services,<br /> right at your doorstep.
                    </h2>
                    <ul className="space-y-4 text-emerald-100">
                        <li className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            <span>Find trusted local professionals</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            <span>Real-time tracking and updates</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            <span>Secure transparent payments</span>
                        </li>
                    </ul>
                </div>

                <div className="relative z-10 mt-16 text-sm text-emerald-300">
                    &copy; {new Date().getFullYear()} NearFix Platform. All rights reserved.
                </div>
            </div>

            {/* Right side: Login Form */}
            <div className="flex w-full flex-col justify-center p-8 sm:p-12 lg:w-1/2">
                <div className="mx-auto w-full max-w-sm space-y-6">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-slate-900">Welcome back</h1>
                        <p className="mt-2 text-slate-600">Sign in to your account to continue</p>
                    </div>

                    {infoMessage && <Alert variant="success">{infoMessage}</Alert>}
                    {error && <Alert variant="error">{error}</Alert>}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-slate-700">Email address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="name@example.com"
                                className="h-11 rounded-xl bg-slate-50 focus-visible:ring-emerald-500"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-slate-700">Password</Label>
                                <a href="#" className="text-sm font-medium text-emerald-600 hover:text-emerald-500">
                                    Forgot password?
                                </a>
                            </div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                className="h-11 rounded-xl bg-slate-50 focus-visible:ring-emerald-500"
                                required
                            />
                        </div>

                        <Button 
                            type="submit" 
                            className="h-11 w-full rounded-xl bg-emerald-600 text-base font-medium shadow-sm hover:bg-emerald-700 transition-all" 
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>

                    <div className="text-center text-sm text-slate-600">
                        Don&apos;t have an account?{" "}
                        <Link className="font-semibold text-emerald-600 hover:text-emerald-500" to="/register">
                            Create an account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
