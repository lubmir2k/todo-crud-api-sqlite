const express = require('express');
const cors = require('cors');
const db = require('./database');

// Initialize the Express app and middleware
const app = express();
app.use(express.json({ limit: '10kb' })); // for parsing application/json with size limit
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000'
})); // enable CORS with origin restriction

// Middleware to validate ID parameter
const validateId = (req, res, next) => {
  const idParam = req.params.id;
  const id = parseInt(idParam, 10);
  // Check if it's a valid positive integer AND the string representation matches (no decimals, no extra chars)
  if (isNaN(id) || id < 1 || String(id) !== idParam) {
    return res.status(400).json({ error: 'Invalid ID parameter' });
  }
  req.validatedId = id;
  next();
};

// Helper to convert various formats to boolean
const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1) return true;
  if (value === 'false' || value === 0) return false;
  return value; // Return as-is if not recognized format
};

// API Endpoints

// Create a new to-do item
app.post('/todos', (req, res) => {
  const { title } = req.body;
  db.run('INSERT INTO todos (title) VALUES (?)', [title], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, title, completed: 0 });
  });
});

// Read all to-do items
app.get('/todos', (req, res) => {
  db.all('SELECT * FROM todos', [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Read a specific to-do item by ID
app.get('/todos/:id', validateId, (req, res) => {
  const id = req.validatedId;
  db.get('SELECT * FROM todos WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'To-do item not found' });
    }
    res.json(row);
  });
});

// Update a to-do item by ID
app.put('/todos/:id', validateId, (req, res) => {
  const id = req.validatedId;
  const { title, completed } = req.body;
  const completedBool = toBoolean(completed);
  db.run(
    'UPDATE todos SET title = ?, completed = ? WHERE id = ?',
    [title, completedBool, id],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'To-do item not found' });
      }
      res.json({ id, title, completed: completedBool });
    }
  );
});

// Delete a to-do item by ID
app.delete('/todos/:id', validateId, (req, res) => {
  const id = req.validatedId;
  db.run('DELETE FROM todos WHERE id = ?', [id], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'To-do item not found' });
    }
    res.status(204).end();
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
