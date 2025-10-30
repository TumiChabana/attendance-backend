// Load environment variables
require('dotenv').config();

// Import packages
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - CRITICAL FIX
app.use(cors({
    origin: ['https://your-username.github.io', 'http://localhost:3000'],
    credentials: true
}));

// Middleware
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
        console.error('❌ Database connection failed:', err.message);
        return;
    }
    console.log('✅ Connected to MySQL database');
});

// Test route
app.get('/', (req, res) => {
    res.json({
        message: 'Attendance Tracker API',
        status: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// POST: Add new attendance record
app.post('/api/attendance', (req, res) => {
    console.log('📥 Received attendance data:', req.body);
    
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
            console.error('❌ Database insert error:', err);
            return res.status(500).json({ error: err.message });
        }
        console.log('✅ Record inserted with ID:', result.insertId);
        res.status(201).json({
            message: 'Attendance recorded successfully',
            id: result.insertId
        });
    });
});

// GET: Retrieve all attendance records
app.get('/api/attendance', (req, res) => {
    console.log('📤 Fetching all attendance records');
    
    const sql = 'SELECT * FROM attendance ORDER BY date DESC';

    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Database fetch error:', err);
            return res.status(500).json({ error: err.message });
        }
        console.log(`✅ Found ${results.length} records`);
        res.json(results);
    });
});

// DELETE: Remove attendance record
app.delete('/api/attendance/:id', (req, res) => {
    const { id } = req.params;
    console.log(`🗑️ Deleting record with ID: ${id}`);
    
    const sql = 'DELETE FROM attendance WHERE id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('❌ Database delete error:', err);
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }
        console.log('✅ Record deleted successfully');
        res.json({ message: 'Record deleted successfully' });
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        database: 'Connected', 
        timestamp: new Date().toISOString() 
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Endpoints:`);
    console.log(`   GET  / → API Status`);
    console.log(`   POST /api/attendance → Add record`);
    console.log(`   GET  /api/attendance → Get all records`);
    console.log(`   DELETE /api/attendance/:id → Delete record`);
});