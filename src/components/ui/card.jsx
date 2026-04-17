import { cn } from "../../lib/utils";

export function Card({ className, ...props }) {
    return (
        <div
            className={cn(
                "rounded-2xl border border-slate-200 bg-white/95 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.45)]",
                className
            )}
            {...props}
        />
    );
}

export function CardHeader({ className, ...props }) {
    return <div className={cn("space-y-1.5 p-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
    return (
        <h3
            className={cn(
                "font-display text-xl font-semibold leading-tight tracking-tight text-slate-900",
                className
            )}
            {...props}
        />
    );
}

export function CardDescription({ className, ...props }) {
    return <p className={cn("text-sm text-slate-600", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
    return <div className={cn("px-5 pb-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
    return (
        <div
            className={cn("flex items-center gap-2 border-t border-slate-100 px-5 py-4", className)}
            {...props}
        />
    );
}