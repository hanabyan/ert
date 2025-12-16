# 🚀 Quick Start Guide - Tariff Component System

## For Developers Continuing This Work

This guide will help you quickly understand and continue the development of the Tariff Component System.

---

## 📋 Prerequisites

### What's Already Done ✅
- ✅ Complete backend API (100%)
- ✅ Database schema & migrations
- ✅ Frontend API service layer
- ✅ Comprehensive documentation

### What Needs to Be Done ⏳
- ⏳ Frontend UI components
- ⏳ Integration testing
- ⏳ User acceptance testing

---

## 🏃 Quick Setup

### 1. Database Setup

```bash
# Navigate to project
cd /Users/hanabyan/Sourcecode/ert

# Run migrations
mysql -u root -p iuran_warga < server/src/frameworks/database/migrations/add_tariff_type.sql
mysql -u root -p iuran_warga < server/src/frameworks/database/migrations/add_tariff_components.sql

# Verify tables created
mysql -u root -p iuran_warga -e "SHOW TABLES LIKE '%component%';"
```

Expected output:
```
tariff_components
tariff_component_rates
property_component_subscriptions
```

### 2. Start Backend

```bash
cd server
npm install
npm run dev
```

Backend should be running on `http://localhost:3001`

### 3. Start Frontend

```bash
cd client
npm install
npm run dev
```

Frontend should be running on `http://localhost:3000`

---

## 🧪 Test the API

### Get Available Components

```bash
curl http://localhost:3001/api/components/available
```

Expected response:
```json
[
  {
    "id": 1,
    "name": "Pengelolaan Sampah",
    "description": "Layanan pengangkutan dan pengelolaan sampah",
    "isActive": true
  },
  {
    "id": 2,
    "name": "Keamanan 24 Jam",
    "description": "Layanan satpam 24 jam",
    "isActive": true
  }
]
```

### Subscribe to Component (Requires Auth)

```bash
# First, login to get token
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"warga1","password":"password"}' \
  | jq -r '.token')

# Then subscribe
curl -X POST http://localhost:3001/api/components/subscribe \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": 1,
    "componentId": 1,
    "startDate": "2025-01-01",
    "endDate": null
  }'
```

Expected response:
```json
{
  "subscriptionId": 1,
  "message": "Subscription request submitted. Waiting for admin approval."
}
```

### Admin: Get Pending Requests

```bash
# Login as admin
ADMIN_TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' \
  | jq -r '.token')

# Get pending requests
curl http://localhost:3001/api/admin/component-requests/pending \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Admin: Approve Request

```bash
curl -X POST http://localhost:3001/api/admin/component-requests/1/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 📂 Project Structure

```
ert/
├── server/
│   └── src/
│       ├── entities/
│       │   └── TariffComponentEntities.js       ← Component entities
│       ├── adapters/
│       │   ├── repositories/
│       │   │   └── TariffComponentRepositories.js  ← Data access
│       │   └── controllers/
│       │       └── ComponentSubscriptionController.js  ← API handlers
│       ├── use_cases/
│       │   └── ManageComponentSubscriptionsUseCase.js  ← Business logic
│       └── frameworks/
│           ├── database/
│           │   └── migrations/
│           │       └── add_tariff_components.sql  ← Database schema
│           └── web/
│               └── routes.js  ← API routes (updated)
│
├── client/
│   └── src/
│       ├── services/
│       │   └── api.js  ← API service (componentService added)
│       └── pages/
│           └── (UI components to be created)
│
└── Documentation/
    ├── TARIFF_COMPONENTS_SYSTEM.md
    ├── IMPLEMENTATION_STATUS.md
    └── CHECKPOINT_13_FINAL_SUMMARY.md
```

---

## 🎨 Frontend Development Guide

### Step 1: Create Warga Subscription Page

**File**: `client/src/pages/ComponentSubscription.jsx`

**What to build**:
```jsx
import React, { useState, useEffect } from 'react';
import { componentService } from '../services/api';

export default function ComponentSubscription() {
  const [components, setComponents] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);

  // Load available components
  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = async () => {
    const data = await componentService.getAvailableComponents();
    setComponents(data);
  };

  const handleSubscribe = async (componentId) => {
    await componentService.subscribe({
      propertyId: selectedProperty,
      componentId,
      startDate: new Date().toISOString().split('T')[0],
      endDate: null
    });
    // Refresh subscriptions
  };

  return (
    <div>
      {/* UI implementation */}
    </div>
  );
}
```

**UI Elements Needed**:
- Property selector dropdown
- Available components list with subscribe buttons
- Current subscriptions list with status
- Pending requests section
- Cost breakdown display

### Step 2: Create Admin Approval Page

**File**: `client/src/pages/AdminComponentApproval.jsx`

