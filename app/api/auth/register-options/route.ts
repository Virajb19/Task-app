import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const rpName = "TaskFlow";
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

    // Get or create the user
    const userId = await convex.mutation(api.auth.getOrCreateUser, {
      username,
    });

    // Get existing credentials for the user
    const existingCredentials = await convex.query(
      api.auth.getCredentialsByUserId,
      { userId }
    );

    const excludeCredentials = existingCredentials.map((cred) => ({
      id: cred.credentialId,
      transports: cred.transports as AuthenticatorTransport[] | undefined,
    }));

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: username,
      userID: new TextEncoder().encode(userId),
      attestationType: "none",
      excludeCredentials,
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
        authenticatorAttachment: "platform",
      },
    });

    return NextResponse.json({ options, userId });
  } catch (error) {
    console.error("Register options error:", error);
    return NextResponse.json(
      { error: "Failed to generate registration options" },
      { status: 500 }
    );
  }
}
