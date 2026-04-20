import { useCallback, useEffect, useState } from "react";
import WorkerCard from "./WorkerCard";
import { Alert } from "./ui/alert";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { getWorkers } from "../lib/workers";

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
}) {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchWorkers = useCallback(async ({ withLoading = true } = {}) => {
        try {
            if (withLoading) {
                setLoading(true);
            }
            setError("");

            const data = await getWorkers({ onlyAvailable });
            setWorkers(data);
        } catch (err) {
            setError(err?.message || "Something went wrong while loading workers.");
        } finally {
            setLoading(false);
        }
    }, [onlyAvailable]);

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

    if (workers.length === 0) {
        return <Alert>{emptyMessage}</Alert>;
    }

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {workers.map((worker, index) => (
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
    );
}