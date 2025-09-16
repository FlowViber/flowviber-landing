import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/shared/auth-config"
import { redirect } from "next/navigation"

// Extended user type with id for database strategy
interface AuthUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  
  // NextAuth with database strategy includes user.id
  return session.user as AuthUser
}

export async function requireAuth(): Promise<AuthUser> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/auth/signin')
  }
  return session.user as AuthUser
}

export async function getSession() {
  return await getServerSession(authOptions)
}