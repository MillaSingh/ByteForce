const request = require('supertest');
const app = require('../server'); // path to your server.js

describe('Walk-in Patient Queue API', () => {

  // UAT 1: Add walk-in patient
  test('should add a walk-in patient and return data', async () => {
    const response = await request(app)
      .post('/api/queue/add-walkin')
      .send({
        first_name: 'Test',
        last_name: 'User',
        email: `test${Date.now()}@mail.com`, // unique email
        clinic_id: 1
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('queue_id');
  });

  //  UAT 2: Default status + position
  test('should assign queue position automatically', async () => {
    const response = await request(app)
      .post('/api/queue/add-walkin')
      .send({
        first_name: 'Queue',
        last_name: 'Test',
        email: `queue${Date.now()}@mail.com`,
        clinic_id: 1
      });

    expect(response.body.queue_position).toBeDefined();
    expect(response.body.queue_position).toBeGreaterThan(0);
  });

  // UAT 3 & 4: Queue updates
  test('should return updated queue list', async () => {
    const response = await request(app)
      .get('/api/queue');

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

});