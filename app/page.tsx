"use client";
import { useState } from "react";
import { useAuth } from "./AuthContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import {
  Fingerprint,
  Plus,
  LogOut,
  Trash2,
  Check,
  ListTodo,
  Sparkles,
  CircleCheckBig,
  Clock,
  AlertCircle,
} from "lucide-react";

// ─── Auth Screen ───────────────────────────────────────────
function AuthScreen() {
  const { register, login, loading, error, clearError } = useAuth();
  const [username, setUsername] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");

  const handleSubmit = async () => {
    if (!username.trim()) return;
    clearError();
    try {
      if (mode === "register") {
        await register(username.trim());
      } else {
        await login(username.trim());
      }
    } catch {
      // error is already set in context
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center relative">
      <div className="bg-mesh" />
      <div className="glass-strong auth-card animate-fade-in-up relative z-10">
        <div className="flex flex-col items-center gap-6">
          {/* Logo & Title */}
          <div className="flex flex-col items-center gap-3">
            <div className="fingerprint-icon">
              <Fingerprint size={48} strokeWidth={1.5} color="#8b5cf6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">TaskFlow</h1>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.875rem",
                textAlign: "center",
              }}
            >
              {mode === "register"
                ? "Create your account with biometric security"
                : "Sign in with your fingerprint"}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-toast" style={{ width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertCircle size={16} />
                {error}
              </div>
            </div>
          )}

          {/* Form */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <input
              className="input-field"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              disabled={loading}
              autoFocus
            />
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={!username.trim() || loading}
              style={{ width: "100%", padding: "0.875rem" }}
            >
              {loading ? (
                <div className="spinner" />
              ) : (
                <>
                  <Fingerprint size={20} />
                  {mode === "register"
                    ? "Register with Fingerprint"
                    : "Sign in with Fingerprint"}
                </>
              )}
            </button>
          </div>

          {/* Toggle mode */}
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => {
                    setMode("register");
                    clearError();
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
                Already registered?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    clearError();
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
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Task Dashboard ────────────────────────────────────────
function TaskDashboard() {
  const { user, logout } = useAuth();
  const userId = user!.userId as Id<"users">;

  const tasks = useQuery(api.tasks.get, { userId });
  const createTask = useMutation(api.tasks.create);
  const toggleTask = useMutation(api.tasks.toggleComplete);
  const deleteTask = useMutation(api.tasks.remove);

  const [newTaskText, setNewTaskText] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;
    await createTask({
      userId,
      text: newTaskText.trim(),
    });
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
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.25rem",
              }}
            >
              <Sparkles size={20} color="var(--accent-light)" />
              <h1 className="text-xl font-bold tracking-tight">TaskFlow</h1>
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Welcome back,{" "}
              <span style={{ color: "var(--accent-light)", fontWeight: 600 }}>
                {user?.username}
              </span>
            </p>
          </div>
          <button className="btn-ghost" onClick={logout} style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem" }}>
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
              <span className="stat-value" style={{ background: "linear-gradient(135deg, var(--success), #6ee7b7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {completedCount}
              </span>
              <span className="stat-label">Done</span>
            </div>
            <div className="stat-item">
              <span className="stat-value" style={{ background: "linear-gradient(135deg, var(--warning), #fcd34d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
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

          {/* Progress bar */}
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

        {/* Add Task Section */}
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
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                }}
              >
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
            // Loading skeleton
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
              {/* Pending tasks */}
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

              {/* Completed tasks */}
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
          Secured with biometric authentication ·{" "}
          <Fingerprint
            size={12}
            style={{ display: "inline", verticalAlign: "middle" }}
          />{" "}
          TaskFlow
        </footer>
      </div>
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

      <button className="btn-danger" onClick={onDelete} aria-label="Delete task">
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
  // Format as "26 Jan 2025"
  const date = new Date(timestamp);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

// ─── Main Page ─────────────────────────────────────────────
export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <div className="bg-mesh" />
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <TaskDashboard />;
}
