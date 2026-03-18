import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get or create a user by username
export const getOrCreateUser = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("users", {
      username: args.username,
      createdAt: Date.now(),
    });
  },
});

// Get user by username
export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
  },
});

// Get user by ID
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Store a WebAuthn credential
export const storeCredential = mutation({
  args: {
    userId: v.id("users"),
    credentialId: v.string(),
    publicKey: v.string(),
    counter: v.number(),
    transports: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("credentials", {
      userId: args.userId,
      credentialId: args.credentialId,
      publicKey: args.publicKey,
      counter: args.counter,
      transports: args.transports,
    });
  },
});

// Get all credentials for a user
export const getCredentialsByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("credentials")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get a credential by credentialId string
export const getCredentialByCredentialId = query({
  args: { credentialId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("credentials")
      .withIndex("by_credentialId", (q) =>
        q.eq("credentialId", args.credentialId)
      )
      .unique();
  },
});

// Update credential counter after authentication
export const updateCredentialCounter = mutation({
  args: {
    credentialId: v.string(),
    newCounter: v.number(),
  },
  handler: async (ctx, args) => {
    const credential = await ctx.db
      .query("credentials")
      .withIndex("by_credentialId", (q) =>
        q.eq("credentialId", args.credentialId)
      )
      .unique();

    if (!credential) {
      throw new Error("Credential not found");
    }

    await ctx.db.patch(credential._id, { counter: args.newCounter });
  },
});
