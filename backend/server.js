
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
