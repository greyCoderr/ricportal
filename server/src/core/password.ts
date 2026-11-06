import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";

export function hashPassword(password: string, cost: number): Promise<string> {
  return bcrypt.hash(password, cost);
}

export function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Letters and digits people can read out loud: no 0, O, 1, l or I.
const LETTERS = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const ALL = LETTERS + DIGITS;

function pick(chars: string): string {
  return chars.charAt(randomInt(chars.length));
}

// Shown once by the approver (BR-05). Always passes the password policy.
export function generateTemporaryPassword(length = 12): string {
  const rest = Array.from({ length: length - 2 }, () => pick(ALL)).join("");
  return `${pick(LETTERS)}${pick(DIGITS)}${rest}`;
}
