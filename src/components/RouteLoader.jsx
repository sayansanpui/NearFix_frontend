import { Skeleton } from "./ui/skeleton";

export default function RouteLoader() {
    return (
        <div className="mx-auto w-full max-w-4xl px-4 py-16">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <Skeleton className="h-8 w-52" />
                <Skeleton className="mt-4 h-4 w-80 max-w-full" />
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                </div>
            </div>
        </div>
    );
}