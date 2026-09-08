import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../../theme';
import { usePrivacyStore } from '../../state/privacyStore';
import { useAuthStore } from '../../state/authStore';

interface PrivacySettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenMemories: () => void;
}

export const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({
  visible,
  onClose,
  onOpenMemories,
}) => {
  const { aiMemoryEnabled, toggleAIMemory, exportData, deleteAccount, isExporting, isDeletingAccount } =
    usePrivacyStore();
  const { logout } = useAuthStore();

  const [exportPreview, setExportPreview] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      const data = await exportData();
      const summaryText = `Export ready! Captured:\n• ${data.checkins?.length || 0} Check-ins\n• ${data.journalEntries?.length || 0} Journal entries\n• ${data.interventionSessions?.length || 0} Interventions\n• ${data.aiMemories?.length || 0} Stored memories\n• Timestamp: ${new Date(data.exportedAt).toLocaleString()}`;
      setExportPreview(summaryText);
      Alert.alert('Data Export Generated', summaryText);
    } catch {
      Alert.alert('Error', 'Could not generate data export at this time.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete All Data & Account',
      'This will permanently erase all your personal records, reflections, check-ins, and memories from MindOS. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              onClose();
              await logout();
              Alert.alert('Data Deleted', 'All your personal data was completely deleted.');
            } catch {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>DATA & PRIVACY</Text>
              </View>
              <Text style={styles.title}>Privacy & Sharing Settings</Text>
              <Text style={styles.subtitle}>
                You own all your reflections and patterns. MindOS does not share or sell your data to third parties.
              </Text>
            </View>

            {/* Section 1: AI Memory Controls */}
            <View style={styles.sectionCard}>
              <Text style={styles.cardHeading}>AI MEMORY RETENTION</Text>
              <View style={styles.row}>
                <View style={styles.rowTextCol}>
                  <Text style={styles.rowTitle}>Learn and recall preferences</Text>
                  <Text style={styles.rowSub}>
                    When active, MindOS remembers small details about routines to personalize next steps.
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    aiMemoryEnabled ? styles.toggleOn : styles.toggleOff,
                  ]}
                  onPress={() => toggleAIMemory(!aiMemoryEnabled)}
                >
                  <Text style={[styles.toggleBtnText, aiMemoryEnabled ? styles.toggleOnText : styles.toggleOffText]}>
                    {aiMemoryEnabled ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.linkRow} onPress={onOpenMemories}>
                <Text style={styles.linkText}>View & Manage Stored Memories ›</Text>
              </TouchableOpacity>
            </View>

            {/* Section 2: Data Export */}
            <View style={styles.sectionCard}>
              <Text style={styles.cardHeading}>YOUR DATA PORTABILITY</Text>
              <Text style={styles.cardDesc}>
                Download a clean, structured JSON file of all your check-ins, journal entries, rhythms, and interventions.
              </Text>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleExport}
                disabled={isExporting}
                activeOpacity={0.8}
              >
                {isExporting ? (
                  <ActivityIndicator color={theme.colors.primary} size="small" />
                ) : (
                  <Text style={styles.actionBtnText}>Export All My Data (JSON)</Text>
                )}
              </TouchableOpacity>
              {exportPreview && (
                <View style={styles.previewBox}>
                  <Text style={styles.previewText}>{exportPreview}</Text>
                </View>
              )}
            </View>

            {/* Section 3: Permanent Data Deletion */}
            <View style={[styles.sectionCard, styles.dangerCard]}>
              <Text style={[styles.cardHeading, { color: theme.colors.secondary }]}>
                DANGER ZONE
              </Text>
              <Text style={styles.cardDesc}>
                Permanently purge all data from the database. No copies or archives are retained.
              </Text>
              <TouchableOpacity
                style={styles.dangerBtn}
                onPress={handleDeleteAccount}
                disabled={isDeletingAccount}
                activeOpacity={0.8}
              >
                {isDeletingAccount ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.dangerBtnText}>Permanently Delete All Data</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>Close</Text>
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
    maxHeight: '90%',
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    marginBottom: theme.spacing.lg,
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
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  dangerCard: {
    borderColor: 'rgba(230, 100, 100, 0.4)',
    backgroundColor: 'rgba(255, 240, 240, 0.4)',
  },
  cardHeading: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  cardDesc: {
    fontSize: theme.typography.sizes.xs + 1,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },
  rowTextCol: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  rowTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  rowSub: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  toggleBtn: {
    paddingVertical: 5,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  toggleOn: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  toggleOff: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.border,
  },
  toggleBtnText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
  },
  toggleOnText: {
    color: '#FFFFFF',
  },
  toggleOffText: {
    color: theme.colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  linkRow: {
    paddingVertical: 4,
  },
  linkText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  actionBtn: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    fontWeight: '600',
  },
  previewBox: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  previewText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  dangerBtn: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  dangerBtnText: {
    fontSize: theme.typography.sizes.sm,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  closeBtn: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: theme.spacing.sm,
  },
  closeBtnText: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: theme.typography.sizes.sm,
  },
});
