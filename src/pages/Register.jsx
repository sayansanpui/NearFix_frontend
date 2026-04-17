import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
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
import { Select } from "../components/ui/select";
import { useAuth } from "../context/AuthContext";
import { getDefaultRouteForRole } from "../lib/auth";

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
        <div className="mx-auto w-full max-w-md">
            <Card>
                <CardHeader>
                    <CardTitle>Create your account</CardTitle>
                    <CardDescription>
                        Choose your role first so NearFix sends you to the right dashboard.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {error && <Alert variant="error">{error}</Alert>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Jane Doe"
                                required
                            />
                        </div>

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
                                placeholder="Create a password"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="role">Role</Label>
                            <Select
                                id="role"
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                                required
                            >
                                <option value="user">User (hire workers)</option>
                                <option value="worker">Worker (offer services)</option>
                            </Select>
                        </div>

                        <Button type="submit" fullWidth disabled={isSubmitting}>
                            {isSubmitting ? "Creating account..." : "Create account"}
                        </Button>
                    </form>

                    <p className="text-sm text-slate-600">
                        Already registered?{" "}
                        <Link className="font-semibold text-emerald-700 hover:text-emerald-600" to="/login">
                            Login
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
