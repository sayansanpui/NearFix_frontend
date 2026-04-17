import { createContext, useContext, useEffect, useMemo, useState } from "react";
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

export function AuthProvider({ children }) {
    const [token, setToken] = useState("");
    const [user, setUser] = useState(null);
    const [isReady, setIsReady] = useState(false);

    const login = (nextToken) => {
        if (!nextToken) {
            return;
        }

        localStorage.setItem("token", nextToken);
        setToken(nextToken);
        setUser(decodeToken(nextToken));
    };

    const logout = () => {
        localStorage.removeItem("token");
        setToken("");
        setUser(null);
    };

    useEffect(() => {
        const storedToken = localStorage.getItem("token") || "";
        if (storedToken) {
            setToken(storedToken);
            setUser(decodeToken(storedToken));
        }
        setIsReady(true);
    }, []);

    const value = useMemo(
        () => ({ token, user, login, logout, isReady }),
        [token, user, isReady]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
