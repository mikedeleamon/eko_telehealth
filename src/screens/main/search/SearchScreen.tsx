import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, StatusBar, Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import { useDoctors } from '../../../hooks/queries';
import RatingStars from '../../../components/common/RatingStars';
import Cross from '../../../components/common/Cross';
import { useTranslation } from '../../../i18n/useTranslation';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const RECENT = ['Primary Care', 'Eye Doctor', 'Cardiology', 'Dr. Okafor'];

export default function SearchScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const { data: doctors = [] } = useDoctors();
  const results = query.length > 1
    ? doctors.filter(d =>
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.specialty.toLowerCase().includes(query.toLowerCase())
      )
    : [];

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
        <Cross size={30} opacity={0.05} rotation={12} style={{ top: 58, left: -8 }} />
        <Cross size={26} opacity={0.05} rotation={-18} style={{ bottom: 10, left: 24 }} />
        <Cross size={22} opacity={0.04} rotation={14} style={{ top: 4, right: 170 }} />
        <Cross size={20} opacity={0.04} rotation={-12} style={{ bottom: 52, right: 24 }} />
        <Text style={styles.headerTitle}>{t('search.header')}</Text>

        <View style={styles.searchBar}>
          <FontAwesome name="search" size={15} color={Colors.textGray} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('search.placeholder2')}
            placeholderTextColor={Colors.textGray}
            accessibilityLabel={t('common.search')}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <FontAwesome name="times-circle" size={16} color={Colors.textGray} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {query.length < 2 ? (
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>{t('search.recentSearches')}</Text>
          {RECENT.map(r => (
            <TouchableOpacity key={r} style={styles.recentRow} onPress={() => setQuery(r)}>
              <View style={styles.recentIcon}>
                <FontAwesome name="history" size={14} color={Colors.primary} />
              </View>
              <Text style={styles.recentText}>{r}</Text>
              <FontAwesome name="chevron-right" size={12} color={Colors.textGray} />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultCard}
              onPress={() => navigation.navigate('DoctorOverview', { doctor: item })}
              activeOpacity={0.85}
            >
              <View style={styles.resultAvatar}>
                <FontAwesome name="user-md" size={22} color={Colors.primary} />
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultSpec}>{item.specialty}</Text>
                <RatingStars rating={item.rating} size={11} />
              </View>
              <View style={styles.resultRight}>
                <Text style={styles.resultFee}>{item.fee}</Text>
                <Text style={styles.resultFeeLabel}>{t('search.perVisit')}</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.resultList}
          ListEmptyComponent={
            <View style={styles.noResult}>
              <FontAwesome name="search" size={40} color={Colors.textLight} />
              <Text style={styles.noResultText}>{t('search.noResultsFor', { query })}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
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
    backgroundColor: Colors.surface, borderRadius: 16, paddingHorizontal: 14, height: 48,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textDark, fontFamily: 'Poppins_400Regular' },

  recentSection: { padding: 20 },
  recentTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginBottom: 14, fontFamily: 'Poppins_700Bold' },
  recentRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 16, padding: 14, marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  recentIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryFaded, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  recentText: { flex: 1, fontSize: 15, color: Colors.textDark, fontFamily: 'Poppins_400Regular' },

  resultList: { padding: 16, paddingBottom: 24 },
  resultCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 18, padding: 14, marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  resultAvatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 14, fontWeight: '700', color: Colors.textDark, marginBottom: 2, fontFamily: 'Poppins_700Bold' },
  resultSpec: { fontSize: 12, color: Colors.textGray, marginBottom: 4, fontFamily: 'Poppins_400Regular' },
  resultRight: { alignItems: 'flex-end' },
  resultFee: { fontSize: 18, fontWeight: '800', color: Colors.primary, fontFamily: 'Poppins_700Bold' },
  resultFeeLabel: { fontSize: 10, color: Colors.textGray, fontFamily: 'Poppins_400Regular' },
  noResult: { alignItems: 'center', marginTop: 50 },
  noResultText: { fontSize: 15, color: Colors.textGray, marginTop: 12, fontFamily: 'Poppins_400Regular' },
});
