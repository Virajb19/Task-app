"use client";

import { useState } from "react";
import {
    ChevronDown,
    FolderOpen,
    MoreHorizontal,
    Pencil,
    Trash2,
} from "lucide-react";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Id } from "@/convex/_generated/dataModel";
import { SortableTaskItem } from "@/components/SortableTaskItem";
import { TaskItem } from "@/components/task-item";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type TaskGroupTask = {
    _id: Id<"tasks">;
    text: string;
    isCompleted: boolean;
    createdAt: number;
    isHighPriority?: boolean;
    isOptimistic?: boolean;
};

type TaskGroupSectionProps = {
    group: {
        _id: Id<"taskGroups">;
        name: string;
        color: string;
        isCollapsed?: boolean;
    };
    tasks: TaskGroupTask[];
    onToggleTask: (taskId: Id<"tasks">) => void;
    onDeleteTask: (taskId: Id<"tasks">) => void;
    onEditTask: (taskId: Id<"tasks">, text: string) => void;
    onTogglePriority: (taskId: Id<"tasks">) => void;
    onRemoveFromGroup: (taskId: Id<"tasks">) => void;
    onAddToGroup: (taskId: Id<"tasks">, groupId: Id<"taskGroups">) => void;
    availableGroups: Array<{
        _id: Id<"taskGroups">;
        name: string;
        color: string;
    }>;
    onToggleCollapse: () => void;
    onRename: (name: string) => void;
    onDelete: () => void;
};

export function TaskGroupSection({
    group,
    tasks,
    onToggleTask,
    onDeleteTask,
    onEditTask,
    onTogglePriority,
    onRemoveFromGroup,
    onAddToGroup,
    availableGroups,
    onToggleCollapse,
    onRename,
    onDelete,
}: TaskGroupSectionProps) {
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameText, setRenameText] = useState(group.name);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const { setNodeRef } = useDroppable({
        id: `group-${group._id}`,
        data: { type: "group", groupId: group._id },
    });

    const handleRename = () => {
        if (renameText.trim() && renameText.trim() !== group.name) {
            onRename(renameText.trim());
        }
        setIsRenaming(false);
    };

    const isCollapsed = group.isCollapsed ?? false;
    const sortableTasks = tasks.filter((task) => !task.isOptimistic);
    const optimisticTasks = tasks.filter((task) => task.isOptimistic);

    return (
        <div
            ref={setNodeRef}
            style={{
                borderRadius: "1rem",
                border: `2px solid ${group.color}30`,
                overflow: "hidden",
            }}
        >
            {/* Group Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                    padding: "0.75rem 1rem",
                    background: `${group.color}10`,
                    borderBottom: isCollapsed ? "none" : `1px solid ${group.color}20`,
                    cursor: "pointer",
                }}
                onClick={onToggleCollapse}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: `${group.color}25`,
                    }}
                >
                    <FolderOpen size={15} style={{ color: group.color }} />
                </div>

                {isRenaming ? (
                    <input
                        className="input-field"
                        value={renameText}
                        onChange={(e) => setRenameText(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename();
                            if (e.key === "Escape") {
                                setRenameText(group.name);
                                setIsRenaming(false);
                            }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        style={{
                            padding: "0.25rem 0.5rem",
                            fontSize: "0.8125rem",
                            flex: 1,
                            minWidth: 0,
                        }}
                    />
                ) : (
                    <span
                        style={{
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            color: "var(--text-secondary)",
                            flex: 1,
                            letterSpacing: "0.01em",
                        }}
                    >
                        {group.name}
                    </span>
                )}

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
                        background: `${group.color}25`,
                        color: group.color,
                    }}
                >
                    {tasks.length}
                </span>

                <ChevronDown
                    size={16}
                    className="transition-transform duration-200"
                    style={{
                        color: "var(--text-muted)",
                        transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                    }}
                />

                <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                    <DropdownMenuTrigger
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(true);
                        }}
                        className="btn-ghost"
                        style={{
                            padding: "0.3rem",
                            minWidth: "28px",
                            height: "28px",
                            borderColor: "transparent",
                        }}
                    >
                        <MoreHorizontal size={14} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        sideOffset={8}
                        className="w-40 min-w-40 border-zinc-700 bg-zinc-900 p-2 text-zinc-100 shadow-lg ring-0"
                    >
                        <DropdownMenuItem
                            className="gap-2 px-3 py-2"
                            onClick={(e) => {
                                e.preventDefault();
                                setRenameText(group.name);
                                setIsRenaming(true);
                                setMenuOpen(false);
                            }}
                        >
                            <Pencil size={13} />
                            Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1 bg-zinc-700/80" />
                        <DropdownMenuItem
                            className="gap-2 px-3 py-2"
                            variant="destructive"
                            onClick={(e) => {
                                e.preventDefault();
                                setShowDeleteDialog(true);
                                setMenuOpen(false);
                            }}
                        >
                            <Trash2 size={13} />
                            Delete Group
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Group Body */}
            {!isCollapsed && (
                <div
                    style={{
                        padding: "0.5rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                        minHeight: tasks.length === 0 ? "48px" : undefined,
                    }}
                >
                    {tasks.length === 0 ? (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "0.75rem",
                                fontSize: "0.75rem",
                                color: "var(--text-muted)",
                                fontStyle: "italic",
                            }}
                        >
                            Drop tasks here
                        </div>
                    ) : (
                        <SortableContext
                            items={sortableTasks.map((t) => t._id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {sortableTasks.map((task) => (
                                <SortableTaskItem
                                    key={task._id}
                                    task={task}
                                    onToggle={() => onToggleTask(task._id)}
                                    onDelete={() => onDeleteTask(task._id)}
                                    onEdit={(text) => onEditTask(task._id, text)}
                                    onTogglePriority={() => onTogglePriority(task._id)}
                                    onRemoveFromGroup={() => onRemoveFromGroup(task._id)}
                                    onAddToGroup={(groupId) => onAddToGroup(task._id, groupId)}
                                    availableGroups={availableGroups}
                                    isInGroup
                                />
                            ))}
                            {optimisticTasks.map((task) => (
                                <TaskItem
                                    key={task._id}
                                    task={task}
                                    onToggle={() => undefined}
                                    onDelete={() => undefined}
                                    onEdit={() => undefined}
                                    onTogglePriority={() => undefined}
                                    onRemoveFromGroup={() => undefined}
                                    onAddToGroup={() => undefined}
                                    availableGroups={availableGroups}
                                    isInGroup
                                />
                            ))}
                        </SortableContext>
                    )}
                </div>
            )}

            {/* Delete confirmation */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete &ldquo;{group.name}&rdquo;?</DialogTitle>
                        <DialogDescription>
                            This will delete the group. The {tasks.length}{" "}
                            {tasks.length === 1 ? "task" : "tasks"} in it will become ungrouped.
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
                                onDelete();
                                setShowDeleteDialog(false);
                            }}
                        >
                            <Trash2 size={14} />
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
