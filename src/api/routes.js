// src/api/routes.js

const routes = {
  auth: {
    login:              "/auth/login",
    sessions:           "/auth/sessions",
    revokeSession:      (id) => `/auth/sessions/${id}`,
    revokeAllSessions:  "/auth/sessions",
  },

  analytics: {
    dashboard:     "/analytics/dashboard",
    sales:         "/analytics/sales",
    profit:        "/analytics/profit",
    productProfit: "/analytics/product-profit",
    activity:      "/analytics/activity",
    stockSummary:  "/analytics/stock-summary",
  },
  customers: {
    base: "/customers",
    allForSale: "/customers/all",
    byId: (id) => `/customers/${id}`,
    updateById: (id) => `/customers/${id}`,
    paymentsByCustomer: (id) => `/customers/${id}/payments`,
    receivePayment: "/customers/receive-payment",
    allPayments: "/customers/payments/all",
    paymentBatchDetail: (batchId) => `/customers/payments/batch/${batchId}`,
    updatePaymentBatch: (batchId) => `/customers/payments/batch/${batchId}`,
    deletePaymentBatch: (batchId) => `/customers/payments/batch/${batchId}`,
  },
  products: {
    base: "/products",
    search: "/products/search",
    suggestions: "/products/suggestions",
    byId: (id) => `/products/${id}`,
    stockLogs: (id) => `/products/${id}/stock-logs`,
    addStock: (id) => `/products/add-stock/${id}`,
    advancedSearch: "/products/search/advanced",
  },
  sales: {
    base: "/sales",
    byId: (id) => `/sales/${id}`,
  },
  employees: {
    base: "/employees",
    byId: (id) => `/employees/${id}`,
    toggleStatus: (id) => `/employees/${id}/status`,
  },
  notifications: {
    base:         "/notifications",
    unreadCount:  "/notifications/unread-count",
    generate:     "/notifications/generate",
    markAllRead:  "/notifications/read-all",
    deleteRead:   "/notifications/read",
    markRead:     (id) => `/notifications/${id}/read`,
    deleteById:   (id) => `/notifications/${id}`,
  },
  export: {
    sales: "/export/sales",
    salesPDF: "/export/sales/pdf",
    payments: "/export/payments",
    paymentsPDF: "/export/payments/pdf",
    productsExcel: "/export/products",
    productsPDF: "/export/products/pdf",
  },
  profile: {
    base: "/profile",
    company: "/profile/company",
    companyPublic: "/profile/company/public",
  },

  invoices: {
    saleInvoice: (saleId) => `/invoices/sale/${saleId}`,
    report: "/invoices/report",
  },

  due: {
    check: "/due/check",
  },

  version: "/version",
};

export default routes;
