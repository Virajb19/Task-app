"use client";

import { useEffect, useState } from "react";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { useMediaQuery } from "usehooks-ts";
import { Check, Clock, Flame, FolderMinus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { twMerge } from "tailwind-merge";

function linkify(text: string) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-blue-300 underline underline-offset-2 break-all"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}

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
  onRemoveFromGroup?: () => void | Promise<unknown>;
  isInGroup?: boolean;
  mobileDragAttributes?: DraggableAttributes;
  mobileDragListeners?: DraggableSyntheticListeners;
  setMobileDragActivatorNodeRef?: (element: HTMLElement | null) => void;
  isMobileDragging?: boolean;
};

export function TaskItem({
  task,
  onToggle,
  onDelete,
  onEdit,
  onTogglePriority,
  onRemoveFromGroup,
  isInGroup = false,
  mobileDragAttributes,
  mobileDragListeners,
  setMobileDragActivatorNodeRef,
  isMobileDragging = false,
}: TaskItemProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(task.text);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Optimistic toggle – flip UI immediately, let mutation run in background
  const [optimisticCompleted, setOptimisticCompleted] = useState(task.isCompleted);
  useEffect(() => {
    setOptimisticCompleted(task.isCompleted);
  }, [task.isCompleted]);

  const handleToggle = () => {
    setOptimisticCompleted((prev) => !prev);
    void onToggle();
  };

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

  const highPriority = Boolean(task.isHighPriority);

  const timeAgo = getTimeAgo(task.createdAt);
  const dateColor = getTaskDateColor(task.createdAt);
  const ageToneStyle = getTaskAgeToneStyle(task.createdAt, highPriority);

  const handleSaveEdit = async () => {
    if (!draftText.trim()) return;
    await onEdit(draftText);
    setIsEditing(false);
  };

  return (
    <motion.div
      className={twMerge(
        "task-card task-item",
        optimisticCompleted && "completed",
      )}
      style={ageToneStyle}
      animate={
        highPriority
          ? {
            borderColor: [
              "rgba(196, 181, 253, 0.6)",
              "rgba(196, 181, 253, 1)",
            ],
            boxShadow: [
              "0 0 8px rgba(167, 139, 250, 0.18)",
              "0 0 26px rgba(167, 139, 250, 0.5)",
            ],
          }
          : {
            boxShadow: "none",
          }
      }
      transition={
        highPriority
          ? { duration: 1, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }
          : { duration: 0.2 }
      }
    >
      <button
        className={`checkbox-custom ${optimisticCompleted ? "checked" : ""}`}
        onClick={handleToggle}
        aria-label={optimisticCompleted ? "Mark incomplete" : "Mark complete"}
      >
        {optimisticCompleted && <Check size={14} color="white" strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              className="input-field px-[0.65rem] py-[0.45rem] text-sm"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handleSaveEdit();
                }
              }}
              autoFocus
            />
            <button
              type="button"
              className="btn-primary px-[0.7rem] py-[0.45rem] text-xs"
              onClick={() => void handleSaveEdit()}
            >
              Save
            </button>
          </div>
        ) : (
          <p className="task-text m-0 wrap-break-word whitespace-pre-wrap text-[0.9375rem] font-medium leading-[1.4]">
            {linkify(task.text)}
          </p>
        )}
        <p className="mt-0.5 flex items-center gap-1 text-[0.6875rem] font-bold text-(--text-muted)">
          <Clock size={10} />
          {timeAgo} · <span style={{ color: dateColor }}>{formatDate(task.createdAt)}</span>
        </p>
      </div>

      {isDesktop ? (
        <>
          <button
            type="button"
            onClick={togglePriority}
            aria-label={highPriority ? "Remove high priority" : "Mark high priority"}
            className={cn(
              "btn-ghost min-w-0 p-[0.4rem]",
              highPriority
                ? "border-[rgba(196,181,253,0.6)] text-[#c4b5fd]"
                : "text-(--text-muted)"
            )}
          >
            <Flame size={15} />
          </button>

          <button
            type="button"
            onClick={toggleEdit}
            aria-label={isEditing ? "Cancel edit" : "Edit task"}
            className="btn-ghost min-w-0 p-[0.4rem]"
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
            type="button"
            aria-label="Task options"
            className="btn-ghost"
            ref={setMobileDragActivatorNodeRef}
            {...mobileDragAttributes}
            {...mobileDragListeners}
            style={{
              display: "inline-flex",
              width: "32px",
              height: "32px",
              minWidth: "32px",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.35rem",
              borderColor: "#3f3f46",
              background: "#18181b",
              color: "#f4f4f5",
              opacity: 1,
              touchAction: "none",
              cursor: isMobileDragging ? "grabbing" : "grab",
            }}
          >
            <MoreHorizontal size={16} className="text-current" />
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
            {isInGroup && onRemoveFromGroup && (
              <>
                <DropdownMenuSeparator className="my-1 bg-zinc-700/80" />
                <DropdownMenuItem
                  className="gap-2 px-3 py-2.5"
                  onClick={(event) => {
                    event.preventDefault();
                    void onRemoveFromGroup();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <FolderMinus size={14} />
                  Remove from Group
                </DropdownMenuItem>
              </>
            )}
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

  if (ageMs >= 7 * dayMs) return "#f87171";
  if (ageMs >= 3 * dayMs) return "#facc15";
  return "var(--text-secondary)";
}

function getTaskAgeToneStyle(timestamp: number, highPriority: boolean): React.CSSProperties | undefined {
  if (!Number.isFinite(timestamp)) {
    return undefined;
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const ageMs = Date.now() - timestamp;

  if (highPriority) {
    return {
      backgroundColor: "rgba(60, 46, 116, 0.5)",
      borderWidth: '3px',
      borderStyle: 'dashed',
    };
  }

  if (ageMs >= 7 * dayMs) {
    return { backgroundColor: "rgba(239, 68, 68, 0.15)", borderWidth: '2px', borderStyle: 'solid', borderColor: 'rgb(220, 38, 38)' };
  }

  if (ageMs >= 3 * dayMs) {
    return { backgroundColor: "rgba(250, 204, 21, 0.15)", borderWidth: '2px', borderStyle: 'solid', borderColor: 'rgb(245, 158, 11)' };
  }

  return { borderColor: "var(--glass-border)", borderWidth: '2px', borderStyle: 'solid' };
}
