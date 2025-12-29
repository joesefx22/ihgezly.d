// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

// لو عندك enum في Prisma لدرجة المهارة، عرّف النوع هنا أو استورده
export type SkillLevel = "WEAK" | "AVERAGE" | "GOOD" | "EXCELLENT" | "LEGENDARY"

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string
    role: "PLAYER" | "OWNER" | "EMPLOYEE" | "ADMIN"
    email: string
    name?: string | null
    image?: string | null
    createdAt?: Date
    lastLogin?: Date | null
    phoneNumber?: string | null
    age?: number | null
    description?: string | null
    skillLevel?: SkillLevel
    isActive?: boolean
    isVerified?: boolean
  }

  interface Session {
    user: {
      id: string
      role: "PLAYER" | "OWNER" | "EMPLOYEE" | "ADMIN"
      email?: string | null
      name?: string | null
      image?: string | null
      createdAt?: Date
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "PLAYER" | "OWNER" | "EMPLOYEE" | "ADMIN"
    createdAt?: string | Date
  }
}
