import React, { createContext, useEffect, useState } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:5000/auth/me", { withCredentials: true })
      .then((res) => {
        const u = res.data.user;

        if (u.role === "shopowner") {
          axios
            .get("http://localhost:5000/shop/mine", { withCredentials: true })
            .then((res2) => {
              setUser({ ...u, hasShop: !!res2.data.shop });
            })
            .catch(() => setUser({ ...u, hasShop: false }))
            .finally(() => setLoading(false));
        } else {
          setUser(u);
          setLoading(false);
        }
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  const logout = async () => {
    await axios.post(
      "http://localhost:5000/auth/signout",
      {},
      { withCredentials: true }
    );
    setUser(null); // ✅ cart will reset automatically in CartContext
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
