// src/components/client/ReviewModal.jsx
import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "../../assets/css/reviewmodal.css";

const ReviewModal = ({ shopId, shopName, onClose, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }

    try {
      await axios.post(
        "http://localhost:4000/reviews",
        {
          shop_id: shopId,
          rating,
          comment,
        },
        { withCredentials: true }
      );
      toast.success("Thank you! Your review has been submitted 🌸");
      onReviewSubmitted(); // Refresh orders list
      onClose(); // Close modal
    } catch (err) {
      console.error("Review submission failed:", err);
      setError("Failed to submit review. Please try again.");
    }
  };

  return (
    <div className="review-modal-overlay">
      <div className="review-modal">
        <h3>Leave a Review for {shopName}</h3>

        <form onSubmit={handleSubmit} className="review-modal-form">
          <label>Rating:</label>
          <div className="star-input">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${star <= (hoverRating || rating) ? "filled" : ""}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                ★
              </span>
            ))}
          </div>

          <label>Comment:</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your review here..."
            rows="4"
            required
          />

          {error && <p className="review-error">{error}</p>}

          <div className="review-modal-buttons">
            <button type="submit">Submit Review</button>
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
  