"use client";
import { useState, useRef, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import {
  Plus,
  LogOut,
  Trash2,
  Check,
  ListTodo,
  Sparkles,
  CircleCheckBig,
  Clock,
  Camera,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  RefreshCw,
} from "lucide-react";

// ─── Camera Capture Component ──────────────────────────────
function CameraCapture({
  onCapture,
  currentPreview,
}: {
  onCapture: (blob: Blob) => void;
  currentPreview: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 640 },
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch {
      // Fallback to file input if camera not available
      fileInputRef.current?.click();
    }
  }, []);

  const closeCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  }, [stream]);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Center crop
    const size = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 300, 300);

    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(blob);
        closeCamera();
      },
      "image/jpeg",
      0.85
    );
  }, [onCapture, closeCamera]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onCapture(file);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {isCameraOpen ? (
        <div
          className="animate-fade-in"
          style={{
            position: "relative",
            width: "100%",
            borderRadius: "1rem",
            overflow: "hidden",
            background: "#000",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              aspectRatio: "1",
              objectFit: "cover",
              display: "block",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "1rem",
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              gap: "1rem",
            }}
          >
            <button
              type="button"
              onClick={closeCamera}
              className="btn-ghost"
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.8125rem",
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(10px)",
              }}
            >
              <X size={16} />
              Cancel
            </button>
            <button
              type="button"
              onClick={takePhoto}
              className="btn-primary"
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "2rem",
              }}
            >
              <Camera size={18} />
              Capture
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openCamera}
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            border: "2px dashed var(--border-light)",
            background: currentPreview ? "none" : "var(--surface)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            transition: "all 0.2s ease",
            position: "relative",
          }}
        >
          {currentPreview ? (
            <>
              <img
                src={currentPreview}
                alt="Profile"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.opacity = "0";
                }}
              >
                <RefreshCw size={20} color="white" />
              </div>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <Camera size={24} color="var(--text-muted)" />
              <span
                style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}
              >
                Photo
              </span>
            </div>
          )}
        </button>
      )}
    </>
  );
}

// ─── Profile Photo Component ───────────────────────────────
function ProfilePhoto({
  userId,
  size = 36,
  onClick,
}: {
  userId: string;
  size?: number;
  onClick?: () => void;
}) {
  const user = useQuery(api.auth.getUserById, {
    userId: userId as Id<"users">,
  });
  const photoUrl = useQuery(
    api.auth.getProfilePhotoUrl,
    user?.profilePhotoId ? { storageId: user.profilePhotoId } : "skip"
  );

  return (
    <button
      onClick={onClick}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        border: "2px solid var(--border-light)",
        background: "var(--surface)",
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: 0,
        flexShrink: 0,
      }}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt="Profile"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <User size={size * 0.5} color="var(--text-muted)" />
      )}
    </button>
  );
}

