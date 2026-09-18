/**
 * Permission constants
 * Must match the Permission enum used by the backend.
 */
export const P = {
  // ============================================================
  // Overview
  // ============================================================
  DASHBOARD_VIEW: "DASHBOARD_VIEW",
  CAN_CHECK_ALL_PICK_LISTS: "CAN_CHECK_ALL_PICK_LISTS",
  CAN_CHECK_ALL_PUTAWAY_EXECUTE: "CAN_CHECK_ALL_PUTAWAY_EXECUTE",
  CAN_CHECK_ALL_PICKING_RETURN_ORDERS: "CAN_CHECK_ALL_PICKING_RETURN_ORDERS",
  // ============================================================
  // Purchase
  // ============================================================
  PURCHASE_VIEW: "PURCHASE_VIEW",
  PURCHASE_REQUEST: "PURCHASE_REQUEST",
  PURCHASE_REQUEST_APPROVAL: "PURCHASE_REQUEST_APPROVAL",
  RFQS: "RFQS",
  PURCHASE_ORDER: "PURCHASE_ORDER",
  PURCHASE_ORDER_APPROVAL: "PURCHASE_ORDER_APPROVAL",

  // ============================================================
  // Purchase Rejected / Return
  // ============================================================
  PURCHASE_REJECTED: "PURCHASE_REJECTED",
  RETURN_REQUEST_APPROVAL: "RETURN_REQUEST_APPROVAL",
  PURCHASE_RETURN_REQUEST: "PURCHASE_RETURN_REQUEST",
  PURCHASE_RETURN_ORDERS: "PURCHASE_RETURN_ORDERS",
  PICKING_RETURN_ORDERS: "PICKING_RETURN_ORDERS",
  RETURN_QUALITY_CHECK: "RETURN_QUALITY_CHECK",
  PACKING_RETURN_ORDER: "PACKING_RETURN_ORDER",
  PACKED_RETURN_ORDER: "PACKED_RETURN_ORDER",
  RETURN_DISPATCHES: "RETURN_DISPATCHES",

  // ============================================================
  // Inbound
  // ============================================================
  INBOUND_VIEW: "INBOUND_VIEW",
  INBOUND: "INBOUND",
  GATE_ENTRY: "GATE_ENTRY",
  MATERIAL_UNLOADING: "MATERIAL_UNLOADING",
  GOODS_RECEIVING: "GOODS_RECEIVING",
  QUALITY_CHECKING: "QUALITY_CHECKING",
  QUALITY_APPROVAL: "QUALITY_APPROVAL",
  GRN: "GRN",

  // ============================================================
  // QR / Barcode
  // ============================================================
  QR_CODE_GENERATOR: "QR_CODE_GENERATOR",
  BARCODE_SCANNER: "BARCODE_SCANNER",

  // ============================================================
  // Putaway
  // ============================================================
  PUTAWAY_VIEW: "PUTAWAY_VIEW",
  PUTAWAY_ASSIGNMENT_MANAGEMENT: "PUTAWAY_ASSIGNMENT_MANAGEMENT",
  PUTAWAY_EXECUTE: "PUTAWAY_EXECUTE",
  PUTAWAY_CONFIRMATION_MANAGEMENT: "PUTAWAY_CONFIRMATION_MANAGEMENT",
  PUTAWAY_INITIATE: "PUTAWAY_INITIATE",
  PUTAWAY_CONFIRMATION: "PUTAWAY_CONFIRMATION",
  INVENTORY: "INVENTORY",
  OUTBOUND: "OUTBOUND",
  // ============================================================
  // Inventory
  // ============================================================
  INVENTORY_VIEW: "INVENTORY_VIEW",
  INVENTORY_STOCK_MANAGEMENT: "INVENTORY_STOCK_MANAGEMENT",
  INVENTORY_ADJUST: "INVENTORY_ADJUST",

  // ============================================================
  // Fulfillment
  // ============================================================
  ORDERS_VIEW: "ORDERS_VIEW",
  ORDERS_CREATE: "ORDERS_CREATE",

  PICKING_VIEW: "PICKING_VIEW",
  PICKING_EXECUTE: "PICKING_EXECUTE",
  PICKING: "PICKING",
  TROLLEYS_VIEW: "TROLLEYS_VIEW",
  TROLLEYS_CREATE: "TROLLEYS_CREATE",
  TROLLEYS_ASSIGN: "TROLLEYS_ASSIGN",

  PACKING_VIEW: "PACKING_VIEW",
  PACKING_EXECUTE: "PACKING_EXECUTE",
  PICKING_CONFIRMATION: "PICKING_CONFIRMATION",
  SHIPPING_VIEW: "SHIPPING_VIEW",
  SHIPPING_CONFIRM: "SHIPPING_CONFIRM",
  LABELS: "LABELS",

  // ============================================================
  // Additional Fulfillment
  // ============================================================
  SALES_ORDER_APPROVE: "SALES_ORDER_APPROVE",
  CREATE_PICK_TASK: "CREATE_PICK_TASK",
  ALL_CONFIRMATION: "ALL_CONFIRMATION",
  PACKAGES: "PACKAGES",
  DELIVERY_CHALLANS: "DELIVERY_CHALLANS",
  DISPATCH: "DISPATCH",
  SHIPMENT_CONFIRMATIONS: "SHIPMENT_CONFIRMATIONS",
  DELIVERIES: "DELIVERIES",

  // ============================================================
  // Labels
  // ============================================================
  LABELS_VIEW: "LABELS_VIEW",
  LABELS_PRINT: "LABELS_PRINT",

  // ============================================================
  // Admin / Masters
  // ============================================================
  MASTER_VIEW: "MASTER_VIEW",
  MASTER_MANAGE: "MASTER_MANAGE",

  USERS_VIEW: "USERS_VIEW",
  USERS_MANAGE: "USERS_MANAGE",

  // ============================================================
  // Reports
  // ============================================================
  REPORTS_VIEW: "REPORTS_VIEW",
  REPORTS_EXPORT: "REPORTS_EXPORT",
};
