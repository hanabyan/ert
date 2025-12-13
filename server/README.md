# Iuran Warga - Backend

Backend server for Citizen Contribution Payment App using Clean Architecture.

## Project Structure

```
server/
├── src/
│   ├── entities/           # Domain entities
│   ├── use_cases/          # Business logic
│   ├── adapters/
│   │   ├── controllers/    # HTTP request handlers
│   │   └── repositories/   # Data access layer
│   └── frameworks/
│       ├── database/       # MySQL connection & schema
│       └── web/            # Express routes & middleware
└── package.json
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your MySQL credentials
```

3. Create database and run schema:
```bash
mysql -u root -p < src/frameworks/database/schema.sql
```

4. Seed initial data:
```bash
node src/frameworks/database/seeder.js
```

5. Start server:
```bash
npm run dev
```

## API Endpoints

### Public Routes
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/dashboard/overview/:block/:number` - 6-month payment overview
- `GET /api/dashboard/detail/:block/:number` - Detailed payment history
- `GET /api/dashboard/financial` - Monthly financial summary

### Protected Routes (Require Authentication)
- `GET /api/auth/profile` - Get user profile
- `POST /api/payments` - Submit batch payment
- `GET /api/payments/my` - Get user's payments

### Admin Routes
- `GET /admin/payments/pending` - Get pending payments
- `PUT /admin/payments/:id/verify` - Verify/reject payment
- Expense, Recipient, Tariff, Property management endpoints

## Default Admin Credentials
- Username: `admin`
- Password: `admin123`
