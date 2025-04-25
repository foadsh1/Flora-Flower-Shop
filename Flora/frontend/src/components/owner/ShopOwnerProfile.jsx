import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../assets/css/shop-profile.css";

const ShopOwnerProfile = () => {
  const [shop, setShop] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    shop_name: "",
    location: "",
    description: "",
  });
  const [image, setImage] = useState(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/shop/mine", { withCredentials: true })
      .then((res) => {
        if (res.data.shop) {
          setShop(res.data.shop);
          setForm({
            shop_name: res.data.shop.shop_name,
            location: res.data.shop.location,
            description: res.data.shop.description || "",
          });
        }
      })
      .catch((err) => console.error("Failed to load shop:", err));
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImage = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editMode) {
      setEditMode(true);
      return;
    }

    const formData = new FormData();
    formData.append("shop_name", form.shop_name);
    formData.append("location", form.location);
    formData.append("description", form.description);
    if (image) {
      formData.append("shop_image", image);
    }

    try {
      await axios.patch("http://localhost:5000/shop/update", formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setSuccess("Shop profile updated!");
      setEditMode(false);
      setImage(null); // clear image after upload
      // refresh the image if changed
      const updated = await axios.get("http://localhost:5000/shop/mine", {
        withCredentials: true,
      });
      setShop(updated.data.shop);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  if (!shop) return <div className="loading">Loading shop profile...</div>;

  return (
    <div className="profile-container">
      <h2>My Shop Profile</h2>
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleSubmit} className="profile-form">
        <label>Shop Name</label>
        <input
          name="shop_name"
          value={form.shop_name}
          onChange={handleChange}
          disabled={!editMode}
        />

        <label>Location</label>
        <input
          name="location"
          value={form.location}
          onChange={handleChange}
          disabled={!editMode}
        />

        <label>Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          disabled={!editMode}
        ></textarea>

        <label>Shop Image</label>
        {shop.shop_image && (
          <img
            src={`http://localhost:5000/uploads/${shop.shop_image}`}
            alt="shop"
            style={{
              width: "100%",
              maxWidth: "300px",
              borderRadius: "10px",
              marginBottom: "1rem",
            }}
          />
        )}

        {editMode && (
          <>
            <input type="file" accept="image/*" onChange={handleImage} />
          </>
        )}

        <button type="submit">
          {editMode ? "Save Changes" : "Edit Profile"}
        </button>
      </form>
    </div>
  );
};

export default ShopOwnerProfile;
