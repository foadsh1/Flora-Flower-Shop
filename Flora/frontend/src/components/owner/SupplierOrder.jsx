import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../assets/css/supplier.css";
import { toast } from "react-toastify";

const SupplierOrder = () => {
  const [flowers, setFlowers] = useState([]);
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  useEffect(() => {
    fetchFlowers();
  }, []);

  const fetchFlowers = () => {
    axios
      .get("http://localhost:4000/products/mine", { withCredentials: true })
      .then((res) => {
        const flowersWithRestock = res.data.products.map((f) => ({
          ...f,
          restockQuantity: 0,
        }));
        setFlowers(flowersWithRestock);
      })
      .catch((err) => {
        console.error("Failed to load flowers", err);
        toast.error("Failed to fetch flowers.");
      });
  };

  const handleQuantityChange = (index, value) => {
    const updated = [...flowers];
    updated[index].restockQuantity = Math.max(0, parseInt(value) || 0);
    setFlowers(updated);
  };

  const applyFilters = () => {
    return flowers
      .filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
      .filter(
        (f) =>
          (!minPrice || f.price >= parseFloat(minPrice)) &&
          (!maxPrice || f.price <= parseFloat(maxPrice))
      )
      .filter((f) => typeFilter === "all" || f.type === typeFilter)
      .filter((f) => {
        if (stockFilter === "low") return f.quantity > 0 && f.quantity < 5;
        if (stockFilter === "out") return f.quantity === 0;
        return true;
      })
      .sort((a, b) => {
        if (a.quantity === 0 && b.quantity !== 0) return -1;
        if (a.quantity !== 0 && b.quantity === 0) return 1;
        if (a.quantity < 5 && b.quantity >= 5) return -1;
        if (a.quantity >= 5 && b.quantity < 5) return 1;
        return 0;
      });
  };

  const handlePlaceOrder = () => {
    const selectedItems = flowers.filter((f) => f.restockQuantity > 0);
    if (selectedItems.length === 0) {
      toast.warning("Please select at least one item to restock.");
      return;
    }

    axios
      .post(
        "http://localhost:4000/supplier/order",
        { items: selectedItems },
        { withCredentials: true }
      )
      .then(() => {
        toast.success("Supplier order placed!");
        fetchFlowers();
      })
      .catch((err) => {
        console.error("Order error", err);
        toast.error("Failed to place order.");
      });
  };

  const filtered = applyFilters();

  return (
    <div className="supplier-container">
      <h2>Order Flowers from Supplier</h2>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="number"
          placeholder="Min Price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />
        <input
          type="number"
          placeholder="Max Price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="single">Single Flowers</option>
          <option value="bouquet">Bouquets</option>
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
        >
          <option value="all">All Stock Levels</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p>No flowers match the current filters.</p>
      ) : (
        <table className="supplier-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Current Qty</th>
              <th>Restock Amount</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((flower, idx) => (
              <tr key={flower.product_id}>
                <td>
                  {flower.image && (
                    <img
                      src={`http://localhost:4000/uploads/${flower.image}`}
                      alt={flower.name}
                      className="flower-thumb"
                    />
                  )}
                </td>
                <td>{flower.name}</td>
                <td>
                  {flower.quantity}
                  {flower.quantity === 0 ? (
                    <span className="sold-out-badge"> ❌ Sold Out</span>
                  ) : flower.quantity < 5 ? (
                    <span className="low-stock-badge"> ⚠️ Low Stock</span>
                  ) : null}
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    value={flower.restockQuantity}
                    onChange={(e) => handleQuantityChange(idx, e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button className="place-order-btn" onClick={handlePlaceOrder}>
        Place Supplier Order
      </button>
    </div>
  );
};

export default SupplierOrder;
