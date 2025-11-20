# Enterprise Warehouse API Reference

This documentation is auto-generated based on the `WarehouseApiServer` Java implementation.

## Base URL
`http://localhost:4567/api`

## Procurement

### Create Purchase Order
**POST** `/procurement/purchase-orders`
- **Triggers**: Creates a requisition for "ITEM-001", auto-approves it, and generates a PO.
- **Returns**: `PurchaseOrder` object.

### Approve Requisition
**PUT** `/procurement/requisitions/:id/approve`
- **Params**: `id` (Requisition ID)
- **Logic**: Finds best supplier, sets status to APPROVED.
- **Returns**: Updated `PurchaseRequisition`.

### Get Purchase Order
**GET** `/procurement/purchase-orders/:id`
- **Returns**: `PurchaseOrder` or 404 Error.

### Reject Requisition
**PUT** `/procurement/requisitions/:id/reject`
- **Returns**: Updated `PurchaseRequisition` with status REJECTED.

### Reorder Stock
**POST** `/procurement/reorder`
- **Triggers**: Creates requisition for "ITEM-002" (reorder point logic).
- **Returns**: `PurchaseRequisition`.

### Get Pending Requisitions
**GET** `/procurement/requisitions/pending`
- **Returns**: Array of `PurchaseRequisition`.

## Warehouse & Inventory

### Receive Shipment
**POST** `/warehouse/shipments/receive`
- **Returns**: Status object with `shipmentId`.

### Inspect Goods (QC)
**POST** `/warehouse/qc/inspect`
- **Logic**: Simulates QC process. If pass -> GRN. If fail -> Quarantine.
- **Returns**: `GoodsReceivedNote` or Error Status.

### Update Inventory from Receipt
**POST** `/inventory/records/update-from-receipt`
- **Logic**: Updates stock levels, bin locations, and costs.
- **Returns**: Status message.

### Store Item
**POST** `/warehouse/storage/store-item`
- **Logic**: Checks warehouse capacity and assigns bin.
- **Returns**: Status message.

### Get Stock Level
**GET** `/inventory/stock-levels/:itemId`
- **Returns**: `InventoryRecord`.

### Run Stock Monitor
**POST** `/inventory/stock-monitor/run`
- **Returns**: List of `StockAlert` objects for low stock items.

### Adjust Stock
**PUT** `/inventory/stock-levels/adjust`
- **Returns**: Status message.

### Get Warehouse Capacity
**GET** `/warehouse/capacity`
- **Returns**: `Warehouse` object with storage details.

## Picking, Packing & Shipping

### Create Pick List
**POST** `/warehouse/picking/create-picklist/:orderId`
- **Returns**: `PickList`.

### Assign Picker
**PUT** `/warehouse/picking/picklists/:id/assign/:pickerId`
- **Returns**: Status message.

### Record Picked Item
**PUT** `/warehouse/picking/picklists/:listId/items/:itemId/:quantity`
- **Returns**: Status message.

### Pack Order
**POST** `/warehouse/packing/pack-order/:pickListId`
- **Returns**: `Package`.

### Get Package
**GET** `/warehouse/packing/packages/:id`
- **Returns**: `Package`.

### Generate Shipping Label
**POST** `/shipping/labels/generate/:packageId/:carrierId/:serviceLevel`
- **Logic**: Verifies package, generates label, marks as LABELED, adds to Dispatch.
- **Returns**: `ShippingLabel`.

### Get Shipping Label
**GET** `/shipping/labels/:id`
- **Returns**: `ShippingLabel`.

### Create Dispatch Manifest
**POST** `/shipping/dispatch/create-manifest/:carrierId`
- **Logic**: Aggregates all LABELED packages for the carrier.
- **Returns**: `DispatchManifest`.

### Handover Manifest
**PUT** `/shipping/dispatch/manifests/:id/handover`
- **Returns**: Status message.

### Track Shipment
**GET** `/shipping/tracking/:trackingId`
- **Returns**: `ShipmentRecord`.

## Returns & Audits

### Initiate Return
**POST** `/returns/initiate`
- **Returns**: `ReturnRequest`.

### Approve Return
**PUT** `/returns/requests/:id/approve`
- **Returns**: Status message.

### Process Received Return
**POST** `/returns/process-received/:returnId`
- **Logic**: Restocks item if approved.
- **Returns**: Status message.

### Initiate Audit
**POST** `/inventory/audits/initiate`
- **Returns**: `AuditRequest`.

### Submit Audit Data
**POST** `/inventory/audits/:id/data`
- **Returns**: Status message.

### Get Audit Report
**GET** `/inventory/audits/:id/report`
- **Returns**: `AuditReport`.
