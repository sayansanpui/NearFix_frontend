import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
        <div className="mx-auto w-full max-w-md">
            <Card>
                <CardHeader>
                    <CardTitle>Welcome back</CardTitle>
                    <CardDescription>Sign in to continue to NearFix.</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {infoMessage && <Alert variant="success">{infoMessage}</Alert>}
                    {error && <Alert variant="error">{error}</Alert>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <Button type="submit" fullWidth disabled={isSubmitting}>
                            {isSubmitting ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>

                    <p className="text-sm text-slate-600">
                        New to NearFix?{" "}
                        <Link className="font-semibold text-emerald-700 hover:text-emerald-600" to="/register">
                            Create an account
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
