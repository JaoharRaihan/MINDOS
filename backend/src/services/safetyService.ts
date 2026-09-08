import mongoose from 'mongoose';
import { SafetyAuditLog, SafetyCategory, SafetySeverity, SafetyActionTaken } from '../models/SafetyAuditLog';

export interface SafetyEvaluationResult {
  isSafe: boolean;
  category: SafetyCategory;
  severity: SafetySeverity;
  matchedRule?: string;
  crisisResponse?: {
    text: string;
    options: string[];
    suggestedActions: Array<{
      label: string;
      actionType: string;
      payload: string;
    }>;
  };
  clinicalBoundaryResponse?: {
    text: string;
    options: string[];
    suggestedActions: Array<{
      label: string;
      actionType: string;
      payload?: string;
    }>;
  };
}

// 1. Self-harm & crisis patterns in English and Banglish
const CRISIS_PATTERNS: Array<{ regex: RegExp; rule: string }> = [
  { regex: /\b(kill|end)\s+(my\s+self|myself|my\s+life)\b/i, rule: 'suicidal_intent_en' },
  { regex: /\b(suicide|suicidal)\b/i, rule: 'suicide_keyword' },
  { regex: /\b(want|wish)\s+to\s+die\b/i, rule: 'want_to_die_en' },
  { regex: /\b(better\s+off\s+dead|don'?t\s+want\s+to\s+live|end\s+it\s+all)\b/i, rule: 'passive_ideation_en' },
  { regex: /\b(slit\s+my\s+wrist|hang\s+myself|overdose\s+on\s+pills)\b/i, rule: 'explicit_method_en' },
  // Banglish patterns
  { regex: /(mora|more)\s+jete\s+chai/i, rule: 'banglish_mora_jete_chai' },
  { regex: /mote\s+chai/i, rule: 'banglish_mote_chai' },
  { regex: /beche\s+theke\s+(ar\s+)?(labh|laav)\s+nei/i, rule: 'banglish_beche_theke_labh_nei' },
  { regex: /atmohotta|attahotta|atmohotya/i, rule: 'banglish_atmohotta' },
  { regex: /jibon\s+(sesh|shesh)\s+kore\s+di(bo)?/i, rule: 'banglish_jibon_sesh' },
  { regex: /beche\s+thakte\s+(iccha|icha)\s+kore\s+na/i, rule: 'banglish_beche_thakte_iccha_nei' },
  { regex: /more\s+gele(i)?\s+bhalo\s+hoto/i, rule: 'banglish_more_gele_bhalo' },
];

// Hyperbolic false-positive exceptions (e.g. "this exam is killing me")
const HYPERBOLIC_EXCEPTIONS = [
  /killing\s+me/i,
  /dead\s+tired/i,
  /dying\s+of\s+laughter/i,
  /killing\s+time/i,
  /to\s+die\s+for/i,
];

// 2. Medical diagnosis & prescription inquiry patterns
const MEDICAL_DIAGNOSIS_PATTERNS: Array<{ regex: RegExp; rule: string }> = [
  { regex: /\b(do\s+i\s+have|am\s+i\s+(having)?)\s+(adhd|depression|bipolar|bpd|ocd|schizophrenia|autism|ptsd)\b/i, rule: 'diagnosis_inquiry' },
  { regex: /\b(diagnose\s+(me|my)|evaluate\s+my\s+(mental\s+illness|disorder))\b/i, rule: 'request_diagnosis' },
  { regex: /\b(am\s+i\s+clinically\s+depressed|is\s+this\s+clinical\s+depression)\b/i, rule: 'clinical_depression_inquiry' },
  { regex: /\bwhat\s+(mental\s+illness|disorder|psychiatric\s+condition)\s+do\s+i\s+have\b/i, rule: 'what_illness_inquiry' },
  { regex: /\b(prescribe|give\s+me\s+a\s+prescription|prescribe\s+me)\b/i, rule: 'prescription_request' },
  { regex: /\b(what\s+medication|what\s+drugs|what\s+pills)\s+should\s+i\s+take\b/i, rule: 'medication_inquiry' },
  { regex: /\b(can\s+you\s+prescribe|give\s+me)\s+(xanax|prozac|zoloft|lexapro|adderall|ritalin|ssri)\b/i, rule: 'specific_drug_request' },
  { regex: /\b(dosage\s+for|dose\s+of)\s+(xanax|prozac|zoloft|lexapro|sertraline)\b/i, rule: 'dosage_request' },
];

// 3. Output guardrail patterns (catches accidental model clinical claims)
const CLINICAL_OUTPUT_PATTERNS: Array<{ regex: RegExp; replacement: string; rule: string }> = [
  {
    regex: /you\s+have\s+(major\s+depressive\s+disorder|clinical\s+depression|adhd|bipolar\s+disorder|bpd|ocd)/gi,
    replacement: 'you seem to be experiencing heavy overwhelm and fatigue',
    rule: 'output_diagnostic_claim',
  },
  {
    regex: /i\s+(diagnose|would\s+diagnose)\s+you\s+with/gi,
    replacement: 'it sounds like you are navigating intense symptoms of',
    rule: 'output_doctor_persona',
  },
  {
    regex: /you\s+are\s+suffering\s+from\s+a\s+(mental\s+illness|psychiatric\s+disorder)/gi,
    replacement: 'you are carrying a very heavy emotional load',
    rule: 'output_illness_label',
  },
];

export const evaluateInputSafety = (text: string): SafetyEvaluationResult => {
  const trimmed = text.trim();

  // Step 1: Check Crisis & Self-Harm
  for (const pattern of CRISIS_PATTERNS) {
    if (pattern.regex.test(trimmed)) {
      // Verify not a hyperbolic idiom
      const isHyperbolic = HYPERBOLIC_EXCEPTIONS.some((exc) => exc.test(trimmed));
      if (!isHyperbolic) {
        return {
          isSafe: false,
          category: 'self_harm',
          severity: 'crisis',
          matchedRule: pattern.rule,
          crisisResponse: {
            text: "I hear that you're going through immense pain right now. Because you matter, I want to make sure you have direct, confidential human care available this very moment. In Bangladesh, you can reach out to Kaan Pete Roi (+8801779554391) or call 999. Please let someone you trust be with you right now.",
            options: ['Call Kaan Pete Roi', 'Call 999', 'I want to talk to someone I know'],
            suggestedActions: [
              { label: 'Call Kaan Pete Roi', actionType: 'emergency_call', payload: '+8801779554391' },
              { label: 'Call 999', actionType: 'emergency_call', payload: '999' },
            ],
          },
        };
      }
    }
  }

  // Step 2: Check Medical Diagnosis & Prescription Inquiries
  for (const pattern of MEDICAL_DIAGNOSIS_PATTERNS) {
    if (pattern.regex.test(trimmed)) {
      return {
        isSafe: false,
        category: 'medical_diagnosis',
        severity: 'caution',
        matchedRule: pattern.rule,
        clinicalBoundaryResponse: {
          text: "I cannot provide medical diagnoses, psychiatric evaluations, or prescribe medication. MindOS is designed for personal rhythm tracking and everyday stress de-escalation. If you're looking for an official clinical evaluation or medication guidance, speaking with a licensed mental health professional (such as at the National Institute of Mental Health Dhaka) is the safest step. In the meantime, would you like to unpack what you are feeling right now, or try a 2-minute reset?",
          options: ['Focus on how I feel', '2-minute reset', 'Get human support contacts'],
          suggestedActions: [
            { label: '2-min reset', actionType: 'breathing', payload: 'box-breathing' },
            { label: 'Human support', actionType: 'emergency_call', payload: '+8801779554391' },
          ],
        },
      };
    }
  }

  // Safe input
  return {
    isSafe: true,
    category: 'safe',
    severity: 'safe',
  };
};

export const filterOutputSafety = (
  text: string
): { text: string; wasModified: boolean; ruleTriggered?: string } => {
  let cleanedText = text;
  let wasModified = false;
  let ruleTriggered: string | undefined;

  for (const pattern of CLINICAL_OUTPUT_PATTERNS) {
    if (pattern.regex.test(cleanedText)) {
      cleanedText = cleanedText.replace(pattern.regex, pattern.replacement);
      wasModified = true;
      ruleTriggered = pattern.rule;
    }
  }

  return {
    text: cleanedText,
    wasModified,
    ruleTriggered,
  };
};

export const logSafetyEvent = async (
  userId: string,
  category: SafetyCategory,
  severity: SafetySeverity,
  actionTaken: SafetyActionTaken,
  matchedRule?: string
): Promise<void> => {
  try {
    await SafetyAuditLog.create({
      userId: new mongoose.Types.ObjectId(userId),
      category,
      severity,
      actionTaken,
      matchedRule,
    });
  } catch {
    // Non-blocking telemetry
  }
};
