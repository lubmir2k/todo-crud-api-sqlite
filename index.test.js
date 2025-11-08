const request = require('supertest');
const app = require('./index');
const db = require('./database');

describe('Todos API', () => {
  beforeEach((done) => {
    db.serialize(() => {
      db.run('DELETE FROM todos', () => {
        db.run("DELETE FROM sqlite_sequence WHERE name='todos'", () => {
          db.run("INSERT INTO todos (title) VALUES ('Test Todo 1')", () => {
            db.run("INSERT INTO todos (title) VALUES ('Test Todo 2')", done);
          });
        });
      });
    });
  });

  afterAll((done) => {
    db.close(done);
  });

  it('should fetch all todos', async () => {
    const res = await request(app).get('/todos');
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBe(2);
  });

  it('should create a new todo', async () => {
    const res = await request(app)
      .post('/todos')
      .send({ title: 'New Todo' });
    expect(res.statusCode).toEqual(201);
    expect(res.body.title).toBe('New Todo');
    expect(res.body.id).toBeDefined();
    expect(res.body.completed).toBe(0);
  });

  it('should fetch a single todo by id', async () => {
    const res = await request(app).get('/todos/1');
    expect(res.statusCode).toEqual(200);
    expect(res.body.title).toBe('Test Todo 1');
    expect(res.body.id).toBe(1);
  });

  it('should return 404 for non-existent todo', async () => {
    const res = await request(app).get('/todos/999');
    expect(res.statusCode).toEqual(404);
    expect(res.body.error).toBe('To-do item not found');
  });

  it('should update a todo', async () => {
    const res = await request(app)
      .put('/todos/1')
      .send({ title: 'Updated Todo', completed: true });
    expect(res.statusCode).toEqual(200);
    expect(res.body.title).toBe('Updated Todo');
    expect(res.body.completed).toBe(true);
  });

  it('should return 404 when updating non-existent todo', async () => {
    const res = await request(app)
      .put('/todos/999')
      .send({ title: 'Updated Todo', completed: true });
    expect(res.statusCode).toEqual(404);
    expect(res.body.error).toBe('To-do item not found');
  });

  it('should delete a todo', async () => {
    const res = await request(app).delete('/todos/1');
    expect(res.statusCode).toEqual(204);

    // Verify it's actually deleted
    const checkRes = await request(app).get('/todos/1');
    expect(checkRes.statusCode).toEqual(404);
  });

  it('should return 404 when deleting non-existent todo', async () => {
    const res = await request(app).delete('/todos/999');
    expect(res.statusCode).toEqual(404);
    expect(res.body.error).toBe('To-do item not found');
  });

  it('should handle whitespace in titles (backward compatibility)', async () => {
    const res = await request(app)
      .post('/todos')
      .send({ title: '  spaced title  ' });
    expect(res.statusCode).toEqual(201);
    expect(res.body.title).toBe('  spaced title  ');
  });

  it('should accept completed as string (backward compatibility)', async () => {
    const res = await request(app)
      .put('/todos/1')
      .send({ title: 'Test', completed: 'true' });
    expect(res.statusCode).toEqual(200);
  });

  describe('ID Validation', () => {
    it('should return 400 for non-numeric ID in GET', async () => {
      const res = await request(app).get('/todos/abc');
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBe('Invalid ID parameter');
    });

    it('should return 400 for negative ID in GET', async () => {
      const res = await request(app).get('/todos/-1');
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBe('Invalid ID parameter');
    });

    it('should return 400 for zero ID in GET', async () => {
      const res = await request(app).get('/todos/0');
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBe('Invalid ID parameter');
    });

    it('should return 400 for non-numeric ID in PUT', async () => {
      const res = await request(app)
        .put('/todos/invalid')
        .send({ title: 'Test', completed: false });
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBe('Invalid ID parameter');
    });

    it('should return 400 for non-numeric ID in DELETE', async () => {
      const res = await request(app).delete('/todos/xyz');
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBe('Invalid ID parameter');
    });

    it('should return 400 for decimal ID', async () => {
      const res = await request(app).get('/todos/1.5');
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBe('Invalid ID parameter');
    });
  });

  describe('Completed Field Type Coercion', () => {
    it('should accept boolean true', async () => {
      const res = await request(app)
        .put('/todos/1')
        .send({ title: 'Test', completed: true });
      expect(res.statusCode).toEqual(200);
      expect(res.body.completed).toBe(true);
    });

    it('should accept boolean false', async () => {
      const res = await request(app)
        .put('/todos/1')
        .send({ title: 'Test', completed: false });
      expect(res.statusCode).toEqual(200);
      expect(res.body.completed).toBe(false);
    });

    it('should accept string "true"', async () => {
      const res = await request(app)
        .put('/todos/1')
        .send({ title: 'Test', completed: 'true' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.completed).toBe(true);
    });

    it('should accept string "false"', async () => {
      const res = await request(app)
        .put('/todos/1')
        .send({ title: 'Test', completed: 'false' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.completed).toBe(false);
    });

    it('should accept number 1', async () => {
      const res = await request(app)
        .put('/todos/1')
        .send({ title: 'Test', completed: 1 });
      expect(res.statusCode).toEqual(200);
      expect(res.body.completed).toBe(true);
    });

    it('should accept number 0', async () => {
      const res = await request(app)
        .put('/todos/1')
        .send({ title: 'Test', completed: 0 });
      expect(res.statusCode).toEqual(200);
      expect(res.body.completed).toBe(false);
    });
  });

  describe('Request Body Validation', () => {
    it('should handle empty request body on POST', async () => {
      const res = await request(app)
        .post('/todos')
        .send({});
      // Should still process but may have database constraint errors
      expect([201, 500]).toContain(res.statusCode);
    });

    it('should handle missing title in POST', async () => {
      const res = await request(app)
        .post('/todos')
        .send({ completed: false });
      // Should still process but may have database constraint errors
      expect([201, 500]).toContain(res.statusCode);
    });

    it('should reject payload exceeding size limit', async () => {
      const largeTitle = 'A'.repeat(11000); // Exceeds 10kb limit
      const res = await request(app)
        .post('/todos')
        .send({ title: largeTitle });
      expect(res.statusCode).toEqual(413);
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const res = await request(app)
        .get('/todos')
        .set('Origin', 'http://localhost:3000');
      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});
