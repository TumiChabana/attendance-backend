require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Simple CORS - allow everything
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Connect to database
db.connect((err) => {
    if (err) {
        console.log('Database connection failed');
        console.log(err);
    } else {
        console.log('Connected to database');
    }
});

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Get all attendance records
app.get('/api/attendance', (req, res) => {
    const sql = 'SELECT * FROM attendance ORDER BY date DESC';
    
    db.query(sql, (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(results);
        }
    });
});

// Add new attendance record
app.post('/api/attendance', (req, res) => {
    const { employeeName, employeeID, date, status } = req.body;
    
    if (!employeeName || !employeeID || !date || !status) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    const sql = 'INSERT INTO attendance (employeeName, employeeID, date, status) VALUES (?, ?, ?, ?)';
    
    db.query(sql, [employeeName, employeeID, date, status], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ 
                message: 'Attendance recorded successfully',
                id: result.insertId 
            });
        }
    });
});

// Delete attendance record
app.delete('/api/attendance/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM attendance WHERE id = ?';
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Record not found' });
        } else {
            res.json({ message: 'Record deleted successfully' });
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});