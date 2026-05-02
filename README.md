# ☕ CafeSite – Full Stack Web Application

## 👥 Team Members & Roles

| Name              | Role                              |
|-------------------|-----------------------------------|
| Redha Alturaik    | Authentication & Database Design  |
| Ali Al Ramadan    | Menu Management                   |
| Hussain Albaqqal  | Cafe Setup & Branding             |
| Hassan Alsayoud   | Public Website & Admin Panel      |

---

## 📌 Project Overview

CafeSite is a SaaS platform that allows cafe owners to create and manage their own professional cafe websites without requiring technical knowledge.

This project is a **full-stack application** using:

- Frontend: React + TypeScript
- Backend: Node.js + Express.js
- Database: MongoDB Atlas with Mongoose

Users can:
- Register and log in as client, cafe owner, or admin
- Create and manage cafe profiles
- Add menu categories and items
- Hide or show menu categories/items from clients
- Browse public cafe menus
- Place demo orders as clients
- Manage incoming orders as cafe owners
- Approve or decline cafes as admins

---

## 🛠️ Technologies Used

### Frontend
- React (Vite)
- TypeScript
- React Router DOM
- CSS

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- bcryptjs
- CORS

---

## 🏗️ Project Structure

```bash
backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js

frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── types/
│   └── vite.config.ts
```

---

## 🚀 Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd Coffee-web
```

### 2️⃣ Install root dependencies

```bash
npm install
```

---

## 🔧 Backend Setup

```bash
cd backend
npm install
npm start
```

Backend runs on:
```text
http://localhost:5000
```

Health check:
```text
GET http://localhost:5000/api/health
```

---

## 🌐 Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:
```text
http://localhost:5173
```

Root convenience scripts:

```bash
npm start
npm run dev
npm run build
```

---

## 🔑 Environment Variables

### backend/.env

```env
PORT=5000
MONGO_URI=mongodb+srv://<db_user>:<db_password>@<cluster>/<database>?retryWrites=true&w=majority&appName=<app_name>
JWT_SECRET=replace_with_a_secure_secret
CLIENT_URL=http://localhost:5173
ADMIN_FULL_NAME=CafeSite Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@12345
```

### frontend/.env

```env
VITE_API_URL=http://localhost:5000
```

⚠️ Important:
- `.env` files are ignored by Git and must not be pushed.
- `node_modules/` and build output are ignored and should be regenerated locally.
- Use a rotated MongoDB password if a password was ever shared in screenshots or chat.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` are optional, but recommended for a fresh database so graders can log in to `/admin`.

### Admin Account for Grading

The public register page creates `client` and `owner` accounts only. To create or refresh an admin account for a fresh MongoDB database, add `ADMIN_EMAIL` and `ADMIN_PASSWORD` to `backend/.env`, then start the backend:

```bash
cd backend
npm start
```

After startup, log in with that admin email/password and open:

```text
http://localhost:5173/admin
```

Do not commit the real admin password. Keep it only in `backend/.env` or deployment environment variables.

---

## 🔗 API Endpoints

### Authentication

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register a user |
| POST | `/api/auth/login` | Public | Log in and receive JWT |
| GET | `/api/auth/me` | Authenticated | Get current user |
| PUT | `/api/auth/me` | Authenticated | Update current user profile |

### Cafes

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/cafes` | Owner | Create cafe |
| GET | `/api/cafes/my` | Owner | Get owner cafe |
| PUT | `/api/cafes/my` | Owner | Update owner cafe |
| GET | `/api/cafes/public` | Public | Get active approved cafes |
| GET | `/api/cafes` | Admin | Get all cafes |
| PUT | `/api/cafes/:id/status` | Admin | Approve, decline, or set pending |

### Menu

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/menu` | Owner | Get owner menu |
| POST | `/api/menu` | Owner | Save owner menu categories/items |

