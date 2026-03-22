"use client";

import { useEffect, useState, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  CircleCheckBig,
  Flame,
  ListTodo,
  LogOut,
  Plus,
  Search,
  X,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutationWithToast } from "@/lib/use-mutation-toast";
import { ProfilePhoto } from "@/components/profile-photo";
import { TaskItem } from "@/components/task-item";
import { SortableTaskItem } from "@/components/SortableTaskItem";
import { UpdatePhotoModal } from "@/components/update-photo-modal";
import YearProgress from "@/components/YearProgress";

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
  const reorderTasks = useMutationWithToast(api.tasks.reorder, {});
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskHighPriority, setNewTaskHighPriority] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showHighPriorityOnly, setShowHighPriorityOnly] = useState(false);
  const [typedHeading, setTypedHeading] = useState("");
  type DashboardTask = {
    _id: Id<"tasks">;
    text: string;
    isCompleted: boolean;
    createdAt: number;
    isHighPriority?: boolean;
  };
  const [optimisticPendingTasks, setOptimisticPendingTasks] = useState<DashboardTask[] | null>(null);
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
  const highPriorityCount =
    tasks?.filter((task) => Boolean((task as { isHighPriority?: boolean }).isHighPriority))
      .length ?? 0;
  const filteredTasks = (tasks ?? []).filter((task) => {
    const matchesSearch = task.text
      .toLowerCase()
      .includes(searchText.trim().toLowerCase());
    const highPriority = Boolean((task as { isHighPriority?: boolean }).isHighPriority);
    const matchesPriority = showHighPriorityOnly ? highPriority : true;
    return matchesSearch && matchesPriority;
  });
  const pendingTasks = filteredTasks.filter((task) => !task.isCompleted);
  const completedTasks = filteredTasks.filter((task) => task.isCompleted);
  const filteredCompletedCount = completedTasks.length;
  const filteredPendingCount = pendingTasks.length;

  // Use optimistic state for pending tasks during drag, fall back to query data
  const displayedPendingTasks = optimisticPendingTasks ?? pendingTasks;

  // Reset optimistic state when query data changes
  useEffect(() => {
    setOptimisticPendingTasks(null);
  }, [tasks]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setOptimisticPendingTasks((prev) => {
        const items = prev ?? pendingTasks;
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === over.id);

        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
          return items;
        }

        const moved = arrayMove(items, oldIndex, newIndex);
        const newIds = moved.map((t) => t._id) as Id<"tasks">[];
        void reorderTasks({ taskIds: newIds });
        return moved;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pendingTasks]
  );

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

        <YearProgress />

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
            <div className="stat-item hidden md:flex">
              <span
                className="stat-value hidden md:inline-block"
                style={{
                  background: "linear-gradient(135deg, #f97316, #facc15)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {highPriorityCount}
              </span>
              <span className="stat-label hidden md:inline-block">High</span>
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
              style={{ paddingLeft: "2.5rem", paddingRight: searchText ? "2.2rem" : undefined }}
            />
            {searchText.trim().length > 0 && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchText("")}
                style={{
                  position: "absolute",
                  right: "0.55rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  color: "#f87171",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
              >
                <X size={14} />
              </button>
            )}
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
          <span
            className="inline-flex self-center h-8 min-w-8 items-center justify-center rounded-full border-2 border-violet-300/60 bg-violet-500/30 px-2.5 text-xs font-semibold text-violet-100 md:hidden"
          >
            {highPriorityCount}
          </span>
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
              {Array.from({ length: 10 }, (_, idx) => idx + 1).map((index) => (
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={displayedPendingTasks.map((task) => task._id)}
                  strategy={verticalListSortingStrategy}
                >
                  {displayedPendingTasks.map((task) => (
                    <SortableTaskItem
                      key={task._id}
                      task={task}
                      onToggle={() => toggleTask({ taskId: task._id })}
                      onDelete={() => deleteTask({ taskId: task._id })}
                      onEdit={(text) => handleEditTask(task._id, text)}
                      onTogglePriority={() => togglePriorityTask({ taskId: task._id })}
                    />
                  ))}
                </SortableContext>
              </DndContext>

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

              {completedTasks.map((task) => (
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
