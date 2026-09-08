import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app';
import { User } from '../src/models/User';
import { Checkin } from '../src/models/Checkin';
import { Journal } from '../src/models/Journal';
import { InterventionFeedback } from '../src/models/InterventionFeedback';
import { DailyProgress } from '../src/models/DailyProgress';
import { Intervention } from '../src/models/Intervention';

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
  await Journal.deleteMany({});
  await InterventionFeedback.deleteMany({});
  await DailyProgress.deleteMany({});
  await Intervention.deleteMany({});
});

describe('Phase 14: Offline Synchronization & Batch API', () => {
  const registerUser = async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'sync_user@mindos.me',
      password: 'Password123!',
      name: 'Nusrat Jahan',
    });
    return { token: res.body.tokens.accessToken, user: res.body.user };
  };

  it('rejects unauthenticated sync request with 401', async () => {
    const res = await request(app).post('/api/sync/batch').send({
      checkins: [],
    });
    expect(res.status).toBe(401);
  });

  it('GET /api/sync/status returns online status and server timestamp', async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .get('/api/sync/status')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('online');
    expect(res.body.serverTime).toBeDefined();
  });

  it('POST /api/sync/batch processes queued check-ins and updates DailyProgress', async () => {
    const { token } = await registerUser();

    const clientTimestamp = '2026-09-08T10:30:00.000Z';
    const res = await request(app)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${token}`)
      .send({
        checkins: [
          {
            mood: 'down',
            energyLevel: 2,
            tags: ['study', 'sleep'],
            note: 'Feeling drained after exam prep while offline',
            date: '2026-09-08',
            clientTimestamp,
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.synced.checkins).toBe(1);

    const checkin = await Checkin.findOne({ date: '2026-09-08' });
    expect(checkin).not.toBeNull();
    expect(checkin?.mood).toBe('down');
    expect(checkin?.note).toBe('Feeling drained after exam prep while offline');

    const progress = await DailyProgress.findOne({ date: '2026-09-08' });
    expect(progress?.checkinDone).toBe(true);
  });

  it('POST /api/sync/batch processes queued journal entries and generates AI reflections', async () => {
    const { token } = await registerUser();

    const clientTimestamp = '2026-09-07T22:15:00.000Z';
    const res = await request(app)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${token}`)
      .send({
        journalEntries: [
          {
            content: 'Aajke diner seshe khub bhalo lagche, finally finished my assignments.',
            type: 'text',
            tags: ['study', 'relief'],
            clientTimestamp,
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.synced.journalEntries).toBe(1);

    const journal = await Journal.findOne();
    expect(journal).not.toBeNull();
    expect(journal?.content).toContain('assignments');
    expect(journal?.aiReflection).toBeDefined();
    expect(journal?.aiReflection?.text).toBeDefined();
  });

  it('POST /api/sync/batch processes queued intervention feedback', async () => {
    const { token } = await registerUser();

    await Intervention.create({
      slug: 'box-breathing',
      title: 'Box Breathing (4-4-4-4)',
      shortDescription: 'Regulate nervous system with balanced 4-count breathing',
      category: 'calm',
      durationSeconds: 120,
      difficultyLevel: 'gentle',
      steps: [{ stepNumber: 1, title: 'Inhale', instruction: 'Breathe in for 4 counts', durationSeconds: 4 }],
      tags: ['calm', 'breathing'],
      suitableForTriggers: ['anxious', 'overwhelmed'],
      order: 1,
    });

    const res = await request(app)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${token}`)
      .send({
        feedbacks: [
          {
            interventionSlug: 'box-breathing',
            rating: 'a_lot',
            perceivedShifts: ['calmer', 'clearer_head'],
            notes: 'Did this on the train without internet, helped calm racing heart',
            clientTimestamp: new Date().toISOString(),
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.synced.feedbacks).toBe(1);

    const feedback = await InterventionFeedback.findOne({ interventionSlug: 'box-breathing' });
    expect(feedback).not.toBeNull();
    expect(feedback?.rating).toBe('a_lot');
    expect(feedback?.ratingScore).toBe(4);
    expect(feedback?.perceivedShifts).toContain('calmer');
  });

  it('handles multiple mixed items in a single atomic batch payload', async () => {
    const { token } = await registerUser();

    const res = await request(app)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${token}`)
      .send({
        checkins: [
          {
            mood: 'neutral',
            energyLevel: 3,
            tags: ['work'],
            date: '2026-09-08',
          },
        ],
        journalEntries: [
          {
            content: 'Quick thought recorded while in flight.',
            type: 'text',
          },
        ],
        feedbacks: [],
      });

    expect(res.status).toBe(200);
    expect(res.body.synced.checkins).toBe(1);
    expect(res.body.synced.journalEntries).toBe(1);
    expect(res.body.synced.feedbacks).toBe(0);
  });
});
