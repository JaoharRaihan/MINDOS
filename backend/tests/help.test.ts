import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app';
import { User } from '../src/models/User';
import { TriageLog } from '../src/models/TriageLog';

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
  await TriageLog.deleteMany({});
});

describe('Help Me Now & Acute Triage Endpoints', () => {
  const testUser = {
    email: 'help_user@mindos.me',
    password: 'Password123!',
    name: 'Tamim Hossain',
    preferredName: 'Tamim',
  };

  const getAuthToken = async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    return res.body.tokens.accessToken;
  };

  describe('POST /api/help/triage', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app)
        .post('/api/help/triage')
        .send({ trigger: 'anxious' });
      expect(res.status).toBe(401);
    });

    it('should provide targeted acute options for anxious trigger', async () => {
      const token = await getAuthToken();

      const res = await request(app)
        .post('/api/help/triage')
        .set('Authorization', `Bearer ${token}`)
        .send({ trigger: 'anxious' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.trigger).toBe('anxious');
      expect(res.body.logId).toBeDefined();
      expect(res.body.triage.headline).toContain("I'm here");
      expect(res.body.triage.options.length).toBeGreaterThanOrEqual(4);

      const optionIds = res.body.triage.options.map((o: any) => o.id);
      expect(optionIds).toContain('calm');
      expect(optionIds).toContain('talk');
      expect(optionIds).toContain('journal');
      expect(optionIds).toContain('human_support');

      // Check log was recorded in DB
      const log = await TriageLog.findById(res.body.logId);
      expect(log).toBeDefined();
      expect(log?.trigger).toBe('anxious');
    });

    it('should provide targeted options for racing thoughts and cant focus', async () => {
      const token = await getAuthToken();

      const resRacing = await request(app)
        .post('/api/help/triage')
        .set('Authorization', `Bearer ${token}`)
        .send({ trigger: 'racing_thoughts' });

      expect(resRacing.status).toBe(200);
      expect(resRacing.body.triage.headline).toContain('carrying too much');

      const resFocus = await request(app)
        .post('/api/help/triage')
        .set('Authorization', `Bearer ${token}`)
        .send({ trigger: 'cant_focus' });

      expect(resFocus.status).toBe(200);
      const focusOptionIds = resFocus.body.triage.options.map((o: any) => o.id);
      expect(focusOptionIds).toContain('focus');
    });
  });

  describe('GET /api/help/resources', () => {
    it('should return verified Bangladesh mental health and emergency hotlines', async () => {
      const token = await getAuthToken();

      const res = await request(app)
        .get('/api/help/resources')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.resources.length).toBeGreaterThanOrEqual(3);

      const bdResources = res.body.resources.filter((r: any) => r.country === 'Bangladesh');
      expect(bdResources.some((r: any) => r.phone === '+8801779554391')).toBe(true); // Kaan Pete Roi
      expect(bdResources.some((r: any) => r.phone === '999')).toBe(true); // Emergency
    });
  });

  describe('POST /api/help/log-action', () => {
    it('should update existing triage log with chosen action', async () => {
      const token = await getAuthToken();

      const triageRes = await request(app)
        .post('/api/help/triage')
        .set('Authorization', `Bearer ${token}`)
        .send({ trigger: 'overwhelmed' });

      const logId = triageRes.body.logId;

      const actionRes = await request(app)
        .post('/api/help/log-action')
        .set('Authorization', `Bearer ${token}`)
        .send({ logId, chosenAction: 'calm' });

      expect(actionRes.status).toBe(200);
      expect(actionRes.body.success).toBe(true);

      const updated = await TriageLog.findById(logId);
      expect(updated?.chosenAction).toBe('calm');
    });
  });
});
