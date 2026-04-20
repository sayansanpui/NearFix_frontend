import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export function Dialog({ open, onOpenChange, children }) {
    const overlayRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && open) {
                onOpenChange?.(false);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onOpenChange]);

    // Lock body scroll when open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    if (!open) return null;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center"
            aria-modal="true"
            role="dialog"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => onOpenChange?.(false)}
            />
            {/* Content */}
            <div className="relative z-10 w-full max-w-lg px-4">
                {children}
            </div>
        </div>
    );
}

export function DialogContent({ children, className }) {
    return (
        <div
            className={cn(
                "relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in fade-in-0 zoom-in-95",
                className
            )}
        >
            {children}
        </div>
    );
}

export function DialogHeader({ children, className }) {
    return (
        <div className={cn("flex flex-col items-center space-y-2 text-center mb-4", className)}>
            {children}
        </div>
    );
}

export function DialogTitle({ children, className }) {
    return (
        <h2 className={cn("font-display text-xl font-bold text-slate-900", className)}>
            {children}
        </h2>
    );
}

export function DialogDescription({ children, className }) {
    return (
        <p className={cn("text-sm text-slate-600 leading-relaxed", className)}>
            {children}
        </p>
    );
}

export function DialogFooter({ children, className }) {
    return (
        <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4", className)}>
            {children}
        </div>
    );
}

export function DialogClose({ onClose, className }) {
    return (
        <button
            type="button"
            onClick={onClose}
            className={cn(
                "absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors",
                className
            )}
            aria-label="Close dialog"
        >
            <X className="h-4 w-4" />
        </button>
    );
}
