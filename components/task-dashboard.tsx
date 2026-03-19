"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  CircleCheckBig,
  Flame,
  ListTodo,
  LogOut,
  Plus,
  Search,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutationWithToast } from "@/lib/use-mutation-toast";
import { ProfilePhoto } from "@/components/profile-photo";
import { TaskItem } from "@/components/task-item";
import { UpdatePhotoModal } from "@/components/update-photo-modal";

const TYPEWRITER_TEXT = "Get things done";

export function TaskDashboard() {
  const { data: session } = useSession();
  const userId = session!.user.id as Id<"users">;

  const tasks = useQuery(api.tasks.get, { userId });
  const createTask = useMutationWithToast(api.tasks.create, {
    loading: "Adding task…",
  });
  const toggleTask = useMutationWithToast(api.tasks.toggleComplete, {
    loading: "Updating task…",
  });
  const deleteTask = useMutationWithToast(api.tasks.remove, {
    loading: "Deleting task…",
    success: "Task deleted",
  });
  const updateTask = useMutationWithToast(api.tasks.update, {
    loading: "Saving task…",
    success: "Task updated",
  });
  const togglePriorityTask = useMutationWithToast(api.tasks.togglePriority, {
    loading: "Updating priority…",
  });

  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskHighPriority, setNewTaskHighPriority] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showHighPriorityOnly, setShowHighPriorityOnly] = useState(false);
  const [typedHeading, setTypedHeading] = useState("");
  const [isDeletingHeading, setIsDeletingHeading] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(
      () => {
        if (!isDeletingHeading && typedHeading.length < TYPEWRITER_TEXT.length) {
          setTypedHeading(TYPEWRITER_TEXT.slice(0, typedHeading.length + 1));
          return;
        }

        if (!isDeletingHeading && typedHeading.length === TYPEWRITER_TEXT.length) {
          setIsDeletingHeading(true);
          return;
        }

        if (isDeletingHeading && typedHeading.length > 0) {
          setTypedHeading(TYPEWRITER_TEXT.slice(0, typedHeading.length - 1));
          return;
        }

        setIsDeletingHeading(false);
      },
      isDeletingHeading
        ? typedHeading.length === 0
          ? 500
          : 45
        : typedHeading.length === TYPEWRITER_TEXT.length
          ? 1200
          : 90
    );

    return () => clearTimeout(timeout);
  }, [typedHeading, isDeletingHeading]);

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;
    await createTask({
      userId,
      text: newTaskText.trim(),
      isHighPriority: newTaskHighPriority,
    });
    setNewTaskText("");
    setNewTaskHighPriority(false);
    setIsAdding(false);
  };

  const handleEditTask = async (taskId: Id<"tasks">, text: string) => {
    if (!text.trim()) return;
    await updateTask({ taskId, text: text.trim() });
  };

  const completedCount = tasks?.filter((task) => task.isCompleted).length ?? 0;
  const totalCount = tasks?.length ?? 0;
  const pendingCount = totalCount - completedCount;
  const filteredTasks = (tasks ?? []).filter((task) => {
    const matchesSearch = task.text
      .toLowerCase()
      .includes(searchText.trim().toLowerCase());
    const highPriority = Boolean((task as { isHighPriority?: boolean }).isHighPriority);
    const matchesPriority = showHighPriorityOnly ? highPriority : true;
    return matchesSearch && matchesPriority;
  });
  const filteredCompletedCount = filteredTasks.filter((task) => task.isCompleted).length;
  const filteredPendingCount = filteredTasks.length - filteredCompletedCount;

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
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                Hey, <span style={{ color: "var(--accent-light)", fontWeight: 600 }}>{session?.user?.name}</span>
              </p>
            </div>
          </div>
          <button
            className="btn-ghost"
            onClick={() => signOut()}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.8125rem",
              color: "#fca5a5",
              borderColor: "rgba(248, 113, 113, 0.45)",
              background: "rgba(248, 113, 113, 0.08)",
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </header>

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
                  background: "linear-gradient(135deg, var(--success), #6ee7b7)",
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
                  background: "linear-gradient(135deg, var(--warning), #fcd34d)",
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
                  background: "linear-gradient(90deg, var(--accent), var(--accent-light))",
                  borderRadius: "2px",
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          )}
        </div>

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
              onKeyDown={(e) => e.key === "Enter" && void handleAddTask()}
              autoFocus
            />
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setNewTaskHighPriority((prev) => !prev)}
              style={{
                alignSelf: "flex-start",
                padding: "0.45rem 0.75rem",
                fontSize: "0.75rem",
                borderColor: newTaskHighPriority ? "#a78bfa" : undefined,
                color: newTaskHighPriority ? "#c4b5fd" : undefined,
                background: newTaskHighPriority ? "rgba(167, 139, 250, 0.12)" : undefined,
              }}
            >
              <Flame size={14} />
              {newTaskHighPriority ? "High Priority" : "Mark High Priority"}
            </button>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                className="btn-ghost"
                onClick={() => {
                  setIsAdding(false);
                  setNewTaskText("");
                  setNewTaskHighPriority(false);
                }}
                style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem" }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => void handleAddTask()}
                disabled={!newTaskText.trim()}
                style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem" }}
              >
                <Plus size={16} />
                Add
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              className="btn-primary animate-fade-in"
              onClick={() => setIsAdding(true)}
              style={{
                width: "100%",
                marginBottom: "0.5rem",
                padding: "0.875rem",
              }}
            >
              <Plus size={20} />
              Add New Task
            </button>
            <motion.p
              style={{
                textAlign: "center",
                marginBottom: "1rem",
                fontWeight: 700,
                letterSpacing: "0.03em",
                fontSize: "1.1rem",
                background: "linear-gradient(90deg, #f9a8d4, #c4b5fd 45%, #93c5fd 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                minHeight: "1.5rem",
              }}
            >
              {typedHeading}
              <motion.span
                aria-hidden="true"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  display: "inline-block",
                  width: "0.5ch",
                  color: "#c4b5fd",
                  WebkitTextFillColor: "#c4b5fd",
                }}
              >
                |
              </motion.span>
            </motion.p>
          </>
        )}

        <div
          className="glass animate-fade-in"
          style={{
            marginBottom: "1rem",
            padding: "0.75rem",
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ position: "relative", flex: "1 1 220px" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              className="input-field"
              type="text"
              placeholder="Search tasks"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ paddingLeft: "2.2rem" }}
            />
          </div>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setShowHighPriorityOnly((prev) => !prev)}
            style={{
              borderColor: showHighPriorityOnly ? "#a78bfa" : undefined,
              color: showHighPriorityOnly ? "#c4b5fd" : undefined,
              background: showHighPriorityOnly ? "rgba(167, 139, 250, 0.12)" : undefined,
              padding: "0.625rem 0.875rem",
            }}
          >
            <Flame size={16} />
            High Priority
          </button>
        </div>

        <div style={{ flex: 1 }}>
          {tasks === undefined ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {[1, 2, 3].map((index) => (
                <div key={index} className="skeleton" style={{ height: "60px", width: "100%" }} />
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
          ) : filteredTasks.length === 0 ? (
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
                No matching tasks
              </h3>
              <p style={{ fontSize: "0.875rem" }}>
                Try a different search or disable the high-priority filter
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
              {filteredTasks
                .filter((task) => !task.isCompleted)
                .map((task) => (
                  <TaskItem
                    key={task._id}
                    task={task}
                    onToggle={() => toggleTask({ taskId: task._id })}
                    onDelete={() => deleteTask({ taskId: task._id })}
                    onEdit={(text) => handleEditTask(task._id, text)}
                    onTogglePriority={() => togglePriorityTask({ taskId: task._id })}
                  />
                ))}

              {filteredCompletedCount > 0 && filteredPendingCount > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.5rem 0",
                    margin: "0.25rem 0",
                  }}
                >
                  <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
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
                    Completed ({filteredCompletedCount})
                  </span>
                  <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                </div>
              )}

              {filteredTasks
                .filter((task) => task.isCompleted)
                .map((task) => (
                  <TaskItem
                    key={task._id}
                    task={task}
                    onToggle={() => toggleTask({ taskId: task._id })}
                    onDelete={() => deleteTask({ taskId: task._id })}
                    onEdit={(text) => handleEditTask(task._id, text)}
                    onTogglePriority={() => togglePriorityTask({ taskId: task._id })}
                  />
                ))}
            </div>
          )}
        </div>

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

      {showPhotoModal && (
        <UpdatePhotoModal
          userId={session!.user.id}
          onClose={() => setShowPhotoModal(false)}
        />
      )}
    </div>
  );
}
