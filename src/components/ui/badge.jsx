import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide",
    {
        variants: {
            variant: {
                default: "bg-emerald-100 text-emerald-800",
                muted: "bg-slate-100 text-slate-700",
                warm: "bg-amber-100 text-amber-800",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export function Badge({ className, variant, ...props }) {
    return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}