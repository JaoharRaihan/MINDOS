import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app';
import { User } from '../src/models/User';
import { SupportProfile } from '../src/models/SupportProfile';

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
  await SupportProfile.deleteMany({});
});

describe('Personal Support Profile Endpoints', () => {
  const testUser = {
    email: 'profile_user@mindos.me',
    password: 'Password123!',
    name: 'Tanvir Hossain',
  };

  const getAuthToken = async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    return res.body.tokens.accessToken;
  };

  describe('GET /api/profile', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/profile');
      expect(res.status).toBe(401);
    });

    it('should seed and return a default support profile for new user', async () => {
      const token = await getAuthToken();
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profile).toBeDefined();
      expect(res.body.profile.dailyRhythms).toHaveProperty('wakeTime');
      expect(res.body.profile.sensitivities).toBeDefined();
      expect(res.body.profile.preferredInterventionTypes).toContain('task_breakdown');
      expect(res.body.profile.goals.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PUT /api/profile', () => {
    it('should update daily rhythms, sensitivities, and preferred intervention types', async () => {
      const token = await getAuthToken();
      const updateData = {
        dailyRhythms: {
          wakeTime: '08:00',
          sleepTime: '00:00',
          peakEnergyTime: 'evening',
          highStressHours: ['late_night'],
        },
        sensitivities: {
          overstimulationTriggers: ['traffic_noise', 'loud_crowds'],
          pressureTopics: ['career_job_hunt'],
        },
        preferredInterventionTypes: ['physical', 'sensory_reset'],
        communicationPreferences: {
          tone: 'casual',
          responseLength: 'short',
          language: 'banglish',
        },
      };

      const res = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profile.dailyRhythms.wakeTime).toBe('08:00');
      expect(res.body.profile.dailyRhythms.peakEnergyTime).toBe('evening');
      expect(res.body.profile.sensitivities.overstimulationTriggers).toContain('traffic_noise');
      expect(res.body.profile.preferredInterventionTypes).toEqual(['physical', 'sensory_reset']);
      expect(res.body.profile.communicationPreferences.tone).toBe('casual');
    });

    it('should reject invalid peakEnergyTime enum with 400', async () => {
      const token = await getAuthToken();
      const res = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          dailyRhythms: {
            peakEnergyTime: 'middle_of_the_day_invalid',
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('Goals Management in Support Profile', () => {
    it('should add a new goal and delete it successfully', async () => {
      const token = await getAuthToken();

      // 1. Add goal
      const addRes = await request(app)
        .post('/api/profile/goals')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Take a 5-minute micro-reset walk after Dhaka commute',
          category: 'calm',
          targetMinutes: 5,
        });

      expect(addRes.status).toBe(201);
      expect(addRes.body.success).toBe(true);
      const addedGoal = addRes.body.goals.find(
        (g: any) => g.title === 'Take a 5-minute micro-reset walk after Dhaka commute'
      );
      expect(addedGoal).toBeDefined();

      // 2. Delete goal
      const deleteRes = await request(app)
        .delete(`/api/profile/goals/${addedGoal._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      const exists = deleteRes.body.goals.some((g: any) => g._id === addedGoal._id);
      expect(exists).toBe(false);
    });
  });
});
