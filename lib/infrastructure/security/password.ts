// lib/infrastructure/security/password.ts
import bcrypt from 'bcryptjs'

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

export async function comparePassword(
  rawPassword: string, 
  hashedPassword: string
): Promise<boolean> {
  if (!hashedPassword) return false
  return bcrypt.compare(rawPassword, hashedPassword)
}