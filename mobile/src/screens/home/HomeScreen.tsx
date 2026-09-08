import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../../theme';
import { useHomeStore, Mood } from '../../state/homeStore';
import { useInterventionStore } from '../../state/interventionStore';

interface HomeScreenProps {
  onNavigateToTab?: (tab: 'talk' | 'journal' | 'you') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToTab }) => {
  const {
    greeting,
    todayCheckin,
    nextStep,
    checklist,
    isLoading,
    fetchHomeFeed,
    submitCheckin,
    toggleChecklist,
  } = useHomeStore();

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagPicker, setShowTagPicker] = useState<boolean>(false);
  const [pendingMood, setPendingMood] = useState<Mood | null>(null);

  useEffect(() => {
    fetchHomeFeed();
  }, [fetchHomeFeed]);

  const moods: Array<{ key: Mood; emoji: string; label: string }> = [
    { key: 'great', emoji: '😊', label: 'Fine' },
    { key: 'neutral', emoji: '😐', label: 'Okay' },
    { key: 'down', emoji: '😔', label: 'Low' },
    { key: 'overwhelmed', emoji: '😣', label: 'Overwhelmed' },
    { key: 'exhausted', emoji: '😴', label: 'Exhausted' },
  ];

  const handleMoodSelect = async (mood: Mood) => {
    if (mood === 'overwhelmed' || mood === 'down' || mood === 'exhausted') {
      setPendingMood(mood);
      setShowTagPicker(true);
      await submitCheckin(mood, selectedTags);
    } else {
      setPendingMood(mood);
      setShowTagPicker(false);
      await submitCheckin(mood);
    }
  };

  const handleToggleTag = async (tag: string) => {
    const updated = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(updated);
    if (pendingMood) {
      await submitCheckin(pendingMood, updated);
    }
  };

  const activeMood = todayCheckin?.mood || pendingMood;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Greeting */}
      <View style={styles.header}>
        <Text style={styles.greetingSub}>{greeting}</Text>
        <Text style={styles.greetingMain}>How are you feeling?</Text>
      </View>

      {/* Mood Selector (Calm, non-clinical) */}
      <View style={styles.moodContainer}>
        {moods.map((item) => {
          const isActive = activeMood === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.moodItem, isActive && styles.moodItemActive]}
              activeOpacity={0.7}
              onPress={() => handleMoodSelect(item.key)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Mood: ${item.label}`}
              accessibilityHint={`Select ${item.label} as your current mood`}
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.moodEmoji, isActive && styles.moodEmojiActive]}>
                {item.emoji}
              </Text>
              <Text style={[styles.moodLabel, isActive && styles.moodLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Contextual Tag Picker when Low/Overwhelmed */}
      {showTagPicker && (
        <View style={styles.tagPickerCard}>
          <Text style={styles.tagPickerTitle}>Is this related to anything in particular?</Text>
          <View style={styles.tagRow}>
            {[
              { key: 'study', label: '📚 Studies / Exams' },
              { key: 'work', label: '💼 Job / Work' },
              { key: 'sleep', label: '🌙 Sleep / Fatigue' },
              { key: 'family', label: '👨‍👩‍👧 Family' },
              { key: 'burnout', label: '🚦 Overload' },
            ].map((tag) => {
              const active = selectedTags.includes(tag.key);
              return (
                <TouchableOpacity
                  key={tag.key}
                  style={[styles.tagPill, active && styles.tagPillActive]}
                  onPress={() => handleToggleTag(tag.key)}
                  accessible={true}
                  accessibilityRole="checkbox"
                  accessibilityLabel={tag.label}
                  accessibilityHint={active ? 'Tap to deselect this context' : 'Tap to select this context'}
                  accessibilityState={{ checked: active }}
                >
                  <Text style={[styles.tagPillText, active && styles.tagPillTextActive]}>
                    {tag.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Your Next Step Card */}
      {nextStep ? (
        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>YOUR NEXT STEP</Text>
          <Text style={styles.cardHeadline}>{nextStep.title}</Text>
          <Text style={styles.cardTitle}>"{nextStep.context}"</Text>
          {nextStep.personalizationReasoning ? (
            <View style={styles.reasoningBadge}>
              <Text style={styles.reasoningText}>💡 {nextStep.personalizationReasoning}</Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={nextStep.actionLabel}
            accessibilityHint="Start your personalized next step"
            onPress={() => {
              if (nextStep.interventionSlug) {
                useInterventionStore
                  .getState()
                  .startBySlug(nextStep.interventionSlug, 'home_next_step');
              } else if (nextStep.actionType === 'talk' && onNavigateToTab) {
                onNavigateToTab('talk');
              } else if (nextStep.actionType === 'journal' && onNavigateToTab) {
                onNavigateToTab('journal');
              } else if (nextStep.actionType === 'task_breakdown' || nextStep.actionType === 'focus') {
                useInterventionStore.getState().startBySlug('five-minute-start', 'home_next_step');
              } else if (nextStep.actionType === 'breathing') {
                useInterventionStore.getState().startBySlug('box-breathing', 'home_next_step');
              } else {
                useInterventionStore.getState().startBySlug('five-minute-start', 'home_next_step');
              }
            }}
          >
            <Text style={styles.actionButtonText}>{nextStep.actionLabel}</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : null}

      {/* What do you need? */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>WHAT DO YOU NEED?</Text>
        <View style={styles.grid}>
          {[
            { id: 'talk', label: 'Talk', hint: 'Open the AI companion chat' },
            { id: 'calm', label: 'Calm', hint: 'Start a calming breathing exercise' },
            { id: 'focus', label: 'Focus', hint: 'Start a 5-minute focus starter' },
            { id: 'journal', label: 'Journal', hint: 'Open your private journal' },
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.gridItem}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityHint={item.hint}
              onPress={() => {
                if (item.id === 'talk' && onNavigateToTab) {
                  onNavigateToTab('talk');
                } else if (item.id === 'journal' && onNavigateToTab) {
                  onNavigateToTab('journal');
                } else if (item.id === 'calm') {
                  useInterventionStore.getState().startBySlug('box-breathing', 'home_calm');
                } else if (item.id === 'focus') {
                  useInterventionStore.getState().startBySlug('five-minute-start', 'home_focus');
                }
              }}
            >
              <Text style={styles.gridItemText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Today Gentle Checklist */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TODAY</Text>
        <View style={styles.checklist}>
          {/* Check-in */}
          <View style={styles.checkRow}>
            <Text style={checklist.checkin ? styles.checkDone : styles.checkPending}>
              {checklist.checkin ? '✓' : '○'}
            </Text>
            <Text style={checklist.checkin ? styles.checkTextDone : styles.checkText}>
              Check-in
            </Text>
          </View>

          {/* One small action */}
          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => toggleChecklist('smallAction')}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="checkbox"
            accessibilityLabel="One small action"
            accessibilityHint="Toggle your one small action milestone for today"
            accessibilityState={{ checked: checklist.smallAction }}
          >
            <Text style={checklist.smallAction ? styles.checkDone : styles.checkPending}>
              {checklist.smallAction ? '✓' : '○'}
            </Text>
            <Text style={checklist.smallAction ? styles.checkTextDone : styles.checkText}>
              One small action
            </Text>
          </TouchableOpacity>

          {/* Evening reflection */}
          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => toggleChecklist('eveningReflection')}
            activeOpacity={0.7}
          >
            <Text style={checklist.eveningReflection ? styles.checkDone : styles.checkPending}>
              {checklist.eveningReflection ? '✓' : '○'}
            </Text>
            <Text
              style={checklist.eveningReflection ? styles.checkTextDone : styles.checkText}
            >
              Evening reflection
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  greetingSub: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  greetingMain: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: '700',
    color: theme.colors.text,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  moodItem: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  moodItemActive: {
    backgroundColor: theme.colors.primaryLight,
  },
  moodEmoji: {
    fontSize: 26,
    opacity: 0.6,
  },
  moodEmojiActive: {
    opacity: 1,
    transform: [{ scale: 1.15 }],
  },
  moodLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  moodLabelActive: {
    color: theme.colors.primaryDark,
    fontWeight: '700',
  },
  tagPickerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  tagPickerTitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  tagPill: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  tagPillActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  tagPillText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text,
  },
  tagPillTextActive: {
    color: theme.colors.primaryDark,
    fontWeight: '700',
  },
  card: {
    backgroundColor: theme.colors.surfaceSubtle,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    marginBottom: theme.spacing.lg,
  },
  loadingCard: {
    backgroundColor: theme.colors.surfaceSubtle,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  cardEyebrow: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.xs,
  },
  cardHeadline: {
    fontSize: theme.typography.sizes.md,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.sm,
    lineHeight: theme.typography.lineHeights.sm + 2,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  reasoningBadge: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  reasoningText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primaryDark,
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: theme.typography.sizes.sm,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  gridItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  gridItemText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  checklist: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs + 2,
  },
  checkDone: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '700',
    marginRight: theme.spacing.sm,
  },
  checkPending: {
    color: theme.colors.textMuted,
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
  checkTextDone: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    textDecorationLine: 'line-through',
  },
  checkText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
  },
});
