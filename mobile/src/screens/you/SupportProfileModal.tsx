import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../../theme';
import { useProfileStore } from '../../state/profileStore';

interface SupportProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SupportProfileModal: React.FC<SupportProfileModalProps> = ({
  visible,
  onClose,
}) => {
  const { profile, fetchProfile, updateProfile, addGoal, deleteGoal, isLoading } =
    useProfileStore();

  const [tone, setTone] = useState<'gentle' | 'practical' | 'casual'>('practical');
  const [language, setLanguage] = useState<'banglish' | 'en' | 'bn'>('banglish');
  const [preferredTypes, setPreferredTypes] = useState<string[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchProfile();
    }
  }, [visible, fetchProfile]);

  useEffect(() => {
    if (profile) {
      setTone(profile.communicationPreferences?.tone || 'practical');
      setLanguage(profile.communicationPreferences?.language || 'banglish');
      setPreferredTypes(profile.preferredInterventionTypes || []);
    }
  }, [profile]);

  const toggleInterventionType = (type: string) => {
    setPreferredTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateProfile({
        communicationPreferences: {
          tone,
          responseLength: 'short',
          language,
        },
        preferredInterventionTypes: preferredTypes as any,
      });
      setIsSaving(false);
      onClose();
    } catch {
      setIsSaving(false);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim()) return;
    await addGoal({ title: newGoalTitle.trim(), category: 'focus' });
    setNewGoalTitle('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Support Profile</Text>
              <Text style={styles.subtitle}>Adjust what works best for you</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {isLoading && !profile ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              {/* Communication Tone */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>COMMUNICATION TONE</Text>
                <View style={styles.pillRow}>
                  {[
                    { key: 'practical', label: 'Short & Practical' },
                    { key: 'gentle', label: 'Gentle & Reflective' },
                    { key: 'casual', label: 'Casual Friend' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={[styles.pill, tone === item.key && styles.pillActive]}
                      onPress={() => setTone(item.key as any)}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          tone === item.key && styles.pillTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Language Style */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>LANGUAGE PREFERENCE</Text>
                <View style={styles.pillRow}>
                  {[
                    { key: 'banglish', label: 'Banglish' },
                    { key: 'en', label: 'English' },
                    { key: 'bn', label: 'বাংলা' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.pill,
                        language === item.key && styles.pillActive,
                      ]}
                      onPress={() => setLanguage(item.key as any)}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          language === item.key && styles.pillTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Preferred Support / Interventions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>PREFERRED SUPPORT TYPES</Text>
                <View style={styles.gridRow}>
                  {[
                    { key: 'task_breakdown', label: '🎯 Task Breakdown' },
                    { key: 'breathing', label: '🫁 Breathing Reset' },
                    { key: 'physical', label: '🚶 Micro Walk / Move' },
                    { key: 'sensory_reset', label: '🌿 5-4-3-2-1 Grounding' },
                    { key: 'reflective', label: '📖 Private Journal' },
                  ].map((item) => {
                    const active = preferredTypes.includes(item.key);
                    return (
                      <TouchableOpacity
                        key={item.key}
                        style={[styles.typeChip, active && styles.typeChipActive]}
                        onPress={() => toggleInterventionType(item.key)}
                      >
                        <Text
                          style={[
                            styles.typeChipText,
                            active && styles.typeChipTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Daily Goals */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ACTIVE WELLBEING GOALS</Text>
                <View style={styles.goalList}>
                  {profile?.goals?.map((g) => (
                    <View key={g._id} style={styles.goalRow}>
                      <Text style={styles.goalTitle}>• {g.title}</Text>
                      <TouchableOpacity
                        onPress={() => deleteGoal(g._id)}
                        style={styles.deleteGoalBtn}
                      >
                        <Text style={styles.deleteGoalText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                {/* Add Goal Input */}
                <View style={styles.addGoalRow}>
                  <TextInput
                    style={styles.addGoalInput}
                    placeholder="Add a gentle goal (e.g. 5-min walk)..."
                    placeholderTextColor={theme.colors.textMuted}
                    value={newGoalTitle}
                    onChangeText={setNewGoalTitle}
                  />
                  <TouchableOpacity
                    style={styles.addGoalButton}
                    onPress={handleAddGoal}
                    disabled={!newGoalTitle.trim()}
                  >
                    <Text style={styles.addGoalButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Preferences</Text>
                )}
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
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: theme.spacing.xs,
  },
  closeText: {
    fontSize: 18,
    color: theme.colors.textMuted,
  },
  loadingBox: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  section: {
    gap: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: theme.colors.textSecondary,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  pill: {
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surface,
  },
  pillActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  pillText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
  },
  pillTextActive: {
    color: theme.colors.primaryDark,
    fontWeight: '700',
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  typeChip: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  typeChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  typeChipText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    fontWeight: '500',
  },
  typeChipTextActive: {
    color: theme.colors.primaryDark,
    fontWeight: '700',
  },
  goalList: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  goalTitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    flexShrink: 1,
  },
  deleteGoalBtn: {
    padding: theme.spacing.xs,
  },
  deleteGoalText: {
    color: theme.colors.secondary,
    fontSize: 14,
    fontWeight: '700',
  },
  addGoalRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  addGoalInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs + 2,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
  },
  addGoalButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
  },
  addGoalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: theme.typography.sizes.sm,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: theme.typography.sizes.md,
  },
});
