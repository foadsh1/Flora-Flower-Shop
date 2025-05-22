import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";
import "../../assets/css/cart.css";
import { PayPalButtons } from "@paypal/react-paypal-js";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import he from "date-fns/locale/he";

registerLocale("he", he);
const Cart = () => {
  const { cart, removeFromCart, updateQuantity, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [method, setMethod] = useState("pickup");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState({ street: "", apt: "", city: "" });
  const [phone, setPhone] = useState("");
  const [workingHours, setWorkingHours] = useState({});

  const parseWorkingHoursText = (raw) => {
    if (!raw) return {};
    const [daysPart, hoursPart] = raw.trim().split(/\s(?=\d{2}:\d{2}–\d{2}:\d{2})/);
    const [open, close] = hoursPart.split("–");
    const days = daysPart.split(",").map((d) => d.trim());
    const allDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const schedule = {};
    allDays.forEach((day) => {
      schedule[day] = days.includes(day) ? { open, close } : null;
    });
    return schedule;
  };

  useEffect(() => {
    const shopId = cart[0]?.shop_id;
    if (!shopId) return;
    axios
      .get("http://localhost:4000/shop/all", { withCredentials: true })
      .then((res) => {
        const shop = res.data.shops.find((s) => s.shop_id === shopId);
        if (shop?.working_hours) {
          setWorkingHours(parseWorkingHoursText(shop.working_hours));
        }
      })
      .catch(() => toast.error("Failed to load shop info"));
  }, [cart]);

  const handleQuantityChange = (productId, qty) => {
    if (qty >= 1) updateQuantity(productId, qty);
  };

  const handleApplyCoupon = async () => {
    const shopId = cart[0]?.shop_id;
    if (!couponCode || !shopId) return toast.warn("Enter a coupon and ensure your cart is valid.");
    try {
      const res = await axios.get("http://localhost:4000/shop/coupon/validate", {
        params: { code: couponCode, shop_id: shopId },
        withCredentials: true,
      });
      setDiscount(res.data.discount);
      toast.success(`Coupon applied! ${res.data.discount}% off`);
    } catch (err) {
      setDiscount(0);
      toast.error(err.response?.data?.error || "Coupon is not valid.");
    }
  };

  const totalPrice = cart.reduce((total, item) => total + item.price * item.cartQuantity, 0);
  const discountedTotal = totalPrice * (1 - discount / 100);

  const validateDetails = () => {
    if (!date || !time) {
      toast.warn("Please select a date and time.");
      return false;
    }
    if (method === "delivery") {
      const { street, apt, city } = address;
      if (!street || !apt || !city || !phone) {
        toast.warn("Please fill in all delivery details.");
        return false;
      }
    }
    return true;
  };

  const placeOrder = async () => {
    if (!user) {
      toast.warn("Please login to place an order.");
      navigate("/login");
      return;
    }
    if (cart.length === 0) return toast.warn("Your cart is empty.");
    if (!validateDetails()) return;

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
          method,
          date,
          time,
          address: method === "delivery" ? address : null,
          phone: method === "delivery" ? phone : null,
        },
        { withCredentials: true }
      );
      toast.success("Order placed successfully! 🌸");
      clearCart();
      navigate("/profile");
    } catch (err) {
      console.error("Order failed:", err);
      toast.error("Failed to place order.");
    }
  };

  const getMinTime = () => {
    if (!date) return "00:00";
    const selected = new Date(date);
    const weekday = selected.toLocaleDateString("en", { weekday: "long" });
    const today = new Date();
    const isToday = date === today.toISOString().split("T")[0];
    if (!workingHours[weekday]) return "23:59";
    if (isToday) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      return currentTime > workingHours[weekday].open ? currentTime : workingHours[weekday].open;
    }
    return workingHours[weekday].open;
  };

  const getMaxTime = () => {
    if (!date) return "23:59";
    const selected = new Date(date);
    const weekday = selected.toLocaleDateString("en", { weekday: "long" });
    return workingHours[weekday]?.close || "23:59";
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
                      ⚠️ Only {item.quantity} left!
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

            <div className="delivery-method">
              <h4>Choose Method:</h4>
              <label className="date-label">
                📅 Select Date:
                <DatePicker
                  selected={date ? new Date(date) : null}
                  onChange={(d) => {
                    const weekday = d.toLocaleDateString("en", {
                      weekday: "long",
                    });
                    if (!workingHours[weekday]) {
                      toast.warn(`${weekday} is a closed day for this shop.`);
                      setDate("");
                      return;
                    }
                    setDate(d.toISOString().split("T")[0]);
                  }}
                  dateFormat="dd/MM/yyyy"
                  minDate={new Date()}
                  locale="en"
                  placeholderText="Select a date"
                  className="custom-datepicker"
                  wrapperClassName="datepicker-wrapper"
                />
              </label>

              <label className="date-label">
                🕒 Select Time:
                <DatePicker
                  selected={time ? new Date(`2020-01-01T${time}`) : null}
                  onChange={(d) => setTime(d.toTimeString().slice(0, 5))}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={1} // ✅ allow every minute
                  timeFormat="HH:mm"
                  dateFormat="HH:mm"
                  timeCaption="Time"
                  placeholderText="Select time"
                  className="custom-datepicker"
                  wrapperClassName="datepicker-wrapper"
                  
                />
              </label>

              <p className="note">
                ⚠️ Shop will contact you to confirm the time.
              </p>
            </div>

            {method === "delivery" && (
              <div className="delivery-details">
                <label>
                  Street:
                  <input
                    type="text"
                    value={address.street}
                    onChange={(e) =>
                      setAddress({ ...address, street: e.target.value })
                    }
                  />
                </label>
                <label>
                  Apt Number:
                  <input
                    type="text"
                    value={address.apt}
                    onChange={(e) =>
                      setAddress({ ...address, apt: e.target.value })
                    }
                  />
                </label>
                <label>
                  City:
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) =>
                      setAddress({ ...address, city: e.target.value })
                    }
                  />
                </label>
                <label>
                  Phone:
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>
              </div>
            )}

            <div className="paypal-checkout-wrapper">
              <PayPalButtons
                style={{ layout: "horizontal" }}
                forceReRender={[discountedTotal]}
                createOrder={(data, actions) => {
                  return actions.order.create({
                    purchase_units: [
                      { amount: { value: discountedTotal.toFixed(2) } },
                    ],
                  });
                }}
                onApprove={async (data, actions) => {
                  await actions.order.capture();
                  if (!validateDetails()) return;
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
                        method,
                        date,
                        time,
                        address: method === "delivery" ? address : null,
                        phone: method === "delivery" ? phone : null,
                      },
                      { withCredentials: true }
                    );
                    toast.success("Order placed via PayPal!");
                    clearCart();
                    navigate("/my-orders");
                  } catch (err) {
                    console.error("Order failed after payment:", err);
                    toast.error("Payment succeeded, but order failed.");
                  }
                }}
                onCancel={() => toast.info("Payment was cancelled.")}
                onError={(err) => {
                  console.error("PayPal error:", err);
                  toast.error("Payment failed. Try again.");
                }}
              />
            </div>

            <button className="clear-btn" onClick={clearCart}>
              Clear Cart
            </button>
            <button className="place-order-btn" onClick={placeOrder}>
              Place Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
