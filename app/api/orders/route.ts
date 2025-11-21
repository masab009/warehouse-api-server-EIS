import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function GET() {
  try {
    initializeDatabase()
    const db = getDatabase()

    const orders = db
      .prepare(`
      SELECT * FROM orders ORDER BY ordered_date DESC
    `)
      .all()

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Failed to fetch orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { item_id, item_name, quantity, unit_cost } = await request.json()

    if (!item_id || !quantity || quantity <= 0) {
      return NextResponse.json({ error: "Invalid order data" }, { status: 400 })
    }

    initializeDatabase()
    const db = getDatabase()

    const orderId = `ORD-BUY-${Date.now()}`
    const totalCost = unit_cost * quantity
    const now = new Date()
    const deliveryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const stmt = db.prepare(`
      INSERT INTO orders (id, item_id, item_name, quantity, unit_cost, total_cost, status, ordered_date, delivery_date)
      VALUES (?, ?, ?, ?, ?, ?, 'ORDERED', ?, ?)
    `)

    stmt.run(orderId, item_id, item_name, quantity, unit_cost, totalCost, now.toISOString(), deliveryDate.toISOString())

    const updateInventory = db.prepare(`
      UPDATE inventory_records
      SET quantity_on_hand = quantity_on_hand + ?
      WHERE item_id = ?
    `)
    updateInventory.run(quantity, item_id)

    const newOrder = db
      .prepare(`
      SELECT * FROM orders WHERE id = ?
    `)
      .get(orderId)

    return NextResponse.json(newOrder, { status: 201 })
  } catch (error) {
    console.error("Failed to create order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
