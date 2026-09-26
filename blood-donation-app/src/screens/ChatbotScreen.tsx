import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Header } from '../components/ui/Header';
import { chatbotService } from '../services/chatbotService';
import { Colors } from '../constants/colors';
import { Spacing, BorderRadius } from '../constants/spacing';
import { TextStyles, FontWeights } from '../constants/typography';

interface ChatBubble {
  id: string;
  from: 'user' | 'bot';
  text: string;
}

const SUGGESTIONS = ['Who can donate to O+?', 'How do I request blood?', 'What should I expect when donating?'];

export const ChatbotScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatBubble[]>([
    {
      id: 'welcome',
      from: 'bot',
      text: "Hi! I'm the Blood Donation Assistant 🤖. Ask me about blood compatibility, eligibility, or the donation process.",
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatBubble = { id: `u-${Date.now()}`, from: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const history = messages
        .filter((message) => message.id !== 'welcome')
        .slice(-10)
        .map((message) => ({
          role: message.from === 'bot' ? 'assistant' as const : 'user' as const,
          content: message.text,
        }));
      const res = await chatbotService.ask(trimmed, history);
      const botMsg: ChatBubble = { id: `b-${Date.now()}`, from: 'bot', text: res.reply };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, from: 'bot', text: 'Sorry, I could not reach the server. Please try again.' },
      ]);
    } finally {
      setSending(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <View style={styles.headerWrap}>
        <Header title="🤖 Donation Assistant" subtitle="App help and blood donation answers" showBack />
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.from === 'user' ? styles.bubbleUser : styles.bubbleBot,
            ]}
          >
            <Text style={item.from === 'user' ? styles.bubbleUserText : styles.bubbleBotText}>
              {item.text}
            </Text>
          </View>
        )}
      />

      {messages.length <= 1 && (
        <View style={styles.suggestionsRow}>
          {SUGGESTIONS.map((s) => (
            <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => send(s)}>
              <Text style={styles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type your question..."
          placeholderTextColor={Colors.textTertiary}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => send(input)}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={() => send(input)}
          disabled={!input.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={Colors.textInverse} />
          ) : (
            <Text style={styles.sendBtnText}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  bubbleBot: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleBotText: {
    ...TextStyles.body,
    color: Colors.text,
  },
  bubbleUserText: {
    ...TextStyles.body,
    color: Colors.textInverse,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  suggestionChip: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryLight,
  },
  suggestionText: {
    ...TextStyles.bodySmall,
    color: Colors.primaryDark,
    fontWeight: FontWeights.semibold,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    ...TextStyles.body,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Colors.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.primaryMuted,
  },
  sendBtnText: {
    color: Colors.textInverse,
    fontSize: 18,
    fontWeight: FontWeights.bold,
  },
});
