import React, { useState, useContext } from "react";
import axios from "axios";
import "../../assets/css/contactus.css";
import { AuthContext } from "../context/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ContactUs = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    subject: "",
    category: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) {
      return toast.error("Please fill in subject and message.");
    }

    if (!user) {
      return toast.error("You must be logged in to contact admin.");
    }

    try {
      setLoading(true);
      await axios.post(
        "http://localhost:5000/contact/message",
        {
          ...formData,
          user_id: user.user_id,
          role: user.role,
        },
        { withCredentials: true }
      );
      toast.success("Message sent successfully!");
      setFormData({ subject: "", category: "", message: "" });
    } catch (err) {
      toast.error("Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-container">
      <ToastContainer position="bottom-right" autoClose={3000} />
      <h2>Contact Admin</h2>
      <p className="contact-subtext">
        We'd love to hear your feedback, questions, or complaints.
      </p>
      <form className="contact-form" onSubmit={handleSubmit}>
        <label>Subject *</label>
        <input
          type="text"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          placeholder="Enter the subject..."
        />

        <label>Category (optional)</label>
        <select name="category" value={formData.category} onChange={handleChange}>
          <option value="">Select a category</option>
          <option value="Feedback">Feedback</option>
          <option value="Complaint">Complaint</option>
          <option value="Technical">Technical Issue</option>
          <option value="Other">Other</option>
        </select>

        <label>Your Message *</label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Write your message here..."
        ></textarea>

        <button type="submit" className="send-btn" disabled={loading}>
          {loading ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
};

export default ContactUs;
