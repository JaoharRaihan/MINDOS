import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { theme } from '../../theme';
import { PersonalPlaybook } from '../../state/patternStore';
import { useInterventionStore } from '../../state/interventionStore';

interface PlaybookModalProps {
  visible: boolean;
  playbook: PersonalPlaybook | null;
  onClose: () => void;
}

export const PlaybookModal: React.FC<PlaybookModalProps> = ({
  visible,
  playbook,
  onClose,
}) => {
  if (!playbook) return null;

  const handleStartIntervention = () => {
    onClose();
    useInterventionStore
      .getState()
      .startBySlug(playbook.recommendedInterventionSlug, `playbook_${playbook.id}`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>PERSONAL PLAYBOOK</Text>
              </View>
              <Text style={styles.title}>{playbook.title}</Text>
              <Text style={styles.subtitle}>{playbook.subtitle}</Text>
            </View>

            {/* Personal Rationale Card */}
            <View style={styles.rationaleCard}>
              <Text style={styles.rationaleTitle}>💡 Why this plan:</Text>
              <Text style={styles.rationaleText}>{playbook.personalRationale}</Text>
            </View>

            {/* Steps List */}
            <View style={styles.stepsSection}>
              <Text style={styles.sectionHeading}>ACTION STEPS</Text>
              {playbook.steps.map((step) => (
                <View key={step.stepNumber} style={styles.stepRow}>
                  <View style={styles.stepCircle}>
                    <Text style={styles.stepNumberText}>{step.stepNumber}</Text>
                  </View>
                  <View style={styles.stepBody}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepDescription}>{step.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Launch Recommended Intervention */}
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={styles.launchButton}
                activeOpacity={0.8}
                onPress={handleStartIntervention}
              >
                <Text style={styles.launchButtonText}>
                  {playbook.actionLabel} • {playbook.recommendedInterventionTitle} ({playbook.durationMinutes} min)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeButton} activeOpacity={0.7} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close Playbook</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '90%',
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    marginBottom: theme.spacing.md,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.xs,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: theme.colors.secondary,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeights.sm + 2,
  },
  rationaleCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  rationaleTitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
    color: theme.colors.primaryDark,
    marginBottom: 2,
  },
  rationaleText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeights.sm + 2,
  },
  stepsSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeading: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    alignItems: 'flex-start',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  stepBody: {
    flex: 1,
  },
  stepTitle: {
    fontSize: theme.typography.sizes.sm + 1,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeights.sm + 2,
  },
  actionSection: {
    gap: theme.spacing.sm,
  },
  launchButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
  },
  launchButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: theme.typography.sizes.sm,
  },
  closeButton: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  closeButtonText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.sizes.sm,
    fontWeight: '600',
  },
});
