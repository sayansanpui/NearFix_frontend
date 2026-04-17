import { ShieldAlert } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDefaultRouteForRole } from "../lib/auth";
import { Alert } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function Unauthorized() {
    const location = useLocation();
    const { role } = useAuth();
    const from = location.state?.from || "this page";
    const redirectTo = getDefaultRouteForRole(role);

    return (
        <div className="mx-auto max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-red-600" />
                        Access denied
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert variant="error">
                        You do not have permission to access <strong>{from}</strong>.
                    </Alert>

                    <div className="flex flex-wrap gap-3">
                        <Link to="/">
                            <Button variant="outline">Go Home</Button>
                        </Link>
                        {role && (
                            <Link to={redirectTo}>
                                <Button>Go to your dashboard</Button>
                            </Link>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}