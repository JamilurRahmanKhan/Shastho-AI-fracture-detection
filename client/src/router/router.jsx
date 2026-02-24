/**
 * Frontend router
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Central route definitions for ShasthoAI panels (user/doctor/pharmacy/admin) and public pages.
 *
 * Project-specific notes:
 * - Avoid renaming imports/paths unless you also move the underlying page components.
 */

import { createBrowserRouter } from "react-router-dom";

import RootLayouts from "../layouts/RootLayouts";
import NoLayout from "../layouts/NoLayout";

// Public / patient UI
import Home from "../pages/Home/Home/Home";
import Pricing from "../pages/Pricing/Pricing/Pricing";
import Store from "../pages/Store/Store/Store";
import ProductDetail from "../pages/Store/ProductDetail/ProductDetail/ProductDetail";
import StoreOrders from "../pages/Store/Orders/StoreOrders";
import StoreOrderDetails from "../pages/Store/Orders/StoreOrderDetails";
import StoreOrderSuccess from "../pages/Store/Orders/StoreOrderSuccess";
import StoreAddresses from "../pages/Store/Addresses/StoreAddresses";

// Auth (User)
import Signup from "../pages/Auth/Signup/Signup/Signup";
import Login from "../pages/Auth/Login/Login/Login";
import ResetPassword from "../pages/Auth/ResetPassword/ResetPassword";

// User-only pages
import Dashboard from "../pages/Dashboard/Dashboard/Dashboard";
import Chat from "../pages/Chat/Chat/Chat";
import DoctorMessaging from "../pages/Dashboard/DoctorMessaging/DoctorMessaging";
import UserMessages from "../pages/Dashboard/Messages/Messages";
import UserProtected from "../routes/UserProtected";
import PlaceholderPage from "../pages/User/PlaceholderPage";
import UserProfile from "../pages/User/Profile/Profile";
import UserSettings from "../pages/User/Settings/Settings";
import UploadXrayPage from "../pages/User/Upload/Upload";
import ReportsPage from "../pages/User/Reports/Reports";
import HistoryPage from "../pages/User/History/History";
import RequestRolePage from "../pages/User/RequestRole/RequestRole";

// Static pages (footer links)
import StaticPage from "../pages/Static/StaticPage";
import NotFound from "../pages/Static/NotFound";

// Doctor panel
import DoctorProtected from "../routes/DoctorProtected";
import DoctorLogin from "../pages/Doctor/Login/Login";
import DoctorResetPassword from "../pages/Doctor/ResetPassword/ResetPassword";
import DoctorDashboard from "../pages/Doctor/Dashboard/Dashboard";
import DoctorPatients from "../pages/Doctor/Patients/Patients";
import DoctorPatientProfile from "../pages/Doctor/Patients/PatientProfile";
import DoctorAppointments from "../pages/Doctor/Appointments/Appointments";
import DoctorAvailability from "../pages/Doctor/Availability/Availability";
import DoctorMessages from "../pages/Doctor/Messages/Messages";
import DoctorNotifications from "../pages/Doctor/Notifications/Notifications";
import DoctorSettings from "../pages/Doctor/Settings/Settings";

// Pharmacy panel
import PharmacyProtected from "../routes/PharmacyProtected";
import PharmacyLogin from "../pages/Pharmacy/Login/Login";
import PharmacyResetPassword from "../pages/Pharmacy/ResetPassword/ResetPassword";
import PharmacyDashboard from "../pages/Pharmacy/Dashboard/Dashboard";
import PharmacyMedicines from "../pages/Pharmacy/Medicines/Medicines";
import PharmacyAddMedicine from "../pages/Pharmacy/Medicines/AddMedicine";
import PharmacyOrders from "../pages/Pharmacy/Orders/Orders";
import PharmacyOrderDetails from "../pages/Pharmacy/Orders/OrderDetails";
import PharmacyDeliveries from "../pages/Pharmacy/Deliveries/Deliveries";
import PharmacyAIRecommendations from "../pages/Pharmacy/AIRecommendations/AIRecommendations";
import PharmacyReports from "../pages/Pharmacy/Reports/Reports";
import PharmacySettings from "../pages/Pharmacy/Settings/Settings";
import PharmacyNotifications from "../pages/Pharmacy/Notifications/Notifications";
import UserNotifications from "../pages/Notifications/UserNotifications";

