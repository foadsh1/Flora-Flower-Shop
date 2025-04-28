// src/components/owner/ShopOwnerDashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "../../assets/css/dashboard.css";

const ShopOwnerDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  

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
      fetchOrders(); // Refetch orders
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order status.");
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
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan="5">No orders yet.</td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order.order_id}>
                <td>{order.order_id}</td>
                <td>{order.client_name}</td>
                <td>{new Date(order.order_date).toLocaleDateString()}</td>
                <td>
                  <span
                    className={`status-badge status-${order.status.toLowerCase()}`}
                  >
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
                  <button onClick={() => updateStatus(order.order_id)}>
                    Update
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ShopOwnerDashboard;
