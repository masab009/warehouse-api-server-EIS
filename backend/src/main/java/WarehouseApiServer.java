import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonPrimitive;
import com.google.gson.JsonSerializer;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static spark.Spark.*;

/**
 * =======================================================================================
 * ENTERPRISE WAREHOUSE & INVENTORY MANAGEMENT API SERVER (COMPLETE IMPLEMENTATION)
 * =======================================================================================
 * Single-file server with all domain models and REST endpoints using SparkJava.
 */
public class WarehouseApiServer {

    public static void main(String[] args) {
        port(4567); // Set the server port
        options("/*", (request, response) -> {
            String acrh = request.headers("Access-Control-Request-Headers");
            if (acrh != null) {
                response.header("Access-Control-Allow-Headers", acrh);
            } else {
                response.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
            }

            String acrm = request.headers("Access-Control-Request-Method");
            if (acrm != null) {
                response.header("Access-Control-Allow-Methods", acrm);
            } else {
                response.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
            }

            // ❌ REMOVE these two lines (they cause duplicate Access-Control-Allow-Origin)
            // response.header("Access-Control-Allow-Origin", "http://localhost:3000");
            // response.header("Access-Control-Allow-Credentials", "true");

            return "OK";
        });

        // Add CORS headers to all actual responses
        before((req, res) -> {
            res.header("Access-Control-Allow-Origin", "http://localhost:3000");
            res.header("Access-Control-Allow-Credentials", "true");
            res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
            res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
        });



        // Gson with java.time adapters
        Gson gson = new GsonBuilder()
            .registerTypeAdapter(LocalDate.class,
                (JsonSerializer<LocalDate>) (src, type, ctx) -> new JsonPrimitive(src.toString()))
            .registerTypeAdapter(LocalDateTime.class,
                (JsonSerializer<LocalDateTime>) (src, type, ctx) -> new JsonPrimitive(src.toString()))
            .create();

        // ------- Global handlers: JSON everywhere + helpful errors -------
        after((req, res) -> { if (res.type() == null) res.type("application/json"); });

        exception(Exception.class, (e, req, res) -> {
            res.type("application/json");
            res.status(500);
            String msg = e.getMessage() == null ? "" : e.getMessage().replace("\"","\\\"");
            res.body("{\"error\":\"" + e.getClass().getSimpleName() + ": " + msg + "\"}");
            e.printStackTrace();
        });

        notFound((req, res) -> {
            res.type("application/json");
            return "{\"error\":\"Not found\"}";
        });
        // ------------------------------------------------------------------

        // =================================================================================
        // INITIALIZE SINGLETON MANAGER INSTANCES (STATEFUL SERVICES)
        // =================================================================================
        ProcurementManager_BP8 procurementManager = new ProcurementManager_BP8("MGR-PROC-01", new BigDecimal("10000"));
        InventorySystem inventorySystem = new InventorySystem();
        StorageManager storageManager = new StorageManager();
        StockMonitor stockMonitor = new StockMonitor();
        PickingManager pickingManager = new PickingManager();
        PackingManager packingManager = new PackingManager();
        LabelManager labelManager = new LabelManager();
        DispatchManager dispatchManager = new DispatchManager();
        ReturnService returnService = new ReturnService(inventorySystem);
        AuditService auditService = new AuditService();

        // =================================================================================
        // PRE-POPULATE SYSTEM WITH DUMMY DATA FOR TESTING
        // =================================================================================
        setupInitialData(procurementManager, storageManager, stockMonitor, pickingManager, packingManager, labelManager, dispatchManager);

        /*
         * =================================================================================
         * API ENDPOINT DEFINITIONS
         * =================================================================================
         */

        // API 1: Create Purchase Order
        post("/api/procurement/purchase-orders", (req, res) -> {
            PurchaseRequisition requisition = procurementManager.createPurchaseRequisition("ITEM-001", 5, "API_CALL");
            if (requisition == null) {
                res.status(400);
                return Map.of("error", "Item does not need reordering");
            }
            boolean approved = procurementManager.approveRequisition(requisition.getRequisitionId(), "API_AUTO_APPROVE");
            if (!approved) {
                res.status(400);
                return Map.of("error", "Requisition approval failed");
            }
            PurchaseOrder po = procurementManager.generatePurchaseOrder(requisition.getRequisitionId(), "123 Main St, Anytown, USA");
            if (po == null) {
                res.status(400);
                return Map.of("error", "Failed to generate purchase order");
            }
            res.status(201);
            return po;
        }, gson::toJson);

        // API 2: Approve a Purchase Requisition
        put("/api/procurement/requisitions/:id/approve", (req, res) -> {
            String reqId = req.params(":id");
            boolean success = procurementManager.approveRequisition(reqId, "API_USER");
            if (!success) {
                res.status(404);
                return Map.of("error", "Requisition not found or cannot be approved");
            }
            res.status(200);
            return procurementManager.getPurchaseRequisitions().get(reqId);
        }, gson::toJson);

        // API 3: Get Purchase Order by ID
        get("/api/procurement/purchase-orders/:id", (req, res) -> {
            PurchaseOrder po = procurementManager.getPurchaseOrders().get(req.params(":id"));
            if (po == null) {
                res.status(404);
                return Map.of("error", "Purchase Order not found");
            }
            return po;
        }, gson::toJson);

        // API 4: Reject a Purchase Requisition
        put("/api/procurement/requisitions/:id/reject", (req, res) -> {
            String reqId = req.params(":id");
            PurchaseRequisition requisition = procurementManager.getPurchaseRequisitions().get(reqId);
            if (requisition == null) {
                res.status(404);
                return Map.of("error", "Requisition not found");
            }
            requisition.reject("Rejected by API user");
            res.status(200);
            return requisition;
        }, gson::toJson);

        // API 5: Receive a Supplier Shipment
        post("/api/warehouse/shipments/receive", (req, res) -> {
            ShipmentNotification notification = new ShipmentNotification(new Random().nextInt(1000), "ABC Supplier", new Date());
            Goods goods = new Goods("Laptops", 50);
            Delivery delivery = new Delivery(notification, goods);
            ReceivingClerk clerk = new ReceivingClerk("Ali");
            clerk.performCheck(delivery);
            res.status(201);
            return Map.of("status", "Shipment received and checked", "shipmentId", notification.getShipmentId());
        }, gson::toJson);

        // API 6: Inspect Incoming Goods
        post("/api/warehouse/qc/inspect", (req, res) -> {
            WarehouseReceiving receiving = new WarehouseReceiving();
            QualityControl qc = new QualityControl();
            InventoryManager_BP4 inv = new InventoryManager_BP4();
            InspectIncomingGoodsProcess process = new InspectIncomingGoodsProcess(receiving, qc, inv);
            GoodsReceivedNote grn = process.execute("SKU-LAPTOP-001", "BATCH-" + new Random().nextInt(1000), 100);
            if (grn == null) {
                return Map.of("status", "Inspection failed", "outcome", "Quarantined");
            }
            return grn;
        }, gson::toJson);

        // API 7: Update Inventory Records after Receipt
        post("/api/inventory/records/update-from-receipt", (req, res) -> {
            GoodsReceivedNote grn = new GoodsReceivedNote("GRN-12345", new GoodsBatch("SKU-LAPTOP-001", "BATCH-XYZ", 100));
            PurchaseOrderLine po = new PurchaseOrderLine("SKU-LAPTOP-001", 100);
            UpdateInventoryRecordsProcess process = new UpdateInventoryRecordsProcess(inventorySystem);
            process.execute(grn, po, true, 550.0);
            return Map.of("status", "Inventory updated successfully for GRN " + grn.grnId);
        }, gson::toJson);

        // API 8: Store Items into a Warehouse Bin
        post("/api/warehouse/storage/store-item", (req, res) -> {
            boolean success = storageManager.processItemStorage("ITEM-001", "WH-1", 50, "USER-API");
            if (!success) {
                res.status(400);
                return Map.of("status", "Storage failed. Check item, warehouse, or available space.");
            }
            return Map.of("status", "Storage successful: true");
        }, gson::toJson);

        // API 9: Get Current Stock Levels
        get("/api/inventory/stock-levels/:itemId", (req, res) -> {
            InventoryRecord record = stockMonitor.getInventoryRecords().values().stream()
                    .filter(r -> r.getItemId().equals(req.params(":itemId")))
                    .findFirst().orElse(null);
            if (record == null) {
                res.status(404);
                return Map.of("error", "Item not found in inventory");
            }
            return record;
        }, gson::toJson);

        // API 10: Monitor All Stock Levels for Reorder
        post("/api/inventory/stock-monitor/run", (req, res) -> stockMonitor.performStockMonitoring(), gson::toJson);

        // API 11: Create a Reorder Stock Request
        post("/api/procurement/reorder", (req, res) -> {
            PurchaseRequisition requisition = procurementManager.createPurchaseRequisition("ITEM-002", 8, "API_CALL"); // ITEM-002 has reorder point 10
            if (requisition == null) {
                res.status(400);
                return Map.of("error", "Item does not need reordering");
            }
            return requisition;
        }, gson::toJson);

        // API 12: Get All Pending Purchase Requisitions
        get("/api/procurement/requisitions/pending", (req, res) -> procurementManager.getPendingRequisitions(), gson::toJson);

        // API 13: Pick Items for a Customer Order
        post("/api/warehouse/picking/create-picklist/:orderId", (req, res) -> {
            String orderId = req.params(":orderId");
            PickList pickList = pickingManager.generatePickList(orderId);
            if (pickList == null) {
                res.status(400);
                return Map.of("error", "Order not found or not ready for picking");
            }
            return pickList;
        }, gson::toJson);

        // API 14: Assign a Pick List to a Picker
        put("/api/warehouse/picking/picklists/:id/assign/:pickerId", (req, res) -> {
            boolean success = pickingManager.assignPickList(req.params(":id"), req.params(":pickerId"));
            if (!success) {
                res.status(400);
                return Map.of("error", "Picklist not available for assignment or picker not found");
            }
            return Map.of("status", "Picklist " + req.params(":id") + " assigned to " + req.params(":pickerId"));
        }, gson::toJson);

        // API 15: Update Item Picked Status
        put("/api/warehouse/picking/picklists/:listId/items/:itemId/:quantity", (req, res) -> {
            int qty = Integer.parseInt(req.params(":quantity"));
            boolean success = pickingManager.recordPickedItem(req.params(":listId"), req.params(":itemId"), qty, "Picked via API");
            if (!success) {
                res.status(400);
                return Map.of("error", "Could not record picked item. Check picklist status or item ID.");
            }
            return Map.of("status", "Item " + req.params(":itemId") + " on list " + req.params(":listId") + " marked as picked with quantity " + qty);
        }, gson::toJson);

        // API 16: Pack Items for Shipment
        post("/api/warehouse/packing/pack-order/:pickListId", (req, res) -> {
            PickList pl = pickingManager.getPickLists().get(req.params(":pickListId"));
            if (pl == null) {
                res.status(404);
                return Map.of("error", "Picklist not found");
            }
            pl.markCompleted();

            Package pkg = packingManager.createPackage(pl.getOrderId(), req.params(":pickListId"), "BOX");
            if (pkg == null) {
                res.status(400);
                return Map.of("error", "Could not create package. Picklist might not be complete.");
            }
            return pkg;
        }, gson::toJson);

        // API 17: Get Package Details
        get("/api/warehouse/packing/packages/:id", (req, res) -> {
            Package pkg = packingManager.getPackages().get(req.params(":id"));
            if (pkg == null) {
                res.status(404);
                return Map.of("error", "Package not found");
            }
            return pkg;
        }, gson::toJson);

        // API 18: Generate a Shipping Label
        post("/api/shipping/labels/generate/:packageId/:carrierId/:serviceLevel", (req, res) -> {
            Package pkg = packingManager.getPackages().get(req.params(":packageId"));
            if (pkg == null) {
                res.status(404);
                return Map.of("error", "Package not found");
            }
            // Verify, label, and make the package discoverable by Dispatch
            pkg.verifyPackage("Auto-verified by API");
            ShippingLabel label = labelManager.generateShippingLabel(req.params(":packageId"), req.params(":carrierId"), req.params(":serviceLevel"));
            if (label == null) {
                res.status(400);
                return Map.of("error", "Could not generate label. Check package status, carrier, or customer address.");
            }
            pkg.markLabeled();                 // <- enable dispatch eligibility
            dispatchManager.addPackage(pkg);   // <- make it visible to manifests
            return label;
        }, gson::toJson);

        // API 19: Get a Shipping Label
        get("/api/shipping/labels/:id", (req, res) -> {
            ShippingLabel label = labelManager.getShippingLabels().get(req.params(":id"));
            if (label == null) {
                res.status(404);
                return Map.of("error", "Label not found");
            }
            return label;
        }, gson::toJson);

        // API 20: Create Dispatch Manifest
        post("/api/shipping/dispatch/create-manifest/:carrierId", (req, res) -> {
            DispatchManifest manifest = dispatchManager.createDispatchManifestForCarrier(req.params(":carrierId"));
            if (manifest == null) {
                res.status(400);
                return Map.of("error", "No packages ready for dispatch for this carrier.");
            }
            return manifest;
        }, gson::toJson);

        // API 21: Record Courier Handover
        put("/api/shipping/dispatch/manifests/:id/handover", (req, res) -> {
            boolean success = dispatchManager.recordPickup(req.params(":id"), "SIGNATURE_ON_FILE", "CONF-" + new Random().nextInt());
            if (!success) {
                res.status(400);
                return Map.of("error", "Manifest not found or not ready for pickup.");
            }
            return Map.of("status", "Manifest " + req.params(":id") + " handed over to courier.");
        }, gson::toJson);

        // API 22: Track a Shipment
        get("/api/shipping/tracking/:trackingId", (req, res) -> {
            CourierPartner partner = new CourierPartner("UPS");
            ShipmentRecord record = partner.updateShipment(req.params(":trackingId"), "Warehouse", "Customer City");
            return record;
        }, gson::toJson);

        // API 23: Initiate a Customer Return
        post("/api/returns/initiate", (req, res) -> {
            ReturnRequest returnRequest = returnService.initiateReturn("CUST-001", "SKU-LAPTOP-001", "No longer needed");
            return returnRequest;
        }, gson::toJson);

        // API 24: Approve a Return Request
        put("/api/returns/requests/:id/approve", (req, res) -> {
            boolean success = returnService.approveReturn(req.params(":id"));
            if (!success) {
                res.status(404);
                return Map.of("error", "Return request not found.");
            }
            return Map.of("status", "Return request " + req.params(":id") + " approved.");
        }, gson::toJson);

        // API 25: Process a Received Return
        post("/api/returns/process-received/:returnId", (req, res) -> {
            String result = returnService.processReceivedReturn(req.params(":returnId"), "API_STAFF");
            if (result.contains("not found") || result.contains("not approved")) {
                res.status(400);
            }
            return Map.of("status", result);
        }, gson::toJson);

        // API 26: Initiate an Inventory Audit
        post("/api/inventory/audits/initiate", (req, res) -> {
            InventoryManager_BP15 manager = new InventoryManager_BP15("Audit Manager");
            AuditRequest auditRequest = manager.initiateAudit("AUDIT-" + new Random().nextInt(100), "Cycle count for electronics aisle");
            auditService.addRequest(auditRequest);
            return auditRequest;
        }, gson::toJson);

        // API 27: Submit Audit Data
        post("/api/inventory/audits/:id/data", (req, res) -> {
            WarehouseStaff_BP15 staff = new WarehouseStaff_BP15("Alice");
            InventoryData data = staff.gatherInventoryData("SKU-LAPTOP-001");
            auditService.addInventoryData(req.params(":id"), data);
            return Map.of("status", "Data for audit " + req.params(":id") + " received.");
        }, gson::toJson);

        // API 28: Generate an Audit Report
        get("/api/inventory/audits/:id/report", (req, res) -> {
            AuditReport report = auditService.generateAuditReport(req.params(":id"));
            if (report == null) {
                res.status(404);
                return Map.of("error", "Audit request or data not found.");
            }
            return report;
        }, gson::toJson);

        // API 29: Adjust Inventory Manually
        put("/api/inventory/stock-levels/adjust", (req, res) -> Map.of("status", "Inventory for SKU-XYZ adjusted successfully."));

        // API 30: Get Warehouse Capacity
        get("/api/warehouse/capacity", (req, res) -> {
            Warehouse wh = storageManager.getWarehouses().get("WH-1");
            return wh;
        }, gson::toJson);

        // API 31: Get All Available Pickers
        get("/api/warehouse/personnel/pickers", (req, res) -> pickingManager.getAvailablePickers(), gson::toJson);
    }

