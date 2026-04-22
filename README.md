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

This project is now a **full-stack application** using:

- Frontend: React + TypeScript
- Backend: Node.js + Express
- Database: MongoDB

Users can:
- Register and log in
- Create and manage their cafe
- Add menu categories and items
- View public cafe pages
- Admin can manage cafes

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
- MongoDB (Atlas)
- Mongoose
- JWT Authentication

---

## 🏗️ Project Structure

```bash
backend/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── .env

frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── pages/
│   │   ├── components/
│   │   └── types/
│   ├── .env
│   └── vite.config.ts
```

---

## 🚀 Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd Coffee-web
```

---

## 🔧 Backend Setup

```bash
cd backend
npm install
npm start
```

Backend runs on:
```
http://localhost:5000
```

---

## 🌐 Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:
```
http://localhost:5173
```

---

## 🔑 Environment Variables

### backend/.env

```env
PORT=5000
MONGO_URI=the_mongodb_connection_string
JWT_SECRET=the_secret_key
CLIENT_URL=http://localhost:5173
```

### frontend/.env

```env
VITE_API_URL=http://localhost:5000
```

---

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/me`

### Cafe
- `POST /api/cafes`
- `GET /api/cafes/my`
- `PUT /api/cafes/my`
- `GET /api/cafes/public`
- `GET /api/cafes` *(admin)*
- `PUT /api/cafes/:id/status` *(admin)*

### Menu
- `GET /api/menu`
- `POST /api/menu`

---

## 🧪 Example Request (Menu Save)

```json
[
  {
    "name": "Coffee",
    "items": [
      { "name": "Latte", "price": "18.00" },
      { "name": "Espresso", "price": "10.00" }
    ]
  }
]
```

---

## ✅ Features Implemented

- User authentication (JWT)
- Cafe profile management
- Menu management (CRUD)
- Public cafe viewing
- Admin panel
- MongoDB integration
- Input validation (frontend + backend)
- Error handling

---

## ⚙️ Deployment Notes

- Frontend uses:
```
VITE_API_URL
```

- Backend uses:
```
CLIENT_URL
MONGO_URI
JWT_SECRET
```

---

## ⚠️ Known Issues / Future Improvements

- No image upload (URL only)
- Admin features can be expanded

---


© 2026 CafeSite Team
