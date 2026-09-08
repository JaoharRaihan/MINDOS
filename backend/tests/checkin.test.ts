import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app';
import { User } from '../src/models/User';
import { Checkin } from '../src/models/Checkin';
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
  await Checkin.deleteMany({});
  await DailyProgress.deleteMany({});
});

describe('Check-in & Home Feed Endpoints', () => {
  const testUser = {
    email: 'checkin_user@mindos.me',
    password: 'Password123!',
    name: 'Sumaiya Akter',
    preferredName: 'Sumaiya',
  };

  const getAuthToken = async () => {
    const email = `checkin_${Date.now()}_${Math.random().toString(36).substring(7)}@mindos.me`;
    const res = await request(app).post('/api/auth/register').send({ ...testUser, email });
    return res.body.tokens.accessToken;
  };

  describe('POST /api/checkin', () => {
    it('should reject unauthenticated checkin with 401', async () => {
      const res = await request(app).post('/api/checkin').send({ mood: 'neutral' });
      expect(res.status).toBe(401);
    });

    it('should record checkin with mood and tags, producing relevant next step', async () => {
      const token = await getAuthToken();
      const res = await request(app)
        .post('/api/checkin')
        .set('Authorization', `Bearer ${token}`)
        .send({
          mood: 'overwhelmed',
          tags: ['study', 'exams'],
          note: 'bhai amar mathay onk kichu choltesey, porte boshte partesi na.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.checkin.mood).toBe('overwhelmed');
      expect(res.body.checkin.tags).toContain('study');
      expect(res.body.nextStep).toBeDefined();
      expect(res.body.nextStep.actionLabel).toBe('Start 5 min');
      expect(res.body.nextStep.actionType).toBe('task_breakdown');

      // Verify today's checklist has checkin marked done
      const todayDate = new Date().toISOString().split('T')[0];
      const progress = await DailyProgress.findOne({ date: todayDate });
      expect(progress?.checkinDone).toBe(true);
    });

    it('should reject invalid mood value with 400', async () => {
      const token = await getAuthToken();
      const res = await request(app)
        .post('/api/checkin')
        .set('Authorization', `Bearer ${token}`)
        .send({
          mood: 'not_a_valid_mood',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('GET /api/checkin/home-feed', () => {
    it('should deliver structured home feed answering "How am I doing?" and "What should I do next?"', async () => {
      const token = await getAuthToken();

      // First check in
      await request(app)
        .post('/api/checkin')
        .set('Authorization', `Bearer ${token}`)
        .send({
          mood: 'exhausted',
          tags: ['burnout'],
        });

      const feedRes = await request(app)
        .get('/api/checkin/home-feed')
        .set('Authorization', `Bearer ${token}`);

      expect(feedRes.status).toBe(200);
      expect(feedRes.body.success).toBe(true);
      expect(feedRes.body.greeting).toContain('Sumaiya');
      expect(feedRes.body.todayCheckin.mood).toBe('exhausted');
      expect(feedRes.body.nextStep.actionType).toBe('breathing');
      expect(feedRes.body.checklist.checkin).toBe(true);
      expect(feedRes.body.checklist.smallAction).toBe(false);
      expect(feedRes.body.quickNeeds.length).toBe(4);
    });
  });

  describe('POST /api/checkin/checklist/toggle', () => {
    it('should toggle smallAction checklist milestone', async () => {
      const token = await getAuthToken();

      const res = await request(app)
        .post('/api/checkin/checklist/toggle')
        .set('Authorization', `Bearer ${token}`)
        .send({
          item: 'smallAction',
          completed: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.checklist.smallAction).toBe(true);
    });
  });

  describe('GET /api/checkin/history', () => {
    it('should return recent checkin history array', async () => {
      const token = await getAuthToken();

      await request(app)
        .post('/api/checkin')
        .set('Authorization', `Bearer ${token}`)
        .send({ mood: 'neutral' });

      const historyRes = await request(app)
        .get('/api/checkin/history?days=7')
        .set('Authorization', `Bearer ${token}`);

      expect(historyRes.status).toBe(200);
      expect(historyRes.body.success).toBe(true);
      expect(Array.isArray(historyRes.body.history)).toBe(true);
      expect(historyRes.body.history.length).toBe(1);
    });
  });
});
