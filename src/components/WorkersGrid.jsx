import { useCallback, useEffect, useMemo, useState } from "react";
import WorkerCard from "./WorkerCard";
import { Alert } from "./ui/alert";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
import { Search, Filter } from "lucide-react";
import { getWorkers } from "../lib/workers";

function getDistanceValue(worker) {
    const distance = Number(worker?.distance);
    return Number.isFinite(distance) ? distance : null;
}

function sortWorkersByDistance(workers = []) {
    return [...workers].sort((a, b) => {
        const aDistance = getDistanceValue(a);
        const bDistance = getDistanceValue(b);

        if (aDistance === null && bDistance === null) {
            return 0;
        }

        if (aDistance === null) {
            return 1;
        }

        if (bDistance === null) {
            return -1;
        }

        return aDistance - bDistance;
    });
}

function WorkerCardSkeleton() {
    return (
        <Card className="overflow-hidden border-slate-200">
            <Skeleton className="h-44 w-full rounded-none" />
            <div className="space-y-3 p-5">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="mt-4 h-10 w-full" />
            </div>
        </Card>
    );
}

export default function WorkersGrid({
    onAction,
    actionLabel = "Book now",
    showAction = true,
    actionDisabled = false,
    emptyMessage = "No workers found yet.",
    onlyAvailable = false,
    location = null,
    onWorkersLoaded,
}) {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [skillFilter, setSkillFilter] = useState("all");
    const latitude = location?.lat;
    const longitude = location?.lng;

    const fetchWorkers = useCallback(async ({ withLoading = true } = {}) => {
        try {
            if (withLoading) {
                setLoading(true);
            }
            setError("");

            const data = await getWorkers({
                onlyAvailable,
                lat: latitude,
                lng: longitude,
            });
            const sortedWorkers = sortWorkersByDistance(data);

            setWorkers(sortedWorkers);
            if (typeof onWorkersLoaded === "function") {
                onWorkersLoaded(sortedWorkers);
            }
        } catch (err) {
            setError(err?.message || "Something went wrong while loading workers.");
            if (typeof onWorkersLoaded === "function") {
                onWorkersLoaded([]);
            }
        } finally {
            setLoading(false);
        }
    }, [onlyAvailable, onWorkersLoaded, latitude, longitude]);

    useEffect(() => {
        let intervalId;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchWorkers({ withLoading: false });

        if (onlyAvailable) {
            intervalId = setInterval(() => {
                void fetchWorkers({ withLoading: false });
            }, 30000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [fetchWorkers, onlyAvailable]);

    const uniqueSkills = useMemo(() => {
        const skillsObj = {};
        workers.forEach((w) => {
            if (w.skill) skillsObj[w.skill] = true;
        });
        return Object.keys(skillsObj).sort();
    }, [workers]);

    const filteredWorkers = useMemo(() => {
        return workers.filter((worker) => {
            const matchesQuery = (worker.name || "").toLowerCase().includes(searchQuery.toLowerCase());
            const matchesSkill = skillFilter === "all" || worker.skill === skillFilter;
            return matchesQuery && matchesSkill;
        });
    }, [workers, searchQuery, skillFilter]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <WorkerCardSkeleton />
                <WorkerCardSkeleton />
                <WorkerCardSkeleton />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <Alert variant="error">{error}</Alert>
                <Button variant="outline" onClick={fetchWorkers}>
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Search and Filters Bar */}
            <div className="sticky top-16 z-10 -mx-4 px-4 py-3 bg-[#f6f3ec]/90 backdrop-blur-md md:static md:mx-0 md:px-0 md:py-0 md:bg-transparent md:backdrop-blur-none transition-all">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Find by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-11 rounded-xl bg-white focus-visible:ring-emerald-500 shadow-sm border-slate-200"
                        />
                    </div>
                    <div className="relative sm:w-[200px] shrink-0">
                        <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 z-10" />
                        {/* Custom Select using standard tailwind to match shadcn select visually until fully implemented */}
                        <select
                            value={skillFilter}
                            onChange={(e) => setSkillFilter(e.target.value)}
                            className="h-11 w-full pl-9 pr-8 rounded-xl bg-white shadow-sm border border-slate-200 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 appearance-none text-slate-700"
                        >
                            <option value="all">All Skills</option>
                            {uniqueSkills.map((skill) => (
                                <option key={skill} value={skill}>
                                    {skill}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {workers.length === 0 ? (
                <Alert>{emptyMessage}</Alert>
            ) : filteredWorkers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                    No workers match your search criteria. Try adjusting the skill filter or search query.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                    {filteredWorkers.map((worker, index) => (
                        <WorkerCard
                            key={worker?._id || worker?.id || `${worker?.name || "worker"}-${index}`}
                            worker={worker}
                            onAction={onAction}
                            actionLabel={actionLabel}
                            actionDisabled={actionDisabled}
                            showAction={showAction}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}