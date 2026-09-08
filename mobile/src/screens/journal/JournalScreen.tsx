import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../../theme';
import { useJournalStore } from '../../state/journalStore';

interface JournalScreenProps {
  onNavigateToTalk?: (initialContext?: string) => void;
}

export const JournalScreen: React.FC<JournalScreenProps> = ({ onNavigateToTalk }) => {
  const [entryText, setEntryText] = useState('');
  const [journalType, setJournalType] = useState<'text' | 'voice'>('text');
  const [isRecording, setIsRecording] = useState(false);

  const {
    entries,
    activeReflection,
    isLoading,
    isSaving,
    fetchEntries,
    createEntry,
    deleteEntry,
    clearActiveReflection,
  } = useJournalStore();

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleSave = async () => {
    if (!entryText.trim()) return;
    try {
      await createEntry(entryText.trim(), journalType);
      setEntryText('');
    } catch {
      // Error handled in store
    }
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      // Simulated voice memo transcription for Banglish demo
      setEntryText((prev) =>
        prev
          ? `${prev}\n[Voice note: Ajke amar mon ta kharap, kono kisu korte iccha kortese na.]`
          : 'Ajke amar mon ta kharap, kono kisu korte iccha kortese na.'
      );
    } else {
      setIsRecording(true);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Private Journal</Text>
        <Text style={styles.subtitle}>
          A quiet space to let your thoughts land. Private by default.
        </Text>
      </View>

      {/* Privacy Guarantee Pill */}
      <View style={styles.privacyBanner}>
        <Text style={styles.privacyIcon}>🔒</Text>
        <Text style={styles.privacyText}>
          Your words are completely private. MindOS never shares journal thoughts without your explicit permission.
        </Text>
      </View>

      {/* Type Switcher: Text vs Voice */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[styles.tabButton, journalType === 'text' && styles.tabButtonActive]}
          onPress={() => setJournalType('text')}
        >
          <Text
            style={[styles.tabButtonText, journalType === 'text' && styles.tabButtonTextActive]}
          >
            ✍️ Text Journal
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, journalType === 'voice' && styles.tabButtonActive]}
          onPress={() => setJournalType('voice')}
        >
          <Text
            style={[styles.tabButtonText, journalType === 'voice' && styles.tabButtonTextActive]}
          >
            🎙️ Voice Memo
          </Text>
        </TouchableOpacity>
      </View>

      {/* Voice Memo Recording Area */}
      {journalType === 'voice' && (
        <View style={styles.voiceCard}>
          <Text style={styles.voiceTitle}>
            {isRecording ? 'Listening in Banglish / Bangla...' : 'Speak freely'}
          </Text>
          <Text style={styles.voiceSubtitle}>
            {isRecording
              ? 'Tap to finish voice note'
              : 'Record a quick thought when typing feels like too much effort'}
          </Text>
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
            onPress={handleVoiceToggle}
            activeOpacity={0.8}
          >
            <Text style={styles.recordButtonIcon}>{isRecording ? '⏹' : '🎙️'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Journal Input Area */}
      <TextInput
        style={styles.journalInput}
        multiline
        placeholder="Write what you are going through (in Banglish, English, or Bangla)..."
        placeholderTextColor={theme.colors.textMuted}
        value={entryText}
        onChangeText={setEntryText}
      />

      {/* Save Button */}
      <TouchableOpacity
        style={[
          styles.saveButton,
          (!entryText.trim() || isSaving) && styles.saveButtonDisabled,
        ]}
        disabled={!entryText.trim() || isSaving}
        onPress={handleSave}
        activeOpacity={0.8}
      >
        {isSaving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save Entry Privately</Text>
        )}
      </TouchableOpacity>

      {/* AI Reflection Card */}
      {activeReflection && (
        <View style={styles.reflectionCard}>
          <View style={styles.reflectionHeader}>
            <Text style={styles.reflectionEyebrow}>AI REFLECTION</Text>
            <TouchableOpacity onPress={clearActiveReflection} style={styles.dismissBtn}>
              <Text style={styles.dismissBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.reflectionText}>{activeReflection.text}</Text>
          {activeReflection.suggestedExploration && (
            <Text style={styles.reflectionPrompt}>
              "{activeReflection.suggestedExploration}"
            </Text>
          )}
          <View style={styles.reflectionActions}>
            <TouchableOpacity
              style={styles.actionPill}
              onPress={() => {
                if (onNavigateToTalk) {
                  onNavigateToTalk(
                    `In my journal, I wrote about feeling this way: ${activeReflection.text}`
                  );
                }
              }}
            >
              <Text style={styles.actionPillText}>Explore</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionPill, styles.actionPillSecondary]}
              onPress={clearActiveReflection}
            >
              <Text style={styles.actionPillTextSecondary}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Past Entries Section */}
      <View style={styles.pastSection}>
        <Text style={styles.sectionTitle}>PAST REFLECTIONS</Text>
        {isLoading && entries.length === 0 ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 20 }} />
        ) : entries.length === 0 ? (
          <Text style={styles.emptyText}>
            No entries yet. Your private thoughts will appear here safely.
          </Text>
        ) : (
          <View style={styles.entriesList}>
            {entries.map((item) => (
              <View key={item._id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryDate}>
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <TouchableOpacity
                    onPress={() => deleteEntry(item._id)}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.entryContent}>{item.content}</Text>
                {item.aiReflection && (
                  <View style={styles.entryReflectionBox}>
                    <Text style={styles.entryReflectionText}>
                      🌿 {item.aiReflection.text}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
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
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm + 2,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  privacyIcon: {
    fontSize: 16,
  },
  privacyText: {
    flex: 1,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 3,
    marginBottom: theme.spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: theme.spacing.xs + 2,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primaryLight,
  },
  tabButtonText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  tabButtonTextActive: {
    color: theme.colors.primaryDark,
  },
  voiceCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  voiceTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: '700',
    color: theme.colors.text,
  },
  voiceSubtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  recordButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: theme.colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonActive: {
    backgroundColor: theme.colors.secondaryLight,
    borderColor: theme.colors.secondary,
  },
  recordButtonIcon: {
    fontSize: 22,
  },
  journalInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    minHeight: 140,
    fontSize: theme.typography.sizes.md,
    lineHeight: theme.typography.lineHeights.md,
    color: theme.colors.text,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.md,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md - 2,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: theme.typography.sizes.sm,
  },
  reflectionCard: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  reflectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  reflectionEyebrow: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: theme.colors.secondary,
  },
  dismissBtn: {
    padding: 2,
  },
  dismissBtnText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  reflectionText: {
    fontSize: theme.typography.sizes.md,
    lineHeight: theme.typography.lineHeights.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  reflectionPrompt: {
    fontSize: theme.typography.sizes.sm,
    fontStyle: 'italic',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  reflectionActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionPill: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  actionPillSecondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionPillText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: theme.typography.sizes.xs,
  },
  actionPillTextSecondary: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
    fontSize: theme.typography.sizes.xs,
  },
  pastSection: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: theme.colors.textSecondary,
  },
  emptyText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
  },
  entriesList: {
    gap: theme.spacing.sm,
  },
  entryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryDate: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 2,
  },
  deleteBtnText: {
    fontSize: 14,
  },
  entryContent: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    lineHeight: 18,
  },
  entryReflectionBox: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.xs + 2,
    marginTop: 4,
  },
  entryReflectionText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
});
