import { useEffect, useState } from "react";
import WorkerCard from "../components/WorkerCard";

export default function Home() {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchWorkers = async () => {
            try {
                setLoading(true);
                setError("");

                const baseUrl = import.meta.env.VITE_API_URL || "";
                const response = await fetch(`${baseUrl}/api/workers`);
                if (!response.ok) {
                    throw new Error("Failed to fetch workers");
                }

                const contentType = response.headers.get("content-type") || "";
                if (!contentType.includes("application/json")) {
                    throw new Error("Invalid API response. Check VITE_API_URL configuration.");
                }

                const data = await response.json();
                setWorkers(Array.isArray(data) ? data : []);
            } catch (err) {
                setError(err.message || "Something went wrong");
            } finally {
                setLoading(false);
            }
        };

        fetchWorkers();
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl md:text-4xl font-semibold">Available Workers</h1>
                    <p className="text-slate-400 mt-2">Browse skilled workers near you</p>
                </div>

                {loading && (
                    <p className="text-center text-slate-400">Loading workers...</p>
                )}

                {!loading && error && (
                    <p className="text-center text-red-400">{error}</p>
                )}

                {!loading && !error && workers.length === 0 && (
                    <p className="text-center text-slate-400">No workers found.</p>
                )}

                {!loading && !error && workers.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {workers.map((worker, index) => (
                            <WorkerCard
                                key={worker.id ?? `${worker.name}-${index}`}
                                worker={worker}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
