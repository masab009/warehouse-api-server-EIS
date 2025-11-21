import { getDatabase } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const db = getDatabase()

    const orders = db
      .prepare(`
      SELECT 
        po.id,
        po.requisition_id,
        po.supplier_id,
        po.supplier_name,
        po.total_amount,
        po.order_date,
        po.status,
        pr.item_name,
        pr.quantity
      FROM purchase_orders po
      JOIN purchase_requisitions pr ON po.requisition_id = pr.id
      ORDER BY po.order_date DESC
    `)
      .all()

    return NextResponse.json(orders)
  } catch (error) {
    console.error("[v0] Purchase orders API error:", error)
    return NextResponse.json({ error: "Failed to fetch purchase orders" }, { status: 500 })
  }
}
