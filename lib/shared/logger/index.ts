// lib/shared/logger/index.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
  ],
})

// Loggers متخصصة
export const authLogger = logger.child({ module: 'auth' })
export const bookingLogger = logger.child({ module: 'booking' })
export const paymentLogger = logger.child({ module: 'payment' })
export const apiLogger = logger.child({ module: 'api' })
export const cronLogger = logger.child({ module: 'cron' })