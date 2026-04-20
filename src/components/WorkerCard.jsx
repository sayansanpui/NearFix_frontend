import { useState } from "react";
import { BadgeIndianRupee, BriefcaseBusiness, MapPin, Star } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

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
    const distance = Number(worker?.distance);
    const distanceText = Number.isFinite(distance) ? `${distance.toFixed(1)} km` : "";
    const locationText =
        typeof worker?.location?.lat === "number" && typeof worker?.location?.lng === "number"
            ? `${worker.location.lat.toFixed(2)}, ${worker.location.lng.toFixed(2)}`
            : "Location unavailable";

    const imageUrl = !imageError && worker?.image ? worker.image : "";
    const initial = name.charAt(0).toUpperCase();

    return (
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-md">
            <div>
                {/* Header Section */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-slate-100">
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt={name}
                                    onError={() => setImageError(true)}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-emerald-100 text-xl font-bold text-emerald-800">
                                    {initial}
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></div>
                        </div>

                        {/* Name & Skill */}
                        <div className="space-y-0.5">
                            <h3 className="font-display text-lg font-bold text-slate-900 leading-tight line-clamp-1">
                                {name}
                            </h3>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-slate-50 text-slate-600 font-normal px-2 py-0 h-5 text-xs">
                                    {skill}
                                </Badge>
                                {distanceText && (
                                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                        {distanceText}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1 flex-col shrink-0">
                        <div className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                            {rating}
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 text-emerald-600" />
                        <span className="truncate">{locationText}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <BadgeIndianRupee className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium text-slate-900">{formatPrice(Number(worker?.price))}</span>
                        <span className="text-xs text-slate-500">/ job</span>
                    </div>
                </div>
            </div>

            {/* Action Button */}
            {showAction && (
                <div className="mt-6 pt-2">
                    <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 font-medium h-10 rounded-xl"
                        onClick={() => onAction?.(worker)}
                        disabled={actionDisabled || typeof onAction !== "function"}
                    >
                        {actionLabel}
                    </Button>
                </div>
            )}
        </div>
    );
}