import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { theme } from '../../theme';
import { useAuthStore } from '../../state/authStore';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigateToLogin }) => {
  const [name, setName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [languagePreference, setLanguagePreference] = useState<'banglish' | 'en' | 'bn'>('banglish');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { register, isLoading } = useAuthStore();

  const handleRegister = async () => {
    setErrorMessage(null);
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Please fill in your name, email, and password.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    try {
      await register({
        name: name.trim(),
        preferredName: preferredName.trim() || undefined,
        email: email.trim(),
        password,
        languagePreference,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.logoBadge}>🌿 MindOS</Text>
          <Text style={styles.title}>Start your space.</Text>
          <Text style={styles.subtitle}>
            We're here to learn what works for you. No labels, no judgment.
          </Text>
        </View>

        {errorMessage && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Raihan Ahmed"
              placeholderTextColor={theme.colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>What should we call you? (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Raihan"
              placeholderTextColor={theme.colors.textMuted}
              value={preferredName}
              onChangeText={setPreferredName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={theme.colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password (8+ characters)</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Language preference selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Preferred Language Style</Text>
            <View style={styles.langRow}>
              {[
                { key: 'banglish', label: 'Banglish' },
                { key: 'en', label: 'English' },
                { key: 'bn', label: 'বাংলা' },
              ].map((lang) => (
                <TouchableOpacity
                  key={lang.key}
                  style={[
                    styles.langPill,
                    languagePreference === lang.key && styles.langPillActive,
                  ]}
                  onPress={() => setLanguagePreference(lang.key as any)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.langPillText,
                      languagePreference === lang.key && styles.langPillTextActive,
                    ]}
                  >
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            disabled={isLoading}
            onPress={handleRegister}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={onNavigateToLogin}>
            <Text style={styles.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  logoBadge: {
    fontSize: theme.typography.sizes.md,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.sizes.display - 6,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    lineHeight: theme.typography.lineHeights.sm + 4,
    color: theme.colors.textSecondary,
  },
  errorBox: {
    backgroundColor: theme.colors.secondaryLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.secondary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: '500',
  },
  form: {
    gap: theme.spacing.md,
  },
  inputGroup: {
    gap: theme.spacing.xs,
  },
  inputLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: '600',
    color: theme.colors.text,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md - 4,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  langRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  langPill: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  langPillActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  langPillText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  langPillTextActive: {
    color: theme.colors.primaryDark,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: theme.typography.sizes.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
  },
  footerText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  footerLink: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
