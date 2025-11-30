"use client"

import { useState, useEffect } from "react"
import { Package, RefreshCw, Server, AlertCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InventoryList } from "@/components/inventory-list"
import { RequisitionsList } from "@/components/requisitions-list"
import { PickListsDisplay } from "@/components/pick-lists-display"
import { OrdersList } from "@/components/orders-list"
import { WarehouseOperations } from "@/components/warehouse-operations"
import * as javaApi from "@/lib/java-api"

interface InventoryItem {
  recordId: string
  itemId: string
  itemName?: string
  quantityOnHand: number
  warehouseId?: string
  locationId?: string
}

interface Requisition {
  requisitionId: string
  itemId: string
  itemName?: string
  quantity: number
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdBy?: string
  justification?: string
}

interface PickList {
  pickListId: string
  orderId: string
  status: string
  items?: any[]
}

interface Warehouse {
  warehouseId: string
  name: string
  totalCapacity: number
  usedCapacity: number
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("inventory")
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [pickLists, setPickLists] = useState<PickList[]>([])
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null)
  const [loading, setLoading] = useState(true)
  const [backendStatus, setBackendStatus] = useState<"connected" | "disconnected" | "checking">("checking")
  const [error, setError] = useState<string | null>(null)

  const checkBackendStatus = async () => {
    setBackendStatus("checking")
    const result = await javaApi.getWarehouseCapacity()
    if (result.error) {
      setBackendStatus("disconnected")
      return false
    }
    setBackendStatus("connected")
    setWarehouse(result.data || null)
    return true
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const isConnected = await checkBackendStatus()

      if (!isConnected) {
        setError("Cannot connect to Java backend. Please ensure the server is running on port 4567.")
        setLoading(false)
        return
      }

      // Fetch pending requisitions from Java backend
      const reqResult = await javaApi.getPendingRequisitions()
      if (reqResult.data) {
        setRequisitions(reqResult.data)
      }

      // Fetch stock levels for known items (ITEM-001, ITEM-002)
      const stockItems: InventoryItem[] = []
      for (const itemId of ["ITEM-001", "ITEM-002"]) {
        const stockResult = await javaApi.getStockLevels(itemId)
        if (stockResult.data) {
          stockItems.push(stockResult.data)
        }
      }
      setInventory(stockItems)

      console.log("[v0] Data fetched from Java backend successfully")
    } catch (err) {
      console.error("[v0] Failed to fetch data:", err)
      setError("Failed to fetch data from Java backend")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      let result
      if (newStatus === "APPROVED") {
        result = await javaApi.approveRequisition(id)
      } else if (newStatus === "REJECTED") {
        result = await javaApi.rejectRequisition(id)
      }

      if (result?.data) {
        setRequisitions(requisitions.map((r) => (r.requisitionId === id ? { ...r, status: newStatus as any } : r)))
        console.log("[v0] Requisition status updated via Java backend:", id, newStatus)
      } else if (result?.error) {
        console.error("[v0] Failed to update requisition:", result.error)
      }
    } catch (err) {
      console.error("[v0] Failed to update requisition:", err)
    }
  }

  const transformedInventory = inventory.map((item) => ({
    id: item.recordId,
    item_id: item.itemId,
    item_name: item.itemName || item.itemId,
    sku: item.itemId,
    unit_cost: 0,
    reorder_point: 10,
    warehouse_id: item.warehouseId || "WH-1",
    location_id: item.locationId || "A1-01",
    quantity_on_hand: item.quantityOnHand,
    last_updated: new Date().toISOString(),
  }))

  const transformedRequisitions = requisitions.map((req) => ({
    id: req.requisitionId,
    item_id: req.itemId,
    item_name: req.itemName || req.itemId,
    quantity: req.quantity,
    status: req.status,
    created_by: req.createdBy || "System",
    justification: req.justification || "Stock replenishment",
    created_at: new Date().toISOString(),
  }))

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
        <Package className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-semibold">Warehouse Management System</h1>

        <div className="ml-4 flex items-center gap-2">
          <Server className="h-4 w-4" />
          <Badge
            variant={
              backendStatus === "connected" ? "default" : backendStatus === "disconnected" ? "destructive" : "secondary"
            }
          >
            {backendStatus === "connected"
              ? "Java Backend Connected"
              : backendStatus === "disconnected"
                ? "Backend Disconnected"
                : "Checking..."}
          </Badge>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              {error}
              <br />
              <span className="text-sm mt-2 block">
                Run the Java backend with:{" "}
                <code className="bg-muted px-1 rounded">cd backend && mvn compile exec:java</code>
              </span>
            </AlertDescription>
          </Alert>
        )}

        {warehouse && (
          <div className="mb-6 p-4 bg-card rounded-lg border">
            <h3 className="font-semibold mb-2">Warehouse: {warehouse.name}</h3>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Capacity: {warehouse.usedCapacity} / {warehouse.totalCapacity}
              </span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-xs">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${(warehouse.usedCapacity / warehouse.totalCapacity) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="pick-lists">Pick Lists</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-6">
            <InventoryList items={transformedInventory} />
          </TabsContent>

          <TabsContent value="requisitions" className="space-y-6">
            <RequisitionsList items={transformedRequisitions as any} onStatusChange={handleStatusChange} />
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <OrdersList />
          </TabsContent>

          <TabsContent value="pick-lists" className="space-y-6">
            <PickListsDisplay items={pickLists as any} />
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <WarehouseOperations onRefresh={fetchData} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
