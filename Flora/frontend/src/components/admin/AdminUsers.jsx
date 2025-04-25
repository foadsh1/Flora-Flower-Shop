import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../assets/css/admin.css";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");

  const fetchUsers = () => {
    axios
      .get("http://localhost:5000/admin/users", { withCredentials: true })
      .then((res) => setUsers(res.data.users))
      .catch((err) => console.error("Failed to load users", err));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusChange = async (user_id, newStatus) => {
    try {
      await axios.patch(
        `http://localhost:5000/admin/users/${user_id}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      setMessage("User status updated.");
      fetchUsers(); // reload the table
    } catch (err) {
      console.error("Update failed", err);
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
    </div>
  );
};

export default AdminUsers;
