// src/components/shared/Shops.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../assets/css/shops.css"; // we'll create simple styles


const Shops = () => {
  const [shops, setShops] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/shop/all", { withCredentials: true })
      .then((res) => setShops(res.data.shops))
      .catch((err) => console.error("Failed to fetch shops", err));
  }, []);

  return (
    <div className="shops-container">
      <h2>Explore Flower Shops</h2>
      <div className="shops-grid">
        {shops.length === 0 ? (
          <p>No shops available yet.</p>
        ) : (
          shops.map((shop) => (
            <div key={shop.shop_id} className="shop-card">
              {shop.shop_image && (
                <img
                  src={`http://localhost:5000/uploads/${shop.shop_image}`}
                  alt={shop.shop_name}
                  className="shop-image"
                />
              )}
              <h3>{shop.shop_name}</h3>
              <p>{shop.location}</p>
              <p>{shop.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Shops;
