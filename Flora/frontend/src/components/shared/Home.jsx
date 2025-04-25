import React from "react";
import "../../assets/css/home.css";
 // Add your image to this path

const Home = () => {
  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-text">
          <h1>Welcome to Flora 🌸</h1>
          <p>
            Discover beautiful flower shops near you, place orders, and share
            love with nature's colors.
          </p>
          <a href="/shops" className="explore-btn">
            Explore Shops
          </a>
        </div>
      </div>

      <div className="features-section">
        <h2>Why Flora?</h2>
        <div className="features">
          <div className="feature-box">
            <h3>💐 Shop by Occasion</h3>
            <p>
              Birthday? Anniversary? We’ve got you covered with flowers for
              every event.
            </p>
          </div>
          <div className="feature-box">
            <h3>🚚 Track Your Orders</h3>
            <p>
              Real-time status updates for all your purchases. Always know where
              your bouquet is!
            </p>
          </div>
          <div className="feature-box">
            <h3>🌍 Nearby Stores</h3>
            <p>
              Browse flower shops by rating and location to support local
              businesses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
