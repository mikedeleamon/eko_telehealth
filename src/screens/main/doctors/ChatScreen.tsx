import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import { chatService } from '../../../services/messaging';
import { REDACTION_PLACEHOLDER } from '../../../services/messaging/types';
import { useJoinableVisit } from '../../../hooks/useJoinableVisit';
import { api } from '../../../api';
import type { ChatMessage } from '../../../api/types';
import { useTranslation } from '../../../i18n/useTranslation';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

export default function ChatScreen({ navigation, route }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const doctor = route.params?.doctor;
  const [conversationId, setConversationId] = useState<string | null>(route.params?.conversationId ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);
  // Message ids we've already warned the sender about, so a second edit to the
  // same message doesn't re-alert.
  const warnedRef = useRef<Set<string>>(new Set());
  const joinableVisit = useJoinableVisit({ doctorId: doctor?.id });

  // Start (or fetch) the thread so chat runs on the backend-owned Stream
  // channel. POST /conversations is idempotent and ensures both members;
  // on failure we fall back to a local id so the screen still works.
  useEffect(() => {
    if (conversationId) return;
    const doctorId = doctor?.id;
    if (!doctorId) {
      setConversationId('doctor-unknown');
      return;
    }
    let cancelled = false;
    api.messaging
      .createConversation(doctorId)
      .then((conv) => { if (!cancelled) setConversationId(conv.id); })
      .catch(() => { if (!cancelled) setConversationId(`doctor-${doctorId}`); });
    return () => { cancelled = true; };
  }, [conversationId, doctor?.id]);

  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;
    chatService.loadMessages(conversationId).then((history) => {
      if (!cancelled) setMessages(history);
    });
    const unsubscribe = chatService.onMessage(conversationId, (incoming) => {
      setMessages((prev) => [...prev, incoming]);
    });

    // The server masks contact details after the fact and rewrites the message
    // in place, so a sent message can change under us. Swap in the edited text
    // and, if it was our own message that got masked, say so once — otherwise
    // the sender just sees their number silently vanish.
    const unsubscribeUpdates = chatService.onMessageUpdated(conversationId, (updated) => {
      // Warn outside the state updater — that has to stay pure, or StrictMode's
      // double-invoke shows the alert twice. Once per message id.
      if (updated.fromMe && updated.text.includes(REDACTION_PLACEHOLDER) && !warnedRef.current.has(updated.id)) {
        warnedRef.current.add(updated.id);
        Alert.alert(t('messages.contactRemovedTitle'), t('messages.contactRemovedBody'));
      }
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, text: updated.text } : m)));
    });

    return () => {
      cancelled = true;
      unsubscribe();
      unsubscribeUpdates();
    };
  }, [conversationId]);

  const send = async () => {
    if (!text.trim() || !conversationId) return;
    const body = text.trim();
    setText('');
    const sent = await chatService.sendMessage(conversationId, body);
    setMessages((prev) => [...prev, sent]);
  };

  const renderMsg = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.msgRow, item.fromMe ? styles.msgRowMe : styles.msgRowThem]}>
      <View style={[styles.bubble, item.fromMe ? styles.bubbleMe : styles.bubbleThem]}>
        <Text style={[styles.msgText, item.fromMe && styles.msgTextMe]}>{item.text}</Text>
        <Text style={[styles.msgTime, item.fromMe && styles.msgTimeMe]}>{item.time}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <EkoHeader
        title={doctor?.name ?? t('messages.chat')}
        onBack={() => navigation.goBack()}
        // Only offered when there's an open, paid visit to place the call
        // against — calls are authorized per-appointment, so a chat with no
        // booked visit has no room to join.
        rightAction={
          joinableVisit
            ? {
                icon: 'video-camera',
                onPress: () => navigation.navigate('VideoCall', { doctor, appointmentId: joinableVisit.id }),
                accessibilityLabel: t('call.videoCall'),
              }
            : undefined
        }
      />
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMsg}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.attachBtn}
          onPress={() => Alert.alert(t('messages.attach'), t('messages.attachSoon'))}
          accessibilityRole="button"
          accessibilityLabel={t('messages.attach')}
        >
          <FontAwesome name="paperclip" size={18} color={Colors.textGray} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder={t('messages.typeMessage')}
          placeholderTextColor={Colors.textGray}
          accessibilityLabel={t('messages.typeMessage')}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity style={[styles.sendBtn, text.trim() && styles.sendBtnActive]} onPress={send} accessibilityRole="button" accessibilityLabel={t('a11y.sendMessage')}>
          <FontAwesome name="send" size={16} color={text.trim() ? Colors.white : Colors.textGray} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  list: { padding: 16, paddingBottom: 8 },
  msgRow: { marginBottom: 12 },
  msgRowMe: { alignItems: 'flex-end' },
  msgRowThem: { alignItems: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: Colors.surface, borderBottomLeftRadius: 4, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2 },
  msgText: { fontSize: 15, color: Colors.textDark, lineHeight: 21 },
  msgTextMe: { color: Colors.white },
  msgTime: { fontSize: 10, color: Colors.textGray, marginTop: 4, textAlign: 'right' },
  msgTimeMe: { color: 'rgba(255,255,255,0.7)' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.borderGray,
  },
  attachBtn: { padding: 10 },
  input: {
    flex: 1, minHeight: 42, maxHeight: 100, backgroundColor: Colors.bgLight,
    borderRadius: 21, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: Colors.textDark, marginHorizontal: 8,
    borderWidth: 1, borderColor: Colors.borderGray,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.bgGray,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnActive: { backgroundColor: Colors.primary },
});
