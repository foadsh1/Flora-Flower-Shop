import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../assets/css/products.css";
import { toast } from "react-toastify";

const ShopOwnerProducts = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    base_price: "",
    quantity: "",
    type: "single",
  });
  const [image, setImage] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    axios
      .get("http://localhost:5000/products/mine", { withCredentials: true })
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

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImage = (e) => {
    setImage(e.target.files[0]);
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      base_price: "",
      quantity: "",
      type: "single",
    });
    setImage(null);
    setEditingProduct(null);
  };

  const resetFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setTypeFilter("all");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    if (image) formData.append("image", image);

    try {
      if (editingProduct) {
        await axios.patch(
          `http://localhost:5000/products/${editingProduct.product_id}`,
          formData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        setMessage("✅ Product updated successfully.");
      } else {
        await axios.post("http://localhost:5000/products", formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
        setMessage("✅ Product added successfully.");
      }

      fetchProducts();
      resetForm();
    } catch (err) {
      console.error("Submit failed:", err);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      base_price: product.base_price,
      quantity: product.quantity,
      type: product.type || "single",
    });
    setImage(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this flower?")) return;
    try {
      await axios.delete(`http://localhost:5000/products/${id}`, {
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

      return nameMatch && priceMatch && typeMatch;
    });
  };

  const filtered = applyFilters();
  const lowStock = filtered.filter((p) => p.quantity > 0 && p.quantity < 5);
  const outOfStock = filtered.filter((p) => p.quantity === 0);
  const inStock = filtered.filter((p) => p.quantity >= 5);

  const singles = inStock.filter((p) => p.type === "single");
  const bouquets = inStock.filter((p) => p.type === "bouquet");

  const renderProductCard = (product) => (
    <div key={product.product_id} className="product-card">
      {product.image && (
        <div className="image-container">
          <img
            src={`http://localhost:5000/uploads/${product.image}`}
            alt={product.name}
            className="product-image"
          />
        </div>
      )}
      <h4>{product.name}</h4>
      <p>{product.description}</p>
      <p>
        <strong>Base Price:</strong> ${product.base_price}
      </p>
      <p>
        <strong>Final Price After Tax:</strong> ${product.price}
      </p>
      <p>
        <strong>Quantity:</strong> {product.quantity}
        {product.quantity === 0 ? (
          <span className="sold-out-badge"> ❌ Sold Out</span>
        ) : product.quantity < 5 ? (
          <span className="low-stock-badge"> ⚠️ Low Stock</span>
        ) : null}
      </p>
      {product.quantity < 5 && (
        <a href="/owner/supplier" className="restock-btn">
          ➕ Restock Now
        </a>
      )}
      <div className="card-buttons">
        <button onClick={() => handleEdit(product)}>Edit</button>
        <button onClick={() => handleDelete(product.product_id)}>Delete</button>
      </div>
    </div>
  );

  return (
    <div className="products-container">
      <div className="shop-header">
        <h2>Manage My Products</h2>
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
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="single">Single Flowers</option>
          <option value="bouquet">Bouquets</option>
        </select>
        <button className="reset-btn" onClick={resetFilters}>
          Reset Filters
        </button>
      </div>

      {message && <div className="success">{message}</div>}

      <form
        className="product-form"
        onSubmit={handleSubmit}
        encType="multipart/form-data"
      >
        <h3>{editingProduct ? "Edit Product" : "Add New Product"}</h3>
        <select name="type" value={form.type} onChange={handleChange} required>
          <option value="single">🌸 Single Flower</option>
          <option value="bouquet">💐 Pre-made Bouquet</option>
        </select>
        <input
          type="text"
          name="name"
          placeholder="Product Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
        ></textarea>
        <input
          type="number"
          name="base_price"
          placeholder="Base Price (before tax)"
          value={form.base_price}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="quantity"
          placeholder="Quantity"
          value={form.quantity}
          onChange={handleChange}
          required
        />
        <input type="file" accept="image/*" onChange={handleImage} />
        <button type="submit">
          {editingProduct ? "Update Product" : "Add Product"}
        </button>
        {editingProduct && (
          <button type="button" className="cancel-btn" onClick={resetForm}>
            Cancel Edit
          </button>
        )}
      </form>

      <div className="product-sections">
        {(lowStock.length > 0 || outOfStock.length > 0) && (
          <div className="priority-stock-section">
            <h3>Low or Out-of-Stock Products</h3>
            <div className="products-grid">
              {[...lowStock, ...outOfStock].map(renderProductCard)}
            </div>
          </div>
        )}

        {singles.length > 0 && (
          <div className="product-section">
            <h3>🌸 Single Flowers</h3>
            <div className="products-grid">
              {singles.map(renderProductCard)}
            </div>
          </div>
        )}
        {bouquets.length > 0 && (
          <div className="product-section">
            <h3>💐 Pre-made Bouquets</h3>
            <div className="products-grid">
              {bouquets.map(renderProductCard)}
            </div>
          </div>
        )}
        {filtered.length === 0 && <p>No matching products found.</p>}
      </div>
    </div>
  );
};

export default ShopOwnerProducts;