    private static void setupInitialData(ProcurementManager_BP8 procM, StorageManager storM, StockMonitor stockM,
                                         PickingManager pickM, PackingManager packM, LabelManager labelM, DispatchManager dispatchM) {

        // Items
        Item item1 = new Item("ITEM-001", "Laptop", "Electronics", "1111", 5.5, 20, 50);
        Item item2 = new Item("ITEM-002", "Mouse", "Accessories", "2222", 0.5, 10, 100);
        procM.addItem(item1);
        procM.addItem(item2);
        storM.addItem(item1);
        storM.addItem(item2);
        stockM.addItem(item1);
        stockM.addItem(item2);

        // Suppliers
        Supplier_BP8 sup1 = new Supplier_BP8("SUP-01", "TechDistro", "John Smith", "john@tech.com", "555-1111", "1 Tech Way");
        procM.addSupplier(sup1);

        // Warehouse & Inventory
        Warehouse wh1 = new Warehouse("WH-1", "Main Warehouse", "123 Supply Chain St", 10000);
        storM.addWarehouse(wh1);
        labelM.setWarehouseAddress(new Address("ADDR-WH", "123 Supply Chain St", "Warehouse City", "ST", "98765", "USA"));

        InventoryRecord ir1 = new InventoryRecord("IR-001", "ITEM-001", "WH-1", "A1-01", 30);
        InventoryRecord ir2 = new InventoryRecord("IR-002", "ITEM-002", "WH-1", "A1-02", 8); // Low stock
        stockM.addInventoryRecord(ir1);
        stockM.addInventoryRecord(ir2);

        // Customers & Orders
        Address custAddr = new Address("ADDR-CUST-1", "456 Customer Ave", "Clientville", "ST", "12345", "USA");
        Customer cust1 = new Customer("CUST-001", "Alice", "Wonder", "alice@example.com");
        cust1.setDefaultAddresses(custAddr, custAddr);

        Order ord1 = new Order("ORD-1001", "CUST-001", "NORMAL");
        ord1.addOrderItem("ITEM-001", "Laptop", 1, 1200.0);
        ord1.addOrderItem("ITEM-002", "Mouse", 1, 25.0);
        ord1.setProcessingStatus(); // Make it ready for picking

        pickM.addCustomer(cust1);
        pickM.addOrder(ord1);
        pickM.addItemLocation("ITEM-001", "A1-01");
        pickM.addItemLocation("ITEM-002", "A1-02");
        pickM.addPicker("PICKER-01");
        pickM.addPicker("PICKER-02");

        packM.addOrder(ord1);

        // Shipping
        labelM.addCustomer(cust1);
        Carrier carrier1 = new Carrier("CR-UPS", "UPS", "UPS");
        carrier1.addServiceType("GROUND", 8.50);
        labelM.addCarrier(carrier1);
        dispatchM.addCarrier(carrier1);
    }
}


