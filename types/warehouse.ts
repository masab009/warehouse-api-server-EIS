export interface PurchaseRequisition {
  requisitionId: string
  itemId: string
  itemName: string
  createdBy: string
  justification: string
  status: "PENDING" | "APPROVED" | "REJECTED"
}

export interface PurchaseOrder {
  purchaseOrderId: string
  requisitionId: string
  supplierId: string
  supplierName: string
  orderItems: PurchaseOrderItem[]
  totalAmount: number
  orderDate: string
  status: string
}

export interface PurchaseOrderItem {
  itemId: string
  itemName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface InventoryRecord {
  recordId: string
  itemId: string
  warehouseId: string
  locationId: string
  quantityOnHand: number
  lastUpdated: string
}

export interface PickList {
  pickListId: string
  orderId: string
  status: string
}

export interface Package {
  packageId: string
  orderId: string
  pickListId: string
  packageType: string
  status: string
}

export interface ShippingLabel {
  labelId: string
  packageId: string
  carrierId: string
}

export interface DispatchManifest {
  manifestId: string
  carrierId: string
  carrierName: string
}

export interface ReturnRequest {
  returnId: string
  customer: { id: string; name: string }
  goods: { sku: string; description: string }
  reason: string
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED"
}

export interface AuditRequest {
  requestId: string
  description: string
}
