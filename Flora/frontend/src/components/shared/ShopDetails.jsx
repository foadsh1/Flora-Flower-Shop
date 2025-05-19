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
  const [shopInfo, setShopInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [mapCity, setMapCity] = useState("");
  const [showMap, setShowMap] = useState(false);
  const { cart, addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    Promise.all([
      axios.get(`http://localhost:4000/shop/${id}/products`, { withCredentials: true }),
      axios.get("http://localhost:4000/shop/all", { withCredentials: true }),
    ])
      .then(([prodRes, shopRes]) => {
        setProducts(prodRes.data.products);
        const thisShop = shopRes.data.shops.find((s) => s.shop_id === parseInt(id));
        setShopInfo(thisShop || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load data", err);
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
  const vases = filtered.filter((p) => p.type === "vase");
  if (loading) return <div className="loading">Loading flowers...</div>;

  const renderProductCard = (product) => {
    const isInCart = cart.some((item) => item.product_id === product.product_id);

    return (
      <div key={product.product_id} className="product-card">
        {product.image && (
          <img
            src={`http://localhost:4000/uploads/${product.image}`}
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
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2>Shop Flower Collection</h2>
      </div>

      {shopInfo && (
        <>
          {shopInfo.shop_image && (
            <div className="shop-image-banner">
              <img
                src={`http://localhost:4000/uploads/${shopInfo.shop_image}`}
                alt={shopInfo.shop_name}
                className="shop-banner-img"
              />
            </div>
          )}
          <div className="shop-contact-box">
            <p>
              <strong>📍 Location:</strong> {shopInfo.location}
            </p>
            <button
              className="view-map-btn"
              onClick={() => {
                setMapCity(shopInfo.location);
                setShowMap(true);
              }}
            >
              Show Location in Maps
            </button>
            <p>
              <strong>📞 Phone:</strong> {shopInfo.phone || "Not available"}
            </p>
            <p>
              <strong>🕒 Hours:</strong>{" "}
              {shopInfo.working_hours || "Not specified"}
            </p>
          </div>
        </>
      )}

      <button
        className="toggle-filters-btn"
        onClick={() => setShowFilters(true)}
      >
        🔍 Filters
      </button>
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
          <option value="vase">Vases</option>
        </select>
        <button className="reset-btn" onClick={resetFilters}>
          Reset Filters
        </button>
      </div>

      <div className="product-sections">
        {/* 💐 Bouquets First */}
        {bouquets.length > 0 && (
          <div className="product-section">
            <h3>💐 Pre-made Bouquets</h3>
            <div className="products-grid">
              {bouquets.map(renderProductCard)}
            </div>
          </div>
        )}

        {/* 🌸 Single Flowers Second */}
        {singles.length > 0 && (
          <div className="product-section">
            <h3>🌸 Single Flowers</h3>
            <div className="products-grid">
              {singles.map(renderProductCard)}
            </div>
          </div>
        )}

        {/* 🏺 Vases Last */}
        {vases.length > 0 && (
          <div className="product-section">
            <h3>🏺 Decorative Vases</h3>
            <div className="products-grid">{vases.map(renderProductCard)}</div>
          </div>
        )}

        {singles.length === 0 &&
          bouquets.length === 0 &&
          vases.length === 0 && <p>No matching products found.</p>}
        {showMap && (
          <div className="map-slider">
            <button className="close-map-btn" onClick={() => setShowMap(false)}>
              ✖
            </button>
            <h3>Map: {mapCity}</h3>
            <iframe
              title="Map Preview"
              width="100%"
              height="300"
              style={{ border: "0", borderRadius: "12px" }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                mapCity
              )}&output=embed`}
            ></iframe>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopDetails;
