import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app';
import { User } from '../src/models/User';
import { Intervention } from '../src/models/Intervention';
import { InterventionSession } from '../src/models/InterventionSession';
import { InterventionFeedback } from '../src/models/InterventionFeedback';
import { SupportProfile } from '../src/models/SupportProfile';
import { Checkin } from '../src/models/Checkin';
import { rankInterventions, getPersonalizedNextStep } from '../src/services/rankingService';

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
  await SupportProfile.deleteMany({});
  await Checkin.deleteMany({});
});

describe('Phase 10: Personalization Ranking Engine', () => {
  const seedInterventions = async () => {
    return await Intervention.insertMany([
      {
        slug: 'five-minute-start',
        title: '5-Minute Micro-Start',
        category: 'focus',
        shortDescription: 'Do only 5 minutes on the hardest task.',
        durationSeconds: 300,
        suitableForTriggers: ['overwhelmed', 'study', 'work', 'burnout'],
        tags: ['focus', 'action', 'study', 'work'],
        steps: [{ stepNumber: 1, title: 'Pick one micro-step', instruction: 'Start now.', durationSeconds: 300 }],
        order: 1,
        isActive: true,
      },
      {
        slug: 'box-breathing',
        title: '4x4 Box Breathing',
        category: 'calm',
        shortDescription: 'Regulate your nervous system with equal 4-count breathing.',
        durationSeconds: 120,
        suitableForTriggers: ['overwhelmed', 'down', 'exam_stress'],
        tags: ['breathing', 'calm', 'nervous_system'],
        steps: [{ stepNumber: 1, title: 'Inhale', instruction: 'Inhale for 4 seconds.', durationSeconds: 120 }],
        order: 2,
        isActive: true,
      },
      {
        slug: 'wind-down-478',
        title: '4-7-8 Wind Down',
        category: 'rest',
        shortDescription: 'Gentle parasympathetic activation to ease into restorative sleep.',
        durationSeconds: 180,
        suitableForTriggers: ['exhausted', 'night_overthinking', 'racing_thoughts'],
        tags: ['sleep', 'rest', 'evening'],
        steps: [{ stepNumber: 1, title: 'Breathe', instruction: 'Rest.', durationSeconds: 180 }],
        order: 3,
        isActive: true,
      },
    ]);
  };

  it('ranks interventions and boosts an intervention with high user historical feedback', async () => {
    const user = await User.create({
      email: 'ranking_user@mindos.me',
      passwordHash: 'dummyhash',
      name: 'Tanvir Ahmed',
    });

    const [focusIntervention, calmIntervention] = await seedInterventions();

    // Prior to feedback, both have neutral prior
    const initialRankings = await rankInterventions(user._id.toString(), {
      mood: 'overwhelmed',
      timeOfDay: 'morning',
    });

    expect(initialRankings.length).toBe(3);

    // Give 4/4 "a_lot" rating to box-breathing with shift 'calmer'
    const session = await InterventionSession.create({
      userId: user._id,
      interventionId: calmIntervention._id,
      interventionSlug: calmIntervention.slug,
      startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      status: 'completed',
      completedSteps: 1,
      totalSteps: 1,
      durationSpentSeconds: 120,
    });

    await InterventionFeedback.create({
      userId: user._id,
      sessionId: session._id,
      interventionId: calmIntervention._id,
      interventionSlug: calmIntervention.slug,
      rating: 'a_lot',
      ratingScore: 4,
      perceivedShifts: ['calmer', 'clearer_head'],
    });

    const updatedRankings = await rankInterventions(user._id.toString(), {
      mood: 'overwhelmed',
      timeOfDay: 'afternoon',
    });

    const topRanked = updatedRankings[0];
    expect(topRanked.intervention.slug).toBe('box-breathing');
    expect(topRanked.components.userHistoricalScore).toBe(1.0);
    expect(topRanked.reasoning).toContain('Ranked #1 based on your feedback: you previously rated this 4.0/4');
    expect(topRanked.reasoning).toContain('calmer');
  });

  it('applies time-of-day fit favoring rest at night and focus in the morning', async () => {
    const user = await User.create({
      email: 'time_user@mindos.me',
      passwordHash: 'dummyhash',
      name: 'Nusrat Jahan',
    });

    await seedInterventions();

    const nightRankings = await rankInterventions(user._id.toString(), {
      timeOfDay: 'night',
    });
    const restItemNight = nightRankings.find((r) => r.intervention.category === 'rest');
    const focusItemNight = nightRankings.find((r) => r.intervention.category === 'focus');
    expect(restItemNight?.components.timeOfDayFit).toBe(1.0);
    expect(focusItemNight?.components.timeOfDayFit).toBe(0.2);

    const morningRankings = await rankInterventions(user._id.toString(), {
      timeOfDay: 'morning',
    });
    const restItemMorning = morningRankings.find((r) => r.intervention.category === 'rest');
    const focusItemMorning = morningRankings.find((r) => r.intervention.category === 'focus');
    expect(focusItemMorning?.components.timeOfDayFit).toBe(0.95);
    expect(restItemMorning?.components.timeOfDayFit).toBe(0.3);
  });

  it('applies recency penalty (-0.25) when an intervention was used within the last 2 hours', async () => {
    const user = await User.create({
      email: 'recency_user@mindos.me',
      passwordHash: 'dummyhash',
      name: 'Samiul Islam',
    });

    const [focusIntervention] = await seedInterventions();

    // Create session started 15 minutes ago
    await InterventionSession.create({
      userId: user._id,
      interventionId: focusIntervention._id,
      interventionSlug: focusIntervention.slug,
      startedAt: new Date(Date.now() - 15 * 60 * 1000),
      status: 'completed',
      completedSteps: 1,
      totalSteps: 1,
      durationSpentSeconds: 300,
    });

    const rankings = await rankInterventions(user._id.toString(), {
      timeOfDay: 'morning',
    });

    const recentItem = rankings.find((r) => r.intervention.slug === 'five-minute-start');
    expect(recentItem?.components.recencyPenalty).toBe(-0.25);
    expect(recentItem?.reasoning).toContain('(Suggested recently)');
  });

  it('generates personalized next step with intervention details and reasoning', async () => {
    const user = await User.create({
      email: 'step_user@mindos.me',
      passwordHash: 'dummyhash',
      name: 'Sadia Rahman',
    });

    await seedInterventions();

    const checkin = new Checkin({
      userId: user._id,
      mood: 'overwhelmed',
      tags: ['study'],
      date: '2026-09-08',
    });

    const nextStep = await getPersonalizedNextStep(user._id.toString(), checkin);

    expect(nextStep.title).toBeDefined();
    expect(nextStep.actionLabel).toBeDefined();
    expect(nextStep.interventionSlug).toBeDefined();
    expect(nextStep.personalizationReasoning).toBeDefined();
  });

  describe('Integration Endpoints', () => {
    const registerUser = async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'api_rank_user@mindos.me',
        password: 'Password123!',
        name: 'Kazi Nazrul',
      });
      return res.body.tokens.accessToken;
    };

    it('GET /api/interventions/recommended returns ranked interventions with scoring breakdown', async () => {
      const token = await registerUser();
      await seedInterventions();

      const res = await request(app)
        .get('/api/interventions/recommended?mood=overwhelmed&timeOfDay=evening')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(3);
      expect(res.body.recommendations[0]).toHaveProperty('totalScore');
      expect(res.body.recommendations[0]).toHaveProperty('components');
      expect(res.body.recommendations[0].components).toHaveProperty('contextFit');
      expect(res.body.recommendations[0].components).toHaveProperty('userHistoricalScore');
      expect(res.body.recommendations[0].components).toHaveProperty('timeOfDayFit');
      expect(res.body.recommendations[0].components).toHaveProperty('recencyPenalty');
      expect(res.body.recommendations[0]).toHaveProperty('reasoning');
    });

    it('POST /api/checkin returns personalized next step powered by ranking engine', async () => {
      const token = await registerUser();
      await seedInterventions();

      const res = await request(app)
        .post('/api/checkin')
        .set('Authorization', `Bearer ${token}`)
        .send({
          mood: 'overwhelmed',
          tags: ['study'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.nextStep).toBeDefined();
      expect(res.body.nextStep.interventionSlug).toBeDefined();
      expect(res.body.nextStep.personalizationReasoning).toBeDefined();
    });
  });
});
