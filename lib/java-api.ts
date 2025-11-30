/**
 * Java Backend API Client
 * This client communicates with the Java SparkJava server running on port 4567
 */

const JAVA_API_BASE_URL = process.env.NEXT_PUBLIC_JAVA_API_URL || "http://localhost:4567"

interface ApiResponse<T> {
  data?: T
  error?: string
}

async function fetchFromJavaBackend<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const url = `${JAVA_API_BASE_URL}${endpoint}`
    console.log(`[v0] Fetching from Java backend: ${url}`)

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error(`[v0] Java API error:`, data)
      return { error: data.error || "Request failed" }
    }

    console.log(`[v0] Java API response:`, data)
    return { data }
  } catch (error) {
    console.error(`[v0] Failed to connect to Java backend:`, error)
    return { error: "Failed to connect to Java backend. Is the server running on port 4567?" }
  }
}

// ============================================================================
// INVENTORY APIs
// ============================================================================

export interface InventoryRecord {
  recordId: string
  itemId: string
  quantityOnHand: number
  warehouseId?: string
  locationId?: string
  lastUpdated?: string
}

export interface StockMonitorResult {
  itemsChecked: number
  lowStockItems: string[]
  reorderTriggered: boolean
}

export async function getStockLevels(itemId: string): Promise<ApiResponse<InventoryRecord>> {
  return fetchFromJavaBackend<InventoryRecord>(`/api/inventory/stock-levels/${itemId}`)
}

export async function runStockMonitoring(): Promise<ApiResponse<StockMonitorResult>> {
  return fetchFromJavaBackend<StockMonitorResult>("/api/inventory/stock-monitor/run", {
    method: "POST",
  })
}

export async function adjustInventory(sku: string, adjustment: number): Promise<ApiResponse<{ status: string }>> {
  return fetchFromJavaBackend<{ status: string }>("/api/inventory/stock-levels/adjust", {
    method: "PUT",
    body: JSON.stringify({ sku, adjustment }),
  })
}

// ============================================================================
// PROCUREMENT APIs
// ============================================================================

export interface PurchaseRequisition {
  requisitionId: string
  itemId: string
  itemName?: string
  quantity: number
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdBy?: string
  justification?: string
  createdAt?: string
}

export interface PurchaseOrder {
  purchaseOrderId: string
  requisitionId: string
  supplierId: string
  supplierName: string
  orderItems: Array<{
    itemId: string
    itemName: string
    quantity: number
    unitPrice: number
    lineTotal: number
  }>
  totalAmount: number
  orderDate: string
  status: string
}

export async function getPendingRequisitions(): Promise<ApiResponse<PurchaseRequisition[]>> {
  return fetchFromJavaBackend<PurchaseRequisition[]>("/api/procurement/requisitions/pending")
}

export async function approveRequisition(requisitionId: string): Promise<ApiResponse<PurchaseRequisition>> {
  return fetchFromJavaBackend<PurchaseRequisition>(`/api/procurement/requisitions/${requisitionId}/approve`, {
    method: "PUT",
  })
}

export async function rejectRequisition(requisitionId: string): Promise<ApiResponse<PurchaseRequisition>> {
  return fetchFromJavaBackend<PurchaseRequisition>(`/api/procurement/requisitions/${requisitionId}/reject`, {
    method: "PUT",
  })
}

export async function createPurchaseOrder(): Promise<ApiResponse<PurchaseOrder>> {
  return fetchFromJavaBackend<PurchaseOrder>("/api/procurement/purchase-orders", {
    method: "POST",
  })
}

export async function getPurchaseOrder(orderId: string): Promise<ApiResponse<PurchaseOrder>> {
  return fetchFromJavaBackend<PurchaseOrder>(`/api/procurement/purchase-orders/${orderId}`)
}

export async function createReorderRequest(): Promise<ApiResponse<PurchaseRequisition>> {
  return fetchFromJavaBackend<PurchaseRequisition>("/api/procurement/reorder", {
    method: "POST",
  })
}

// ============================================================================
// WAREHOUSE APIs
// ============================================================================

export interface Warehouse {
  warehouseId: string
  name: string
  address: string
  totalCapacity: number
  usedCapacity: number
}

export interface PickList {
  pickListId: string
  orderId: string
  status: "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED"
  assignedPicker?: string
  items: Array<{
    itemId: string
    itemName?: string
    quantityRequired: number
    quantityPicked: number
    location: string
  }>
  createdAt?: string
}

export interface Picker {
  pickerId: string
  name?: string
  status: string
}

export interface Package {
  packageId: string
  orderId: string
  pickListId: string
  packageType: string
  status: string
  weight?: number
  dimensions?: string
}

export async function getWarehouseCapacity(): Promise<ApiResponse<Warehouse>> {
  return fetchFromJavaBackend<Warehouse>("/api/warehouse/capacity")
}

export async function storeItem(
  itemId: string,
  warehouseId: string,
  quantity: number,
): Promise<ApiResponse<{ status: string }>> {
  return fetchFromJavaBackend<{ status: string }>("/api/warehouse/storage/store-item", {
    method: "POST",
    body: JSON.stringify({ itemId, warehouseId, quantity }),
  })
}

export async function createPickList(orderId: string): Promise<ApiResponse<PickList>> {
  return fetchFromJavaBackend<PickList>(`/api/warehouse/picking/create-picklist/${orderId}`, {
    method: "POST",
  })
}

export async function assignPickList(pickListId: string, pickerId: string): Promise<ApiResponse<{ status: string }>> {
  return fetchFromJavaBackend<{ status: string }>(`/api/warehouse/picking/picklists/${pickListId}/assign/${pickerId}`, {
    method: "PUT",
  })
}

