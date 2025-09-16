import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export class EmailService {
  private static getBaseTemplate(content: string) {
    return `
      <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 20px; border-radius: 16px; border: 1px solid #334155;">
            <h1 style="color: #f8fafc; margin: 0; font-size: 32px; font-weight: 700;">Flow Viber</h1>
            <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 16px;">AI-Powered Workflow Builder</p>
          </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 32px; border-radius: 16px; border: 1px solid #334155;">
          ${content}
        </div>
        
        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #334155;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            This email was sent from Flow Viber. If you didn't request this, you can safely ignore it.
          </p>
        </div>
      </div>
    `
  }

  static async sendWelcomeEmail(email: string, name?: string) {
    const displayName = name || email.split('@')[0]
    
    const content = `
      <h2 style="color: #f8fafc; margin: 0 0 24px 0; font-size: 28px;">Welcome to Flow Viber! 🎉</h2>
      <p style="color: #e2e8f0; font-size: 18px; line-height: 1.6; margin: 0 0 24px 0;">
        Hi ${displayName},
      </p>
      <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Welcome to Flow Viber! We're excited to have you join our community of workflow builders and automation enthusiasts.
      </p>
      <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
        With Flow Viber, you can create powerful n8n workflows using natural language. Our AI will guide you through the process, making automation accessible to everyone.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" 
           style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Start Building Workflows
        </a>
      </div>
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
        Ready to automate your workflow? Sign in to your dashboard and let's get started!
      </p>
    `

    return this.sendEmail({
      to: email,
      subject: 'Welcome to Flow Viber - Let\'s Build Amazing Workflows! 🚀',
      html: this.getBaseTemplate(content)
    })
  }

  static async sendPasswordSetConfirmation(email: string, name?: string) {
    const displayName = name || email.split('@')[0]
    
    const content = `
      <h2 style="color: #f8fafc; margin: 0 0 24px 0; font-size: 28px;">Password Set Successfully! 🔐</h2>
      <p style="color: #e2e8f0; font-size: 18px; line-height: 1.6; margin: 0 0 24px 0;">
        Hi ${displayName},
      </p>
      <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Your password has been set successfully! Your Flow Viber account is now fully secured and ready to use.
      </p>
      <div style="background: #059669; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <p style="color: white; margin: 0; font-weight: 600;">
          ✅ Account Status: Fully Activated
        </p>
      </div>
      <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 24px 0;">
        You can now sign in using your email and password to start building powerful workflows with AI assistance.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin" 
           style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Sign In to Dashboard
        </a>
      </div>
    `

    return this.sendEmail({
      to: email,
      subject: 'Password Set Successfully - Your Account is Ready! 🔐',
      html: this.getBaseTemplate(content)
    })
  }

  static async sendPasswordResetConfirmation(email: string, name?: string) {
    const displayName = name || email.split('@')[0]
    
    const content = `
      <h2 style="color: #f8fafc; margin: 0 0 24px 0; font-size: 28px;">Password Reset Successful! ✅</h2>
      <p style="color: #e2e8f0; font-size: 18px; line-height: 1.6; margin: 0 0 24px 0;">
        Hi ${displayName},
      </p>
      <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Your password has been successfully reset. You can now sign in to your Flow Viber account using your new password.
      </p>
      <div style="background: #059669; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <p style="color: white; margin: 0; font-weight: 600;">
          🔒 Your account is secure with your new password
        </p>
      </div>
      <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 24px 0;">
        If you didn't request this password reset, please contact support immediately.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin" 
           style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Sign In Now
        </a>
      </div>
    `

    return this.sendEmail({
      to: email,
      subject: 'Password Reset Successful - Welcome Back! 🔐',
      html: this.getBaseTemplate(content)
    })
  }

  static async sendLoginNotification(email: string, ipAddress: string, userAgent?: string, name?: string) {
    const displayName = name || email.split('@')[0]
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
    
    const content = `
      <h2 style="color: #f8fafc; margin: 0 0 24px 0; font-size: 28px;">New Sign-In to Your Account 🔐</h2>
      <p style="color: #e2e8f0; font-size: 18px; line-height: 1.6; margin: 0 0 24px 0;">
        Hi ${displayName},
      </p>
      <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        We detected a new sign-in to your Flow Viber account. Here are the details:
      </p>
      <div style="background: #1e293b; padding: 20px; border-radius: 8px; border: 1px solid #334155; margin: 24px 0;">
        <table style="width: 100%; color: #e2e8f0;">
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 8px 0; font-weight: 600; color: #94a3b8;">Time:</td>
            <td style="padding: 8px 0;">${timestamp} UTC</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 8px 0; font-weight: 600; color: #94a3b8;">IP Address:</td>
            <td style="padding: 8px 0; font-family: monospace;">${ipAddress}</td>
          </tr>
          ${userAgent ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #94a3b8;">Device:</td>
            <td style="padding: 8px 0; font-size: 14px;">${userAgent}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 24px 0;">
        If this was you, you can safely ignore this email. If you don't recognize this activity, please secure your account immediately.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/forgot-password" 
           style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Secure My Account
        </a>
      </div>
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
        For your security, we recommend using strong, unique passwords and enabling two-factor authentication.
      </p>
    `

    return this.sendEmail({
      to: email,
      subject: 'New Sign-In to Your Flow Viber Account',
      html: this.getBaseTemplate(content)
    })
  }

  private static async sendEmail({ to, subject, html }: EmailOptions) {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.log('📧 Email would be sent (Resend not configured):', { to, subject })
        return { success: true, id: 'development-mode' }
      }

      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to,
        subject,
        html,
      })

      console.log('✅ Email sent successfully:', { to, subject, id: result.data?.id })
      return { success: true, id: result.data?.id }
    } catch (error) {
      console.error('❌ Email send failed:', error)
      return { success: false, error }
    }
  }
}