import Home from "./components/shared/Home";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import ForgotPassword from "./components/auth/ForgotPassword"; // optional placeholder
import ClientProfile from "./components/client/ClientProfile";
import CreateShop from "./components/owner/CreateShop";
import ShopOwnerDashboard from "./components/owner/ShopOwnerDashboard";
import ShopOwnerProfile from "./components/owner/ShopOwnerProfile";
import AdminUsers from "./components/admin/AdminUsers";
import Shops from "./components/shared/Shops";

const routes = [
  { path: "/", element: <Home /> },
  { path: "/shops", element: <Shops /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/forgot-password", element: <ForgotPassword /> }, // optional
  { path: "/profile", element: <ClientProfile /> },
  { path: "/create-shop", element: <CreateShop /> },
  { path: "/owner/dashboard", element: <ShopOwnerDashboard /> },
  { path: "/owner/profile", element: <ShopOwnerProfile /> },
  { path: "/admin", element: <AdminUsers /> },
  { path: "*", element: <h2>404 - Page Not Found</h2> },
];

export default routes;
