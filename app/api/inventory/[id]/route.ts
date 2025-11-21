import { getDatabase } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDatabase()
    const { id } = await Promise.resolve(params)

    const record = db
      .prepare(`
      SELECT 
        ir.id,
        ir.item_id,
        i.name as item_name,
        i.sku,
        i.category,
        i.unit_cost,
        i.reorder_point,
        i.reorder_quantity,
        ir.warehouse_id,
        w.name as warehouse_name,
        w.address,
        ir.location_id,
        sl.capacity as location_capacity,
        sl.used_space as location_used_space,
        ir.quantity_on_hand,
        ir.last_updated
      FROM inventory_records ir
      JOIN items i ON ir.item_id = i.id
      JOIN warehouses w ON ir.warehouse_id = w.id
      JOIN storage_locations sl ON ir.location_id = sl.id
      WHERE ir.id = ?
    `)
      .get(id)

    if (!record) {
      return NextResponse.json({ error: "Inventory record not found" }, { status: 404 })
    }

    return NextResponse.json(record)
  } catch (error) {
    console.error("[v0] Get inventory detail error:", error)
    return NextResponse.json({ error: "Failed to fetch inventory details" }, { status: 500 })
  }
}
