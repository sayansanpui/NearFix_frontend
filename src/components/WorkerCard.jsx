import { useState } from "react";
import { BadgeIndianRupee, BriefcaseBusiness, MapPin, Star } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";

function formatPrice(price) {
    if (typeof price !== "number" || Number.isNaN(price)) {
        return "N/A";
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(price);
}

export default function WorkerCard({
    worker,
    showAction = true,
    actionLabel = "Book now",
    onAction,
    actionDisabled = false,
}) {
    const [imageError, setImageError] = useState(false);

    const name = worker?.name || "Unknown Worker";
    const skill = worker?.skill || "General";
    const rating = Number(worker?.rating || 0).toFixed(1);
    const locationText =
        typeof worker?.location?.lat === "number" && typeof worker?.location?.lng === "number"
            ? `${worker.location.lat.toFixed(2)}, ${worker.location.lng.toFixed(2)}`
            : "Location unavailable";

    const imageUrl = !imageError && worker?.image ? worker.image : "";

    return (
        <Card className="group overflow-hidden border-slate-200 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_35px_-20px_rgba(15,23,42,0.7)]">
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={name}
                    onError={() => setImageError(true)}
                    className="h-44 w-full object-cover"
                />
            ) : (
                <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-emerald-100 via-amber-50 to-slate-100">
                    <span className="font-display text-4xl font-semibold text-slate-500">
                        {name.charAt(0).toUpperCase()}
                    </span>
                </div>
            )}

            <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="line-clamp-1">{name}</CardTitle>
                    <Badge variant="warm">{skill}</Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-2 text-sm text-slate-700">
                <p className="flex items-center gap-2">
                    <BriefcaseBusiness className="h-4 w-4 text-slate-500" />
                    <span>{skill}</span>
                </p>
                <p className="flex items-center gap-2">
                    <BadgeIndianRupee className="h-4 w-4 text-slate-500" />
                    <span>{formatPrice(Number(worker?.price))}</span>
                </p>
                <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    <span className="line-clamp-1">{locationText}</span>
                </p>
                <p className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    <span>{rating} / 5</span>
                </p>
            </CardContent>

            {showAction && (
                <CardFooter>
                    <Button
                        fullWidth
                        onClick={() => onAction?.(worker)}
                        disabled={actionDisabled || typeof onAction !== "function"}
                    >
                        {actionLabel}
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}