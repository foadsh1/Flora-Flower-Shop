import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";
import "../../assets/css/cart.css";
import { PayPalButtons } from "@paypal/react-paypal-js";

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, clearCart } =
    useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const handleQuantityChange = (productId, qty) => {
    if (qty >= 1) updateQuantity(productId, qty);
  };

  const handleApplyCoupon = async () => {
    const shopId = cart[0]?.shop_id; // ensure cart has one shop

    if (!couponCode || !shopId) {
      return toast.warn("Please enter a coupon code and ensure your cart is valid.");
    }

    try {
      const res = await axios.get(
        "http://localhost:4000/shop/coupon/validate",
        {
          params: { code: couponCode, shop_id: shopId },
          withCredentials: true,
        }
      );
      setDiscount(res.data.discount);
      toast.success(`Coupon applied! ${res.data.discount}% off`);
    } catch (err) {
      setDiscount(0);
      toast.error(err.response?.data?.error || "Coupon is not valid for this shop.");
    }
  };

  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.cartQuantity,
    0
  );
  const discountedTotal = totalPrice * (1 - discount / 100);

  const placeOrder = async () => {
    if (!user) {
      toast.warn("Please login to place an order.");
      navigate("/login");
      return;
    }

    if (cart.length === 0) {
      toast.warn("Your cart is empty.");
      return;
    }

    const shopId = cart[0].shop_id;

    try {
      await axios.post(
        "http://localhost:4000/orders/place",
        {
          cart,
          totalPrice: discountedTotal,
          shopId,
          couponCode,
          discount,
        },
        { withCredentials: true }
      );
      toast.success("Order placed successfully! 🌸");
      clearCart();
      navigate("/profile");
    } catch (err) {
      console.error("Order failed:", err);
      toast.error("Failed to place order. Try again.");
    }
  };

  return (
    <div className="cart-container">
      <h2>My Cart 🛒</h2>
      {cart.length === 0 ? (
        <p>Your cart is empty!</p>
      ) : (
        <div className="cart-main">
          <div className="cart-left">
            {cart.map((item) => (
              <div key={item.product_id} className="cart-item">
                <img
                  src={`http://localhost:4000/uploads/${item.image}`}
                  alt={item.name}
                  className="cart-image"
                />
                <div className="cart-info">
                  <h4>{item.name}</h4>
                  <p>${item.price}</p>

                  {item.quantity < 5 && (
                    <p className="low-stock-alert">
                      ⚠️ Hurry! Only {item.quantity} left in stock.
                    </p>
                  )}

                  <input
                    type="number"
                    value={item.cartQuantity}
                    min="1"
                    max={item.quantity}
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
          </div>

          <div className="cart-right">
            <h3>Subtotal: ${totalPrice.toFixed(2)}</h3>

            <div className="coupon-section">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <button onClick={handleApplyCoupon}>Apply Coupon</button>
              {discount > 0 && (
                <p className="discount-info">✅ {discount}% discount applied</p>
              )}
            </div>

            <h3>Total After Discount: ${discountedTotal.toFixed(2)}</h3>

            <div className="paypal-checkout-wrapper">
              <PayPalButtons
                style={{ layout: "horizontal" }}
                forceReRender={[discountedTotal]}
                createOrder={(data, actions) => {
                  return actions.order.create({
                    purchase_units: [
                      {
                        amount: {
                          value: discountedTotal.toFixed(2),
                        },
                      },
                    ],
                  });
                }}
                onApprove={async (data, actions) => {
                  await actions.order.capture();

                  const shopId = cart[0].shop_id;
                  try {
                    await axios.post(
                      "http://localhost:4000/orders/place",
                      {
                        cart,
                        totalPrice: discountedTotal,
                        shopId,
                        couponCode,
                        discount,
                      },
                      { withCredentials: true }
                    );
                    toast.success("Order placed and paid via PayPal! 🌸");
                    clearCart();
                    navigate("/profile");
                  } catch (err) {
                    console.error("Order placement failed:", err);
                    toast.error("Payment succeeded, but order failed.");
                  }
                }}
                onCancel={() => toast.info("Payment was cancelled.")}
                onError={(err) => {
                  console.error("PayPal error:", err);
                  toast.error("Payment failed. Please try again.");
                }}
              />
            </div>

            <button className="clear-btn" onClick={clearCart}>
              Clear Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
