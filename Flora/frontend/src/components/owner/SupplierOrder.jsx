import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../assets/css/supplier.css";
import { toast } from "react-toastify";

const SupplierOrder = () => {
  const [flowers, setFlowers] = useState([]);

  useEffect(() => {
    fetchFlowers();
  }, []);

  const fetchFlowers = () => {
    axios
      .get("http://localhost:5000/products/mine", { withCredentials: true })
      .then((res) => {
        const flowersWithRestock = res.data.products.map((f) => ({
          ...f,
          restockQuantity: 0,
        }));
        setFlowers(flowersWithRestock);
      })
      .catch((err) => {
        console.error("Failed to load flowers", err);
        toast.error("Failed to fetch flowers.");
      });
  };

  const handleQuantityChange = (index, value) => {
    const updated = [...flowers];
    updated[index].restockQuantity = Math.max(0, parseInt(value) || 0);
    setFlowers(updated);
  };

  const handlePlaceOrder = () => {
    const selectedItems = flowers.filter((f) => f.restockQuantity > 0);

    if (selectedItems.length === 0) {
      toast.warning("Please select at least one item to restock.");
      return;
    }

    axios
      .post(
        "http://localhost:5000/supplier/order",
        { items: selectedItems },
        { withCredentials: true }
      )
      .then(() => {
        toast.success("Supplier order placed!");
        fetchFlowers(); // refresh with updated quantities
      })
      .catch((err) => {
        console.error("Order error", err);
        toast.error("Failed to place order.");
      });
  };

  return (
    <div className="supplier-container">
      <h2>Order Flowers from Supplier</h2>
      {flowers.length === 0 ? (
        <p>No flowers available for restocking.</p>
      ) : (
        <table className="supplier-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Current Qty</th>
              <th>Restock Amount</th>
            </tr>
          </thead>
          <tbody>
            {flowers.map((flower, idx) => (
              <tr key={flower.product_id}>
                <td>
                  {flower.image && (
                    <img
                      src={`http://localhost:5000/uploads/${flower.image}`}
                      alt={flower.name}
                      className="flower-thumb"
                    />
                  )}
                </td>
                <td>{flower.name}</td>
                <td>{flower.quantity}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    value={flower.restockQuantity}
                    onChange={(e) => handleQuantityChange(idx, e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button className="place-order-btn" onClick={handlePlaceOrder}>
        Place Supplier Order
      </button>
    </div>
  );
};

export default SupplierOrder;
