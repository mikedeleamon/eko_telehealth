import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import { useReplyToSupport, useSupportThread } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import type { Complaint, SupportMessage } from '../../../api/types';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

/**
 * A conversation with platform support, threaded off a filed report.
 *
 * Chat elsewhere in the app is provider↔patient over Stream; this one is
 * deliberately not — support staff aren't Stream users and the transcript
 * belongs with the complaint it's about. The report's own description is
 * rendered as the opening message so the thread reads from the start.
 */
export default function SupportThreadScreen({ navigation, route }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const complaint = route.params?.complaint as Complaint | undefined;
  const { data: messages = [], isLoading } = useSupportThread(complaint?.id);
  const reply = useReplyToSupport(complaint?.id ?? '');
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList>(null);

  const send = async () => {
    const body = draft.trim();
    if (!body || !complaint) return;
    setDraft('');
    try {
      await reply.mutateAsync(body);
    } catch (err) {
      setDraft(body); // put it back rather than losing what they typed
      Alert.alert(t('support.couldNotSend'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    }
  };

  if (!complaint) {
    return (
      <View style={styles.container}>
        <EkoHeader title={t('support.title')} onBack={() => navigation.goBack()} />
      </View>
    );
  }

  const statusColor =
    complaint.status === 'pending' ? Colors.orange : complaint.status === 'resolved' ? Colors.green : Colors.textGray;

  const renderMessage = ({ item }: { item: SupportMessage }) => {
    const fromMe = item.authorRole === 'user';
    return (
      <View style={[styles.row, fromMe ? styles.rowMe : styles.rowThem]}>
        <View style={[styles.bubble, fromMe ? styles.bubbleMe : styles.bubbleThem]}>
          {!fromMe && <Text style={styles.author}>{item.authorName}</Text>}
          <Text style={[styles.body, fromMe && styles.bodyMe]}>{item.body}</Text>
          <Text style={[styles.time, fromMe && styles.timeMe]}>
            {new Date(item.createdAt).toLocaleString([], {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <EkoHeader title={t('support.title')} onBack={() => navigation.goBack()} />

      <View style={styles.subjectBar}>
        <View style={styles.subjectText}>
          <Text style={styles.subject} numberOfLines={1}>{complaint.subject}</Text>
          <Text style={styles.meta}>
            {t(`report.category.${complaint.category}`)} · {complaint.submittedAt}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{t(`report.status.${complaint.status}`)}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoading ? (
          <ActivityIndicator style={styles.loader} color={Colors.primary} />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListHeaderComponent={
              // The report itself opens the conversation — without this the
              // thread would start mid-discussion.
              <View style={[styles.row, styles.rowMe]}>
                <View style={[styles.bubble, styles.bubbleMe]}>
                  <Text style={[styles.body, styles.bodyMe]}>{complaint.description}</Text>
                  <Text style={[styles.time, styles.timeMe]}>{complaint.submittedAt}</Text>
                </View>
              </View>
            }
            ListFooterComponent={
              messages.length === 0 ? <Text style={styles.awaiting}>{t('support.awaitingReply')}</Text> : null
            }
          />
        )}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder={t('support.placeholder')}
            placeholderTextColor={Colors.textGray}
            multiline
            accessibilityLabel={t('support.placeholder')}
          />
          <TouchableOpacity
            style={[styles.sendBtn, draft.trim() && styles.sendBtnActive]}
            onPress={send}
            disabled={!draft.trim() || reply.isPending}
            accessibilityRole="button"
            accessibilityLabel={t('a11y.sendMessage')}
          >
            <FontAwesome name="paper-plane" size={15} color={draft.trim() ? Colors.white : Colors.textGray} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  flex: { flex: 1 },
  loader: { marginTop: 40 },

  subjectBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.borderGray,
  },
  subjectText: { flex: 1 },
  subject: { fontSize: 14, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },
  meta: { fontSize: 11, color: Colors.textGray, marginTop: 2, fontFamily: 'Poppins_400Regular' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' },

  list: { padding: 16, paddingBottom: 8 },
  row: { flexDirection: 'row', marginBottom: 10 },
  rowMe: { justifyContent: 'flex-end' },
  rowThem: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: Colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.borderGray },
  author: { fontSize: 11, fontWeight: '700', color: Colors.primary, marginBottom: 3, fontFamily: 'Poppins_600SemiBold' },
  body: { fontSize: 14, color: Colors.textDark, lineHeight: 20, fontFamily: 'Poppins_400Regular' },
  bodyMe: { color: Colors.white },
  time: { fontSize: 10, color: Colors.textGray, marginTop: 5, fontFamily: 'Poppins_400Regular' },
  timeMe: { color: Colors.white, opacity: 0.75 },
  awaiting: {
    fontSize: 12, color: Colors.textGray, textAlign: 'center',
    marginTop: 12, fontFamily: 'Poppins_400Regular',
  },

  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: Colors.borderGray, backgroundColor: Colors.surface,
  },
  input: {
    flex: 1, maxHeight: 110, minHeight: 42,
    backgroundColor: Colors.field, borderRadius: 20,
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 12 : 8, paddingBottom: 8,
    fontSize: 14, color: Colors.textDark, fontFamily: 'Poppins_400Regular',
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.field,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnActive: { backgroundColor: Colors.primary },
});
