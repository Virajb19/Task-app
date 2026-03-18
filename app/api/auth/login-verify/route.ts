import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function getRpId(req: NextRequest): string {
  const host = req.headers.get("host") || "localhost";
  return host.split(":")[0];
}

function getExpectedOrigin(req: NextRequest): string {
  const origin = req.headers.get("origin");
  if (origin) return origin;
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  try {
    const { credential, expectedChallenge, userId } = await req.json();
    const rpID = getRpId(req);
    const expectedOrigin = getExpectedOrigin(req);

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
