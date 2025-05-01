// src/components/client/MyOrders.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import ReviewModal from "./ReviewModal";
import "../../assets/css/myorders.css";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [reviewedShopIds, setReviewedShopIds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [reviewShopId, setReviewShopId] = useState(null);
  const [reviewShopName, setReviewShopName] = useState("");

  const fetchOrders = () => {
    axios
      .get("http://localhost:5000/orders/mine", { withCredentials: true })
      .then((res) => setOrders(res.data.orders))
      .catch((err) => console.error("Failed to fetch orders", err));
  };

  const fetchMyReviews = async () => {
    try {
      const res = await axios.get("http://localhost:5000/reviews/mine", {
        withCredentials: true,
      });
      const reviewedIds = res.data.reviews.map((r) => r.shop_id);
      setReviewedShopIds(reviewedIds);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchMyReviews();
  }, []);

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

  // Group products by order_id
  const groupedOrders = orders.reduce((acc, item) => {
    if (!acc[item.order_id]) {
      acc[item.order_id] = {
        orderDate: item.order_date,
        status: item.status,
        totalPrice: item.total_price,
        shopId: item.shop_id,
        shopName: item.shop_name,
        products: [],
      };
    }
    acc[item.order_id].products.push({
      name: item.product_name,
      image: item.product_image,
      quantity: item.quantity,
      price: item.item_price,
    });
    return acc;
  }, {});

  return (
    <div className="orders-container">
      <h2>My Orders 📦</h2>
      {Object.keys(groupedOrders).length === 0 ? (
        <p>You have no orders yet!</p>
      ) : (
        Object.entries(groupedOrders).map(([orderId, order]) => (
          <div key={orderId} className="order-card">
            <h3>Order #{orderId}</h3>
            <p>
              <strong>Date:</strong>{" "}
              {new Date(order.orderDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span
                className={`status-badge status-${order.status.toLowerCase()}`}
              >
                {order.status}
              </span>
            </p>
            <p>
              <strong>Total:</strong> ${order.totalPrice}
            </p>

            <div className="order-products">
              {order.products.map((product, index) => (
                <div key={index} className="product-item">
                  {product.image && (
                    <img
                      src={`http://localhost:5000/uploads/${product.image}`}
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

            {order.status === "Delivered" &&
              (reviewedShopIds.includes(order.shopId) ? (
                <span className="review-submitted-badge">
                  ✅ Review Submitted
                </span>
              ) : (
                <button
                  onClick={() =>
                    openReviewModal(order.shopId, order.shopName)
                  }
                  className="write-review-btn"
                >
                  Write Review
                </button>
              ))}
          </div>
        ))
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
