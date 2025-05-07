import jsPDF from "jspdf";
import logo from "../assets/images/logo.png";
import axios from "axios";

/**
 * Generate a professional PDF receipt for Flora Flower Shops
 * @param {Object} data - Order details
 * @param {string} role - "client" or "shopowner"
 */
export const generateReceiptPDF = async (data, role = "client") => {
  let taxPercent = 17;

  // Fetch tax percent from backend
  try {
    const res = await axios.get("http://localhost:5000/admin/tax", {
      withCredentials: true,
    });
    taxPercent = parseFloat(res.data.tax) || 17;
  } catch (err) {
    console.warn("⚠️ Failed to fetch tax from DB, using default 17%");
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  let y = margin;

  const img = new Image();
  img.src = logo;

  img.onload = () => {
    doc.addImage(img, "PNG", 500, 10, 70, 50);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor("#c2185b");
    doc.text("Flora Flower Shops", margin, y);

    y += 20;
    doc.setFontSize(11);
    doc.setTextColor("#444");
    doc.setFont("helvetica", "normal");
    doc.text("www.floraflowers.com", margin, y);
    doc.text(
      "Email: contact@flora.com | Phone: +972-3-1234567",
      margin,
      y + 15
    );

    y += 50;
    doc.setFontSize(18);
    doc.setTextColor("#000");
    doc.text("Receipt", margin, y);

    y += 30;
    doc.setFontSize(12);
    doc.setTextColor("#333");
    doc.text(`Order ID: ${data.order_id}`, margin, y);
    doc.text(
      `Date: ${new Date(data.order_date).toLocaleDateString()}`,
      margin + 250,
      y
    );
    y += 20;
    doc.text(`Status: ${data.status}`, margin, y);

    // 🧮 Tax + Price Info
    y += 20;
    let subtotal = parseFloat(data.total_price) || 0;
    let taxAmount = subtotal * (taxPercent / 100);
    let totalWithTax = subtotal + taxAmount;

    if (data.coupon_code) {
      const originalTotal = subtotal / (1 - data.discount_applied / 100);
      taxAmount = originalTotal * (taxPercent / 100);
      totalWithTax = originalTotal + taxAmount;

      doc.text(`Original Price: $${originalTotal.toFixed(2)}`, margin, y);
      y += 20;
      doc.text(`Coupon Code: ${data.coupon_code}`, margin, y);
      doc.text(`Discount: ${data.discount_applied}%`, margin + 250, y);
      y += 20;
      doc.text(`Subtotal After Discount: $${subtotal.toFixed(2)}`, margin, y);
    } else {
      doc.text(`Subtotal: $${subtotal.toFixed(2)}`, margin, y);
    }

    y += 20;
    doc.text(`Tax (${taxPercent}%): $${taxAmount.toFixed(2)}`, margin, y);
    doc.text(`Total (incl. tax): $${totalWithTax.toFixed(2)}`, margin + 250, y);

    // Client / Shop Info
    y += 30;
    doc.setFontSize(13);
    doc.setTextColor("#c2185b");
    doc.text(role === "client" ? "Shop Info" : "Client Info", margin, y);

    y += 18;
    doc.setFontSize(11);
    doc.setTextColor("#000");
    if (role === "client") {
      doc.text(`Name: ${data.shop_name}`, margin, y);
      doc.text("Location: Based in Israel", margin, y + 15);
    } else {
      doc.text(`Name: ${data.client_name}`, margin, y);
      doc.text("Location: Provided by client", margin, y + 15);
    }

    // Products Table
    y += 40;
    doc.setFillColor("#f8bbd0");
    doc.rect(margin, y, 500, 24, "F");
    doc.setTextColor("#000");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Item", margin + 10, y + 16);
    doc.text("Qty", margin + 300, y + 16);
    doc.text("Price", margin + 400, y + 16);

    y += 34;
    doc.setFont("helvetica", "normal");
    data.items.forEach((item) => {
      doc.text(item.name, margin + 10, y);
      doc.text(`${item.quantity}`, margin + 300, y);
      doc.text(`$${item.price}`, margin + 400, y);
      y += 22;
    });

    if (data.review) {
      y += 30;
      doc.setFontSize(13);
      doc.setTextColor("#c2185b");
      doc.text("Client Review", margin, y);
      y += 18;
      doc.setFontSize(11);
      doc.setTextColor("#000");
      doc.text(`Rating:  ${data.review.rating}`, margin, y);
      y += 16;
      doc.text(`"${data.review.comment}"`, margin, y);
    }

    y = 770;
    doc.setFontSize(10);
    doc.setTextColor("#999");
    doc.text("Thank you for choosing Flora!", margin, y);
    doc.text(
      "This is an automatically generated receipt. No signature required.",
      margin,
      y + 12
    );

    doc.save(`Flora_Order_${data.order_id}_Receipt.pdf`);
  };
};
