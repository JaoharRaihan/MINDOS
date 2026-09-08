import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { theme } from '../../theme';
import { useHelpStore, TriageTrigger, TriageOption } from '../../state/helpStore';

interface HelpMeNowModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: 'home' | 'talk' | 'journal' | 'you') => void;
}

const TRIGGER_ITEMS: { key: TriageTrigger; label: string; emoji: string }[] = [
  { key: 'anxious', label: "I'm anxious", emoji: '😰' },
  { key: 'racing_thoughts', label: "My thoughts won't stop", emoji: '🧠' },
  { key: 'overwhelmed', label: "I'm overwhelmed", emoji: '😵' },
  { key: 'cant_focus', label: "I can't focus", emoji: '🎯' },
  { key: 'low', label: 'I feel low', emoji: '😔' },
  { key: 'cant_sleep', label: "I can't sleep", emoji: '😴' },
  { key: 'lonely', label: 'I feel lonely', emoji: '🥺' },
  { key: 'dont_know', label: "I don't know", emoji: '❓' },
];

export const HelpMeNowModal: React.FC<HelpMeNowModalProps> = ({
  visible,
  onClose,
  onNavigateToTab,
}) => {
  const {
    activeTrigger,
    triageData,
    crisisResources,
    isLoadingTriage,
    isLoadingResources,
    selectTrigger,
    fetchResources,
    logAction,
    resetTriage,
  } = useHelpStore();

  const [showResourcesView, setShowResourcesView] = useState(false);
  const [activeExercise, setActiveExercise] = useState<'grounding' | 'focus' | null>(null);
  const [groundingStep, setGroundingStep] = useState(0);

  useEffect(() => {
    if (visible && crisisResources.length === 0) {
      fetchResources();
    }
  }, [visible, crisisResources.length, fetchResources]);

  const handleClose = () => {
    resetTriage();
    setShowResourcesView(false);
    setActiveExercise(null);
    setGroundingStep(0);
    onClose();
  };

  const handleSelectTrigger = async (trigger: TriageTrigger) => {
    setActiveExercise(null);
    await selectTrigger(trigger);
  };

  const handleOptionPress = async (option: TriageOption) => {
    await logAction(option.id);

    if (option.id === 'talk') {
      handleClose();
      onNavigateToTab?.('talk');
    } else if (option.id === 'journal') {
      handleClose();
      onNavigateToTab?.('journal');
    } else if (option.id === 'calm') {
      setActiveExercise('grounding');
      setGroundingStep(0);
    } else if (option.id === 'focus') {
      setActiveExercise('focus');
    } else if (option.id === 'human_support') {
      setShowResourcesView(true);
    }
  };

  const handleCall = (phoneNumber: string) => {
    const url = `tel:${phoneNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Phone Call', `Please dial ${phoneNumber} on your phone.`);
        }
      })
      .catch(() => {
        Alert.alert('Phone Call', `Please dial ${phoneNumber} on your phone.`);
      });
  };

  const groundingSteps = [
    { title: 'Look around you', instruction: 'Notice 5 things you can see right now. A chair, light on a wall, your hands.' },
    { title: 'Physical touch', instruction: 'Notice 4 things you can feel. Feet firm on the floor, fabric of your shirt.' },
    { title: 'Listen quietly', instruction: 'Notice 3 distinct sounds around you. Traffic outside, a fan, quiet room tone.' },
    { title: 'Scent & breath', instruction: 'Notice 2 things you can smell, or take two deep, slow diaphragmatic breaths.' },
    { title: 'One reassuring truth', instruction: 'Say softly to yourself: "I am safe in this present moment. One minute at a time."' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.pulseDot} />
              <Text style={styles.title}>HELP ME NOW</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 1. CRISIS HOTLINES VIEW */}
          {showResourcesView ? (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <Text style={styles.emergencyHeading}>Immediate Human Support</Text>
              <Text style={styles.emergencySubtext}>
                You do not have to carry this alone. These helplines in Bangladesh provide compassionate, confidential care.
              </Text>

              {isLoadingResources ? (
                <ActivityIndicator color={theme.colors.secondary} style={{ marginVertical: 20 }} />
              ) : (
                <View style={styles.resourcesList}>
                  {crisisResources.map((item, idx) => (
                    <View key={idx} style={styles.resourceCard}>
                      <View style={styles.resourceHeader}>
                        <Text style={styles.resourceName}>{item.name}</Text>
                        <Text style={styles.resourceCountry}>{item.country}</Text>
                      </View>
                      <Text style={styles.resourceDetails}>{item.details}</Text>
                      <Text style={styles.resourceAvailability}>Available: {item.available}</Text>

                      {item.phone.startsWith('+') || item.phone === '999' ? (
                        <TouchableOpacity
                          style={styles.callButton}
                          activeOpacity={0.8}
                          onPress={() => handleCall(item.phone)}
                        >
                          <Text style={styles.callButtonText}>📞 Call {item.phone}</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.linkButton}
                          activeOpacity={0.8}
                          onPress={() => Linking.openURL(item.phone)}
                        >
                          <Text style={styles.linkButtonText}>Visit Website</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                onPress={() => setShowResourcesView(false)}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>← Back to Options</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : activeExercise === 'grounding' ? (
            /* 2. GROUNDING (5-4-3-2-1) STEPPER */
            <View style={styles.exerciseContainer}>
              <Text style={styles.exerciseBadge}>2-MINUTE SENSORY RESET</Text>
              <Text style={styles.exerciseTitle}>{groundingSteps[groundingStep].title}</Text>
              <Text style={styles.exerciseInstruction}>
                {groundingSteps[groundingStep].instruction}
              </Text>

              <View style={styles.stepperDots}>
                {groundingSteps.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === groundingStep && styles.dotActive]}
                  />
                ))}
              </View>

              <View style={styles.exerciseButtons}>
                {groundingStep < groundingSteps.length - 1 ? (
                  <TouchableOpacity
                    style={styles.primaryAction}
                    activeOpacity={0.8}
                    onPress={() => setGroundingStep((prev) => prev + 1)}
                  >
                    <Text style={styles.primaryActionText}>Next Step →</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.primaryAction}
                    activeOpacity={0.8}
                    onPress={() => {
                      setActiveExercise(null);
                      handleClose();
                    }}
                  >
                    <Text style={styles.primaryActionText}>I Feel A Bit Settled ✓</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => setActiveExercise(null)}
                  style={styles.backButton}
                >
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : activeExercise === 'focus' ? (
            /* 3. 5-MINUTE FOCUS ACTIVATOR */
            <View style={styles.exerciseContainer}>
              <Text style={styles.exerciseBadge}>5-MINUTE MICRO START</Text>
              <Text style={styles.exerciseTitle}>No pressure to finish anything.</Text>
              <Text style={styles.exerciseInstruction}>
                Pick the tiniest fraction of your task. Just open the notebook, or write one sentence, or read one paragraph. Set a 5-minute timer. When the timer rings, you have full permission to stop.
              </Text>

              <TouchableOpacity
                style={styles.primaryAction}
                activeOpacity={0.8}
                onPress={() => {
                  handleClose();
                  onNavigateToTab?.('home');
                }}
              >
                <Text style={styles.primaryActionText}>Start 5-Min Timer on Home</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveExercise(null)}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            </View>
          ) : !activeTrigger || !triageData ? (
            /* 4. DEFAULT 8-TRIGGER GRID */
            <ScrollView contentContainerStyle={styles.triggerList}>
              <Text style={styles.prompt}>What's happening right now?</Text>
              <Text style={styles.promptSub}>
                Tap what feels closest. No clinical labels, just what you are experiencing.
              </Text>

              {isLoadingTriage ? (
                <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 30 }} />
              ) : (
                <View style={styles.grid}>
                  {TRIGGER_ITEMS.map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={styles.triggerPill}
                      activeOpacity={0.7}
                      onPress={() => handleSelectTrigger(item.key)}
                    >
                      <Text style={styles.triggerEmoji}>{item.emoji}</Text>
                      <Text style={styles.triggerLabel}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Bottom Quick Hotline Shortcut */}
              <TouchableOpacity
                style={styles.crisisLink}
                onPress={() => setShowResourcesView(true)}
              >
                <Text style={styles.crisisLinkText}>In acute crisis? Tap for Bangladesh Hotlines 📞</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            /* 5. DYNAMIC TRIAGE OUTCOME SCREEN */
            <ScrollView contentContainerStyle={styles.responseContainer}>
              <Text style={styles.calmHeadline}>{triageData.headline}</Text>
              <Text style={styles.calmSubtext}>{triageData.subtext}</Text>
              <Text style={styles.choicePrompt}>CHOOSE A GENTLE NEXT STEP:</Text>

              <View style={styles.actionList}>
                {triageData.options.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.actionCard,
                      option.isEmergency ? styles.emergencyActionCard : styles.standardActionCard,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleOptionPress(option)}
                  >
                    <View style={styles.actionCardHeader}>
                      <Text
                        style={[
                          styles.actionCardLabel,
                          option.isEmergency && styles.emergencyActionLabel,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {option.isEmergency && (
                        <View style={styles.urgentBadge}>
                          <Text style={styles.urgentBadgeText}>HOTLINE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.actionCardDescription}>{option.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => resetTriage()}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>← Choose something else</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(36, 33, 29, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.secondary,
  },
  title: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: theme.colors.secondary,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  closeText: {
    fontSize: 18,
    color: theme.colors.textMuted,
  },
  triggerList: {
    paddingBottom: theme.spacing.lg,
  },
  prompt: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  promptSub: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  triggerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: '47%',
    flex: 1,
    gap: theme.spacing.sm,
  },
  triggerEmoji: {
    fontSize: 20,
  },
  triggerLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: '600',
    color: theme.colors.text,
    flexShrink: 1,
  },
  crisisLink: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.secondaryLight,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  crisisLinkText: {
    color: theme.colors.secondary,
    fontWeight: '700',
    fontSize: theme.typography.sizes.xs,
  },
  responseContainer: {
    paddingVertical: theme.spacing.xs,
    paddingBottom: theme.spacing.xl,
  },
  calmHeadline: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    lineHeight: 28,
  },
  calmSubtext: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeights.md,
    marginBottom: theme.spacing.lg,
  },
  choicePrompt: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  actionList: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  actionCard: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
  },
  standardActionCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  emergencyActionCard: {
    backgroundColor: theme.colors.secondaryLight,
    borderColor: theme.colors.secondary,
  },
  actionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionCardLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: '700',
    color: theme.colors.text,
  },
  emergencyActionLabel: {
    color: theme.colors.secondary,
  },
  urgentBadge: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgentBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  actionCardDescription: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  emergencyHeading: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: '800',
    color: theme.colors.secondary,
    marginBottom: theme.spacing.xs,
  },
  emergencySubtext: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeights.md,
    marginBottom: theme.spacing.md,
  },
  resourcesList: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  resourceCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resourceName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
  },
  resourceCountry: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  resourceDetails: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  resourceAvailability: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  callButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  callButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: theme.typography.sizes.sm,
  },
  linkButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  linkButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: theme.typography.sizes.sm,
  },
  exerciseContainer: {
    paddingVertical: theme.spacing.md,
  },
  exerciseBadge: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  exerciseTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  exerciseInstruction: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  stepperDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.border,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
    width: 24,
  },
  exerciseButtons: {
    gap: theme.spacing.sm,
  },
  primaryAction: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: theme.typography.sizes.md,
  },
  backButton: {
    alignSelf: 'center',
    padding: theme.spacing.sm,
  },
  backButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
  },
});
