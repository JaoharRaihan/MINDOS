import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app';
import { User } from '../src/models/User';
import { SafetyAuditLog } from '../src/models/SafetyAuditLog';
import {
  evaluateInputSafety,
  filterOutputSafety,
} from '../src/services/safetyService';

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
  await SafetyAuditLog.deleteMany({});
});

describe('Phase 13: Safety Hardening & Non-Clinical Guardrails', () => {
  const registerUser = async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'safety_user@mindos.me',
      password: 'Password123!',
      name: 'Shahriar Kabir',
    });
    return { token: res.body.tokens.accessToken, user: res.body.user };
  };

  describe('Isolated Safety Pipeline Unit Tests', () => {
    it('intercepts English crisis and suicidal ideation with immediate emergency resources', () => {
      const result1 = evaluateInputSafety('I feel like I want to kill myself tonight');
      expect(result1.isSafe).toBe(false);
      expect(result1.category).toBe('self_harm');
      expect(result1.severity).toBe('crisis');
      expect(result1.crisisResponse).toBeDefined();
      expect(result1.crisisResponse?.text).toContain('+8801779554391');
      expect(result1.crisisResponse?.text).toContain('999');

      const result2 = evaluateInputSafety('I want to end my life, everything is too dark');
      expect(result2.isSafe).toBe(false);
      expect(result2.category).toBe('self_harm');
      expect(result2.severity).toBe('crisis');
    });

    it('intercepts Banglish suicidal expressions accurately', () => {
      const banglish1 = evaluateInputSafety('ami mora jete chai ar parchi na');
      expect(banglish1.isSafe).toBe(false);
      expect(banglish1.category).toBe('self_harm');
      expect(banglish1.severity).toBe('crisis');
      expect(banglish1.matchedRule).toBe('banglish_mora_jete_chai');

      const banglish2 = evaluateInputSafety('beche theke ar labh nei');
      expect(banglish2.isSafe).toBe(false);
      expect(banglish2.category).toBe('self_harm');

      const banglish3 = evaluateInputSafety('atmohotta chara ar kono upay nai');
      expect(banglish3.isSafe).toBe(false);
      expect(banglish3.category).toBe('self_harm');
    });

    it('intercepts medical diagnosis and psychiatric inquiry with non-clinical boundary guardrails', () => {
      const diag1 = evaluateInputSafety('Can you diagnose me? Do I have ADHD?');
      expect(diag1.isSafe).toBe(false);
      expect(diag1.category).toBe('medical_diagnosis');
      expect(diag1.severity).toBe('caution');
      expect(diag1.clinicalBoundaryResponse?.text).toContain('cannot provide medical diagnoses');
      expect(diag1.clinicalBoundaryResponse?.text).toContain('National Institute of Mental Health Dhaka');

      const diag2 = evaluateInputSafety('Am I clinically depressed or just sad?');
      expect(diag2.isSafe).toBe(false);
      expect(diag2.category).toBe('medical_diagnosis');

      const rx = evaluateInputSafety('Can you prescribe me Xanax for my anxiety?');
      expect(rx.isSafe).toBe(false);
      expect(rx.category).toBe('medical_diagnosis');
      expect(rx.clinicalBoundaryResponse?.text).toContain('prescribe medication');
    });

    it('does not falsely trigger crisis on hyperbolic everyday idioms', () => {
      const hyp1 = evaluateInputSafety('This final exam is killing me');
      expect(hyp1.isSafe).toBe(true);

      const hyp2 = evaluateInputSafety('I am dead tired after study today');
      expect(hyp2.isSafe).toBe(true);
    });

    it('output guardrail sanitizes accidental clinical diagnostic assertions', () => {
      const rawOutput = 'Based on what you shared, you have clinical depression and need therapy.';
      const filtered = filterOutputSafety(rawOutput);

      expect(filtered.wasModified).toBe(true);
      expect(filtered.text).not.toContain('you have clinical depression');
      expect(filtered.text).toContain('you seem to be experiencing heavy overwhelm and fatigue');
    });
  });

  describe('Integration Endpoints & Conversation Interception', () => {
    it('intercepts medical diagnosis requests during chat via POST /api/talk/message', async () => {
      const { token } = await registerUser();

      const res = await request(app)
        .post('/api/talk/message')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'Can you diagnose me? Do I have bipolar disorder?' });

      expect(res.status).toBe(200);
      expect(res.body.assistantMessage.text).toContain('cannot provide medical diagnoses');
      expect(res.body.assistantMessage.text).toContain('National Institute of Mental Health Dhaka');

      // Verify safety audit log was recorded
      const auditLog = await SafetyAuditLog.findOne({ category: 'medical_diagnosis' });
      expect(auditLog).toBeDefined();
      expect(auditLog?.actionTaken).toBe('clinical_boundary_disclaimer');
    });

    it('intercepts suicidal crisis in Banglish during chat via POST /api/talk/message', async () => {
      const { token } = await registerUser();

      const res = await request(app)
        .post('/api/talk/message')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'ar shojjo hocche na, ami mora jete chai' });

      expect(res.status).toBe(200);
      expect(res.body.assistantMessage.text).toContain('Kaan Pete Roi');
      expect(res.body.assistantMessage.text).toContain('+8801779554391');
      expect(res.body.assistantMessage.suggestedActions[0].actionType).toBe('emergency_call');

      // Verify crisis safety audit log
      const auditLog = await SafetyAuditLog.findOne({ category: 'self_harm' });
      expect(auditLog).toBeDefined();
      expect(auditLog?.actionTaken).toBe('crisis_redirect');
    });

    it('POST /api/safety/classify returns safety evaluation result', async () => {
      const res = await request(app)
        .post('/api/safety/classify')
        .send({ text: 'Do I have ADHD?' });

      expect(res.status).toBe(200);
      expect(res.body.inputSafety.category).toBe('medical_diagnosis');
      expect(res.body.inputSafety.isSafe).toBe(false);
    });

    it('GET /api/safety/audit-summary returns audit counts for authenticated user', async () => {
      const { token } = await registerUser();

      // Trigger one crisis and one disclaimer
      await request(app)
        .post('/api/talk/message')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'Do I have ADHD?' });

      const res = await request(app)
        .get('/api/safety/audit-summary')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.counts).toBeDefined();
      expect(res.body.counts.clinicalDisclaimers).toBe(1);
    });
  });
});
