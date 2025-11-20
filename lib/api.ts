import type { PurchaseRequisition, PurchaseOrder, InventoryRecord, PickList } from "@/types/warehouse"

// Mock data for preview mode
const MOCK_REQUISITIONS: PurchaseRequisition[] = [
  {
    requisitionId: "PR-1715623400000",
    itemId: "ITEM-001",
    itemName: "Laptop",
    createdBy: "System",
    justification: "Low stock",
    status: "PENDING",
  },
  {
    requisitionId: "PR-1715623405000",
    itemId: "ITEM-002",
    itemName: "Mouse",
    createdBy: "System",
    justification: "Reorder point reached",
    status: "APPROVED",
  },
]

const MOCK_INVENTORY: InventoryRecord[] = [
  {
    recordId: "IR-001",
    itemId: "ITEM-001",
    warehouseId: "WH-1",
    locationId: "A1-01",
    quantityOnHand: 30,
    lastUpdated: new Date().toISOString(),
  },
  {
    recordId: "IR-002",
    itemId: "ITEM-002",
    warehouseId: "WH-1",
    locationId: "A1-02",
    quantityOnHand: 8,
    lastUpdated: new Date().toISOString(),
  },
]

const MOCK_PICKLISTS: PickList[] = [
  { pickListId: "PL-1001", orderId: "ORD-1001", status: "PENDING" },
  { pickListId: "PL-1002", orderId: "ORD-1002", status: "ASSIGNED" },
]

// API Client
export const api = {
  procurement: {
    getPendingRequisitions: async (): Promise<PurchaseRequisition[]> => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      return MOCK_REQUISITIONS
    },
    createPurchaseOrder: async (reqId: string): Promise<PurchaseOrder> => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      return {
        purchaseOrderId: `PO-${Date.now()}`,
        requisitionId: reqId,
        supplierId: "SUP-01",
        supplierName: "TechDistro",
        orderItems: [
          {
            itemId: "ITEM-001",
            itemName: "Laptop",
            quantity: 50,
            unitPrice: 1200,
            lineTotal: 60000,
          },
        ],
        totalAmount: 60000,
        orderDate: new Date().toISOString(),
        status: "CREATED",
      }
    },
  },
  inventory: {
    getStockLevels: async (): Promise<InventoryRecord[]> => {
      await new Promise((resolve) => setTimeout(resolve, 600))
      return MOCK_INVENTORY
    },
    runStockMonitor: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return { status: "Stock monitor run successfully" }
    },
  },
  warehouse: {
    getPickLists: async (): Promise<PickList[]> => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return MOCK_PICKLISTS
    },
  },
}
