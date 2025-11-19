
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

// Create tables if they don't exist
db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('MANAGER', 'OPERATOR')),
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
});


// API Endpoints (keeping the simple ones for now)

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

// Get a single user by id
app.get('/api/users/:id', (req, res) => {
    const { id } = req.params;
    db.get("SELECT id, name, email, role, status FROM users WHERE id = ?", [id], (err, row) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": row
        });
    });
});

// Create a new user (example - needs more fields for a full user)
app.post('/api/users', (req, res) => {
    // Note: This is a simplified endpoint. A full implementation
    // would require all NOT NULL fields (role, password, pin).
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ "error": "Name and email are required" });
    }

    // Dummy data for required fields not included in the simple request
    const role = 'OPERATOR'; // default role
    const password = 'temp_password'; // should be hashed
    const pin = '1234'; // should be hashed

    const sql = "INSERT INTO users (name, email, role, password, pin) VALUES (?, ?, ?, ?, ?)";
    db.run(sql, [name, email, role, password, pin], function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": { id: this.lastID, name, email, role }
        });
    });
});

app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});
