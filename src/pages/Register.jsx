import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, CheckCircle2, User, Wrench } from "lucide-react";
import { Alert } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../context/AuthContext";
import { getDefaultRouteForRole } from "../lib/auth";
import { cn } from "../lib/utils";

const initialForm = {
    name: "",
    email: "",
    password: "",
    role: "user",
};

export default function Register() {
    const [form, setForm] = useState(initialForm);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated, role } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            navigate(getDefaultRouteForRole(role), { replace: true });
        }
    }, [isAuthenticated, navigate, role]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleRoleSelect = (selectedRole) => {
        setForm((prev) => ({ ...prev, role: selectedRole }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        const { name, email, password, role } = form;
        if (!name || !email || !password || !role) {
            setError("All fields are required.");
            return;
        }

        try {
            setIsSubmitting(true);
            const baseUrl = import.meta.env.VITE_API_URL || "";
            await axios.post(`${baseUrl}/api/auth/register`, form);
            navigate("/login", {
                replace: true,
                state: {
                    message: "Account created successfully. Please login.",
                },
            });
        } catch (err) {
            setError(err?.response?.data?.message || "Registration failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex w-full mt-4 md:mt-10 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/50">
            {/* Left side: Information / Graphic */}
            <div className="relative hidden w-1/2 flex-col justify-between bg-emerald-900 p-10 text-white lg:flex">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 opacity-90"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2669&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
                
                <div className="relative z-10 flex items-center gap-2">
                    <Wrench className="h-8 w-8 text-emerald-400" />
                    <span className="font-display text-2xl font-bold tracking-tight">NearFix</span>
                </div>
                
                <div className="relative z-10 mt-20 space-y-6">
                    <h2 className="font-display text-4xl font-semibold leading-tight">
                        Join our growing <br /> community
                    </h2>
                    <ul className="space-y-4 text-emerald-100">
                        <li className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            <span>Quick and easy registration</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            <span>Access to thousands of professionals</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            <span>Start offering your services today</span>
                        </li>
                    </ul>
                </div>

                <div className="relative z-10 mt-16 text-sm text-emerald-300">
                    &copy; {new Date().getFullYear()} NearFix Platform. All rights reserved.
                </div>
            </div>

            {/* Right side: Register Form */}
            <div className="flex w-full flex-col justify-center p-8 sm:p-12 lg:w-1/2">
                <div className="mx-auto w-full max-w-md space-y-6">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-slate-900">Create account</h1>
                        <p className="mt-2 text-slate-600">Choose your role and get started in seconds</p>
                    </div>

                    {error && <Alert variant="error">{error}</Alert>}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        
                        {/* Role selection toggle cards */}
                        <div className="space-y-3">
                            <Label className="text-slate-700">I want to...</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => handleRoleSelect("user")}
                                    className={cn(
                                        "relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 text-center transition-all",
                                        form.role === "user"
                                            ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm"
                                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                                    )}
                                >
                                    <div className={cn(
                                        "rounded-full p-2",
                                        form.role === "user" ? "bg-emerald-100" : "bg-slate-100"
                                    )}>
                                        <User className={cn("h-6 w-6", form.role === "user" ? "text-emerald-600" : "text-slate-500")} />
                                    </div>
                                    <div className="font-medium">Hire Professionals</div>
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => handleRoleSelect("worker")}
                                    className={cn(
                                        "relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 text-center transition-all",
                                        form.role === "worker"
                                            ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm"
                                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                                    )}
                                >
                                    <div className={cn(
                                        "rounded-full p-2",
                                        form.role === "worker" ? "bg-emerald-100" : "bg-slate-100"
                                    )}>
                                        <Briefcase className={cn("h-6 w-6", form.role === "worker" ? "text-emerald-600" : "text-slate-500")} />
                                    </div>
                                    <div className="font-medium">Offer Services</div>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-slate-700">Full Name</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="e.g. John Doe"
                                className="h-11 rounded-xl bg-slate-50 focus-visible:ring-emerald-500"
                                required
                            />
                        </div>

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
                            <Label htmlFor="password" className="text-slate-700">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Create a strong password"
                                className="h-11 rounded-xl bg-slate-50 focus-visible:ring-emerald-500"
                                required
                            />
                        </div>

                        <Button 
                            type="submit" 
                            className="h-11 w-full rounded-xl bg-emerald-600 text-base font-medium shadow-sm hover:bg-emerald-700 transition-all mt-6" 
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Creating account..." : "Create account"}
                        </Button>
                    </form>

                    <div className="text-center text-sm text-slate-600">
                        Already have an account?{" "}
                        <Link className="font-semibold text-emerald-600 hover:text-emerald-500" to="/login">
                            Sign in instead
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
