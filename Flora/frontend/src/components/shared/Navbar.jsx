import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import "../../assets/css/navbar.css";
import logo from "../../assets/images/logo.png";

const Navbar = () => {
  const { user, logout, loading } = useContext(AuthContext);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadWarnings, setUnreadWarnings] = useState(0);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  useEffect(() => {
    if (user?.role === "admin") {
      // ✅ Admin-specific endpoint
      axios
        .get("http://localhost:5000/contact/admin/unread-count", {
          withCredentials: true,
        })
        .then((res) => {
          setUnreadMessages(res.data.unreadCount || 0);
        })
        .catch(() => {
          setUnreadMessages(0);
        });
    } else if (user) {
      // ✅ Shopowner or Client endpoint
      axios
        .get("http://localhost:5000/contact/unread-count", {
          withCredentials: true,
        })
        .then((res) => {
          setUnreadMessages(res.data.unreadMessages || 0);
          setUnreadWarnings(res.data.unreadWarnings || 0);
        })
        .catch(() => {
          setUnreadMessages(0);
          setUnreadWarnings(0);
        });
    }
  }, [user]);

  const totalUnread = unreadMessages + unreadWarnings;
  const tooltipText = `${unreadMessages} message${
    unreadMessages !== 1 ? "s" : ""
  }, ${unreadWarnings} warning${unreadWarnings !== 1 ? "s" : ""}`;

  if (loading) return null;

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        <img src={logo} alt="Flora Logo" />
      </Link>

      <Link to="/shops" className="explore-btn">
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
          <Link to="/cart">My Cart 🛒</Link>
          <Link to="/my-orders">My Orders 📦</Link>
          <Link to="/customize">Customize Bouquet 💐</Link>
          <Link to="/contact-admin">Contact Admin</Link>
          <Link to="/my-messages" className="message-link">
            <span
              className={`notification-icon ${totalUnread > 0 ? "pulse" : ""}`}
              title={tooltipText}
            >
              🔔
              {totalUnread > 0 && (
                <span className="unread-badge">{totalUnread}</span>
              )}
            </span>{" "}
            Messages
          </Link>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}

      {user?.role === "shopowner" && (
        <div className="nav-links">
          <Link to="/owner/dashboard">Dashboard</Link>
          <Link to="/owner/supplier">Supplier Order</Link>
          {user.hasShop ? (
            <Link to="/owner/profile">My Shop Profile</Link>
          ) : (
            <Link to="/create-shop">Create Shop</Link>
          )}
          <Link to="/owner/products">Manage Products</Link>
          <Link to="/contact-admin">Contact Admin</Link>
          <Link to="/my-messages" className="message-link">
            <span
              className={`notification-icon ${totalUnread > 0 ? "pulse" : ""}`}
              title={tooltipText}
            >
              🔔
              {totalUnread > 0 && (
                <span className="unread-badge">{totalUnread}</span>
              )}
            </span>{" "}
            Messages
          </Link>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}

      {user?.role === "admin" && (
        <div className="nav-links">
          <Link to="/admin">Admin</Link>
          <Link to="/admin/messages" className="message-link">
            <span
              className={`notification-icon ${
                unreadMessages > 0 ? "pulse" : ""
              }`}
              title={`${unreadMessages} unread message${
                unreadMessages !== 1 ? "s" : ""
              }`}
            >
              🔔
              {unreadMessages > 0 && (
                <span className="unread-badge">{unreadMessages}</span>
              )}
            </span>{" "}
            Messages
          </Link>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
