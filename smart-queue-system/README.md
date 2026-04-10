# Queue System

## Quick Start

### First Time Setup
```bash
1. Double-click: SETUP-AND-START.bat
2. Wait for backend to show "Initialized"
3. Login at http://localhost:3000
```

### Regular Start
```bash
1. START-BACKEND.bat
2. START-FRONTEND.bat
```

## Default Login Credentials

**Admin:**
- Email: gowthamknp143@gmail.com
- Password: Gowtham@2024

**Staff:**
- Email: staff@smartqueue.com
- Password: Staff@123

## System Features

### For Users:
- Generate queue tokens for hospitals, banks, and government offices
- Select appointment time (today or tomorrow)
- View and manage tokens
- Receive email reminders

### For Staff:
- Manage queue
- Call next token
- Mark attendance

### For Admin:
- Manage users (add/edit/delete)
- Create organizations and sectors
- Manage services (add/edit/delete)
- View token statistics
- Delete sectors when no longer needed

## Organizations

- 🏥 **Hospitals** - 24/7 service
- 🏦 **Banks** - 9 AM - 5 PM
- 🏢 **Government Offices** - 9 AM - 5 PM

## Configuration

- **Backend:** `backend/src/main/resources/application.properties`
- **Frontend:** `frontend/.env`
- **Database:** MySQL (localhost:3306, root/123456)

## Troubleshooting

### Login Issues
If login shows "Invalid email or password":
1. Make sure backend is running
2. Check MySQL service is running
3. Restart backend to initialize database

### Dashboard Empty
1. Restart backend
2. Refresh browser
3. Check backend logs for "Initialized" message

### Backend Won't Start
- Check MySQL is running (services.msc)
- Verify MySQL password in application.properties
- Check port 8080 is available

## Tech Stack

- **Backend:** Spring Boot, MySQL, JWT, WebSocket
- **Frontend:** React, React Router, Axios
- **Authentication:** JWT + Google OAuth

## Ports

- Backend: http://localhost:8080
- Frontend: http://localhost:3000
- MySQL: localhost:3306
