  import React, { useState, useContext } from "react";
  import axios from "axios";
  import "../../assets/css/auth.css";
  import { useNavigate } from "react-router-dom";
  import { AuthContext } from "../context/AuthContext";
  import flowerVideo from "../../assets/videos/flowers.mp4";

  const Login = () => {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { setUser } = useContext(AuthContext);

    const handleChange = (e) => {
      setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError("");

      try {
        const res = await axios.post(
          "http://localhost:4000/auth/signin",
          formData,
          { withCredentials: true }
        );

        const { user, hasShop } = res.data;
        setUser({ ...user, hasShop: user.role === "shopowner" ? hasShop : undefined });

        if (user.role === "client") {
          navigate("/");
        } else if (user.role === "shopowner") {
          res.data.hasShop
            ? navigate("/owner/dashboard")
            : navigate("/create-shop");
        } else if (user.role === "admin") {
          navigate("/admin");
        }
      } catch (err) {
        setError(err.response?.data?.error || "Login failed.");
      }
    };

    return (
      <div className="auth-container">
        <video autoPlay muted loop playsInline className="bg-video">
          <source src={flowerVideo} type="video/mp4" />
        </video>
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Sign In</h2>

          {error && <div className="auth-error">{error}</div>}

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
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "🔓" : "🔒"}
            </span>
          </div>

          <div className="auth-links">
            <a href="/forgot-password">Forgot your password?</a>
          </div>

          <button type="submit">Sign In</button>

          <p>
            Don't have an account? <a href="/signup">Sign Up</a>
          </p>
        </form>
      </div>
    );
  };

  export default Login;
