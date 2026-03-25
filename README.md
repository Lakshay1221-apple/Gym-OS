# 🏋️ Gym-OS — Backend System

A **production-grade backend system** for gym management, built with a focus on **scalability, reliability, and clean architecture**.

---

## 🚀 Current Status

✅ **Phase 7 Completed — Backend Stabilization & Testing Gate PASSED**
🚧 Moving to **Phase 8 — Feature Integration**

---

## 🧠 What This Project Is

Gym-OS is a backend system designed to handle:

* User authentication & role-based access
* Membership management
* Gym check-ins & attendance tracking
* Workout tracking
* Booking systems (classes/sessions)
* Background job processing
* Rate limiting & abuse protection

---

## 🏗️ Tech Stack

* **Node.js**
* **Express (v5)**
* **MongoDB + Mongoose**
* **Zod (Validation)**
* **JWT Authentication**
* **Jest + Supertest (Testing)**
* **Winston + Morgan (Logging)**
* **Autocannon (Load Testing)**

---

## 🔐 Core Features

### Authentication & Authorization

* JWT-based authentication
* Role-based access control (Admin / Trainer / User)
* Secure route protection

### Database & Transactions

* Mongoose transactions for atomic operations
* Data consistency and rollback support
* Unique constraints to prevent duplication

### API Design

* Consistent response format:

```json
{ "success": true, "data": {}, "message": "" }
```

* Proper HTTP status codes
* Structured error handling

### Background Jobs

* Membership expiration handling
* Attendance cleanup
* Idempotent job execution

### Security & Protection

* Rate limiting (anti-spam / brute force)
* Input validation using Zod
* Secure middleware architecture

---

## 🧪 Testing & Stability (Phase 7)

### ✅ Integration Testing

* 66+ end-to-end test cases
* Full flow coverage:

  * Register → Login → Membership → Check-in → Workout

### ✅ Critical Bugs Fixed

* Removed deprecated `xss-clean` (Express 5 crash issue)
* Fixed incorrect HTTP 200 responses on failures
* Resolved middleware scope issues

### ✅ Database Reliability

* Verified transaction rollback
* Ensured atomic multi-document operations

### ✅ Load Testing

* 150 concurrent users tested
* Stable performance under load
* No crashes or event-loop blocking

### ✅ Rate Limiting

* Auth endpoints protected (5 req/min)
* Abuse prevention validated

---

## 📊 System Metrics

* **0 System Crashes**
* **100% Test Pass Rate (66/66)**
* **Consistent API Contract**
* **No Data Inconsistencies**
* **Stable Under Load**

---

## 📁 Project Structure (Simplified)

```
src/
 ├── controllers/
 ├── routes/
 ├── middleware/
 ├── models/
 ├── jobs/
 ├── utils/
tests/
 ├── auth.test.js
 ├── ...
```

---

## ⚙️ Getting Started

### 1. Clone Repo

```bash
git clone https://github.com/Lakshay1221-apple/Gym-OS.git
cd Gym-OS
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start MongoDB

```bash
mongod --dbpath ~/mongodb-data
```

### 4. Run Server

```bash
npm start
```

### 5. Run Tests

```bash
npm test
```

---

## 🔄 Development Philosophy

> “If the system cannot survive failure, it is not ready to grow.”

This project focuses on:

* Stability before scaling
* Testing before feature expansion
* Clean architecture over quick hacks

---

## 🚧 Next Phase (Phase 8)

Planned feature expansion:

* Trainer management system
* Advanced workout analytics
* Booking & scheduling enhancements
* Real-time gym insights

---

## 👨‍💻 Author

**Lakshay Raj**

---

## ⭐ Key Highlight

This project is not just built — it is **engineered, tested, and stabilized** before scaling.

---
