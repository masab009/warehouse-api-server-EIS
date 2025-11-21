"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, CheckCircle2, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Requisition {
  id: string
  item_id: string
  item_name: string
  quantity: number
  status: "PENDING" | "APPROVED" | "REJECTED"
  created_by: string
  justification: string
  created_at: string
}

interface RequisitionDetailProps {
  item: Requisition
  isExpanded: boolean
  onStatusChange?: (id: string, newStatus: string) => void
}

function RequisitionDetail({ item, isExpanded, onStatusChange }: RequisitionDetailProps) {
  if (!isExpanded) return null

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Created By</p>
          <p className="font-semibold">{item.created_by}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Created Date</p>
          <p className="text-sm">{new Date(item.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-2">Justification</p>
        <p className="text-sm bg-muted p-2 rounded">{item.justification}</p>
      </div>

      {item.status === "PENDING" && (
        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={() => onStatusChange?.(item.id, "APPROVED")} className="gap-1">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => onStatusChange?.(item.id, "REJECTED")} className="gap-1">
            <XCircle className="h-4 w-4 text-red-600" />
            Reject
          </Button>
        </div>
      )}
    </div>
  )
}

export function RequisitionsList({
  items,
  onStatusChange,
}: {
  items: Requisition[]
  onStatusChange?: (id: string, newStatus: string) => void
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const statusVariant = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "default"
      case "REJECTED":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Requisitions</CardTitle>
        <CardDescription>Manage and approve stock reorder requests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => {
            const isExpanded = expandedId === item.id

            return (
              <div key={item.id} className="border rounded-lg overflow-hidden hover:bg-accent/30 transition-colors">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-accent/50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <p className="font-semibold">{item.item_name}</p>
                      <p className="text-sm text-muted-foreground">{item.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{item.quantity} units</p>
                      <Badge variant={statusVariant(item.status) as any}>{item.status}</Badge>
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
                    <RequisitionDetail item={item} isExpanded={true} onStatusChange={onStatusChange} />
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
