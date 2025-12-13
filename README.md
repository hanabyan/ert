# Iuran Warga - Citizen Contribution Payment App

A full-stack Progressive Web App (PWA) for managing citizen contributions with MySQL database and Clean Architecture.

## Features

### For Citizens (Warga)
- 🔍 **Public Dashboard**: Search by Block/Number to view payment history
- 📊 **6-Month Overview**: Visual payment status with debt highlighting
- 💰 **Batch Payment**: Submit multiple properties/months in one transaction
- 📱 **PWA**: Install on mobile devices
- 🔒 **Secure Login**: Required only for payments and profile edits

### For Administrators
- ✅ **Payment Verification**: Approve/reject incoming payments
- 💸 **Expense Management**: Track all cluster expenses
- 👥 **Master Data**: Manage recipients, tariffs, and properties
- 📈 **Financial Reports**: Monthly income vs expense summaries

## Tech Stack

**Frontend:**
- React + Vite
- PWA (vite-plugin-pwa)
- Axios for API calls
- Premium Dark Theme CSS

**Backend:**
- Node.js + Express
- Clean Architecture (Entities, Use Cases, Adapters, Frameworks)
- JWT Authentication
- MySQL Database

## Project Structure

```
ert/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── services/      # API layer
│   │   ├── context/       # React Context
│   │   ├── components/    # Reusable components
│   │   └── pages/         # Page components
│   └── vite.config.ts     # Vite + PWA config
│
└── server/                # Node.js Backend
    └── src/
        ├── entities/      # Domain models
        ├── use_cases/     # Business logic
        ├── adapters/      # Controllers & Repositories
        └── frameworks/    # Express & MySQL
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- MySQL 5.7+

### Database Setup

1. Create database:
```bash
mysql -u root -p
CREATE DATABASE iuran_warga;
exit
```

2. Run schema:
```bash
cd server
mysql -u root -p iuran_warga < src/frameworks/database/schema.sql
```

3. Seed initial data:
```bash
node src/frameworks/database/seeder.js
```

### Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MySQL credentials
npm run dev
```

Server runs on `http://localhost:3001`

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

Client runs on `http://localhost:3000`

## Default Credentials

**Admin:**
- Username: `admin`
- Password: `admin123`

## API Endpoints

### Public
- `GET /api/dashboard/overview/:block/:number` - 6-month payment overview
- `GET /api/dashboard/detail/:block/:number` - Detailed history
- `GET /api/dashboard/financial` - Monthly financial summary

### Protected (Warga)
- `POST /api/payments` - Submit batch payment
- `GET /api/payments/my` - Get user payments

### Admin Only
- `GET /admin/payments/pending` - Pending payments
- `PUT /admin/payments/:id/verify` - Verify payment
- Full CRUD for expenses, recipients, tariffs, properties

## Features Implemented

✅ Clean Architecture (Backend)
✅ MySQL Database with proper schema
✅ JWT Authentication
✅ Public read-only dashboard
✅ Batch payment submission
✅ Payment verification workflow
✅ Expense & recipient management
✅ Tariff management
✅ Audit logging
✅ PWA configuration
✅ Premium dark theme UI
✅ Responsive design

## Development

The application follows Clean Architecture principles:

1. **Entities**: Core business models
2. **Use Cases**: Application business rules
3. **Adapters**: Interface between use cases and frameworks
4. **Frameworks**: External tools (Express, MySQL)

This ensures:
- Testability
- Independence from frameworks
- Maintainability
- Clear separation of concerns

## License

MIT
