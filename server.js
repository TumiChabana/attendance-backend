// Load environment variables
require('dotenv').config();

// Import packages
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - allows frontend to communicate
app.use(cors());
app.use(express.json());

// Connect to MySQL database
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Test database connection
db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed.', err.message);
        return;
    }
    console.log('✅ Connected to MySQL database');
});

// Test route - check if server is running
app.get('/', (req, res) => {
    res.json({
        message: 'Attendance Tracker API',
        status: 'Server is running'
    });
});

// POST: Add new attendance record
app.post('/api/attendance', (req, res) => {
    const { employeeName, employeeID, date, status } = req.body;

    // Validation
    if (!employeeName || !employeeID || !date || !status) {
        return res.status(400).json({
            error: 'All fields are required'
        });
    }

    const sql = 'INSERT INTO attendance (employeeName, employeeID, date, status) VALUES (?, ?, ?, ?)';

    db.query(sql, [employeeName, employeeID, date, status], (err, result) => {
        if (err) {
            console.error('Insert error:', err);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({
            message: 'Attendance recorded',
            id: result.insertId
        });
    });
});

// GET: Retrieve all attendance records
app.get('/api/attendance', (req, res) => {
    const sql = 'SELECT * FROM attendance ORDER BY date DESC';

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Fetch error:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// DELETE: Remove attendance record
app.delete('/api/attendance/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM attendance WHERE id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Delete error:', err);
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }
        res.json({ message: 'Record deleted successfully' });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});