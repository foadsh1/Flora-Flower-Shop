import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../assets/css/shopdetails.css";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

const ShopDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const { cart, addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/shop/${id}/products`, {
        withCredentials: true,
      })
      .then((res) => {
        setProducts(res.data.products);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load products", err);
        setLoading(false);
      });
  }, [id]);

  const resetFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setTypeFilter("all");
  };

  const applyFilters = () => {
    return products.filter((product) => {
      const nameMatch = product.name.toLowerCase().includes(search.toLowerCase());
      const priceMatch =
        (!minPrice || product.price >= parseFloat(minPrice)) &&
        (!maxPrice || product.price <= parseFloat(maxPrice));
      const typeMatch = typeFilter === "all" || product.type === typeFilter;

      return nameMatch && priceMatch && typeMatch;
    });
  };

  const filtered = applyFilters();
  const singles = filtered.filter((p) => p.type === "single");
  const bouquets = filtered.filter((p) => p.type === "bouquet");

  if (loading) return <div className="loading">Loading flowers...</div>;

  const renderProductCard = (product) => {
    const isInCart = cart.some((item) => item.product_id === product.product_id);

    return (
      <div key={product.product_id} className="product-card">
        {product.image && (
          <img
            src={`http://localhost:5000/uploads/${product.image}`}
            alt={product.name}
            className="product-image"
          />
        )}
        <h4>{product.name}</h4>
        <p>{product.description}</p>
        <p>
          <strong>Price:</strong> ${product.price}
        </p>
        <p>
          <strong>Available:</strong> {product.quantity}
          {product.quantity === 0 ? (
            <span className="sold-out-badge">❌ Sold Out</span>
          ) : product.quantity < 5 ? (
            <span className="low-stock-badge">⚠️ Low Stock</span>
          ) : null}
        </p>

        {product.quantity === 0 ? (
          <button className="sold-out-btn" disabled>
            Sold Out
          </button>
        ) : !user ? (
          <a href="/login" className="login-to-cart-btn">
            Login to Add to Cart
          </a>
        ) : user.role === "client" ? (
          <button
            className="add-cart-btn"
            disabled={isInCart}
            onClick={() => {
              if (!isInCart) {
                addToCart({ ...product, shop_id: Number(id) });
                toast.success(`${product.name} added to cart! 🌸`);
              }
            }}
          >
            {isInCart ? "In Cart" : "Add to Cart"}
          </button>
        ) : (
          <button className="add-cart-btn" disabled>
            Add to Cart (Clients Only)
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="shop-details-container">
      <div className="shop-header">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <h2>Shop Flower Collection</h2>
        <button className="toggle-filters-btn" onClick={() => setShowFilters(true)}>
          🔍 Filters
        </button>
      </div>

      {/* 🔲 Overlay when filter is open */}
      {showFilters && <div className="filter-overlay" onClick={() => setShowFilters(false)} />}

      {/* 🔽 Slide-in Filter Panel */}
      <div className={`filter-slider ${showFilters ? "open" : ""}`}>
        <div className="filter-header">
          <h3>Filters</h3>
          <button className="close-btn" onClick={() => setShowFilters(false)}>❌</button>
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

      <div className="product-sections">
        {singles.length > 0 && (
          <div className="product-section">
            <h3>🌸 Single Flowers</h3>
            <div className="products-grid">{singles.map(renderProductCard)}</div>
          </div>
        )}
        {bouquets.length > 0 && (
          <div className="product-section">
            <h3>💐 Pre-made Bouquets</h3>
            <div className="products-grid">{bouquets.map(renderProductCard)}</div>
          </div>
        )}
        {singles.length === 0 && bouquets.length === 0 && (
          <p>No matching products found.</p>
        )}
      </div>
    </div>
  );
};

export default ShopDetails;
