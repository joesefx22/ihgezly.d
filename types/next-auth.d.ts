import { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

export type SkillLevel = "WEAK" | "AVERAGE" | "GOOD" | "EXCELLENT" | "LEGENDARY"

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string
    role: "PLAYER" | "OWNER" | "EMPLOYEE" | "ADMIN"
    email: string
    name?: string | null
    phoneNumber?: string | null
    age?: number | null
    description?: string | null
    skillLevel?: SkillLevel
    isActive?: boolean
    isVerified?: boolean
    lastLogin?: Date | null
  }

  interface Session {
    user: {
      id: string
      role: "PLAYER" | "OWNER" | "EMPLOYEE" | "ADMIN"
      email?: string | null
      name?: string | null
      phoneNumber?: string | null
      age?: number | null
      skillLevel?: SkillLevel
      isActive?: boolean
      isVerified?: boolean
      lastLogin?: Date | null
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "PLAYER" | "OWNER" | "EMPLOYEE" | "ADMIN"
    phoneNumber?: string | null
    skillLevel?: SkillLevel
    isActive?: boolean
    isVerified?: boolean
    lastLogin?: Date | null
  }
}