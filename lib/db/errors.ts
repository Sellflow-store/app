/**
 * Unique-constraint violation → the constraint's name, or null for any other
 * error. drizzle 0.44+ wraps driver errors in DrizzleQueryError ("Failed
 * query: …") and keeps the Postgres error in `cause`, so matching on
 * `e.message` alone never sees "duplicate key". This walks the cause chain and
 * relies on SQLSTATE 23505, with the message as a fallback.
 */
export function uniqueViolation(e: unknown): string | null {
  for (let cur: unknown = e, depth = 0; cur && depth < 5; depth++) {
    const err = cur as { code?: unknown; constraint?: unknown; message?: unknown; cause?: unknown };
    const message = typeof err.message === "string" ? err.message : "";
    if (err.code === "23505" || /duplicate key value violates unique constraint/i.test(message)) {
      if (typeof err.constraint === "string") return err.constraint;
      return /unique constraint "([^"]+)"/i.exec(message)?.[1] ?? "unknown";
    }
    cur = err.cause;
  }
  return null;
}
