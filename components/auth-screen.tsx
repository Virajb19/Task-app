"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import {
  Sparkles,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { CameraCapture } from "@/components/camera-capture";

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.auth.generateUploadUrl);

  const handlePhotoCapture = (blob: Blob) => {
    setPhotoBlob(blob);
    const url = URL.createObjectURL(blob);
    setPhotoPreview(url);
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoBlob) return null;
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": photoBlob.type },
        body: photoBlob,
      });
      const { storageId } = await result.json();
      return storageId;
    } catch {
      console.error("Photo upload failed");
      return null;
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password) return;
    setLoading(true);
    setError(null);

    try {
      const profilePhotoId = await uploadPhoto();

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
          profilePhotoId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Registration failed");
      }

      const signInResult = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error("Auto-login failed. Please sign in manually.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "register") {
      void handleRegister();
    } else {
      void handleLogin();
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to retrieve password");
      }

      toast.success(`Your password is: ${data.password}`, {
        duration: 5000,
      });
      setShowForgotPassword(false);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to retrieve password"
      );
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center relative">
      <div className="bg-mesh" />
      <div className="glass-strong auth-card animate-fade-in-up relative z-10">
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.25rem",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                padding: "0.75rem",
                background: "rgba(139, 92, 246, 0.1)",
                borderRadius: "1rem",
              }}
            >
              <Sparkles size={32} color="#8b5cf6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">TaskFlow</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              {mode === "register" ? "Create your account" : "Welcome back"}
            </p>
          </div>

          {error && (
            <div className="error-toast" style={{ width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertCircle size={16} />
                {error}
              </div>
            </div>
          )}

          {mode === "register" && (
            <CameraCapture
              onCapture={handlePhotoCapture}
              currentPreview={photoPreview}
            />
          )}

          {mode === "register" && (
            <div style={{ position: "relative", width: "100%" }}>
              <User
                size={18}
                style={{
                  position: "absolute",
                  left: "0.875rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                className="input-field"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                style={{ paddingLeft: "2.75rem" }}
              />
            </div>
          )}

          <div style={{ position: "relative", width: "100%" }}>
            <Mail
              size={18}
              style={{
                position: "absolute",
                left: "0.875rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              className="input-field"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoFocus
              style={{ paddingLeft: "2.75rem" }}
            />
          </div>

          <div style={{ position: "relative", width: "100%" }}>
            <Lock
              size={18}
              style={{
                position: "absolute",
                left: "0.875rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              className="input-field"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{ paddingLeft: "2.75rem", paddingRight: "2.75rem" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "0.875rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                color: "var(--text-muted)",
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {mode === "login" && (
            <div style={{ width: "100%", marginTop: "-0.35rem" }}>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword((prev) => !prev);
                  setForgotEmail(email);
                  setError(null);
                }}
                style={{
                  color: "var(--accent-light)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  padding: 0,
                }}
              >
                Forgot password?
              </button>
              {showForgotPassword && (
                <div
                  className="glass"
                  style={{
                    marginTop: "0.75rem",
                    padding: "0.75rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <input
                    className="input-field"
                    type="email"
                    placeholder="Enter your email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    disabled={forgotLoading}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => void handleForgotPassword()}
                    disabled={forgotLoading || !forgotEmail.trim()}
                    style={{ width: "100%", padding: "0.625rem" }}
                  >
                    {forgotLoading ? <div className="spinner" /> : "Get Password"}
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={
              loading ||
              !email.trim() ||
              !password ||
              (mode === "register" && !username.trim())
            }
            style={{ width: "100%", padding: "0.875rem" }}
          >
            {loading ? (
              <div className="spinner" />
            ) : mode === "register" ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </button>

          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError(null);
                  }}
                  style={{
                    color: "var(--accent-light)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "inherit",
                    fontFamily: "inherit",
                  }}
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  style={{
                    color: "var(--accent-light)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "inherit",
                    fontFamily: "inherit",
                  }}
                >
                  Sign In
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
