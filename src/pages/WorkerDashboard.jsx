import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import WorkerCard from "../components/WorkerCard";
import { Alert } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
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
import { getWorkerBookings, updateBookingStatus } from "../lib/bookings";
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
    const [workerBookings, setWorkerBookings] = useState([]);
    const [isLoadingWorkerBookings, setIsLoadingWorkerBookings] = useState(true);
    const [workerBookingsError, setWorkerBookingsError] = useState("");
    const [updatingBookingId, setUpdatingBookingId] = useState("");
    
    // Incoming request modal state
    const [incomingRequest, setIncomingRequest] = useState(null);
    const seenRequestIds = useRef(new Set());

    const hasWorkerProfile = Boolean(workerProfile?._id || workerProfile?.id);

    const bookingRequests = useMemo(
        () =>
            workerBookings.map((booking) => {
                const bookingId = booking?.bookingId || booking?._id || booking?.id;
                const status = normalizeBookingStatus(booking?.status);
                const userName = booking?.user?.name || "Customer";
                const userId = booking?.user?.id || booking?.userId || "";

                return {
                    id: bookingId,
                    userName,
                    userId,
                    status,
                    createdAt: booking?.createdAt || "",
                };
            }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        [workerBookings],
    );

    const loadWorkerBookings = useCallback(async ({ silent = false } = {}) => {
        if (!token) {
            setWorkerBookings([]);
            setIsLoadingWorkerBookings(false);
            return;
        }

        try {
            if (!silent) setIsLoadingWorkerBookings(true);
            setWorkerBookingsError("");

            const data = await getWorkerBookings(token);
            const bookingsList = Array.isArray(data) ? data : [];
            setWorkerBookings(bookingsList);

            // Check for new pending booking to show modal
            const pendingRequests = bookingsList.filter(b => normalizeBookingStatus(b.status) === "pending");
            
            // Look for a request we haven't seen yet
            const newestPending = pendingRequests.find(req => {
                const reqId = req?.bookingId || req?._id || req?.id;
                return reqId && !seenRequestIds.current.has(reqId);
            });

            if (newestPending) {
                const bookingId = newestPending?.bookingId || newestPending?._id || newestPending?.id;
                setIncomingRequest({
                    id: bookingId,
                    userName: newestPending?.user?.name || "Customer",
                    status: "pending"
                });
                seenRequestIds.current.add(bookingId);
            }

        } catch (error) {
            setWorkerBookingsError(error?.message || "Failed to load booking requests.");
            if (!silent) setWorkerBookings([]);
        } finally {
            if (!silent) setIsLoadingWorkerBookings(false);
        }
    }, [token]);

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

    useEffect(() => {
        void loadWorkerBookings();
        
        // Add polling for worker bookings
        const interval = setInterval(() => {
            void loadWorkerBookings({ silent: true });
        }, 5000);

        return () => clearInterval(interval);
    }, [loadWorkerBookings]);

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
            setTimeout(() => setErrorMessage(""), 3000);
            return;
        }

        try {
            setIsTogglingAvailability(true);
            setErrorMessage("");

            const nextAvailabilityValue = !availability;
            // Optimistic update for speedy UI response
            setAvailability(nextAvailabilityValue);

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
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error) {
            // Revert state on error
            setAvailability(availability);
            setErrorMessage(error.message || "Failed to update availability.");
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

    const handleBookingStatusChange = async (bookingId, status) => {
        if (!token || !bookingId) {
            return;
        }

        try {
            setUpdatingBookingId(bookingId);
            setWorkerBookingsError("");
            setErrorMessage("");
            
            // Check if processing from modal
            if (incomingRequest && incomingRequest.id === bookingId) {
                setIncomingRequest(null);
            }

            await updateBookingStatus(token, bookingId, status);
            setSuccessMessage(`Booking ${formatStatusLabel(status).toLowerCase()}.`);
            setTimeout(() => setSuccessMessage(""), 3000);
            await loadWorkerBookings({ silent: true });
        } catch (error) {
            setWorkerBookingsError(error?.message || "Failed to update booking status.");
        } finally {
            setUpdatingBookingId("");
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
            {/* Incoming Request Modal */}
            <Dialog open={!!incomingRequest} onOpenChange={(open) => !open && setIncomingRequest(null)}>
                <DialogContent className="sm:max-w-md border-emerald-100">
                    <DialogHeader>
                        <div className="mx-auto bg-emerald-100 p-3 rounded-full mb-2">
                            <AlertCircle className="w-8 h-8 text-emerald-600 animate-pulse" />
                        </div>
                        <DialogTitle className="text-center text-xl">New Booking Request</DialogTitle>
                        <DialogDescription className="text-center text-slate-600">
                            <b>{incomingRequest?.userName}</b> has requested your service. Do you want to accept this job?
                        </DialogDescription>
                    </DialogHeader>
                    
                    <DialogFooter className="flex-col sm:flex-row gap-2 mt-4 sm:justify-center">
                        <Button
                            variant="danger"
                            className="w-full sm:w-auto flex-1 font-semibold"
                            onClick={() => handleBookingStatusChange(incomingRequest?.id, "rejected")}
                            disabled={!!updatingBookingId}
                        >
                            Decline
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto flex-1 font-semibold"
                            onClick={() => handleBookingStatusChange(incomingRequest?.id, "accepted")}
                            disabled={!!updatingBookingId}
                        >
                            Accept Job
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card className="border-0 shadow-lg relative overflow-hidden bg-white ring-1 ring-slate-200">
                <CardHeader className="pl-6 border-b border-slate-100 pb-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <Badge variant="warm" className="w-fit bg-amber-50 text-amber-700 hover:bg-amber-100 uppercase tracking-widest text-[10px] font-bold mb-2">Worker Portal</Badge>
                            <CardTitle className="text-2xl font-display text-slate-900">
                                {hasWorkerProfile
                                    ? isEditMode
                                        ? "Edit Profile"
                                        : "Overview"
                                    : "Create Profile"}
                            </CardTitle>
                        </div>
                        
                        {/* Availability Toggle embedded in the top right header */}
                        {hasWorkerProfile && !isEditMode && (
                            <div className="flex flex-col items-end gap-1">
                                <Label htmlFor="availability-toggle" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {availability ? "Available" : "Offline"}
                                </Label>
                                <Switch
                                    id="availability-toggle"
                                    checked={availability}
                                    onCheckedChange={handleToggleAvailability}
                                    disabled={isTogglingAvailability}
                                    className="data-[state=checked]:bg-emerald-500"
                                />
                            </div>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="pt-6">
                    {isLoadingProfile && <Alert className="bg-slate-50 border-slate-200 text-slate-600">Loading your worker profile...</Alert>}

                    {hasWorkerProfile && !isEditMode && (
                        <div className="mb-6 flex flex-wrap gap-3">
                            <Button variant="outline" className="border-slate-200 bg-white shadow-sm hover:bg-slate-50" onClick={handleStartEdit}>
                                Edit Details
                            </Button>
                            <Button variant="destructive" className="bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 shadow-none border-none" onClick={handleDelete} disabled={isDeleting}>
                                {isDeleting ? "Deleting..." : "Delete Profile"}
                            </Button>
                        </div>
                    )}

                    {errorMessage && <Alert variant="error" className="mb-4">{errorMessage}</Alert>}
                    {successMessage && (
                        <Alert variant="success" className="mb-4 flex items-center gap-2 bg-emerald-50 border-emerald-200 text-emerald-800">
                            <CheckCircle2 className="h-4 w-4" />
                            {successMessage}
                        </Alert>
                    )}

                    {(!hasWorkerProfile || isEditMode) && (
                        <form onSubmit={handleSubmit} className="mb-2 space-y-5">
                            <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/50 p-5">
                                <div>
                                    <Label htmlFor="name" className="text-slate-700 mb-1.5 inline-block">Full Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="bg-white"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="skill" className="text-slate-700 mb-1.5 inline-block">Primary Skill</Label>
                                        <Input
                                            id="skill"
                                            name="skill"
                                            type="text"
                                            placeholder="e.g. Electrician, Plumber"
                                            value={formData.skill}
                                            onChange={handleChange}
                                            required
                                            className="bg-white"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="price" className="text-slate-700 mb-1.5 inline-block">Base Price (₹)</Label>
                                        <Input
                                            id="price"
                                            name="price"
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={formData.price}
                                            onChange={handleChange}
                                            required
                                            className="bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="lat" className="text-slate-700 mb-1.5 inline-block">Latitude</Label>
                                        <Input
                                            id="lat"
                                            name="lat"
                                            type="number"
                                            step="any"
                                            value={formData.lat}
                                            onChange={handleChange}
                                            required
                                            className="bg-white font-mono text-sm"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="lng" className="text-slate-700 mb-1.5 inline-block">Longitude</Label>
                                        <Input
                                            id="lng"
                                            name="lng"
                                            type="number"
                                            step="any"
                                            value={formData.lng}
                                            onChange={handleChange}
                                            required
                                            className="bg-white font-mono text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="image" className="text-slate-700 mb-1.5 inline-block">Profile Image URL</Label>
                                    <Input
                                        id="image"
                                        name="image"
                                        type="url"
                                        placeholder="https://..."
                                        value={formData.image}
                                        onChange={handleChange}
                                        required
                                        className="bg-white"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex-1" disabled={isSubmitting}>
                                    {isSubmitting
                                        ? isEditMode
                                            ? "Saving Changes..."
                                            : "Submitting..."
                                        : isEditMode
                                            ? "Save Profile"
                                            : "Create Profile"}
                                </Button>

                                {isEditMode && (
                                    <Button variant="outline" className="flex-1" onClick={handleCancelEdit}>
                                        Cancel Editing
                                    </Button>
                                )}
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>

            <div className="space-y-6 flex flex-col">
                <Card className="flex-1 shadow-md border-0 ring-1 ring-slate-200">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-lg font-display">Target Audience Preview</CardTitle>
                        <CardDescription>
                            This is what customers see when browsing directly from your area.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 bg-slate-50 flex items-center justify-center">
                        <div className="w-full max-w-sm">
                            <WorkerCard worker={previewWorker} showAction={false} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg ring-1 ring-slate-200">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-display">Booking Pipeline</CardTitle>
                                <CardDescription>
                                    Active requests requiring your attention.
                                </CardDescription>
                            </div>
                            <div className="flex -space-x-2">
                                {bookingRequests.filter(b => b.status === "pending").map((_, i) => (
                                    <div key={i} className="w-6 h-6 rounded-full bg-yellow-400 border-2 border-white"></div>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {workerBookingsError && <div className="p-4"><Alert variant="error">{workerBookingsError}</Alert></div>}

                        {isLoadingWorkerBookings && bookingRequests.length === 0 && <div className="p-6 text-center text-slate-500">Loading your pipeline...</div>}

                        {!isLoadingWorkerBookings && bookingRequests.length === 0 && (
                            <div className="p-10 text-center flex flex-col items-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                    <CheckCircle2 className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-slate-900 font-semibold mb-1">You're all caught up!</h3>
                                <p className="text-slate-500 text-sm max-w-[200px]">No pending booking requests at this moment.</p>
                            </div>
                        )}

                        {!isLoadingWorkerBookings && bookingRequests.length > 0 && (
                            <div className="divide-y divide-slate-100">
                                {bookingRequests.map((booking) => {
                                    const canAccept = booking.status !== "accepted" && booking.status !== "completed" && booking.status !== "rejected";
                                    const canReject = booking.status !== "rejected" && booking.status !== "completed";
                                    const isUpdatingThisBooking = updatingBookingId === booking.id;

                                    return (
                                        <div
                                            key={booking.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-slate-50 transition-colors"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-slate-900 text-base">{booking.userName}</p>
                                                    <Badge variant={getStatusBadgeVariant(booking.status)} className="px-1.5 py-0 text-[10px] h-4 leading-none">
                                                        {formatStatusLabel(booking.status)}
                                                    </Badge>
                                                </div>
                                                <p className="text-[11px] text-slate-400 font-mono">ID: {booking.id.substring(0, 8)}...</p>
                                            </div>

                                            <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto shrink-0">
                                                {canAccept && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-emerald-600 hover:bg-emerald-700 flex-1 xs:flex-none"
                                                        onClick={() =>
                                                            handleBookingStatusChange(booking.id, "accepted")
                                                        }
                                                        disabled={isUpdatingThisBooking}
                                                    >
                                                        Accept
                                                    </Button>
                                                )}
                                                {canReject && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 flex-1 xs:flex-none"
                                                        onClick={() =>
                                                            handleBookingStatusChange(booking.id, "rejected")
                                                        }
                                                        disabled={isUpdatingThisBooking}
                                                    >
                                                        Decline
                                                    </Button>
                                                )}
                                                {booking.status === "accepted" && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            handleBookingStatusChange(booking.id, "completed")
                                                        }
                                                        disabled={isUpdatingThisBooking}
                                                    >
                                                        Mark Completed
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
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

function formatStatusLabel(status) {
    const normalizedStatus = normalizeBookingStatus(status);
    return normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
}

function getStatusBadgeVariant(status) {
    const normalizedStatus = normalizeBookingStatus(status);

    if (normalizedStatus === "pending") return "warm";
    if (normalizedStatus === "accepted") return "success";
    if (normalizedStatus === "completed") return "default";
    if (normalizedStatus === "rejected") return "muted";

    return "default";
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
