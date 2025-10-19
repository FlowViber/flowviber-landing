import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, company, message } = body

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Format the email content
    const emailContent = `
New Contact Form Submission

Name: ${name}
Email: ${email}
${company ? `Company: ${company}` : ''}

Message:
${message}

---
Sent from FlowViber Contact Form
    `.trim()

    // Option 1: Send to webhook (if configured)
    const webhookUrl = process.env.CONTACT_FORM_WEBHOOK_URL
    if (webhookUrl) {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          company,
          message,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!webhookResponse.ok) {
        console.error('Webhook submission failed:', await webhookResponse.text())
        throw new Error('Failed to submit to webhook')
      }
    }

    // Option 2: Send email via Resend (if API key is configured)
    if (process.env.RESEND_API_KEY) {
      try {
        const result = await resend.emails.send({
          from: 'FlowViber <onboarding@resend.dev>',
          to: 'luca@flowviber.io',
          subject: `New Contact Form Submission from ${name}${company ? ` (${company})` : ''}`,
          text: emailContent,
          replyTo: email,
        })
        console.log('Email sent successfully via Resend. Response:', JSON.stringify(result))
      } catch (emailError) {
        console.error('Resend email error:', emailError)
        // Log the full error for debugging
        if (emailError instanceof Error) {
          console.error('Error details:', emailError.message)
        }
      }
    }

    // Option 3: Log to console (for development/testing)
    console.log('=== CONTACT FORM SUBMISSION ===')
    console.log(emailContent)
    console.log('==============================')

    return NextResponse.json({
      success: true,
      message: 'Contact form submitted successfully',
    })

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to submit contact form' },
      { status: 500 }
    )
  }
}
