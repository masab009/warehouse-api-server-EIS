import { getDatabase } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDatabase()
    const { id } = await Promise.resolve(params)

    const pickList = db
      .prepare(`
      SELECT * FROM pick_lists WHERE id = ?
    `)
      .get(id)

    if (!pickList) {
      return NextResponse.json({ error: "Pick list not found" }, { status: 404 })
    }

    const items = db
      .prepare(`
      SELECT 
        pli.id,
        pli.item_id,
        i.name as item_name,
        i.sku,
        pli.quantity_required,
        pli.quantity_picked
      FROM pick_list_items pli
      JOIN items i ON pli.item_id = i.id
      WHERE pli.pick_list_id = ?
    `)
      .all(id)

    return NextResponse.json({ ...pickList, items })
  } catch (error) {
    console.error("[v0] Get pick list error:", error)
    return NextResponse.json({ error: "Failed to fetch pick list details" }, { status: 500 })
  }
}
