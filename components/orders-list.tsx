"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Plus } from "lucide-react"
import { CreateOrderDialog } from "@/components/create-order-dialog"

interface Order {
  id: string
  item_id: string
  item_name: string
  quantity: number
  unit_cost: number
  total_cost: number
  status: string
  ordered_date: string
  delivery_date: string
}

export function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([])
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/orders")
      const data = await res.json()
      setOrders(data)
    } catch (error) {
      console.error("Failed to fetch orders:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const toggleExpand = (orderId: string) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))
      }
    } catch (error) {
      console.error("Failed to update order:", error)
    }
  }

  const handleOrderCreated = async () => {
    setShowCreateDialog(false)
    await fetchOrders()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ORDERED":
        return "bg-blue-100 text-blue-800"
      case "IN_TRANSIT":
        return "bg-yellow-100 text-yellow-800"
      case "DELIVERED":
        return "bg-green-100 text-green-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading orders...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Orders</h2>
          <p className="text-muted-foreground mt-1">Manage and track inventory orders</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Order
        </Button>
      </div>

      <CreateOrderDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onOrderCreated={handleOrderCreated}
      />

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No orders found. Create your first order to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{order.item_name}</CardTitle>
                    <CardDescription className="mt-1">Order ID: {order.id}</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => toggleExpand(order.id)}>
                    {expandedOrders.has(order.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                    <p className="text-lg font-semibold">{order.quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Unit Cost</p>
                    <p className="text-lg font-semibold">${order.unit_cost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                    <p className="text-lg font-semibold">${order.total_cost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge className={`mt-1 ${getStatusColor(order.status)}`}>{order.status}</Badge>
                  </div>
                </div>

                {expandedOrders.has(order.id) && (
                  <div className="border-t pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Ordered Date</p>
                        <p className="text-sm">{new Date(order.ordered_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Expected Delivery</p>
                        <p className="text-sm">{new Date(order.delivery_date).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                        <>
                          {order.status === "ORDERED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(order.id, "IN_TRANSIT")}
                            >
                              Mark In Transit
                            </Button>
                          )}
                          {order.status === "IN_TRANSIT" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(order.id, "DELIVERED")}
                            >
                              Mark Delivered
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => handleStatusChange(order.id, "CANCELLED")}>
                            Cancel Order
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
