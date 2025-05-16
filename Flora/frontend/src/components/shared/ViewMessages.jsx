import React, { useEffect, useState,useContext } from "react";
import axios from "axios";
import "../../assets/css/messages.css";
import { AuthContext } from "../context/AuthContext";
const ViewMessages = () => {
  const [tab, setTab] = useState("admin");
  const [messages, setMessages] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [couponMessages, setCouponMessages] = useState([]);
  const { user } = useContext(AuthContext);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [hasUnreadWarnings, setHasUnreadWarnings] = useState(false);
  const [hasUnreadCoupons, setHasUnreadCoupons] = useState(false);

  useEffect(() => {
    if (!user) return;
    axios
      .get("http://localhost:5000/contact/messages/my-replies", {
        withCredentials: true,
      })
      .then((res) => {
        const msgs = res.data.messages || [];
        setMessages(msgs);
        setHasUnreadMessages(msgs.some((m) => m.is_read === 0));
      });

    axios
      .get("http://localhost:5000/contact/my-warnings", {
        withCredentials: true,
      })
      .then((res) => {
        const warns = res.data.warnings || [];
        setWarnings(warns);
        setHasUnreadWarnings(warns.some((w) => w.is_read === 0));
      });

    axios
      .get("http://localhost:5000/contact/coupon-messages", {
        withCredentials: true,
      })
      .then((res) => {
        const coupons = res.data.messages || [];
        setCouponMessages(coupons);
        setHasUnreadCoupons(coupons.some((c) => c.is_read === 0));
      });
  }, [user]);

  const markAdminMessagesRead = () => {
    axios.patch(
      "http://localhost:5000/contact/messages/mark-read",
      {},
      {
        withCredentials: true,
      }
    );
  };

  const markCouponMessagesRead = () => {
    axios.patch(
      "http://localhost:5000/contact/coupon-messages/mark-read",
      {},
      {
        withCredentials: true,
      }
    );
  };

  return (
    <div className="message-page">
      <h2>📨 Your Messages</h2>

      <div className="message-tabs">
        <button
          className={tab === "admin" ? "active" : ""}
          onClick={() => {
            setTab("admin");
            setHasUnreadMessages(false);
            markAdminMessagesRead();
          }}
        >
          💬 Admin Replies{" "}
          {hasUnreadMessages && <span className="tab-bell shake">🔔</span>}
        </button>
        <button
          className={tab === "warnings" ? "active" : ""}
          onClick={() => {
            setTab("warnings");
            setHasUnreadWarnings(false);
          }}
        >
          ⚠️ Warnings{" "}
          {hasUnreadWarnings && <span className="tab-bell shake">🔔</span>}
        </button>
        {user?.role === "client" && (
          <button
            className={tab === "coupons" ? "active" : ""}
            onClick={() => {
              setTab("coupons");
              setHasUnreadCoupons(false);
              markCouponMessagesRead();
            }}
          >
            🎟️ Coupons{" "}
            {hasUnreadCoupons && <span className="tab-bell shake">🔔</span>}
          </button>
        )}
      </div>

      {/* Admin Replies */}
      {tab === "admin" && (
        <div>
          {messages.length === 0 ? (
            <p>No replies from admin yet.</p>
          ) : (
            messages.map((m) => (
              <div className="message-card" key={m.message_id}>
                <p>
                  <strong>Your Message:</strong>
                  <br />
                  <span className="light-subject">{m.subject}</span>
                  <br />
                  {m.message}
                </p>
                <div className="admin-reply">
                  <p>
                    <strong>Admin Reply:</strong>
                  </p>
                  <p>{m.response}</p>
                  <p className="reply-timestamp">
                    <strong>Replied At:</strong>{" "}
                    {new Date(m.responded_at).toLocaleString()}
                  </p>
                  <p className="read-status">✔️ Read</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Warnings */}
      {tab === "warnings" && (
        <div>
          {warnings.length === 0 ? (
            <p>No warnings received.</p>
          ) : (
            <div className="warning-box">
              <h3>⚠️ You have {warnings.length} warning(s)</h3>
              <ul>
                {warnings.map((w, i) => (
                  <li key={i}>
                    <strong>{w.reason}</strong> —{" "}
                    {new Date(w.issued_at || w.created_at).toLocaleString()}
                    <p className="read-status">✔️ Read</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === "coupons" && user?.role === "client" && (
        <div>
          {couponMessages.length === 0 ? (
            <p>No coupon messages yet.</p>
          ) : (
            <div className="coupon-messages-section">
              {couponMessages.map((msg) => (
                <div className="message-card" key={msg.message_id}>
                  <p>
                    <strong>From Shop:</strong> {msg.shop_name}
                  </p>
                  <p>
                    <strong>Coupon Code:</strong> {msg.code} (
                    {msg.discount_percent}% off)
                  </p>
                  <p>
                    <strong>Expires At:</strong>{" "}
                    {new Date(msg.expires_at).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Message:</strong>
                    <br />
                    {msg.message}
                  </p>
                  <p className="reply-timestamp">
                    <strong>Sent At:</strong>{" "}
                    {new Date(msg.sent_at).toLocaleString()}
                  </p>
                  <p className="read-status">✔️ Read</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ViewMessages;
