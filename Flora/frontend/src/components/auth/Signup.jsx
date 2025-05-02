import React, { useState } from "react";
import axios from "axios";
import "../../assets/css/auth.css";
import flowerVideo from "../../assets/videos/flowers.mp4";

const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "client",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/auth/signup",
        formData,
        { withCredentials: true }
      );
      setSuccess(res.data.message);
      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "client",
      });
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed.");
    }
  };

  return (
    <div className="auth-container">
      <video autoPlay muted loop playsInline className="bg-video">
        <source src={flowerVideo} type="video/mp4" />
      </video>
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Sign Up</h2>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <input
          type="text"
          name="username"
          placeholder="Full Name"
          required
          value={formData.username}
          onChange={handleChange}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          value={formData.email}
          onChange={handleChange}
        />

        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            required
            value={formData.password}
            onChange={handleChange}
          />
          <span
            className="toggle-eye"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "🔓" : "🔒"}
          </span>
        </div>

        <div className="password-wrapper">
          <input
            type={showConfirm ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm Password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
          />
          <span
            className="toggle-eye"
            onClick={() => setShowConfirm(!showConfirm)}
          >
            {showConfirm ? "🔓" : "🔒"}
          </span>
        </div>

        <select name="role" value={formData.role} onChange={handleChange}>
          <option value="client">I'm a Client</option>
          <option value="shopowner">I'm a Shop Owner</option>
        </select>

        <button type="submit">Sign Up</button>

        <p>
          Already have an account? <a href="/login">Sign In</a>
        </p>
      </form>
    </div>
  );
};

export default Signup;
