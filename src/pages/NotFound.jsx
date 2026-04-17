import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function NotFound() {
    return (
        <div className="mx-auto max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Compass className="h-5 w-5 text-amber-600" />
                        Page not found
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-slate-600">
                        The page you tried to open does not exist or was moved.
                    </p>
                    <Link to="/">
                        <Button>Back to Home</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}