"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Package,
  ShoppingCart,
  Truck,
  ClipboardList,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { api } from "@/lib/api"
import type { PurchaseRequisition, InventoryRecord, PickList } from "@/types/warehouse"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([])
  const [inventory, setInventory] = useState<InventoryRecord[]>([])
  const [pickLists, setPickLists] = useState<PickList[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [reqs, inv, picks] = await Promise.all([
        api.procurement.getPendingRequisitions(),
        api.inventory.getStockLevels(),
        api.warehouse.getPickLists(),
      ])
      setRequisitions(reqs)
      setInventory(inv)
      setPickLists(picks)
    } catch (error) {
      console.error("Failed to fetch data", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

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
          <TabsList className="grid w-full grid-cols-2 lg:w-[600px] lg:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="procurement">Procurement</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="warehouse">Warehouse</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Requisitions</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{requisitions.length}</div>
                  <p className="text-xs text-muted-foreground">Awaiting approval</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{inventory.filter((i) => i.quantityOnHand < 10).length}</div>
                  <p className="text-xs text-muted-foreground">Below reorder point</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Pick Lists</CardTitle>
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pickLists.length}</div>
                  <p className="text-xs text-muted-foreground">In progress</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Shipments Today</CardTitle>
                  <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">+2 from yesterday</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Recent Inventory Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventory.map((item) => (
                        <TableRow key={item.recordId}>
                          <TableCell className="font-medium">{item.itemId}</TableCell>
                          <TableCell>{item.locationId}</TableCell>
                          <TableCell>{item.quantityOnHand}</TableCell>
                          <TableCell>
                            {item.quantityOnHand < 10 ? (
                              <Badge variant="destructive">Low Stock</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                OK
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Pending Actions</CardTitle>
                  <CardDescription>Tasks requiring attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {requisitions.slice(0, 3).map((req) => (
                      <div key={req.requisitionId} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">{req.itemName}</p>
                          <p className="text-xs text-muted-foreground">{req.justification}</p>
                        </div>
                        <Button size="sm" variant="secondary">
                          Review
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="procurement" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Purchase Requisitions</CardTitle>
                <CardDescription>Manage and approve stock reorder requests</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requisitions.map((req) => (
                      <TableRow key={req.requisitionId}>
                        <TableCell className="font-medium">{req.requisitionId}</TableCell>
                        <TableCell>{req.itemName}</TableCell>
                        <TableCell>{req.createdBy}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              req.status === "APPROVED"
                                ? "default"
                                : req.status === "REJECTED"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {req.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {req.status === "PENDING" && (
                            <div className="flex justify-end gap-2">
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600">
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Stock Levels</CardTitle>
                <CardDescription>Real-time inventory tracking across all warehouses</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item ID</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((item) => (
                      <TableRow key={item.recordId}>
                        <TableCell className="font-medium">{item.itemId}</TableCell>
                        <TableCell>{item.warehouseId}</TableCell>
                        <TableCell>{item.locationId}</TableCell>
                        <TableCell>{item.quantityOnHand}</TableCell>
                        <TableCell>{new Date(item.lastUpdated).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="warehouse" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Picking & Packing</CardTitle>
                <CardDescription>Active pick lists and packing status</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pick List ID</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pickLists.map((list) => (
                      <TableRow key={list.pickListId}>
                        <TableCell className="font-medium">{list.pickListId}</TableCell>
                        <TableCell>{list.orderId}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{list.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
