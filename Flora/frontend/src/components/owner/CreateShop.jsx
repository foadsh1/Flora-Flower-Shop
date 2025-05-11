import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import "../../assets/css/shop.css";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext"; // 🧠 import context

const CreateShop = () => {
  const [form, setForm] = useState({
    shop_name: "",
    location: "",
    description: "",
  });
  const [image, setImage] = useState(null);
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext); // ✅ get setUser

  useEffect(() => {
    axios
      .get("http://localhost:5000/shop/mine", { withCredentials: true })
      .then((res) => {
        if (res.data.shop) {
          navigate("/owner/dashboard");
        }
      })
      .catch((err) => console.error(err));
  }, [navigate]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImage = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    if (image) formData.append("shop_image", image);

    try {
      await axios.post("http://localhost:5000/shop/create", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      // ✅ Refresh session & shop data after creation
      const meRes = await axios.get("http://localhost:5000/auth/me", {
        withCredentials: true,
      });
      const shopRes = await axios.get("http://localhost:5000/shop/mine", {
        withCredentials: true,
      });
      const u = meRes.data.user;
      setUser({ ...u, hasShop: !!shopRes.data.shop });

      navigate("/owner/dashboard");
    } catch (err) {
      console.error("Shop creation failed:", err);
    }
  };

  return (
    <div className="shop-form-container">
      <h2>Create Your Shop</h2>
      <form
        className="shop-form"
        onSubmit={handleSubmit}
        encType="multipart/form-data"
      >
        <label>Shop Name</label>
        <input name="shop_name" type="text" required onChange={handleChange} />

        <label>Location</label>
        <input name="location" type="text" required onChange={handleChange} />

        <label>Description</label>
        <textarea name="description" onChange={handleChange}></textarea>

        <label>Shop Image</label>
        <input
          type="file"
          name="shop_image"
          accept="image/*"
          onChange={handleImage}
        />

        <button type="submit">Create Shop</button>
      </form>
    </div>
  );
};

export default CreateShop;
