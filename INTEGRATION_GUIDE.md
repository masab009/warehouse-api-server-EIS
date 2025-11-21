# Warehouse Management System - Frontend-Backend Integration Guide

## Project Overview

This warehouse management system provides a complete frontend-backend integration with a SQLite database, allowing you to track inventory, manage purchase requisitions, and monitor pick lists in real-time.

## Architecture

### Backend Components
- **SQLite Database** (`warehouse.db`): Stores all warehouse data
- **Next.js API Routes** (`app/api/`): RESTful endpoints for data operations
- **Database Module** (`lib/db.ts`): Handles database connections and initialization

### Frontend Components
- **Dashboard** (`app/page.tsx`): Main interface with tabbed navigation
- **Inventory List** (`components/inventory-list.tsx`): Expandable inventory items with details
- **Requisitions List** (`components/requisitions-list.tsx`): Purchase requisition management
- **Pick Lists Display** (`components/pick-lists-display.tsx`): Order picking tracking

## Features Implemented

### 1. Inventory Tracking
- View all inventory records across warehouses
- Expand items to see detailed information:
  - SKU, unit cost, reorder points
  - Current stock levels with visual progress bar
  - Warehouse and location details
  - Low stock warnings with automatic alerts
- Real-time stock status indicators

### 2. Purchase Requisition Management
- View pending, approved, and rejected requisitions
- Expand requisitions to see:
  - Created by and date
  - Justification for the request
- Approve/reject pending requisitions directly from the dashboard
- Status changes persist to the database

### 3. Pick List Management
- Monitor active and completed pick lists
- Expand pick lists to view:
  - Individual line items with details
  - Required vs. picked quantities
  - Progress tracking with visual indicators
- Track completion percentage

### 4. Warehouse Locations
- View available warehouses
- Track storage location capacity and usage
- Monitor space utilization

## Database Schema

### Tables
1. **items** - Product catalog
2. **warehouses** - Warehouse locations
3. **storage_locations** - Bin/shelf locations within warehouses
4. **inventory_records** - Current stock levels
5. **purchase_requisitions** - Reorder requests
6. **purchase_orders** - Generated orders from requisitions
7. **pick_lists** - Customer order picking lists
8. **pick_list_items** - Individual items on pick lists
9. **packages** - Packed orders ready for shipment

## API Endpoints

### Inventory
- `GET /api/inventory` - Get all inventory records
- `GET /api/inventory/[id]` - Get detailed inventory record
- `GET /api/items` - Get all items in catalog

### Purchase Requisitions
- `GET /api/requisitions` - Get all requisitions
- `GET /api/requisitions/[id]` - Get requisition details
- `POST /api/requisitions` - Create new requisition
- `PUT /api/requisitions/[id]` - Update requisition status

### Purchase Orders
- `GET /api/purchase-orders` - Get all purchase orders

### Pick Lists
- `GET /api/pick-lists` - Get all pick lists
- `GET /api/pick-lists/[id]` - Get pick list with items

### Packages
- `GET /api/packages` - Get all packages
- `GET /api/packages/[id]` - Get package details

### Warehouses
- `GET /api/warehouses` - Get all warehouses

## Dummy Data

The system comes with 10 pre-populated items, 2 warehouses, 5 storage locations, 10 inventory records, and sample purchase requisitions. This data is automatically seeded on first run.

### Sample Items
- Laptops ($1,200, reorder point: 5)
- Desktop Monitors ($350, reorder point: 10)
- Keyboards ($85, reorder point: 20)
- Mice ($45, reorder point: 30)
- And 6 more items...

### Sample Requisitions
- 2 PENDING requisitions
- 1 APPROVED requisition
- 1 REJECTED requisition

## Getting Started

### Installation
1. Install dependencies: `npm install`
2. Run the development server: `npm run dev`
3. Open http://localhost:3000 in your browser

### First Run
The database is automatically initialized on the first API call with:
- Tables created
- Dummy data seeded
- All endpoints ready to use

## Usage

