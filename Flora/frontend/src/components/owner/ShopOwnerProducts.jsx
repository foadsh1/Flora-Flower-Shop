import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../assets/css/products.css";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
const ShopOwnerProducts = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [stockFilter, setStockFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [selectedExportSection, setSelectedExportSection] = useState("");
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
  const exportToExcel = (title, items) => {
    const data = items.map((p) => ({
      Name: p.name,
      Type: p.type,
      Description: p.description,
      "Base Price": p.base_price,
      "Final Price": p.price,
      Quantity: p.quantity,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    // ✅ Clean sheet name of forbidden characters
    const safeSheetName = title.replace(/[:\\/?*[\]]/g, "").substring(0, 31); // Excel sheet names max 31 characters

    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, `${safeSheetName.replace(/\s+/g, "_")}.xlsx`);
  };
  

  // Download all
  const handleDownloadAll = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [];

    const addSection = (label, list) => {
      if (list.length === 0) return;

      wsData.push([label]); // Section header
      wsData.push([]); // spacer

      wsData.push([
        "Name", "Type", "Description", "Base Price", "Final Price", "Quantity"
      ]);

      list.forEach((p) => {
        wsData.push([
          p.name,
          p.type,
          p.description,
          p.base_price,
          p.price,
          p.quantity,
        ]);
      });

      wsData.push([]); // Spacer after section
    };

    addSection("⚠️ Low / Out-of-Stock", [...lowStock, ...outOfStock]);
    addSection("🌸 Single Flowers", singles);
    addSection("💐 Pre-made Bouquets", bouquets);
    addSection("🏺 Decorative Vases", vases);

    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, worksheet, "All_Products");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `My_Products_${new Date().toISOString().split("T")[0]}.xlsx`);
  };
  const handleDownloadSection = (section) => {
    let title = "";
    let items = [];

    if (!section) return;

    if (section === "all") {
      handleDownloadAll();
      return;
    }

    switch (section) {
      case "low":
        title = "Low_Or_Out_Of_Stock";
        items = [...lowStock, ...outOfStock];
        break;
      case "single":
        title = "Single_Flowers";
        items = singles;
        break;
      case "bouquet":
        title = "Bouquets";
        items = bouquets;
        break;
      case "vase":
        title = "Vases";
        items = vases;
        break;
      default:
        return;
    }

    if (items.length === 0) {
      toast.info(`No products found in "${title}"`);
      return;
    }

    exportToExcel(title, items);
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
  const vases = inStock.filter((p) => p.type === "vase");
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
        <div className="export-dropdown">
          <select
            value={selectedExportSection}
            onChange={(e) => setSelectedExportSection(e.target.value)}
            className="excel-select"
          >
            <option value="">📥 Select Excel Section</option>
            <option value="all">📦 All Products (with Sections)</option>
            <option value="low">⚠️ Low / Out-of-Stock</option>
            <option value="single">🌸 Single Flowers</option>
            <option value="bouquet">💐 Bouquets</option>
            <option value="vase">🏺 Vases</option>
          </select>

          <button
            className="excel-btn"
            onClick={() => handleDownloadSection(selectedExportSection)}
            disabled={!selectedExportSection}
          >
            Download Excel
          </button>
        </div>

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
            <option value="vase">Vases</option> 
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
      {/* Vases */}
      {vases.length > 0 && (
        <div className="product-section">
          <h3>🏺 Decorative Vases</h3>
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
            <tbody>{vases.map(renderProductRow)}</tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && <p>No matching products found.</p>}
    </div>
  );
};

export default ShopOwnerProducts;
