import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-55 ring-offset-white",
    {
        variants: {
            variant: {
                default: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-500",
                secondary: "bg-amber-500 text-slate-900 shadow-sm hover:bg-amber-400",
                outline:
                    "border border-slate-300 bg-white text-slate-800 hover:border-emerald-300 hover:text-emerald-700",
                ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
                danger: "bg-red-600 text-white shadow-sm hover:bg-red-500",
            },
            size: {
                sm: "h-9 px-3",
                md: "h-10 px-4",
                lg: "h-11 px-5 text-base",
            },
            fullWidth: {
                true: "w-full",
                false: "",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "md",
            fullWidth: false,
        },
    }
);

export function Button({
    className,
    variant,
    size,
    fullWidth,
    type = "button",
    ...props
}) {
    return (
        <button
            type={type}
            className={cn(buttonVariants({ variant, size, fullWidth }), className)}
            {...props}
        />
    );
}