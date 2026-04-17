import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import RouteLoader from "./RouteLoader";

export default function ProtectedRoute({ children }) {
    const { isAuthenticated, isReady } = useAuth();
    const location = useLocation();

    if (!isReady) {
        return <RouteLoader />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return children;
}
