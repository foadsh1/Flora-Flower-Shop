import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../assets/css/admin.css";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");

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
      .catch((err) => console.error("Failed to load users", err));
  };

  const fetchCoupons = () => {
    axios
      .get("http://localhost:5000/admin/coupons", { withCredentials: true })
      .then((res) => setCoupons(res.data.coupons))
      .catch((err) => console.error("Failed to load coupons", err));
  };

  useEffect(() => {
    fetchUsers();
    fetchCoupons();
  }, []);

  const handleStatusChange = async (user_id, newStatus) => {
    try {
      await axios.patch(
        `http://localhost:5000/admin/users/${user_id}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      setMessage("User status updated.");
      fetchUsers();
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const handleAddCoupon = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "http://localhost:5000/admin/coupons",
        newCoupon,
        { withCredentials: true }
      );
      setNewCoupon({ code: "", discount_percent: "", expires_at: "" });
      setMessage("Coupon added.");
      fetchCoupons();
    } catch (err) {
      console.error("Add coupon failed", err);
    }
  };

  const toggleCouponStatus = async (coupon_id, is_active) => {
    try {
      await axios.patch(
        `http://localhost:5000/admin/coupons/${coupon_id}/status`,
        { is_active: !is_active },
        { withCredentials: true }
      );
      fetchCoupons();
    } catch (err) {
      console.error("Failed to update coupon status", err);
    }
  };

  return (
    <div className="admin-container">
      <h2>User Management</h2>
      {message && <div className="success">{message}</div>}
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
          onChange={(e) =>
            setNewCoupon({ ...newCoupon, code: e.target.value })
          }
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
          placeholder="Expires At"
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
                <button onClick={() => toggleCouponStatus(c.coupon_id, c.is_active)}>
                  {c.is_active ? "Deactivate" : "Activate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUsers;
