import React, { useCallback, useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "../../assets/css/dashboard.css";
import { generateReceiptPDF } from "../utils/generateReceiptCanvas";
import html2canvas from "html2canvas";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

const ShopOwnerDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [topFlowers, setTopFlowers] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);
  const [year1, setYear1] = useState(2023);
  const [year2, setYear2] = useState(2024);
  const [flowerLimit, setFlowerLimit] = useState(5);
  const [availableYears, setAvailableYears] = useState([]);
  const [compare, setCompare] = useState(false);
  const [showClientList, setShowClientList] = useState(false);
  const [allClients, setAllClients] = useState([]);
  const revenueChartRef = useRef();
  const [coupons, setCoupons] = useState([]);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount_percent: 10,
    expires_at: "",
  });
  const [showCouponSlider, setShowCouponSlider] = useState(false);
  const [sendData, setSendData] = useState({
    coupon_id: "",
    message: "",
    selectedClients: [], // array of client IDs
  });
  const [clients, setClients] = useState([]);
  const [filters, setFilters] = useState({
    orderId: "",
    clientName: "",
    status: "",
    fromDate: "",
    toDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);


  useEffect(() => {
    fetchOrders();
  }, []);
  useEffect(() => {
    if (showCouponSlider) {
      fetchCoupons();
      axios
        .get("http://localhost:4000/admin/users", { withCredentials: true })
        .then((res) => {
          const onlyClients = res.data.users.filter((u) => u.role === "client");
          setClients(onlyClients); // filtered list for display
          setAllClients(onlyClients); // full original list for search
        })
        .catch(() => toast.error("Failed to load clients"));
    }
  }, [showCouponSlider]);
  useEffect(() => {
    axios
      .get("http://localhost:4000/shop/mine", { withCredentials: true })
      .then((res) => {
        const createdYear = new Date(
          res.data.shop.created_at || "2023-01-01"
        ).getFullYear();
        const nowYear = new Date().getFullYear();
        const years = [];
        for (let y = createdYear; y <= nowYear; y++) years.push(y);
        setAvailableYears(years);
        setYear1(nowYear - 1);
        setYear2(nowYear);
      })
      .catch(() => setAvailableYears([2023, 2024, 2025]));
  }, []);


  const fetchOrders = () => {
    axios
      .get("http://localhost:4000/shop/my-orders", { withCredentials: true })
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
  const fetchCoupons = () => {
    axios
      .get("http://localhost:4000/shop/coupons", { withCredentials: true })
      .then((res) => setCoupons(res.data.coupons))
      .catch((err) => toast.error("Failed to load coupons"));
  };

  const addCoupon = () => {
    const { code, discount_percent, expires_at } = newCoupon;
    if (!code || !discount_percent || !expires_at) {
      return toast.warn("All fields are required.");
    }

    axios
      .post("http://localhost:4000/shop/coupons", newCoupon, {
        withCredentials: true,
      })
      .then(() => {
        toast.success("Coupon added!");
        setNewCoupon({ code: "", discount_percent: "", expires_at: "" });
        fetchCoupons();
      })
      .catch(() => toast.error("Failed to add coupon"));
  };

  const toggleCouponStatus = (id, currentStatus) => {
    axios
      .patch(
        `http://localhost:4000/shop/coupons/${id}/status`,
        { is_active: !currentStatus },
        { withCredentials: true }
      )
      .then(() => {
        toast.success("Status updated");
        fetchCoupons();
      })
      .catch(() => toast.error("Failed to update status"));
  };
  const sendCouponMessage = () => {
    const { coupon_id, message, selectedClients } = sendData;

    if (!coupon_id || !message.trim()) {
      return toast.warn("Please select a coupon and write a message.");
    }

    const body = {
      coupon_id,
      message,
      client_id: selectedClients.length === 1 ? selectedClients[0] : null,
      client_ids: selectedClients.length > 1 ? selectedClients : null,
    };

    axios
      .post("http://localhost:4000/shop/send-coupon-message", body, {
        withCredentials: true,
      })
      .then((res) => {
        toast.success(res.data.message || "Message sent!");
        setSendData({ coupon_id: "", message: "", selectedClients: [] });
      })
      .catch((err) => {
        console.error("Send failed:", err);
        toast.error("Failed to send coupon message.");
      });
  };


  const fetchAnalytics = useCallback(() => {
    axios
      .get("http://localhost:4000/shop/analytics", {
        params: {
          from: startDate,
          to: endDate,
          year1,
          year2,
          limit: flowerLimit,
        },
        withCredentials: true,
      })
      .then((res) => {
        setTopFlowers(res.data.topFlowers);
        setMonthlyRevenue(res.data.monthlyRevenue);
      })
      .catch((err) => console.error("Failed to load analytics", err));
  }, [startDate, endDate, year1, year2, flowerLimit]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);
  const handleDownloadChart = () => {
    if (!revenueChartRef.current) return;
    html2canvas(revenueChartRef.current).then((canvas) => {
      const link = document.createElement("a");
      link.download = "revenue_chart.png";
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  const handleStatusChange = (orderId, newStatus) => {
    setStatusMap((prev) => ({ ...prev, [orderId]: newStatus }));
  };

  const updateStatus = async (orderId) => {
    try {
      await axios.patch(
        `http://localhost:4000/orders/${orderId}/status`,
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
      const res = await axios.get(
        `http://localhost:4000/orders/${orderId}/details`,
        { withCredentials: true }
      );
      setOrderDetails(res.data);
      setSelectedOrder(orderId);
    } catch (err) {
      console.error("Failed to load order details", err);
    }
  };

  const downloadReceipt = () => {
    if (orderDetails) {
      generateReceiptPDF(orderDetails, "shopowner");
    }
  };
  const fetchComparisonRevenue = () => {
    axios
      .get("http://localhost:4000/shop/analytics/compare", {
        params: {
          year1,
          year2,
        },
        withCredentials: true,
      })
      .then((res) => {
        setMonthlyRevenue(res.data.comparison); // expected format: [{ month: 'Jan', 2023: 1200, 2024: 1800 }, ...]
      })
      .catch((err) => {
        console.error("Failed to fetch comparison revenue", err);
        toast.error("Could not load revenue comparison data.");
      });
  };


  return (
    <div className="dashboard-container">
      <h2>Shop Orders</h2>
      <button
        className="toggle-filters-btn"
        onClick={() => setShowFilters(!showFilters)}
      >
        {showFilters ? "Hide Filters ▲" : "🔍 Show Filters ▼"}
      </button>

      {showFilters && (
        <div className="filter-bar">
          <input
            type="text"
            placeholder="Order ID"
            value={filters.orderId}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, orderId: e.target.value }))
            }
          />
          <input
            type="text"
            placeholder="Client Name"
            value={filters.clientName}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, clientName: e.target.value }))
            }
          />
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value }))
            }
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
          </select>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, fromDate: e.target.value }))
            }
          />
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, toDate: e.target.value }))
            }
          />
          <button
            onClick={() =>
              setFilters({
                orderId: "",
                clientName: "",
                status: "",
                fromDate: "",
                toDate: "",
              })
            }
          >
            Reset
          </button>
          <button onClick={() => setShowFilters(false)}>Close Filters</button>
        </div>
      )}
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
              orders
                .filter((order) => {
                  const matchOrderId =
                    filters.orderId === "" ||
                    order.order_id.toString().includes(filters.orderId);
                  const matchClient =
                    filters.clientName === "" ||
                    order.client_name.toLowerCase().includes(filters.clientName.toLowerCase());
                  const matchStatus =
                    filters.status === "" || order.status === filters.status;
                  const matchFromDate =
                    filters.fromDate === "" ||
                    new Date(order.order_date) >= new Date(filters.fromDate);
                  const matchToDate =
                    filters.toDate === "" ||
                    new Date(order.order_date) <= new Date(filters.toDate);
                  return (
                    matchOrderId && matchClient && matchStatus && matchFromDate && matchToDate
                  );
                })
                .map((order) => ( 
              <React.Fragment key={order.order_id}>
                <tr>
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
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                    <button onClick={() => updateStatus(order.order_id)}>
                      Update
                    </button>
                  </td>
                  <td>
                    <button
                      className="view-details-btn"
                      onClick={() => fetchOrderDetails(order.order_id)}
                    >
                      {selectedOrder === order.order_id
                        ? "Hide"
                        : "View Details"}
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
                        <p>
                          <strong>Status:</strong> {orderDetails.status}
                        </p>
                        <p>
                          <strong>Client:</strong> {orderDetails.client_name}
                        </p>
                        <p>
                          <strong>Date:</strong>{" "}
                          {new Date(
                            orderDetails.order_date
                          ).toLocaleDateString()}
                        </p>
                        {orderDetails.coupon_code ? (
                          <>
                            <p>
                              <strong>Original Price:</strong> $
                              {(
                                orderDetails.total_price /
                                (1 - orderDetails.discount_applied / 100)
                              ).toFixed(2)}
                            </p>
                            <div className="slider-coupon">
                              <p>
                                <strong>Coupon Used:</strong>{" "}
                                {orderDetails.coupon_code}
                              </p>
                              <p>
                                <strong>Discount:</strong>{" "}
                                {orderDetails.discount_applied}%
                              </p>
                            </div>
                            <p>
                              <strong>Total After Discount:</strong> $
                              {orderDetails.total_price}
                            </p>
                          </>
                        ) : (
                          <p>
                            <strong>Total:</strong> ${orderDetails.total_price}
                          </p>
                        )}

                        <h5>Items:</h5>
                        {orderDetails.items.map((item, index) => (
                          <div key={index} className="slider-item">
                            <img
                              src={`http://localhost:4000/uploads/${item.image}`}
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

                        <div className="receipt-actions">
                          <button
                            className="download-receipt-btn"
                            onClick={downloadReceipt}
                          >
                            Download Receipt (PDF)
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
      <button
        className="toggle-coupons-btn"
        onClick={() => setShowCouponSlider(!showCouponSlider)}
      >
        {showCouponSlider ? "Hide Coupons ▲" : "🎟️ Manage Coupons ▼"}
      </button>

      {showCouponSlider && (
        <div className="inline-slider coupon-slider">
          <button
            className="close-slider"
            onClick={() => setShowCouponSlider(false)}
          >
            ×
          </button>
          <h4>Coupon Management</h4>

          <div className="coupon-form">
            <input
              type="text"
              placeholder="Coupon Code"
              value={newCoupon.code}
              onChange={(e) =>
                setNewCoupon((prev) => ({ ...prev, code: e.target.value }))
              }
            />
            <input
              type="number"
              min="1"
              max="100"
              placeholder="Discount %"
              value={newCoupon.discount_percent}
              onChange={(e) =>
                setNewCoupon((prev) => ({
                  ...prev,
                  discount_percent: parseInt(e.target.value),
                }))
              }
            />
            <input
              type="date"
              value={newCoupon.expires_at}
              onChange={(e) =>
                setNewCoupon((prev) => ({
                  ...prev,
                  expires_at: e.target.value,
                }))
              }
            />
            <button onClick={addCoupon}>Add Coupon</button>
          </div>

          <table className="coupon-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Toggle</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.coupon_id}>
                  <td>{c.code}</td>
                  <td>{c.discount_percent}%</td>
                  <td>{new Date(c.expires_at).toLocaleDateString()}</td>
                  <td>{c.is_active ? "Active" : "Inactive"}</td>
                  <td>
                    <button
                      onClick={() =>
                        toggleCouponStatus(c.coupon_id, c.is_active)
                      }
                    >
                      {c.is_active ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h4>Send Coupon with Message</h4>
          <div className="coupon-send-form">
            <select
              value={sendData.coupon_id}
              onChange={(e) =>
                setSendData((prev) => ({ ...prev, coupon_id: e.target.value }))
              }
            >
              <option value="">Select Coupon</option>
              {coupons.map((c) => (
                <option key={c.coupon_id} value={c.coupon_id}>
                  {c.code} ({c.discount_percent}%)
                </option>
              ))}
            </select>

            <textarea
              placeholder="Enter your message"
              value={sendData.message}
              onChange={(e) =>
                setSendData((prev) => ({ ...prev, message: e.target.value }))
              }
            />

            <div className="multi-select-wrapper">
              <button
                type="button"
                onClick={() => setShowClientList(!showClientList)}
                className="client-toggle-btn"
              >
                {showClientList ? "Hide Client List ▲" : "Show Client List ▼"}
              </button>
              <input
                type="text"
                placeholder="Search client by name"
                onChange={(e) => {
                  const search = e.target.value.toLowerCase();
                  const filtered = allClients.filter((c) =>
                    c.username.toLowerCase().includes(search)
                  );
                  setClients(filtered);
                }}
              />
              {showClientList && (
                <div className="client-checkboxes">
                  {clients.map((client) => (
                    <label key={client.user_id} className="client-item">
                      <input
                        type="checkbox"
                        value={client.user_id}
                        checked={sendData.selectedClients.includes(
                          client.user_id
                        )}
                        onChange={(e) => {
                          const cid = parseInt(e.target.value);
                          setSendData((prev) => {
                            const selected = prev.selectedClients.includes(cid)
                              ? prev.selectedClients.filter((id) => id !== cid)
                              : [...prev.selectedClients, cid];
                            return { ...prev, selectedClients: selected };
                          });
                        }}
                      />
                      {client.username}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="send-actions">
              <button onClick={sendCouponMessage}>Send to Selected</button>
              <button
                onClick={() =>
                  axios
                    .post(
                      "http://localhost:4000/shop/send-coupon-message",
                      {
                        coupon_id: sendData.coupon_id,
                        message: sendData.message,
                        client_id: null,
                      },
                      { withCredentials: true }
                    )
                    .then((res) => {
                      toast.success("Sent to all clients!");
                      setSendData({
                        coupon_id: "",
                        message: "",
                        selectedClients: [],
                      });
                    })
                    .catch(() => toast.error("Failed to send to all"))
                }
              >
                Send to All Clients
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        className="toggle-analytics-btn"
        onClick={() => setShowAnalytics(!showAnalytics)}
      >
        {showAnalytics ? "Hide Analytics ▲" : "📊 Show Analytics ▼"}
      </button>

      {showAnalytics && (
        <>
          <div className="analytics-filter">
            <label>Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <label>End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="analytics-chart">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h4>Top-Selling Flowers</h4>
              <div>
                <label style={{ fontSize: "0.85rem", marginRight: "4px" }}>
                  Top
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={flowerLimit}
                  onChange={(e) => setFlowerLimit(parseInt(e.target.value))}
                  style={{ width: "60px", padding: "2px 6px" }}
                />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topFlowers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalSold" fill="#c2185b" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="analytics-controls" style={{ marginTop: "1.5rem" }}>
            <label>Compare Years:</label>
            <select
              value={year1}
              onChange={(e) => setYear1(parseInt(e.target.value))}
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              value={year2}
              onChange={(e) => setYear2(parseInt(e.target.value))}
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <button
              className="compare-btn"
              onClick={() => {
                if (compare) {
                  setCompare(false);
                  fetchAnalytics(); // go back to single chart based on date
                } else {
                  setCompare(true);
                  fetchComparisonRevenue(); // show two years side-by-side
                }
              }}
            >
              {compare ? "Reset View" : "Compare"}
            </button>

            <button className="download-btn" onClick={handleDownloadChart}>
              📥 Download Revenue Chart
            </button>
          </div>

          <div className="analytics-slider">
            <div className="analytics-grid" ref={revenueChartRef}>
              {compare ? (
                <div className="analytics-chart" ref={revenueChartRef}>
                  <h4>
                    Monthly Revenue Comparison: {year1} vs {year2}
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey={year1}
                        stroke="#c2185b"
                        strokeWidth={2}
                        name={`Year ${year1}`}
                      />
                      <Line
                        type="monotone"
                        dataKey={year2}
                        stroke="#2196f3"
                        strokeWidth={2}
                        name={`Year ${year2}`}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="analytics-chart" ref={revenueChartRef}>
                  <h4>Monthly Revenue (Between Dates)</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#c2185b"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShopOwnerDashboard;