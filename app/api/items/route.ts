import { getDatabase } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const db = getDatabase()

    const items = db
      .prepare(`
      SELECT * FROM items ORDER BY name
    `)
      .all()

    return NextResponse.json(items)
  } catch (error) {
    console.error("[v0] Items API error:", error)
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 })
  }
}
