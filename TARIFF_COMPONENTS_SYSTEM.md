# Sistem Komponen Tarif dengan Approval Workflow

## Overview
Sistem ini memungkinkan warga untuk berlangganan komponen tarif tertentu (seperti pengelolaan sampah, keamanan 24 jam, dll) dengan periode yang fleksibel. Setiap perubahan langganan memerlukan approval dari admin.

## Database Schema

### 1. `tariff_components` (Master Komponen)
Tabel master untuk mendefinisikan komponen-komponen tarif yang tersedia.

**Columns:**
- `id` - Primary key
- `name` - Nama komponen (unique)
- `description` - Deskripsi komponen
- `is_active` - Status aktif/non-aktif
- `created_at`, `updated_at` - Timestamps

**Contoh Data:**
```sql
| id | name                    | description                          |
|----|-------------------------|--------------------------------------|
| 1  | Pengelolaan Sampah      | Layanan pengangkutan sampah          |
| 2  | Keamanan 24 Jam         | Layanan satpam 24 jam                |
| 3  | Kebersihan Lingkungan   | Layanan kebersihan area umum         |
```

### 2. `tariff_component_rates` (Harga Komponen)
Tabel untuk menyimpan harga setiap komponen berdasarkan periode dan tipe properti.

**Columns:**
- `id` - Primary key
- `component_id` - FK ke tariff_components
- `amount` - Harga komponen
- `valid_from` - Tanggal mulai berlaku
- `valid_to` - Tanggal akhir berlaku (nullable)
- `property_type` - ENUM('rumah', 'tanah', 'all')
- `created_at`, `updated_at` - Timestamps

**Contoh Data:**
```sql
| component_id | amount  | valid_from | valid_to | property_type |
|--------------|---------|------------|----------|---------------|
| 1            | 50000   | 2018-01-01 | NULL     | rumah         |
| 1            | 25000   | 2018-01-01 | NULL     | tanah         |
| 2            | 75000   | 2018-01-01 | NULL     | all           |
```

### 3. `property_component_subscriptions` (Langganan Properti)
Tabel untuk menyimpan langganan komponen per properti dengan approval workflow.

**Columns:**
- `id` - Primary key
- `property_id` - FK ke properties
- `component_id` - FK ke tariff_components
- `start_date` - Tanggal mulai langganan
- `end_date` - Tanggal akhir langganan (nullable)
- `status` - ENUM('pending', 'active', 'inactive', 'rejected')
- `requested_by` - User ID yang request
- `approved_by` - Admin ID yang approve (nullable)
- `approved_at` - Waktu approval (nullable)
- `rejection_reason` - Alasan reject (nullable)
- `created_at`, `updated_at` - Timestamps

**Status Flow:**
```
pending → active (approved)
pending → rejected (rejected by admin)
active → inactive (end_date reached or manually deactivated)
```

## Use Cases

### Use Case 1: Warga Subscribe Komponen Baru

**Skenario:**
Warga properti A1 ingin berlangganan "Pengelolaan Sampah" mulai 1 Januari 2025.

**Flow:**
1. Warga submit request melalui UI
2. System create record dengan status 'pending'
3. Admin menerima notifikasi
4. Admin review dan approve
5. Status berubah menjadi 'active'
6. Tarif mulai dihitung dari start_date

**Data:**
```json
{
  "property_id": 1,
  "component_id": 1,
  "start_date": "2025-01-01",
  "end_date": null,
  "status": "pending",
  "requested_by": 5
}
```

### Use Case 2: Warga Unsubscribe Komponen

**Skenario:**
Warga properti A1 ingin berhenti berlangganan "Pengelolaan Sampah" mulai 1 Maret 2025.

**Flow:**
1. Warga submit request dengan end_date
2. System create record baru atau update existing dengan status 'pending'
3. Admin approve
4. Status berubah, end_date di-set
5. Tarif berhenti dihitung setelah end_date

### Use Case 3: Perhitungan Tarif Bulanan

**Skenario:**
Hitung total iuran untuk properti A1 pada bulan Februari 2025.

**Logic:**
```javascript
// 1. Get base tariff (iuran pokok)
const baseTariff = await getTariff(propertyType, 'rutin');

// 2. Get active component subscriptions for the month
const subscriptions = await getActiveSubscriptions(propertyId, '2025-02-01');

// 3. Calculate component costs
let componentCost = 0;
for (const sub of subscriptions) {
    const rate = await getComponentRate(sub.componentId, '2025-02-01', propertyType);
    componentCost += rate.amount;
}

// 4. Total = base + components
const totalTariff = baseTariff.amount + componentCost;
```

## Historical Tracking

### Perhitungan Tunggakan dengan Komponen

Sistem akan menghitung tunggakan berdasarkan historical subscriptions:

**Contoh:**
- Properti A1, tipe rumah
- Base tariff: Rp 100.000
- Pengelolaan Sampah: Rp 50.000
- Subscription history:
  - Jan 2025: Tidak subscribe → Total: Rp 100.000
  - Feb 2025: Subscribe sampah → Total: Rp 150.000
  - Mar 2025: Subscribe sampah → Total: Rp 150.000
  - Apr 2025: Unsubscribe → Total: Rp 100.000

**Tunggakan Calculation:**
```
Jan: Rp 100.000 (paid Rp 0) → Debt: Rp 100.000
Feb: Rp 150.000 (paid Rp 0) → Debt: Rp 150.000
Mar: Rp 150.000 (paid Rp 200.000) → Debt: Rp 0, Overpay: Rp 50.000
Apr: Rp 100.000 (use overpay) → Debt: Rp 50.000

Total Debt: Rp 50.000
```

## API Endpoints (To Be Implemented)

### Warga Endpoints
```
POST   /api/property-components/subscribe
POST   /api/property-components/unsubscribe
GET    /api/property-components/my-subscriptions/:propertyId
GET    /api/property-components/available
```

### Admin Endpoints
```
GET    /api/admin/component-requests/pending
POST   /api/admin/component-requests/:id/approve
POST   /api/admin/component-requests/:id/reject
GET    /api/admin/components
POST   /api/admin/components
PUT    /api/admin/components/:id
GET    /api/admin/component-rates
POST   /api/admin/component-rates
```

## Frontend Features (To Be Implemented)

### Warga Dashboard
- View current subscriptions per property
- Subscribe/unsubscribe components
- View pending requests
- See tariff breakdown (base + components)

### Admin Dashboard
- Approve/reject subscription requests
- Manage components (CRUD)
- Manage component rates
- View subscription history per property

## Benefits

1. **Flexibility** - Warga bisa pilih layanan sesuai kebutuhan
2. **Transparency** - Jelas breakdown tarif base + komponen
3. **Historical Accuracy** - Tunggakan dihitung sesuai historical subscriptions
4. **Control** - Admin approve setiap perubahan
5. **Scalability** - Mudah tambah komponen baru

## Next Steps

1. ✅ Database schema created
2. ✅ Entities defined
3. ⏳ Create repositories
4. ⏳ Create use cases
5. ⏳ Create controllers
6. ⏳ Create frontend UI
7. ⏳ Update dashboard calculation logic
8. ⏳ Testing & validation
