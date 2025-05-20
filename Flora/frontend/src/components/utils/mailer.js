// utils/mailer.js
const nodemailer = require("nodemailer");
require("dotenv").config(); // Load variables from .env

// ✅ Create reusable transporter using Gmail + App Password
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,       // Your Gmail address
    pass: process.env.EMAIL_PASS,  // Your 16-character Google App Password
  },
});

/**
 * Send a receipt email with attached PDF
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {Buffer} options.attachmentBuffer - PDF buffer to attach
 * @param {string} options.filename - PDF file name
 */
const sendReceiptEmail = async ({ to, subject, html, attachmentBuffer, filename }) => {
  const mailOptions = {
    from: `"Flora Flower Shops" <${process.env.EMAIL}>`,
    to,
    subject,
    html,
    attachments: [
      {
        filename,
        content: attachmentBuffer,
        contentType: "application/pdf",
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ Email failed:", err);
    throw err;
  }
};

module.exports = { sendReceiptEmail };