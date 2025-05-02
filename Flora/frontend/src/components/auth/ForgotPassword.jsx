import React, { useState } from "react";
import "../../assets/css/auth.css";
import { toast } from "react-toastify";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email) {
      toast.warn("Please enter your email.");
      return;
    }

    // Simulate "sending" a reset link
    setTimeout(() => {
      setSent(true);
      toast.success("Reset link sent to your email 📧");
    }, 1000);
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Forgot Password</h2>

        {!sent ? (
          <>
            <p>Please enter your email to receive a reset link.</p>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit">Send Reset Link</button>
          </>
        ) : (
          <p className="auth-success">
            A reset link was sent to your email. Check your inbox!
          </p>
        )}
      </form>
    </div>
  );
};

export default ForgotPassword;
