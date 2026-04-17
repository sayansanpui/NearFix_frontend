import { createContext, useContext, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

const decodeToken = (token) => {
    if (!token) {
        return null;
    }

    try {
        return jwtDecode(token);
    } catch {
        return null;
    }
};

const getStoredAuth = () => {
    const storedToken = localStorage.getItem("token") || "";
    if (!storedToken) {
        return { token: "", user: null };
    }

    const decodedUser = decodeToken(storedToken);
    if (!decodedUser?.userId || !decodedUser?.role) {
        localStorage.removeItem("token");
        return { token: "", user: null };
    }

    return { token: storedToken, user: decodedUser };
};

export function AuthProvider({ children }) {
    const [authState, setAuthState] = useState(() => getStoredAuth());

    const token = authState.token;
    const user = authState.user;
    const isReady = true;

    const login = (nextToken) => {
        if (!nextToken) {
            return null;
        }

        const decodedUser = decodeToken(nextToken);
        if (!decodedUser?.userId || !decodedUser?.role) {
            localStorage.removeItem("token");
            setAuthState({ token: "", user: null });
            return null;
        }

        localStorage.setItem("token", nextToken);
        setAuthState({ token: nextToken, user: decodedUser });

        return decodedUser;
    };

    const logout = () => {
        localStorage.removeItem("token");
        setAuthState({ token: "", user: null });
    };

    const role = user?.role || null;
    const isAuthenticated = Boolean(token && user);

    const value = useMemo(
        () => ({ token, user, role, isAuthenticated, login, logout, isReady }),
        [token, user, role, isAuthenticated, isReady]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
