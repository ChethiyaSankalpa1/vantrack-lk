# VanTrack LK – Smart School Transportation Mobile Application

A modern, production-grade mobile transportation platform designed for Sri Lankan school van and bus services. Built with Flutter, Node.js, Express.js, and MongoDB Atlas.

---

## 🚌 Features & Roles

### 1. Parent / Guardian Portal
- Real-time GPS school van tracking with live ETA and stop timeline.
- Student boarding and drop-off alerts.
- Digital monthly fee invoicing and payment history.
- Emergency driver and vehicle contact information.

### 2. Driver Control Center
- Morning and afternoon route management.
- Live GPS sharing during active trips.
- QR code attendance verification.
- Delay, traffic, and vehicle breakdown incident reporting.

### 3. Driver Assistant Portal
- Student passenger manifest inspection.
- Fast QR code student boarding and drop-off scanning.
- Attendance exception reporting.

---

## 🛠️ Architecture & Tech Stack

- **Mobile Application**: Flutter 3.47+ & Dart 3.13+
- **Backend REST API**: Node.js v20+ & Express.js
- **Database**: MongoDB Atlas / Mongoose ORM
- **Authentication**: JWT & bcrypt password hashing with Sri Lankan phone validation
- **State Management**: Provider
- **Networking**: Dio with bearer token interceptors & custom timeout handling
- **Real-Time Telemetry**: Socket.IO client & server
- **Local Storage**: SharedPreferences

---

## 📁 Project Structure

```
VanTrack LK/
├── mobile/                     # Flutter Mobile Application
│   ├── lib/
│   │   ├── config/             # Themes, App Colors, Routes, Constants
│   │   ├── core/               # Errors, Network (Dio), Storage, Validators
│   │   ├── models/             # AuthUser, UserRole, Student, Trip, Route
│   │   ├── providers/          # AuthProvider, State Management
│   │   ├── screens/            # Splash, Onboarding, Login, Register, RoleRouter
│   │   ├── services/           # AuthService, StorageService
│   │   └── widgets/            # CustomButton, CustomTextField, BrandHeader, RoleSelectorChip
│   ├── test/                   # Widget & unit tests
│   └── pubspec.yaml
│
└── backend/                    # Node.js & Express REST API
    ├── src/
    │   ├── config/             # DB & JWT configurations
    │   ├── controllers/        # Auth, User, Trip, Attendance controllers
    │   ├── middlewares/        # JWT auth protection & Role-based authorization
    │   ├── models/             # User, Student, Vehicle, Route, Trip, Attendance
    │   ├── routes/             # REST API routes
    │   └── server.js           # Express app & Socket.IO server
    ├── .env.example
    └── package.json
```

---

## 🚀 Getting Started

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm start
```

The API server will listen on `http://0.0.0.0:5000`.

### 2. Mobile App Setup (Flutter)

```bash
cd mobile
flutter pub get
flutter run
```

> **Note for Android Emulator**: The app automatically uses `http://10.0.2.2:5000/api` to connect to your local backend. For physical Android devices connected via Wi-Fi, tap the **Settings** icon on the Login screen and set your PC's local IP address (e.g. `http://192.168.1.50:5000/api`).

---

## 📅 Development Roadmap & Status

- [x] **Stage 1**: Project Setup, Flutter Architecture, Theme, Splash Screen, Onboarding, Login, Registration & Role Router.
- [x] **Stage 2**: Backend Setup, MongoDB connection, JWT authentication, Cloudinary image upload, and role-based access.
- [x] **Stage 3**: Parent dashboard, Student profiles with digital QR pass, Child switcher, and Guardian management.
- [ ] **Stage 4**: Driver and assistant dashboards, vehicle, and route information.
- [ ] **Stage 5**: Trip management and student attendance with QR scanning.
- [ ] **Stage 6**: Real-time GPS tracking, maps, and ETA calculation.
- [ ] **Stage 7**: Firebase push notifications and incident reporting.
- [ ] **Stage 8**: Monthly invoices, payment history, and PayHere integration.
- [ ] **Stage 9**: End-to-end testing, bug fixing, security improvements, and final UI polishing.
