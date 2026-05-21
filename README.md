# 🏥 ByteForce – MediQueue

> A smart clinic appointment and queue management platform designed to improve patient flow, reduce waiting times, and modernize public healthcare access in South African community clinics.

---

## 📖 Overview

MediQueue is a web-based healthcare management system developed to streamline clinic operations, appointment scheduling, and patient queue management. The platform helps patients book appointments efficiently while enabling clinic administrators and staff to manage queues, operating hours, and healthcare services in real time.

The system was developed as a Software Design group project focused on solving real-world healthcare accessibility and queue management challenges.

---

# ✨ Key Features

## 🔐 Authentication & User Management

- Secure user registration and login
- OTP password recovery system
- Role-based access control
- Patient and staff account management
- Profile management system
- South African ID validation
- Date of birth verification

---

## 📅 Appointment Management

- Book clinic appointments online
- Manage upcoming appointments
- View appointment history
- Clinic-based scheduling
- Appointment status tracking
- Queue position monitoring

---

## 🏥 Clinic Management

- Browse available clinics
- View clinic operating hours
- Clinic service management
- Healthcare facility database integration
- Admin clinic dashboard
- Staff assignment management

---

## ⏳ Queue Management System

- Real-time queue tracking
- Queue entry management
- Live patient flow monitoring
- Queue prioritization support
- Appointment-to-queue integration

---

## 👨‍⚕️ Staff & Administration

- Admin dashboard for clinic management
- Staff profile management
- Operating hours administration
- Clinic performance monitoring
- Appointment analytics and reporting

---

## 📱 User Experience

- Responsive web interface
- Clean and intuitive UI
- Easy appointment booking workflow
- Dashboard-based navigation
- Mobile-friendly layouts

---

# 🛠 Tech Stack

## Frontend

- HTML5
- CSS3
- JavaScript
- Responsive UI Design

---

## Backend

- Node.js
- Express.js

---

## Database & Data Management

- PostgreSQL
- SQL Migration Scripts
- CSV Clinic Dataset Integration

---

## Authentication & Security

- OTP Verification
- Session-based Authentication
- Input Validation
- Secure Password Handling

---

## Development Tools

- Firebase Hosting
- GitHub Actions (CI/CD)
- ESLint
- Automated Workflow Pipelines

---

# 🚀 Getting Started

## 📋 Prerequisites

Ensure you have the following installed:

- Node.js (>=18.x)
- npm
- PostgreSQL
- Git

---

# ⚙️ Installation

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/MillaSingh/ByteForce.git
cd ByteForce
```

---

## 2️⃣ Install Dependencies

### Backend Dependencies

```bash
cd backend
npm install
```

### Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## 3️⃣ Configure PostgreSQL Database

Create a PostgreSQL database and update your database configuration inside:

```bash
backend/db.js
```

Example configuration:

```js
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "mediqueue",
  password: "your_password",
  port: 5432,
});
```

---

## 4️⃣ Run Database Migrations

Inside the backend folder:

```bash
node migrate.js
```

---

## 5️⃣ Start the Backend Server

```bash
node server.js
```

Server runs on:

```bash
http://localhost:3000
```

---

## 6️⃣ Launch the Frontend

Open:

```bash
frontend/index.html
```

Or use Live Server in VS Code.

---

# 📂 Project Structure

```bash
ByteForce/
│
├── .github/workflows/          # CI/CD workflows
│
├── backend/                    # Backend server and API
│   ├── controllers/            # Route controllers
│   ├── models/                 # Database models
│   ├── routes/                 # API routes
│   ├── migrations/             # SQL migration scripts
│   ├── scripts/                # Utility scripts
│   ├── tests/                  # Backend testing
│   ├── db.js                   # Database connection
│   ├── migrate.js              # Migration runner
│   └── server.js               # Express server
│
├── frontend/                   # Frontend application
│   ├── css/                    # Stylesheets
│   ├── html/                   # HTML pages
│   ├── images/                 # Static assets
│   └── js/                     # Frontend JavaScript
│
├── data/                       # Healthcare datasets
│   └── health_facilities.csv
│
├── firebase.json               # Firebase hosting config
├── package.json                # Project metadata
└── README.md
```

---

# 👥 User Roles

## 🧑‍🤝‍🧑 Patients

- Register and login
- Book appointments
- View queue positions
- Manage profiles
- Recover passwords using OTP

---

## 👨‍⚕️ Staff Members

- Manage clinic queues
- View appointments
- Update patient flow
- Access clinic dashboards

---

## 👨‍💼 Administrators

- Manage clinics
- Manage operating hours
- Oversee appointments
- Monitor queue systems
- Manage staff accounts

---

# 🧪 Testing

## Run Backend Tests

```bash
cd backend
npm test
```

---

# 🚀 CI/CD Pipeline

The project uses GitHub Actions for:

- Automated workflows
- Continuous Integration
- Deployment automation
- Code quality checks

Workflow files are located in:

```bash
.github/workflows/
```

---

# 📊 Database Design

The system includes SQL migrations for:

- Users
- Clinics
- Appointments
- Queue Entries
- Clinic Services
- Operating Hours
- Staff Profiles

Migration files are located in:

```bash
backend/migrations/
```

---

# 🔥 Firebase Hosting

The application is deployed using Render.

# 🌍 Live Demo

🚀 **Hosted Application**

```bash
https://byteforce-vv36.onrender.com
```

---

# 📌 Core System Pages

- 🏠 Home Page
- 🔑 Login & Registration
- 📅 Appointment Booking
- ⏳ Queue Dashboard
- 🏥 Clinic Listings
- 👤 User Profile
- 👨‍💼 Admin Dashboard
- 👨‍⚕️ Staff Dashboard

---

# 📈 Future Enhancements

- 🔄 Real-time notifications
- 🔄 SMS appointment reminders
- 🔄 AI-powered queue prediction
- 🔄 Mobile application
- 🔄 Multi-clinic synchronization
- 🔄 QR code check-ins
- 🔄 Telemedicine integration

---

# 🤝 Contributing

## Contribution Workflow

```bash
# Create feature branch
git checkout -b feature/AmazingFeature

# Commit changes
git commit -m "Add AmazingFeature"

# Push branch
git push origin feature/AmazingFeature
```

Then open a Pull Request 🚀

---

# 📄 License

This project was developed for academic purposes as part of a Software Design group project.

---

# ❤️ Acknowledgements

Special thanks to:

- Healthcare workers
- Community clinics
- Project supervisors
- Open-source contributors

---

# 👨‍💻 Development Team

**ByteForce Team**

Built with ❤️ to improve healthcare accessibility and clinic efficiency in South Africa 🇿🇦
