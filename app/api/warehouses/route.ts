import { getDatabase } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const db = getDatabase()

    const warehouses = db
      .prepare(`
      SELECT * FROM warehouses ORDER BY name
    `)
      .all()

    return NextResponse.json(warehouses)
  } catch (error) {
    console.error("[v0] Warehouses API error:", error)
    return NextResponse.json({ error: "Failed to fetch warehouses" }, { status: 500 })
  }
}
