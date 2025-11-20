import type {
  PurchaseOrder,
  PurchaseRequisition,
  GoodsReceivedNote,
  InventoryRecord,
  PickList,
  Package,
  ShippingLabel,
  DispatchManifest,
  ShipmentRecord,
  ReturnRequest,
  AuditRequest,
  AuditReport,
  Warehouse,
  ErrorResponse,
  StatusResponse,
} from "../types/schema"

const BASE_URL = "/api" // Adjust if running on a different host

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error((data as ErrorResponse).error || `API Error: ${response.statusText}`)
  }

  return data as T
}

export const WarehouseApi = {
  procurement: {
    // API 1
    createPurchaseOrder: () => fetchJson<PurchaseOrder>("/procurement/purchase-orders", { method: "POST" }),

    // API 2
    approveRequisition: (id: string) =>
      fetchJson<PurchaseRequisition>(`/procurement/requisitions/${id}/approve`, { method: "PUT" }),

    // API 3
    getPurchaseOrder: (id: string) => fetchJson<PurchaseOrder>(`/procurement/purchase-orders/${id}`),

    // API 4
    rejectRequisition: (id: string) =>
      fetchJson<PurchaseRequisition>(`/procurement/requisitions/${id}/reject`, { method: "PUT" }),

    // API 11
    createReorder: () => fetchJson<PurchaseRequisition>("/procurement/reorder", { method: "POST" }),

    // API 12
    getPendingRequisitions: () => fetchJson<PurchaseRequisition[]>("/procurement/requisitions/pending"),
  },

  warehouse: {
    // API 5
    receiveShipment: () =>
      fetchJson<StatusResponse & { shipmentId: number }>("/warehouse/shipments/receive", { method: "POST" }),

    // API 6
    inspectGoods: () =>
      fetchJson<GoodsReceivedNote | (StatusResponse & { outcome: string })>("/warehouse/qc/inspect", {
        method: "POST",
      }),

    // API 8
    storeItem: () => fetchJson<StatusResponse>("/warehouse/storage/store-item", { method: "POST" }),

    // API 30
    getCapacity: () => fetchJson<Warehouse>("/warehouse/capacity"),

    // API 31
    getPickers: () => fetchJson<string[]>("/warehouse/personnel/pickers"),
  },

  inventory: {
    // API 7
    updateFromReceipt: () => fetchJson<StatusResponse>("/inventory/records/update-from-receipt", { method: "POST" }),

    // API 9
    getStockLevel: (itemId: string) => fetchJson<InventoryRecord>(`/inventory/stock-levels/${itemId}`),

    // API 10
    runStockMonitor: () => fetchJson<any[]>("/inventory/stock-monitor/run", { method: "POST" }), // Returns List<StockAlert>

    // API 29
    adjustStock: () => fetchJson<StatusResponse>("/inventory/stock-levels/adjust", { method: "PUT" }),

    audits: {
      // API 26
      initiate: () => fetchJson<AuditRequest>("/inventory/audits/initiate", { method: "POST" }),

      // API 27
      submitData: (id: string) => fetchJson<StatusResponse>(`/inventory/audits/${id}/data`, { method: "POST" }),

      // API 28
      getReport: (id: string) => fetchJson<AuditReport>(`/inventory/audits/${id}/report`),
    },
  },

  picking: {
    // API 13
    createPickList: (orderId: string) =>
      fetchJson<PickList>(`/warehouse/picking/create-picklist/${orderId}`, { method: "POST" }),

    // API 14
    assignPicker: (id: string, pickerId: string) =>
      fetchJson<StatusResponse>(`/warehouse/picking/picklists/${id}/assign/${pickerId}`, { method: "PUT" }),

    // API 15
    recordPick: (listId: string, itemId: string, quantity: number) =>
      fetchJson<StatusResponse>(`/warehouse/picking/picklists/${listId}/items/${itemId}/${quantity}`, {
        method: "PUT",
      }),
  },

  packing: {
    // API 16
    packOrder: (pickListId: string) =>
      fetchJson<Package>(`/warehouse/packing/pack-order/${pickListId}`, { method: "POST" }),

    // API 17
    getPackage: (id: string) => fetchJson<Package>(`/warehouse/packing/packages/${id}`),
  },

  shipping: {
    // API 18
    generateLabel: (packageId: string, carrierId: string, serviceLevel: string) =>
      fetchJson<ShippingLabel>(`/shipping/labels/generate/${packageId}/${carrierId}/${serviceLevel}`, {
        method: "POST",
      }),

    // API 19
    getLabel: (id: string) => fetchJson<ShippingLabel>(`/shipping/labels/${id}`),

    // API 20
    createManifest: (carrierId: string) =>
      fetchJson<DispatchManifest>(`/shipping/dispatch/create-manifest/${carrierId}`, { method: "POST" }),

    // API 21
    handoverManifest: (id: string) =>
      fetchJson<StatusResponse>(`/shipping/dispatch/manifests/${id}/handover`, { method: "PUT" }),

    // API 22
    trackShipment: (trackingId: string) => fetchJson<ShipmentRecord>(`/shipping/tracking/${trackingId}`),
  },

  returns: {
    // API 23
    initiate: () => fetchJson<ReturnRequest>("/returns/initiate", { method: "POST" }),

    // API 24
    approve: (id: string) => fetchJson<StatusResponse>(`/returns/requests/${id}/approve`, { method: "PUT" }),

    // API 25
    processReceived: (returnId: string) =>
      fetchJson<StatusResponse>(`/returns/process-received/${returnId}`, { method: "POST" }),
  },
}
