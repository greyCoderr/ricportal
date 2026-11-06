import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "rp_session";

export type TokenPayload = { userId: number; tokenVersion: number };

export type TokenConfig = { JWT_SECRET: string; SESSION_HOURS: number };

function key(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export function signSessionToken(
  payload: TokenPayload,
  config: TokenConfig,
  now: Date = new Date(),
): Promise<string> {
  const issuedAt = Math.floor(now.getTime() / 1000);
  return new SignJWT({ tv: payload.tokenVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.userId))
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + config.SESSION_HOURS * 3600)
    .sign(key(config.JWT_SECRET));
}

// Null for anything invalid or expired: the caller answers 401.
export async function verifySessionToken(
  token: string,
  secret: string,
  now: Date = new Date(),
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      algorithms: ["HS256"],
      currentDate: now,
    });
    const userId = Number(payload.sub);
    const tokenVersion = payload.tv;
    if (!Number.isInteger(userId) || typeof tokenVersion !== "number") {
      return null;
    }
    return { userId, tokenVersion };
  } catch {
    return null;
  }
}
