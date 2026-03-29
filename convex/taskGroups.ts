import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all task groups for a user, ordered by `order`
export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const groups = await ctx.db
      .query("taskGroups")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return groups.sort((a, b) => a.order - b.order);
  },
});

// Create a new task group
export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("taskGroups")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    const maxOrder = existing.reduce((max, g) => Math.max(max, g.order), 0);
    return await ctx.db.insert("taskGroups", {
      userId: args.userId,
      name: args.name,
      color: args.color,
      order: maxOrder + 1,
    });
  },
});

// Rename a group
export const rename = mutation({
  args: {
    groupId: v.id("taskGroups"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.groupId, { name: args.name });
  },
});

// Delete a group – unsets groupId on all tasks in it
export const remove = mutation({
  args: { groupId: v.id("taskGroups") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");
    // Unset groupId on all tasks in the group
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_userId", (q) => q.eq("userId", group.userId))
      .collect();
    for (const task of tasks) {
      if (task.groupId === args.groupId) {
        await ctx.db.patch(task._id, { groupId: undefined });
      }
    }
    await ctx.db.delete(args.groupId);
  },
});

// Reorder groups
export const reorder = mutation({
  args: {
    groupIds: v.array(v.id("taskGroups")),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.groupIds.length; i++) {
      await ctx.db.patch(args.groupIds[i], { order: i + 1 });
    }
  },
});

// Toggle collapse
export const toggleCollapse = mutation({
  args: { groupId: v.id("taskGroups") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");
    await ctx.db.patch(args.groupId, {
      isCollapsed: !group.isCollapsed,
    });
  },
});

// Update color
export const updateColor = mutation({
  args: {
    groupId: v.id("taskGroups"),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.groupId, { color: args.color });
  },
});
