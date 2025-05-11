import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../assets/css/shop-profile.css";

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const ShopOwnerProfile = () => {
  const [shop, setShop] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    shop_name: "",
    location: "",
    description: "",
    phone: "",
    working_hours: "",
  });
  const [selectedDays, setSelectedDays] = useState([]);
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("18:00");
  const [image, setImage] = useState(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/shop/mine", { withCredentials: true })
      .then((res) => {
        if (res.data.shop) {
          const shopData = res.data.shop;
          setShop(shopData);
          setForm({
            shop_name: shopData.shop_name,
            location: shopData.location,
            description: shopData.description || "",
            phone: shopData.phone || "",
            working_hours: shopData.working_hours || "",
          });

          // Parse working hours string into state (if formatted properly)
          if (shopData.working_hours) {
            const match = shopData.working_hours.match(/^(.+?) (\d{2}:\d{2})–(\d{2}:\d{2})$/);
            if (match) {
              const [, days, open, close] = match;
              const dayArr = days.split(",").map((d) => d.trim());
              setSelectedDays(dayArr);
              setOpenTime(open);
              setCloseTime(close);
            }
          }
        }
      })
      .catch((err) => console.error("Failed to load shop:", err));
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const formatWorkingHours = () => {
    if (selectedDays.length === 0) return "";
    const days = selectedDays.join(", ");
    return `${days} ${openTime}–${closeTime}`;
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

    const workingHoursString = formatWorkingHours();
    const formData = new FormData();
    formData.append("shop_name", form.shop_name);
    formData.append("location", form.location);
    formData.append("description", form.description);
    formData.append("phone", form.phone);
    formData.append("working_hours", workingHoursString);
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
      setSuccess("✅ Shop profile updated!");
      setEditMode(false);
      setImage(null);
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

        <label>Phone Number</label>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          disabled={!editMode}
        />

        <label>Working Days</label>
        <div className="day-checkbox-group">
          {daysOfWeek.map((day) => (
            <label key={day} className="day-checkbox">
              <input
                type="checkbox"
                value={day}
                checked={selectedDays.includes(day)}
                disabled={!editMode}
                onChange={() => toggleDay(day)}
              />
              {day.slice(0, 3)}
            </label>
          ))}
        </div>

        <label>Opening Time</label>
        <input
          type="time"
          value={openTime}
          disabled={!editMode}
          onChange={(e) => setOpenTime(e.target.value)}
        />

        <label>Closing Time</label>
        <input
          type="time"
          value={closeTime}
          disabled={!editMode}
          onChange={(e) => setCloseTime(e.target.value)}
        />

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
          <input type="file" accept="image/*" onChange={handleImage} />
        )}

        <button type="submit">
          {editMode ? "Save Changes" : "Edit Profile"}
        </button>
      </form>
    </div>
  );
};

export default ShopOwnerProfile;
