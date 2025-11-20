// Inferred from Gson serialization logic and Java class structures.

// --- Shared / Primitives ---
export type DateString = string // LocalDate or LocalDateTime serialized as string

// --- Procurement (BP1, BP2, BP8) ---

export interface PurchaseRequisition {
  requisitionId: string
  itemId: string
  itemName: string
  createdBy: string
  justification: string
  status: "PENDING" | "APPROVED" | "REJECTED"
}

export interface PurchaseOrderItem {
  itemId: string
  itemName: string
  quantity: number
  unitPrice: number // BigDecimal
  lineTotal: number // BigDecimal
}

export interface PurchaseOrder {
  purchaseOrderId: string
  requisitionId: string
  supplierId: string
  supplierName: string
  orderItems: PurchaseOrderItem[]
  totalAmount: number // BigDecimal
  orderDate: DateString
  status: string // e.g., "CREATED"
}

// --- Receiving & QC (BP3, BP4, BP5) ---

export interface ShipmentNotification {
  shipmentId: number
  supplierName: string
  shipmentDate: DateString // java.util.Date
}

export interface Goods {
  productName?: string
  quantity?: number
  received?: boolean
  sku?: string
  description?: string
}

export interface GoodsBatch {
  sku: string
  batchId: string
  quantity: number
}

export interface GoodsReceivedNote {
  grnId: string
  batch: GoodsBatch
  date: DateString // LocalDate
}

// --- Inventory & Storage (BP6, BP7) ---

export interface Item {
  itemId: string
  name: string
  category: string
  barcode: string
  weight: number
  reorderPoint: number
  reorderQuantity: number
  // unitCost is calculated in getter, but serialized by Gson
  unitCost?: number
  preferredSupplierId?: string
}

export interface InventoryRecord {
  recordId: string
  itemId: string
  warehouseId: string
  locationId: string
  quantityOnHand: number
  lastUpdated: DateString // LocalDateTime
}

export interface StorageLocation {
  locationId: string
  capacity: number
  usedSpace: number
  storedItemIds: string[]
}

export interface Warehouse {
  warehouseId: string
  name: string
  address: string
  totalCapacity: number
  usedCapacity: number
  storageLocations: Record<string, StorageLocation>
}

// --- Picking (BP13) ---

export interface PickList {
  pickListId: string
  orderId: string
  status: "PENDING" | "ASSIGNED" | "COMPLETED"
}

// --- Packing & Shipping (BP9-12) ---

export interface Package {
  packageId: string
  orderId: string
  pickListId: string
  packageType: string
  status: "PACKING" | "VERIFIED" | "LABELED"
}

export interface ShippingLabel {
  labelId: string
  // Other fields like packageId, orderId, carrierId are private in Java class
  // but Gson serializes all fields by default unless transient.
  // Based on constructor:
  // this.labelId = lid;
  // The other fields are not stored as fields in the class definition provided in the snippet
  // (only labelId is defined as a field in ShippingLabel class in the text provided).
  // However, looking closely at ShippingLabel class:
  // class ShippingLabel { String labelId; ... }
  // It seems only labelId is exposed.
}

export interface DispatchManifest {
  manifestId: string
  // carrierId and carrierName are not fields in the class definition provided,
  // only manifestId is defined as a field.
}

export interface ShipmentRecord {
  shipmentId: string
  origin: string
  destination: string
  status: string
}

// --- Returns (BP14) ---

export interface ReturnRequest {
  returnId: string
  customer: { id: string; name: string }
  goods: Goods
  reason: string
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED"
}

// --- Audits (BP15) ---

export interface AuditRequest {
  requestId: string
  description: string
}

export interface InventoryData {
  itemId: string
  quantity: number
}

export interface AuditReport {
  reportId: string
  valid: boolean
  details: string
}

// --- API Response Wrappers ---

export interface ErrorResponse {
  error: string
}

export interface StatusResponse {
  status: string
  [key: string]: any
}
