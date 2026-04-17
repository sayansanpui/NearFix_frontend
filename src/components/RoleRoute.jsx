import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function RoleRoute({ allowedRoles = [], children }) {
    const { user, isReady } = useAuth();
    const role = user?.role;

    if (!isReady) {
        return null;
    }

    if (!role || !allowedRoles.includes(role)) {
        return <Navigate to="/" replace />;
    }

    return children;
}
