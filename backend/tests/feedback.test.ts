import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app';
import { User } from '../src/models/User';
import { Intervention } from '../src/models/Intervention';
import { InterventionSession } from '../src/models/InterventionSession';
import { InterventionFeedback } from '../src/models/InterventionFeedback';

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
  await InterventionFeedback.deleteMany({});
});

describe('Did It Help? Post-Intervention Feedback Endpoints', () => {
  const testUser = {
    email: 'feedback_user@mindos.me',
    password: 'Password123!',
    name: 'Farhan Kabir',
    preferredName: 'Farhan',
  };

  const getAuthToken = async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    return res.body.tokens.accessToken;
  };

  describe('POST /api/feedback', () => {
    it('should reject unauthenticated feedback with 401', async () => {
      const res = await request(app).post('/api/feedback').send({
        sessionId: new mongoose.Types.ObjectId().toString(),
        rating: 'somewhat',
      });
      expect(res.status).toBe(401);
    });

    it('should record post-intervention feedback and map rating score accurately', async () => {
      const token = await getAuthToken();

      // 1. Seed interventions
      const catalogRes = await request(app)
        .get('/api/interventions')
        .set('Authorization', `Bearer ${token}`);

      const intervention = catalogRes.body.interventions[0];

      // 2. Start session
      const startRes = await request(app)
        .post('/api/interventions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ interventionId: intervention._id });

      const sessionId = startRes.body.session._id;

      // 3. Complete session
      await request(app)
        .post('/api/interventions/complete')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sessionId,
          completedSteps: intervention.steps.length,
          durationSpentSeconds: 120,
        });

      // 4. Submit feedback
      const feedbackRes = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sessionId,
          rating: 'a_lot',
          perceivedShifts: ['calmer', 'clearer_head'],
          notes: 'Really helped me unclench my shoulders and breathe.',
        });

      expect(feedbackRes.status).toBe(201);
      expect(feedbackRes.body.success).toBe(true);
      expect(feedbackRes.body.feedback.rating).toBe('a_lot');
      expect(feedbackRes.body.feedback.ratingScore).toBe(4);
      expect(feedbackRes.body.feedback.perceivedShifts).toContain('calmer');
      expect(feedbackRes.body.feedback.perceivedShifts).toContain('clearer_head');
    });
  });

  describe('GET /api/feedback/summary', () => {
    it('should aggregate user feedback into helpful interventions and common shifts', async () => {
      const token = await getAuthToken();

      // Seed catalog
      const catalogRes = await request(app)
        .get('/api/interventions')
        .set('Authorization', `Bearer ${token}`);

      const breathing = catalogRes.body.interventions.find(
        (i: any) => i.slug === 'box-breathing'
      );
      const grounding = catalogRes.body.interventions.find(
        (i: any) => i.slug === 'grounding-54321'
      );

      // Session 1: Breathing -> 'a_lot' (4)
      const s1 = await request(app)
        .post('/api/interventions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ interventionId: breathing._id });

      await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sessionId: s1.body.session._id,
          rating: 'a_lot',
          perceivedShifts: ['calmer', 'less_anxious'],
        });

      // Session 2: Grounding -> 'somewhat' (3)
      const s2 = await request(app)
        .post('/api/interventions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ interventionId: grounding._id });

      await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sessionId: s2.body.session._id,
          rating: 'somewhat',
          perceivedShifts: ['calmer', 'clearer_head'],
        });

      // Fetch summary
      const summaryRes = await request(app)
        .get('/api/feedback/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(summaryRes.status).toBe(200);
      expect(summaryRes.body.success).toBe(true);
      expect(summaryRes.body.summary.totalFeedbackCount).toBe(2);
      expect(summaryRes.body.summary.averageRating).toBe(3.5); // (4+3)/2 = 3.5

      // Check common shifts aggregation
      const shifts = summaryRes.body.summary.commonShifts;
      const calmerShift = shifts.find((s: any) => s.shift === 'calmer');
      expect(calmerShift).toBeDefined();
      expect(calmerShift.count).toBe(2); // present in both feedbacks

      // Check top helpful interventions
      const top = summaryRes.body.summary.topHelpfulInterventions;
      expect(top.length).toBe(2);
      expect(top[0].interventionSlug).toBe('box-breathing');
      expect(top[0].averageScore).toBe(4);
    });
  });
});
