// Minimal structured logging. Never pass secrets or full card/address data in here.
export function logError(scope: string, err: unknown, extra: Record<string, unknown> = {}) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(JSON.stringify({ level: "error", scope, message, ...extra, at: new Date().toISOString() }));
}
export function logInfo(scope: string, msg: string, extra: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ level: "info", scope, msg, ...extra, at: new Date().toISOString() }));
}
