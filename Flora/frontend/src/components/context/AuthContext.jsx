import React, { createContext, useEffect, useState } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndShop = async () => {
      try {
        const res = await axios.get("http://localhost:5000/auth/me", {
          withCredentials: true,
        });

        const u = res.data.user;

        if (u.role === "shopowner") {
          try {
            const shopRes = await axios.get("http://localhost:5000/shop/mine", {
              withCredentials: true,
            });
            const hasShop = !!shopRes.data.shop;
            setUser({ ...u, hasShop, warnings: u.warnings });
          } catch {
            setUser({ ...u, hasShop: false, warnings: u.warnings });
          }
        } else {
          setUser({ ...u, warnings: u.warnings });
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndShop();
  }, []);

  const logout = async () => {
    await axios.post(
      "http://localhost:5000/auth/signout",
      {},
      { withCredentials: true }
    );
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
