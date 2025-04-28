// src/components/client/Cart.jsx
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { toast } from "react-toastify"; // ✅ import toast
import "../../assets/css/cart.css";

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, clearCart } =
    useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleQuantityChange = (productId, qty) => {
    if (qty >= 1) updateQuantity(productId, qty);
  };

  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const placeOrder = async () => {
    if (!user) {
      toast.warn("Please login to place an order."); // ✅ instead of alert
      navigate("/login");
      return;
    }

    if (cart.length === 0) {
      toast.warn("Your cart is empty."); // ✅ instead of alert
      return;
    }

    const shopId = cart[0].shop_id; // Assuming all flowers from the same shop
    const totalPrice = cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    try {
      await axios.post(
        "http://localhost:5000/orders/place",
        {
          cart,
          totalPrice,
          shopId,
        },
        { withCredentials: true }
      );
      toast.success("Order placed successfully! 🌸"); // ✅ Success popup
      clearCart();
      navigate("/profile");
    } catch (err) {
      console.error("Order failed:", err);
      toast.error("Failed to place order. Try again."); // ✅ Error popup
    }
  };

  return (
    <div className="cart-container">
      <h2>My Cart 🛒</h2>
      {cart.length === 0 ? (
        <p>Your cart is empty!</p>
      ) : (
        <>
          {cart.map((item) => (
            <div key={item.product_id} className="cart-item">
              <img
                src={`http://localhost:5000/uploads/${item.image}`}
                alt={item.name}
                className="cart-image"
              />
              <div className="cart-info">
                <h4>{item.name}</h4>
                <p>${item.price}</p>
                <input
                  type="number"
                  value={item.quantity}
                  min="1"
                  onChange={(e) =>
                    handleQuantityChange(
                      item.product_id,
                      parseInt(e.target.value)
                    )
                  }
                />
                <button onClick={() => removeFromCart(item.product_id)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
          <div className="cart-summary">
            <h3>Total: ${totalPrice.toFixed(2)}</h3>
            <button className="checkout-btn" onClick={placeOrder}>
              Proceed to Checkout
            </button>
            <button className="clear-btn" onClick={clearCart}>
              Clear Cart
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
