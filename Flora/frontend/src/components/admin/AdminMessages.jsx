import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../assets/css/admin.css";

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [filterRole, setFilterRole] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = () => {
    axios
      .get("http://localhost:5000/contact/admin/messages", {
        withCredentials: true,
      })
      .then((res) => setMessages(res.data.messages || []))
      .catch(() => toast.error("Failed to load contact messages"));
  };

  const sendReply = async (message_id, response) => {
    if (!response.trim()) {
      return toast.warn("Reply cannot be empty.");
    }

    try {
      await axios.patch(
        `http://localhost:5000/contact/admin/messages/${message_id}/reply`,
        { response },
        { withCredentials: true }
      );
      toast.success("Reply sent");
      fetchMessages();
    } catch (err) {
      toast.error("Failed to send reply");
    }
  };

  const filteredMessages = messages.filter((msg) => {
    const matchesRole =
      filterRole === "all" || msg.role.toLowerCase() === filterRole;
    const matchesSearch = msg.username
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="admin-container">
      <ToastContainer />
      <h2>Contact Messages</h2>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="filter-input"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Roles</option>
          <option value="client">Client</option>
          <option value="shopowner">Shop Owner</option>
        </select>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Subject</th>
            <th>Message</th>
            <th>Reply</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredMessages.map((m) => (
            <tr key={m.message_id}>
              <td>{m.username}</td>
              <td>{m.role}</td>
              <td>{m.subject}</td>
              <td>{m.message}</td>
              <td>
                <textarea
                  placeholder="Reply..."
                  defaultValue={m.response || ""}
                  onBlur={(e) => sendReply(m.message_id, e.target.value)}
                  style={{ width: "260px", minHeight: "80px" }}
                />
              </td>
              <td>
                {m.status === "responded" ? (
                  <span className="status-responded">✔️ Replied</span>
                ) : (
                  <span className="status-pending">⏳ Pending</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminMessages;
