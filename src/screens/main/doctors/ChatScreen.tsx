import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import EkoHeader from '../../../components/common/EkoHeader';
import { chatService } from '../../../services/messaging';
import type { ChatMessage } from '../../../api/types';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

export default function ChatScreen({ navigation, route }: Props) {
  const doctor = route.params?.doctor;
  const conversationId: string = route.params?.conversationId ?? `doctor-${doctor?.id ?? 'unknown'}`;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    let cancelled = false;
    chatService.loadMessages(conversationId).then((history) => {
      if (!cancelled) setMessages(history);
    });
    const unsubscribe = chatService.onMessage(conversationId, (incoming) => {
      setMessages((prev) => [...prev, incoming]);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [conversationId]);

  const send = async () => {
    if (!text.trim()) return;
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
        title={doctor?.name ?? 'Chat'}
        onBack={() => navigation.goBack()}
        rightAction={{ icon: 'video-camera', onPress: () => navigation.navigate('VideoCall', { doctor }) }}
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
          onPress={() => Alert.alert('Attach', 'Photo and file attachments are coming soon.')}
        >
          <FontAwesome name="paperclip" size={18} color={Colors.textGray} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={Colors.textGray}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity style={[styles.sendBtn, text.trim() && styles.sendBtnActive]} onPress={send}>
          <FontAwesome name="send" size={16} color={text.trim() ? Colors.white : Colors.textGray} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  list: { padding: 16, paddingBottom: 8 },
  msgRow: { marginBottom: 12 },
  msgRowMe: { alignItems: 'flex-end' },
  msgRowThem: { alignItems: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: Colors.white, borderBottomLeftRadius: 4, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2 },
  msgText: { fontSize: 15, color: Colors.textDark, lineHeight: 21 },
  msgTextMe: { color: Colors.white },
  msgTime: { fontSize: 10, color: Colors.textGray, marginTop: 4, textAlign: 'right' },
  msgTimeMe: { color: 'rgba(255,255,255,0.7)' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.borderGray,
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
