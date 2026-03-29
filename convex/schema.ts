import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    email: v.string(),
    password: v.string(),
    profilePhotoId: v.optional(v.id("_storage")),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  taskGroups: defineTable({
    userId: v.id("users"),
    name: v.string(),
    color: v.string(),
    order: v.number(),
    isCollapsed: v.optional(v.boolean()),
  }).index("by_userId", ["userId"]),

  tasks: defineTable({
    userId: v.id("users"),
    text: v.string(),
    isCompleted: v.boolean(),
    isHighPriority: v.optional(v.boolean()),
    createdAt: v.number(),
    order: v.optional(v.number()),
    groupId: v.optional(v.id("taskGroups")),
  }).index("by_userId", ["userId"]),
});
