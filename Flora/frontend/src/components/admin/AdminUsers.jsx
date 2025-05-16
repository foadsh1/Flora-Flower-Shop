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

  useEffect(() => {
    fetchUsers();
    fetchTax();
  }, []);

  const fetchUsers = () => {
    axios
      .get("http://localhost:4000/admin/users", { withCredentials: true })
      .then((res) => setUsers(res.data.users))
      .catch(() => toast.error("Failed to load users"));
  };

  const fetchTax = () => {
    axios
      .get("http://localhost:4000/admin/tax", { withCredentials: true })
      .then((res) => {
        setTax(res.data.tax);
        setNewTax(res.data.tax);
        setUpdatedAt(res.data.updatedAt);
      })
      .catch(() => toast.error("Failed to load tax"));
  };

  const handleStatusChange = async (user_id, newStatus) => {
    try {
      await axios.patch(
        `http://localhost:4000/admin/users/${user_id}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      toast.success("User status updated.");
      fetchUsers();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const updateTax = async () => {
    const value = parseFloat(newTax);
    if (isNaN(value) || value < 0 || value > 100) {
      return toast.error("Invalid tax value.");
    }

    try {
      const response = await axios.get("http://localhost:4000/admin/tax", {
        withCredentials: true,
      });
      const currentTax = parseFloat(response.data.tax);

      if (value === currentTax) {
        return toast.info("No changes detected.");
      }

      await axios.patch(
        "http://localhost:4000/admin/tax",
        { tax_percent: value },
        { withCredentials: true }
      );
      setTax(value);
      toast.success("Tax updated successfully.");
    } catch (err) {
      toast.error("Failed to update tax.");
    }
  };

  const issueWarning = async (user_id) => {
    try {
      await axios.post(
        "http://localhost:4000/contact/warnings",
        { user_id, reason: "Misbehavior" },
        { withCredentials: true }
      );
      toast.success("Warning issued.");
      fetchUsers();
    } catch (err) {
      toast.error("Failed to issue warning");
    }
  };

  return (
    <div className="admin-container">
      <ToastContainer />
      <h2>User Management</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Warnings</th>
            <th>Actions</th>
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
              <td>{u.warnings || 0}</td>
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
                <button
                  className="warn-btn"
                  disabled={u.warnings >= 3}
                  onClick={() => issueWarning(u.user_id)}
                >
                  ⚠️ Warn
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
