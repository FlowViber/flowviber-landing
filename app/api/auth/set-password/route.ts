import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/shared/auth-config'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 })
    }

    // Validate password requirements
    const hasUppercase = /[A-Z]/.test(newPassword)
    const hasLowercase = /[a-z]/.test(newPassword)
    const hasNumber = /\d/.test(newPassword)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      return NextResponse.json({ 
        error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
      }, { status: 400 })
    }

    // Get current user from database
    const userResult = await pool.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [session.user.email]
    )

    const user = userResult.rows[0]
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If user has existing password, verify current password
    if (user.password_hash && currentPassword) {
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash)
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }
    } else if (user.password_hash && !currentPassword) {
      return NextResponse.json({ error: 'Current password is required' }, { status: 400 })
    }

    // Hash the new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password in database
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, user.id]
    )

    // Send password set confirmation email
    try {
      const { EmailService } = await import('@/lib/services/email-service')
      const userName = (session.user as any)?.name || undefined
      await EmailService.sendPasswordSetConfirmation(session.user.email, userName)
    } catch (error) {
      console.error('Error sending password set confirmation email:', error)
    }

    return NextResponse.json({ 
      success: true, 
      message: user.password_hash ? 'Password updated successfully' : 'Password set successfully' 
    })

  } catch (error) {
    console.error('Set password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}