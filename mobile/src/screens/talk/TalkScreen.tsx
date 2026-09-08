import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { theme } from '../../theme';
import { useTalkStore } from '../../state/talkStore';
import { useInterventionStore } from '../../state/interventionStore';

export const TalkScreen: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const {
    messages,
    isLoadingHistory,
    isSending,
    fetchHistory,
    sendMessage,
    resetSession,
  } = useTalkStore();

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    // Auto scroll to latest message
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isSending]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isSending) return;
    setInputText('');
    await sendMessage(text.trim());
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      // Simulated voice dictation in Banglish
      const transcribed = 'bhai amar mathay onk kichu choltesey, porte boshte partesi na.';
      setInputText(transcribed);
    } else {
      setIsRecording(true);
    }
  };

  const banglishSuggestions = [
    'porte boshte partesi na',
    'mathay onk kichu choltesey',
    'family niye pressure',
    'chakri niye tension',
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Header with session reset */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Companion</Text>
          <Text style={styles.subtitle}>Natural Banglish, English, or Bangla</Text>
        </View>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => resetSession()}
          activeOpacity={0.7}
        >
          <Text style={styles.resetText}>New Session 🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Suggested prompts row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.suggestionsRow}
      >
        {banglishSuggestions.map((prompt, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.suggestionPill}
            activeOpacity={0.7}
            onPress={() => handleSend(prompt)}
          >
            <Text style={styles.suggestionText}>💬 "{prompt}"</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Messages Thread */}
      {isLoadingHistory && messages.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
        >
          {messages.map((msg, idx) => (
            <View
              key={msg._id || idx}
              style={[
                styles.bubble,
                msg.sender === 'user' ? styles.userBubble : styles.aiBubble,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  msg.sender === 'user' ? styles.userBubbleText : styles.aiBubbleText,
                ]}
              >
                {msg.text}
              </Text>

              {/* Action Options Pills */}
              {msg.options && msg.options.length > 0 && (
                <View style={styles.optionsRow}>
                  {msg.options.map((opt, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.optionPill}
                      activeOpacity={0.7}
                      onPress={() => handleSend(opt)}
                    >
                      <Text style={styles.optionPillText}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Immediate Suggested Actions (Emergency Call / Interventions) */}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <View style={styles.actionsRow}>
                  {msg.suggestedActions.map((action, i) => {
                    const isEmergency = action.actionType === 'emergency_call';
                    return (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.actionPill,
                          isEmergency ? styles.emergencyPill : styles.interventionPill,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          if (isEmergency && action.payload) {
                            Linking.openURL(`tel:${action.payload}`);
                          } else if (action.actionType === 'breathing' || action.actionType === 'task_breakdown') {
                            useInterventionStore
                              .getState()
                              .startBySlug(action.payload || 'box-breathing', 'talk_suggestion');
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.actionPillText,
                            isEmergency ? styles.emergencyPillText : styles.interventionPillText,
                          ]}
                        >
                          {isEmergency ? '📞 ' : '⚡ '}
                          {action.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          ))}

          {isSending && (
            <View style={[styles.bubble, styles.aiBubble, styles.typingBubble]}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.typingText}>MindOS is listening...</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Voice Dictation Active Notice */}
      {isRecording && (
        <View style={styles.recordingBanner}>
          <Text style={styles.recordingText}>🎙️ Listening in Banglish/English... Tap mic to finish.</Text>
        </View>
      )}

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={[styles.micButton, isRecording && styles.micButtonActive]}
          onPress={handleVoiceToggle}
          activeOpacity={0.7}
        >
          <Text style={styles.micIcon}>{isRecording ? '⏹' : '🎙️'}</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          placeholder="Speak or type naturally..."
          placeholderTextColor={theme.colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || isSending) && styles.sendButtonDisabled,
          ]}
          disabled={!inputText.trim() || isSending}
          onPress={() => handleSend()}
          activeOpacity={0.8}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  resetButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  resetText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  suggestionsRow: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs + 2,
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.background,
  },
  suggestionPill: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm + 2,
    borderRadius: theme.borderRadius.full,
  },
  suggestionText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  bubble: {
    maxWidth: '85%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
  },
  bubbleText: {
    fontSize: theme.typography.sizes.md,
    lineHeight: theme.typography.lineHeights.md,
  },
  aiBubbleText: {
    color: theme.colors.text,
  },
  userBubbleText: {
    color: '#FFFFFF',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  optionPill: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  optionPillText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  typingText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  recordingBanner: {
    backgroundColor: theme.colors.secondaryLight,
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  recordingText: {
    fontSize: 11,
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  micButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonActive: {
    backgroundColor: theme.colors.secondaryLight,
    borderColor: theme.colors.secondary,
  },
  micIcon: {
    fontSize: 16,
  },
  textInput: {
    flex: 1,
    maxHeight: 90,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs + 2,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.xs + 4,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: theme.typography.sizes.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  actionPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyPill: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  interventionPill: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.primary,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emergencyPillText: {
    color: '#DC2626',
    fontWeight: '700',
  },
  interventionPillText: {
    color: theme.colors.primary,
  },
});
