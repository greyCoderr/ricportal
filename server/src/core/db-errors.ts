// A failed insert on a unique index (Prisma P2002). Checked by its code, so no
// module but the repositories needs the Prisma types.
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

// The Prisma error code ("P2002"), or null for any other error.
export function prismaErrorCode(error: unknown): string | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    /^P\d{4}$/.test(error.code)
  ) {
    return error.code;
  }
  return null;
}

// Two requests wrote the same thing at the same moment and this one lost: a
// unique index (P2002), a write conflict or deadlock (P2034), or the driver's
// own deadlock error (MySQL 1213). The transaction was rolled back, so nothing
// is half saved (AUD-005, AUD-006).
export function isWriteConflict(error: unknown): boolean {
  const code = prismaErrorCode(error);
  if (code === "P2002" || code === "P2034") {
    return true;
  }
  if (typeof error !== "object" || error === null || !("cause" in error)) {
    return false;
  }
  const cause = error.cause;
  return (
    typeof cause === "object" &&
    cause !== null &&
    "originalCode" in cause &&
    String(cause.originalCode) === "1213"
  );
}
