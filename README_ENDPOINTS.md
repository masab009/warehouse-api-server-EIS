## PROCUREMENT

### 1️⃣ POST `/api/procurement/purchase-orders`

**Success (201)** – returns `PurchaseOrder`:

```json
{
  "purchaseOrderId": "PO-1732986590123",
  "requisitionId": "PR-1732986589000",
  "supplierId": "SUP-01",
  "supplierName": "TechDistro",
  "orderItems": [
    {
      "itemId": "ITEM-001",
      "itemName": "Laptop",
      "quantity": 50,
      "unitPrice": 42.13,
      "lineTotal": 2106.5
    }
  ],
  "totalAmount": 2106.5,
  "orderDate": "2025-11-30T21:24:22.123",
  "status": "CREATED"
}
```

**Error (400)**:

```json
{ "error": "Item does not need reordering" }
```

or

```json
{ "error": "Requisition approval failed" }
```

or

```json
{ "error": "Failed to generate purchase order" }
```

**TS**:

```ts
export interface PurchaseOrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PurchaseOrder {
  purchaseOrderId: string;
  requisitionId: string;
  supplierId: string;
  supplierName: string;
  orderItems: PurchaseOrderItem[];
  totalAmount: number;
  orderDate: string; // ISO
  status: string;
}
```

---

### 2️⃣ PUT `/api/procurement/requisitions/:id/approve`

**Success (200)** – `PurchaseRequisition`:

```json
{
  "requisitionId": "PR-1732986589000",
  "itemId": "ITEM-001",
  "itemName": "Laptop",
  "createdBy": "API_CALL",
  "justification": "Stock level (5) is below reorder point (20)",
  "status": "APPROVED"
}
```

**Error (404)**:

```json
{ "error": "Requisition not found or cannot be approved" }
```

**TS**:

```ts
export interface PurchaseRequisition {
  requisitionId: string;
  itemId: string;
  itemName: string;
  createdBy: string;
  justification: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
}
```

---

### 3️⃣ GET `/api/procurement/purchase-orders/:id`

**Success (200)** – same as `PurchaseOrder` above.

**Error (404)**:

```json
{ "error": "Purchase Order not found" }
```

---

### 4️⃣ PUT `/api/procurement/requisitions/:id/reject`