### Orders

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/orders` | Client | Place a demo order |
| GET | `/api/orders/my` | Client | Get client orders |
| GET | `/api/orders/owner` | Owner | Get orders for owner cafe |
| PUT | `/api/orders/:id/status` | Owner | Update order status |

---

## 🧪 Example API Requests

### Register

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "fullName": "Client User",
  "email": "client@example.com",
  "password": "Password@123",
  "role": "client"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "owner@example.com",
  "password": "Password@123"
}
```

Example response:

```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "fullName": "Owner User",
    "email": "owner@example.com",
    "role": "owner"
  }
}
```

### Update Cafe Profile

```http
PUT /api/cafes/my
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "name": "Brew & Bean",
  "description": "A cozy cafe serving fresh coffee.",
  "ownerName": "Owner User",
  "contactEmail": "owner@example.com",
  "phone": "+966 555 123 456",
  "address": "KFUPM Mall",
  "city": "Dhahran",
  "state": "Eastern Province",
  "zipCode": "31261",
  "socialLinks": {
    "instagram": "@brewandbean",
    "x": "",
    "tiktok": "",
    "snapchat": "",
    "website": ""
  },
  "hours": {
    "open": "08:00",
    "close": "18:00"
  }
}
```

Validation notes:
- Cafe name is required.
- Phone number is required.
- Full location is required so customers can see it in the menu contact section.
- Social media accounts are optional and only show to clients when provided.

### Save Menu

```http
POST /api/menu
Authorization: Bearer <token>
Content-Type: application/json
```

```json
[
  {
    "name": "Coffee",
    "visible": true,
    "items": [
      {
        "name": "Latte",
        "price": "18.00",
        "visible": true
      },
      {
        "name": "Espresso",
        "price": "10.00",
        "visible": false
      }
    ]
  }
]
```

Hidden categories/items stay manageable by owners but are not shown to clients.

### Place Order

```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "cafeId": "cafe_id",
  "cafeName": "Brew & Bean",
  "paymentMethod": "Demo payment",
  "clientAddress": {
    "fullName": "Client User",
    "phone": "+966 555 987 654",
    "line1": "Building 1, Room 100",
    "city": "Dhahran",
    "region": "Eastern Province",
    "postalCode": "31261"
  },
  "items": [
    {
      "itemId": "latte-id",
      "name": "Latte",
      "price": 18,
      "quantity": 2
    }
  ]
}
```

Example response:

```json
{
  "_id": "order_id",
  "orderNumber": "ORD-20260502-ABC123",
  "status": "Placed",
  "total": 36,
  "paymentMethod": "Demo payment"
}
```

---

## ✅ Features Implemented

- JWT authentication and protected role-based routes
- Optional admin account bootstrap from backend environment variables
- Owner cafe creation and profile management
- Required phone and full cafe location validation
- Optional social media links
- Menu category/item management with hide/show visibility
- Public cafe browsing and customer menu visualization
- Demo checkout with card format validation
- Client saved cards stored locally for demo flow
- Client orders and owner order management
- Order status updates: Placed, On the way, Delivered, Cancelled
- Admin cafe approval and decline comments
- Light/dark theme preference remembered in browser
- QR section for sharing public cafe menu links
- MongoDB schemas for users, cafes, menu sections, menu items, and orders
- Error handling with JSON responses and HTTP status codes

---

## 🧪 Verification Commands

```bash
cd frontend
npm run build
npm run lint
```

```bash
cd ..
node --check backend/server.js
node --check backend/controllers/cafeController.js
node --check backend/controllers/orderController.js
node --check backend/controllers/menuController.js
```

---

## ⚙️ Deployment Notes

- Deploy the backend with `MONGO_URI`, `JWT_SECRET`, `PORT`, and `CLIENT_URL`.
- Deploy the frontend with `VITE_API_URL` pointing to the deployed backend URL.
- The current payment flow is demo-only and does not process real payments.
- For production, replace local demo card storage with a secure payment provider.

---

## ⚠️ Known Issues / Future Improvements

- Payment is demo-only.
- Logo upload is stored as local/base64 profile data, not a cloud file upload service.
- More analytics and notification features can be added later.

---

© 2026 CafeSite Team
