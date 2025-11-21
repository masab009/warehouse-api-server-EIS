import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { status } = await request.json()

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    initializeDatabase()
    const db = getDatabase()

    const stmt = db.prepare(`
      UPDATE orders
      SET status = ?
      WHERE id = ?
    `)

    stmt.run(status, id)

    const updatedOrder = db
      .prepare(`
      SELECT * FROM orders WHERE id = ?
    `)
      .get(id)

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Failed to update order:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
