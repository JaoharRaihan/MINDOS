import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../../theme';
import { useFeedbackStore, FeedbackRating } from '../../state/feedbackStore';

const RATING_OPTIONS: { key: FeedbackRating; label: string; emoji: string }[] = [
  { key: 'not_at_all', label: 'Not really', emoji: '😐' },
  { key: 'a_little', label: 'A little', emoji: '🙂' },
  { key: 'somewhat', label: 'Noticeably', emoji: '😌' },
  { key: 'a_lot', label: 'Much better', emoji: '✨' },
];

const SHIFT_OPTIONS = [
  { key: 'calmer', label: 'Calmer body 🌿' },
  { key: 'clearer_head', label: 'Clearer thoughts 🧠' },
  { key: 'more_focused', label: 'Ready to start 🎯' },
  { key: 'lighter', label: 'Felt lighter 🪶' },
  { key: 'less_anxious', label: 'Less tense 🌊' },
  { key: 'still_overwhelmed', label: 'Still overwhelmed 🌧️' },
];

export const DidItHelpModal: React.FC = () => {
  const {
    isOpen,
    pendingSession,
    selectedRating,
    selectedShifts,
    notes,
    isSubmitting,
    selectRating,
    toggleShift,
    setNotes,
    submitFeedback,
    closeFeedback,
  } = useFeedbackStore();

  if (!isOpen || !pendingSession) {
    return null;
  }

  return (
    <Modal visible={isOpen} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.eyebrow}>DID THAT HELP?</Text>
            <TouchableOpacity onPress={closeFeedback} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>{pendingSession.interventionTitle}</Text>
            <Text style={styles.subtitle}>
              MindOS uses your real reactions to learn what actually brings you relief.
            </Text>

            {/* 4-Level Rating Grid */}
            <Text style={styles.sectionLabel}>HOW WAS IT?</Text>
            <View style={styles.ratingRow}>
              {RATING_OPTIONS.map((item) => {
                const isSelected = selectedRating === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.ratingPill, isSelected && styles.ratingPillSelected]}
                    activeOpacity={0.7}
                    onPress={() => selectRating(item.key)}
                  >
                    <Text style={styles.ratingEmoji}>{item.emoji}</Text>
                    <Text
                      style={[
                        styles.ratingLabel,
                        isSelected && styles.ratingLabelSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Qualitative Shifts Multi-Select */}
            <Text style={styles.sectionLabel}>WHAT SHIFTED? (OPTIONAL)</Text>
            <View style={styles.shiftsRow}>
              {SHIFT_OPTIONS.map((item) => {
                const isSelected = selectedShifts.includes(item.key);
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.shiftChip, isSelected && styles.shiftChipSelected]}
                    activeOpacity={0.7}
                    onPress={() => toggleShift(item.key)}
                  >
                    <Text
                      style={[
                        styles.shiftText,
                        isSelected && styles.shiftTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Optional Personal Note */}
            <Text style={styles.sectionLabel}>NOTE (OPTIONAL)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="E.g. Helped slow down breathing before exam..."
              placeholderTextColor={theme.colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              maxLength={300}
              multiline
            />
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedRating || isSubmitting) && styles.submitButtonDisabled,
              ]}
              disabled={!selectedRating || isSubmitting}
              activeOpacity={0.8}
              onPress={submitFeedback}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Save Reflection ✓</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              activeOpacity={0.7}
              onPress={closeFeedback}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  eyebrow: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: theme.colors.primary,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  closeText: {
    fontSize: 18,
    color: theme.colors.textMuted,
  },
  scrollContent: {
    paddingVertical: theme.spacing.sm,
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
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  ratingPill: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: 4,
  },
  ratingPillSelected: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  ratingEmoji: {
    fontSize: 20,
  },
  ratingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  ratingLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  shiftsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  shiftChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  shiftChipSelected: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  shiftText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '500',
    color: theme.colors.text,
  },
  shiftTextSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
    minHeight: 65,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.md,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: theme.typography.sizes.md,
  },
  skipButton: {
    alignSelf: 'center',
    padding: theme.spacing.xs,
  },
  skipButtonText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.sizes.xs,
  },
});
