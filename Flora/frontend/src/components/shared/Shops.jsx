// src/components/shared/Shops.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Rating } from "react-simple-star-rating";
import "../../assets/css/shops.css";

const Shops = () => {
  const [shops, setShops] = useState([]);
  const [search, setSearch] = useState("");
  const [ratings, setRatings] = useState({});
  const [selectedShop, setSelectedShop] = useState(null);
  const [shopReviews, setShopReviews] = useState([]);
  const [showReviewsModal, setShowReviewsModal] = useState(false);

  useEffect(() => {
    axios
      .get("http://localhost:5000/shop/all", { withCredentials: true })
      .then((res) => setShops(res.data.shops))
      .catch((err) => console.error("Failed to fetch shops", err));
  }, []);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const res = await axios.get("http://localhost:5000/reviews/averages");
        const ratingsMap = {};
        res.data.ratings.forEach((r) => {
          ratingsMap[r.shop_id] = {
            avg: Number(r.averageRating),
            count: r.reviewCount,
          };
        });
        setRatings(ratingsMap);
      } catch (err) {
        console.error("Failed to fetch ratings", err);
      }
    };

    fetchRatings();
  }, []);

  const openReviewsModal = async (shopId, shopName) => {
    try {
      const res = await axios.get(`http://localhost:5000/reviews/${shopId}`);
      setShopReviews(res.data.reviews);
      setSelectedShop({ id: shopId, name: shopName });
      setShowReviewsModal(true);
    } catch (err) {
      console.error("Failed to load reviews", err);
    }
  };

  const closeReviewsModal = () => {
    setShowReviewsModal(false);
    setSelectedShop(null);
    setShopReviews([]);
  };

  return (
    <div className="shops-container">
      <h2>Explore Flower Shops</h2>
      <input
        type="text"
        placeholder="Search shops by name..."
        className="shop-search-input"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="shops-grid">
        {shops.length === 0 ? (
          <p>No shops available yet.</p>
        ) : (
          shops
            .filter((shop) =>
              shop.shop_name.toLowerCase().includes(search.toLowerCase())
            )
            .map((shop) => (
              <div key={shop.shop_id} className="shop-card">
                {shop.shop_image && (
                  <img
                    src={`http://localhost:5000/uploads/${shop.shop_image}`}
                    alt={shop.shop_name}
                    className="shop-image"
                  />
                )}
                <h3>
                  {shop.shop_name}
                  {ratings[shop.shop_id]?.avg >= 4.5 && (
                    <span className="top-rated-badge">🌟 Top Rated</span>
                  )}
                </h3>
                <p>{shop.location}</p>
                <p>{shop.description}</p>

                {ratings[shop.shop_id] ? (
                  <div className="shop-rating">
                    <Rating
                      readonly
                      initialValue={ratings[shop.shop_id].avg}
                      size={20}
                      allowFraction
                    />
                    <span className="rating-info">
                      {ratings[shop.shop_id].avg.toFixed(1)} (
                      {ratings[shop.shop_id].count})
                    </span>
                  </div>
                ) : (
                  <p className="no-rating">No ratings yet</p>
                )}

                <a href={`/shops/${shop.shop_id}`} className="view-shop-btn">
                  View Shop
                </a>

                <button
                  className="view-reviews-btn"
                  onClick={() =>
                    openReviewsModal(shop.shop_id, shop.shop_name)
                  }
                >
                  View Reviews
                </button>
              </div>
            ))
        )}
      </div>

      {showReviewsModal && (
        <div className="reviews-modal-overlay">
          <div className="reviews-modal">
            <h3>Reviews for {selectedShop.name}</h3>
            <button onClick={closeReviewsModal} className="close-modal-btn">
              ❌
            </button>
            {shopReviews.length === 0 ? (
              <p>No reviews yet.</p>
            ) : (
              shopReviews.map((review) => (
                <div key={review.review_id} className="review-box">
                  <div className="review-header">
                    <strong>{review.username}</strong>
                    <Rating
                      readonly
                      initialValue={review.rating}
                      size={18}
                      allowFraction
                    />
                  </div>
                  <p className="review-comment">“{review.comment}”</p>
                  <p className="review-date">
                    {new Date(review.review_date).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Shops;
