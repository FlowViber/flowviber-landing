import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

    // Option 2: Send email via Resend (if API key is configured)
    if (process.env.RESEND_API_KEY) {
      try {
        // Using luca.fritschij@gmail.com as recipient until domain propagates through Resend
        // This will be automatically switched to contact@flowviber.io once domain sync completes
        const result = await resend.emails.send({
          from: 'FlowViber <onboarding@resend.dev>',
          to: 'luca.fritschij@gmail.com',
          subject: `[FlowViber Contact Form] New Workflow Request from ${name}`,
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
