import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const rpID = process.env.RP_ID || "localhost";
const expectedOrigin = process.env.EXPECTED_ORIGIN || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const { credential, expectedChallenge, userId } = await req.json();

    // Find the credential in our database
    const credentialId = credential.id;
    const storedCredential = await convex.query(
      api.auth.getCredentialByCredentialId,
      { credentialId }
    );

    if (!storedCredential) {
      return NextResponse.json(
        { error: "Credential not found" },
        { status: 404 }
      );
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      credential: {
        id: storedCredential.credentialId,
        publicKey: new Uint8Array(
          Buffer.from(storedCredential.publicKey, "base64")
        ),
        counter: storedCredential.counter,
        transports: storedCredential.transports as
          | AuthenticatorTransport[]
          | undefined,
      },
    });

    if (!verification.verified) {
      return NextResponse.json(
        { error: "Authentication verification failed" },
        { status: 400 }
      );
    }

    // Update the credential counter
    await convex.mutation(api.auth.updateCredentialCounter, {
      credentialId: storedCredential.credentialId,
      newCounter: verification.authenticationInfo.newCounter,
    });

    return NextResponse.json({
      verified: true,
      userId,
    });
  } catch (error) {
    console.error("Login verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify authentication" },
      { status: 500 }
    );
  }
}
