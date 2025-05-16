import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../assets/css/products.css";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const ShopOwnerProducts = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [stockFilter, setStockFilter] = useState("all");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    axios
      .get("http://localhost:4000/products/mine", { withCredentials: true })
      .then((res) => {
        const lowStock = res.data.products.filter((p) => p.quantity < 5);
        if (lowStock.length > 0) {
          toast.warning(`⚠️ ${lowStock.length} flowers are low on stock!`, {
            autoClose: 3000,
          });
        }
        setProducts(res.data.products);
      })
      .catch((err) => console.error("Failed to load products", err));
  };

  const resetFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setTypeFilter("all");
    setStockFilter("all");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this flower?")) return;
    try {
      await axios.delete(`http://localhost:4000/products/${id}`, {
        withCredentials: true,
      });
      setMessage("🗑️ Product deleted successfully.");
      fetchProducts();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const applyFilters = () => {
    return products.filter((product) => {
      const nameMatch = product.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const priceMatch =
        (!minPrice || product.price >= parseFloat(minPrice)) &&
        (!maxPrice || product.price <= parseFloat(maxPrice));
      const typeMatch = typeFilter === "all" || product.type === typeFilter;

      const stockMatch =
        stockFilter === "all" ||
        (stockFilter === "low" &&
          product.quantity > 0 &&
          product.quantity < 5) ||
        (stockFilter === "out" && product.quantity === 0);

      return nameMatch && priceMatch && typeMatch && stockMatch;
    });
  };

  const filtered = applyFilters();
  const lowStock = filtered.filter((p) => p.quantity > 0 && p.quantity < 5);
  const outOfStock = filtered.filter((p) => p.quantity === 0);
  const inStock = filtered.filter((p) => p.quantity >= 5);
  const singles = inStock.filter((p) => p.type === "single");
  const bouquets = inStock.filter((p) => p.type === "bouquet");

  const renderProductRow = (product) => (
    <tr key={product.product_id}>
      <td>
        {product.image && (
          <img
            src={`http://localhost:4000/uploads/${product.image}`}
            alt={product.name}
            style={{ width: "60px", borderRadius: "6px" }}
          />
        )}
      </td>
      <td>{product.name}</td>
      <td>{product.type}</td>
      <td>{product.description}</td>
      <td>${product.base_price}</td>
      <td>${product.price}</td>
      <td>
        {product.quantity}
        {product.quantity === 0 ? (
          <span className="sold-out-badge"> ❌ Sold Out</span>
        ) : product.quantity < 5 ? (
          <span className="low-stock-badge"> ⚠️ Low Stock</span>
        ) : null}
      </td>
      <td>
        {product.quantity < 5 && (
          <a href="/owner/supplier" className="restock-btn">
            ➕ Restock
          </a>
        )}
      </td>
      <td>
        <button
          className="btn btn-secondary"
          onClick={() => navigate(`/owner/products/edit/${product.product_id}`)}
        >
          Edit
        </button>
        <button
          className="btn btn-danger"
          onClick={() => handleDelete(product.product_id)}
        >
          Delete
        </button>
      </td>
    </tr>
  );

  return (
    <div className="products-container">
      <div className="shop-header">
        <h2>Manage My Products</h2>
        <button
          onClick={() => navigate("/owner/products/new")}
          className="add-btn"
        >
          ➕ Add New Product
        </button>
        <button
          className="toggle-filters-btn"
          onClick={() => setShowFilters(true)}
        >
          🔍 Filters
        </button>
      </div>

      {showFilters && (
        <div className="filter-overlay" onClick={() => setShowFilters(false)} />
      )}
      <div className={`filter-slider ${showFilters ? "open" : ""}`}>
        <div className="filter-header">
          <h3>Filters</h3>
          <button className="close-btn" onClick={() => setShowFilters(false)}>
            ❌
          </button>
        </div>
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
        <label>
          Type:
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="single">Single Flowers</option>
            <option value="bouquet">Bouquets</option>
          </select>
        </label>

        <label>
          Stock:
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="all">All Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </label>
        <button className="reset-btn" onClick={resetFilters}>
          Reset Filters
        </button>
      </div>

      {message && <div className="success">{message}</div>}

      {/* Priority Section */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="product-section priority-stock-section">
          <h3>⚠️ Low / Out-of-Stock</h3>
          <table className="products-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Type</th>
                <th>Description</th>
                <th>Base Price</th>
                <th>Final Price</th>
                <th>Quantity</th>
                <th>Restock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>{[...lowStock, ...outOfStock].map(renderProductRow)}</tbody>
          </table>
        </div>
      )}

      {/* Single Flowers */}
      {singles.length > 0 && (
        <div className="product-section">
          <h3>🌸 Single Flowers</h3>
          <table className="products-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Type</th>
                <th>Description</th>
                <th>Base Price</th>
                <th>Final Price</th>
                <th>Quantity</th>
                <th>Restock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>{singles.map(renderProductRow)}</tbody>
          </table>
        </div>
      )}

      {/* Bouquets */}
      {bouquets.length > 0 && (
        <div className="product-section">
          <h3>💐 Pre-made Bouquets</h3>
          <table className="products-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Type</th>
                <th>Description</th>
                <th>Base Price</th>
                <th>Final Price</th>
                <th>Quantity</th>
                <th>Restock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>{bouquets.map(renderProductRow)}</tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && <p>No matching products found.</p>}
    </div>
  );
};

export default ShopOwnerProducts;
