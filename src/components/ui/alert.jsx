import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const alertVariants = cva("w-full rounded-xl border px-4 py-3 text-sm", {
    variants: {
        variant: {
            info: "border-slate-200 bg-slate-50 text-slate-700",
            success: "border-emerald-200 bg-emerald-50 text-emerald-800",
            error: "border-red-200 bg-red-50 text-red-700",
        },
    },
    defaultVariants: {
        variant: "info",
    },
});

export function Alert({ className, variant, ...props }) {
    return <div role="status" className={cn(alertVariants({ variant }), className)} {...props} />;
}