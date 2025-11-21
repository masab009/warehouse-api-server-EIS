import { getDatabase, initializeDatabase } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    initializeDatabase()
    const db = getDatabase()

    const records = db
      .prepare(`
      SELECT 
        ir.id,
        ir.item_id,
        i.name as item_name,
        i.sku,
        i.unit_cost,
        i.reorder_point,
        ir.warehouse_id,
        ir.location_id,
        ir.quantity_on_hand,
        ir.last_updated
      FROM inventory_records ir
      JOIN items i ON ir.item_id = i.id
      ORDER BY ir.id
    `)
      .all()

    return NextResponse.json(records)
  } catch (error) {
    console.error("[v0] Inventory API error:", error)
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 })
  }
}
