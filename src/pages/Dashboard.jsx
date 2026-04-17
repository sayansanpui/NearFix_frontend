import { useState } from "react";
import { CalendarCheck, Sparkles } from "lucide-react";
import WorkersGrid from "../components/WorkersGrid";
import { Alert } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../components/ui/card";

export default function Dashboard() {
    const [notice, setNotice] = useState("");

    const handleBookNow = (worker) => {
        setNotice(`Booking request sent for ${worker?.name || "the selected worker"}.`);
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <Badge className="w-fit">User Dashboard</Badge>
                    <CardTitle className="mt-2 flex items-center gap-2 text-2xl">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        Book the right worker quickly
                    </CardTitle>
                    <CardDescription>
                        Review worker details and send booking interest from one place.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-slate-700">
                    Choose a worker and press <strong>Book now</strong>. This frontend confirms your
                    request while your booking backend endpoints can be connected later.
                </CardContent>
            </Card>

            {notice && (
                <Alert variant="success" className="flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4" />
                    {notice}
                </Alert>
            )}

            <section className="space-y-4">
                <div>
                    <h2 className="font-display text-2xl font-semibold text-slate-900">
                        Available workers
                    </h2>
                    <p className="text-slate-600">Browse verified profiles and service rates.</p>
                </div>

                <WorkersGrid
                    onAction={handleBookNow}
                    actionLabel="Book now"
                    showAction
                    emptyMessage="No workers are listed right now. Please check again soon."
                />
            </section>
        </div>
    );
}
