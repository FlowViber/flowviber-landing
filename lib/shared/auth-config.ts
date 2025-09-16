import { AuthOptions } from "next-auth"
import PostgresAdapter from "@auth/pg-adapter"
import { Pool } from "pg"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import CredentialsProvider from "next-auth/providers/credentials"
import { createTransport } from "nodemailer"
import { Resend } from "resend"
import bcrypt from "bcryptjs"

// Create a separate pool for NextAuth.js
const authPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

// Helper function to conditionally include providers
function getConfiguredProviders() {
  const providers = []

  // Only include GitHub if credentials are configured
  if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
    providers.push(GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }))
  }

  // Only include Google if credentials are configured
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }))
  }

  // Add Credentials provider for password login
  providers.push(CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null
      }

      try {
        // Query user from database
        const result = await authPool.query(
          'SELECT id, email, password_hash, name, image FROM users WHERE email = $1',
          [credentials.email]
        )

        const user = result.rows[0]
        
        if (!user || !user.password_hash) {
          return null // No user found or no password set
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash)
        
        if (!isPasswordValid) {
          return null
        }

        // Return user object (compatible with NextAuth User type)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      } catch (error) {
        console.error('Authentication error:', error)
        return null
      }
    }
  }))

  // Add Email provider with Resend
  if (process.env.RESEND_API_KEY) {
    providers.push(EmailProvider({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      async sendVerificationRequest({ identifier, url, provider }) {
        const { host } = new URL(url)
        
        const resend = new Resend(process.env.RESEND_API_KEY)
        
        try {
          const result = await resend.emails.send({
            from: provider.from,
            to: identifier,
            subject: `Confirm your email for ${host}`,
            html: `
              <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #0070f3; margin: 0;">Flow Viber</h1>
                  <p style="color: #666; margin: 5px 0 0 0;">AI-Powered Workflow Builder</p>
                </div>
                
                <h2 style="color: #333;">Confirm Your Email Address</h2>
                <p style="color: #555; line-height: 1.6;">
                  Welcome! To complete your signup and access Flow Viber, please confirm your email address by clicking the button below:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${url}" 
                     style="display: inline-block; background: #0070f3; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    ✅ Confirm Email & Sign In
                  </a>
                </div>
                
                <p style="color: #555; line-height: 1.6;">
                  Or copy and paste this confirmation link in your browser:
                </p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0;">
                  <p style="color: #666; word-break: break-all; margin: 0; font-family: monospace; font-size: 14px;">${url}</p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <div style="color: #999; font-size: 14px;">
                  <p><strong>⏰ This confirmation link will expire in 24 hours.</strong></p>
                  <p>If you didn't request this email, you can safely ignore it.</p>
                  <p style="margin-top: 20px;">
                    Questions? Contact us at <a href="mailto:support@flowviber.io" style="color: #0070f3;">support@flowviber.io</a>
                  </p>
                </div>
              </div>
            `,
          })
          
          console.log('✅ Resend email sent successfully:', result.data?.id)
          console.log('📧 Resend response:', result)
          
          if (result.error) {
            throw new Error(`Resend error: ${result.error.message || result.error}`)
          }
        } catch (error) {
          console.error('❌ Resend email sending failed:', error)
          throw error
        }
      },
    }))
  }
  
  // Fallback to SMTP if Resend is not configured
  else if (process.env.EMAIL_SERVER || (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD)) {
    providers.push(EmailProvider({
      server: process.env.EMAIL_SERVER || {
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
        secure: false,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || 'noreply@flowviber.io',
      async sendVerificationRequest({ identifier, url, provider }) {
        const { host } = new URL(url)
        const transport = createTransport(provider.server)
        
        try {
          const result = await transport.sendMail({
            to: identifier,
            from: provider.from,
            subject: `Confirm your email for ${host}`,
            html: `[SMTP FALLBACK - Please configure Resend for better delivery]`,
          })
          console.log('⚠️ SMTP fallback used:', result.messageId)
        } catch (error) {
          console.error('❌ SMTP fallback failed:', error)
          throw error
        }
      },
    }))
  }

  // Demo provider removed - using proper OAuth providers only for database sessions

  // If no OAuth providers are configured, log available options
  if (providers.filter(p => p.type === 'oauth').length === 0) {
    console.log('[Auth] OAuth providers need configuration. Demo authentication available for development.')
  }

  return providers
}

export const authOptions: AuthOptions = {
  adapter: PostgresAdapter(authPool),
  providers: getConfiguredProviders(),
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production', // Only secure in production
      }
    },
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // For email provider, check if user needs password setup
      if (account?.provider === 'email') {
        // Check if this is a new user (first email verification)
        try {
          const result = await authPool.query(
            'SELECT password_hash, email_verified FROM users WHERE email = $1',
            [user.email]
          )
          
          const existingUser = result.rows[0]
          
          // Send welcome email for new users (no previous email_verified)
          if (!existingUser?.email_verified && user.email) {
            // Import and send welcome email
            const { EmailService } = await import('@/lib/services/email-service')
            await EmailService.sendWelcomeEmail(user.email, user.name || undefined)
          }
          
          if (!existingUser?.password_hash) {
            // User doesn't have password, needs to set one up
            return '/auth/setup-password'
          }
        } catch (error) {
          console.error('Error checking password status in signIn:', error)
        }
      }
      
      // Send login notification for credentials provider (password login)
      if (account?.provider === 'credentials' && user.email) {
        try {
          const { EmailService } = await import('@/lib/services/email-service')
          // Get IP address from request headers (this is a limitation of NextAuth)
          await EmailService.sendLoginNotification(user.email, 'Unknown IP', 'Browser Login', user.name || undefined)
        } catch (error) {
          console.error('Error sending login notification:', error)
        }
      }
      
      // Allow all other sign-ins (oauth, etc.)
      return true
    },
    async redirect({ url, baseUrl }) {
      // For credentials login (password), always go to dashboard
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/dashboard`
      }
      // Allow any URL on the same domain
      if (url.startsWith(baseUrl)) {
        return url
      }
      // Default to dashboard for external URLs
      return `${baseUrl}/dashboard`
    },
    async session({ session, token }) {
      // JWT strategy uses token instead of user
      if (session.user && token) {
        // @ts-ignore - Adding id to session user
        session.user.id = token.sub // JWT subject contains user ID
      }
      return session
    },
    async jwt({ token, user }) {
      // Persist user data in JWT token
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  session: {
    strategy: "jwt", // Changed to JWT to support credentials provider
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "development-secret-key-for-testing",
}