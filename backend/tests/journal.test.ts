import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app';
import { User } from '../src/models/User';
import { Journal } from '../src/models/Journal';
import { DailyProgress } from '../src/models/DailyProgress';

let mongoServer: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: {
      launchTimeout: 30000,
    },
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 35000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 35000);

beforeEach(async () => {
  await User.deleteMany({});
  await Journal.deleteMany({});
  await DailyProgress.deleteMany({});
});

describe('Private Journal & AI Reflection Endpoints', () => {
  const testUser = {
    email: 'journal_user@mindos.me',
    password: 'Password123!',
    name: 'Farhan Kabir',
  };

  const getAuthToken = async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    return res.body.tokens.accessToken;
  };

  describe('POST /api/journal', () => {
    it('should reject unauthenticated creation with 401', async () => {
      const res = await request(app).post('/api/journal').send({ content: 'Secret journal' });
      expect(res.status).toBe(401);
    });

    it('should create private entry with Banglish understanding and generated AI reflection', async () => {
      const token = await getAuthToken();
      const content = 'Ajke amar onek kharap lagtesilo. Kawke bolteo iccha kortesilo na.';

      const res = await request(app)
        .post('/api/journal')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content,
          type: 'text',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.entry.content).toBe(content);
      expect(res.body.entry.isPrivate).toBe(true);
      expect(res.body.entry.aiReflection).toBeDefined();
      expect(res.body.entry.aiReflection.text).toContain("didn't really want to talk to anyone");
      expect(res.body.entry.aiReflection.suggestedExploration).toContain('explore what made today feel difficult');

      // Verify today's evening reflection milestone is marked done
      const todayDate = new Date().toISOString().split('T')[0];
      const progress = await DailyProgress.findOne({ date: todayDate });
      expect(progress?.eveningReflectionDone).toBe(true);
    });

    it('should reject empty journal content with 400', async () => {
      const token = await getAuthToken();
      const res = await request(app)
        .post('/api/journal')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('GET /api/journal & GET /api/journal/:id', () => {
    it('should list entries and retrieve specific entry by ID', async () => {
      const token = await getAuthToken();

      const createRes = await request(app)
        .post('/api/journal')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'porte boshte partesi na, onk tension lagtese.' });

      const entryId = createRes.body.entry._id;

      // List
      const listRes = await request(app)
        .get('/api/journal')
        .set('Authorization', `Bearer ${token}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.entries.length).toBe(1);

      // Single
      const singleRes = await request(app)
        .get(`/api/journal/${entryId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(singleRes.status).toBe(200);
      expect(singleRes.body.entry._id).toBe(entryId);
    });
  });

  describe('DELETE /api/journal/:id', () => {
    it('should permanently delete an entry to preserve privacy', async () => {
      const token = await getAuthToken();

      const createRes = await request(app)
        .post('/api/journal')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Private note that user wants to permanently erase.' });

      const entryId = createRes.body.entry._id;

      const deleteRes = await request(app)
        .delete(`/api/journal/${entryId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      const fetchRes = await request(app)
        .get(`/api/journal/${entryId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(fetchRes.status).toBe(404);
    });
  });
});
