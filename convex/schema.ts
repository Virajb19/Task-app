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

  tasks: defineTable({
    userId: v.id("users"),
    text: v.string(),
    isCompleted: v.boolean(),
    isHighPriority: v.optional(v.boolean()),
    createdAt: v.number(),
    order: v.optional(v.number()),
  }).index("by_userId", ["userId"]),
});
