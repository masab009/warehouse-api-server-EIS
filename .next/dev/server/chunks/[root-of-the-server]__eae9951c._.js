module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/better-sqlite3 [external] (better-sqlite3, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("better-sqlite3", () => require("better-sqlite3"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[project]/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getDatabase",
    ()=>getDatabase,
    "initializeDatabase",
    ()=>initializeDatabase
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$better$2d$sqlite3__$5b$external$5d$__$28$better$2d$sqlite3$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/better-sqlite3 [external] (better-sqlite3, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
;
;
let db = null;
function getDatabase() {
    if (!db) {
        const dbPath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), "warehouse.db");
        db = new __TURBOPACK__imported__module__$5b$externals$5d2f$better$2d$sqlite3__$5b$external$5d$__$28$better$2d$sqlite3$2c$__cjs$29$__["default"](dbPath);
        db.pragma("journal_mode = WAL");
    }
    return db;
}
function initializeDatabase() {
    const database = getDatabase();
    const initSql = `
    -- Items table
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      unit_cost DECIMAL(10, 2),
      reorder_point INTEGER,
      reorder_quantity INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Warehouses table
    CREATE TABLE IF NOT EXISTS warehouses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      total_capacity INTEGER,
      used_capacity INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Storage locations table
    CREATE TABLE IF NOT EXISTS storage_locations (
      id TEXT PRIMARY KEY,
      warehouse_id TEXT NOT NULL,
      capacity INTEGER,
      used_space INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    );

    -- Inventory records table
    CREATE TABLE IF NOT EXISTS inventory_records (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      warehouse_id TEXT NOT NULL,
      location_id TEXT NOT NULL,
      quantity_on_hand INTEGER,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items(id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (location_id) REFERENCES storage_locations(id)
    );

    -- Purchase requisitions table
    CREATE TABLE IF NOT EXISTS purchase_requisitions (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      status TEXT DEFAULT 'PENDING',
      created_by TEXT,
      justification TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items(id)
    );

    -- Purchase orders table
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY,
      requisition_id TEXT NOT NULL,
      supplier_id TEXT,
      supplier_name TEXT,
      total_amount DECIMAL(12, 2),
      order_date DATETIME,
      status TEXT DEFAULT 'CREATED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (requisition_id) REFERENCES purchase_requisitions(id)
    );

    -- Pick lists table
    CREATE TABLE IF NOT EXISTS pick_lists (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Pick list items table
    CREATE TABLE IF NOT EXISTS pick_list_items (
      id TEXT PRIMARY KEY,
      pick_list_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      quantity_required INTEGER,
      quantity_picked INTEGER DEFAULT 0,
      FOREIGN KEY (pick_list_id) REFERENCES pick_lists(id),
      FOREIGN KEY (item_id) REFERENCES items(id)
    );

    -- Packages table
    CREATE TABLE IF NOT EXISTS packages (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      pick_list_id TEXT NOT NULL,
      package_type TEXT,
      status TEXT DEFAULT 'PACKING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Orders table
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_cost DECIMAL(10, 2),
      total_cost DECIMAL(12, 2),
      status TEXT DEFAULT 'ORDERED',
      ordered_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      delivery_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items(id)
    );
  `;
    // Split and execute each statement
    const statements = initSql.split(";").filter((s)=>s.trim());
    for (const stmt of statements){
        if (stmt.trim()) {
            database.exec(stmt);
        }
    }
    // Seed dummy data
    seedDummyData(database);
}
function seedDummyData(database) {
    // Check if data already exists
    const itemCount = database.prepare("SELECT COUNT(*) as count FROM items").get();
    if (itemCount.count > 0) return;
    // Insert items
    const insertItem = database.prepare(`
    INSERT INTO items (id, name, category, sku, unit_cost, reorder_point, reorder_quantity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
    const items = [
        [
            "ITEM-001",
            "Laptops",
            "Electronics",
            "SKU-LAPTOP-001",
            1200.0,
            5,
            10
        ],
        [
            "ITEM-002",
            "Desktop Monitors",
            "Electronics",
            "SKU-MONITOR-001",
            350.0,
            10,
            20
        ],
        [
            "ITEM-003",
            "Keyboards",
            "Accessories",
            "SKU-KEYBOARD-001",
            85.0,
            20,
            50
        ],
        [
            "ITEM-004",
            "Mice",
            "Accessories",
            "SKU-MOUSE-001",
            45.0,
            30,
            100
        ],
        [
            "ITEM-005",
            "USB Cables",
            "Accessories",
            "SKU-USB-CABLE-001",
            12.0,
            50,
            200
        ],
        [
            "ITEM-006",
            "Headphones",
            "Audio",
            "SKU-HEADPHONE-001",
            120.0,
            8,
            15
        ],
        [
            "ITEM-007",
            "Webcams",
            "Electronics",
            "SKU-WEBCAM-001",
            95.0,
            5,
            12
        ],
        [
            "ITEM-008",
            "External Hard Drives",
            "Storage",
            "SKU-HDD-EXTERNAL-001",
            150.0,
            10,
            25
        ],
        [
            "ITEM-009",
            "SSD Storage",
            "Storage",
            "SKU-SSD-001",
            180.0,
            8,
            20
        ],
        [
            "ITEM-010",
            "Power Banks",
            "Accessories",
            "SKU-POWERBANK-001",
            65.0,
            15,
            40
        ]
    ];
    items.forEach((item)=>insertItem.run(...item));
    // Insert warehouses
    const insertWarehouse = database.prepare(`
    INSERT INTO warehouses (id, name, address, total_capacity, used_capacity)
    VALUES (?, ?, ?, ?, ?)
  `);
    insertWarehouse.run("WH-1", "Main Warehouse", "123 Main St, Anytown, USA", 10000, 4500);
    insertWarehouse.run("WH-2", "Secondary Warehouse", "456 Oak Ave, Somewhere, USA", 8000, 3200);
    // Insert storage locations
    const insertLocation = database.prepare(`
    INSERT INTO storage_locations (id, warehouse_id, capacity, used_space)
    VALUES (?, ?, ?, ?)
  `);
    const locations = [
        [
            "LOC-WH1-001",
            "WH-1",
            500,
            350
        ],
        [
            "LOC-WH1-002",
            "WH-1",
            500,
            280
        ],
        [
            "LOC-WH1-003",
            "WH-1",
            500,
            400
        ],
        [
            "LOC-WH2-001",
            "WH-2",
            400,
            200
        ],
        [
            "LOC-WH2-002",
            "WH-2",
            400,
            300
        ]
    ];
    locations.forEach((loc)=>insertLocation.run(...loc));
    // Insert inventory records
    const insertInventory = database.prepare(`
    INSERT INTO inventory_records (id, item_id, warehouse_id, location_id, quantity_on_hand)
    VALUES (?, ?, ?, ?, ?)
  `);
    const inventory = [
        [
            "INV-001",
            "ITEM-001",
            "WH-1",
            "LOC-WH1-001",
            25
        ],
        [
            "INV-002",
            "ITEM-002",
            "WH-1",
            "LOC-WH1-002",
            45
        ],
        [
            "INV-003",
            "ITEM-003",
            "WH-1",
            "LOC-WH1-003",
            8
        ],
        [
            "INV-004",
            "ITEM-004",
            "WH-2",
            "LOC-WH2-001",
            12
        ],
        [
            "INV-005",
            "ITEM-005",
            "WH-2",
            "LOC-WH2-002",
            150
        ],
        [
            "INV-006",
            "ITEM-006",
            "WH-1",
            "LOC-WH1-001",
            5
        ],
        [
            "INV-007",
            "ITEM-007",
            "WH-2",
            "LOC-WH2-001",
            18
        ],
        [
            "INV-008",
            "ITEM-008",
            "WH-1",
            "LOC-WH1-002",
            22
        ],
        [
            "INV-009",
            "ITEM-009",
            "WH-2",
            "LOC-WH2-002",
            9
        ],
        [
            "INV-010",
            "ITEM-010",
            "WH-1",
            "LOC-WH1-003",
            32
        ]
    ];
    inventory.forEach((inv)=>insertInventory.run(...inv));
    // Insert purchase requisitions
    const insertRequisition = database.prepare(`
    INSERT INTO purchase_requisitions (id, item_id, item_name, quantity, status, created_by, justification)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
    insertRequisition.run("REQ-001", "ITEM-001", "Laptops", 5, "PENDING", "SYSTEM", "Stock level below reorder point");
    insertRequisition.run("REQ-002", "ITEM-003", "Keyboards", 8, "PENDING", "WAREHOUSE_MANAGER", "Inventory restocking");
    insertRequisition.run("REQ-003", "ITEM-006", "Headphones", 3, "APPROVED", "PROCUREMENT", "Approved for purchase");
    insertRequisition.run("REQ-004", "ITEM-004", "Mice", 12, "REJECTED", "WAREHOUSE_MANAGER", "Cancelled order");
    // Insert purchase orders
    const insertPO = database.prepare(`
    INSERT INTO purchase_orders (id, requisition_id, supplier_id, supplier_name, total_amount, order_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
    insertPO.run("PO-001", "REQ-003", "SUP-001", "TechSupply Co", 360.0, new Date().toISOString(), "CREATED");
    insertPO.run("PO-002", "REQ-001", "SUP-002", "ElectroWorld", 6000.0, new Date().toISOString(), "CREATED");
    // Insert pick lists
    const insertPickList = database.prepare(`
    INSERT INTO pick_lists (id, order_id, status)
    VALUES (?, ?, ?)
  `);
    insertPickList.run("PL-001", "ORD-001", "PENDING");
    insertPickList.run("PL-002", "ORD-002", "ASSIGNED");
    insertPickList.run("PL-003", "ORD-003", "COMPLETED");
    // Insert pick list items
    const insertPickListItem = database.prepare(`
    INSERT INTO pick_list_items (id, pick_list_id, item_id, quantity_required, quantity_picked)
    VALUES (?, ?, ?, ?, ?)
  `);
    insertPickListItem.run("PLI-001", "PL-001", "ITEM-001", 3, 0);
    insertPickListItem.run("PLI-002", "PL-001", "ITEM-003", 5, 0);
    insertPickListItem.run("PLI-003", "PL-002", "ITEM-002", 2, 2);
    insertPickListItem.run("PLI-004", "PL-002", "ITEM-005", 10, 8);
    insertPickListItem.run("PLI-005", "PL-003", "ITEM-006", 1, 1);
    insertPickListItem.run("PLI-006", "PL-003", "ITEM-008", 3, 3);
    // Insert packages
    const insertPackage = database.prepare(`
    INSERT INTO packages (id, order_id, pick_list_id, package_type, status)
    VALUES (?, ?, ?, ?, ?)
  `);
    insertPackage.run("PKG-001", "ORD-001", "PL-001", "BOX", "PACKING");
    insertPackage.run("PKG-002", "ORD-002", "PL-002", "BOX", "LABELED");
    insertPackage.run("PKG-003", "ORD-003", "PL-003", "CRATE", "VERIFIED");
    // Insert sample orders
    const insertOrder = database.prepare(`
    INSERT INTO orders (id, item_id, item_name, quantity, unit_cost, total_cost, status, ordered_date, delivery_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
    const now = new Date();
    const deliveryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    insertOrder.run("ORD-BUY-001", "ITEM-001", "Laptops", 10, 1200.0, 12000.0, "DELIVERED", now.toISOString(), deliveryDate.toISOString());
    insertOrder.run("ORD-BUY-002", "ITEM-005", "USB Cables", 100, 12.0, 1200.0, "IN_TRANSIT", now.toISOString(), deliveryDate.toISOString());
}
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/app/api/items/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
;
async function GET() {
    try {
        const db = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getDatabase"])();
        const items = db.prepare(`
      SELECT * FROM items ORDER BY name
    `).all();
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(items);
    } catch (error) {
        console.error("[v0] Items API error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Failed to fetch items"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__eae9951c._.js.map