**What to build**:
```jsx
import React, { useState, useEffect } from 'react';
import { componentService } from '../services/api';

export default function AdminComponentApproval() {
  const [pendingRequests, setPendingRequests] = useState([]);

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    const data = await componentService.getPendingRequests();
    setPendingRequests(data);
  };

  const handleApprove = async (requestId) => {
    await componentService.approveRequest(requestId);
    loadPendingRequests();
  };

  const handleReject = async (requestId, reason) => {
    await componentService.rejectRequest(requestId, reason);
    loadPendingRequests();
  };

  return (
    <div>
      {/* UI implementation */}
    </div>
  );
}
```

**UI Elements Needed**:
- Pending requests table
- Approve/Reject buttons
- Rejection reason modal
- Request details view
- Status filters

### Step 3: Update Dashboard

**File**: `client/src/App.jsx` (LandingPage component)

**What to add**:
- Component breakdown tooltip on tariff amount
- Link to component subscription page
- Visual indicator for properties with active subscriptions

---

## 🔌 API Reference

### Warga Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/components/available` | Get all available components |
| POST | `/components/subscribe` | Request subscription |
| POST | `/components/unsubscribe/:id` | Request unsubscription |
| GET | `/components/subscriptions/:propertyId` | Get property subscriptions |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/component-requests/pending` | Get pending requests |
| POST | `/admin/component-requests/:id/approve` | Approve request |
| POST | `/admin/component-requests/:id/reject` | Reject request |
| GET | `/admin/components` | Get all components |
| POST | `/admin/components` | Create component |
| PUT | `/admin/components/:id` | Update component |
| POST | `/admin/component-rates` | Create rate |
| PUT | `/admin/component-rates/:id` | Update rate |

---

## 💡 Implementation Tips

### 1. Use Ant Design Components

The project already uses Ant Design. Recommended components:

```jsx
import { 
  Card, 
  Table, 
  Button, 
  Tag, 
  Modal, 
  Form, 
  Select,
  DatePicker,
  message 
} from 'antd';
```

### 2. Status Colors

```jsx
const statusColors = {
  pending: 'gold',
  active: 'green',
  rejected: 'red',
  inactive: 'gray'
};

<Tag color={statusColors[subscription.status]}>
  {subscription.status.toUpperCase()}
</Tag>
```

### 3. Error Handling

```jsx
try {
  await componentService.subscribe(data);
  message.success('Subscription request submitted');
} catch (error) {
  message.error(error.response?.data?.error || 'Failed to subscribe');
}
```

### 4. Loading States

```jsx
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    await componentService.someAction();
  } finally {
    setLoading(false);
  }
};

<Button loading={loading} onClick={handleAction}>
  Submit
</Button>
```

---

## 🐛 Common Issues & Solutions

### Issue 1: CORS Error
**Solution**: Make sure backend is running and CORS is configured in `server/src/frameworks/web/server.js`

### Issue 2: 401 Unauthorized
**Solution**: Check if token is properly stored in localStorage and sent in Authorization header

### Issue 3: Component Not Found
**Solution**: Verify migrations have been run and default data is seeded

### Issue 4: Subscription Already Exists
**Solution**: Check for overlapping subscriptions before allowing new subscription

---

## 📊 Data Flow

```
User Action (Frontend)
    ↓
componentService API call
    ↓
Backend Route
    ↓
Controller
    ↓
Use Case (Business Logic)
    ↓
Repository (Database)
    ↓
Response back to Frontend
    ↓
Update UI
```

---

## 🎯 Success Criteria

Your implementation is complete when:

- [ ] Warga can view available components
- [ ] Warga can subscribe/unsubscribe components
- [ ] Warga can see subscription status (pending/active/rejected)
- [ ] Admin can view pending requests
- [ ] Admin can approve/reject requests with reason
- [ ] Dashboard shows component breakdown
- [ ] Tariff calculation includes components
- [ ] Historical subscriptions are tracked
- [ ] All error cases are handled gracefully
- [ ] Loading states are shown appropriately

---

## 📚 Additional Resources

- **System Design**: `TARIFF_COMPONENTS_SYSTEM.md`
- **Implementation Status**: `IMPLEMENTATION_STATUS.md`
- **Complete Summary**: `CHECKPOINT_13_FINAL_SUMMARY.md`
- **Ant Design Docs**: https://ant.design/components/overview/
- **React Router Docs**: https://reactrouter.com/

---

## 🤝 Need Help?

If you encounter issues:

1. Check the documentation files
2. Review the backend code for API contracts
3. Test API endpoints with curl/Postman
4. Check browser console for errors
5. Verify database state

---

## 🎉 You're Ready!

Everything is set up and ready for frontend development. The backend is solid, well-documented, and fully functional.

**Happy coding!** 🚀

---

*Last Updated: 2025-12-15*
*Checkpoint: 13*
*Status: Backend Complete, Frontend Ready*
