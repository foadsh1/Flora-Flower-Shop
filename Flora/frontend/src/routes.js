import Home from "./components/shared/Home";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import ForgotPassword from "./components/auth/ForgotPassword";
import ClientProfile from "./components/client/ClientProfile";
import CreateShop from "./components/owner/CreateShop";
import ShopOwnerDashboard from "./components/owner/ShopOwnerDashboard";
import ShopOwnerProfile from "./components/owner/ShopOwnerProfile";
import AdminUsers from "./components/admin/AdminUsers";
import AdminMessages from "./components/admin/AdminMessages"; // ✅ NEW
import Shops from "./components/shared/Shops";
import ShopOwnerProducts from "./components/owner/ShopOwnerProducts";
import ShopDetails from "./components/shared/ShopDetails";
import Cart from "./components/client/Cart";
import MyOrders from "./components/client/MyOrders";
import CustomizeBouquet from "./components/client/customize/CustomizeBouquet";
import SupplierOrder from "./components/owner/SupplierOrder";
import ContactUs from "./components/shared/ContactUs";
import ViewMessages from "./components/shared/ViewMessages";

const routes = [
  { path: "/", element: <Home /> },
  { path: "/shops", element: <Shops /> },
  { path: "/shops/:id", element: <ShopDetails /> },
  { path: "/cart", element: <Cart /> },
  { path: "/my-orders", element: <MyOrders /> },
  { path: "/customize", element: <CustomizeBouquet /> },
  { path: "/owner/supplier", element: <SupplierOrder /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/owner/products", element: <ShopOwnerProducts /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/profile", element: <ClientProfile /> },
  { path: "/create-shop", element: <CreateShop /> },
  { path: "/owner/dashboard", element: <ShopOwnerDashboard /> },
  { path: "/owner/profile", element: <ShopOwnerProfile /> },
  { path: "/admin", element: <AdminUsers /> },
  { path: "/admin/messages", element: <AdminMessages /> }, // ✅ NEW
  { path: "/contact-admin", element: <ContactUs /> },
  { path: "/my-messages", element: <ViewMessages /> },
  { path: "*", element: <h2>404 - Page Not Found</h2> },
];

export default routes;
