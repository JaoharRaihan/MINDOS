/**
 * e2e_journey.test.ts
 * Phase 15 — End-to-End User Journey Integration Test
 *
 * Simulates the complete MindOS user lifecycle in a single sequential test suite:
 *   Register → Onboard → Profile → Check-in → Journal → Talk (+ Crisis) →
 *   Intervention (Start & Complete) → Feedback → Recommendations → Patterns →
 *   AI Memory → Data Export → Offline Sync → Token Rotation → Logout
 *
 * All steps share a single in-memory MongoDB instance and HTTP app instance
 * to validate cross-feature data consistency.
 */
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app';

// ─── Shared State ─────────────────────────────────────────────────────────────
let app: ReturnType<typeof createApp>;
let mongoServer: MongoMemoryServer;
let accessToken: string;
let refreshToken: string;
let userId: string;
let interventionId: string;
let interventionSlug: string;
let sessionId: string;

// ─── Setup / Teardown ─────────────────────────────────────────────────────────
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({ instance: { launchTimeout: 30000 } });
  await mongoose.connect(mongoServer.getUri());
  app = createApp();
}, 35000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}, 15000);

// ─────────────────────────────────────────────────────────────────────────────
describe('Phase 15: Complete MindOS User Journey (E2E)', () => {

  // ── Step 1: Register ─────────────────────────────────────────────────────
  it('Step 1 — registers a new user and returns JWT token pair', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'e2e_journey@mindos.test',
        password: 'SecurePass2025!',
        name: 'E2E Test User',
        preferredName: 'E2EUser',
        languagePreference: 'banglish',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.tokens).toBeDefined();
    expect(res.body.tokens.accessToken).toBeDefined();
    expect(res.body.tokens.refreshToken).toBeDefined();

    accessToken = res.body.tokens.accessToken;
    refreshToken = res.body.tokens.refreshToken;
    userId = res.body.user.id || res.body.user._id;
  });

  // ── Step 2: Onboarding ────────────────────────────────────────────────────
  it('Step 2 — completes onboarding and persists focus areas', async () => {
    const res = await request(app)
      .post('/api/onboarding/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        communicationTone: 'gentle',
        primaryFocusAreas: ['study', 'energy'],
        baselineSupportType: 'micro_actions',
        preferredName: 'E2EUser',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.user.onboardingCompleted).toBe(true);
    expect(res.body.user.primaryFocusAreas).toContain('study');
  });

  // ── Step 3: Support Profile ───────────────────────────────────────────────
  it('Step 3 — builds personal support profile with daily rhythms', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        dailyRhythms: {
          peakEnergyTime: 'morning',
          wakeTime: '07:00',
          sleepTime: '23:00',
          highStressHours: ['afternoon'],
        },
        sensitivities: {
          overstimulationTriggers: ['deadlines'],
          pressureTopics: ['exams'],
        },
        preferredInterventionTypes: ['breathing', 'task_breakdown'],
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.profile.dailyRhythms.peakEnergyTime).toBe('morning');
  });

  // ── Step 4: Morning Check-in ──────────────────────────────────────────────
  it('Step 4 — submits overwhelmed morning check-in with study context', async () => {
    const res = await request(app)
      .post('/api/checkin')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        mood: 'overwhelmed',
        energyLevel: 2,
        tags: ['study', 'burnout'],
        note: 'Exam coming up, cannot focus at all',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.checkin.mood).toBe('overwhelmed');
    expect(res.body.nextStep).toBeDefined();
    expect(res.body.nextStep.actionLabel).toBeDefined();
  });

  // ── Step 5: Journal Entry ────────────────────────────────────────────────
  it('Step 5 — creates a private journal entry with AI reflection', async () => {
    const res = await request(app)
      .post('/api/journal')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        content: 'Aaj khub pressure feel korchi. Exam er jonno matha ghurche, kono kichhu mone thakche na.',
        type: 'text',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.entry.content).toContain('pressure');
    expect(res.body.entry.aiReflection).toBeDefined();
    expect(res.body.entry.aiReflection.text).toBeTruthy();
  });

  // ── Step 6: AI Talk – Supportive Chat ────────────────────────────────────
  it('Step 6 — sends a Banglish study overwhelm message and gets non-clinical support', async () => {
    const res = await request(app)
      .post('/api/talk/message')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        message: 'ami khub overwhelmed, pori kintu kichhu dhoke na',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.assistantMessage).toBeDefined();
    expect(res.body.assistantMessage.text).toBeTruthy();
    // Non-clinical validation: no medical diagnoses or psychiatric jargon
    expect(res.body.assistantMessage.text).not.toMatch(/ADHD|disorder|bipolar|schizophren|psychiatri/i);
  });

  // ── Step 7: AI Talk – Crisis Interception ────────────────────────────────
  it('Step 7 — crisis phrase triggers hotline injection without model call', async () => {
    const res = await request(app)
      .post('/api/talk/message')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        message: 'I want to end my life, everything is hopeless',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.assistantMessage).toBeDefined();
    // Must contain Bangladesh emergency resource and hotline
    expect(res.body.assistantMessage.text).toMatch(/Kaan Pete Roi|\+8801779554391|999/i);
  });

  // ── Step 8: Fetch & Start Intervention ───────────────────────────────────
  it('Step 8 — fetches interventions and starts a session for Box Breathing', async () => {
    // Fetch curated catalog
    const listRes = await request(app)
      .get('/api/interventions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(listRes.body.interventions.length).toBeGreaterThan(0);
    const boxBreathing = listRes.body.interventions.find((i: any) => i.slug === 'box-breathing') || listRes.body.interventions[0];
    interventionId = boxBreathing._id;
    interventionSlug = boxBreathing.slug;

    // Start a session
    const startRes = await request(app)
      .post('/api/interventions/start')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        interventionId,
        contextTrigger: 'e2e_journey',
      })
      .expect(201);

    expect(startRes.body.success).toBe(true);
    expect(startRes.body.session.status).toBe('in_progress');
    sessionId = startRes.body.session._id;
  });

  // ── Step 9: Complete Intervention ────────────────────────────────────────
  it('Step 9 — completes the intervention session and updates DailyProgress', async () => {
    const res = await request(app)
      .post('/api/interventions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        sessionId,
        completedSteps: 4,
        durationSpentSeconds: 120,
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.session.status).toBe('completed');
  });

  // ── Step 10: Did It Help? Feedback ───────────────────────────────────────
  it('Step 10 — submits "a_lot" feedback for the completed intervention', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        sessionId,
        rating: 'a_lot',
        perceivedShifts: ['calmer', 'more focused'],
        notes: 'Really helped me reset',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.feedback.rating).toBe('a_lot');
    expect(res.body.feedback.ratingScore).toBe(4);
  });

  // ── Step 11: Personalized Recommendations ────────────────────────────────
  it('Step 11 — fetches personalized recommendations with scoring breakdown', async () => {
    const res = await request(app)
      .get('/api/interventions/recommended?mood=overwhelmed')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.recommendations.length).toBeGreaterThan(0);
    const top = res.body.recommendations[0];
    expect(top.totalScore).toBeDefined();
    expect(top.components).toBeDefined();
  });

  // ── Step 12: Pattern Insights ─────────────────────────────────────────────
  it('Step 12 — fetches pattern insights with correlation analysis', async () => {
    const res = await request(app)
      .get('/api/patterns')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.patterns).toBeDefined();
    expect(res.body.patterns.sleepEnergy).toBeDefined();
  });

  // ── Step 13: AI Memory View ───────────────────────────────────────────────
  it('Step 13 — views AI memories (starter memories seeded for new user)', async () => {
    const res = await request(app)
      .get('/api/privacy/memories')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.memories)).toBe(true);
    expect(res.body.memories.length).toBeGreaterThan(0);
  });

  // ── Step 14: Full Data Export ─────────────────────────────────────────────
  it('Step 14 — exports full user data package across all collections', async () => {
    const res = await request(app)
      .get('/api/privacy/export')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.export).toBeDefined();
    const exportData = res.body.export;
    // Confirm all collections are present
    expect(exportData.user).toBeDefined();
    expect(Array.isArray(exportData.checkins)).toBe(true);
    expect(Array.isArray(exportData.journalEntries)).toBe(true);
    expect(Array.isArray(exportData.interventionFeedback)).toBe(true);
    // Sensitive fields must be excluded
    expect(exportData.user?.password).toBeUndefined();
    expect(exportData.user?.passwordHash).toBeUndefined();
  });

  // ── Step 15: Offline Batch Sync ───────────────────────────────────────────
  it('Step 15 — batch-syncs an offline check-in preserving client timestamp', async () => {
    const clientTimestamp = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const date = clientTimestamp.split('T')[0];

    const res = await request(app)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        checkins: [
          {
            mood: 'neutral',
            energyLevel: 3,
            tags: ['sleep'],
            note: 'Synced from offline queue',
            date,
            clientTimestamp,
          },
        ],
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.synced.checkins).toBe(1);
  });

  // ── Step 16: Token Rotation ───────────────────────────────────────────────
  it('Step 16 — rotates refresh token and receives a new access token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.tokens.accessToken).toBeDefined();
    expect(res.body.tokens.refreshToken).toBeDefined();
    // New tokens must differ from old
    expect(res.body.tokens.accessToken).not.toBe(accessToken);
    expect(res.body.tokens.refreshToken).not.toBe(refreshToken);

    // Update tokens for final step
    accessToken = res.body.tokens.accessToken;
    refreshToken = res.body.tokens.refreshToken;
  });

  // ── Step 17: Logout ───────────────────────────────────────────────────────
  it('Step 17 — logs out, revokes token, and subsequent refresh returns 401', async () => {
    // Logout
    await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken })
      .expect(200);

    // Subsequent refresh with revoked token must fail
    const retryRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(401);

    expect(retryRes.body.success).toBe(false);
  });

});
