import { getDatabase } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDatabase()
    const { id } = await Promise.resolve(params)

    const requisition = db
      .prepare(`
      SELECT * FROM purchase_requisitions WHERE id = ?
    `)
      .get(id)

    if (!requisition) {
      return NextResponse.json({ error: "Requisition not found" }, { status: 404 })
    }

    return NextResponse.json(requisition)
  } catch (error) {
    console.error("[v0] Get requisition error:", error)
    return NextResponse.json({ error: "Failed to fetch requisition" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDatabase()
    const { id } = await Promise.resolve(params)
    const body = await request.json()
    const { status } = body

    const result = db
      .prepare(`
      UPDATE purchase_requisitions SET status = ? WHERE id = ?
    `)
      .run(status, id)

    if ((result.changes || 0) === 0) {
      return NextResponse.json({ error: "Requisition not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Requisition updated" })
  } catch (error) {
    console.error("[v0] Update requisition error:", error)
    return NextResponse.json({ error: "Failed to update requisition" }, { status: 500 })
  }
}