**Success (200)** – `PurchaseRequisition` with `status: "REJECTED"` (same shape as #2).

**Error (404)**:

```json
{ "error": "Requisition not found" }
```

---

### 5️⃣ POST `/api/procurement/reorder`

**Success (200)** – `PurchaseRequisition` (for `ITEM-002`):

```json
{
  "requisitionId": "PR-1732986600000",
  "itemId": "ITEM-002",
  "itemName": "Mouse",
  "createdBy": "API_CALL",
  "justification": "Stock level (8) is below reorder point (10)",
  "status": "PENDING"
}
```

**Error (400)**:

```json
{ "error": "Item does not need reordering" }
```

---

### 6️⃣ GET `/api/procurement/requisitions/pending`

**Success (200)** – array of `PurchaseRequisition`:

```json
[
  {
    "requisitionId": "PR-1732986600000",
    "itemId": "ITEM-002",
    "itemName": "Mouse",
    "createdBy": "API_CALL",
    "justification": "Stock level (8) is below reorder point (10)",
    "status": "PENDING"
  }
]
```

**TS**:

```ts
export type PendingRequisitionsResponse = PurchaseRequisition[];
```

---

## INBOUND / RECEIVING / QC

### 7️⃣ POST `/api/warehouse/shipments/receive`

**Success (201)**:

```json
{
  "status": "Shipment received and checked",
  "shipmentId": 123
}
```

(no explicit error path here)

---

### 8️⃣ POST `/api/warehouse/qc/inspect`

**Success – PASS (200)** – `GoodsReceivedNote`:

```json
{
  "grnId": "GRN-1732986605000",
  "batch": {
    "sku": "SKU-LAPTOP-001",
    "batchId": "BATCH-123",
    "quantity": 100
  },
  "date": "2025-12-01"
}
```

**Success – FAIL (200)**:

```json
{
  "status": "Inspection failed",
  "outcome": "Quarantined"
}
```

**TS**:

```ts
export interface GoodsBatch {
  sku: string;
  batchId: string;
  quantity: number;
}

export interface GoodsReceivedNote {
  grnId: string;
  batch: GoodsBatch;
  date: string; // YYYY-MM-DD
}

export type InspectResponse =
  | GoodsReceivedNote
  | { status: string; outcome: string };
```

---

### 9️⃣ POST `/api/inventory/records/update-from-receipt`

**Success (200)**:

```json
{
  "status": "Inventory updated successfully for GRN GRN-12345"
}
```

(no explicit error)

---

## STORAGE / INVENTORY

### 🔟 POST `/api/warehouse/storage/store-item`

**Success (200)**:

```json
{ "status": "Storage successful: true" }
```

**Error (400)**:

```json
{ "status": "Storage failed. Check item, warehouse, or available space." }
```

---

### 1️⃣1️⃣ GET `/api/inventory/stock-levels/:itemId`

**Success (200)** – `InventoryRecord`:

```json
{
  "recordId": "IR-001",
  "itemId": "ITEM-001",
  "warehouseId": "WH-1",
  "locationId": "A1-01",
  "quantityOnHand": 30,
  "lastUpdated": "2025-12-01T21:24:22.123"
}
```

**Error (404)**:

```json
{ "error": "Item not found in inventory" }
```

**TS**:

```ts
export interface InventoryRecord {
  recordId: string;
  itemId: string;
  warehouseId: string;
  locationId: string;
  quantityOnHand: number;
  lastUpdated: string; // ISO
}
```

---

### 1️⃣2️⃣ POST `/api/inventory/stock-monitor/run`

**Success (200)** – array of `StockAlert`:

```json
[
  {
    "alertId": "ALERT-1732986610000",
    "itemId": "ITEM-002",
    "currentQuantity": 8
  }
]
```

**TS**:

```ts
export interface StockAlert {
  alertId: string;
  itemId: string;
  currentQuantity: number;
}

export type StockMonitorResponse = StockAlert[];
```

---

### 1️⃣3️⃣ PUT `/api/inventory/stock-levels/adjust`

**Success (200)**:

```json
{
  "status": "Inventory for SKU-XYZ adjusted successfully."
}
```

---

## PICKING & PACKING

### 1️⃣4️⃣ POST `/api/warehouse/picking/create-picklist/:orderId`

**Success (200)** – `PickList`:

```json
{
  "pickListId": "PL-1732986615000",
  "orderId": "ORD-1001",
  "status": "PENDING"
}
```

**Error (400)**:

```json
{ "error": "Order not found or not ready for picking" }
```

**TS**:

```ts
export interface PickList {
  pickListId: string;
  orderId: string;
  status: string; // PENDING | ASSIGNED | COMPLETED | ...
}
```

---

### 1️⃣5️⃣ PUT `/api/warehouse/picking/picklists/:id/assign/:pickerId`

**Success (200)**:

```json
{
  "status": "Picklist PL-1732986615000 assigned to PICKER-01"
}
```

**Error (400)**:

```json
{
  "error": "Picklist not available for assignment or picker not found"
}
```

---

### 1️⃣6️⃣ PUT `/api/warehouse/picking/picklists/:listId/items/:itemId/:quantity`

**Success (200)**:

```json
{
  "status": "Item ITEM-001 on list PL-1732986615000 marked as picked with quantity 1"
}
```

**Error (400)**:

```json
{
  "error": "Could not record picked item. Check picklist status or item ID."
}
```

---

### 1️⃣7️⃣ POST `/api/warehouse/packing/pack-order/:pickListId`

**Success (200)** – `Package`:

```json
{
  "packageId": "PKG-1732986620000",
  "orderId": "ORD-1001",
  "pickListId": "PL-1732986615000",
  "packageType": "BOX",
  "status": "PACKING"
}
```

**Errors**:

* (404) `{ "error": "Picklist not found" }`
* (400) `{ "error": "Could not create package. Picklist might not be complete." }`

**TS**:

```ts
export interface PackageDto {
  packageId: string;
  orderId: string;
  pickListId: string;
  packageType: string;
  status: string; // PACKING | VERIFIED | LABELED | ...
}
```

---

### 1️⃣8️⃣ GET `/api/warehouse/packing/packages/:id`

**Success (200)** – same `PackageDto` as above.

**Error (404)**:

```json
{ "error": "Package not found" }
```

---

## LABELING & DISPATCH

### 1️⃣9️⃣ POST `/api/shipping/labels/generate/:packageId/:carrierId/:serviceLevel`

**Success (200)** – `ShippingLabel`:

```json
{
  "labelId": "LBL-1732986625000"
}
```

**Errors**:

* (404) `{ "error": "Package not found" }`
* (400) `{ "error": "Could not generate label. Check package status, carrier, or customer address." }`

**TS**:

```ts
export interface ShippingLabel {
  labelId: string;
}
```

---

### 2️⃣0️⃣ GET `/api/shipping/labels/:id`

**Success (200)** – same `ShippingLabel`.

**Error (404)**:

```json
{ "error": "Label not found" }
```

---

### 2️⃣1️⃣ POST `/api/shipping/dispatch/create-manifest/:carrierId`

**Success (200)** – `DispatchManifest`:

```json
{
  "manifestId": "MAN-1732986630000"
}
```

**Error (400)**:

```json
{ "error": "No packages ready for dispatch for this carrier." }
```

**TS**:

```ts
export interface DispatchManifest {
  manifestId: string;
}
```

---

### 2️⃣2️⃣ PUT `/api/shipping/dispatch/manifests/:id/handover`

**Success (200)**:

```json
{
  "status": "Manifest MAN-1732986630000 handed over to courier."
}
```

**Error (400)**:

```json
{ "error": "Manifest not found or not ready for pickup." }
```

---

### 2️⃣3️⃣ GET `/api/shipping/tracking/:trackingId`

**Success (200)** – `ShipmentRecord`:

```json
{
  "shipmentId": "TRACK-123",
  "origin": "Warehouse",
  "destination": "Customer City",
  "status": "In Transit"
}
```

**TS**:

```ts
export interface ShipmentRecord {
  shipmentId: string;
  origin: string;
  destination: string;
  status: string;
}
```

---

## RETURNS

### 2️⃣4️⃣ POST `/api/returns/initiate`

**Success (200)** – `ReturnRequest` (or `null` in a weird edge case):

```json
{
  "returnId": "RET-1732986635000",
  "customer": {
    "id": "CUST-001",
    "name": "John Doe"
  },
  "goods": {
    "productName": null,
    "quantity": 0,
    "received": false,
    "sku": "SKU-LAPTOP-001",
    "description": "A very fine laptop"
  },
  "reason": "No longer needed",
  "status": "PENDING"
}
```

**TS**:

```ts
export interface ReturnCustomer {
  id: string;
  name: string;
}

export interface ReturnGoods {
  productName: string | null;
  quantity: number;
  received: boolean;
  sku: string;
  description: string;
}

export interface ReturnRequestDto {
  returnId: string;
  customer: ReturnCustomer;
  goods: ReturnGoods;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | string;
}
```

---

### 2️⃣5️⃣ PUT `/api/returns/requests/:id/approve`

**Success (200)**:

```json
{
  "status": "Return request RET-1732986635000 approved."
}
```

**Error (404)**:

```json
{ "error": "Return request not found." }
```

---

### 2️⃣6️⃣ POST `/api/returns/process-received/:returnId`

**Success (200)**:

```json
{
  "status": "Return processed and item restocked."
}
```

**Errors (400)**:

```json
{ "status": "Return request not found." }
```

or

```json
{ "status": "Return request not approved." }
```

---

## INVENTORY AUDITS

### 2️⃣7️⃣ POST `/api/inventory/audits/initiate`

**Success (200)** – `AuditRequest`:

```json
{
  "requestId": "AUDIT-42",
  "description": "Cycle count for electronics aisle"
}
```

**TS**:

```ts
export interface AuditRequest {
  requestId: string;
  description: string;
}
```

---

### 2️⃣8️⃣ POST `/api/inventory/audits/:id/data`

**Success (200)**:

```json
{
  "status": "Data for audit AUDIT-42 received."
}
```

---

### 2️⃣9️⃣ GET `/api/inventory/audits/:id/report`

**Success (200)** – `AuditReport`:

```json
{
  "reportId": "RPT-AUDIT-42",
  "valid": true,
  "details": "Audit successful for item: SKU-LAPTOP-001"
}
```

**Error (404)**:

```json
{ "error": "Audit request or data not found." }
```

**TS**:

```ts
export interface AuditReport {
  reportId: string;
  valid: boolean;
  details: string;
}
```

---

## CAPACITY & PERSONNEL

### 3️⃣0️⃣ GET `/api/warehouse/capacity`

**Success (200)** – `Warehouse`:

```json
{
  "warehouseId": "WH-1",
  "name": "Main Warehouse",
  "address": "123 Supply Chain St",
  "totalCapacity": 10000,
  "usedCapacity": 0,
  "storageLocations": {
    // initially empty object; will fill as you store items
  }
}
```

**TS** (this is likely what your `java-api.ts` is assuming):

```ts
export interface StorageLocationDto {
  locationId: string;
  capacity: number;
  usedSpace: number;
  storedItemIds: string[];
}

export interface WarehouseCapacity {
  warehouseId: string;
  name: string;
  address: string;
  totalCapacity: number;
  usedCapacity: number;
  storageLocations: Record<string, StorageLocationDto>;
}
```

---

### 3️⃣1️⃣ GET `/api/warehouse/personnel/pickers`

**Success (200)** – list of picker IDs:

```json
["PICKER-01", "PICKER-02"]
```

**TS**:

```ts
export type PickerListResponse = string[];
```

---