// Admin panel
import AdminProtected from "../routes/AdminProtected";
import AdminLayout from "../layouts/AdminLayout";
import AdminLogin from "../pages/Admin/Login/Login";
import AdminOverview from "../pages/Admin/Overview/Overview";
import AdminRoleRequests from "../pages/Admin/RoleRequests/RoleRequests";
import AdminUsers from "../pages/Admin/Users/Users";
import AdminHospitals from "../pages/Admin/Hospitals/Hospitals";
import AdminXrayCases from "../pages/Admin/XrayCases/XrayCases";
import AdminConsultations from "../pages/Admin/Consultations/Consultations";
import AdminOrders from "../pages/Admin/Orders/Orders";
import AdminPharmaPartners from "../pages/Admin/PharmaPartners/PharmaPartners";
import AdminAnalytics from "../pages/Admin/Analytics/Analytics";
import AdminSettingsPage from "../pages/Admin/Settings/Settings";
import AdminSubscriptions from "../pages/Admin/Subscriptions/Subscriptions";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayouts,
    children: [
      { index: true, Component: Home },
      { path: "pricing", Component: Pricing },
      { path: "store", Component: Store },
      { path: "store/product/:productId", Component: ProductDetail },

      // Static/footer pages
      { path: "about", Component: StaticPage },
      { path: "services", Component: StaticPage },
      { path: "blog", Component: StaticPage },
      { path: "careers", Component: StaticPage },
      { path: "help", Component: StaticPage },
      { path: "contact", Component: StaticPage },
      { path: "faq", Component: StaticPage },
      { path: "privacy", Component: StaticPage },
      { path: "terms", Component: StaticPage },
      { path: "cookies", Component: StaticPage },
      { path: "accessibility", Component: StaticPage },

      // User-protected routes (patient/user panel)
      {
        Component: UserProtected,
        children: [
          { path: "dashboard", Component: Dashboard, handle: { hideFooter: true } },
          { path: "dashboard/messages", Component: UserMessages, handle: { hideFooter: true } },
          { path: "dashboard/appointments/:appointmentId/message", Component: DoctorMessaging },
          { path: "notifications", Component: UserNotifications },
          { path: "chat", Component: Chat },
          { path: "request-role", Component: RequestRolePage },

          // Navbar/footer placeholder links
          { path: "upload", Component: UploadXrayPage },
          { path: "reports", Component: ReportsPage },
          { path: "history", Component: HistoryPage },
          { path: "profile", Component: UserProfile },
          { path: "settings", Component: UserSettings },
          { path: "analytics", Component: PlaceholderPage },
          { path: "reviews", Component: PlaceholderPage },

          // Store (user purchase history)
          { path: "store/orders", Component: StoreOrders },
          { path: "store/orders/:orderNo", Component: StoreOrderDetails },
          { path: "store/order-success/:orderNo", Component: StoreOrderSuccess },
          { path: "store/addresses", Component: StoreAddresses },
        ],
      },

      { path: "*", Component: NotFound },
    ],
  },

  // NoLayout pages (auth screens + panels)
  {
    path: "/",
    Component: NoLayout,
    children: [
      // User auth
      { path: "signup", Component: Signup },
      { path: "login", Component: Login },
      { path: "forgot-password", Component: ResetPassword },

      // Doctor panel (NoLayout + protected)
      {
        path: "doctor",
        children: [
          { path: "login", Component: DoctorLogin },
                    { path: "reset-password", Component: DoctorResetPassword },
          {
            Component: DoctorProtected,
            children: [
              { path: "dashboard", Component: DoctorDashboard },
              { path: "patients", Component: DoctorPatients },
              { path: "patients/:id", Component: DoctorPatientProfile },
              { path: "appointments", Component: DoctorAppointments },
              { path: "availability", Component: DoctorAvailability },
              { path: "messages", Component: DoctorMessages },
              { path: "notifications", Component: DoctorNotifications },
              { path: "settings", Component: DoctorSettings },
            ],
          },
        ],
      },

      // Pharmacy panel (NoLayout + protected)
      {
        path: "pharmacy",
        children: [
          { path: "login", Component: PharmacyLogin },
                    { path: "reset-password", Component: PharmacyResetPassword },
          {
            Component: PharmacyProtected,
            children: [
              { path: "dashboard", Component: PharmacyDashboard },
              { path: "medicines", Component: PharmacyMedicines },
              { path: "medicines/add", Component: PharmacyAddMedicine },
              { path: "orders", Component: PharmacyOrders },
              { path: "orders/:id", Component: PharmacyOrderDetails },
              { path: "deliveries", Component: PharmacyDeliveries },
              { path: "notifications", Component: PharmacyNotifications },
              { path: "ai-recommendations", Component: PharmacyAIRecommendations },
              { path: "reports", Component: PharmacyReports },
              { path: "settings", Component: PharmacySettings },
            ],
          },
        ],
      },

      // Admin panel (NoLayout + protected)
      {
        path: "admin",
        children: [
          { path: "login", Component: AdminLogin },
          {
            Component: AdminProtected,
            children: [
              {
                Component: AdminLayout,
                children: [
                  { index: true, Component: AdminOverview },
                  { path: "role-requests", Component: AdminRoleRequests },
                  { path: "users", Component: AdminUsers },
                  { path: "hospitals", Component: AdminHospitals },
                  { path: "xray-cases", Component: AdminXrayCases },
                  { path: "consultations", Component: AdminConsultations },
                  { path: "orders", Component: AdminOrders },
                  { path: "pharma-partners", Component: AdminPharmaPartners },
                  { path: "analytics", Component: AdminAnalytics },
                  { path: "subscriptions", Component: AdminSubscriptions },
                  { path: "settings", Component: AdminSettingsPage },
                ],
              },
            ],
          },
        ],
      },

      { path: "*", Component: NotFound },
    ],
  },
]);
