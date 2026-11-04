import { SignJWT, jwtVerify } from "jose";

export const AUTH_COOKIE_NAME = "microstock_session";
export const AUTH_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 hari

export const DEFAULT_ACCESS_KEY = "WR-456D-UHY6-2WD7";

function getSecretKey(): Uint8Array {
  const secret =
    process.env.SESSION_SECRET ||
    "WR_SUPER_SECURE_AUTH_SESSION_SECRET_KEY_2026_MICROSTOCK_STUDIO_9X7K";
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  authenticated: boolean;
  issuedAt: number;
}

export async function createSessionToken(): Promise<string> {
  const key = getSecretKey();
  return await new SignJWT({ authenticated: true, issuedAt: Date.now() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${AUTH_MAX_AGE_SECONDS}s`)
    .sign(key);
}

export async function verifySessionToken(token?: string | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const key = getSecretKey();
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });

    if (payload.authenticated === true) {
      return {
        authenticated: true,
        issuedAt: (payload.issuedAt as number) || (payload.iat ? payload.iat * 1000 : Date.now()),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function verifyAccessKey(inputKey: string): boolean {
  if (!inputKey) return false;
  const expectedKey = (process.env.APP_PASSWORD || DEFAULT_ACCESS_KEY).trim().toUpperCase();
  const cleanInput = inputKey.trim().toUpperCase();
  return cleanInput === expectedKey;
}

