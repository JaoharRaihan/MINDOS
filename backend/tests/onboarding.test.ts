import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app';
import { User } from '../src/models/User';

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
});

describe('Onboarding Endpoints', () => {
  const testUser = {
    email: 'onboarding_user@mindos.me',
    password: 'SecurePassword123!',
    name: 'Nabila Khan',
  };

  const getAuthToken = async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    return res.body.tokens.accessToken;
  };

  it('should return 401 when accessing onboarding without token', async () => {
    const res = await request(app).get('/api/onboarding/status');
    expect(res.status).toBe(401);
  });

  it('should return initial onboarding status as false', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .get('/api/onboarding/status')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.onboardingCompleted).toBe(false);
  });

  it('should complete onboarding with valid preferences', async () => {
    const token = await getAuthToken();
    const onboardingData = {
      communicationTone: 'practical',
      primaryFocusAreas: ['starting_tasks', 'academic_career'],
      baselineSupportType: 'micro_actions',
      preferredName: 'Nabila',
    };

    const res = await request(app)
      .post('/api/onboarding/complete')
      .set('Authorization', `Bearer ${token}`)
      .send(onboardingData);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.onboardingCompleted).toBe(true);
    expect(res.body.user.communicationTone).toBe('practical');
    expect(res.body.user.primaryFocusAreas).toEqual(['starting_tasks', 'academic_career']);
    expect(res.body.user.preferredName).toBe('Nabila');

    // Verify status endpoint reflects completion
    const statusRes = await request(app)
      .get('/api/onboarding/status')
      .set('Authorization', `Bearer ${token}`);
    expect(statusRes.body.onboardingCompleted).toBe(true);
  });

  it('should reject onboarding if focus areas are empty', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/onboarding/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({
        communicationTone: 'practical',
        primaryFocusAreas: [],
        baselineSupportType: 'micro_actions',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
  });
});
