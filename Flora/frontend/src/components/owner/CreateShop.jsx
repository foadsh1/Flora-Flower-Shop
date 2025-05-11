import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import "../../assets/css/shop.css";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const CreateShop = () => {
  const [form, setForm] = useState({
    shop_name: "",
    location: "",
    description: "",
    phone: "",
    working_hours: "", // final string (e.g. "Sun–Thu 09:00–18:00")
  });
  const [image, setImage] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("18:00");

  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const workingHoursString = formatWorkingHours();
    const formData = new FormData();

    Object.entries({ ...form, working_hours: workingHoursString }).forEach(([key, value]) =>
      formData.append(key, value)
    );

    if (image) formData.append("shop_image", image);

    try {
      await axios.post("http://localhost:5000/shop/create", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

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

        <label>Phone Number</label>
        <input
          name="phone"
          type="tel"
          placeholder="e.g. 052-1234567"
          required
          onChange={handleChange}
        />

        <label>Working Days</label>
        <div className="day-checkbox-group">
          {daysOfWeek.map((day) => (
            <label key={day} className="day-checkbox">
              <input
                type="checkbox"
                value={day}
                checked={selectedDays.includes(day)}
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
          onChange={(e) => setOpenTime(e.target.value)}
        />

        <label>Closing Time</label>
        <input
          type="time"
          value={closeTime}
          onChange={(e) => setCloseTime(e.target.value)}
        />

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
