
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = 3001; // Different from the frontend port

app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the SQLite database.');
});

// Create tables and seed data
db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('ADMIN', 'MANAGER', 'ASSISTANT_MANAGER', 'GATE_ENTRY_OPERATOR', 'OPERATOR', 'QUALITY_SUPERVISOR', 'BIN_OPERATOR', 'STORE_MANAGER', 'PLANT_OPERATOR', 'PACKAGING_SUPERVISOR', 'LOGISTICS_OFFICER')),
        password TEXT NOT NULL,
        pin TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        email TEXT UNIQUE,
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        family_details TEXT,
        status TEXT DEFAULT 'ACTIVE',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Activity logs table
    db.run(`CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT, -- Storing JSON as TEXT
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Password reset requests table
    db.run(`CREATE TABLE IF NOT EXISTS password_reset_requests (
        request_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        status TEXT DEFAULT 'PENDING',
        request_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Gate Entries Table
    db.run(`CREATE TABLE IF NOT EXISTS gate_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gate_mode TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        serial_number TEXT UNIQUE,
        vehicle_number TEXT,
        driver_name TEXT,
        phone_number TEXT,
        note TEXT,
        from_broker TEXT,
        to_location TEXT,
        quantity REAL,
        from_location TEXT,
        broker_name TEXT,
        broker_phone TEXT,
        user_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Weighing Records Table
    db.run(`CREATE TABLE IF NOT EXISTS weighing_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_number TEXT NOT NULL,
        ticket_number TEXT UNIQUE,
        note TEXT,
        in_weight REAL,
        out_weight REAL,
        net_weight REAL,
        sample_collector TEXT,
        user_id INTEGER,
        gate_entry_id INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (gate_entry_id) REFERENCES gate_entries(id)
    )`);

    // Quality Checks Table
    db.run(`CREATE TABLE IF NOT EXISTS quality_checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_number TEXT,
        transaction_id TEXT UNIQUE,
        note TEXT,
        size_analysis_7 REAL,
        size_analysis_5 REAL,
        size_analysis_4 REAL,
        small_mud_percent REAL,
        big_mud_stones_percent REAL,
        damage_1 REAL,
        physical_damage_2 REAL,
        moisture_content_percent REAL,
        report_url TEXT,
        check_type TEXT CHECK(check_type IN ('initial', 'final')),
        user_id INTEGER,
        weighing_record_id INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (weighing_record_id) REFERENCES weighing_records(id)
    )`);

    // Bin Operations Table
    db.run(`CREATE TABLE IF NOT EXISTS bin_operations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_number TEXT,
        bin_status TEXT,
        rm1 TEXT,
        rm2 TEXT,
        rm3 TEXT,
        ob_quantity REAL,
        cb_quantity REAL,
        wb_quantity REAL,
        pb_quantity REAL,
        sr_in_quantity REAL,
        hub_quantity REAL,
        user_id INTEGER,
        quality_check_id INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (quality_check_id) REFERENCES quality_checks(id)
    )`);

    // Storage Records Table
    db.run(`CREATE TABLE IF NOT EXISTS storage_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entered_vehicle TEXT,
        quantity REAL,
        material_content TEXT,
        jute_bags_quantity INTEGER,
        plastic_bags_quantity INTEGER,
        location_main TEXT,
        location_sub TEXT,
        user_id INTEGER,
        bin_operation_id INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (bin_operation_id) REFERENCES bin_operations(id)
    )`);

    // Processing Records Table
    db.run(`CREATE TABLE IF NOT EXISTS processing_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        process_id TEXT UNIQUE,
        machine_id TEXT,
        parameters TEXT,
        user_id INTEGER,
        storage_record_id INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (storage_record_id) REFERENCES storage_records(id)
    )`);

    // Packing Records Table
    db.run(`CREATE TABLE IF NOT EXISTS packing_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        packing_id TEXT UNIQUE,
        bag_size_kg INTEGER,
        no_of_bags INTEGER,
        user_id INTEGER,
        processing_record_id INTEGER,
        final_quality_check_id INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (processing_record_id) REFERENCES processing_records(id),
        FOREIGN KEY (final_quality_check_id) REFERENCES quality_checks(id)
    )`);

    // Dispatch Records Table
    db.run(`CREATE TABLE IF NOT EXISTS dispatch_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dispatch_id TEXT UNIQUE,
        destination TEXT,
        truck_no TEXT,
        user_id INTEGER,
        packing_record_id INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (packing_record_id) REFERENCES packing_records(id)
    )`);

    // Seed the database with initial users if the table is empty
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (err) {
            console.error(err.message);
            return;
        }

        if (row.count === 0) {
            const users = [
                { name: 'Admin User', role: 'ADMIN', email: 'admin@example.com' },
                { name: 'Manager User', role: 'MANAGER', email: 'manager@example.com' },
                { name: 'Assistant Manager', role: 'ASSISTANT_MANAGER', email: 'asst.manager@example.com' },
                { name: 'Gate Entry Operator', role: 'GATE_ENTRY_OPERATOR', email: 'gate@example.com' },
                { name: 'Operator', role: 'OPERATOR', email: 'operator@example.com' },
                { name: 'Quality Supervisor', role: 'QUALITY_SUPERVISOR', email: 'quality@example.com' },
                { name: 'Bin Operator', role: 'BIN_OPERATOR', email: 'bin@example.com' },
                { name: 'Store Manager', role: 'STORE_MANAGER', email: 'store@example.com' },
                { name: 'Plant Operator', role: 'PLANT_OPERATOR', email: 'plant@example.com' },
                { name: 'Packaging Supervisor', role: 'PACKAGING_SUPERVISOR', email: 'packaging@example.com' },
                { name: 'Logistics Officer', role: 'LOGISTICS_OFFICER', email: 'logistics@example.com' },
            ];

            const stmt = db.prepare("INSERT INTO users (name, role, email, password, pin) VALUES (?, ?, ?, ?, ?)");
            users.forEach(user => {
                // In a real app, passwords and PINs should be securely hashed.
                stmt.run(user.name, user.role, user.email, 'password123', '1234');
            });
            stmt.finalize();
            console.log('Initial users have been added to the database.');
        }
    });
});

// API Endpoints

// Get all users
app.get('/api/users', (req, res) => {
    db.all("SELECT id, name, email, role, status FROM users", [], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// ... (rest of the endpoints)

app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});
