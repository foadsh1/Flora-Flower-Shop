import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../assets/css/admin.css";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [tax, setTax] = useState("");
  const [newTax, setNewTax] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount_percent: "",
    expires_at: "",
  });

  const fetchUsers = () => {
    axios
      .get("http://localhost:5000/admin/users", { withCredentials: true })
      .then((res) => setUsers(res.data.users))
      .catch(() => toast.error("Failed to load users"));
  };

  const fetchCoupons = () => {
    axios
      .get("http://localhost:5000/admin/coupons", { withCredentials: true })
      .then((res) => setCoupons(res.data.coupons))
      .catch(() => toast.error("Failed to load coupons"));
  };

  const fetchTax = () => {
    axios
      .get("http://localhost:5000/admin/tax", { withCredentials: true })
      .then((res) => {
        setTax(res.data.tax);
        setNewTax(res.data.tax);
        setUpdatedAt(res.data.updatedAt);
      })
      .catch(() => toast.error("Failed to load tax"));
  };

  useEffect(() => {
    fetchUsers();
    fetchCoupons();
    fetchTax();
  }, []);

  const handleStatusChange = async (user_id, newStatus) => {
    try {
      await axios.patch(
        `http://localhost:5000/admin/users/${user_id}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      toast.success("User status updated.");
      fetchUsers();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handleAddCoupon = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/admin/coupons", newCoupon, {
        withCredentials: true,
      });
      setNewCoupon({ code: "", discount_percent: "", expires_at: "" });
      toast.success("Coupon added.");
      fetchCoupons();
    } catch (err) {
      toast.error("Add coupon failed");
    }
  };

  const toggleCouponStatus = async (coupon_id, is_active) => {
    try {
      await axios.patch(
        `http://localhost:5000/admin/coupons/${coupon_id}/status`,
        { is_active: !is_active },
        { withCredentials: true }
      );
      toast.success("Coupon status updated.");
      fetchCoupons();
    } catch (err) {
      toast.error("Failed to update coupon status");
    }
  };

  const updateTax = async () => {
    const value = parseFloat(newTax);
    if (isNaN(value) || value < 0 || value > 100) {
      return toast.error("Invalid tax value.");
    }

    try {
      const response = await axios.get("http://localhost:5000/admin/tax", {
        withCredentials: true,
      });
      const currentTax = parseFloat(response.data.tax);

      if (value === currentTax) {
        return toast.info(
          "No changes detected. Tax already set to this value."
        );
      }

      // Update tax and auto-recalculate prices
      await axios.patch(
        "http://localhost:5000/admin/tax",
        { tax_percent: value },
        { withCredentials: true }
      );
      setTax(value);
      toast.success("Tax and product prices updated successfully.");
    } catch (err) {
      toast.error("Failed to update tax.");
      console.error(err);
    }
  };

  return (
    <div className="admin-container">
      <ToastContainer
        position="bottom-right"
        autoClose={2500}
        hideProgressBar={false}
        theme="light"
        toastStyle={{
          background: "#fff5f8",
          color: "#c2185b",
          fontWeight: "bold",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          border: "1px solid #f8bbd0",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(194, 24, 91, 0.1)",
        }}
        bodyStyle={{ fontSize: "0.95rem" }}
      />

      <h2>User Management</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Change Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, index) => (
            <tr key={u.user_id}>
              <td>{index + 1}</td>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.status}</td>
              <td>
                <select
                  value={u.status}
                  onChange={(e) =>
                    handleStatusChange(u.user_id, e.target.value)
                  }
                >
                  <option value="active">active</option>
                  <option value="unactive">unactive</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Coupon Management</h2>
      <form className="coupon-form" onSubmit={handleAddCoupon}>
        <input
          type="text"
          placeholder="Code"
          value={newCoupon.code}
          onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Discount %"
          value={newCoupon.discount_percent}
          onChange={(e) =>
            setNewCoupon({ ...newCoupon, discount_percent: e.target.value })
          }
          required
          min="1"
          max="100"
        />
        <input
          type="datetime-local"
          value={newCoupon.expires_at}
          onChange={(e) =>
            setNewCoupon({ ...newCoupon, expires_at: e.target.value })
          }
          required
        />
        <button type="submit">Add Coupon</button>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Code</th>
            <th>Discount %</th>
            <th>Expires</th>
            <th>Status</th>
            <th>Toggle</th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((c, index) => (
            <tr key={c.coupon_id}>
              <td>{index + 1}</td>
              <td>{c.code}</td>
              <td>{c.discount_percent}%</td>
              <td>{new Date(c.expires_at).toLocaleString()}</td>
              <td>{c.is_active ? "Active" : "Inactive"}</td>
              <td>
                <button
                  onClick={() => toggleCouponStatus(c.coupon_id, c.is_active)}
                >
                  {c.is_active ? "Deactivate" : "Activate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Tax Settings</h2>
      <div className="tax-form">
        <label>Current Tax: {tax}%</label>
        <input
          type="number"
          value={newTax}
          onChange={(e) => setNewTax(e.target.value)}
          min="0"
          max="100"
          step="0.01"
        />
        {updatedAt && (
          <p style={{ fontSize: "0.9rem", color: "#888", marginTop: "8px" }}>
            Last updated: {new Date(updatedAt).toLocaleString()}
          </p>
        )}
        <button onClick={updateTax}>Update Tax</button>
      </div>
    </div>
  );
};

export default AdminUsers;
