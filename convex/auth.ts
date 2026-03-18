import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Register a new user
export const registerUser = mutation({
  args: {
    username: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (existing) {
      throw new Error("Email already registered");
    }
    return await ctx.db.insert("users", {
      username: args.username,
      email: args.email,
      password: args.password,
      createdAt: Date.now(),
    });
  },
});

// Get user by email (for auth)
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

// Get user by ID (safe — no password returned)
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePhotoId: user.profilePhotoId,
      createdAt: user.createdAt,
    };
  },
});

// Update user's profile photo
export const updateProfilePhoto = mutation({
  args: {
    userId: v.id("users"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { profilePhotoId: args.storageId });
  },
});

// Generate an upload URL for Convex storage
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get the public URL for a stored file
export const getProfilePhotoUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
