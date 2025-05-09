import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../src/components/context/AuthContext";
import { CartProvider } from "../src/components/context/CartContext";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
     <AuthProvider>
      <CartProvider>
        <PayPalScriptProvider options={{ "client-id": "sb" }}>
          <App />
        </PayPalScriptProvider>
      </CartProvider>
    </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
