// src/components/client/MyOrders.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../assets/css/myorders.css";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/orders/mine", { withCredentials: true })
      .then((res) => setOrders(res.data.orders))
      .catch((err) => console.error("Failed to fetch orders", err));
  }, []);

  // Group products by order_id
  const groupedOrders = orders.reduce((acc, item) => {
    if (!acc[item.order_id]) {
      acc[item.order_id] = {
        orderDate: item.order_date,
        status: item.status,
        totalPrice: item.total_price,
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
          </div>
        ))
      )}
    </div>
  );
};

export default MyOrders;
