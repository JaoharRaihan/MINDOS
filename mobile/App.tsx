import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { theme } from './src/theme';
import { HomeScreen } from './src/screens/home/HomeScreen';
import { TalkScreen } from './src/screens/talk/TalkScreen';
import { JournalScreen } from './src/screens/journal/JournalScreen';
import { YouScreen } from './src/screens/you/YouScreen';
import { HelpMeNowModal } from './src/screens/helpMeNow/HelpMeNowModal';
import { InterventionPlayerModal } from './src/screens/interventions/InterventionPlayerModal';
import { DidItHelpModal } from './src/screens/interventions/DidItHelpModal';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { RegisterScreen } from './src/screens/auth/RegisterScreen';
import { OnboardingScreen } from './src/screens/onboarding/OnboardingScreen';
import { useAuthStore } from './src/state/authStore';

type Tab = 'home' | 'talk' | 'journal' | 'you';
type AuthView = 'login' | 'register';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');

  const { isAuthenticated, isLoading, checkAuth, user } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // If not authenticated, render auth flow
  if (!isAuthenticated) {
    if (authView === 'register') {
      return <RegisterScreen onNavigateToLogin={() => setAuthView('login')} />;
    }
    return <LoginScreen onNavigateToRegister={() => setAuthView('register')} />;
  }

  // If authenticated but onboarding not completed, render onboarding
  if (!user?.onboardingCompleted) {
    return <OnboardingScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Top Bar with Brand & Urgent Help Trigger */}
      <View style={styles.topBar}>
        <View style={styles.brandGroup}>
          <Text style={styles.brandTitle}>MindOS</Text>
          {user?.preferredName && (
            <Text style={styles.userBadge}>for {user.preferredName}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.helpButton}
          activeOpacity={0.8}
          onPress={() => setHelpModalVisible(true)}
        >
          <Text style={styles.helpButtonText}>Help Me Now</Text>
        </TouchableOpacity>
      </View>

      {/* Screen Container */}
      <View style={styles.screenContainer}>
        {activeTab === 'home' && <HomeScreen onNavigateToTab={(tab) => setActiveTab(tab)} />}
        {activeTab === 'talk' && <TalkScreen />}
        {activeTab === 'journal' && <JournalScreen onNavigateToTalk={() => setActiveTab('talk')} />}
        {activeTab === 'you' && <YouScreen />}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {[
          { key: 'home', label: 'Home', icon: '🏠' },
          { key: 'talk', label: 'Talk', icon: '💬' },
          { key: 'journal', label: 'Journal', icon: '📖' },
          { key: 'you', label: 'You', icon: '🌿' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.navItem}
              activeOpacity={0.7}
              onPress={() => setActiveTab(tab.key as Tab)}
            >
              <Text style={[styles.navIcon, isActive && styles.navIconActive]}>
                {tab.icon}
              </Text>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Persistent Help Me Now Modal */}
      <HelpMeNowModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        onNavigateToTab={(tab) => {
          setHelpModalVisible(false);
          setActiveTab(tab);
        }}
      />

      {/* Controlled Intervention Engine Player */}
      <InterventionPlayerModal />

      {/* Post-Intervention Feedback Loop Modal */}
      <DidItHelpModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.xs,
  },
  brandTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  userBadge: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  helpButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  helpButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: theme.typography.sizes.xs,
    letterSpacing: 0.5,
  },
  screenContainer: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: theme.spacing.xs,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  navIcon: {
    fontSize: 20,
    opacity: 0.5,
    marginBottom: 2,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  navLabelActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});

export default App;