### Tracking Items
1. Navigate to the "Inventory" tab
2. Browse all items
3. Click on an item to expand and view:
   - Detailed location and warehouse info
   - Stock level progress bar
   - Low stock warnings if applicable

### Managing Requisitions
1. Go to the "Requisitions" tab
2. Review pending purchase requisitions
3. Expand each requisition to see justification
4. Click "Approve" or "Reject" to change status
5. Changes are saved to the database immediately

### Monitoring Pick Lists
1. Switch to the "Pick Lists" tab
2. View all active and completed pick lists
3. Expand pick lists to see:
   - Individual items and quantities
   - Pick progress for each item
   - Overall completion percentage

### Refreshing Data
- Click the "Refresh Data" button at the top to reload all data from the server
- The system automatically loads data on page load

## Integration Points

### Frontend-Backend Communication
- All data fetches use the Fetch API with async/await
- API calls are made on component mount (useEffect)
- Status updates use PUT requests
- Error handling with console logging for debugging
- Real-time UI updates upon successful API responses

### Database Operations
- SQLite database uses better-sqlite3 for synchronous operations
- Prepared statements for all queries to prevent SQL injection
- Transaction support for multi-step operations
- Automatic timestamp tracking (created_at, last_updated)

## Debugging

### Console Logging
Check the browser console for debug messages prefixed with `[v0]`:
- `[v0] Fetching inventory data...`
- `[v0] Inventory data received: ...`
- `[v0] Requisition status updated: ...`
- `[v0] Failed to ...` for errors

### Common Issues
1. **Empty data** - Wait for initial database seed on first API call
2. **404 errors** - Ensure API routes are in correct paths
3. **Database locked** - Restart the dev server if database is locked

## Future Enhancements

- Add ability to create new inventory items
- Implement user authentication and roles
- Add advanced filtering and search
- Export reports to CSV/PDF
- Real-time notifications for low stock
- Barcode scanning integration
- Multi-warehouse coordination
- Advanced analytics dashboard

## File Structure

\`\`\`
/app
  /api
    /inventory
    /requisitions
    /purchase-orders
    /pick-lists
    /packages
    /warehouses
  /page.tsx (main dashboard)
  /layout.tsx
/components
  /inventory-list.tsx
  /requisitions-list.tsx
  /pick-lists-display.tsx
  /ui/* (shadcn components)
/lib
  /db.ts (database setup)
/scripts
  /init-database.sql
\`\`\`

## API Response Examples

### Inventory Record
\`\`\`json
{
  "id": "INV-001",
  "item_id": "ITEM-001",
  "item_name": "Laptops",
  "sku": "SKU-LAPTOP-001",
  "unit_cost": 1200.00,
  "reorder_point": 5,
  "warehouse_id": "WH-1",
  "location_id": "LOC-WH1-001",
  "quantity_on_hand": 25,
  "last_updated": "2025-01-21T10:30:00"
}
\`\`\`

### Requisition
\`\`\`json
{
  "id": "REQ-001",
  "item_id": "ITEM-001",
  "item_name": "Laptops",
  "quantity": 5,
  "status": "PENDING",
  "created_by": "SYSTEM",
  "justification": "Stock level below reorder point",
  "created_at": "2025-01-21T10:00:00"
}
\`\`\`

### Pick List with Items
\`\`\`json
{
  "id": "PL-001",
  "order_id": "ORD-001",
  "status": "PENDING",
  "created_at": "2025-01-21T09:00:00",
  "items": [
    {
      "id": "PLI-001",
      "item_id": "ITEM-001",
      "item_name": "Laptops",
      "sku": "SKU-LAPTOP-001",
      "quantity_required": 3,
      "quantity_picked": 0
    }
  ]
}
\`\`\`

## Support & Troubleshooting

If you encounter any issues:
1. Check browser console for `[v0]` debug messages
2. Verify all API routes are accessible via `/api/inventory` etc.
3. Ensure package.json has `better-sqlite3` dependency
4. Restart the development server
5. Clear browser cache and hard refresh (Ctrl+Shift+R)
