import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import { useConversations, useDoctors } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function MessagesScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const { data: convList = [] } = useConversations();
  const { data: doctors = [] } = useDoctors();
  const conversations = convList.map((c) => ({
    ...c,
    doctor: doctors.find((d) => d.id === c.doctorId),
  }));

  return (
    <View style={styles.container}>
      <EkoHeader title={t('messages.title')} onBack={() => navigation.goBack()} />

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('Chat', { doctor: item.doctor })}
            activeOpacity={0.8}
          >
            <View style={styles.avatar}>
              <FontAwesome name="user-md" size={24} color={Colors.primary} />
              {item.doctor?.available ? <View style={styles.onlineDot} /> : null}
            </View>

            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>{item.doctor?.name ?? 'Doctor'}</Text>
              <Text style={[styles.preview, item.unread > 0 && styles.previewUnread]} numberOfLines={1}>
                {item.lastMessage}
              </Text>
            </View>

            <View style={styles.meta}>
              <Text style={styles.time}>{item.time}</Text>
              {item.unread > 0 ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unread}</Text>
                </View>
              ) : (
                <View style={styles.metaSpacer} />
              )}
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <FontAwesome name="comments-o" size={46} color={Colors.textLight} />
            <Text style={styles.emptyText}>{t('messages.noMessages')}</Text>
          </View>
        }
      />
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  list: { padding: 16 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 18,
    padding: 14, marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },

  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2, borderColor: Colors.white,
  },

  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.textDark, marginBottom: 3, fontFamily: 'Poppins_700Bold' },
  preview: { fontSize: 13, color: Colors.textGray, fontFamily: 'Poppins_400Regular' },
  previewUnread: { color: Colors.textDark, fontFamily: 'Poppins_500Medium' },

  meta: { alignItems: 'flex-end', marginLeft: 8 },
  time: { fontSize: 11, color: Colors.textGray, marginBottom: 6, fontFamily: 'Poppins_400Regular' },
  unreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  unreadText: { fontSize: 11, color: Colors.white, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  metaSpacer: { height: 20 },

  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, color: Colors.textGray, marginTop: 12, fontFamily: 'Poppins_400Regular' },
});
