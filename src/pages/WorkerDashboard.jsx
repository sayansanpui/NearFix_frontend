import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import WorkerCard from "../components/WorkerCard";
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
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../context/AuthContext";

const initialForm = {
    name: "",
    skill: "",
    price: "",
    lat: "",
    lng: "",
    image: "",
};

export default function WorkerDashboard() {
    const { token } = useAuth();
    const [formData, setFormData] = useState(initialForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdWorker, setCreatedWorker] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!token) {
            setErrorMessage("You must be logged in to add a worker.");
            setSuccessMessage("");
            return;
        }

        try {
            setIsSubmitting(true);
            setErrorMessage("");
            setSuccessMessage("");
            setCreatedWorker(null);
            const baseUrl = import.meta.env.VITE_API_URL || "";

            const price = Number(formData.price);
            const lat = Number(formData.lat);
            const lng = Number(formData.lng);

            if (!Number.isFinite(price) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
                throw new Error("Price and coordinates must be valid numbers.");
            }

            const payload = {
                name: formData.name.trim(),
                skill: formData.skill.trim(),
                price,
                location: {
                    lat,
                    lng,
                },
                image: formData.image.trim(),
            };

            const response = await fetch(`${baseUrl}/api/workers`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const contentType = response.headers.get("content-type") || "";
            const hasJson = contentType.includes("application/json");
            const data = hasJson ? await response.json() : null;

            if (!response.ok) {
                throw new Error(data?.message || "Failed to create worker.");
            }

            setSuccessMessage("Worker created successfully.");
            setCreatedWorker(data);
            setFormData(initialForm);
        } catch (error) {
            setErrorMessage(error.message || "Something went wrong.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
                <CardHeader>
                    <Badge variant="warm" className="w-fit">Worker Dashboard</Badge>
                    <CardTitle className="mt-2">Create your worker profile</CardTitle>
                    <CardDescription>
                        Submit a profile that matches your backend contract so users can discover
                        your service.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="skill">Skill</Label>
                            <Input
                                id="skill"
                                name="skill"
                                type="text"
                                value={formData.skill}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="price">Price</Label>
                            <Input
                                id="price"
                                name="price"
                                type="number"
                                min="0"
                                step="1"
                                value={formData.price}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="lat">Latitude</Label>
                                <Input
                                    id="lat"
                                    name="lat"
                                    type="number"
                                    step="any"
                                    value={formData.lat}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="lng">Longitude</Label>
                                <Input
                                    id="lng"
                                    name="lng"
                                    type="number"
                                    step="any"
                                    value={formData.lng}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="image">Image URL</Label>
                            <Input
                                id="image"
                                name="image"
                                type="url"
                                value={formData.image}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {errorMessage && <Alert variant="error">{errorMessage}</Alert>}
                        {successMessage && (
                            <Alert variant="success" className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                {successMessage}
                            </Alert>
                        )}

                        <Button type="submit" fullWidth disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Create Worker"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="space-y-3">
                <h2 className="font-display text-xl font-semibold text-slate-900">Live preview</h2>
                <WorkerCard
                    worker={
                        createdWorker || {
                            name: formData.name || "Your name",
                            skill: formData.skill || "Skill",
                            price: Number(formData.price || 0),
                            location: {
                                lat: Number(formData.lat || 0),
                                lng: Number(formData.lng || 0),
                            },
                            image: formData.image,
                            rating: createdWorker?.rating || 0,
                        }
                    }
                    showAction={false}
                />
            </div>
        </div>
    );
}
