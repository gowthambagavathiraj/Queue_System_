# Smart Queue Management System

A comprehensive queue management system for hospitals, banks, and government offices with email notifications, staff reports, and admin dashboard.

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

**Admin Account:**
- Email: `admin@smartqueue.com`
- Password: `Admin@2024`

**Staff Account:**
- Email: `staff@smartqueue.com`
- Password: `Staff@123`

**Developer Account:**
- Register at http://localhost:3000/register
- Verify email with OTP sent to your inbox
- Login after verification

## System Features

### For Customers (Developers):
- ✅ Register and verify email with OTP
- ✅ Generate queue tokens for services
- ✅ Select appointment time (today or tomorrow)
- ✅ View and manage your tokens
- ✅ Receive email notifications:
  - Token confirmation
  - Reminder 30 minutes before appointment
  - Token called notification
  - Service completion/absence notification

### For Staff:
- ✅ Manage queue for assigned services
- ✅ Call next token
- ✅ Mark attendance (attended/absent)
- ✅ View comprehensive reports:
  - Daily Report (single date)
  - Weekly Report (7-day period)
  - Monthly Report (entire month)
- ✅ Export reports to CSV
- ✅ View customer details (name, email, phone, purpose)

### For Admin:
- ✅ Manage users (add/edit/delete)
- ✅ Create and manage organizations
- ✅ Manage services (add/edit/delete)
- ✅ View token statistics
- ✅ Configure service times and availability

## Organizations

- 🏥 **Hospitals** - 24/7 service
- 🏦 **Banks** - 9 AM - 5 PM
- 🏢 **Government Offices** - 9 AM - 5 PM

## Email Notification System

The system uses Gmail SMTP for all notifications:

### Email Types:
1. **Registration Verification** - 6-digit OTP (expires in 10 minutes)
2. **Token Confirmation** - Sent immediately after token generation
3. **Appointment Reminder** - Sent 30 minutes before appointment time
4. **Token Called** - When staff calls your token
5. **Service Completed** - When marked as attended
6. **Token Closed** - When marked as absent

### Email Configuration:
- Host: smtp.gmail.com
- Port: 587
- Configured in: `backend/src/main/resources/application.properties`

## Booking Rules

### Time Slot Booking:
- **Before 9:00 AM** - Can book for Today or Tomorrow
- **After 9:00 AM** - Can only book for Tomorrow
- Time slots: 15-minute intervals
- Layout: 3 slots per row (horizontal grid)

### Token Generation:
- Takes 10-20 seconds to generate
- Assigns queue position automatically
- Calculates estimated wait time
- Sets appointment time based on selection

## Staff Reports

### Report Types:
1. **Daily Report** - View tokens for any single date
2. **Weekly Report** - View 7-day period (select start date)
3. **Monthly Report** - View entire month (select month)

### Report Features:
- Grouped by organization
- Shows statistics (total, attended, absent, cancelled)
- Expandable cards with token details
- Customer information (name, email, phone, service, purpose)
- CSV export functionality

## Configuration

### Backend Configuration
File: `backend/src/main/resources/application.properties`

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/smart_queue_db
spring.datasource.username=root
spring.datasource.password=123456

# Email (Gmail SMTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=gowthamknp143@gmail.com
spring.mail.password=nhsg sspw topd oztw

# JWT Secret
app.jwt.secret=SmartQueueJWTSecretKey2024...
app.jwt.expiration=86400000

# App Settings
app.otp.expiry-minutes=10
app.token.reminder-before-minutes=30
```

### Frontend Configuration
File: `frontend/.env`

```env
REACT_APP_API_BASE_URL=http://localhost:8080/api
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

## Database Setup

### Requirements:
- MySQL 8.0 or higher
- Database: `smart_queue_db` (auto-created)
- Username: `root`
- Password: `123456`

### Tables:
- `users` - User accounts (admin, staff, customers)
- `organizations` - Hospitals, banks, government offices
- `services` - Services offered by organizations
- `tokens` - Queue tokens with appointments

## Animations

The system includes smooth CSS animations:
- Fade-in effects for cards
- Slide-in animations for lists
- Hover effects (lift, scale, glow)
- Staggered animations for multiple items
- 60fps performance

