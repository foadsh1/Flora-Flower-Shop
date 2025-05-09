import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../../assets/css/shopdetails.css";
import { useContext } from "react";
import { CartContext } from "../context/CartContext"; 
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";

const ShopDetails = () => {
  const { id } = useParams(); // shop_id from URL
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
const { addToCart } = useContext(CartContext);
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

  if (loading) return <div className="loading">Loading flowers...</div>;

  return (
    <div className="shop-details-container">
      <h2>Flower Collection</h2>
      <div className="products-grid">
        {products.length === 0 ? (
          <p>No flowers available at this shop.</p>
        ) : (
          products.map((product) => (
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
              ) : user?.role === "client" ? (
                <button
                    onClick={() => {
                      addToCart({ ...product, shop_id: Number(id) }); // ⬅️ include shop_id
                      toast.success(`${product.name} added to cart! 🌸`);
                    }}
                  className="add-cart-btn"
                >
                  Add to Cart
                </button>
              ) : (
                <a href="/login" className="login-to-cart-btn">
                  Login to Add to Cart
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ShopDetails;
