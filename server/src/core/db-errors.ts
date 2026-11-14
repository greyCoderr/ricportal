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
