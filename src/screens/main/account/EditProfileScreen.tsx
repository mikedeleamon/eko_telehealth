import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import SCTextField from '../../../components/common/SCTextField';
import SCButton from '../../../components/common/SCButton';
import Cross from '../../../components/common/Cross';
import { useAuth } from '../../../context/AuthContext';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function EditProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);

  const save = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Profile updated successfully.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    }, 800);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Purple gradient header */}
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <Cross size={150} opacity={0.09} rotation={14} style={{ top: -50, right: -36 }} />
          <Cross size={70} opacity={0.07} rotation={-12} style={{ bottom: 10, left: -20 }} />
          <Cross size={44} opacity={0.06} rotation={20} style={{ top: 30, right: 90 }} />
          <Cross size={30} opacity={0.05} rotation={-16} style={{ bottom: 50, right: 40 }} />

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <FontAwesome name="arrow-left" size={20} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </LinearGradient>

        {/* Overlapping avatar + name */}
        <View style={styles.avatarWrap}>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => Alert.alert('Profile Photo', 'Photo upload is coming soon.')}
            activeOpacity={0.85}
          >
            <FontAwesome name="user" size={44} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>
          {user ? `${user.firstName} ${user.lastName}` : 'John Williamson'}
        </Text>

        {/* Form (fields unchanged) */}
        <View style={styles.form}>
          <SCTextField label="First Name" placeholder="First Name" icon="user" value={firstName} onChangeText={setFirstName} />
          <SCTextField label="Last Name" placeholder="Last Name" icon="user" value={lastName} onChangeText={setLastName} />
          <SCTextField label="Email" placeholder="Email" icon="envelope-o" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <SCTextField label="Phone" placeholder="Phone number" icon="phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <SCTextField label="City" placeholder="City" icon="map-marker" value={city} onChangeText={setCity} />

          <SCButton title="UPDATE" variant="accent" onPress={save} loading={loading} style={styles.btn} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { paddingBottom: 40 },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 64,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: Colors.gradientStart, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },
  backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center', marginLeft: -8 },
  headerTitle: {
    fontSize: 26, fontWeight: '800', color: Colors.white,
    marginTop: 10, fontFamily: 'Poppins_700Bold',
  },

  avatarWrap: { alignItems: 'center', marginTop: -50 },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: Colors.white,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.18)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  name: {
    fontSize: 19, fontWeight: '700', color: Colors.textDark,
    textAlign: 'center', marginTop: 12, marginBottom: 20,
    fontFamily: 'Poppins_700Bold',
  },

  form: { paddingHorizontal: 20 },
  btn: { marginTop: 8 },
});
