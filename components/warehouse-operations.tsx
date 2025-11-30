"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  Package,
  Truck,
  ClipboardCheck,
  RotateCcw,
  FileCheck,
  ShoppingCart,
  AlertTriangle,
} from "lucide-react"
import * as javaApi from "@/lib/java-api"

interface OperationResult {
  success: boolean
  message: string
  data?: any
}

interface WarehouseOperationsProps {
  onRefresh: () => void
}

export function WarehouseOperations({ onRefresh }: WarehouseOperationsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, OperationResult>>({})

  const executeOperation = async (operationId: string, operation: () => Promise<any>, successMessage: string) => {
    setLoading(operationId)
    try {
      const result = await operation()
      if (result.error) {
        setResults((prev) => ({
          ...prev,
          [operationId]: { success: false, message: result.error },
        }))
      } else {
        setResults((prev) => ({
          ...prev,
          [operationId]: { success: true, message: successMessage, data: result.data },
        }))
        onRefresh()
      }
    } catch (err: any) {
      setResults((prev) => ({
        ...prev,
        [operationId]: { success: false, message: err.message || "Operation failed" },
      }))
    } finally {
      setLoading(null)
    }
  }

  const operations = [
    {
      id: "receive-shipment",
      title: "Receive Shipment",
      description: "Process incoming supplier shipment",
      icon: Truck,
      action: () => executeOperation("receive-shipment", javaApi.receiveShipment, "Shipment received successfully"),
    },
    {
      id: "inspect-goods",
      title: "Inspect Goods",
      description: "Run quality control inspection",
      icon: ClipboardCheck,
      action: () => executeOperation("inspect-goods", javaApi.inspectGoods, "Goods inspection completed"),
    },
    {
      id: "update-inventory",
      title: "Update Inventory",
      description: "Update inventory from receipt",
      icon: Package,
      action: () =>
        executeOperation("update-inventory", javaApi.updateInventoryFromReceipt, "Inventory updated from receipt"),
    },
    {
      id: "monitor-stock",
      title: "Monitor Stock",
      description: "Run stock level monitoring",
      icon: AlertTriangle,
      action: () => executeOperation("monitor-stock", javaApi.runStockMonitoring, "Stock monitoring completed"),
    },
    {
      id: "create-reorder",
      title: "Create Reorder",
      description: "Create stock reorder request",
      icon: ShoppingCart,
      action: () => executeOperation("create-reorder", javaApi.createReorderRequest, "Reorder request created"),
    },
    {
      id: "create-po",
      title: "Create Purchase Order",
      description: "Generate new purchase order",
      icon: FileCheck,
      action: () => executeOperation("create-po", javaApi.createPurchaseOrder, "Purchase order created"),
    },
    {
      id: "initiate-return",
      title: "Initiate Return",
      description: "Start customer return process",
      icon: RotateCcw,
      action: () => executeOperation("initiate-return", javaApi.initiateReturn, "Return initiated"),
    },
    {
      id: "initiate-audit",
      title: "Initiate Audit",
      description: "Start inventory audit",
      icon: ClipboardCheck,
      action: () => executeOperation("initiate-audit", javaApi.initiateAudit, "Audit initiated"),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Warehouse Operations</h2>
        <p className="text-muted-foreground mt-1">Execute operations directly on the Java backend server</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {operations.map((op) => {
          const result = results[op.id]
          const isLoading = loading === op.id
          const Icon = op.icon

          return (
            <Card key={op.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{op.title}</CardTitle>
                  </div>
                  {result && (
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "Success" : "Failed"}
                    </Badge>
                  )}
                </div>
                <CardDescription>{op.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={op.action}
                  disabled={isLoading}
                  className="w-full"
                  variant={result?.success === false ? "destructive" : "default"}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Execute"
                  )}
                </Button>

                {result && (
                  <div
                    className={`mt-3 p-2 rounded text-sm ${
                      result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    }`}
                  >
                    {result.message}
                    {result.data && (
                      <pre className="mt-2 text-xs overflow-auto max-h-24">{JSON.stringify(result.data, null, 2)}</pre>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
