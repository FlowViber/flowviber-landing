import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/shared/auth-config'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user has a password set
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE email = $1',
      [session.user.email]
    )

    const user = result.rows[0]
    const hasPassword = !!(user && user.password_hash)

    return NextResponse.json({ hasPassword })

  } catch (error) {
    console.error('Check password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}