"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useMediaQuery } from "usehooks-ts";
import { Check, Clock, Flame, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type TaskItemProps = {
  task: {
    _id: Id<"tasks">;
    text: string;
    isCompleted: boolean;
    createdAt: number;
    isHighPriority?: boolean;
  };
  onToggle: () => void | Promise<unknown>;
  onDelete: () => void | Promise<unknown>;
  onEdit: (text: string) => void | Promise<unknown>;
  onTogglePriority: () => void | Promise<unknown>;
};

export function TaskItem({
  task,
  onToggle,
  onDelete,
  onEdit,
  onTogglePriority,
}: TaskItemProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(task.text);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleEdit = () => {
    setDraftText(task.text);
    setIsEditing((prev) => !prev);
    setIsMobileMenuOpen(false);
  };

  const togglePriority = () => {
    void onTogglePriority();
    setIsMobileMenuOpen(false);
  };

  const openDelete = () => {
    setIsDeleteDialogOpen(true);
    setIsMobileMenuOpen(false);
  };

  const timeAgo = getTimeAgo(task.createdAt);
  const dateColor = getTaskDateColor(task.createdAt);
  const highPriority = Boolean(task.isHighPriority);

  const handleSaveEdit = async () => {
    if (!draftText.trim()) return;
    await onEdit(draftText);
    setIsEditing(false);
  };

  return (
    <motion.div
      className={`task-card task-item ${task.isCompleted ? "completed" : ""}`}
      animate={
        highPriority
          ? {
              borderColor: [
                "rgba(196, 181, 253, 0.45)",
                "rgba(196, 181, 253, 1)",
                "rgba(196, 181, 253, 0.45)",
              ],
              boxShadow: [
                "0 0 0 rgba(167, 139, 250, 0)",
                "0 0 18px rgba(167, 139, 250, 0.35)",
                "0 0 0 rgba(167, 139, 250, 0)",
              ],
            }
          : {
              borderColor: "var(--glass-border)",
              boxShadow: "none",
            }
      }
      transition={
        highPriority
          ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.2 }
      }
    >
      <button
        className={`checkbox-custom ${task.isCompleted ? "checked" : ""}`}
        onClick={() => void onToggle()}
        aria-label={task.isCompleted ? "Mark incomplete" : "Mark complete"}
      >
        {task.isCompleted && <Check size={14} color="white" strokeWidth={3} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        {isEditing ? (
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              className="input-field"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handleSaveEdit();
                }
              }}
              style={{ padding: "0.45rem 0.65rem", fontSize: "0.875rem" }}
              autoFocus
            />
            <button
              type="button"
              className="btn-primary"
              onClick={() => void handleSaveEdit()}
              style={{ padding: "0.45rem 0.7rem", fontSize: "0.75rem" }}
            >
              Save
            </button>
          </div>
        ) : (
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
        )}
        <p
          style={{
            fontSize: "0.6875rem",
            color: "var(--text-muted)",
            fontWeight: 700,
            margin: "0.125rem 0 0",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <Clock size={10} />
          {timeAgo} · <span style={{ color: dateColor }}>{formatDate(task.createdAt)}</span>
        </p>
      </div>

      {isDesktop ? (
        <>
          <button
            type="button"
            className="btn-ghost"
            onClick={togglePriority}
            aria-label={highPriority ? "Remove high priority" : "Mark high priority"}
            style={{
              padding: "0.4rem",
              minWidth: "unset",
              color: highPriority ? "#c4b5fd" : "var(--text-muted)",
              borderColor: highPriority
                ? "rgba(196, 181, 253, 0.6)"
                : "var(--border)",
            }}
          >
            <Flame size={15} />
          </button>

          <button
            type="button"
            className="btn-ghost"
            onClick={toggleEdit}
            aria-label={isEditing ? "Cancel edit" : "Edit task"}
            style={{ padding: "0.4rem", minWidth: "unset" }}
          >
            <Pencil size={15} />
          </button>

          <button
            type="button"
            className="btn-danger"
            aria-label="Delete task"
            onClick={openDelete}
          >
            <Trash2 size={16} />
          </button>
        </>
      ) : (
        <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <DropdownMenuTrigger
            className="btn-ghost"
            aria-label="Task options"
            style={{
              padding: "0.35rem",
              minWidth: "unset",
              width: "32px",
              height: "32px",
              background: "#18181b",
              borderColor: "#3f3f46",
              color: "#f4f4f5",
            }}
          >
            <MoreHorizontal size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-48 min-w-48 border-zinc-700 bg-zinc-900 p-2 text-zinc-100 shadow-lg ring-0"
          >
            <DropdownMenuItem
              className="gap-2 px-3 py-2.5"
              onClick={(event) => {
                event.preventDefault();
                togglePriority();
              }}
            >
              <Flame size={14} />
              {highPriority ? "Remove Priority" : "Mark Priority"}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-zinc-700/80" />
            <DropdownMenuItem
              className="gap-2 px-3 py-2.5"
              onClick={(event) => {
                event.preventDefault();
                toggleEdit();
              }}
            >
              <Pencil size={14} />
              {isEditing ? "Cancel Edit" : "Edit"}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-zinc-700/80" />
            <DropdownMenuItem
              className="gap-2 px-3 py-2.5"
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                openDelete();
              }}
            >
              <Trash2 size={14} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>&ldquo;{task.text}&rdquo;</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose variant="outline" size="sm">
              Cancel
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                void onDelete();
                setIsDeleteDialogOpen(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

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

function getTaskDateColor(timestamp: number): string {
  if (!Number.isFinite(timestamp)) {
    return "var(--text-secondary)";
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const ageMs = Date.now() - timestamp;

  if (ageMs >= 30 * dayMs) return "#f87171";
  if (ageMs >= 15 * dayMs) return "#facc15";
  return "var(--text-secondary)";
}
