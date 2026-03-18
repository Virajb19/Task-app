import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const { username, email, password, profilePhotoId } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Create user in Convex
    const userId = await convex.mutation(api.auth.registerUser, {
      username,
      email,
      password,
    });

    // If a profile photo was uploaded, associate it with the user
    if (profilePhotoId) {
      await convex.mutation(api.auth.updateProfilePhoto, {
        userId,
        storageId: profilePhotoId,
      });
    }

    return NextResponse.json({
      success: true,
      userId,
      message: "Account created successfully",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Registration failed";
    console.error("Register error:", message);

    if (message.includes("already registered")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
