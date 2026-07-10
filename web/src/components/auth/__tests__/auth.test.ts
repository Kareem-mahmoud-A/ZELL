import { describe, it, expect } from "vitest";
import { Role, SecurityPolicy, Permission } from "@zell/shared";

// JWT decode helper used in Next.js Edge Middleware
function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = Buffer.from(payload, "base64").toString("utf-8");
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

describe("Security Policy & Role-Based Access Control", () => {
  it("should match allowed permissions for ADMIN role", () => {
    expect(SecurityPolicy.hasPermission(Role.ADMIN, Permission.VIEW_CATALOG)).toBe(true);
    expect(SecurityPolicy.hasPermission(Role.ADMIN, Permission.MANAGE_PRODUCTS)).toBe(true);
    expect(SecurityPolicy.hasPermission(Role.ADMIN, Permission.MANAGE_USERS)).toBe(true);
  });

  it("should restrict CUSTOMER permissions", () => {
    expect(SecurityPolicy.hasPermission(Role.CUSTOMER, Permission.VIEW_CATALOG)).toBe(true);
    expect(SecurityPolicy.hasPermission(Role.CUSTOMER, Permission.CHECKOUT)).toBe(true);
    expect(SecurityPolicy.hasPermission(Role.CUSTOMER, Permission.MANAGE_PRODUCTS)).toBe(false);
    expect(SecurityPolicy.hasPermission(Role.CUSTOMER, Permission.MANAGE_USERS)).toBe(false);
  });

  it("should check authorization roles correctly", () => {
    expect(SecurityPolicy.isAuthorized(Role.ADMIN, [Role.ADMIN, Role.MERCHANT])).toBe(true);
    expect(SecurityPolicy.isAuthorized(Role.CUSTOMER, [Role.ADMIN])).toBe(false);
  });
});

describe("Edge JWT Session Decoding", () => {
  it("should decode standard Base64 JWT payload claims", () => {
    const mockHeader = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
    const mockPayloadObj = { uid: "user_123", email: "jane@example.com", role: "ADMIN" };
    const mockPayload = Buffer.from(JSON.stringify(mockPayloadObj)).toString("base64");
    const mockSignature = "signature";
    const mockJwt = `${mockHeader}.${mockPayload}.${mockSignature}`;

    const decoded = decodeJwt(mockJwt);
    expect(decoded).not.toBeNull();
    expect(decoded?.uid).toBe("user_123");
    expect(decoded?.role).toBe("ADMIN");
  });

  it("should return null on invalid JWT format", () => {
    expect(decodeJwt("invalid-token")).toBeNull();
  });
});
