"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"

interface Item {
  id: string
  name: string
  sku: string
  unit_cost: number
}

interface CreateOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOrderCreated: () => void
}

export function CreateOrderDialog({ open, onOpenChange, onOrderCreated }: CreateOrderDialogProps) {
  const [items, setItems] = useState<Item[]>([])
  const [selectedItem, setSelectedItem] = useState<string>("")
  const [quantity, setQuantity] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch("/api/items")
        const data = await res.json()
        setItems(data)
      } catch (error) {
        console.error("Failed to fetch items:", error)
      }
    }

    if (open) {
      fetchItems()
    }
  }, [open])

  const selectedItemData = items.find((item) => item.id === selectedItem)
  const totalCost = selectedItemData && quantity ? Number.parseFloat(quantity) * selectedItemData.unit_cost : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!selectedItem || !quantity || Number.parseInt(quantity) <= 0) {
      setError("Please select an item and enter a valid quantity")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: selectedItem,
          item_name: selectedItemData?.name,
          quantity: Number.parseInt(quantity),
          unit_cost: selectedItemData?.unit_cost,
        }),
      })

      if (res.ok) {
        setSelectedItem("")
        setQuantity("")
        onOpenChange(false)
        onOrderCreated()
      } else {
        setError("Failed to create order")
      }
    } catch (error) {
      console.error("Failed to create order:", error)
      setError("An error occurred while creating the order")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>Order inventory items for your warehouse</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-select">Item</Label>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger id="item-select">
                <SelectValue placeholder="Select an item" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} ({item.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedItemData && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground">Unit Cost: ${selectedItemData.unit_cost.toFixed(2)}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
            />
          </div>

          {totalCost > 0 && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-medium">Total Cost: ${totalCost.toFixed(2)}</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
