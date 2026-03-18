import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const rpID = process.env.RP_ID || "localhost";
const expectedOrigin = process.env.EXPECTED_ORIGIN || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const { credential, expectedChallenge, userId } = await req.json();

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json(
        { error: "Registration verification failed" },
        { status: 400 }
      );
    }

    const { credential: regCredential, credentialBackedUp, credentialDeviceType } =
      verification.registrationInfo;

    // Store the credential in Convex
    await convex.mutation(api.auth.storeCredential, {
      userId: userId as Id<"users">,
      credentialId: Buffer.from(regCredential.id).toString("base64url"),
      publicKey: Buffer.from(regCredential.publicKey).toString("base64"),
      counter: regCredential.counter,
      transports: credential.response.transports ?? [],
    });

    return NextResponse.json({
      verified: true,
      credentialBackedUp,
      credentialDeviceType,
    });
  } catch (error) {
    console.error("Register verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify registration" },
      { status: 500 }
    );
  }
}
