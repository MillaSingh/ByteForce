MediQueue – Smart Clinic Appointment & Queue Management System 🏥
📖 Overview

MediQueue is a web-based healthcare appointment and queue management platform designed to improve efficiency in South African community clinics. The system enables patients to book appointments online, track queue positions in real-time, and receive healthcare services with reduced waiting times.

The platform also provides clinic administrators and staff with tools to manage appointments, queues, clinic services, operating hours, and analytics through dedicated dashboards.

This project was developed as part of a Software Design group project by ByteForce.

✨ Key Features
🔐 Authentication & User Management
Multi-role authentication system:
Patient
Staff
Administrator
Firebase Authentication integration
Secure login and registration
Forgot password & password reset workflow
Role selection after registration
Role-based dashboard redirection
Shared login system for all users
OTP verification support
📅 Appointment Management
Book clinic appointments online
Reschedule appointments
Cancel appointments
View upcoming appointments
View appointment history
Real-time available slot retrieval
Appointment conflict prevention
🏥 Clinic Management
Browse clinics and healthcare facilities
View clinic details and services
Search and filter clinics
Clinic operating hours management
Manage healthcare services offered by clinics
Clinic administration dashboard
👨‍⚕️ Queue Management System
Real-time queue tracking
Digital patient check-in
Queue position monitoring
Walk-in patient support
Queue status updates:
Waiting
In consultation
Complete
Queue analytics and monitoring
📊 Dashboard & Analytics
Admin Dashboard
Clinic analytics
Appointment statistics
Queue insights
No-show tracking
Weekly appointment trends
Staff management
Staff Dashboard
Queue management
Patient tracking
Walk-in management
Appointment monitoring
Patient Dashboard
Upcoming appointments
Queue status
Appointment history
Profile management
🔔 Notification & Security Features
Firebase-powered password reset emails
OTP verification support
Authentication validation
Protected routes and role-based authorization
Secure session handling
🛠 Tech Stack
Frontend
HTML5
CSS3
JavaScript (Vanilla JS)
UI Pages
Appointment booking pages
Queue tracking interface
Admin dashboards
Staff management pages
Clinic browsing system
Backend
Node.js
Express.js
Database
PostgreSQL
SQL Migrations
Authentication & Cloud Services
Firebase Authentication
Firebase Hosting
Testing
Jest
Automated Unit Testing
Integration Testing
🚀 Getting Started
📋 Prerequisites

Ensure you have installed:

Node.js (>=18.x)
npm
PostgreSQL
Git
Firebase CLI (optional)
⚙️ Installation
1️⃣ Clone the Repository
git clone https://github.com/MillaSingh/ByteForce.git
cd ByteForce
2️⃣ Install Dependencies
Backend
cd backend
npm install
Frontend
cd ../frontend
npm install
3️⃣ Configure Environment Variables

Create a .env file inside the backend directory:

DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mediqueue

FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
4️⃣ Run Database Migrations
node migrate.js
5️⃣ Start the Backend Server
node server.js
6️⃣ Open the Frontend

Open:

http://localhost:3000

or open the HTML pages inside the frontend/html directory.

📁 Project Structure
ByteForce/
│
├── .github/workflows/         # CI/CD workflows
├── backend/                   # Backend server and API
│   ├── controllers/           # Business logic
│   ├── models/                # Database models
│   ├── routes/                # API routes
│   ├── tests/                 # Automated Jest tests
│   ├── migrations/            # SQL migrations
│   ├── scripts/               # Utility scripts
│   ├── data/                  # Dataset files
│   ├── db.js                  # Database configuration
│   ├── server.js              # Express server entry
│   └── package.json
│
├── frontend/
│   ├── css/                   # Stylesheets
│   ├── html/                  # Application pages
│   ├── images/                # Static images
│   ├── js/                    # Frontend JavaScript
│   └── index.html
│
├── firebase.json              # Firebase configuration
├── README.md
└── package.json
👥 User Roles & Permissions
🧑 Patient
Register and log in
Book appointments
Cancel/reschedule appointments
Track queue position
View appointment history
Manage profile
👨‍⚕️ Staff
Manage queues
Check in patients
Monitor appointments
Handle walk-ins
View clinic queue analytics
👨‍💼 Administrator
Manage clinics
Manage operating hours
Manage clinic services
Manage staff assignments
View analytics dashboard
Monitor appointments and queues
🧪 Testing
Running Tests
Run all tests
npm test
Run tests with coverage
npx jest --coverage
✅ Automated Testing Coverage

The project includes automated tests for:

Appointment Controllers
Clinic Controllers
Authentication Routes
Queue Controllers
Dashboard Controllers
Staff Controllers
Database Models
Operating Hours Controllers
📊 Current Test Results
Metric	Result
Total Test Suites	27
Passed Test Suites	25
Failed Test Suites	2
Total Tests	244
Passed Tests	231
Failed Tests	13
🚀 CI/CD Integration

GitHub Actions workflows are configured for:

Automated testing
Continuous integration
Build validation

Workflow files:

.github/workflows/
├── blank.yml
└── ci.yml
🔧 Key Backend Components
Controllers
appointmentController.js
authController.js
clinicController.js
dashboardController.js
queueController.js
staffController.js
adminDashboardController.js
Database Models
appointmentModel.js
clinicModel.js
dashboardModel.js
queueModel.js
staffModel.js
🗄 Database Migrations

The project uses SQL migration scripts:

001_create_clinic_table.sql
002_create_user_table.sql
003_create_appointment_table.sql
004_create_queue_entry_table.sql
005_create_clinic_service.sql
006_create_clinic_operating_hours_table.sql
007_create_staff_profile_table.sql
📸 Application Pages
Authentication
Login
Register
Forgot Password
Reset Password
OTP Verification
Role Selection
Patient Features
Home
Clinics
Clinic Details
Appointment Booking
Queue Tracking
My Appointments
Profile
Admin Features
Admin Dashboard
Clinic Management
Operating Hours
Staff Management
🔒 Security Features
Firebase Authentication
Password Reset Synchronization
Role-based Access Control
OTP Verification
Secure Password Handling
Protected Backend Routes
📈 Future Enhancements
Planned Features
🔄 Email appointment reminders
🔄 SMS queue notifications
🔄 Mobile application
🔄 Real-time WebSocket queue updates
🔄 AI queue prediction system
🔄 Online consultation support
🔄 Advanced analytics dashboards
🔄 Multi-language support
🤝 Contributing
Development Workflow
Fork the repository
Create a feature branch
git checkout -b feature/FeatureName
Commit changes
git commit -m "Add feature"
Push changes
git push origin feature/FeatureName
Open a Pull Request
📄 License

This project is developed for educational and academic purposes as part of a university Software Design project.

❤️ Acknowledgements

Developed by ByteForce to improve accessibility and efficiency in South African healthcare clinics.

“Improving healthcare access through smart queue and appointment management.”