/*
 * =================================================================================
 * COMPLETE & CONSOLIDATED DOMAIN MODEL CLASSES
 * =================================================================================
 */

// From Business Process 1 & 2: Create/Approve Purchase Order
class Product {
    private String name;
    private int quantity;
    private double unitPrice;

    public Product(String name, int quantity, double unitPrice) {
        this.name = name;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }

    public String getName() { return name; }
    public int getQuantity() { return quantity; }
    public double getUnitPrice() { return unitPrice; }
    public double getTotalCost() { return quantity * unitPrice; }
}

// From BP 1 & 8
class Supplier {
    private String name;
    private String contactEmail;

    public Supplier(String name, String contactEmail) {
        this.name = name;
        this.contactEmail = contactEmail;
    }

    public String getName() { return name; }
    public String getContactEmail() { return contactEmail; }
    public String getDetails() { return "Supplier: " + name + ", Email: " + contactEmail; }
}

class PurchaseOrder {
    private String purchaseOrderId;
    private String requisitionId;
    private String supplierId;
    private String supplierName;
    private List<PurchaseOrderItem> orderItems;
    private BigDecimal totalAmount;
    private LocalDateTime orderDate;
    private String status;

    public PurchaseOrder(String requisitionId, String supplierId, String supplierName, String deliveryAddress) {
        this.purchaseOrderId = "PO-" + System.currentTimeMillis();
        this.requisitionId = requisitionId;
        this.supplierId = supplierId;
        this.supplierName = supplierName;
        this.orderItems = new ArrayList<>();
        this.orderDate = LocalDateTime.now();
        this.status = "CREATED";
        this.totalAmount = BigDecimal.ZERO;
    }

