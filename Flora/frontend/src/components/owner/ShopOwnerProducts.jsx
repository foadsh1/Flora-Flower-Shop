// src/components/owner/ShopOwnerProducts.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../assets/css/products.css";

const ShopOwnerProducts = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    base_price: "",
    quantity: "",
  });
  const [image, setImage] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    axios
      .get("http://localhost:5000/products/mine", { withCredentials: true })
      .then((res) => setProducts(res.data.products))
      .catch((err) => console.error("Failed to load products", err));
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImage = (e) => {
    setImage(e.target.files[0]);
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      base_price: "",
      quantity: "",
    });
    setImage(null);
    setEditingProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    if (image) formData.append("image", image);

    try {
      if (editingProduct) {
        await axios.patch(
          `http://localhost:5000/products/${editingProduct.product_id}`,
          formData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        setMessage("Product updated successfully.");
      } else {
        await axios.post("http://localhost:5000/products", formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
        setMessage("Product added successfully.");
      }

      fetchProducts();
      resetForm();
    } catch (err) {
      console.error("Submit failed:", err);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      base_price: product.base_price,
      quantity: product.quantity,
    });
    setImage(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this flower?")) return;
    try {
      await axios.delete(`http://localhost:5000/products/${id}`, {
        withCredentials: true,
      });
      setMessage("Product deleted successfully.");
      fetchProducts();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="products-container">
      <h2>Manage My Flowers</h2>

      {message && <div className="success">{message}</div>}

      <form
        className="product-form"
        onSubmit={handleSubmit}
        encType="multipart/form-data"
      >
        <h3>{editingProduct ? "Edit Flower" : "Add New Flower"}</h3>

        <input
          type="text"
          name="name"
          placeholder="Flower Name"
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
          placeholder="Base Price (before tax)"
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
          {editingProduct ? "Update Flower" : "Add Flower"}
        </button>

        {editingProduct && (
          <button type="button" className="cancel-btn" onClick={resetForm}>
            Cancel Edit
          </button>
        )}
      </form>

      <div className="products-grid">
        {products.length === 0 ? (
          <p>No flowers added yet.</p>
        ) : (
          products.map((product) => (
            <div key={product.product_id} className="product-card">
              {product.image && (
                <div className="image-container">
                  <img
                    src={`http://localhost:5000/uploads/${product.image}`}
                    alt={product.name}
                    className="product-image"
                  />
                </div>
              )}
              <h4>{product.name}</h4>
              <p>{product.description}</p>
              <p>
                <strong>Base Price:</strong> ${product.base_price}
              </p>
              <p>
                <strong>Final Price After Tax:</strong> ${product.price}
              </p>
              <p>
                <strong>Quantity:</strong> {product.quantity}
              </p>
              <div className="card-buttons">
                <button onClick={() => handleEdit(product)}>Edit</button>
                <button onClick={() => handleDelete(product.product_id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ShopOwnerProducts;
