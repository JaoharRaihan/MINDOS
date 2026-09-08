import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app';
import { User } from '../src/models/User';
import { Checkin } from '../src/models/Checkin';
import { TriageLog } from '../src/models/TriageLog';
import { InterventionSession } from '../src/models/InterventionSession';
import { InterventionFeedback } from '../src/models/InterventionFeedback';
import { Intervention } from '../src/models/Intervention';
import { SupportProfile } from '../src/models/SupportProfile';
import { analyzeUserPatterns } from '../src/services/patternService';

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
  await TriageLog.deleteMany({});
  await InterventionSession.deleteMany({});
  await InterventionFeedback.deleteMany({});
  await Intervention.deleteMany({});
  await SupportProfile.deleteMany({});
});

describe('Phase 11: Pattern Recognition Engine & Personal Playbooks', () => {
  const registerUser = async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'pattern_user@mindos.me',
      password: 'Password123!',
      name: 'Tahmid Rahman',
      preferredName: 'Tahmid',
    });
    return { token: res.body.tokens.accessToken, user: res.body.user };
  };

  it('calculates sleep and energy correlation accurately', async () => {
    const { user } = await registerUser();
    const userId = user.id || user._id;

    // 2 baseline checkins with high energy (4 and 4)
    await Checkin.create([
      {
        userId,
        mood: 'great',
        energyLevel: 4,
        tags: ['productive', 'exercise'],
        date: '2026-09-01',
      },
      {
        userId,
        mood: 'neutral',
        energyLevel: 4,
        tags: ['routine'],
        date: '2026-09-02',
      },
    ]);

    // 2 checkins with sleep fatigue (energy 2 and 1)
    await Checkin.create([
      {
        userId,
        mood: 'exhausted',
        energyLevel: 2,
        tags: ['sleep', 'insomnia'],
        date: '2026-09-03',
      },
      {
        userId,
        mood: 'down',
        energyLevel: 1,
        tags: ['sleep', 'fatigue'],
        date: '2026-09-04',
      },
    ]);

    const result = await analyzeUserPatterns(userId);

    expect(result.sleepEnergy.hasSufficientData).toBe(true);
    expect(result.sleepEnergy.averageEnergyBaseline).toBe(4);
    expect(result.sleepEnergy.averageEnergyWithSleepIssue).toBe(1.5);
    expect(result.sleepEnergy.difference).toBe(-2.5);
    expect(result.sleepEnergy.observation).toContain('shorter sleep nights');
  });

  it('identifies overwhelm and stress context triggers', async () => {
    const { user } = await registerUser();
    const userId = user.id || user._id;

    await Checkin.create([
      {
        userId,
        mood: 'overwhelmed',
        energyLevel: 2,
        tags: ['study', 'exams'],
        date: '2026-09-05',
      },
      {
        userId,
        mood: 'overwhelmed',
        energyLevel: 2,
        tags: ['study', 'deadlines'],
        date: '2026-09-06',
      },
      {
        userId,
        mood: 'exhausted',
        energyLevel: 1,
        tags: ['study'],
        date: '2026-09-07',
      },
      {
        userId,
        mood: 'great',
        energyLevel: 5,
        tags: ['weekend'],
        date: '2026-09-08',
      },
    ]);

    const result = await analyzeUserPatterns(userId);

    expect(result.overwhelmContext.totalOverwhelmOrExhaustionCheckins).toBe(3);
    expect(result.overwhelmContext.topTriggers[0].tag).toBe('study');
    expect(result.overwhelmContext.topTriggers[0].percentage).toBe(100);
    expect(result.overwhelmContext.observation).toContain('100% of your high-stress check-ins coincided with study');
  });

  it('identifies time-of-day fatigue vulnerabilities and generates playbooks', async () => {
    const { user } = await registerUser();
    const userId = user.id || user._id;

    // Evening triage logs
    const eveningDate = new Date();
    eveningDate.setHours(19, 30, 0); // 7:30 PM

    await TriageLog.create([
      { userId, trigger: 'overwhelmed', createdAt: eveningDate },
      { userId, trigger: 'cant_focus', createdAt: eveningDate },
    ]);

    const result = await analyzeUserPatterns(userId);

    expect(result.timeOfDayRhythms.peakPeriod).toBe('evening');
    expect(result.timeOfDayRhythms.periodCounts.evening).toBe(2);
    expect(result.playbooks.length).toBe(3);

    const overwhelmPlaybook = result.playbooks.find((p) => p.id === 'overwhelmed');
    expect(overwhelmPlaybook).toBeDefined();
    expect(overwhelmPlaybook?.steps.length).toBeGreaterThan(0);
    expect(overwhelmPlaybook?.recommendedInterventionSlug).toBeDefined();

    const cantStartPlaybook = result.playbooks.find((p) => p.id === 'cant_start');
    expect(cantStartPlaybook).toBeDefined();
    expect(cantStartPlaybook?.recommendedInterventionSlug).toBe('five-minute-start');

    expect(result.disclaimer).toContain('clinical diagnoses');
  });

  describe('Integration Endpoints', () => {
    it('rejects unauthenticated requests to /api/patterns with 401', async () => {
      const res = await request(app).get('/api/patterns');
      expect(res.status).toBe(401);
    });

    it('GET /api/patterns returns 200 and complete pattern insights', async () => {
      const { token } = await registerUser();

      const res = await request(app)
        .get('/api/patterns')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.patterns).toHaveProperty('sleepEnergy');
      expect(res.body.patterns).toHaveProperty('overwhelmContext');
      expect(res.body.patterns).toHaveProperty('timeOfDayRhythms');
      expect(res.body.patterns).toHaveProperty('helpfulStrategies');
      expect(res.body.patterns).toHaveProperty('playbooks');
      expect(res.body.patterns).toHaveProperty('disclaimer');
    });

    it('GET /api/patterns/playbooks returns 200 and user playbooks', async () => {
      const { token } = await registerUser();

      const res = await request(app)
        .get('/api/patterns/playbooks')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(3);
      expect(res.body.playbooks[0]).toHaveProperty('id');
      expect(res.body.playbooks[0]).toHaveProperty('title');
      expect(res.body.playbooks[0]).toHaveProperty('steps');
    });
  });
});
