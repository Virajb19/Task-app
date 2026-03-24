"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { TaskItem } from "@/components/task-item";

type SortableTaskItemProps = {
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

export function SortableTaskItem({
  task,
  onToggle,
  onDelete,
  onEdit,
  onTogglePriority,
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        borderStyle: (!task.isHighPriority && isDragging) ? "dashed" : "solid",
        borderColor: isDragging ? "var(--border-muted)" : "transparent",
      }}
      className="flex items-center gap-2"
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        aria-label="Drag to reorder task"
        className="btn-ghost !hidden min-w-0 p-[0.4rem] text-(--text-muted) md:!inline-flex"
        style={{ touchAction: "none", cursor: isDragging ? "grabbing" : "grab" }}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <div className="min-w-0 flex-1">
        <TaskItem
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          onTogglePriority={onTogglePriority}
          mobileDragAttributes={attributes}
          mobileDragListeners={listeners}
          setMobileDragActivatorNodeRef={setActivatorNodeRef}
          isMobileDragging={isDragging}
        />
      </div>
    </div>
  );
}
