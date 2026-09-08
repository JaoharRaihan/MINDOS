import request from 'supertest';
import { createApp } from '../src/app';

describe('GET /api/health', () => {
  const app = createApp();

  it('should return 200 OK and healthy status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('MindOS API Gateway');
    expect(res.body).toHaveProperty('database');
    expect(res.body).toHaveProperty('timestamp');
  });
});
