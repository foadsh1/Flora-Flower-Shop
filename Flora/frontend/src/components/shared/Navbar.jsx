import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../../assets/css/navbar.css";

const Navbar = () => {
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (loading) return null;

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        Flora 🌸
      </Link>
      <Link to="/shops" className="nav-links">
        Explore Shops
      </Link>

      {!user && (
        <div className="nav-links">
          <Link to="/login">Login</Link>
          <Link to="/signup">Sign Up</Link>
        </div>
      )}

      {user?.role === "client" && (
        <div className="nav-links">
          <Link to="/profile">My Profile</Link>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}

      {user?.role === "shopowner" && (
        <div className="nav-links">
          <Link to="/owner/dashboard">Dashboard</Link>
          {user.hasShop ? (
            <Link to="/create-shop">Create Shop</Link>
          ) : (
            <Link to="/owner/profile">My Shop Profile</Link>
          )}
          <Link to="/owner/products">Manage Products</Link>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}

      {user?.role === "admin" && (
        <div className="nav-links">
          <Link to="/admin">Admin</Link>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
