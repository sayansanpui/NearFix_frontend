import { forwardRef } from "react";
import { cn } from "../../lib/utils";

export const Select = forwardRef(function Select({ className, ...props }, ref) {
    return (
        <select
            ref={ref}
            className={cn(
                "flex h-10 w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70",
                className
            )}
            {...props}
        />
    );
});