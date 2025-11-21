"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PickListItem {
  id: string
  item_id: string
  item_name: string
  sku: string
  quantity_required: number
  quantity_picked: number
}

interface PickList {
  id: string
  order_id: string
  status: "PENDING" | "ASSIGNED" | "COMPLETED"
  created_at: string
  items?: PickListItem[]
}

export function PickListsDisplay({ items }: { items: PickList[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const statusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-50 text-green-700 border-green-200"
      case "ASSIGNED":
        return "bg-blue-50 text-blue-700 border-blue-200"
      default:
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pick Lists</CardTitle>
        <CardDescription>Active and completed pick lists for orders</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => {
            const isExpanded = expandedId === item.id
            const completionPercentage = item.items
              ? (item.items.filter((i) => i.quantity_picked === i.quantity_required).length / item.items.length) * 100
              : 0

            return (
              <div key={item.id} className="border rounded-lg overflow-hidden hover:bg-accent/30 transition-colors">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-accent/50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <p className="font-semibold">{item.id}</p>
                      <p className="text-sm text-muted-foreground">Order: {item.order_id}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={statusColor(item.status)}>
                        {item.status}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">{completionPercentage.toFixed(0)}% Complete</p>
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

                {isExpanded && item.items && (
                  <div className="px-4 pb-4 space-y-3 border-t pt-4">
                    {item.items.map((lineItem) => (
                      <div key={lineItem.id} className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{lineItem.item_name}</p>
                            <p className="text-xs text-muted-foreground">{lineItem.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">
                              {lineItem.quantity_picked}/{lineItem.quantity_required}
                            </p>
                          </div>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all"
                            style={{
                              width: `${(lineItem.quantity_picked / lineItem.quantity_required) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
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
