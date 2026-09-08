import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { theme } from '../../theme';
import { usePrivacyStore, MemoryType } from '../../state/privacyStore';

interface MemoryManagerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const MemoryManagerModal: React.FC<MemoryManagerModalProps> = ({
  visible,
  onClose,
}) => {
  const {
    memories,
    aiMemoryEnabled,
    isLoading,
    fetchMemories,
    addMemory,
    forgetMemory,
    toggleAIMemory,
  } = usePrivacyStore();

  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<MemoryType>('preference');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchMemories();
    }
  }, [visible, fetchMemories]);

  const handleAddMemory = async () => {
    if (!newContent.trim()) return;
    try {
      setIsAdding(true);
      await addMemory(newType, newContent.trim());
      setNewContent('');
    } catch (err: any) {
      Alert.alert('Notice', err?.message || 'Could not save memory');
    } finally {
      setIsAdding(false);
    }
  };

  const handleForget = (id: string, content: string) => {
    Alert.alert(
      'Forget Memory',
      `Are you sure you want MindOS to forget this?\n\n"${content}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Forget',
          style: 'destructive',
          onPress: () => forgetMemory(id),
        },
      ]
    );
  };

  const typeLabels: Record<MemoryType, string> = {
    preference: 'PREFERENCE',
    routine: 'ROUTINE',
    goal: 'GOAL',
    helpful_strategy: 'STRATEGY',
    user_context: 'CONTEXT',
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>TRANSPARENT AI MEMORY</Text>
              </View>
              <Text style={styles.title}>Stored Context & Memories</Text>
              <Text style={styles.subtitle}>
                MindOS keeps small notes about your routines and preferences so you don't have to repeat yourself. You have 100% control to view, add, or forget any memory.
              </Text>
            </View>

            {/* Retention Master Toggle */}
            <View style={styles.toggleCard}>
              <View style={styles.toggleTextCol}>
                <Text style={styles.toggleTitle}>AI Memory Retention</Text>
                <Text style={styles.toggleSub}>
                  {aiMemoryEnabled
                    ? 'Active: Learning from your check-ins and reflections.'
                    : 'Paused: MindOS will not store any new memories.'}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  aiMemoryEnabled ? styles.toggleActive : styles.toggleInactive,
                ]}
                onPress={() => toggleAIMemory(!aiMemoryEnabled)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    aiMemoryEnabled ? styles.toggleActiveText : styles.toggleInactiveText,
                  ]}
                >
                  {aiMemoryEnabled ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Manual Memory Input */}
            <View style={styles.addCard}>
              <Text style={styles.sectionHeading}>ADD A PERSONAL CONTEXT NOTE</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Preparing for engineering exams in Dhaka..."
                placeholderTextColor={theme.colors.textMuted}
                value={newContent}
                onChangeText={setNewContent}
                maxLength={500}
                multiline
              />
              <View style={styles.typeRow}>
                {(['preference', 'routine', 'goal', 'user_context'] as MemoryType[]).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typePill, newType === t && styles.typePillActive]}
                    onPress={() => setNewType(t)}
                  >
                    <Text
                      style={[
                        styles.typePillText,
                        newType === t && styles.typePillTextActive,
                      ]}
                    >
                      {t.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddMemory}
                disabled={isAdding || !newContent.trim()}
                activeOpacity={0.8}
              >
                {isAdding ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.addButtonText}>Remember Note</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Memory List */}
            <View style={styles.listSection}>
              <Text style={styles.sectionHeading}>
                ACTIVE MEMORIES ({memories.length})
              </Text>
              {isLoading && memories.length === 0 ? (
                <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: theme.spacing.lg }} />
              ) : memories.length === 0 ? (
                <Text style={styles.emptyText}>No memories stored yet.</Text>
              ) : (
                memories.map((mem) => (
                  <View key={mem._id} style={styles.memoryCard}>
                    <View style={styles.memoryHeader}>
                      <View style={styles.memoryBadge}>
                        <Text style={styles.memoryBadgeText}>
                          {typeLabels[mem.type] || mem.type.toUpperCase()}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleForget(mem._id, mem.content)}
                        activeOpacity={0.7}
                        style={styles.forgetButton}
                      >
                        <Text style={styles.forgetText}>Forget ✕</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.memoryContent}>{mem.content}</Text>
                  </View>
                ))
              )}
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
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
    maxHeight: '92%',
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
    fontSize: theme.typography.sizes.xs + 1,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  toggleTextCol: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  toggleTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  toggleSub: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  toggleButton: {
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  toggleActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  toggleInactive: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.border,
  },
  toggleButtonText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
  },
  toggleActiveText: {
    color: '#FFFFFF',
  },
  toggleInactiveText: {
    color: theme.colors.textMuted,
  },
  addCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  sectionHeading: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 55,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.xs,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  typePill: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingVertical: 3,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  typePillActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  typePillText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  typePillTextActive: {
    color: theme.colors.primaryDark,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: theme.typography.sizes.sm,
  },
  listSection: {
    marginBottom: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: theme.spacing.md,
  },
  memoryCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xs + 2,
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  memoryBadge: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  memoryBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.secondary,
    letterSpacing: 0.5,
  },
  forgetButton: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  forgetText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  memoryContent: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeights.sm + 2,
  },
  closeButton: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  closeButtonText: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: theme.typography.sizes.sm,
  },
});
