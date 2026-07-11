import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import EkoHeader from '../../../components/common/EkoHeader';
import { useNotifications } from '../../../hooks/queries';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const NOTIF_ICONS: Record<string, string> = {
  'Appointment Reminder': 'calendar',
  'Appointment Confirmed': 'check-circle',
  'New Message': 'comment',
  'Payment Successful': 'credit-card',
};

export default function NotificationsScreen({ navigation }: Props) {
  const { data: notifications = [] } = useNotifications();
  return (
    <View style={styles.container}>
      <EkoHeader title="Notifications" onBack={() => navigation.goBack()} />
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={[styles.card, { backgroundColor: Colors.cardColors[index % Colors.cardColors.length] }]}>
            <View style={styles.iconBox}>
              <FontAwesome name={(NOTIF_ICONS[item.title] || 'bell') as any} size={20} color={Colors.primary} />
            </View>
            <View style={styles.info}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
            <Text style={styles.time}>{item.time}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <FontAwesome name="bell-slash-o" size={44} color={Colors.textLight} />
            <Text style={styles.emptyText}>No notifications</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  list: { padding: 16 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: Colors.textDark, marginBottom: 3 },
  body: { fontSize: 13, color: Colors.textMedium, lineHeight: 18 },
  time: { fontSize: 11, color: Colors.textGray, marginLeft: 8, marginTop: 2 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: Colors.textGray, marginTop: 12 },
});
