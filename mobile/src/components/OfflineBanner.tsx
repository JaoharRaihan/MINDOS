/**
 * OfflineBanner.tsx
 * Non-intrusive offline status indicator for MindOS.
 * Shows a calming reassurance banner when the user is offline,
 * and a gentle sync progress indicator when items are being uploaded.
 */
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../theme';
import { useNetworkStore } from '../state/networkStore';

export const OfflineBanner: React.FC = () => {
  const { isOnline, isSyncing, pendingQueueCount } = useNetworkStore();

  if (isOnline && !isSyncing) return null;

  return (
    <View
      style={[styles.banner, isSyncing ? styles.syncingBanner : styles.offlineBanner]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={
        isSyncing
          ? `Syncing ${pendingQueueCount} saved item${pendingQueueCount !== 1 ? 's' : ''} to your account`
          : 'Offline mode active. Your data is saved locally and will sync when reconnected.'
      }
    >
      {isSyncing ? (
        <View style={styles.row}>
          <ActivityIndicator size="small" color={theme.colors.primary} style={styles.spinner} />
          <Text style={styles.syncText}>
            ↑ Syncing {pendingQueueCount} saved item{pendingQueueCount !== 1 ? 's' : ''}...
          </Text>
        </View>
      ) : (
        <Text style={styles.offlineText}>
          🌿 Offline Mode — All your check-ins and reflections are saved locally and will sync when reconnected.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBanner: {
    backgroundColor: theme.colors.surfaceHighlight,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  syncingBanner: {
    backgroundColor: theme.colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  spinner: {
    marginRight: 4,
  },
  offlineText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 15,
  },
  syncText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
