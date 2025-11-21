import { getDatabase } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const db = getDatabase()

    const pickLists = db
      .prepare(`
      SELECT * FROM pick_lists ORDER BY created_at DESC
    `)
      .all()

    return NextResponse.json(pickLists)
  } catch (error) {
    console.error("[v0] Pick lists API error:", error)
    return NextResponse.json({ error: "Failed to fetch pick lists" }, { status: 500 })
  }
}
