# To-Do CRUD API with SQLite

A simple REST API for managing to-do items, built with Express.js and SQLite3.

## Features

- Create, Read, Update, and Delete to-do items
- RESTful API design
- SQLite database backend
- CORS enabled for cross-origin requests
- Lightweight and easy to use

## Prerequisites

- Node.js (v12 or higher)
- npm

## Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd ltsqj-crud_todo_sqlite

# Install dependencies
npm install
```

## Usage

Start the server:

```bash
node index.js
```

The server will start on `http://localhost:3000` by default.

To use a custom port:

```bash
PORT=8080 node index.js
```

## API Endpoints

### Create a To-Do Item

```
POST /todos
Content-Type: application/json

{
  "title": "Buy groceries"
}

Response: 201 Created
{
  "id": 1,
  "title": "Buy groceries",
  "completed": 0
}
```

### Get All To-Do Items

```
GET /todos

Response: 200 OK
[
  {
    "id": 1,
    "title": "Buy groceries",
    "completed": 0
  },
  {
    "id": 2,
    "title": "Walk the dog",
    "completed": 1
  }
]
```

### Get a Specific To-Do Item

```
GET /todos/:id

Response: 200 OK
{
  "id": 1,
  "title": "Buy groceries",
  "completed": 0
}
```

### Update a To-Do Item

```
PUT /todos/:id
Content-Type: application/json

{
  "title": "Buy groceries and milk",
  "completed": 1
}

Response: 200 OK
{
  "id": 1,
  "title": "Buy groceries and milk",
  "completed": 1
}
```

### Delete a To-Do Item

```
DELETE /todos/:id

Response: 204 No Content
```

## Database

The application uses an in-memory SQLite database, which means:
- Data is stored only while the server is running
- All data is lost when the server restarts
- No persistent storage is required
- Perfect for testing and development

### Database Schema

```sql
CREATE TABLE todo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT 0
)
```

## Testing the API

You can test the API using curl:

```bash
# Create a to-do
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Test task"}'

# Get all to-dos
curl http://localhost:3000/todos

# Get a specific to-do
curl http://localhost:3000/todos/1

# Update a to-do
curl -X PUT http://localhost:3000/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated task", "completed": 1}'

# Delete a to-do
curl -X DELETE http://localhost:3000/todos/1
```

Or use tools like Postman, Insomnia, or your browser's developer console.

## Project Structure

```
.
├── index.js          # Main application file with Express server and API routes
├── database.js       # Alternative database setup (not currently used)
├── package.json      # Project dependencies and metadata
└── README.md         # This file
```

## Dependencies

- **express** (^5.1.0): Web framework for Node.js
- **sqlite3** (^5.1.7): SQLite database driver
- **cors** (^2.8.5): CORS middleware for Express

## License

ISC
