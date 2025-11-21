"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

interface InventoryDetailProps {
  item: InventoryItem
  isExpanded: boolean
}

function InventoryDetail({ item, isExpanded }: InventoryDetailProps) {
  if (!isExpanded) return null

  const isLowStock = item.quantity_on_hand < item.reorder_point
  const stockPercentage = (item.quantity_on_hand / (item.reorder_point * 2)) * 100

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">SKU</p>
          <p className="font-mono text-sm font-semibold">{item.sku}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Unit Cost</p>
          <p className="font-semibold">${item.unit_cost?.toFixed(2) || "N/A"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Reorder Point</p>
          <p className="font-semibold">{item.reorder_point}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Warehouse</p>
          <p className="font-semibold">{item.warehouse_id}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Location</p>
          <p className="font-semibold">{item.location_id}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Last Updated</p>
          <p className="text-sm">{new Date(item.last_updated).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Stock Level</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${isLowStock ? "bg-red-500" : "bg-green-500"}`}
              style={{ width: `${Math.min(stockPercentage, 100)}%` }}
            />
          </div>
          <span className="text-sm font-semibold min-w-fit">
            {item.quantity_on_hand}/{item.reorder_point * 2}
          </span>
        </div>
      </div>

      {isLowStock && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <span className="font-semibold">Warning:</span> Stock is below reorder point. Consider creating a purchase
            requisition.
          </p>
        </div>
      )}
    </div>
  )
}

export function InventoryList({ items }: { items: InventoryItem[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Records</CardTitle>
        <CardDescription>Expand items to view detailed information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => {
            const isExpanded = expandedId === item.id
            const isLowStock = item.quantity_on_hand < item.reorder_point

            return (
              <div key={item.id} className="border rounded-lg overflow-hidden hover:bg-accent/30 transition-colors">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-accent/50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <p className="font-semibold">{item.item_name}</p>
                      <p className="text-sm text-muted-foreground">{item.item_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{item.quantity_on_hand} units</p>
                      {isLowStock && <Badge variant="destructive">Low Stock</Badge>}
                      {!isLowStock && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          OK
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4">
                    <InventoryDetail item={item} isExpanded={true} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
