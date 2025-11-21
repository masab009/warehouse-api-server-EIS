"use client"

import { useState, useEffect } from "react"
import { Package, RefreshCw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { InventoryList } from "@/components/inventory-list"
import { RequisitionsList } from "@/components/requisitions-list"
import { PickListsDisplay } from "@/components/pick-lists-display"

interface InventoryItem {
  id: string
  item_id: string
  item_name: string
  sku: string
  unit_cost: number
  reorder_point: number
  warehouse_id: string
  location_id: string
  quantity_on_hand: number
  last_updated: string
}

interface Requisition {
  id: string
  item_id: string
  item_name: string
  quantity: number
  status: string
  created_by: string
  justification: string
  created_at: string
}

interface PickList {
  id: string
  order_id: string
  status: string
  created_at: string
  items?: any[]
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("inventory")
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [pickLists, setPickLists] = useState<PickList[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      console.log("[v0] Fetching inventory data...")
      const [invRes, reqRes, plRes] = await Promise.all([
        fetch("/api/inventory"),
        fetch("/api/requisitions"),
        fetch("/api/pick-lists"),
      ])

      const invData = await invRes.json()
      const reqData = await reqRes.json()
      const plData = await plRes.json()

      console.log("[v0] Inventory data received:", invData)
      console.log("[v0] Requisitions data received:", reqData)
      console.log("[v0] Pick lists data received:", plData)

      setInventory(invData)
      setRequisitions(reqData)

      // Fetch detailed pick list data
      const pickListsWithItems = await Promise.all(
        plData.map(async (pl: PickList) => {
          const res = await fetch(`/api/pick-lists/${pl.id}`)
          return res.json()
        }),
      )
      setPickLists(pickListsWithItems)
    } catch (error) {
      console.error("[v0] Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/requisitions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        setRequisitions(requisitions.map((r) => (r.id === id ? { ...r, status: newStatus } : r)))
        console.log("[v0] Requisition status updated:", id, newStatus)
      }
    } catch (error) {
      console.error("[v0] Failed to update requisition:", error)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
        <Package className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-semibold">Warehouse Management System</h1>
        <div className="ml-auto flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
            <TabsTrigger value="pick-lists">Pick Lists</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-6">
            <InventoryList items={inventory} />
          </TabsContent>

          <TabsContent value="requisitions" className="space-y-6">
            <RequisitionsList items={requisitions} onStatusChange={handleStatusChange} />
          </TabsContent>

          <TabsContent value="pick-lists" className="space-y-6">
            <PickListsDisplay items={pickLists} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
