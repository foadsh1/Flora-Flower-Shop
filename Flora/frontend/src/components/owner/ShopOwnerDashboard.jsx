// src/components/owner/ShopOwnerDashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "../../assets/css/dashboard.css";

const ShopOwnerDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
    axios
      .get("http://localhost:5000/shop/my-orders", { withCredentials: true })
      .then((res) => {
        setOrders(res.data.orders);
        const map = {};
        res.data.orders.forEach((order) => {
          map[order.order_id] = order.status;
        });
        setStatusMap(map);
      })
      .catch((err) => console.error(err));
  };

  const handleStatusChange = (orderId, newStatus) => {
    setStatusMap((prev) => ({ ...prev, [orderId]: newStatus }));
  };

  const updateStatus = async (orderId) => {
    try {
      await axios.patch(
        `http://localhost:5000/orders/${orderId}/status`,
        { status: statusMap[orderId] },
        { withCredentials: true }
      );
      toast.success(`Order ${orderId} status updated! 🌸`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order status.");
    }
  };

  const fetchOrderDetails = async (orderId) => {
    if (selectedOrder === orderId) {
      setSelectedOrder(null);
      return;
    }

    try {
      const res = await axios.get(`http://localhost:5000/orders/${orderId}/details`, {
        withCredentials: true,
      });
      setOrderDetails(res.data);
      setSelectedOrder(orderId);
    } catch (err) {
      console.error("Failed to load order details", err);
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Shop Orders</h2>
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Client</th>
            <th>Date</th>
            <th>Status</th>
            <th>Change</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan="6">No orders yet.</td>
            </tr>
          ) : (
            orders.map((order) => (
              <React.Fragment key={order.order_id}>
                <tr>
                  <td>{order.order_id}</td>
                  <td>{order.client_name}</td>
                  <td>{new Date(order.order_date).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge status-${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <select
                      value={statusMap[order.order_id]}
                      onChange={(e) =>
                        handleStatusChange(order.order_id, e.target.value)
                      }
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                    <button onClick={() => updateStatus(order.order_id)}>Update</button>
                  </td>
                  <td>
                    <button
                      className="view-details-btn"
                      onClick={() => fetchOrderDetails(order.order_id)}
                    >
                      {selectedOrder === order.order_id ? "Hide" : "View Details"}
                    </button>
                  </td>
                </tr>

                {selectedOrder === order.order_id && orderDetails && (
                  <tr className="slider-row">
                    <td colSpan="6">
                      <div className="inline-slider">
                        <button
                          className="close-slider"
                          onClick={() => setSelectedOrder(null)}
                        >
                          ×
                        </button>
                        <h4>Order #{orderDetails.order_id}</h4>
                        <p><strong>Status:</strong> {orderDetails.status}</p>
                        <p><strong>Client:</strong> {orderDetails.client_name}</p>
                        <p><strong>Date:</strong> {new Date(orderDetails.order_date).toLocaleDateString()}</p>
                        <p><strong>Total:</strong> ${orderDetails.total_price}</p>

                        <h5>Items:</h5>
                        {orderDetails.items.map((item, index) => (
                          <div key={index} className="slider-item">
                            <img
                              src={`http://localhost:5000/uploads/${item.image}`}
                              alt={item.name}
                            />
                            <div>
                              <p>{item.name}</p>
                              <p>Qty: {item.quantity}</p>
                              <p>${item.price}</p>
                            </div>
                          </div>
                        ))}

                        {orderDetails.review && (
                          <div className="slider-review">
                            <h5>Client Review</h5>
                            <p>⭐ {orderDetails.review.rating}</p>
                            <p>“{orderDetails.review.comment}”</p>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ShopOwnerDashboard;
