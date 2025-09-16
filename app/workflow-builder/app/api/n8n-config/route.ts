import { type NextRequest, NextResponse } from "next/server"

async function getUserId(): Promise<string> {
  // This function is intended to retrieve a user ID, but is currently not implemented.
  // For the sake of demonstrating the fix for database imports, we'll use a default ID.
  // In a real application, this would involve authentication or session management.
  return "00000000-0000-0000-0000-000000000001"
}

export async function GET() {
  try {
    console.log("[v0] N8n Config API: Getting n8n configuration")
    const userId = await getUserId()
    const { database } = await import('@/lib/database')
    const db = database()
    const result = await db.query(
      'SELECT n8n_instance_url FROM profiles WHERE id = $1',
      [userId]
    )

    const n8nInstanceUrl = result.rows[0]?.n8n_instance_url || null
    console.log("[v0] N8n Config API: Retrieved URL:", n8nInstanceUrl ? "configured" : "not configured")

    return NextResponse.json({
      status: 200,
      result: {
        n8nInstanceUrl,
      },
    })
  } catch (error) {
    console.error("[v0] N8n Config API: Error getting configuration:", error)
    // Ensure API routes return JSON, even for errors
    return NextResponse.json({ error: "Failed to get n8n configuration" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { n8nInstanceUrl } = await request.json()
    console.log("[v0] N8n Config API: Saving n8n instance URL")

    const { database } = await import('@/lib/database')
    const db = database()
    const defaultUserId = "00000000-0000-0000-0000-000000000001"

    await db.query(
      `INSERT INTO profiles (id, n8n_instance_url, display_name, updated_at) 
       VALUES ($1, $2, $3, NOW()) 
       ON CONFLICT (id) 
       DO UPDATE SET n8n_instance_url = $2, updated_at = NOW()`,
      [defaultUserId, n8nInstanceUrl, "Development User"]
    )

    console.log("[v0] N8n Config API: Successfully saved n8n instance URL")

    return NextResponse.json({
      status: 200,
      result: {
        success: true,
      },
    })
  } catch (error) {
    console.error("[v0] N8n Config API: Error saving configuration:", error)
    // Ensure API routes return JSON, even for errors
    return NextResponse.json({ error: "Failed to save n8n configuration" }, { status: 500 })
  }
}