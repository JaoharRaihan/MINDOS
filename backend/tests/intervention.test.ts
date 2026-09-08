import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app';
import { User } from '../src/models/User';
import { Intervention } from '../src/models/Intervention';
import { InterventionSession } from '../src/models/InterventionSession';
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
  await Intervention.deleteMany({});
  await InterventionSession.deleteMany({});
  await DailyProgress.deleteMany({});
});

describe('Controlled Intervention Engine Endpoints', () => {
  const testUser = {
    email: 'intervention_user@mindos.me',
    password: 'Password123!',
    name: 'Nayeem Hasan',
    preferredName: 'Nayeem',
  };

  const getAuthToken = async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    return res.body.tokens.accessToken;
  };

  describe('GET /api/interventions', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/interventions');
      expect(res.status).toBe(401);
    });

    it('should auto-seed and return default curated interventions', async () => {
      const token = await getAuthToken();

      const res = await request(app)
        .get('/api/interventions')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(7);

      const slugs = res.body.interventions.map((i: any) => i.slug);
      expect(slugs).toContain('grounding-54321');
      expect(slugs).toContain('box-breathing');
      expect(slugs).toContain('five-minute-start');
      expect(slugs).toContain('wind-down-478');
      expect(slugs).toContain('physiological-sigh');
    });

    it('should filter interventions by category and trigger', async () => {
      const token = await getAuthToken();

      // Filter by category: focus
      const focusRes = await request(app)
        .get('/api/interventions?category=focus')
        .set('Authorization', `Bearer ${token}`);

      expect(focusRes.status).toBe(200);
      expect(focusRes.body.interventions.length).toBeGreaterThanOrEqual(1);
      expect(focusRes.body.interventions.every((i: any) => i.category === 'focus')).toBe(true);

      // Filter by trigger: cant_focus
      const triggerRes = await request(app)
        .get('/api/interventions?trigger=cant_focus')
        .set('Authorization', `Bearer ${token}`);

      expect(triggerRes.status).toBe(200);
      const hasFiveMinStart = triggerRes.body.interventions.some(
        (i: any) => i.slug === 'five-minute-start'
      );
      expect(hasFiveMinStart).toBe(true);
    });
  });

  describe('GET /api/interventions/:identifier', () => {
    it('should retrieve single intervention by slug with full guided steps', async () => {
      const token = await getAuthToken();

      // Seed catalog first
      await request(app)
        .get('/api/interventions')
        .set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .get('/api/interventions/grounding-54321')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.intervention.slug).toBe('grounding-54321');
      expect(res.body.intervention.steps.length).toBe(5);
      expect(res.body.intervention.steps[0].title).toBe('5 Things you can see');
    });
  });

  describe('Session Lifecycle: start, complete, abandon', () => {
    it('should start session, complete it, and automatically update DailyProgress checklist', async () => {
      const token = await getAuthToken();

      // 1. Get interventions to fetch ID
      const catalogRes = await request(app)
        .get('/api/interventions')
        .set('Authorization', `Bearer ${token}`);

      const grounding = catalogRes.body.interventions.find(
        (i: any) => i.slug === 'grounding-54321'
      );
      expect(grounding).toBeDefined();

      // 2. Start session
      const startRes = await request(app)
        .post('/api/interventions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({
          interventionId: grounding._id,
          contextTrigger: 'anxious',
        });

      expect(startRes.status).toBe(201);
      expect(startRes.body.success).toBe(true);
      expect(startRes.body.session.status).toBe('in_progress');
      expect(startRes.body.session.totalSteps).toBe(5);

      const sessionId = startRes.body.session._id;

      // 3. Complete session
      const completeRes = await request(app)
        .post('/api/interventions/complete')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sessionId,
          completedSteps: 5,
          durationSpentSeconds: 120,
        });

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.success).toBe(true);
      expect(completeRes.body.session.status).toBe('completed');
      expect(completeRes.body.session.completedAt).toBeDefined();

      // 4. Verify DailyProgress milestone was updated
      const today = new Date().toISOString().split('T')[0];
      const progress = await DailyProgress.findOne({ date: today });
      expect(progress?.smallActionDone).toBe(true);
    });

    it('should record an abandoned session gracefully if user exits early', async () => {
      const token = await getAuthToken();

      const catalogRes = await request(app)
        .get('/api/interventions')
        .set('Authorization', `Bearer ${token}`);

      const fiveMin = catalogRes.body.interventions.find(
        (i: any) => i.slug === 'five-minute-start'
      );

      const startRes = await request(app)
        .post('/api/interventions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ interventionId: fiveMin._id });

      const sessionId = startRes.body.session._id;

      const abandonRes = await request(app)
        .post('/api/interventions/abandon')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sessionId,
          completedSteps: 1,
          durationSpentSeconds: 45,
        });

      expect(abandonRes.status).toBe(200);
      expect(abandonRes.body.session.status).toBe('abandoned');
      expect(abandonRes.body.session.completedSteps).toBe(1);
    });
  });
});
