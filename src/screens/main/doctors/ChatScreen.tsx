import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import SCHeader from '../../../components/common/SCHeader';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

interface Message {
  id: string;
  text: string;
  fromMe: boolean;
  time: string;
}

const INITIAL_MESSAGES: Message[] = [
  { id: '1', text: 'Hello! How can I help you today?', fromMe: false, time: '2:00 PM' },
  { id: '2', text: 'Hi doctor, I\'ve been having some headaches lately.', fromMe: true, time: '2:01 PM' },
  { id: '3', text: 'I see. How long have you been experiencing them? Are they accompanied by any other symptoms?', fromMe: false, time: '2:02 PM' },
  { id: '4', text: 'About a week. I also feel a bit dizzy sometimes.', fromMe: true, time: '2:03 PM' },
];

export default function ChatScreen({ navigation, route }: Props) {
  const doctor = route.params?.doctor;
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const send = () => {
    if (!text.trim()) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      fromMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setText('');
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), text: 'Thank you, I\'ll review your information shortly.', fromMe: false, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
    }, 1200);
  };

  const renderMsg = ({ item }: { item: Message }) => (
    <View style={[styles.msgRow, item.fromMe ? styles.msgRowMe : styles.msgRowThem]}>
      <View style={[styles.bubble, item.fromMe ? styles.bubbleMe : styles.bubbleThem]}>
        <Text style={[styles.msgText, item.fromMe && styles.msgTextMe]}>{item.text}</Text>
        <Text style={[styles.msgTime, item.fromMe && styles.msgTimeMe]}>{item.time}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SCHeader
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
