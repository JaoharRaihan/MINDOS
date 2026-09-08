import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { theme } from '../../theme';
import { useAuthStore } from '../../state/authStore';

export const OnboardingScreen: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const totalSteps = 4;

  const [communicationTone, setCommunicationTone] = useState<'gentle' | 'practical' | 'casual'>('practical');
  const [primaryFocusAreas, setPrimaryFocusAreas] = useState<string[]>(['starting_tasks']);
  const [baselineSupportType, setBaselineSupportType] = useState<
    'micro_actions' | 'conversation' | 'journaling' | 'pattern_tracking'
  >('micro_actions');
  const [preferredName, setPreferredName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { completeOnboarding, isLoading, user } = useAuthStore();

  const toggleFocusArea = (key: string) => {
    setPrimaryFocusAreas((prev) =>
      prev.includes(key) ? (prev.length > 1 ? prev.filter((k) => k !== key) : prev) : [...prev, key]
    );
  };

  const handleFinish = async () => {
    setErrorMessage(null);
    try {
      await completeOnboarding({
        communicationTone,
        primaryFocusAreas,
        baselineSupportType,
        preferredName: preferredName.trim() || user?.name?.split(' ')[0] || undefined,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save preferences.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {/* Progress Dots */}
        <View style={styles.progressRow}>
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                step === i ? styles.progressDotActive : step > i ? styles.progressDotDone : null,
              ]}
            />
          ))}
        </View>
        <Text style={styles.stepIndicator}>Step {step} of {totalSteps}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {errorMessage && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* STEP 1: Philosophy & Core Stigma-Free Promise */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.eyebrow}>MINDOS PHILOSOPHY</Text>
            <Text style={styles.title}>Understanding over diagnosing.</Text>
            <Text style={styles.bodyText}>
              We don't put labels on you, claim medical certainty, or force you into clinical boxes.
            </Text>
            <Text style={styles.bodyText}>
              MindOS is a quiet personal system that gradually learns what actually helps you through
              your real everyday experience.
            </Text>

            <View style={styles.cardExample}>
              <Text style={styles.cardExampleTitle}>HOW WE COMMUNICATE</Text>
              <Text style={styles.cardExampleQuote}>"You seem to start tasks more easily when broken down."</Text>
              <Text style={styles.cardExampleQuote}>"Would you like to try a 5-minute reset?"</Text>
              <Text style={styles.cardExampleQuote}>"We're still learning what works best for you."</Text>
            </View>

            <Text style={styles.disclaimerText}>
              MindOS is your personal companion. It is not a clinical mental-health service.
            </Text>
          </View>
        )}

        {/* STEP 2: Preferred Communication Tone */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.eyebrow}>COMMUNICATION STYLE</Text>
            <Text style={styles.title}>How should we talk with you?</Text>
            <Text style={styles.subtitle}>
              Pick the voice that feels most natural when you're overwhelmed or low on energy.
            </Text>

            <View style={styles.optionsList}>
              {[
                {
                  key: 'practical',
                  title: 'Short & practical',
                  desc: 'Action-first, low cognitive load. Direct 5-minute next steps without long essays.',
                },
                {
                  key: 'gentle',
                  title: 'Gentle & reflective',
                  desc: 'Empathetic and exploratory. A calm, non-judgmental space to unpack your feelings.',
                },
                {
                  key: 'casual',
                  title: 'Casual & conversational',
                  desc: 'Feels like chatting with an understanding friend in natural Banglish or English.',
                },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.optionCard,
                    communicationTone === item.key && styles.optionCardActive,
                  ]}
                  onPress={() => setCommunicationTone(item.key as any)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.optionTitle,
                      communicationTone === item.key && styles.optionTitleActive,
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.optionDesc}>{item.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* STEP 3: Primary Focus Areas (Dhaka / Bangladesh context included) */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.eyebrow}>AREAS OF SUPPORT</Text>
            <Text style={styles.title}>What feels heaviest right now?</Text>
            <Text style={styles.subtitle}>
              Choose what you'd like to work through (select one or more).
            </Text>

            <View style={styles.optionsList}>
              {[
                { key: 'starting_tasks', label: '🎯 Starting tasks when overwhelmed (Procrastination)' },
                { key: 'quieting_thoughts', label: '🧠 Noisy thoughts that won’t stop' },
                { key: 'academic_career', label: '📚 University, exams, or career pressure' },
                { key: 'family_social', label: '👨‍👩‍👧 Family expectations & relationship stress' },
                { key: 'sleep_rest', label: '🌙 Rest, evening wind-down & sleep difficulty' },
                { key: 'dhaka_overload', label: '🚦 Overload from daily rush & lifestyle burnout' },
              ].map((item) => {
                const isSelected = primaryFocusAreas.includes(item.key);
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.checkboxCard, isSelected && styles.checkboxCardActive]}
                    onPress={() => toggleFocusArea(item.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.checkIcon}>{isSelected ? '✓' : '○'}</Text>
                    <Text
                      style={[
                        styles.checkLabel,
                        isSelected && styles.checkLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 4: Baseline Support Type & Personal Touch */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.eyebrow}>GETTING STARTED</Text>
            <Text style={styles.title}>Your baseline support style.</Text>
            <Text style={styles.subtitle}>
              When stress hits, what kind of immediate help do you prefer?
            </Text>

            <View style={styles.optionsList}>
              {[
                {
                  key: 'micro_actions',
                  title: '⚡ Micro-actions',
                  desc: 'Quick 5-minute resets, focus timer, or grounding exercise.',
                },
                {
                  key: 'conversation',
                  title: '💬 Conversational',
                  desc: 'Talking things out naturally with the AI companion.',
                },
                {
                  key: 'journaling',
                  title: '📖 Private Journal',
                  desc: 'Writing out feelings with quiet, empathetic AI reflections.',
                },
                {
                  key: 'pattern_tracking',
                  title: '🌿 Pattern Tracking',
                  desc: 'Observing trends in what helps and what doesn’t.',
                },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.optionCard,
                    baselineSupportType === item.key && styles.optionCardActive,
                  ]}
                  onPress={() => setBaselineSupportType(item.key as any)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.optionTitle,
                      baselineSupportType === item.key && styles.optionTitleActive,
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.optionDesc}>{item.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.nameInputGroup}>
              <Text style={styles.nameInputLabel}>What should MindOS call you?</Text>
              <TextInput
                style={styles.nameInput}
                placeholder="e.g. Raihan"
                placeholderTextColor={theme.colors.textMuted}
                value={preferredName}
                onChangeText={setPreferredName}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer Navigation Bar */}
      <View style={styles.footer}>
        {step > 1 ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep((s) => s - 1)}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}

        {step < totalSteps ? (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => setStep((s) => s + 1)}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextButton, styles.finishButton, isLoading && styles.buttonDisabled]}
            disabled={isLoading}
            onPress={handleFinish}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.nextButtonText}>Enter MindOS</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
  },
  progressDot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.borderStrong,
  },
  progressDotActive: {
    backgroundColor: theme.colors.primary,
    width: 32,
  },
  progressDotDone: {
    backgroundColor: theme.colors.primaryDark,
  },
  stepIndicator: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  stepContainer: {
    gap: theme.spacing.md,
  },
  eyebrow: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: theme.colors.secondary,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeights.xxl,
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    lineHeight: theme.typography.lineHeights.md,
    color: theme.colors.textSecondary,
  },
  bodyText: {
    fontSize: theme.typography.sizes.md,
    lineHeight: theme.typography.lineHeights.md + 2,
    color: theme.colors.text,
  },
  cardExample: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    marginVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  cardExampleTitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 1.2,
  },
  cardExampleQuote: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    fontStyle: 'italic',
  },
  disclaimerText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    lineHeight: theme.typography.lineHeights.xs + 2,
  },
  optionsList: {
    gap: theme.spacing.sm,
  },
  optionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  optionCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  optionTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: '700',
    color: theme.colors.text,
  },
  optionTitleActive: {
    color: theme.colors.primaryDark,
  },
  optionDesc: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeights.sm,
  },
  checkboxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  checkboxCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  checkIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
    width: 20,
  },
  checkLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    flexShrink: 1,
    fontWeight: '500',
  },
  checkLabelActive: {
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  nameInputGroup: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  nameInputLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: '600',
    color: theme.colors.text,
  },
  nameInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md - 2,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  errorBox: {
    backgroundColor: theme.colors.secondaryLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.secondary,
    fontSize: theme.typography.sizes.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  backButtonText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm + 4,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.full,
  },
  finishButton: {
    backgroundColor: theme.colors.primaryDark,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.md,
    fontWeight: '700',
  },
});
