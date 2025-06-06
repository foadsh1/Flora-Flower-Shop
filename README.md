
# 🌸 Flora Flower Shop

**Flora** is a full-stack flower shop platform that connects clients with local shop owners. It supports customized bouquet creation, online ordering, PayPal payments, and full shop/flower management via a clean, modern UI.

## 🚀 Live Preview

> Coming Soon — Deployed on Render or Vercel

## 🛠️ Tech Stack

| Frontend        | Backend             | Database   | Other                    |
|-----------------|---------------------|------------|--------------------------|
| React.js        | Node.js + Express   | MySQL      | PayPal API, React DnD    |
| React Router    | RESTful API         |            | Toastify, Multer         |

## 🔑 Features

### 🌼 For Clients:
- ✅ Signup / Login (session-based)
- ✅ Browse shops by name or rating
- ✅ View shop details and flower list
- ✅ Add flowers to cart and place order via **PayPal**
- ✅ Track orders and write reviews
- ✅ Customize your own bouquet (drag & drop)

### 🛍️ For Shop Owners:
- ✅ Register a shop with image + location
- ✅ Add/edit/remove flowers
- ✅ View all incoming orders
- ✅ Update order status
- ✅ See client feedback & ratings

### 🛡️ For Admin:
- ✅ View and manage all users
- ✅ Change user status (active/unactive)
- ✅ Prevent unactive users from logging in

## 🎨 UI Highlights

- 🌷 Clean floral theme (`#fff5f8`, `#c2185b`, soft shadows)
- 📱 Fully responsive for mobile & desktop
- 💬 Toast notifications for all actions
- 🧩 Drag & drop bouquet creator using `react-dnd`
- 🧾 Sliding order detail panel for modern UX

## 💳 PayPal Integration

- 🔐 Secure checkout via `@paypal/react-paypal-js`
- 💰 Order total passed directly to PayPal
- ✅ On success, order is saved in DB and stock is updated

## 🖼️ Customize Bouquet

- Drag flowers & wrappers into a live preview area
- Remove or reposition flowers easily
- Wrapper stays behind flowers with z-index
- Save functionality can be added for future!

## 📂 Folder Structure

```
Flora/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── assets/
│   │   ├── routes.js
│   │   └── App.jsx
│   └── public/
├── backend/
│   ├── routes/
│   ├── models/
│   └── server.js
```

## 🧪 Testing (Manual)

- Add to cart → PayPal payment → Inventory updates
- Review appears after order
- Admin disables account → Login blocked

## 🔧 Setup Instructions

```bash
# Frontend
cd frontend
npm install
npm start

# Backend
cd backend
npm install
node server.js
```

- Create `.env` with DB + PayPal test client ID
- MySQL schema included in `/backend/models/db.sql`

## 🤝 Contributors

- ✨ Designed & built by [You]
- 💡 Styled with love and 💐

## 📜 License

This project is licensed under MIT – feel free to fork and grow your garden! 🌿
