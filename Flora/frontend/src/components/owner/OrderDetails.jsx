// src/components/owner/OrderDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../../assets/css/orderdetails.css";
import { Rating } from "react-simple-star-rating";

const OrderDetails = () => {
  const { order_id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/orders/${order_id}/details`, {
        withCredentials: true,
      })
      .then((res) => {
        setOrder(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load order details", err);
        setLoading(false);
      });
  }, [order_id]);

  if (loading) return <div className="loading">Loading order...</div>;

  if (!order) return <div className="error">Order not found.</div>;

  return (
    <div className="order-details-container">
      <h2>Order #{order.order_id}</h2>
      <p><strong>Date:</strong> {new Date(order.order_date).toLocaleDateString()}</p>
      <p><strong>Status:</strong> {order.status}</p>
      <p><strong>Client:</strong> {order.client_name}</p>
      <p><strong>Total:</strong> ${order.total_price}</p>

      <h3>Items:</h3>
      <ul className="order-items-list">
        {order.items.map((item, index) => (
          <li key={index} className="order-item">
            <img src={`http://localhost:5000/uploads/${item.image}`} alt={item.name} />
            <div>
              <p><strong>{item.name}</strong></p>
              <p>Quantity: {item.quantity}</p>
              <p>Price per item: ${item.price}</p>
            </div>
          </li>
        ))}
      </ul>

      {order.review && (
        <div className="order-review">
          <h3>Client Review</h3>
          <Rating readonly initialValue={order.review.rating} size={20} />
          <p>{order.review.comment}</p>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
