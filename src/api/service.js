// src/api/service.js

import api from "./api";
import routes from "./routes";

const service = {
  /* =========================
     AUTH
  ========================= */
  login: async (data) => {
    const res = await api.post(routes.auth.login, data);
    return res.data;
  },

  /* =========================
     ANALYTICS
  ========================= */
  
  getDashboardStats: async (params) => {
    const res = await api.get(routes.analytics.dashboard, { params });
    return res.data;
  },

  getProfit: async (params) => {
    const res = await api.get(routes.analytics.profit, { params });
    return res.data;
  },

  getProductProfit: async (params) => {
    const res = await api.get(routes.analytics.productProfit, { params });
    return res.data;
  },

  getSalesAnalytics: async (params) => {
    const res = await api.get(routes.analytics.sales, { params });
    return res.data;
  },

  /* =========================
     CUSTOMERS
  ========================= */

  getCustomers: async () => {
    const res = await api.get(routes.customers.base);
    return res.data;
  },

  getCustomersForSale: async () => {
    const res = await api.get(routes.customers.allForSale);
    return res.data;
  },

  getCustomerById: async (id) => {
    const res = await api.get(routes.customers.byId(id));
    return res.data;
  },

  createCustomer: async (data) => {
    const res = await api.post(routes.customers.base, data);
    return res.data;
  },

  updateCustomer: async (id, data) => {
    const res = await api.put(routes.customers.updateById(id), data);
    return res.data;
  },

  deleteCustomer: async (id) => {
    const res = await api.delete(routes.customers.byId(id));
    return res.data;
  },

  receivePayment: async (data) => {
    const res = await api.post(routes.customers.receivePayment, data);
    return res.data;
  },

  getCustomerPayments: async (id) => {
    const res = await api.get(routes.customers.paymentsByCustomer(id));
    return res.data;
  },

  getCustomerReport: async (id, params = {}) => {
    const res = await api.get(`/customers/${id}/report`, { params });
    return res.data;
  },

  /* =========================
     PRODUCTS
  ========================= */

  getProducts: async (params) => {
    const res = await api.get(routes.products.base, { params });
    return res.data;
  },

  searchProducts: async (query) => {
    const res = await api.get(routes.products.search, {
      params: { q: query },
    });
    return res.data;
  },

  advancedProductSearch: async (data) => {
    const res = await api.post(routes.products.advancedSearch, data);
    return res.data;
  },

  getProductSuggestions: async (query) => {
    const res = await api.get(routes.products.suggestions, {
      params: { q: query },
    });
    return res.data;
  },

  getProductById: async (id) => {
    const res = await api.get(routes.products.byId(id));
    return res.data;
  },

  createProduct: async (data) => {
    const res = await api.post(routes.products.base, data);
    return res.data;
  },

  updateProduct: async (id, data) => {
    const res = await api.put(routes.products.byId(id), data);
    return res.data;
  },

  deleteProduct: async (id) => {
    const res = await api.delete(routes.products.byId(id));
    return res.data;
  },

  addStock: async (id, data) => {
    const res = await api.put(routes.products.addStock(id), data);
    return res.data;
  },

  getStockLogs: async (id) => {
    const res = await api.get(routes.products.stockLogs(id));
    return res.data;
  },

  /* =========================
     SALES
  ========================= */

  getSales: async (params) => {
    const res = await api.get(routes.sales.base, { params });
    return res.data;
  },

  getSaleById: async (id) => {
    const res = await api.get(routes.sales.byId(id));
    return res.data;
  },

  createSale: async (data) => {
    const res = await api.post(routes.sales.base, data);
    return res.data;
  },

  updateSale: async (id, data) => {
    const res = await api.put(routes.sales.byId(id), data);
    return res.data;
  },

  deleteSale: async (id) => {
    const res = await api.delete(routes.sales.byId(id));
    return res.data;
  },

  /* =========================
     EMPLOYEES
  ========================= */

  getEmployees: async () => {
    const res = await api.get(routes.employees.base);
    return res.data;
  },

  createEmployee: async (data) => {
    const res = await api.post(routes.employees.base, data);
    return res.data;
  },

  updateEmployee: async (id, data) => {
    const res = await api.put(routes.employees.byId(id), data);
    return res.data;
  },

  deleteEmployee: async (id) => {
    const res = await api.delete(routes.employees.byId(id));
    return res.data;
  },

  toggleEmployeeStatus: async (id) => {
    const res = await api.patch(routes.employees.toggleStatus(id));
    return res.data;
  },

  /* =========================
     NOTIFICATIONS
  ========================= */

  getNotifications: async (params) => {
    const res = await api.get(routes.notifications.base, { params });
    return res.data;
  },

  getUnreadCount: async () => {
    const res = await api.get(routes.notifications.unreadCount);
    return res.data;
  },

  markNotificationRead: async (id) => {
    const res = await api.put(routes.notifications.markRead(id));
    return res.data;
  },

  markAllNotificationsRead: async () => {
    const res = await api.put(routes.notifications.markAllRead);
    return res.data;
  },

  deleteNotification: async (id) => {
    const res = await api.delete(routes.notifications.deleteById(id));
    return res.data;
  },

  deleteReadNotifications: async () => {
    const res = await api.delete(routes.notifications.deleteRead);
    return res.data;
  },

  generateSystemNotifications: async () => {
    const res = await api.post(routes.notifications.generate);
    return res.data;
  },

  /* =========================
     EXPORT
  ========================= */

  exportSales: async (params) => {
    const res = await api.get(routes.export.sales, { params, responseType: "blob" });
    return res.data;
  },

  exportSalesPDF: async (params) => {
    const res = await api.get(routes.export.salesPDF, { params, responseType: "blob" });
    return res.data;
  },

  exportPayments: async (params) => {
    const res = await api.get(routes.export.payments, { params, responseType: "blob" });
    return res.data;
  },

  exportPaymentsPDF: async (params) => {
    const res = await api.get(routes.export.paymentsPDF, { params, responseType: "blob" });
    return res.data;
  },

  exportProductsExcel: async (params) => {
    const res = await api.get(routes.export.productsExcel, { params, responseType: "blob" });
    return res.data;
  },

  exportProductsPDF: async (params) => {
    const res = await api.get(routes.export.productsPDF, { params, responseType: "blob" });
    return res.data;
  },

  /* =========================
     PROFILE
  ========================= */
  getProfile: async () => {
    const res = await api.get(routes.profile.base);
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await api.put(routes.profile.base, data);
    return res.data;
  },

  getCompany: async () => {
    const res = await api.get(routes.profile.company);
    return res.data;
  },

  updateCompany: async (formData) => {
    const res = await api.put(routes.profile.company, formData);
    return res.data;
  },

  getPublicCompany: async () => {
    const res = await api.get(routes.profile.companyPublic);
    return res.data;
  },

  changePassword: async (data) => {
    const res = await api.put(routes.profile.changePassword || '/profile/password', data);
    return res.data;
  },

  /* =========================
     INVOICES
  ========================= */
  generateInvoice: async (saleId) => {
    const res = await api.get(routes.invoices.saleInvoice(saleId), {
      responseType: "blob",
    });
    return res.data;
  },

  generateSalesReport: async () => {
    const res = await api.get(routes.invoices.report);
    return res.data;
  },

  /* =========================
     PAYMENTS
  ========================= */
  getAllPayments: async (params) => {
    const res = await api.get(routes.customers.allPayments, { params });
    return res.data;
  },

  receivePayment: async (data) => {
    const res = await api.post(routes.customers.receivePayment, data);
    return res.data;
  },

  getPaymentBatch: async (batchId) => {
    const res = await api.get(routes.customers.paymentBatchDetail(batchId));
    return res.data;
  },

  updatePaymentBatch: async (batchId, data) => {
    const res = await api.put(routes.customers.updatePaymentBatch(batchId), data);
    return res.data;
  },

  deletePaymentBatch: async (batchId) => {
    const res = await api.delete(routes.customers.deletePaymentBatch(batchId));
    return res.data;
  },

  /* =========================
     DUE
  ========================= */
  checkDue: async () => {
    const res = await api.get(routes.due.check);
    return res.data;
  },

  /* =========================
     VERSION
  ========================= */
  getVersion: async () => {
    const res = await api.get(routes.version);
    return res.data;
  },

  /* =========================
     ACTIVITY & STOCK SUMMARY
  ========================= */
  getRecentActivity: async () => {
    const res = await api.get(routes.analytics.activity);
    return res.data;
  },

  getStockSummary: async (params = {}) => {
    const res = await api.get(routes.analytics.stockSummary, {
      params: { limit: 25, ...params }
    });
    return res.data;
  },

  /* =========================
     DEVICE SESSIONS
  ========================= */
  getSessions: async () => {
    const res = await api.get(routes.auth.sessions);
    return res.data;
  },

  revokeSession: async (sessionId) => {
    const res = await api.delete(routes.auth.revokeSession(sessionId));
    return res.data;
  },

  revokeAllOtherSessions: async () => {
    const res = await api.delete(routes.auth.revokeAllSessions);
    return res.data;
  },
};

export default service;


