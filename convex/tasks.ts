import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all tasks for a user, ordered by creation time (newest first)
export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Create a new task
export const create = mutation({
  args: {
    userId: v.id("users"),
    text: v.string(),
    isHighPriority: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", {
      userId: args.userId,
      text: args.text,
      isCompleted: false,
      isHighPriority: args.isHighPriority ?? false,
      createdAt: Date.now(),
    });
  },
});

// Toggle task completion
export const toggleComplete = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    await ctx.db.patch(args.taskId, { isCompleted: !task.isCompleted });
  },
});

// Update task text
export const update = mutation({
  args: {
    taskId: v.id("tasks"),
    text: v.optional(v.string()),
    isHighPriority: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const patch: { text?: string; isHighPriority?: boolean } = {};
    if (typeof args.text === "string") {
      patch.text = args.text;
    }
    if (typeof args.isHighPriority === "boolean") {
      patch.isHighPriority = args.isHighPriority;
    }
    await ctx.db.patch(args.taskId, patch);
  },
});

// Toggle task priority
export const togglePriority = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    await ctx.db.patch(args.taskId, {
      isHighPriority: !task.isHighPriority,
    });
  },
});

// Delete a task
export const remove = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.taskId);
  },
});
