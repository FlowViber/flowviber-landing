import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, description, budget } = body

    // Validate required fields
    if (!name || !email || !description || !budget) {
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
New Workflow Consultation Request

Name: ${name}
Email: ${email}
Budget Range: ${budget}

Description:
${description}

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
          description,
          budget,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!webhookResponse.ok) {
        console.error('Webhook submission failed:', await webhookResponse.text())
        throw new Error('Failed to submit to webhook')
      }
    }

    // Option 2: Log to console (for development/testing)
    console.log('=== CONTACT FORM SUBMISSION ===')
    console.log(emailContent)
    console.log('==============================')

    // TODO: When ready, integrate with email service (Resend, SendGrid, etc.)
    // Example with Resend (if configured):
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'FlowViber <contact@flowviber.com>',
    //   to: process.env.CONTACT_EMAIL || 'contact@flowviber.com',
    //   subject: `New Workflow Request from ${name}`,
    //   text: emailContent,
    // })

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
