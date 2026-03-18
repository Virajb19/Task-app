import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    createdAt: v.number(),
  }).index("by_username", ["username"]),

  credentials: defineTable({
    userId: v.id("users"),
    credentialId: v.string(),
    publicKey: v.string(),
    counter: v.number(),
    transports: v.optional(v.array(v.string())),
  })
    .index("by_userId", ["userId"])
    .index("by_credentialId", ["credentialId"]),

  tasks: defineTable({
    userId: v.id("users"),
    text: v.string(),
    isCompleted: v.boolean(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),
});
