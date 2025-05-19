import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "react-toastify/dist/ReactToastify.css";
import "../../assets/css/admin.css";
import { AuthContext } from "../context/AuthContext";

const AdminUsers = () => {
  const { user: loggedInUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [tax, setTax] = useState("");
  const [newTax, setNewTax] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [showFilters, setShowFilters] = useState(false);

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

  const resetFilters = () => {
    setSearchName("");
    setSearchEmail("");
    setRoleFilter("all");
    setShowFilters(false);
  };

  const exportToExcel = () => {
    const exportData = filteredUsers.map((user, index) => ({
      "#": index + 1,
      Username: user.username,
      Email: user.email,
      Role: user.role,
      Status: user.status,
      Warnings: user.warnings || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(file, `AdminUsers_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredUsers = users
    .filter((u) => {
      const nameMatch = u.username.toLowerCase().includes(searchName.toLowerCase());
      const emailMatch = u.email.toLowerCase().includes(searchEmail.toLowerCase());
      const roleMatch =
        roleFilter === "all" || u.role === roleFilter || u.status === roleFilter;
      return nameMatch && emailMatch && roleMatch;
    })
    .sort((a, b) => {
      if (a.user_id === loggedInUser?.user_id) return -1;
      if (b.user_id === loggedInUser?.user_id) return 1;
      return 0;
    });

  return (
    <div className="admin-container">
      <ToastContainer />
      <h2>User Management</h2>

      <div className="admin-actions-bar">
        <button onClick={() => setShowFilters(!showFilters)} className="filter-toggle-btn">
          {showFilters ? "Close Filters ✖" : "Open Filters ☰"}
        </button>
        <button onClick={exportToExcel} className="export-btn">
          📥 Export to Excel
        </button>
      </div>

      {showFilters && (
        <div className="filter-bar">
          <input
            className="filter-input"
            type="text"
            placeholder="Search by name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
          <input
            className="filter-input"
            type="text"
            placeholder="Search by email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
          />
          <select
            className="filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="client">Client</option>
            <option value="shopowner">Shopowner</option>
            <option value="admin">Admin</option>
            <option value="active">Active</option>
            <option value="unactive">Unactive</option>
          </select>
          <button onClick={resetFilters} className="reset-filters-btn">
            Reset
          </button>
        </div>
      )}

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
          {filteredUsers.map((u, index) => {
            const isCurrentAdmin = u.user_id === loggedInUser?.user_id;
            return (
              <tr key={u.user_id} style={isCurrentAdmin ? { backgroundColor: "pink" } : {}}>
                <td>{index + 1}</td>
                <td>
                  {u.username}{" "}
                  {isCurrentAdmin && <span className="admin-badge">🛡️ You</span>}
                </td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.status}</td>
                <td>{u.warnings || 0}</td>
                <td>
                  {isCurrentAdmin ? (
                    <>
                      <span style={{ color: "#888" }}>—</span>
                    </>
                  ) : (
                    <>
                      <select
                        value={u.status}
                        onChange={(e) => handleStatusChange(u.user_id, e.target.value)}
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
                    </>
                  )}
                </td>
              </tr>
            );
          })}
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