## Troubleshooting

### Registration Issues
**Problem:** Email verification OTP not received
**Solution:**
1. Check spam/junk folder
2. Verify email configuration in application.properties
3. Check backend console for email sending logs
4. Use "Resend OTP" button on verification page

### Login Issues
**Problem:** "Invalid email or password"
**Solution:**
1. Make sure backend is running
2. Check MySQL service is running
3. Verify email is verified (check email for OTP)
4. Restart backend to initialize database

**Problem:** "Email not verified"
**Solution:**
1. Check your email for verification OTP
2. Go to /verify-email page
3. Enter OTP and verify
4. Try logging in again

### Dashboard Empty
**Solution:**
1. Restart backend
2. Refresh browser
3. Check backend logs for "Initialized" message
4. Verify organizations are created

### Backend Won't Start
**Solution:**
- Check MySQL is running (services.msc)
- Verify MySQL password in application.properties
- Check port 8080 is available
- Check Java version (requires Java 17+)

### Email Not Sending
**Solution:**
1. Verify Gmail SMTP credentials in application.properties
2. Check if "Less secure app access" is enabled (if using regular password)
3. Use App-specific password for Gmail
4. Check backend console for email errors

## Tech Stack

### Backend:
- Spring Boot 3.x
- Spring Security + JWT
- Spring Data JPA
- MySQL Database
- JavaMailSender (Email)
- WebSocket (Real-time updates)
- Lombok (Reduce boilerplate)

### Frontend:
- React 18
- React Router v6
- Axios (HTTP client)
- Material-UI (Components)
- Google OAuth
- React Hot Toast (Notifications)

### Authentication:
- JWT (JSON Web Tokens)
- Google OAuth 2.0
- Email verification with OTP
- Password encryption (BCrypt)

## Ports

- **Backend:** http://localhost:8080
- **Frontend:** http://localhost:3000
- **MySQL:** localhost:3306

## Project Structure

```
smart-queue-system/
├── backend/
│   ├── src/main/java/com/smartqueue/
│   │   ├── config/          # Security, WebSocket, DataInitializer
│   │   ├── controller/      # REST API endpoints
│   │   ├── dto/             # Data Transfer Objects
│   │   ├── model/           # Entity classes
│   │   ├── repository/      # JPA repositories
│   │   ├── security/        # JWT authentication
│   │   └── service/         # Business logic
│   └── src/main/resources/
│       └── application.properties
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/      # React components
│       │   ├── admin/       # Admin dashboard
│       │   ├── auth/        # Login, Register, Verify
│       │   ├── dashboard/   # Main dashboard
│       │   ├── queue/       # Queue and tokens
│       │   ├── staff/       # Staff reports
│       │   └── welcome/     # Welcome page
│       ├── context/         # Auth context
│       ├── services/        # API services
│       └── App.js
└── README.md
```

## Important Notes

1. **Email Verification Required** - New users must verify email before login
2. **OTP Expires in 10 Minutes** - Verify email within this time
3. **Booking Cutoff: 9 AM** - After 9 AM, can only book for tomorrow
4. **Reminder: 30 Minutes** - Email sent 30 minutes before appointment
5. **Phone Number Optional** - Email is primary contact method
6. **Admin/Staff Auto-Verified** - No OTP needed for system accounts
7. **Google OAuth Auto-Verified** - No OTP needed for Google login

## Security Features

- ✅ JWT token authentication
- ✅ Password encryption (BCrypt)
- ✅ Email verification with OTP
- ✅ CORS protection
- ✅ SQL injection prevention (JPA)
- ✅ XSS protection
- ✅ Role-based access control (ADMIN, STAFF, CUSTOMER)

## Future Enhancements

- SMS notifications (see SMS-IMPLEMENTATION-GUIDE.md for setup)
- WhatsApp notifications (requires Business API with SMS verification)
- Mobile app (React Native)
- QR code for tokens
- Real-time queue display screens
- Multi-language support
- Payment integration

## Support

For issues or questions:
1. Check this README first
2. Check backend console logs
3. Check browser console for frontend errors
4. Verify all configurations are correct

## License

This project is for educational and demonstration purposes.
