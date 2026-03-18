"use client";
import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useCallback,
} from "react";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";

interface AuthUser {
    userId: string;
    username: string;
}

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    register: (username: string) => Promise<void>;
    login: (username: string) => Promise<void>;
    logout: () => void;
    error: string | null;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Restore session from localStorage
        const stored = localStorage.getItem("taskflow_user");
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch {
                localStorage.removeItem("taskflow_user");
            }
        }
        setLoading(false);
    }, []);

    const clearError = useCallback(() => setError(null), []);

    const register = useCallback(async (username: string) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Get registration options from server
            const optionsRes = await fetch("/api/auth/register-options", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });

            if (!optionsRes.ok) {
                const err = await optionsRes.json();
                throw new Error(err.error || "Failed to get registration options");
            }

            const { options, userId } = await optionsRes.json();

            // 2. Start browser registration ceremony (fingerprint prompt)
            const credential = await startRegistration({ optionsJSON: options });

            // 3. Verify with server
            const verifyRes = await fetch("/api/auth/register-verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    credential,
                    expectedChallenge: options.challenge,
                    userId,
                }),
            });

            if (!verifyRes.ok) {
                const err = await verifyRes.json();
                throw new Error(err.error || "Registration verification failed");
            }

            const result = await verifyRes.json();

            if (result.verified) {
                const authUser = { userId, username };
                setUser(authUser);
                localStorage.setItem("taskflow_user", JSON.stringify(authUser));
            }
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Registration failed";
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const login = useCallback(async (username: string) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Get authentication options from server
            const optionsRes = await fetch("/api/auth/login-options", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });

            if (!optionsRes.ok) {
                const err = await optionsRes.json();
                throw new Error(err.error || "Failed to get login options");
            }

            const { options, userId } = await optionsRes.json();

            // 2. Start browser authentication ceremony (fingerprint prompt)
            const credential = await startAuthentication({ optionsJSON: options });

            // 3. Verify with server
            const verifyRes = await fetch("/api/auth/login-verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    credential,
                    expectedChallenge: options.challenge,
                    userId,
                }),
            });

            if (!verifyRes.ok) {
                const err = await verifyRes.json();
                throw new Error(err.error || "Authentication verification failed");
            }

            const result = await verifyRes.json();

            if (result.verified) {
                const authUser = { userId, username };
                setUser(authUser);
                localStorage.setItem("taskflow_user", JSON.stringify(authUser));
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Login failed";
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem("taskflow_user");
    }, []);

    return (
        <AuthContext.Provider
            value={{ user, loading, register, login, logout, error, clearError }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