// ─── Auth Screen ───────────────────────────────────────────
function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      // Upload photo first if captured
      const profilePhotoId = await uploadPhoto();

      // Register user
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

      // Auto-login after registration
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
    if (mode === "register") handleRegister();
    else handleLogin();
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
          {/* Logo */}
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

          {/* Error */}
          {error && (
            <div className="error-toast" style={{ width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertCircle size={16} />
                {error}
              </div>
            </div>
          )}

          {/* Camera (register only) */}
          {mode === "register" && (
            <CameraCapture
              onCapture={handlePhotoCapture}
              currentPreview={photoPreview}
            />
          )}

          {/* Username (register only) */}
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

          {/* Email */}
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

          {/* Password */}
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

          {/* Submit */}
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

          {/* Toggle */}
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

// ─── Update Photo Modal ────────────────────────────────────
function UpdatePhotoModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const generateUploadUrl = useMutation(api.auth.generateUploadUrl);
  const updateProfilePhoto = useMutation(api.auth.updateProfilePhoto);

  const handlePhotoCapture = (blob: Blob) => {
    setPhotoBlob(blob);
    setPhotoPreview(URL.createObjectURL(blob));
  };

  const handleSave = async () => {
    if (!photoBlob) return;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": photoBlob.type },
        body: photoBlob,
      });
      const { storageId } = await result.json();
      await updateProfilePhoto({
        userId: userId as Id<"users">,
        storageId,
      });
      onClose();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-strong animate-fade-in-up"
        style={{
          padding: "2rem",
          maxWidth: "400px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.25rem",
        }}
      >
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>
          Update Profile Photo
        </h2>
        <CameraCapture
          onCapture={handlePhotoCapture}
          currentPreview={photoPreview}
        />
        <div style={{ display: "flex", gap: "0.75rem", width: "100%" }}>
          <button
            className="btn-ghost"
            onClick={onClose}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!photoBlob || uploading}
            style={{ flex: 1 }}
          >
            {uploading ? <div className="spinner" /> : "Save Photo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Task Dashboard ────────────────────────────────────────
function TaskDashboard() {
  const { data: session } = useSession();
  const userId = session!.user.id as Id<"users">;

  const tasks = useQuery(api.tasks.get, { userId });
  const createTask = useMutation(api.tasks.create);
  const toggleTask = useMutation(api.tasks.toggleComplete);
  const deleteTask = useMutation(api.tasks.remove);

  const [newTaskText, setNewTaskText] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;
    await createTask({ userId, text: newTaskText.trim() });
    setNewTaskText("");
    setIsAdding(false);
  };

  const completedCount = tasks?.filter((t) => t.isCompleted).length ?? 0;
  const totalCount = tasks?.length ?? 0;
  const pendingCount = totalCount - completedCount;

  return (
    <div className="relative min-h-screen">
      <div className="bg-mesh" />
      <div
        className="relative z-10"
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          padding: "1.5rem 1rem",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <header
          className="animate-fade-in"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <ProfilePhoto
              userId={session!.user.id}
              size={42}
              onClick={() => setShowPhotoModal(true)}
            />
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.125rem",
                }}
              >
                <h1 className="text-lg font-bold tracking-tight">TaskFlow</h1>
              </div>
              <p
                style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}
              >
                Hey,{" "}
                <span
                  style={{ color: "var(--accent-light)", fontWeight: 600 }}
                >
                  {session?.user?.name}
                </span>
              </p>
            </div>
          </div>
          <button
            className="btn-ghost"
            onClick={() => signOut()}
            style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem" }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </header>

        {/* Stats */}
        <div
          className="glass animate-fade-in-up"
          style={{ padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}
        >
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-value">{totalCount}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-item">
              <span
                className="stat-value"
                style={{
                  background:
                    "linear-gradient(135deg, var(--success), #6ee7b7)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {completedCount}
              </span>
              <span className="stat-label">Done</span>
            </div>
            <div className="stat-item">
              <span
                className="stat-value"
                style={{
                  background:
                    "linear-gradient(135deg, var(--warning), #fcd34d)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {pendingCount}
              </span>
              <span className="stat-label">Pending</span>
            </div>
            {totalCount > 0 && (
              <div className="stat-item" style={{ marginLeft: "auto" }}>
                <span className="stat-value">
                  {Math.round((completedCount / totalCount) * 100)}%
                </span>
                <span className="stat-label">Progress</span>
              </div>
            )}
          </div>

          {totalCount > 0 && (
            <div
              style={{
                marginTop: "0.75rem",
                height: "4px",
                borderRadius: "2px",
                background: "var(--surface)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(completedCount / totalCount) * 100}%`,
                  background:
                    "linear-gradient(90deg, var(--accent), var(--accent-light))",
                  borderRadius: "2px",
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          )}
        </div>

        {/* Add Task */}
        {isAdding ? (
          <div
            className="glass animate-slide-down"
            style={{
              padding: "1.25rem",
              marginBottom: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <input
              className="input-field"
              type="text"
              placeholder="What needs to be done?"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              autoFocus
            />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                className="btn-ghost"
                onClick={() => {
                  setIsAdding(false);
                  setNewTaskText("");
                }}
                style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem" }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleAddTask}
                disabled={!newTaskText.trim()}
                style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem" }}
              >
                <Plus size={16} />
                Add
              </button>
            </div>
          </div>
        ) : (
          <button
            className="btn-primary animate-fade-in"
            onClick={() => setIsAdding(true)}
            style={{
              width: "100%",
              marginBottom: "1rem",
              padding: "0.875rem",
            }}
          >
            <Plus size={20} />
            Add New Task
          </button>
        )}

        {/* Task List */}
        <div style={{ flex: 1 }}>
          {tasks === undefined ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: "60px", width: "100%" }}
                />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state animate-fade-in">
              <ListTodo size={64} strokeWidth={1} />
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: "0.25rem",
                }}
              >
                No tasks yet
              </h3>
              <p style={{ fontSize: "0.875rem" }}>
                Tap the button above to add your first task
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {tasks
                .filter((t) => !t.isCompleted)
                .map((task) => (
                  <TaskItem
                    key={task._id}
                    task={task}
                    onToggle={() => toggleTask({ taskId: task._id })}
                    onDelete={() => deleteTask({ taskId: task._id })}
                  />
                ))}

              {completedCount > 0 && pendingCount > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.5rem 0",
                    margin: "0.25rem 0",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: "1px",
                      background: "var(--border)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                    }}
                  >
                    <CircleCheckBig size={12} />
                    Completed ({completedCount})
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: "1px",
                      background: "var(--border)",
                    }}
                  />
                </div>
              )}

              {tasks
                .filter((t) => t.isCompleted)
                .map((task) => (
                  <TaskItem
                    key={task._id}
                    task={task}
                    onToggle={() => toggleTask({ taskId: task._id })}
                    onDelete={() => deleteTask({ taskId: task._id })}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer
          style={{
            textAlign: "center",
            padding: "2rem 0 1rem",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
          }}
        >
          Powered by Convex · TaskFlow
        </footer>
      </div>

      {/* Photo Update Modal */}
      {showPhotoModal && (
        <UpdatePhotoModal
          userId={session!.user.id}
          onClose={() => setShowPhotoModal(false)}
        />
      )}
    </div>
  );
}

// ─── Task Item Component ───────────────────────────────────
function TaskItem({
  task,
  onToggle,
  onDelete,
}: {
  task: {
    _id: Id<"tasks">;
    text: string;
    isCompleted: boolean;
    createdAt: number;
  };
  onToggle: () => void;
  onDelete: () => void;
}) {
  const timeAgo = getTimeAgo(task.createdAt);

  return (
    <div
      className={`task-card task-item ${task.isCompleted ? "completed" : ""}`}
    >
      <button
        className={`checkbox-custom ${task.isCompleted ? "checked" : ""}`}
        onClick={onToggle}
        aria-label={task.isCompleted ? "Mark incomplete" : "Mark complete"}
      >
        {task.isCompleted && <Check size={14} color="white" strokeWidth={3} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          className="task-text"
          style={{
            fontSize: "0.9375rem",
            fontWeight: 500,
            margin: 0,
            lineHeight: 1.4,
            wordBreak: "break-word",
          }}
        >
          {task.text}
        </p>
        <p
          style={{
            fontSize: "0.6875rem",
            color: "var(--text-muted)",
            margin: "0.125rem 0 0",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <Clock size={10} />
          {timeAgo} · {formatDate(task.createdAt)}
        </p>
      </div>

      <button
        className="btn-danger"
        onClick={onDelete}
        aria-label="Delete task"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

// ─── Utility ───────────────────────────────────────────────
function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 1) return `${days}d ago`;
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  if (years >= 1) return `${years}y ago`;
  const date = new Date(timestamp);
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

// ─── Main Page ─────────────────────────────────────────────
export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <div className="bg-mesh" />
        <div
          className="spinner"
          style={{ width: 32, height: 32, borderWidth: 3 }}
        />
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return <TaskDashboard />;
}