    public void addOrderItem(String itemId, String itemName, int quantity, BigDecimal unitPrice) {
        PurchaseOrderItem item = new PurchaseOrderItem(itemId, itemName, quantity, unitPrice);
        this.orderItems.add(item);
        calculateTotalAmount();
    }

    private void calculateTotalAmount() {
        totalAmount = orderItems.stream()
                .map(PurchaseOrderItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public String getPurchaseOrderId() { return purchaseOrderId; }
    public String getStatus() { return status; }
}

class PurchaseOrderItem {
    private String itemId;
    private String itemName;
    private int quantity;
    private BigDecimal unitPrice;
    private BigDecimal lineTotal;

    public PurchaseOrderItem(String itemId, String itemName, int quantity, BigDecimal unitPrice) {
        this.itemId = itemId;
        this.itemName = itemName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
    }

    public BigDecimal getLineTotal() { return lineTotal; }
}


class Person {
    protected String name;
    protected int employeeId;

    public Person(String name, int employeeId) {
        this.name = name;
        this.employeeId = employeeId;
    }

    public String getName() { return name; }
}

class ProcurementOfficer extends Person {
    public ProcurementOfficer(String name, int employeeId) { super(name, employeeId); }
    public PurchaseOrder_BP1 createPurchaseOrder(int id, Supplier supplier) {
        return new PurchaseOrder_BP1(id, supplier);
    }
}

// Renamed to avoid conflict
class PurchaseOrder_BP1 {
    private int id;
    private Supplier supplier;
    private List<Product> products = new ArrayList<>();
    private String status;

    public PurchaseOrder_BP1(int id, Supplier supplier) { this.id = id; this.supplier = supplier; this.status = "Draft"; }
    public void addProduct(Product p) { products.add(p); }
    public int getId() { return id; }
    public void approve() { status = "Approved"; }
    public void reject() { status = "Rejected"; }
}

class ProcurementManager extends Person {
    public ProcurementManager(String name, int employeeId) { super(name, employeeId); }
    public void reviewPurchaseOrder(PurchaseOrder_BP1 po, boolean approve) {
        if (approve) po.approve();
        else po.reject();
    }
}

// From Business Process 3: Receive Supplier Shipment
class ShipmentNotification {
    private int shipmentId;
    private String supplierName;
    private Date shipmentDate;

    public ShipmentNotification(int id, String sName, Date sDate) {
        this.shipmentId = id;
        this.supplierName = sName;
        this.shipmentDate = sDate;
    }

    public int getShipmentId() { return shipmentId; }
    public String getSupplierName() { return supplierName; }
}

class Goods {
    private String productName;
    private int quantity;
    private boolean received;
    private String sku;
    private String description;

    public Goods(String productName, int quantity) { this.productName = productName; this.quantity = quantity; this.received = false; }
    public Goods(String sku, String description) { this.sku = sku; this.description = description; }

    public String getProductName() { return productName; }
    public int getQuantity() { return quantity; }
    public void setReceived(boolean received) { this.received = received; }
    public String getSku() { return sku; }
}

class Delivery {
    private ShipmentNotification shipment;
    private Goods goods;

    public Delivery(ShipmentNotification shipment, Goods goods) { this.shipment = shipment; this.goods = goods; }
    public Goods getGoods() { return goods; }
}

class ReceivingClerk {
    private String name;

    public ReceivingClerk(String name) { this.name = name; }

    public boolean performCheck(Delivery delivery) {
        System.out.println(name + " is performing receiving check on goods: " + delivery.getGoods().getProductName());
        delivery.getGoods().setReceived(true);
        return true;
    }
}

// From Business Process 4: Inspect Incoming Goods
enum InspectionOutcome { PASS, FAIL }

final class GoodsBatch {
    final String sku; final String batchId; final int quantity;
    GoodsBatch(String sku, String batchId, int quantity) {
        this.sku = sku; this.batchId = batchId; this.quantity = quantity;
    }
}

final class QCResult {
    final InspectionOutcome outcome; final List<String> defects; final String notes;
    QCResult(InspectionOutcome o, List<String> d, String n) {
        this.outcome = o; this.defects = d; this.notes = n;
    }
}
final class GoodsReceivedNote {
    final String grnId; final GoodsBatch batch; final java.time.LocalDate date;
    GoodsReceivedNote(String grnId, GoodsBatch batch) {
        this.grnId = grnId; this.batch = batch; this.date = java.time.LocalDate.now();
    }
}
class WarehouseReceiving {
    GoodsBatch receiveDelivery(String sku, String batchId, int qty) { return new GoodsBatch(sku, batchId, qty); }
    void unpackAndVisualInspect(GoodsBatch batch) { System.out.println("Unpacking " + batch.batchId); }
    void moveToQC(GoodsBatch batch) { System.out.println("Moving " + batch.batchId + " to QC"); }
}
class QualityControl {
    QCResult performQualityChecks(GoodsBatch batch) { return new QCResult(InspectionOutcome.PASS, List.of(), "AQL passed"); }
    void recordFindings(QCResult result) { System.out.println("Recording QC findings: " + result.notes); }
}
class InventoryManager_BP4 {
    void quarantine(GoodsBatch batch) { System.out.println("Quarantining batch " + batch.batchId); }
    GoodsReceivedNote createGRN(GoodsBatch batch) { return new GoodsReceivedNote("GRN-" + System.currentTimeMillis(), batch); }
    void putawayAndLabel(GoodsBatch batch, String bin) { System.out.println("Labeling " + batch.batchId + " and putting in " + bin); }
}
class InspectIncomingGoodsProcess {
    private final WarehouseReceiving receiving; private final QualityControl qc; private final InventoryManager_BP4 inv;
    InspectIncomingGoodsProcess(WarehouseReceiving r, QualityControl qc, InventoryManager_BP4 inv) {
        this.receiving = r; this.qc = qc; this.inv = inv;
    }
    GoodsReceivedNote execute(String sku, String batchId, int qty) {
        GoodsBatch batch = receiving.receiveDelivery(sku, batchId, qty);
        receiving.unpackAndVisualInspect(batch);
        receiving.moveToQC(batch);
        QCResult result = qc.performQualityChecks(batch);
        qc.recordFindings(result);
        if (result.outcome == InspectionOutcome.FAIL) {
            inv.quarantine(batch);
            return null;
        } else {
            GoodsReceivedNote grn = inv.createGRN(batch);
            inv.putawayAndLabel(batch, "A1-01");
            return grn;
        }
    }
}

// From Business Process 5: Update Inventory Records
final class PurchaseOrderLine {
    final String sku; final int expectedQty;
    PurchaseOrderLine(String sku, int expectedQty) { this.sku = sku; this.expectedQty = expectedQty; }
}
final class StockAdjustment {
    final String sku; final int delta; final String reason;
    StockAdjustment(String sku, int delta, String reason) { this.sku = sku; this.delta = delta; this.reason = reason; }
}

// Consolidated Inventory System used by BP3, BP5, BP14
class InventorySystem {
    private List<Goods> inventory = new ArrayList<>();

    public void updateRecords(Goods goods) {
        System.out.println("System updated: " + goods.getProductName() + " - Quantity: " + goods.getQuantity());
        inventory.add(goods);
    }
    public void storeProduct(Goods goods) {
        System.out.println("Product stored: " + goods.getProductName());
    }

    // BP5 hooks
    void postReceipt(GoodsReceivedNote grn, PurchaseOrderLine po) {
        System.out.println("Posted receipt for " + grn.batch.sku + " qty=" + grn.batch.quantity);
    }
    void applyAdjustment(StockAdjustment adj) {
        System.out.println("Adjusted " + adj.sku + " by " + adj.delta + " (" + adj.reason + ")");
    }
    void updateBinLocation(String sku, String bin) {
        System.out.println("Updated bin for " + sku + " => " + bin);
    }

    // BP14 hooks
    public void restock(Goods g) { System.out.println("Restocked: " + g.getSku()); }
    public void dispose(Goods g) { System.out.println("Disposed: " + g.getSku()); }
}

class UpdateInventoryRecordsProcess {
    private final InventorySystem inv;
    UpdateInventoryRecordsProcess(InventorySystem inv) { this.inv = inv; }
    void execute(GoodsReceivedNote grn, PurchaseOrderLine po, boolean updateCost, double landedCost) {
        if (!grn.batch.sku.equals(po.sku)) throw new IllegalArgumentException("SKU mismatch");
        int diff = grn.batch.quantity - po.expectedQty;
        if (diff != 0) inv.applyAdjustment(new StockAdjustment(po.sku, diff, "Receipt reconciliation"));
        inv.postReceipt(grn, po);
        inv.updateBinLocation(po.sku, "A1-01");
    }
}

// From Business Process 6 & 7: Store Items & Monitor Stock
class Item {
    private String itemId, name, category, barcode; private double weight; private int reorderPoint, reorderQuantity;
    public Item(String id, String n, String cat, String bc, double w, int rp, int rq) {
        itemId = id; name = n; category = cat; barcode = bc; weight = w; reorderPoint = rp; reorderQuantity = rq;
    }
    public String getItemId() { return itemId; }
    public String getName() { return name; }
    public int getReorderPoint() { return reorderPoint; }
    public int getReorderQuantity() { return reorderQuantity; }
    public BigDecimal getUnitCost() { return BigDecimal.valueOf(new Random().nextDouble() * 100); } // Dummy cost
    public String getPreferredSupplierId() { return "SUP-01"; }
}

class StorageLocation {
    private String locationId; private int capacity, usedSpace; private List<String> storedItemIds = new ArrayList<>();
    public StorageLocation(String id, int cap) { locationId = id; capacity = cap; }
    public boolean hasAvailableSpace(int required) { return (usedSpace + required) <= capacity; }
    public boolean addItem(String itemId, int quantity) {
        if (hasAvailableSpace(quantity)) {
            storedItemIds.add(itemId);
            usedSpace += quantity;
            return true;
        }
        return false;
    }
    public String getLocationId() { return locationId; }
}

class Warehouse {
    private String warehouseId, name, address; private int totalCapacity, usedCapacity; private Map<String, StorageLocation> storageLocations = new HashMap<>();
    public Warehouse(String id, String name, String addr, int cap) {
        this.warehouseId = id; this.name = name; this.address = addr; this.totalCapacity = cap; this.usedCapacity = 0;
    }
    public String getWarehouseId() { return warehouseId; }
    public int getUsedCapacity() { return usedCapacity; }
    public int getTotalCapacity() { return totalCapacity; }
    public void addStorageLocation(StorageLocation loc) { storageLocations.put(loc.getLocationId(), loc); }
    public boolean hasAvailableSpace(int required) { return (usedCapacity + required) <= totalCapacity; }
    public StorageLocation findAvailableLocation(int required) {
        return storageLocations.values().stream().filter(l -> l.hasAvailableSpace(required)).findFirst().orElse(null);
    }
}

class InventoryRecord {
    private String recordId, itemId, warehouseId, locationId; private int quantityOnHand; private LocalDateTime lastUpdated;
    public InventoryRecord(String rid, String iid, String wid, String lid, int qty) {
        recordId = rid; itemId = iid; warehouseId = wid; locationId = lid; quantityOnHand = qty; lastUpdated = LocalDateTime.now();
    }
    public String getRecordId() { return recordId; }
    public String getItemId() { return itemId; }
    public int getQuantityOnHand() { return quantityOnHand; }
    public boolean needsReorder(int reorderPoint) { return quantityOnHand <= reorderPoint; }
    public void markAsLowStock() { System.out.println("Item " + itemId + " marked as low stock."); }
    public void updateMonitorTimestamp() { this.lastUpdated = LocalDateTime.now(); }
}

class StorageManager {
    private Map<String, Warehouse> warehouses = new HashMap<>();
    private Map<String, Item> itemCatalog = new HashMap<>();
    public Map<String, Warehouse> getWarehouses() { return warehouses; }
    public void addWarehouse(Warehouse wh) { warehouses.put(wh.getWarehouseId(), wh); }
    public void addItem(Item item) { itemCatalog.put(item.getItemId(), item); }
    public boolean processItemStorage(String itemId, String whId, int qty, String userId) {
        Warehouse wh = warehouses.get(whId);
        if (wh == null || !wh.hasAvailableSpace(qty)) return false;
        StorageLocation loc = wh.findAvailableLocation(qty);
        if (loc == null) {
            loc = new StorageLocation("RANDOM-LOC-" + new Random().nextInt(100), qty + 50);
            wh.addStorageLocation(loc);
        }
        return loc.addItem(itemId, qty);
    }
}

class StockAlert {
    private String alertId; private String itemId; private int currentQuantity;
    public StockAlert(String itemId, int currentQuantity) {
        this.alertId = "ALERT-" + System.currentTimeMillis(); this.itemId = itemId; this.currentQuantity = currentQuantity;
    }
}

class StockMonitor {
    private Map<String, InventoryRecord> inventoryRecords = new HashMap<>();
    private Map<String, Item> items = new HashMap<>();
    public Map<String, InventoryRecord> getInventoryRecords() { return inventoryRecords; }
    public void addInventoryRecord(InventoryRecord record) { inventoryRecords.put(record.getRecordId(), record); }
    public void addItem(Item item) { items.put(item.getItemId(), item); }
    public List<StockAlert> performStockMonitoring() {
        List<StockAlert> alerts = new ArrayList<>();
        inventoryRecords.values().forEach(record -> {
            Item item = items.get(record.getItemId());
            if (item != null && record.needsReorder(item.getReorderPoint())) {
                alerts.add(new StockAlert(item.getItemId(), record.getQuantityOnHand()));
                record.markAsLowStock();
            }
            record.updateMonitorTimestamp();
        });
        return alerts;
    }
}


// From Business Process 8: Reorder Stock
class PurchaseRequisition {
    private String requisitionId, itemId, itemName, createdBy, justification, status;
    public PurchaseRequisition(String itemId, String itemName, int qty, String createdBy, String justification) {
        this.requisitionId = "PR-" + System.currentTimeMillis();
        this.itemId = itemId; this.itemName = itemName;
        this.createdBy = createdBy; this.justification = justification; this.status = "PENDING";
    }
    public String getRequisitionId() { return requisitionId; }
    public String getItemId() { return itemId; }
    public String getStatus() { return status; }
    public void approve(String approverName, String supplierId) { this.status = "APPROVED"; }
    public void reject(String reason) { this.status = "REJECTED"; }
}

class Supplier_BP8 {
    private String supplierId, companyName, contactPerson, email, phone, address;
    public Supplier_BP8(String id, String name, String contact, String email, String phone, String addr) {
        this.supplierId = id; this.companyName = name; this.contactPerson = contact; this.email = email; this.phone = phone; this.address = addr;
    }
    public String getSupplierId() { return supplierId; }
    public String getCompanyName() { return companyName; }
    public double getPerformanceRating() { return 4.5; }
    public boolean isActive() { return true; }
    public boolean meetsMinimumOrder(BigDecimal val) { return true; }
    public int getDeliveryLeadTime() { return 7; }
    public String getPaymentTerms() { return "Net 30"; }
}

class ProcurementManager_BP8 {
    private Map<String, Item> items = new HashMap<>();
    private Map<String, Supplier_BP8> suppliers = new HashMap<>();
    private Map<String, PurchaseRequisition> purchaseRequisitions = new HashMap<>();
    private Map<String, PurchaseOrder> purchaseOrders = new HashMap<>();
    private BigDecimal approvalLimit;

    public ProcurementManager_BP8(String id, BigDecimal limit) { this.approvalLimit = limit; }
    public Map<String, PurchaseRequisition> getPurchaseRequisitions() { return purchaseRequisitions; }
    public Map<String, PurchaseOrder> getPurchaseOrders() { return purchaseOrders; }
    public void addItem(Item item) { items.put(item.getItemId(), item); }
    public void addSupplier(Supplier_BP8 supplier) { suppliers.put(supplier.getSupplierId(), supplier); }

    public PurchaseRequisition createPurchaseRequisition(String itemId, int currentStock, String createdBy) {
        Item item = items.get(itemId);
        if (item == null || currentStock > item.getReorderPoint()) return null;
        String justification = "Stock level (" + currentStock + ") is below reorder point (" + item.getReorderPoint() + ")";
        PurchaseRequisition req = new PurchaseRequisition(item.getItemId(), item.getName(), item.getReorderQuantity(), createdBy, justification);
        purchaseRequisitions.put(req.getRequisitionId(), req);
        return req;
    }

    public boolean approveRequisition(String reqId, String approverName) {
        PurchaseRequisition req = purchaseRequisitions.get(reqId);
        if (req == null) return false;
        Item item = items.get(req.getItemId());
        String supplierId = findBestSupplier(item);
        if (supplierId == null) return false;
        req.approve(approverName, supplierId);
        return true;
    }

    public List<PurchaseRequisition> getPendingRequisitions() {
        return purchaseRequisitions.values().stream()
                .filter(r -> "PENDING".equals(r.getStatus()))
                .collect(Collectors.toList());
    }

    public PurchaseOrder generatePurchaseOrder(String reqId, String deliveryAddress) {
        PurchaseRequisition req = purchaseRequisitions.get(reqId);
        if (req == null || !"APPROVED".equals(req.getStatus())) return null;
        Item item = items.get(req.getItemId());
        Supplier_BP8 supplier = suppliers.get(item.getPreferredSupplierId());

        PurchaseOrder po = new PurchaseOrder(reqId, supplier.getSupplierId(), supplier.getCompanyName(), deliveryAddress);
        po.addOrderItem(item.getItemId(), item.getName(), item.getReorderQuantity(), item.getUnitCost());
        purchaseOrders.put(po.getPurchaseOrderId(), po);
        return po;
    }

    private String findBestSupplier(Item item) {
        return suppliers.values().stream()
                .filter(Supplier_BP8::isActive)
                .filter(s -> s.meetsMinimumOrder(item.getUnitCost().multiply(BigDecimal.valueOf(item.getReorderQuantity()))))
                .max(Comparator.comparing(Supplier_BP8::getPerformanceRating))
                .map(Supplier_BP8::getSupplierId)
                .orElse(null);
    }
}


// From BP9-12 (Picking, Packing, Labeling, Dispatch) – simplified implementation
class PickList {
    String pickListId; String orderId; String status;
    public PickList(String id, String oid) { this.pickListId = id; this.orderId = oid; this.status = "PENDING"; }
    public String getOrderId() { return orderId; }
    public void markCompleted() { this.status = "COMPLETED"; }
}

class PickingManager {
    private Map<String, Order> orders = new HashMap<>();
    private Map<String, Customer> customers = new HashMap<>();
    private Map<String, String> itemLocations = new HashMap<>();
    private List<String> availablePickers = new ArrayList<>();
    private Map<String, PickList> pickLists = new HashMap<>();

    public void addOrder(Order o) { orders.put(o.getOrderId(), o); }
    public void addCustomer(Customer c) { customers.put(c.getCustomerId(), c); }
    public void addItemLocation(String iid, String loc) { itemLocations.put(iid, loc); }
    public void addPicker(String pid) { availablePickers.add(pid); }
    public List<String> getAvailablePickers() { return availablePickers; }
    public Map<String, PickList> getPickLists() { return pickLists; }

    public PickList generatePickList(String orderId) {
        Order order = orders.get(orderId);
        if (order == null || !"PROCESSING".equals(order.getOrderStatus())) return null;
        PickList pl = new PickList("PL-" + System.currentTimeMillis(), orderId);
        pickLists.put(pl.pickListId, pl);
        order.updateOrderStatus("PICKING");
        return pl;
    }

    public boolean assignPickList(String pickListId, String pickerId) {
        PickList pl = pickLists.get(pickListId);
        if (pl == null || !"PENDING".equals(pl.status) || !availablePickers.contains(pickerId)) return false;
        pl.status = "ASSIGNED";
        return true;
    }

    public boolean recordPickedItem(String listId, String itemId, int qty, String notes) {
        PickList pl = pickLists.get(listId);
        if (pl == null || !"ASSIGNED".equals(pl.status)) return false;
        System.out.println("Item " + itemId + " picked for list " + listId + " qty=" + qty);
        return true;
    }
}

class PackingManager {
    private Map<String, Order> orders = new HashMap<>();
    private Map<String, Package> packages = new HashMap<>();
    public void addOrder(Order o) { orders.put(o.getOrderId(), o); }
    public Map<String, Package> getPackages() { return packages; }
    public Package createPackage(String orderId, String pickListId, String packageType) {
        Order o = orders.get(orderId);
        if (o == null) return null;
        Package pkg = new Package("PKG-" + System.currentTimeMillis(), orderId, pickListId, packageType);
        packages.put(pkg.getPackageId(), pkg);
        o.updateOrderStatus("PACKING");
        return pkg;
    }
}

class LabelManager {
    private Map<String, Customer> customers = new HashMap<>();
    private Map<String, Carrier> carriers = new HashMap<>();
    private Map<String, ShippingLabel> labels = new HashMap<>();
    private Address warehouseAddress;

    public void addCustomer(Customer c) { customers.put(c.getCustomerId(), c); }
    public void addCarrier(Carrier c) { carriers.put(c.getCarrierId(), c); }
    public void setWarehouseAddress(Address a) { this.warehouseAddress = a; }
    public Map<String, ShippingLabel> getShippingLabels() { return labels; }
    public ShippingLabel generateShippingLabel(String packageId, String carrierId, String serviceLevel) {
        ShippingLabel label = new ShippingLabel("LBL-" + System.currentTimeMillis(), packageId, "ORD-1001", carrierId);
        labels.put(label.getLabelId(), label);
        return label;
    }
}

class DispatchManager {
    private Map<String, Package> packages = new HashMap<>();
    private Map<String, DispatchManifest> manifests = new HashMap<>();
    private Map<String, Carrier> carriers = new HashMap<>();

    public void addPackage(Package p) { packages.put(p.getPackageId(), p); }
    public void addCarrier(Carrier c) { carriers.put(c.getCarrierId(), c); }

    public DispatchManifest createDispatchManifestForCarrier(String carrierId) {
        if (!carriers.containsKey(carrierId)) return null;

        List<Package> readyPackages = packages.values().stream()
                .filter(p -> "LABELED".equals(p.getStatus()))
                .collect(Collectors.toList());

        if (readyPackages.isEmpty()) return null;

        DispatchManifest manifest = new DispatchManifest("MAN-" + System.currentTimeMillis(), carrierId, carriers.get(carrierId).getCarrierName());
        manifests.put(manifest.getManifestId(), manifest);
        return manifest;
    }

    public boolean recordPickup(String manifestId, String sig, String confNum) {
        DispatchManifest manifest = manifests.get(manifestId);
        if (manifest == null) return false;
        manifest.recordPickup(sig, confNum);
        return true;
    }
}

// Minimal supporting classes for BP9-12
class Order {
    String orderId, customerId, status, priority;
    List<OrderItem> items = new ArrayList<>();
    public Order(String oid, String cid, String prio) { this.orderId = oid; this.customerId = cid; this.priority = prio; this.status = "PENDING"; }
    public void addOrderItem(String iid, String name, int qty, double price) { items.add(new OrderItem(iid, name, qty, price)); }
    public String getOrderId() { return orderId; }
    public String getOrderStatus() { return status; }
    public void setProcessingStatus() { this.status = "PROCESSING"; }
    public void updateOrderStatus(String newStatus) { this.status = newStatus; }
}
class OrderItem { public OrderItem(String a, String b, int c, double d){} }
class Customer {
    String customerId, firstName, lastName, email; Address shipping, billing;
    public Customer(String id, String fn, String ln, String e) { this.customerId = id; this.firstName = fn; this.lastName = ln; this.email = e; }
    public String getCustomerId() { return customerId; }
    public void setDefaultAddresses(Address s, Address b) { this.shipping = s; this.billing = b; }
}
class Address {
    public Address(String a, String b, String c, String d, String e, String f) {}
}
class Package {
    String packageId, orderId, pickListId, packageType, status;
    public Package(String pid, String oid, String plid, String pt) { this.packageId = pid; this.orderId = oid; this.pickListId = plid; this.packageType = pt; this.status="PACKING"; }
    public String getPackageId() { return packageId; }
    public String getStatus() { return status; }
    public void verifyPackage(String notes) { this.status = "VERIFIED"; }
    public void markLabeled() { this.status = "LABELED"; }
}
class ShippingLabel {
    String labelId;
    public ShippingLabel(String lid, String pid, String oid, String cid) { this.labelId = lid; }
    public String getLabelId() { return labelId; }
}
class Carrier {
    String carrierId, carrierName, carrierCode;
    public Carrier(String id, String name, String code) { this.carrierId = id; this.carrierName = name; this.carrierCode = code; }
    public String getCarrierId() { return carrierId; }
    public String getCarrierName() { return carrierName; }
    public void addServiceType(String type, double rate) {}
}
class DispatchManifest {
    String manifestId;
    public DispatchManifest(String id, String cid, String cname) { this.manifestId = id; }
    public String getManifestId() { return manifestId; }
    public void recordPickup(String sig, String conf) {}
}


// From Business Process 13: Track Inventory in Transit
class ShipmentRecord {
    public String shipmentId, origin, destination, status;
    public ShipmentRecord(String id, String o, String d, String s) { shipmentId = id; origin = o; destination = d; status = s; }
}
class CourierPartner {
    String name;
    public CourierPartner(String name) { this.name = name; }
    public ShipmentRecord updateShipment(String id, String o, String d) { return new ShipmentRecord(id, o, d, "In Transit"); }
}


// From Business Process 14: Process Returns
class Customer_BP14 {
    String id, name;
    public Customer_BP14(String id, String name) { this.id = id; this.name = name; }
    public ReturnRequest initiateReturnRequest(Goods g, String r) { return new ReturnRequest(this, g, r); }
}
enum ReturnStatus { PENDING, APPROVED, REJECTED, COMPLETED }
class ReturnRequest {
    String returnId; Customer_BP14 customer; Goods goods; String reason; ReturnStatus status;
    public ReturnRequest(Customer_BP14 c, Goods g, String r) {
        this.returnId = "RET-" + System.currentTimeMillis(); customer = c; goods = g; reason = r; status = ReturnStatus.PENDING;
    }
    public void approve() { this.status = ReturnStatus.APPROVED; }
    public ReturnStatus getStatus() { return status; }
    public Goods getGoods() { return goods; }
    public String getReturnId() { return returnId; }
}

class ReturnService {
    private InventorySystem ims;
    private Map<String, ReturnRequest> returnRequests = new HashMap<>();
    private Map<String, Customer_BP14> customers = new HashMap<>();
    private Map<String, Goods> items = new HashMap<>();
    public ReturnService(InventorySystem ims) { this.ims = ims; setupReturnData(); }

    private void setupReturnData() {
        customers.put("CUST-001", new Customer_BP14("CUST-001", "John Doe"));
        items.put("SKU-LAPTOP-001", new Goods("SKU-LAPTOP-001", "A very fine laptop"));
    }

    public ReturnRequest initiateReturn(String customerId, String sku, String reason) {
        Customer_BP14 c = customers.get(customerId);
        Goods g = items.get(sku);
        if (c == null || g == null) return null;
        ReturnRequest request = new ReturnRequest(c, g, reason);
        returnRequests.put(request.getReturnId(), request);
        return request;
    }

    public boolean approveReturn(String returnId) {
        ReturnRequest request = returnRequests.get(returnId);
        if (request == null) return false;
        request.approve();
        return true;
    }

    public String processReceivedReturn(String returnId, String staffName) {
        ReturnRequest request = returnRequests.get(returnId);
        if (request == null) return "Return request not found.";
        if (request.getStatus() != ReturnStatus.APPROVED) return "Return request not approved.";

        // Simplified inspection: assume good condition
        ims.restock(request.getGoods());
        ims.updateRecords(request.getGoods());
        request.status = ReturnStatus.COMPLETED;
        return "Return processed and item restocked.";
    }
}
class WarehouseStaff_BP14 {
    String name;
    public WarehouseStaff_BP14(String name) { this.name = name; }
}

// From Business Process 15: Inventory Audit
class AuditRequest {
    String requestId, description;
    public AuditRequest(String id, String d) { requestId = id; description = d; }
    public String getRequestId() { return requestId; }
}
class InventoryData {
    String itemId; int quantity;
    public InventoryData(String id, int q) { itemId = id; quantity = q; }
    public int getQuantity() { return quantity; }
    public String getItemId() { return itemId; }
}
class AuditReport {
    String reportId; boolean valid; String details;
    public AuditReport(String id, boolean v, String d) { reportId = id; valid = v; details = d; }
}
class InventoryManager_BP15 {
    String name;
    public InventoryManager_BP15(String n) { this.name = n; }
    public AuditRequest initiateAudit(String id, String d) { return new AuditRequest(id, d); }
}
class WarehouseStaff_BP15 {
    String name;
    public WarehouseStaff_BP15(String n) { this.name = n; }
    public InventoryData gatherInventoryData(String itemId) { return new InventoryData(itemId, 100); }
}
class AuditService {
    private Map<String, AuditRequest> requests = new HashMap<>();
    private Map<String, InventoryData> auditData = new HashMap<>();
    public void addRequest(AuditRequest r) { requests.put(r.getRequestId(), r); }
    public void addInventoryData(String reqId, InventoryData d) { auditData.put(reqId, d); }

    public boolean validateRecords(InventoryData data) { return data.getQuantity() >= 0; }

    public AuditReport generateAuditReport(String requestId) {
        AuditRequest request = requests.get(requestId);
        InventoryData data = auditData.get(requestId);
        if (request == null || data == null) return null;

        boolean valid = validateRecords(data);
        String details = valid ? "Audit successful for item: " + data.getItemId() : "Discrepancy found for item: " + data.getItemId();
        return new AuditReport("RPT-" + request.getRequestId(), valid, details);
    }
}
