import { useEffect, useMemo, useState } from "react";
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
import {
    createWorkerProfile,
    deleteMyWorkerProfile,
    getMyWorkerProfile,
    toggleWorkerAvailability,
    updateMyWorkerProfile,
} from "../lib/workers";

const initialForm = {
    name: "",
    skill: "",
    price: "",
    lat: "",
    lng: "",
    image: "",
};

export default function WorkerDashboard() {
    const { token, user } = useAuth();
    const [formData, setFormData] = useState(initialForm);
    const [workerProfile, setWorkerProfile] = useState(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
    const [availability, setAvailability] = useState(true);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const hasWorkerProfile = Boolean(workerProfile?._id || workerProfile?.id);

    useEffect(() => {
        let isMounted = true;

        const loadWorkerProfile = async () => {
            if (!token || !user?.userId) {
                if (isMounted) {
                    setIsLoadingProfile(false);
                }
                return;
            }

            try {
                const data = await getMyWorkerProfile(token);
                const profile = data?.worker || data || null;

                if (!isMounted) {
                    return;
                }

                setWorkerProfile(profile);

                if (profile) {
                    const nextAvailability =
                        typeof profile?.availability === "boolean" ? profile.availability : true;
                    setAvailability(nextAvailability);

                    if (!isEditMode) {
                        setFormData(workerToForm(profile));
                    }
                } else {
                    setAvailability(true);

                    if (!isEditMode) {
                        setFormData(initialForm);
                    }
                }
            } catch (error) {
                if (isMounted) {
                    const message = error?.message || "Failed to load worker profile.";

                    if (message.toLowerCase().includes("not found")) {
                        setWorkerProfile(null);
                        setAvailability(true);
                        if (!isEditMode) {
                            setFormData(initialForm);
                        }
                        setErrorMessage("");
                    } else {
                        setErrorMessage(message);
                    }
                }
            } finally {
                if (isMounted) {
                    setIsLoadingProfile(false);
                }
            }
        };

        void loadWorkerProfile();

        return () => {
            isMounted = false;
        };
    }, [isEditMode, token, user?.userId]);

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

            const payload = formToPayload(formData);

            if (hasWorkerProfile && isEditMode) {
                const updated = await updateMyWorkerProfile(token, payload);
                const savedWorker = updated?.worker || updated;

                setWorkerProfile(savedWorker);
                setFormData(workerToForm(savedWorker));
                setSuccessMessage("Worker profile updated successfully.");
                setIsEditMode(false);
            } else {
                const created = await createWorkerProfile(token, payload);
                const createdWorker = created?.worker || created;
                setWorkerProfile(createdWorker);
                setFormData(workerToForm(createdWorker));
                setSuccessMessage("Worker profile created successfully.");
            }
        } catch (error) {
            setErrorMessage(error.message || "Something went wrong.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleAvailability = async () => {
        if (!token) {
            setErrorMessage("You must be logged in to update availability.");
            setSuccessMessage("");
            return;
        }

        if (!hasWorkerProfile) {
            setErrorMessage("Create your worker profile first to update availability.");
            setSuccessMessage("");
            return;
        }

        try {
            setIsTogglingAvailability(true);
            setErrorMessage("");

            const nextAvailabilityValue = !availability;

            const data = await toggleWorkerAvailability(token, nextAvailabilityValue);
            const nextAvailability =
                typeof data?.availability === "boolean"
                    ? data.availability
                    : data?.worker?.availability;

            if (typeof nextAvailability === "boolean") {
                setAvailability(nextAvailability);
            } else {
                // Fallback for legacy responses that do not include availability fields.
                setAvailability(nextAvailabilityValue);
            }

            if (data?.worker) {
                setWorkerProfile(data.worker);
                setFormData(workerToForm(data.worker));
            }

            setSuccessMessage("Availability updated successfully.");
        } catch (error) {
            setErrorMessage(error.message || "Failed to update availability.");
            setSuccessMessage("");
        } finally {
            setIsTogglingAvailability(false);
        }
    };

    const handleStartEdit = () => {
        if (!workerProfile) {
            return;
        }

        setIsEditMode(true);
        setFormData(workerToForm(workerProfile));
        setErrorMessage("");
        setSuccessMessage("");
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        setFormData(workerToForm(workerProfile));
        setErrorMessage("");
    };

    const handleDelete = async () => {
        if (!token || !hasWorkerProfile) {
            return;
        }

        const shouldDelete = window.confirm("Are you sure you want to delete your worker profile?");
        if (!shouldDelete) {
            return;
        }

        try {
            setIsDeleting(true);
            setErrorMessage("");
            setSuccessMessage("");

            await deleteMyWorkerProfile(token);

            setWorkerProfile(null);
            setFormData(initialForm);
            setAvailability(true);
            setIsEditMode(false);
            setSuccessMessage("Worker profile deleted successfully.");
        } catch (error) {
            setErrorMessage(error.message || "Failed to delete worker profile.");
        } finally {
            setIsDeleting(false);
        }
    };

    const previewWorker = useMemo(() => {
        if (hasWorkerProfile && !isEditMode) {
            return workerProfile;
        }

        return {
            name: formData.name || "Your name",
            skill: formData.skill || "Skill",
            price: Number(formData.price || 0),
            location: {
                lat: Number(formData.lat || 0),
                lng: Number(formData.lng || 0),
            },
            image: formData.image,
            rating: Number(workerProfile?.rating || 0),
            availability,
        };
    }, [availability, formData, hasWorkerProfile, isEditMode, workerProfile]);

    return (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
                <CardHeader>
                    <Badge variant="warm" className="w-fit">Worker Dashboard</Badge>
                    <CardTitle className="mt-2">
                        {hasWorkerProfile
                            ? isEditMode
                                ? "Edit your worker profile"
                                : "Manage your worker profile"
                            : "Create your worker profile"}
                    </CardTitle>
                    <CardDescription>
                        {hasWorkerProfile
                            ? "Review your profile, keep availability updated, and manage your details."
                            : "Submit a profile that matches your backend contract so users can discover your service."}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {isLoadingProfile && <Alert>Loading your worker profile...</Alert>}

                    <div className="mb-5 flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 p-3">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Availability status</p>
                            <p className="text-xs text-slate-600">
                                {hasWorkerProfile
                                    ? "Toggle to control whether users can book you."
                                    : "Create your profile first to enable availability control."}
                            </p>
                        </div>
                        <Button
                            variant={availability ? "default" : "outline"}
                            onClick={handleToggleAvailability}
                            disabled={isTogglingAvailability || !hasWorkerProfile}
                        >
                            {isTogglingAvailability
                                ? "Updating..."
                                : availability
                                    ? "Available"
                                    : "Not Available"}
                        </Button>
                    </div>

                    {hasWorkerProfile && !isEditMode && (
                        <div className="mb-5 flex flex-wrap gap-2">
                            <Button variant="outline" onClick={handleStartEdit}>
                                Edit Profile
                            </Button>
                            <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                                {isDeleting ? "Deleting..." : "Delete Profile"}
                            </Button>
                        </div>
                    )}

                    {errorMessage && <Alert variant="error">{errorMessage}</Alert>}
                    {successMessage && (
                        <Alert variant="success" className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            {successMessage}
                        </Alert>
                    )}

                    {(!hasWorkerProfile || isEditMode) && (
                        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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

                            <div className="flex flex-wrap gap-2">
                                <Button type="submit" fullWidth disabled={isSubmitting}>
                                    {isSubmitting
                                        ? isEditMode
                                            ? "Updating..."
                                            : "Submitting..."
                                        : isEditMode
                                            ? "Update Worker"
                                            : "Create Worker"}
                                </Button>

                                {isEditMode && (
                                    <Button variant="outline" onClick={handleCancelEdit}>
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>

            <div className="space-y-3">
                <h2 className="font-display text-xl font-semibold text-slate-900">Live preview</h2>
                <WorkerCard worker={previewWorker} showAction={false} />
            </div>
        </div>
    );
}

function workerToForm(worker) {
    if (!worker) {
        return initialForm;
    }

    return {
        name: worker?.name || "",
        skill: worker?.skill || "",
        price: String(worker?.price ?? ""),
        lat: String(worker?.location?.lat ?? ""),
        lng: String(worker?.location?.lng ?? ""),
        image: worker?.image || "",
    };
}

function formToPayload(formData) {
    const price = Number(formData.price);
    const lat = Number(formData.lat);
    const lng = Number(formData.lng);

    if (!Number.isFinite(price) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error("Price and coordinates must be valid numbers.");
    }

    return {
        name: formData.name.trim(),
        skill: formData.skill.trim(),
        price,
        location: {
            lat,
            lng,
        },
        image: formData.image.trim(),
    };
}
