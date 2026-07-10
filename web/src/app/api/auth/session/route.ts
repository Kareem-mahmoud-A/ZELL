import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as admin from "firebase-admin";

// Initialize admin app if not already done
if (admin.apps.length === 0) {
  admin.initializeApp();
}

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
    }

    // Session cookie lasts 5 days
    const expiresIn = 1000 * 60 * 60 * 24 * 5;
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });

    const cookieStore = await cookies();
    cookieStore.set("session", sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return NextResponse.json({ status: "success" });
  } catch (error: unknown) {
    console.error("Session creation error:", error);
    const message = error instanceof Error ? error.message : "Failed to create session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  return NextResponse.json({ status: "success" });
}
