require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS - allow all origins
app.use(cors());
app.use(express.json());

// Create connection pool (FIXES THE ISSUE!)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
});

// Test database connection
pool.getConnection((err, connection) => {
    if (err) {
        console.log('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Connected to MySQL database');
        connection.release();
    }
});

// Health check with database test
app.get('/', (req, res) => {
    pool.query('SELECT 1', (err) => {
        if (err) {
            res.json({ 
                message: 'API is running but database connection failed',
                error: err.message 
            });
        } else {
            res.json({ 
                message: 'Attendance Tracker API',
                status: 'Server and database are running',
                timestamp: new Date().toISOString()
            });
        }
    });
});

// GET: Retrieve all attendance records
app.get('/api/attendance', (req, res) => {
    const sql = 'SELECT * FROM attendance ORDER BY date DESC';
    
    pool.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Database fetch error:', err);
            return res.status(500).json({ error: 'Database connection failed' });
        }
        res.json(results);
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
    
    pool.query(sql, [employeeName, employeeID, date, status], (err, result) => {
        if (err) {
            console.error('❌ Database insert error:', err);
            return res.status(500).json({ error: 'Failed to save record' });
        }
        
        res.status(201).json({
            message: 'Attendance recorded successfully',
            id: result.insertId
        });
    });
});

// DELETE: Remove attendance record
app.delete('/api/attendance/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM attendance WHERE id = ?';
    
    pool.query(sql, [id], (err, result) => {
        if (err) {
            console.error('❌ Database delete error:', err);
            return res.status(500).json({ error: 'Failed to delete record' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }
        
        res.json({ message: 'Record deleted successfully' });
    });
});

// Database health check
app.get('/health', (req, res) => {
    pool.query('SELECT 1', (err) => {
        if (err) {
            res.status(500).json({ 
                status: 'ERROR', 
                database: 'Disconnected',
                error: err.message 
            });
        } else {
            res.json({ 
                status: 'OK', 
                database: 'Connected',
                timestamp: new Date().toISOString()
            });
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Using connection pooling for database`);
});