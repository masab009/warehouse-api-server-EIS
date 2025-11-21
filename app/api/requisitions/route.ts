import { getDatabase } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const db = getDatabase()

    const requisitions = db
      .prepare(`
      SELECT * FROM purchase_requisitions ORDER BY created_at DESC
    `)
      .all()

    return NextResponse.json(requisitions)
  } catch (error) {
    console.error("[v0] Requisitions API error:", error)
    return NextResponse.json({ error: "Failed to fetch requisitions" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const db = getDatabase()
    const body = await request.json()
    const { itemId, quantity, justification, createdBy } = body

    const item = db.prepare("SELECT name FROM items WHERE id = ?").get(itemId) as { name: string } | undefined
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const id = `REQ-${Date.now()}`
    db.prepare(`
      INSERT INTO purchase_requisitions (id, item_id, item_name, quantity, justification, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, itemId, item.name, quantity, justification, createdBy)

    return NextResponse.json({ id, message: "Requisition created" }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create requisition error:", error)
    return NextResponse.json({ error: "Failed to create requisition" }, { status: 500 })
  }
}
