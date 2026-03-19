import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await convex.query(api.auth.getUserByEmail, {
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      password: user.password,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unable to process request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
