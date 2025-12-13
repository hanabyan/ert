import pool from './connection.js';

// Property data based on user requirements
const PROPERTY_DATA = {
    A: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12],
    B: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    C: [1, 2, 3, 5, 6, 7, 8, 9, 10, 11],
    D: [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 15],
    E: [1, 2, 3, 5, 6, 7, 8]
};

async function seedDatabase() {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        console.log('🌱 Starting database seeding...');

        // 1. Create Admin User
        const adminPassword = '$2a$10$YourHashedPasswordHere'; // bcrypt hash for 'admin123'
        await connection.query(`
            INSERT INTO users (username, password, full_name, role) 
            VALUES ('admin', ?, 'Administrator', 'admin')
            ON DUPLICATE KEY UPDATE id=id
        `, [adminPassword]);
        console.log('✅ Admin user created');

        // 2. Seed Properties
        let propertyCount = 0;
        for (const [block, numbers] of Object.entries(PROPERTY_DATA)) {
            for (const number of numbers) {
                await connection.query(`
                    INSERT INTO properties (block, number, type, owner_id)
                    VALUES (?, ?, 'rumah', NULL)
                    ON DUPLICATE KEY UPDATE id=id
                `, [block, number]);
                propertyCount++;
            }
        }
        console.log(`✅ ${propertyCount} properties seeded`);

        // 3. Seed Initial Tariff (Current Year)
        const currentYear = new Date().getFullYear();
        await connection.query(`
            INSERT INTO tariffs (amount, valid_from, valid_to, property_type)
            VALUES (100000, ?, NULL, 'all')
            ON DUPLICATE KEY UPDATE id=id
        `, [`${currentYear}-01-01`]);
        console.log('✅ Initial tariff created (Rp 100,000)');

        // 4. Seed Sample Expense Recipients
        const recipients = [
            ['PLN', '123456789', 'utility', 'Listrik Cluster'],
            ['PDAM', '987654321', 'utility', 'Air Bersih'],
            ['Tukang Sampah', '555-1234', 'cash', 'Petugas Kebersihan'],
            ['Satpam', '555-5678', 'cash', 'Security']
        ];

        for (const [name, identity, type, desc] of recipients) {
            await connection.query(`
                INSERT INTO expense_recipients (name, identity_number, type, description)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE id=id
            `, [name, identity, type, desc]);
        }
        console.log('✅ Sample expense recipients created');

        await connection.commit();
        console.log('🎉 Database seeding completed successfully!');

    } catch (error) {
        await connection.rollback();
        console.error('❌ Seeding failed:', error);
        throw error;
    } finally {
        connection.release();
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    seedDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export default seedDatabase;
