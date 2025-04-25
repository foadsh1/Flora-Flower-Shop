import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../assets/css/profile.css";

const ClientProfile = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    address: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/auth/profile", { withCredentials: true })
      .then((res) => {
        setUser(res.data.user);
        setForm({
          username: res.data.user.username,
          email: res.data.user.email,
          phone: res.data.user.phone || "",
          address: res.data.user.address || "",
        });
      })
      .catch((err) => console.error("Profile fetch failed", err));
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editMode) {
      setEditMode(true);
      return;
    }

    try {
      const res = await axios.patch(
        "http://localhost:5000/auth/profile",
        form,
        { withCredentials: true }
      );
      setUser(res.data.user);
      setSuccess("Profile updated!");
      setEditMode(false);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  if (!user) return <div className="loading">Loading profile...</div>;

  return (
    <div className="profile-container">
      <h2>My Profile</h2>
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleUpdate} className="profile-form">
        <label>Username</label>
        <input
          name="username"
          value={form.username}
          onChange={handleChange}
          disabled={!editMode}
        />

        <label>Email</label>
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          disabled={!editMode}
        />

        <label>Phone</label>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          disabled={!editMode}
        />

        <label>Address</label>
        <input
          name="address"
          value={form.address}
          onChange={handleChange}
          disabled={!editMode}
        />

        <button type="submit">
          {editMode ? "Save Changes" : "Edit Profile"}
        </button>
      </form>
    </div>
  );
};

export default ClientProfile;
