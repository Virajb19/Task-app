import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const rpID = process.env.RP_ID || "localhost";

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Look up the user
    const user = await convex.query(api.auth.getUserByUsername, { username });

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please register first." },
        { status: 404 }
      );
    }

    // Get the user's credentials
    const credentials = await convex.query(api.auth.getCredentialsByUserId, {
      userId: user._id,
    });

    if (credentials.length === 0) {
      return NextResponse.json(
        { error: "No credentials found. Please register first." },
        { status: 404 }
      );
    }

    const allowCredentials = credentials.map((cred) => ({
      id: cred.credentialId,
      transports: cred.transports as AuthenticatorTransport[] | undefined,
    }));

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials,
      userVerification: "preferred",
    });

    return NextResponse.json({ options, userId: user._id });
  } catch (error) {
    console.error("Login options error:", error);
    return NextResponse.json(
      { error: "Failed to generate authentication options" },
      { status: 500 }
    );
  }
}
