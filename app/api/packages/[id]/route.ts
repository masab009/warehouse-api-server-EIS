import { getDatabase } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDatabase()
    const { id } = await Promise.resolve(params)

    const pkg = db
      .prepare(`
      SELECT * FROM packages WHERE id = ?
    `)
      .get(id)

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 })
    }

    return NextResponse.json(pkg)
  } catch (error) {
    console.error("[v0] Get package error:", error)
    return NextResponse.json({ error: "Failed to fetch package details" }, { status: 500 })
  }
}
