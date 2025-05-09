import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../assets/css/messages.css";

const ViewMessages = () => {
  const [messages, setMessages] = useState([]);
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    // ✅ Fetch admin replies
    axios
      .get("http://localhost:5000/contact/messages/my-replies", {
        withCredentials: true,
      })
      .then((res) => setMessages(res.data.messages || []))
      .catch(() => console.error("Failed to load messages"));

    // ✅ Fetch admin-issued warnings
    axios
      .get("http://localhost:5000/contact/my-warnings", {
        withCredentials: true,
      })
      .then((res) => setWarnings(res.data.warnings || []))
      .catch(() => console.error("Failed to load warnings"));

    // ✅ Mark messages as read
    axios
      .patch("http://localhost:5000/contact/messages/mark-read", {}, {
        withCredentials: true,
      })
      .catch(() => console.warn("Failed to mark messages as read"));
  }, []);

  return (
    <div className="message-page">
      <h2>Messages from Admin</h2>

      {/* ⚠️ Warnings Section */}
      {warnings.length > 0 && (
        <div className="warning-box">
          <h3>⚠️ You have received {warnings.length} warning(s)</h3>
          <ul>
            {warnings.map((w, i) => (
              <li key={i}>
                <strong>{w.reason}</strong> —{" "}
                {new Date(w.issued_at || w.created_at).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 💬 Messages Section */}
      {messages.length === 0 ? (
        <p>No messages yet.</p>
      ) : (
        messages.map((m) => (
          <div className="message-card" key={m.message_id}>
            <p>
              <strong>Your Message:</strong><br />
              <em>{m.subject}</em><br />
              {m.message}
            </p>

            {m.response ? (
              <div className="admin-reply">
                <p><strong>Admin Reply:</strong></p>
                <p>{m.response}</p>
                <p className="reply-timestamp">
                  <strong>Replied At:</strong>{" "}
                  {new Date(m.responded_at).toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="no-reply">⏳ Awaiting response from admin...</p>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ViewMessages;
