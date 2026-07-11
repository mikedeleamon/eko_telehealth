import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, StatusBar, Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { usePatients } from '../../../hooks/queries';
import Cross from '../../../components/common/Cross';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function PatientsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const { data: patients = [] } = usePatients();
  const data = patients.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.condition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Cross size={130} opacity={0.09} rotation={14} style={{ top: -40, right: -18 }} />
        <Cross size={84} opacity={0.07} rotation={-12} style={{ bottom: -24, left: 40 }} />
        <Cross size={58} opacity={0.06} rotation={18} style={{ top: -12, left: -16 }} />
        <Cross size={46} opacity={0.06} rotation={-16} style={{ bottom: 40, right: 104 }} />
        <Cross size={36} opacity={0.05} rotation={22} style={{ top: 16, right: 90 }} />

        <Text style={styles.headerTitle}>My Patients</Text>

        <View style={styles.searchBar}>
          <FontAwesome name="search" size={15} color={Colors.textGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients"
            placeholderTextColor={Colors.textGray}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <FontAwesome name="times-circle" size={15} color={Colors.textGray} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.85}>
            <View style={styles.avatar}>
              <FontAwesome name="user" size={22} color={Colors.primary} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.age} yrs · {item.gender}</Text>
              <View style={styles.conditionPill}>
                <Text style={styles.conditionText}>{item.condition}</Text>
              </View>
            </View>
            <View style={styles.right}>
              <Text style={styles.lastVisitLabel}>Last visit</Text>
              <Text style={styles.lastVisit}>{item.lastVisit}</Text>
              <FontAwesome name="chevron-right" size={12} color={Colors.textGray} style={{ marginTop: 6 }} />
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <FontAwesome name="users" size={44} color={Colors.textLight} />
            <Text style={styles.emptyText}>No patients found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },

  header: {
    paddingHorizontal: 20, paddingBottom: 20, overflow: 'hidden',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    ...Platform.select({
      ios: { shadowColor: Colors.gradientStart, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.white, marginBottom: 14, fontFamily: 'Poppins_700Bold' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white, borderRadius: 16, paddingHorizontal: 14, height: 48,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textDark, fontFamily: 'Poppins_400Regular' },

  list: { padding: 16, paddingBottom: 24 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: 18, padding: 14, marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  meta: { fontSize: 12, color: Colors.textGray, marginTop: 2, marginBottom: 6, fontFamily: 'Poppins_400Regular' },
  conditionPill: {
    alignSelf: 'flex-start', backgroundColor: Colors.primaryFaded,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10,
  },
  conditionText: { fontSize: 11, color: Colors.primary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  right: { alignItems: 'flex-end', marginLeft: 8 },
  lastVisitLabel: { fontSize: 10, color: Colors.textLight, fontFamily: 'Poppins_400Regular' },
  lastVisit: { fontSize: 12, color: Colors.textMedium, fontWeight: '600', marginTop: 2, fontFamily: 'Poppins_500Medium' },

  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, color: Colors.textGray, marginTop: 12, fontFamily: 'Poppins_400Regular' },
});
