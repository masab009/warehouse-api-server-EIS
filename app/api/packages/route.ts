import { getDatabase } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const db = getDatabase()

    const packages = db
      .prepare(`
      SELECT * FROM packages ORDER BY created_at DESC
    `)
      .all()

    return NextResponse.json(packages)
  } catch (error) {
    console.error("[v0] Packages API error:", error)
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 })
  }
}
