import React, { useEffect, useState } from "react";
import axios from "axios";
import { Rating } from "react-simple-star-rating";
import "../../assets/css/shops.css";
import israeliCities from "../../data/israeliCities"; // Top 30 cities
import { Link } from "react-router-dom";
const Shops = () => {
  const [shops, setShops] = useState([]);
  const [search, setSearch] = useState("");
  const [ghostSuggestion, setGhostSuggestion] = useState("");
  const [ratings, setRatings] = useState({});
  const [selectedShop, setSelectedShop] = useState(null);
  const [shopReviews, setShopReviews] = useState([]);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selectedCity, setSelectedCity] = useState("");
  const [mapCity, setMapCity] = useState("");
  const [showMap, setShowMap] = useState(false);

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

  const filteredShops = shops
    .filter((shop) => {
      const nameMatch = shop.shop_name.toLowerCase().includes(search.toLowerCase());
      const locationMatch = shop.location.toLowerCase().includes(search.toLowerCase());
      const cityMatch =
        selectedCity === "" ||
        shop.location.toLowerCase() === selectedCity.toLowerCase();

      if (filter === "top") {
        return (nameMatch || locationMatch) &&
          cityMatch &&
          ratings[shop.shop_id]?.avg >= 4.5;
      }

      return (nameMatch || locationMatch) && cityMatch;
    })
    .sort((a, b) => {
      const r1 = ratings[a.shop_id]?.avg || 0;
      const r2 = ratings[b.shop_id]?.avg || 0;
      return r2 - r1;
    });

  return (
    <div className="shops-container">
      <h2>Explore Flower Shops</h2>

      <div className="shop-search-controls">
        {/* Search bar */}
        <div className="autocomplete-wrapper">
          <input
            type="text"
            placeholder="Search by name or city...🔍"
            className="shop-search-input"
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              setSearch(value);
              const matches = shops
                .map((s) => s.shop_name)
                .filter((name) =>
                  name.toLowerCase().startsWith(value.toLowerCase())
                );
              setGhostSuggestion(matches.length > 0 ? matches[0] : "");
            }}
          />
          {ghostSuggestion &&
            search &&
            ghostSuggestion.toLowerCase() !== search.toLowerCase() && (
              <div className="ghost-text">
                <span style={{ color: "transparent" }}>{search}</span>
                <span className="ghost-complete">
                  {ghostSuggestion.slice(search.length)}
                </span>
              </div>
            )}
        </div>

        {/* City filter */}
        <div className="city-filter">
          <label>City:</label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            <option value="">All Cities</option>
            {israeliCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Rating filter */}
        <div className="rating-filter">
          <label>Sort:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="top">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Shops display */}
      <div className="shops-grid">
        {filteredShops.length === 0 ? (
          <p>No shops available.</p>
        ) : (
          filteredShops.map((shop) => (
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
              <button
                className="view-map-btn"
                onClick={() => {
                  setMapCity(shop.location);
                  setShowMap(true);
                }}
              >
                Show Location in Maps
              </button>
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

              <Link to={`/shops/${shop.shop_id}`} className="view-shop-btn">
                View Shop
              </Link>

              <button
                className="view-reviews-btn"
                onClick={() => openReviewsModal(shop.shop_id, shop.shop_name)}
              >
                View Reviews
              </button>
            </div>
          ))
        )}
      </div>

      {/* Map slider panel */}
      {showMap && (
        <div className="map-slider">
          <button className="close-map-btn" onClick={() => setShowMap(false)}>
            ✖
          </button>
          <h3>Map: {mapCity}</h3>
          <iframe
            title="Test Map"
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

      {/* Review modal */}
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
