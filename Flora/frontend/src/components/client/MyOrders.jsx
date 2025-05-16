import React, { useEffect, useState } from "react";
import axios from "axios";
import ReviewModal from "./ReviewModal";
import { generateReceiptPDF } from "../utils/generateReceiptCanvas";
import "../../assets/css/myorders.css";
import { Link } from "react-router-dom";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [reviewedShopIds, setReviewedShopIds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [reviewShopId, setReviewShopId] = useState(null);
  const [reviewShopName, setReviewShopName] = useState("");
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [shopSearch, setShopSearch] = useState("");

  useEffect(() => {
    fetchOrders();
    fetchMyReviews();
  }, []);

  const fetchOrders = () => {
    axios
      .get("http://localhost:4000/orders/mine", { withCredentials: true })
      .then((res) => {
        setOrders(res.data.orders);
        setFilteredOrders(res.data.orders);
      })
      .catch((err) => console.error("Failed to fetch orders", err));
  };

  const fetchMyReviews = async () => {
    try {
      const res = await axios.get("http://localhost:4000/reviews/mine", {
        withCredentials: true,
      });
      const reviewedIds = res.data.reviews.map((r) => r.shop_id);
      setReviewedShopIds(reviewedIds);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    }
  };

  const openReviewModal = (shopId, shopName) => {
    setReviewShopId(shopId);
    setReviewShopName(shopName);
    setShowModal(true);
  };

  const closeReviewModal = () => {
    setShowModal(false);
    setReviewShopId(null);
    setReviewShopName("");
  };

  const getTrackingSteps = (status) => {
    const steps = [
      { label: "📦 Order Confirmed", status: "Pending" },
      { label: "🛠️ Processing Your Order", status: "Processing" },
      { label: "🚚 Shipped from Warehouse", status: "Shipped" },
      { label: "📍 Out for Delivery", status: "Out for Delivery" },
      { label: "✅ Delivered to Your Address", status: "Delivered" },
    ];
    const statusOrder = steps.map((s) => s.status);
    const currentIndex = statusOrder.indexOf(status);
    return steps.map((step, idx) => ({
      ...step,
      completed: idx <= currentIndex,
    }));
  };

  const applyFilters = () => {
    let filtered = [...orders];
    if (statusFilter !== "all") {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }
    if (startDate) {
      filtered = filtered.filter((o) => new Date(o.orderDate) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter((o) => new Date(o.orderDate) <= new Date(endDate));
    }
    if (shopSearch) {
      filtered = filtered.filter((o) =>
        o.shopName.toLowerCase().includes(shopSearch.toLowerCase())
      );
    }
    setFilteredOrders(filtered);
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setShopSearch("");
    setFilteredOrders(orders);
  };

  return (
    <div className="orders-container">
      <h2>My Orders 📦</h2>
      <div className="filter-container">

        <button className="filter-toggle-btn" onClick={() => setFilterOpen(true)}>
          Open Filters ☰
        </button>

        <div className={`filter-drawer ${filterOpen ? "open" : ""}`}>
          <button className="close-btn" onClick={() => setFilterOpen(false)}>✖</button>

          <label>
            Status:
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
          </label>

          <label>
            From Date:
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>

          <label>
            To Date:
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>

          <label>
            Shop Name:
            <input
              type="text"
              value={shopSearch}
              onChange={(e) => setShopSearch(e.target.value)}
              placeholder="Search by shop name"
            />
          </label>

          <div className="filter-buttons">
            <button onClick={applyFilters}>Apply Filters</button>
            <button className="reset-filters" onClick={resetFilters}>Reset</button>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <p>You have no orders yet.</p>
      ) : (
        filteredOrders.map((order) => {
          const trackingSteps = getTrackingSteps(order.status);
          const completedSteps = trackingSteps.filter((s) => s.completed).length;

          return (
            <div key={order.order_id} className="order-card">
              <h3>Order #{order.order_id}</h3>
              <p>
                <strong>Shop:</strong>{" "}
                <Link to={`/shops/${order.shopId}`} className="shop-link">
                  {order.shopName}
                </Link>
              </p>
              <p><strong>Date:</strong> {new Date(order.orderDate).toLocaleDateString()}</p>
              <p><strong>Status:</strong>{" "}
                <span className={`status-badge status-${order.status.toLowerCase().replace(/\s/g, "-")}`}>
                  {order.status}
                </span>
              </p>
              {order.coupon_code && (
                <>
                  <p><strong>Coupon:</strong> {order.coupon_code} ({order.discount_applied}% off)</p>
                  <p><strong>Total Before Discount:</strong>{" "}
                    ${(
                      order.totalPrice / (1 - parseFloat(order.discount_applied || 0) / 100)
                    ).toFixed(2)}
                  </p>
                </>
              )}
              <p><strong>Total Paid:</strong> ${order.totalPrice}</p>
              <p><strong>Tax Included:</strong> {order.tax_percent}%</p>

              <div className="order-method-box">
                <h4>{order.method === "delivery" ? "🚚 Delivery Details" : "🏪 Pickup Details"}</h4>
                <p><strong>Method:</strong> {order.method}</p>
                <p><strong>Date:</strong> {new Date(order.deliveryDate).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {order.deliveryTime || "-"}</p>
                {order.method === "delivery" && order.address && (
                  <>
                    <p><strong>Address:</strong> {order.address.street}, Apt {order.address.apt}</p>
                    <p><strong>City:</strong> {order.address.city}</p>
                    <p><strong>Phone:</strong> {order.address.phone}</p>
                  </>
                )}
              </div>

              <div className="order-products">
                {order.products.map((product, index) => (
                  <div key={index} className="product-item">
                    {product.image && (
                      <img
                        src={`http://localhost:4000/uploads/${product.image}`}
                        alt={product.name}
                      />
                    )}
                    <div>
                      <h4>{product.name}</h4>
                      <p>Quantity: {product.quantity}</p>
                      <p>Price per item: ${product.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="track-btn"
                onClick={() =>
                  setTrackingOrderId(trackingOrderId === order.order_id ? null : order.order_id)
                }
              >
                {trackingOrderId === order.order_id ? "Close Tracking" : "Track Shipment"}
              </button>

              {trackingOrderId === order.order_id && (
                <div className="tracking-slider">
                  <h4>Shipment Tracking</h4>
                  <div className="progress-line-container">
                    <div className="progress-line-fill" style={{ "--step-count": completedSteps }}></div>
                    <div className="progress-container">
                      {trackingSteps.map((step, idx) => {
                        const isLastCompleted =
                          step.completed && (!trackingSteps[idx + 1] || !trackingSteps[idx + 1].completed);
                        return (
                          <div
                            key={idx}
                            className={`progress-step ${step.completed ? "completed" : ""}`}
                          >
                            <div className={`progress-dot ${isLastCompleted ? "ping" : ""}`}></div>
                            <span>{step.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {order.status === "Delivered" &&
                (reviewedShopIds.includes(order.shopId) ? (
                  <span className="review-submitted-badge">✅ Review Submitted</span>
                ) : (
                  <button
                    onClick={() => openReviewModal(order.shopId, order.shopName)}
                    className="write-review-btn"
                  >
                    Write Review
                  </button>
                ))}

              <button
                className="receipt-download-btn"
                onClick={() =>
                  generateReceiptPDF(
                    {
                      order_id: order.order_id,
                      order_date: order.orderDate,
                      status: order.status,
                      shop_name: order.shopName,
                      items: order.products,
                      total_price: order.totalPrice,
                      coupon_code: order.coupon_code,
                      discount_applied: order.discount_applied,
                      tax_percent: order.tax_percent,
                      method: order.method,
                      delivery_date: order.deliveryDate,
                      delivery_time: order.deliveryTime,
                      address: order.address || null,
                    },
                    "client"
                  )
                }
              >
                Download Receipt
              </button>
            </div>
          );
        })
      )}

      {showModal && (
        <ReviewModal
          shopId={reviewShopId}
          shopName={reviewShopName}
          onClose={closeReviewModal}
          onReviewSubmitted={() => {
            fetchOrders();
            fetchMyReviews();
          }}
        />
      )}
    </div>
  );
};

export default MyOrders;
