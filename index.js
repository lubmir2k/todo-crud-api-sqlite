const express = require('express');
const cors = require('cors');
const db = require('./database');

// Initialize the Express app and middleware
const app = express();
app.use(express.json({ limit: '10kb' })); // for parsing application/json with size limit
// CORS configuration - allows all origins in development
app.use(cors());

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
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value;

  // Handle string and number representations
  const stringValue = String(value).toLowerCase().trim();
  if (stringValue === 'true' || stringValue === '1') return true;
  if (stringValue === 'false' || stringValue === '0') return false;

  return undefined; // Return undefined for unrecognized formats
};

// API Endpoints

// Create a new to-do item
app.post('/todos', (req, res) => {
  const { title } = req.body;

  // Validate title input
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'The "title" field is required and must be a non-empty string' });
  }

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

  // Build dynamic SQL for partial updates
  const fields = [];
  const params = [];

  if (title !== undefined) {
    fields.push('title = ?');
    params.push(title);
  }

  const completedBool = toBoolean(completed);
  if (completedBool !== undefined) {
    fields.push('completed = ?');
    params.push(completedBool);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update provided' });
  }

  params.push(id);
  const sql = `UPDATE todos SET ${fields.join(', ')} WHERE id = ?`;

  db.run(sql, params, function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'To-do item not found' });
    }

    // Fetch the updated todo to return complete data
    db.get('SELECT * FROM todos WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
      }
      res.json(row);
    });
  });
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
