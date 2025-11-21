-- Initialize warehouse management database with dummy data

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

-- Dummy data for items
INSERT OR IGNORE INTO items (id, name, category, sku, unit_cost, reorder_point, reorder_quantity) VALUES
('ITEM-001', 'Laptops', 'Electronics', 'SKU-LAPTOP-001', 1200.00, 5, 10),
('ITEM-002', 'Desktop Monitors', 'Electronics', 'SKU-MONITOR-001', 350.00, 10, 20),
('ITEM-003', 'Keyboards', 'Accessories', 'SKU-KEYBOARD-001', 85.00, 20, 50),
('ITEM-004', 'Mice', 'Accessories', 'SKU-MOUSE-001', 45.00, 30, 100),
('ITEM-005', 'USB Cables', 'Accessories', 'SKU-USB-CABLE-001', 12.00, 50, 200),
('ITEM-006', 'Headphones', 'Audio', 'SKU-HEADPHONE-001', 120.00, 8, 15),
('ITEM-007', 'Webcams', 'Electronics', 'SKU-WEBCAM-001', 95.00, 5, 12),
('ITEM-008', 'External Hard Drives', 'Storage', 'SKU-HDD-EXTERNAL-001', 150.00, 10, 25),
('ITEM-009', 'SSD Storage', 'Storage', 'SKU-SSD-001', 180.00, 8, 20),
('ITEM-010', 'Power Banks', 'Accessories', 'SKU-POWERBANK-001', 65.00, 15, 40);

-- Dummy data for warehouses
INSERT OR IGNORE INTO warehouses (id, name, address, total_capacity, used_capacity) VALUES
('WH-1', 'Main Warehouse', '123 Main St, Anytown, USA', 10000, 4500),
('WH-2', 'Secondary Warehouse', '456 Oak Ave, Somewhere, USA', 8000, 3200);

-- Dummy data for storage locations
INSERT OR IGNORE INTO storage_locations (id, warehouse_id, capacity, used_space) VALUES
('LOC-WH1-001', 'WH-1', 500, 350),
('LOC-WH1-002', 'WH-1', 500, 280),
('LOC-WH1-003', 'WH-1', 500, 400),
('LOC-WH2-001', 'WH-2', 400, 200),
('LOC-WH2-002', 'WH-2', 400, 300);

-- Dummy data for inventory records
INSERT OR IGNORE INTO inventory_records (id, item_id, warehouse_id, location_id, quantity_on_hand) VALUES
('INV-001', 'ITEM-001', 'WH-1', 'LOC-WH1-001', 25),
('INV-002', 'ITEM-002', 'WH-1', 'LOC-WH1-002', 45),
('INV-003', 'ITEM-003', 'WH-1', 'LOC-WH1-003', 8),
('INV-004', 'ITEM-004', 'WH-2', 'LOC-WH2-001', 12),
('INV-005', 'ITEM-005', 'WH-2', 'LOC-WH2-002', 150),
('INV-006', 'ITEM-006', 'WH-1', 'LOC-WH1-001', 5),
('INV-007', 'ITEM-007', 'WH-2', 'LOC-WH2-001', 18),
('INV-008', 'ITEM-008', 'WH-1', 'LOC-WH1-002', 22),
('INV-009', 'ITEM-009', 'WH-2', 'LOC-WH2-002', 9),
('INV-010', 'ITEM-010', 'WH-1', 'LOC-WH1-003', 32);

-- Dummy data for purchase requisitions
INSERT OR IGNORE INTO purchase_requisitions (id, item_id, item_name, quantity, status, created_by, justification) VALUES
('REQ-001', 'ITEM-001', 'Laptops', 5, 'PENDING', 'SYSTEM', 'Stock level below reorder point'),
('REQ-002', 'ITEM-003', 'Keyboards', 8, 'PENDING', 'WAREHOUSE_MANAGER', 'Inventory restocking'),
('REQ-003', 'ITEM-006', 'Headphones', 3, 'APPROVED', 'PROCUREMENT', 'Approved for purchase'),
('REQ-004', 'ITEM-004', 'Mice', 12, 'REJECTED', 'WAREHOUSE_MANAGER', 'Cancelled order');

-- Dummy data for purchase orders
INSERT OR IGNORE INTO purchase_orders (id, requisition_id, supplier_id, supplier_name, total_amount, order_date, status) VALUES
('PO-001', 'REQ-003', 'SUP-001', 'TechSupply Co', 360.00, CURRENT_TIMESTAMP, 'CREATED'),
('PO-002', 'REQ-001', 'SUP-002', 'ElectroWorld', 6000.00, CURRENT_TIMESTAMP, 'CREATED');

-- Dummy data for pick lists
INSERT OR IGNORE INTO pick_lists (id, order_id, status) VALUES
('PL-001', 'ORD-001', 'PENDING'),
('PL-002', 'ORD-002', 'ASSIGNED'),
('PL-003', 'ORD-003', 'COMPLETED');

-- Dummy data for pick list items
INSERT OR IGNORE INTO pick_list_items (id, pick_list_id, item_id, quantity_required, quantity_picked) VALUES
('PLI-001', 'PL-001', 'ITEM-001', 3, 0),
('PLI-002', 'PL-001', 'ITEM-003', 5, 0),
('PLI-003', 'PL-002', 'ITEM-002', 2, 2),
('PLI-004', 'PL-002', 'ITEM-005', 10, 8),
('PLI-005', 'PL-003', 'ITEM-006', 1, 1),
('PLI-006', 'PL-003', 'ITEM-008', 3, 3);

-- Dummy data for packages
INSERT OR IGNORE INTO packages (id, order_id, pick_list_id, package_type, status) VALUES
('PKG-001', 'ORD-001', 'PL-001', 'BOX', 'PACKING'),
('PKG-002', 'ORD-002', 'PL-002', 'BOX', 'LABELED'),
('PKG-003', 'ORD-003', 'PL-003', 'CRATE', 'VERIFIED');
