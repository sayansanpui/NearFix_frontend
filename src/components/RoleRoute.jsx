import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import RouteLoader from "./RouteLoader";

export default function RoleRoute({ allowedRoles = [], children }) {
    const { role, isReady } = useAuth();
    const location = useLocation();

    if (!isReady) {
        return <RouteLoader />;
    }

    if (!role || !allowedRoles.includes(role)) {
        return <Navigate to="/unauthorized" replace state={{ from: location.pathname }} />;
    }

    return children;
}
