// lib/auth/logger.ts

// ✅ Simple Edge‑compatible logger (no Node APIs)
const log = (level: string, message: any, meta: any = {}) => {
  const entry = {
    level,
    message,
    ...meta,
    timestamp: new Date().toISOString(),
  }

  // ✅ Console works in Edge, Node, Server Actions, Middleware
  if (level === "error") {
    console.error(entry)
  } else if (level === "warn") {
    console.warn(entry)
  } else {
    console.log(entry)
  }
}

export const logger = {
  info: (msg: any, meta?: any) => log("info", msg, meta),
  debug: (msg: any, meta?: any) => log("debug", msg, meta),
  warn: (msg: any, meta?: any) => log("warn", msg, meta),
  error: (msg: any, meta?: any) => log("error", msg, meta),
}

// ✅ Audit logger (still works perfectly)
export const auditLog = (
  userId: string | null,
  action: string,
  entityType?: string,
  entityId?: string,
  oldValue?: any,
  newValue?: any,
  ipAddress?: string,
  userAgent?: string
) => {
  logger.info("AUDIT", {
    userId,
    action,
    entityType,
    entityId,
    oldValue,
    newValue,
    ipAddress,
    userAgent,
  })
}

export default logger