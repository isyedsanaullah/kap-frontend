// components/layout/MainLayout.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header.jsx";
import Content from "./Content.jsx";

import Dashboard        from "../../pages/Dashboard";
import Products         from "../../pages/products/Products";
import ProductNew       from "../../pages/products/ProductNew";
import ProductDetail    from "../../pages/products/ProductDetail";
import ProductEdit      from "../../pages/products/ProductEdit";
import Customers        from "../../pages/customers/Customers";
import CustomerDetail   from "../../pages/customers/CustomerDetail";
import CustomerEdit     from "../../pages/customers/CustomerEdit";
import Sales            from "../../pages/sales/Sales";
import SaleDetail       from "../../pages/sales/SaleDetail";
import SaleEdit         from "../../pages/sales/SaleEdit";
import Analytics        from "../../pages/analytics/Analytics";
import ProfitAnalytics  from "../../pages/analytics/ProfitAnalytics";
import Employees        from "../../pages/Employees";
import PaymentHistory   from "../../pages/payments/PaymentHistory";
import PaymentDetail    from "../../pages/payments/PaymentDetail";
import DueReminders     from "../../pages/DueReminders";
import ExportReports    from "../../pages/ExportReports";
import Profile          from "../../pages/Profile";
import Notifications    from "../../pages/Notifications";
import Stock            from "../../pages/stock/Stock";
import Drafts           from "../../pages/Drafts";

const MainLayout = () => {

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden">
      {/* LEFT SIDEBAR */}
      <Sidebar />

      {/* RIGHT SIDE */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* FIXED HEADER */}
        <Header />

        {/* SCROLLABLE CONTENT */}
        <Content>
          <Routes>
            <Route path="/"                    element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard"           element={<Dashboard />} />

            {/* Products */}
            <Route path="/products"            element={<Products />} />
            <Route path="/products/new"        element={<ProductNew />} />
            <Route path="/products/:id"        element={<ProductDetail />} />
            <Route path="/products/:id/edit"   element={<ProductEdit />} />

            {/* Customers */}
            <Route path="/customers"           element={<Customers />} />
            <Route path="/customers/:id"       element={<CustomerDetail />} />
            <Route path="/customers/:id/edit"  element={<CustomerEdit />} />

            {/* Sales */}
            <Route path="/sales"               element={<Sales />} />
            <Route path="/sales/new"           element={<SaleEdit />} />
            <Route path="/sales/:id"           element={<SaleDetail />} />
            <Route path="/sales/:id/edit"      element={<SaleEdit />} />

            {/* Analytics */}
            <Route path="/analytics"           element={<Analytics />} />
            <Route path="/analytics/profit"    element={<ProfitAnalytics />} />

            {/* Others */}
            <Route path="/employees"           element={<Employees />} />
            <Route path="/payment-history"     element={<PaymentHistory />} />
            <Route path="/payment-history/:id" element={<PaymentDetail />} />
            <Route path="/payments/:id"        element={<PaymentDetail />} />
            <Route path="/due-reminders"       element={<DueReminders />} />
            <Route path="/export-reports"      element={<ExportReports />} />
            <Route path="/profile"             element={<Profile />} />
            <Route path="/notifications"       element={<Notifications />} />
            <Route path="/stock"               element={<Stock />} />
            <Route path="/drafts"              element={<Drafts />} />
          </Routes>
        </Content>
      </div>
    </div>
  );
};

export default MainLayout;