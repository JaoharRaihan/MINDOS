import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../../theme';
import { useAuthStore } from '../../state/authStore';
import { usePatternStore, PersonalPlaybook } from '../../state/patternStore';
import { usePrivacyStore } from '../../state/privacyStore';
import { SupportProfileModal } from './SupportProfileModal';
import { PlaybookModal } from './PlaybookModal';
import { MemoryManagerModal } from './MemoryManagerModal';
import { PrivacySettingsModal } from './PrivacySettingsModal';

export const YouScreen: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { patterns, playbooks, isLoading, fetchPatterns } = usePatternStore();
  const { memories, fetchMemories } = usePrivacyStore();

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedPlaybook, setSelectedPlaybook] = useState<PersonalPlaybook | null>(null);
  const [memoryModalVisible, setMemoryModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

  useEffect(() => {
    fetchPatterns();
    fetchMemories();
  }, [fetchPatterns, fetchMemories]);

  const helpfulStrategies = patterns?.helpfulStrategies || [
    { interventionSlug: 'five-minute-start', name: 'Breaking large tasks', score: 8, totalSessions: 0 },
    { interventionSlug: 'micro-walk-hydration', name: 'Short walk & hydration', score: 7, totalSessions: 0 },
    { interventionSlug: 'box-breathing', name: '4x4 Box Breathing', score: 6, totalSessions: 0 },
    { interventionSlug: 'wind-down-478', name: 'Wind Down 4-7-8', score: 5, totalSessions: 0 },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{user?.preferredName || user?.name || 'You'}</Text>
        <Text style={styles.subtitle}>
          {user?.email ? `${user.email} • ` : ''}Your personal understanding and rhythms space.
        </Text>
      </View>

      {/* 1. What seems to help you */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>WHAT SEEMS TO HELP YOU</Text>
        <View style={styles.card}>
          {isLoading && !patterns ? (
            <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: theme.spacing.md }} />
          ) : (
            helpfulStrategies.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemScore}>{item.score}/10</Text>
                </View>
                {/* Progress Bar */}
                <View style={styles.barBackground}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${item.score * 10}%`,
                        backgroundColor:
                          item.score >= 7
                            ? theme.colors.primary
                            : item.score >= 5
                            ? theme.colors.accentGold
                            : theme.colors.secondary,
                      },
                    ]}
                  />
                </View>
              </View>
            ))
          )}
          <Text style={styles.disclaimer}>
            "These ratings are learned empirically from your self-reported feedback, not medical conclusions."
          </Text>
        </View>
      </View>

      {/* 2. Observed Rhythms & Patterns */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>OBSERVED RHYTHMS & PATTERNS</Text>
        <View style={styles.card}>
          {/* Sleep vs Energy */}
          <View style={styles.patternItem}>
            <Text style={styles.patternLabel}>🌙 SLEEP & STAMINA</Text>
            <Text style={styles.patternText}>
              {patterns?.sleepEnergy.observation ||
                'Your stress reports tend to be higher following shorter sleep nights.'}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Contextual Triggers */}
          <View style={styles.patternItem}>
            <Text style={styles.patternLabel}>🎯 OVERWHELM CONTEXT</Text>
            <Text style={styles.patternText}>
              {patterns?.overwhelmContext.observation ||
                'You seem to start tasks more easily when they are broken into small 5-minute steps.'}
            </Text>
            {patterns?.overwhelmContext.topTriggers && patterns.overwhelmContext.topTriggers.length > 0 && (
              <View style={styles.tagsContainer}>
                {patterns.overwhelmContext.topTriggers.map((t) => (
                  <View key={t.tag} style={styles.triggerTag}>
                    <Text style={styles.triggerTagText}>
                      {t.tag} ({t.percentage}%)
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Time of Day */}
          <View style={styles.patternItem}>
            <Text style={styles.patternLabel}>⏰ TIME OF DAY VULNERABILITY</Text>
            <Text style={styles.patternText}>
              {patterns?.timeOfDayRhythms.observation ||
                'Moments of fatigue appear evenly distributed throughout the day.'}
            </Text>
          </View>
        </View>
      </View>

      {/* 3. Personal Playbooks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>YOUR PERSONAL PLAYBOOKS</Text>
        <View style={styles.playbooksGrid}>
          {playbooks.map((playbook) => (
            <TouchableOpacity
              key={playbook.id}
              style={styles.playbookCard}
              activeOpacity={0.7}
              onPress={() => setSelectedPlaybook(playbook)}
            >
              <View style={styles.playbookHeader}>
                <Text style={styles.playbookTitle}>{playbook.title}</Text>
                <Text style={styles.playbookArrow}>›</Text>
              </View>
              <Text style={styles.playbookSubtitle} numberOfLines={2}>
                {playbook.subtitle}
              </Text>
              <View style={styles.playbookFooter}>
                <Text style={styles.playbookIntervention}>
                  ⚡ {playbook.recommendedInterventionTitle} ({playbook.durationMinutes}m)
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 4. Support Profile & Privacy Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SUPPORT PROFILE & PRIVACY</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.controlRow}
            onPress={() => setProfileModalVisible(true)}
          >
            <Text style={styles.controlLabel}>Support Profile & Rhythms</Text>
            <Text style={styles.controlArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.controlRow}
            onPress={() => setMemoryModalVisible(true)}
          >
            <Text style={styles.controlLabel}>
              View & Manage Stored Memories ({memories.length})
            </Text>
            <Text style={styles.controlArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.controlRow}
            onPress={() => setPrivacyModalVisible(true)}
          >
            <Text style={styles.controlLabel}>Privacy & Sharing Settings</Text>
            <Text style={styles.controlArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.controlRow}
            onPress={() => setPrivacyModalVisible(true)}
          >
            <Text style={[styles.controlLabel, { color: theme.colors.secondary }]}>
              Export or Delete All Data
            </Text>
            <Text style={styles.controlArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.controlRow} onPress={() => logout()}>
            <Text style={[styles.controlLabel, { color: theme.colors.textMuted }]}>
              Sign Out
            </Text>
            <Text style={styles.controlArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modals */}
      <SupportProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
      />

      <PlaybookModal
        visible={Boolean(selectedPlaybook)}
        playbook={selectedPlaybook}
        onClose={() => setSelectedPlaybook(null)}
      />

      <MemoryManagerModal
        visible={memoryModalVisible}
        onClose={() => setMemoryModalVisible(false)}
      />

      <PrivacySettingsModal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
        onOpenMemories={() => {
          setPrivacyModalVisible(false);
          setMemoryModalVisible(true);
        }}
      />
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
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  itemRow: {
    marginBottom: theme.spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  itemName: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: '600',
    color: theme.colors.text,
  },
  itemScore: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  barBackground: {
    height: 8,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  disclaimer: {
    fontSize: theme.typography.sizes.xs,
    fontStyle: 'italic',
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  patternItem: {
    paddingVertical: theme.spacing.xs,
  },
  patternLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  patternText: {
    fontSize: theme.typography.sizes.sm,
    lineHeight: theme.typography.lineHeights.sm + 2,
    color: theme.colors.text,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  triggerTag: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.xs + 2,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  triggerTagText: {
    fontSize: 10,
    color: theme.colors.primaryDark,
    fontWeight: '600',
  },
  playbooksGrid: {
    gap: theme.spacing.sm,
  },
  playbookCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  playbookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  playbookTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: '700',
    color: theme.colors.text,
  },
  playbookArrow: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.textMuted,
  },
  playbookSubtitle: {
    fontSize: theme.typography.sizes.xs + 1,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: theme.spacing.sm,
  },
  playbookFooter: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surfaceSubtle,
    paddingVertical: 3,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  playbookIntervention: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primaryDark,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  controlLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    fontWeight: '500',
  },
  controlArrow: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
});