export async function recordPickedItem(
  pickListId: string,
  itemId: string,
  quantity: number,
): Promise<ApiResponse<{ status: string }>> {
  return fetchFromJavaBackend<{ status: string }>(
    `/api/warehouse/picking/picklists/${pickListId}/items/${itemId}/${quantity}`,
    { method: "PUT" },
  )
}

export async function getAvailablePickers(): Promise<ApiResponse<Picker[]>> {
  return fetchFromJavaBackend<Picker[]>("/api/warehouse/personnel/pickers")
}

export async function packOrder(pickListId: string): Promise<ApiResponse<Package>> {
  return fetchFromJavaBackend<Package>(`/api/warehouse/packing/pack-order/${pickListId}`, {
    method: "POST",
  })
}

export async function getPackageDetails(packageId: string): Promise<ApiResponse<Package>> {
  return fetchFromJavaBackend<Package>(`/api/warehouse/packing/packages/${packageId}`)
}

// ============================================================================
// SHIPPING APIs
// ============================================================================

export interface ShippingLabel {
  labelId: string
  packageId: string
  carrierId: string
  trackingNumber: string
  serviceLevel: string
  fromAddress: any
  toAddress: any
  createdAt: string
}

export interface DispatchManifest {
  manifestId: string
  carrierId: string
  packages: Package[]
  status: string
  createdAt: string
}

export interface ShipmentRecord {
  trackingId: string
  origin: string
  destination: string
  status: string
  estimatedDelivery?: string
}

export async function generateShippingLabel(
  packageId: string,
  carrierId: string,
  serviceLevel: string,
): Promise<ApiResponse<ShippingLabel>> {
  return fetchFromJavaBackend<ShippingLabel>(
    `/api/shipping/labels/generate/${packageId}/${carrierId}/${serviceLevel}`,
    { method: "POST" },
  )
}

export async function getShippingLabel(labelId: string): Promise<ApiResponse<ShippingLabel>> {
  return fetchFromJavaBackend<ShippingLabel>(`/api/shipping/labels/${labelId}`)
}

export async function createDispatchManifest(carrierId: string): Promise<ApiResponse<DispatchManifest>> {
  return fetchFromJavaBackend<DispatchManifest>(`/api/shipping/dispatch/create-manifest/${carrierId}`, {
    method: "POST",
  })
}

export async function recordCourierHandover(manifestId: string): Promise<ApiResponse<{ status: string }>> {
  return fetchFromJavaBackend<{ status: string }>(`/api/shipping/dispatch/manifests/${manifestId}/handover`, {
    method: "PUT",
  })
}

export async function trackShipment(trackingId: string): Promise<ApiResponse<ShipmentRecord>> {
  return fetchFromJavaBackend<ShipmentRecord>(`/api/shipping/tracking/${trackingId}`)
}

// ============================================================================
// RETURNS APIs
// ============================================================================

export interface ReturnRequest {
  returnId: string
  customerId: string
  sku: string
  reason: string
  status: string
  createdAt: string
}

export async function initiateReturn(): Promise<ApiResponse<ReturnRequest>> {
  return fetchFromJavaBackend<ReturnRequest>("/api/returns/initiate", {
    method: "POST",
  })
}

export async function approveReturn(returnId: string): Promise<ApiResponse<{ status: string }>> {
  return fetchFromJavaBackend<{ status: string }>(`/api/returns/requests/${returnId}/approve`, { method: "PUT" })
}

export async function processReceivedReturn(returnId: string): Promise<ApiResponse<{ status: string }>> {
  return fetchFromJavaBackend<{ status: string }>(`/api/returns/process-received/${returnId}`, { method: "POST" })
}

// ============================================================================
// RECEIVING APIs
// ============================================================================

export interface ShipmentReceiveResult {
  status: string
  shipmentId: number
}

export interface InspectionResult {
  grnId?: string
  batch?: {
    sku: string
    batchId: string
    quantity: number
  }
  status?: string
  outcome?: string
}

export async function receiveShipment(): Promise<ApiResponse<ShipmentReceiveResult>> {
  return fetchFromJavaBackend<ShipmentReceiveResult>("/api/warehouse/shipments/receive", {
    method: "POST",
  })
}

export async function inspectGoods(): Promise<ApiResponse<InspectionResult>> {
  return fetchFromJavaBackend<InspectionResult>("/api/warehouse/qc/inspect", {
    method: "POST",
  })
}

export async function updateInventoryFromReceipt(): Promise<ApiResponse<{ status: string }>> {
  return fetchFromJavaBackend<{ status: string }>("/api/inventory/records/update-from-receipt", {
    method: "POST",
  })
}

// ============================================================================
// AUDIT APIs
// ============================================================================

export interface AuditRequest {
  auditId: string
  description: string
  status: string
  createdAt: string
}

export interface AuditReport {
  auditId: string
  findings: any[]
  generatedAt: string
}

export async function initiateAudit(): Promise<ApiResponse<AuditRequest>> {
  return fetchFromJavaBackend<AuditRequest>("/api/inventory/audits/initiate", {
    method: "POST",
  })
}

export async function submitAuditData(auditId: string): Promise<ApiResponse<{ status: string }>> {
  return fetchFromJavaBackend<{ status: string }>(`/api/inventory/audits/${auditId}/data`, { method: "POST" })
}

export async function getAuditReport(auditId: string): Promise<ApiResponse<AuditReport>> {
  return fetchFromJavaBackend<AuditReport>(`/api/inventory/audits/${auditId}/report`)
}
