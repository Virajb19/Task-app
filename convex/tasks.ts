import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all tasks for a user, ordered by `order` descending (newest/highest first)
export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Sort by order descending – tasks without an order fall back to createdAt
    return tasks.sort((a, b) => {
      const orderA = a.order ?? a.createdAt;
      const orderB = b.order ?? b.createdAt;
      return orderB - orderA; // highest first = newest first
    });
  },
});

// Create a new task – auto-assign order so it appears at the top
export const create = mutation({
  args: {
    userId: v.id("users"),
    text: v.string(),
    isHighPriority: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("tasks", {
      userId: args.userId,
      text: args.text,
      isCompleted: false,
      isHighPriority: args.isHighPriority ?? false,
      createdAt: now,
      order: now, // highest value = top of list
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

// Reorder tasks – update the order of all affected tasks in one mutation
export const reorder = mutation({
  args: {
    taskIds: v.array(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    // Assign order values in descending order so index 0 = highest = top
    const now = Date.now();
    for (let i = 0; i < args.taskIds.length; i++) {
      await ctx.db.patch(args.taskIds[i], {
        order: now - i,
      });
    }
  },
});
