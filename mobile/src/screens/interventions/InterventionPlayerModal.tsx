import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { theme } from '../../theme';
import { useInterventionStore } from '../../state/interventionStore';

export const InterventionPlayerModal: React.FC = () => {
  const {
    activeIntervention,
    isPlayerOpen,
    currentStepIndex,
    timeRemainingSeconds,
    isTimerRunning,
    nextStep,
    prevStep,
    toggleTimer,
    tickTimer,
    closePlayer,
    completeActiveSession,
  } = useInterventionStore();

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlayerOpen && isTimerRunning && timeRemainingSeconds > 0) {
      interval = setInterval(() => {
        tickTimer();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayerOpen, isTimerRunning, timeRemainingSeconds, tickTimer]);

  if (!isPlayerOpen || !activeIntervention) {
    return null;
  }

  const currentStep = activeIntervention.steps[currentStepIndex];
  const totalSteps = activeIntervention.steps.length;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <Modal visible={isPlayerOpen} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeGroup}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {activeIntervention.category.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.durationBadge}>
                {Math.round(activeIntervention.durationSeconds / 60)} MIN
              </Text>
            </View>

            <TouchableOpacity onPress={closePlayer} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Stepper Dots */}
          <View style={styles.stepperContainer}>
            <Text style={styles.stepIndicator}>
              STEP {currentStepIndex + 1} OF {totalSteps}
            </Text>
            <View style={styles.dotsRow}>
              {activeIntervention.steps.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    idx === currentStepIndex && styles.dotActive,
                    idx < currentStepIndex && styles.dotCompleted,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Active Step Content */}
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.interventionTitle}>{activeIntervention.title}</Text>

            {/* Timer Ring */}
            <View style={styles.timerCircle}>
              <Text style={styles.timerNumber}>{formatTime(timeRemainingSeconds)}</Text>
              <TouchableOpacity onPress={toggleTimer} style={styles.pausePill}>
                <Text style={styles.pausePillText}>
                  {isTimerRunning ? '⏸ Pause' : '▶ Resume'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.stepTitle}>{currentStep?.title}</Text>
            <Text style={styles.instructionText}>{currentStep?.instruction}</Text>
          </ScrollView>

          {/* Footer Navigation Controls */}
          <View style={styles.footer}>
            <View style={styles.buttonRow}>
              {currentStepIndex > 0 ? (
                <TouchableOpacity
                  style={styles.backButton}
                  activeOpacity={0.7}
                  onPress={prevStep}
                >
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ flex: 1 }} />
              )}

              <TouchableOpacity
                style={styles.nextButton}
                activeOpacity={0.8}
                onPress={isLastStep ? completeActiveSession : nextStep}
              >
                <Text style={styles.nextButtonText}>
                  {isLastStep ? 'Finish ✓' : 'Next Step →'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(36, 33, 29, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    maxHeight: '90%',
    minHeight: '65%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  categoryBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
  },
  categoryText: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.xs,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  durationBadge: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.sizes.xs,
    fontWeight: '600',
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  closeText: {
    fontSize: 18,
    color: theme.colors.textMuted,
  },
  stepperContainer: {
    marginBottom: theme.spacing.md,
  },
  stepIndicator: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: theme.colors.textMuted,
    marginBottom: 6,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
  },
  dotCompleted: {
    backgroundColor: theme.colors.moodGreat,
  },
  content: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  interventionTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  timerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  timerNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text,
    fontVariant: ['tabular-nums'],
  },
  pausePill: {
    marginTop: theme.spacing.xs,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pausePillText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  stepTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  instructionText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: theme.spacing.md,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  backButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
    fontSize: theme.typography.sizes.sm,
  },
  nextButton: {
    flex: 2,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: theme.typography.sizes.md,
  },
});
