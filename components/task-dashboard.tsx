"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { signOut, useSession } from "next-auth/react";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
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
  Folder,
  FolderPlus,
  ListTodo,
  LogOut,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutationWithToast } from "@/lib/use-mutation-toast";
import { toast } from "sonner";
import { ProfilePhoto } from "@/components/profile-photo";
import { TaskItem } from "@/components/task-item";
import { SortableTaskItem } from "@/components/SortableTaskItem";
import { TaskGroupSection } from "@/components/TaskGroupSection";
import { UpdatePhotoModal } from "@/components/update-photo-modal";
import YearProgress from "@/components/YearProgress";

const TYPEWRITER_TEXT = "Get things done";

const GROUP_COLORS = [
  "#8b5cf6", // violet
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

export function TaskDashboard() {
  const { data: session } = useSession();
  const userId = session!.user.id as Id<"users">;

  const tasks = useQuery(api.tasks.get, { userId });
  const groups = useQuery(api.taskGroups.get, { userId });

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
  const deleteTaskSequential = useMutation(api.tasks.remove);
  const reorderTasks = useMutationWithToast(api.tasks.reorder, {});
  const moveToGroup = useMutationWithToast(api.tasks.moveToGroup, {
    loading: "Adding...",
  });

  const createGroup = useMutationWithToast(api.taskGroups.create, {
    loading: "Creating group…",
    success: "Group created",
  });
  const renameGroup = useMutationWithToast(api.taskGroups.rename, {});
  const deleteGroup = useMutationWithToast(api.taskGroups.remove, {
    loading: "Deleting group…",
    success: "Group deleted",
  });
  const toggleCollapseGroup = useMutationWithToast(api.taskGroups.toggleCollapse, {});

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskHighPriority, setNewTaskHighPriority] = useState(false);
  const [newTaskGroupId, setNewTaskGroupId] = useState<Id<"taskGroups"> | undefined>(undefined);
  const [isAdding, setIsAdding] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showHighPriorityOnly, setShowHighPriorityOnly] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [isDeleteDialogLocked, setIsDeleteDialogLocked] = useState(false);
  const [isDeletingCompletedBatch, setIsDeletingCompletedBatch] = useState(false);
  const [deleteBatchCompleted, setDeleteBatchCompleted] = useState(0);
  const [deleteBatchTotal, setDeleteBatchTotal] = useState(0);
  const [typedHeading, setTypedHeading] = useState("");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState(GROUP_COLORS[0]);

  type DashboardTask = {
    _id: Id<"tasks">;
    text: string;
    isCompleted: boolean;
    createdAt: number;
    isHighPriority?: boolean;
    groupId?: Id<"taskGroups">;
    isOptimistic?: boolean;
  };
  const [optimisticPendingTasks, setOptimisticPendingTasks] = useState<DashboardTask[] | null>(null);
  const [optimisticCreatedTasks, setOptimisticCreatedTasks] = useState<DashboardTask[]>([]);
  const [optimisticCompletionById, setOptimisticCompletionById] = useState<Record<string, boolean>>({});
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
    if (!newTaskText.trim() || isSubmittingTask) return;
    const tempId = `optimistic-${Date.now()}-${Math.random()}` as Id<"tasks">;
    const tempTask: DashboardTask = {
      _id: tempId,
      text: newTaskText.trim(),
      isCompleted: false,
      createdAt: Date.now(),
      isHighPriority: newTaskHighPriority,
      groupId: newTaskGroupId,
      isOptimistic: true,
    };

    setOptimisticCreatedTasks((prev) => [tempTask, ...prev]);
    setIsSubmittingTask(true);
    try {
      await createTask({
        userId,
        text: newTaskText.trim(),
        isHighPriority: newTaskHighPriority,
        groupId: newTaskGroupId,
      });
      setNewTaskText("");
      setNewTaskHighPriority(false);
      setNewTaskGroupId(undefined);
      setIsAdding(false);
      setOptimisticCreatedTasks((prev) => prev.filter((task) => task._id !== tempId));
    } catch (error) {
      setOptimisticCreatedTasks((prev) => prev.filter((task) => task._id !== tempId));
      throw error;
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleAddGroup = async () => {
    if (!newGroupName.trim() || isCreatingGroup) return;
    setIsCreatingGroup(true);
    try {
      await createGroup({
        userId,
        name: newGroupName.trim(),
        color: newGroupColor,
      });
      setNewGroupName("");
      setNewGroupColor(GROUP_COLORS[0]);
      setIsAddingGroup(false);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleEditTask = async (taskId: Id<"tasks">, text: string) => {
    if (!text.trim()) return;
    await updateTask({ taskId, text: text.trim() });
  };

  const tasksWithOptimisticCompletion = useMemo(() => {
    return (tasks ?? []).map((task) => {
      const optimisticCompleted = optimisticCompletionById[task._id];
      if (typeof optimisticCompleted !== "boolean") return task as DashboardTask;
      return { ...task, isCompleted: optimisticCompleted } as DashboardTask;
    });
  }, [tasks, optimisticCompletionById]);

  const allTasks = useMemo(
    () => [...optimisticCreatedTasks, ...tasksWithOptimisticCompletion],
    [optimisticCreatedTasks, tasksWithOptimisticCompletion]
  );

  const completedCount = allTasks.filter((task) => task.isCompleted).length;
  const totalCount = allTasks.length;
  const progressPercent =
    totalCount === 0
      ? tasks === undefined
        ? 0
        : 100
      : Math.min(Math.round((completedCount / totalCount) * 100), 100);
  const progressBarWidth =
    totalCount === 0
      ? tasks === undefined
        ? 0
        : 100
      : Math.min((completedCount / totalCount) * 100, 100);
  const pendingCount = totalCount - completedCount;
  const highPriorityCount =
    allTasks.filter((task) => Boolean((task as { isHighPriority?: boolean }).isHighPriority)).length;
  const filteredTasks = allTasks.filter((task) => {
    const matchesSearch = task.text
      .toLowerCase()
      .includes(searchText.trim().toLowerCase());
    const highPriority = Boolean((task as { isHighPriority?: boolean }).isHighPriority);
    const matchesPriority = showHighPriorityOnly ? highPriority : true;
    return matchesSearch && matchesPriority;
  });
  const pendingTasks = filteredTasks.filter((task) => !task.isCompleted) as DashboardTask[];
  const completedTasks = filteredTasks.filter((task) => task.isCompleted);
  const filteredCompletedCount = completedTasks.length;
  const selectedNewTaskGroup = (groups ?? []).find((group) => group._id === newTaskGroupId);

  const handleToggleTask = useCallback(
    async (taskId: Id<"tasks">) => {
      if ((taskId as string).startsWith("optimistic-")) return;

      const sourceTasks = [...optimisticCreatedTasks, ...(tasks ?? [])] as DashboardTask[];
      const task = sourceTasks.find((item) => item._id === taskId);
      if (!task) {
        await toggleTask({ taskId });
        return;
      }

      const currentValue =
        typeof optimisticCompletionById[taskId] === "boolean"
          ? optimisticCompletionById[taskId]
          : task.isCompleted;
      const nextValue = !currentValue;

      setOptimisticCompletionById((prev) => ({ ...prev, [taskId]: nextValue }));

      try {
        await toggleTask({ taskId });
      } catch (error) {
        setOptimisticCompletionById((prev) => ({ ...prev, [taskId]: currentValue }));
        throw error;
      }
    },
    [optimisticCompletionById, optimisticCreatedTasks, tasks, toggleTask]
  );

  const handleMoveTaskToGroup = useCallback(
    async (
      taskId: Id<"tasks">,
      groupId: Id<"taskGroups"> | undefined,
      options?: { optimistic?: boolean }
    ) => {
      const shouldOptimisticallyMove = options?.optimistic ?? true;
      const source = (optimisticPendingTasks ?? pendingTasks) as DashboardTask[];
      const taskToMove = source.find((task) => task._id === taskId);
      if (shouldOptimisticallyMove && taskToMove) {
        setOptimisticPendingTasks(
          source.map((task) =>
            task._id === taskId
              ? { ...task, groupId }
              : task
          )
        );
      }

      try {
        await moveToGroup({ taskId, groupId });
      } catch (error) {
        if (shouldOptimisticallyMove && taskToMove) {
          setOptimisticPendingTasks((prev) => {
            const current = (prev ?? source) as DashboardTask[];
            return current.map((task) =>
              task._id === taskId
                ? { ...task, groupId: taskToMove.groupId }
                : task
            );
          });
        }
        throw error;
      }
    },
    [moveToGroup, optimisticPendingTasks, pendingTasks]
  );

  const handleDeleteCompletedSequentially = useCallback(async () => {
    const taskIds = completedTasks.map((task) => task._id);
    const total = taskIds.length;
    if (total === 0 || isDeletingCompletedBatch) return;

    setIsDeleteDialogLocked(true);
    setIsDeletingCompletedBatch(true);
    setDeleteBatchTotal(total);
    setDeleteBatchCompleted(0);

    // Allow the loading/progress UI to paint before very fast delete loops.
    await new Promise((resolve) => setTimeout(resolve, 0));

    try {
      for (let i = 0; i < taskIds.length; i++) {
        await deleteTaskSequential({ taskId: taskIds[i] });
        setDeleteBatchCompleted(i + 1);
      }
      // Keep the bar at 100% for a moment so the final state is visible.
      setDeleteBatchCompleted(total);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("All completed tasks deleted");
      setShowDeleteAllDialog(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete completed tasks";
      toast.error(message);
    } finally {
      setIsDeletingCompletedBatch(false);
      setDeleteBatchTotal(0);
      setDeleteBatchCompleted(0);
      setIsDeleteDialogLocked(false);
    }
  }, [completedTasks, deleteTaskSequential, isDeletingCompletedBatch]);

  // Group pending tasks by groupId
  const { ungroupedTasks, groupedTasks } = useMemo(() => {
    const source = (optimisticPendingTasks ?? pendingTasks) as DashboardTask[];
    const ungrouped: DashboardTask[] = [];
    const grouped: Record<string, DashboardTask[]> = {};

    for (const task of source) {
      if (task.groupId) {
        if (!grouped[task.groupId]) grouped[task.groupId] = [];
        grouped[task.groupId].push(task);
      } else {
        ungrouped.push(task);
      }
    }
    return { ungroupedTasks: ungrouped, groupedTasks: grouped };
  }, [optimisticPendingTasks, pendingTasks]);

  // Reset optimistic state when query data changes
  useEffect(() => {
    setOptimisticPendingTasks(null);
  }, [tasks]);

  useEffect(() => {
    if (!tasks) return;

    setOptimisticCreatedTasks((prev) =>
      prev.filter((optimisticTask) => {
        return !tasks.some(
          (task) =>
            task.text === optimisticTask.text &&
            task.groupId === optimisticTask.groupId &&
            task.isCompleted === false &&
            Boolean(task.isHighPriority) === Boolean(optimisticTask.isHighPriority)
        );
      })
    );

    setOptimisticCompletionById((prev) => {
      const next: Record<string, boolean> = {};
      for (const [taskId, optimisticValue] of Object.entries(prev)) {
        const current = tasks.find((task) => task._id === taskId);
        if (!current) continue;
        if (current.isCompleted !== optimisticValue) {
          next[taskId] = optimisticValue;
        }
      }
      return next;
    });
  }, [tasks]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Check if dropped on a group droppable (cross-group move)
      const overData = over.data?.current as { type?: string; groupId?: Id<"taskGroups"> } | undefined;
      if (overData?.type === "group") {
        // Find the task's current groupId
        const task = pendingTasks.find((t) => t._id === activeId);
        if (task) {
          const targetGroupId = overData.groupId;
          if (task.groupId !== targetGroupId) {
            void handleMoveTaskToGroup(task._id as Id<"tasks">, targetGroupId, { optimistic: true });
          }
        }
        return;
      }

      // Same-list reorder
      if (activeId === overId) return;

      // Find which list both items belong to
      const activeTask = pendingTasks.find((t) => t._id === activeId);
      const overTask = pendingTasks.find((t) => t._id === overId);
      if (!activeTask || !overTask) return;

      // If they're in different groups, move the active task to the over task's group
      if (activeTask.groupId !== overTask.groupId) {
        void handleMoveTaskToGroup(
          activeTask._id as Id<"tasks">,
          overTask.groupId,
          { optimistic: true }
        );
        return;
      }

      // Same group reorder
      const groupId = activeTask.groupId;
      const listTasks = groupId
        ? (groupedTasks[groupId] ?? [])
        : ungroupedTasks;

      const oldIndex = listTasks.findIndex((t) => t._id === activeId);
      const newIndex = listTasks.findIndex((t) => t._id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const moved = arrayMove(listTasks, oldIndex, newIndex);
      const newIds = moved.map((t) => t._id) as Id<"tasks">[];
      const source = (optimisticPendingTasks ?? pendingTasks) as DashboardTask[];
      const targetGroupKey = groupId ?? null;
      const movedIdSet = new Set(newIds);
      const movedQueue = [...moved];

      setOptimisticPendingTasks(
        source.map((task) => {
          const taskGroupKey = task.groupId ?? null;
          if (taskGroupKey === targetGroupKey && movedIdSet.has(task._id)) {
            return movedQueue.shift() ?? task;
          }
          return task;
        })
      );

      void reorderTasks({ taskIds: newIds }).catch(() => {
        setOptimisticPendingTasks(source);
      });
    },
    [pendingTasks, ungroupedTasks, groupedTasks, handleMoveTaskToGroup, reorderTasks, optimisticPendingTasks]
  );

  const deleteBatchProgress =
    deleteBatchTotal > 0 ? Math.round((deleteBatchCompleted / deleteBatchTotal) * 100) : 0;

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
            <div className="stat-item" style={{ marginLeft: "auto" }}>
              <span className="stat-value">{progressPercent}%</span>
              <span className="stat-label">Progress</span>
            </div>
          </div>

          {tasks !== undefined && (
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
                  width: `${progressBarWidth}%`,
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
            <textarea
              className="input-field"
              placeholder="What needs to be done?"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              rows={2}
              autoFocus
              style={{ resize: "none" }}
            />
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "nowrap" }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setNewTaskHighPriority((prev) => !prev)}
                style={{
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
              {(groups ?? []).length > 0 && (
                <Select
                  value={newTaskGroupId}
                  onValueChange={(value) =>
                    setNewTaskGroupId(value as Id<"taskGroups">)
                  }
                >
                  <SelectTrigger
                    className="h-auto min-w-36 max-w-44 flex-1 border-zinc-700 bg-zinc-900 text-xs text-zinc-100 focus-visible:border-violet-400/70 focus-visible:ring-1 focus-visible:ring-violet-400/60 data-popup-open:border-violet-400/70 data-popup-open:ring-1 data-popup-open:ring-violet-400/60"
                    aria-label="Select group"
                    style={{
                      marginLeft: "auto",
                      padding: "0.45rem 0.75rem",
                      fontSize: "0.75rem",
                      borderColor: newTaskGroupId ? "#a78bfa" : undefined,
                      color: newTaskGroupId ? "#c4b5fd" : undefined,
                      background: newTaskGroupId ? "rgba(167, 139, 250, 0.12)" : undefined,
                    }}
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Folder
                        size={14}
                        style={{ color: selectedNewTaskGroup?.color ?? "#a1a1aa" }}
                        className="shrink-0"
                      />
                      <span className="truncate">
                        {selectedNewTaskGroup?.name ?? "No Group"}
                      </span>
                    </span>
                  </SelectTrigger>
                  <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
                    {(groups ?? []).map((g) => (
                      <SelectItem key={g._id} value={g._id}>
                        <Folder size={14} style={{ color: g.color }} />
                        <span className="min-w-0 max-w-40 truncate" title={g.name}>{g.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                className="btn-ghost"
                onClick={() => {
                  setIsAdding(false);
                  setNewTaskText("");
                  setNewTaskHighPriority(false);
                  setNewTaskGroupId(undefined);
                }}
                style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem" }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => void handleAddTask()}
                disabled={!newTaskText.trim() || isSubmittingTask}
                style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem" }}
              >
                <Plus size={16} />
                {isSubmittingTask ? "Adding…" : "Add"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <button
                className="btn-primary animate-fade-in"
                disabled={isAdding}
                onClick={() => {
                  setNewTaskGroupId(undefined);
                  setIsAdding(true);
                }}
                style={{
                  flex: 1,
                  padding: "0.875rem",
                }}
              >
                <Plus size={20} />
                Add New Task
              </button>
              <button
                className="btn-ghost animate-fade-in"
                onClick={() => setIsAddingGroup(true)}
                style={{
                  padding: "0.875rem",
                  fontSize: "0.8125rem",
                }}
                title="New Group"
              >
                <FolderPlus size={18} />
              </button>
            </div>
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

        {/* Add Group Form */}
        {isAddingGroup && (
          <div
            className="glass animate-slide-down"
            style={{
              padding: "1rem",
              marginBottom: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <input
              className="input-field"
              placeholder="Group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleAddGroup();
              }}
              autoFocus
              style={{ fontSize: "0.875rem" }}
            />
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
              {GROUP_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewGroupColor(color)}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: color,
                    border: newGroupColor === color ? "2px solid white" : "2px solid transparent",
                    cursor: "pointer",
                    transition: "transform 0.15s",
                    transform: newGroupColor === color ? "scale(1.15)" : "scale(1)",
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                className="btn-ghost"
                onClick={() => {
                  if (isCreatingGroup) return;
                  setIsAddingGroup(false);
                  setNewGroupName("");
                }}
                disabled={isCreatingGroup}
                style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem" }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => void handleAddGroup()}
                disabled={!newGroupName.trim() || isCreatingGroup}
                style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem" }}
              >
                <Plus size={16} />
                {isCreatingGroup ? "Creating..." : "Create Group"}
              </button>
            </div>
          </div>
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
          ) : tasks.length === 0 && (groups ?? []).length === 0 ? (
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
                {/* Task Groups */}
                {(groups ?? []).map((group) => (
                  <TaskGroupSection
                    key={group._id}
                    group={group}
                    tasks={groupedTasks[group._id] ?? []}
                    onToggleTask={handleToggleTask}
                    onDeleteTask={(taskId) => deleteTask({ taskId })}
                    onEditTask={(taskId, text) => handleEditTask(taskId, text)}
                    onTogglePriority={(taskId) => togglePriorityTask({ taskId })}
                    onRemoveFromGroup={(taskId) => handleMoveTaskToGroup(taskId, undefined, { optimistic: false })}
                    onAddToGroup={(taskId, groupId) => handleMoveTaskToGroup(taskId, groupId, { optimistic: false })}
                    availableGroups={groups ?? []}
                    onToggleCollapse={() => toggleCollapseGroup({ groupId: group._id })}
                    onRename={(name) => renameGroup({ groupId: group._id, name })}
                    onDelete={() => deleteGroup({ groupId: group._id })}
                  />
                ))}

                {/* Ungrouped Tasks */}
                <SortableContext
                  items={ungroupedTasks.filter((task) => !task.isOptimistic).map((task) => task._id)}
                  strategy={verticalListSortingStrategy}
                >
                  {ungroupedTasks.map((task) => (
                    task.isOptimistic ? (
                      <TaskItem
                        key={task._id}
                        task={task}
                        onToggle={() => undefined}
                        onDelete={() => undefined}
                        onEdit={() => undefined}
                        onTogglePriority={() => undefined}
                        onAddToGroup={() => undefined}
                        availableGroups={groups ?? []}
                      />
                    ) : (
                      <SortableTaskItem
                        key={task._id}
                        task={task}
                        onToggle={() => handleToggleTask(task._id)}
                        onDelete={() => deleteTask({ taskId: task._id })}
                        onEdit={(text) => handleEditTask(task._id, text)}
                        onTogglePriority={() => togglePriorityTask({ taskId: task._id })}
                        onAddToGroup={(groupId) => handleMoveTaskToGroup(task._id, groupId, { optimistic: false })}
                        availableGroups={groups ?? []}
                      />
                    )
                  ))}
                </SortableContext>
              </DndContext>

              {(filteredCompletedCount > 0 || isDeletingCompletedBatch || showDeleteAllDialog) && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    margin: "0.75rem 0 0.5rem",
                    borderRadius: "0.875rem",
                    background: "rgba(52, 211, 153, 0.04)",
                    border: "2px solid #1c6d3aff",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: "linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(110, 231, 183, 0.15))",
                      }}
                    >
                      <CircleCheckBig
                        size={15}
                        style={{ color: "#34d399" }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        letterSpacing: "0.01em",
                      }}
                    >
                      Completed
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "22px",
                        height: "22px",
                        padding: "0 6px",
                        borderRadius: "999px",
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        background: "linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(110, 231, 183, 0.12))",
                        color: "#6ee7b7",
                        boxShadow: "0 0 8px rgba(52, 211, 153, 0.15)",
                      }}
                    >
                      {filteredCompletedCount}
                    </span>
                  </div>

                  <AlertDialog
                    open={showDeleteAllDialog}
                    onOpenChange={(open) => {
                      if (isDeleteDialogLocked && !open) return;
                      setShowDeleteAllDialog(open);
                    }}
                  >
                    <AlertDialogTrigger
                      onClick={() => setShowDeleteAllDialog(true)}
                      className="btn-ghost"
                      style={{
                        padding: "0.375rem 0.75rem",
                        fontSize: "0.75rem",
                        color: "#fca5a5",
                        borderColor: "rgba(248, 113, 113, 0.25)",
                        background: "rgba(248, 113, 113, 0.06)",
                        borderRadius: "0.625rem",
                        gap: "0.375rem",
                      }}
                    >
                      <Trash2 size={13} />
                      Delete All
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete all completed tasks?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {isDeletingCompletedBatch
                            ? "Deleting tasks one by one. Please wait..."
                            : (
                              <>
                                This will permanently remove{" "}
                                <strong>{filteredCompletedCount}</strong> completed{" "}
                                {filteredCompletedCount === 1 ? "task" : "tasks"}. This action
                                cannot be undone.
                              </>
                            )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      {isDeletingCompletedBatch && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-medium text-emerald-200">
                            <span>{deleteBatchCompleted}/{deleteBatchTotal} deleted</span>
                            <span>{deleteBatchProgress}%</span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full border border-emerald-400/30 bg-emerald-950/50">
                            <div
                              className="h-full rounded-full bg-linear-to-r from-emerald-400 via-lime-300 to-emerald-500 transition-all duration-300"
                              style={{ width: `${deleteBatchProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingCompletedBatch}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          disabled={isDeletingCompletedBatch}
                          onClick={(event) => {
                            event.preventDefault();
                            void handleDeleteCompletedSequentially();
                          }}
                        >
                          <Trash2 size={14} />
                          {isDeletingCompletedBatch ? "Deleting..." : "Delete All"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              {completedTasks.map((task) => (
                <TaskItem
                  key={task._id}
                  task={task}
                  onToggle={() => handleToggleTask(task._id)}
                  onDelete={() => deleteTask({ taskId: task._id })}
                  onEdit={(text) => handleEditTask(task._id, text)}
                  onTogglePriority={() => togglePriorityTask({ taskId: task._id })}
                  onAddToGroup={(groupId) => handleMoveTaskToGroup(task._id, groupId, { optimistic: false })}
                  availableGroups={groups ?? []}
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
