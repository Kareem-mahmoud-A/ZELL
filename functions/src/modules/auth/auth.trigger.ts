import * as functionsV1 from "firebase-functions/v1";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { db } from "../../config/firebase";
import { Role } from "@zell/shared";

export const onUserCreated = functionsV1.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;

  try {
    // 1. Determine if this is the first user in the database (they become ADMIN)
    const usersSnapshot = await db.collection("users").limit(1).get();
    const isFirstUser = usersSnapshot.empty;
    const assignedRole = isFirstUser ? Role.ADMIN : Role.CUSTOMER;

    // 2. Set Custom User Claims
    await admin.auth().setCustomUserClaims(uid, { role: assignedRole });

    // 3. Create profile document in Firestore
    const names = (displayName || "").split(" ");
    const firstName = names[0] || "";
    const lastName = names.slice(1).join(" ") || "";

    await db
      .collection("users")
      .doc(uid)
      .set({
        id: uid,
        email: email || "",
        role: assignedRole,
        firstName,
        lastName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    console.log(
      `Successfully initialized profile and custom claims for user ${uid} with role ${assignedRole}`
    );
  } catch (error) {
    console.error(`Error in onUserCreated auth trigger for user ${uid}:`, error);
  }
});

export const onUserDeleted = functionsV1.auth.user().onDelete(async (user) => {
  const { uid } = user;
  try {
    await db.collection("users").doc(uid).delete();
    console.log(`Successfully deleted profile document for user ${uid}`);
  } catch (error) {
    console.error(`Error in onUserDeleted auth trigger for user ${uid}:`, error);
  }
});

// Admin action to change roles using v2 Https onCall trigger
export const setUserRole = onCall(async (request) => {
  // Ensure the caller is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  // Ensure the caller is an ADMIN
  const callerRole = request.auth.token.role;
  if (callerRole !== Role.ADMIN) {
    throw new HttpsError("permission-denied", "Only administrators can change user roles");
  }

  const { targetUid, role } = request.data;
  if (!targetUid || !role || !Object.values(Role).includes(role)) {
    throw new HttpsError("invalid-argument", "Missing or invalid arguments");
  }

  try {
    // Set custom claim
    await admin.auth().setCustomUserClaims(targetUid, { role });

    // Update profile document
    await db.collection("users").doc(targetUid).update({
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { status: "success", message: `Updated user ${targetUid} role to ${role}` };
  } catch (error: unknown) {
    console.error(`Error setting user role for target ${targetUid}:`, error);
    const message = error instanceof Error ? error.message : "Failed to update role";
    throw new HttpsError("internal", message);
  }
});
