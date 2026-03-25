# GymOS Backend 🚀

## Overview

GymOS Backend is a **RESTful API service** built using **Node.js, Express, and MongoDB**.
It powers a complete gym management and fitness tracking system, including:

* User authentication
* Membership management
* Attendance tracking
* Workout logging
* Biometric tracking

This project follows a **modular and scalable architecture**, making it suitable for real-world applications.

---

## Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** MongoDB (Mongoose)
* **Authentication:** JWT (JSON Web Tokens)
* **Security:** bcrypt (password hashing)
* **File Uploads:** Multer (for images)
* **Environment Management:** dotenv

---

## Project Structure

```
gymos-backend
│
├── src
│   ├── config          # Database & environment configs
│   ├── controllers     # Route handlers (business entry points)
│   ├── middleware      # Auth, roles, uploads
│   ├── models          # Mongoose schemas
│   ├── routes          # API routes
│   ├── services        # Business logic
│   ├── utils           # Helper functions
│   └── uploads         # File storage
│
├── .env
├── package.json
└── server.js
```

---

## Features (MVP)

### 🔐 Authentication

* User registration
* User login (JWT-based)
* Protected routes
* Role-based access (Admin / Trainer / Member)

---

### 🧑 Users

* Profile management
* User roles & permissions

---

### 💳 Membership Management

* View membership plans
* Purchase memberships
* Prevent overlapping memberships
* Freeze membership

---

### 🏋️ Workout Tracking

* Start workout session
* Add sets (reps, weight, RPE)
* Finish workout
* Track workout history

---

### 📊 Biometric Tracking

* Log body weight
* Body fat & muscle mass
* Body measurements
* View progress history

---

### 📍 Attendance System

* Check-in / Check-out
* Prevent duplicate check-ins
* Attendance history tracking

---

## API Endpoints

### Auth

```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/profile
POST /api/auth/logout
```

---

### Membership

```
GET  /api/membership/plans
POST /api/membership/purchase
GET  /api/membership/status
POST /api/membership/freeze
```

---

### Attendance

```
POST /api/attendance/checkin
POST /api/attendance/checkout
GET  /api/attendance/history
```

---

### Workout

```
POST /api/workout/start
POST /api/workout/add-set
POST /api/workout/finish
GET  /api/workout/history
```

---

### Biometrics

```
POST /api/biometrics/log
GET  /api/biometrics/history
```

---

## Getting Started

### 1. Clone the Repository

```
git clone https://github.com/your-username/gymos-backend.git
cd gymos-backend
```

---

### 2. Install Dependencies

```
npm install
```

---

### 3. Setup Environment Variables

Create a `.env` file in root:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/gymos
JWT_SECRET=your_secret_key
```

---

### 4. Start MongoDB

Make sure MongoDB is running locally:

```
mongosh
```

---

### 5. Run the Server

```
npm run dev
```

Server will start at:

```
http://localhost:5000
```

---

## Development Workflow

1. Start MongoDB
2. Run backend server
3. Test APIs using Postman / Thunder Client
4. Verify data using MongoDB Compass

---

## Future Improvements

* File upload system (profile & progress photos)
* AI-based workout recommendations
* Nutrition tracking system
* Notification engine
* Swagger API documentation
* Cloud deployment (AWS / Render)

---

## Author

**Lakshay Raj**

---

## License

This project is for educational and development purposes.
