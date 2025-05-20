const { jsPDF } = require("jspdf");
const fs = require("fs");
const path = require("path");
const generateReceiptPDF = async (
  data,
  role = "client",
  docInstance = null
) => {
  const doc = docInstance || new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  let y = margin;

  const taxPercent = parseFloat(data.tax_percent || 0) || 17;
  const discount = parseFloat(data.discount_applied || 0);
  const total = parseFloat(data.total_price || 0);
  const originalPrice = discount > 0 ? total / (1 - discount / 100) : total;
  const taxIncluded = total * (taxPercent / (100 + taxPercent));
  // ✅ Embed logo from Base64
  const logoPath = path.join(
    __dirname,
    "../../frontend/src/assets/images/logo.png"
  );
  if (fs.existsSync(logoPath)) {
    const logoBase64 = fs.readFileSync(logoPath, { encoding: "base64" });
    doc.addImage(logoBase64, "PNG", 500, 10, 70, 50);
  }

  // 🌸 Header (logo removed for backend compatibility)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor("#c2185b");
  doc.text("Flora Flower Shops", margin, y);

  y += 20;
  doc.setFontSize(11);
  doc.setTextColor("#444");
  doc.setFont("helvetica", "normal");
  doc.text("www.floraflowers.com", margin, y);
  doc.text("Email: contact@flora.com | Phone: +972-3-1234567", margin, y + 15);

  y += 50;
  doc.setFontSize(18);
  doc.setTextColor("#000");
  doc.text("Receipt", margin, y);

  // 🌼 Order Info
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

  // 🚚 Delivery or 🏪 Pickup Info
  y += 30;
  doc.setFontSize(13);
  doc.setTextColor("#c2185b");
  doc.text("Delivery Method", margin, y);
  y += 18;
  doc.setFontSize(11);
  doc.setTextColor("#000");

  if (data.method === "delivery" && data.address) {
    doc.text(`Method: Delivery`, margin, y);
    y += 16;
    doc.text(`Street: ${data.address.street}`, margin, y);
    y += 16;
    doc.text(`City: ${data.address.city}`, margin, y);
    y += 16;
    doc.text(`Apt: ${data.address.apt}`, margin, y);
    y += 16;
    doc.text(`Phone: ${data.address.phone}`, margin, y);
    y += 16;
    doc.text(
      `Delivery Date: ${new Date(data.delivery_date).toLocaleDateString()}`,
      margin,
      y
    );
    y += 16;
    doc.text(`Time: ${data.delivery_time}`, margin, y);
  } else {
    doc.text(`Method: Pickup`, margin, y);
    y += 16;
    if (data.delivery_date) {
      doc.text(
        `Pickup Date: ${new Date(data.delivery_date).toLocaleDateString()}`,
        margin,
        y
      );
      y += 16;
    }
    if (data.delivery_time) {
      doc.text(`Pickup Time: ${data.delivery_time}`, margin, y);
      y += 16;
    }
  }

  // 🎟 Coupon / Discount Summary
  if (data.coupon_code && discount > 0) {
    y += 30;
    doc.setFontSize(13);
    doc.setTextColor("#c2185b");
    doc.text("Discount Summary", margin, y);

    y += 18;
    doc.setFontSize(11);
    doc.setTextColor("#000");
    doc.text(`Coupon Used: ${data.coupon_code}`, margin, y);
    doc.text(`Discount Applied: ${discount}%`, margin + 250, y);
    y += 18;
    doc.text(`Original Price: $${originalPrice.toFixed(2)}`, margin, y);
  }

  // 💰 Price Summary
  y += 30;
  doc.setFontSize(13);
  doc.setTextColor("#c2185b");
  doc.text("Total Summary", margin, y);

  y += 18;
  doc.setFontSize(11);
  doc.setTextColor("#000");
  doc.text(`Total Paid (incl. tax): $${total.toFixed(2)}`, margin, y);
  doc.text(
    `Tax Included (${taxPercent}%): $${taxIncluded.toFixed(2)}`,
    margin + 250,
    y
  );

  // 🧑‍💼 Client or Shop Info
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

  // 📦 Products Table Header
  y += 40;
  doc.setFillColor("#f8bbd0");
  doc.rect(margin, y, 500, 24, "F");
  doc.setTextColor("#000");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Item", margin + 10, y + 16);
  doc.text("Qty", margin + 300, y + 16);
  doc.text("Price", margin + 400, y + 16);

  // 📦 Products Loop
  y += 34;
  doc.setFont("helvetica", "normal");
  data.items.forEach((item) => {
    doc.text(item.name, margin + 10, y);
    doc.text(`${item.quantity}`, margin + 300, y);
    doc.text(`$${item.price}`, margin + 400, y);
    y += 22;
  });

  // ✍️ Review Section
  if (data.review) {
    y += 30;
    doc.setFontSize(13);
    doc.setTextColor("#c2185b");
    doc.text("Client Review", margin, y);
    y += 18;
    doc.setFontSize(11);
    doc.setTextColor("#000");
    doc.text(`Rating: ${data.review.rating}`, margin, y);
    y += 16;
    doc.text(`"${data.review.comment}"`, margin, y);
  }

  // 🧾 Footer
  y = 770;
  doc.setFontSize(10);
  doc.setTextColor("#999");
  doc.text("Thank you for choosing Flora!", margin, y);
  doc.text(
    "This is an automatically generated receipt. No signature required.",
    margin,
    y + 12
  );

  return doc;
};

module.exports = { generateReceiptPDF };
