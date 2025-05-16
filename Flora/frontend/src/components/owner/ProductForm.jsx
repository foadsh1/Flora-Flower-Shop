import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "../../assets/css/product-form.css";

const ProductForm = () => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    base_price: "",
    quantity: "",
    type: "single",
  });
  const [image, setImage] = useState(null);
  const [editing, setEditing] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      setEditing(true);
      axios
        .get(`http://localhost:4000/products/${id}`, { withCredentials: true })
        .then((res) => {
          const p = res.data.product;
          setForm({
            name: p.name,
            description: p.description,
            base_price: p.base_price,
            quantity: p.quantity,
            type: p.type || "single",
          });
        })
        .catch(() => toast.error("Failed to load product"));
    }
  }, [id]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImage = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, val]) => formData.append(key, val));
    if (image) formData.append("image", image);

    try {
      if (editing) {
        await axios.patch(`http://localhost:4000/products/${id}`, formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("✅ Product updated");
      } else {
        await axios.post("http://localhost:4000/products", formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("✅ Product created");
      }
      navigate("/owner/products");
    } catch (err) {
      toast.error("Failed to save product");
    }
  };

  return (
    <div className="products-form-container">
      <form
        className="product-form"
        onSubmit={handleSubmit}
        encType="multipart/form-data"
      >
        <h3>{editing ? "Edit Product" : "Add New Product"}</h3>
        <select name="type" value={form.type} onChange={handleChange} required>
          <option value="single">🌸 Single Flower</option>
          <option value="bouquet">💐 Pre-made Bouquet</option>
        </select>
        <input
          type="text"
          name="name"
          placeholder="Product Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
        ></textarea>
        <input
          type="number"
          name="base_price"
          placeholder="Base Price"
          value={form.base_price}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="quantity"
          placeholder="Quantity"
          value={form.quantity}
          onChange={handleChange}
          required
        />
        <input type="file" accept="image/*" onChange={handleImage} />
        <button type="submit">
          {editing ? "Update Product" : "Add Product"}
        </button>
        <button
          type="button"
          className="cancel-btn"
          onClick={() => navigate("/owner/products")}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default ProductForm;
