import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FontAwesome } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

// Home (Doctors) stack
import MyDoctorsScreen from '../screens/main/doctors/MyDoctorsScreen';
import DoctorOverviewScreen from '../screens/main/doctors/DoctorOverviewScreen';
import CreateAppointmentScreen from '../screens/main/doctors/CreateAppointmentScreen';
import AppointmentConfirmedScreen from '../screens/main/doctors/AppointmentConfirmedScreen';
import AppointmentAlertScreen from '../screens/main/doctors/AppointmentAlertScreen';
import VideoCallScreen from '../screens/main/doctors/VideoCallScreen';
import AudioCallScreen from '../screens/main/doctors/AudioCallScreen';
import ChatScreen from '../screens/main/doctors/ChatScreen';
import MessagesScreen from '../screens/main/doctors/MessagesScreen';
import PaymentScreen from '../screens/main/doctors/PaymentScreen';
import FilterScreen from '../screens/main/doctors/FilterScreen';
import ReviewsScreen from '../screens/main/account/ReviewsScreen';

// Appointments
import AppointmentsScreen from '../screens/main/appointments/AppointmentsScreen';

// Search
import SearchScreen from '../screens/main/search/SearchScreen';

// Account
import MyAccountScreen from '../screens/main/account/MyAccountScreen';
import EditProfileScreen from '../screens/main/account/EditProfileScreen';
import NotificationsScreen from '../screens/main/account/NotificationsScreen';
import SettingsScreen from '../screens/main/account/SettingsScreen';
import InsuranceScreen from '../screens/main/account/InsuranceScreen';
import PreferredPharmacyScreen from '../screens/main/account/PreferredPharmacyScreen';
import AddDependentScreen from '../screens/main/account/AddDependentScreen';
import AboutUsScreen from '../screens/main/account/AboutUsScreen';
import PeerReviewScreen from '../screens/main/account/PeerReviewScreen';
import PatientOverviewScreen from '../screens/main/account/PatientOverviewScreen';
import MyHealthScreen from '../screens/main/health/MyHealthScreen';
import ChangePasswordScreen from '../screens/auth/ChangePasswordScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const AppointmentsStack = createNativeStackNavigator();
const SearchStack = createNativeStackNavigator();
const AccountStack = createNativeStackNavigator();

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="MyDoctors" component={MyDoctorsScreen} />
      <HomeStack.Screen name="DoctorOverview" component={DoctorOverviewScreen} />
      <HomeStack.Screen name="CreateAppointment" component={CreateAppointmentScreen} />
      <HomeStack.Screen name="AppointmentConfirmed" component={AppointmentConfirmedScreen} />
      <HomeStack.Screen name="AppointmentAlert" component={AppointmentAlertScreen} options={{ presentation: 'transparentModal', animation: 'fade' }} />
      <HomeStack.Screen name="VideoCall" component={VideoCallScreen} options={{ presentation: 'fullScreenModal' }} />
      <HomeStack.Screen name="AudioCall" component={AudioCallScreen} options={{ presentation: 'fullScreenModal' }} />
      <HomeStack.Screen name="Chat" component={ChatScreen} />
      <HomeStack.Screen name="Messages" component={MessagesScreen} />
      <HomeStack.Screen name="Payment" component={PaymentScreen} />
      <HomeStack.Screen name="Filter" component={FilterScreen} />
      <HomeStack.Screen name="Reviews" component={ReviewsScreen} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
    </HomeStack.Navigator>
  );
}

function AppointmentsNavigator() {
  return (
    <AppointmentsStack.Navigator screenOptions={{ headerShown: false }}>
      <AppointmentsStack.Screen name="AppointmentsList" component={AppointmentsScreen} />
      <AppointmentsStack.Screen name="AppointmentDetails" component={AppointmentAlertScreen} />
      <AppointmentsStack.Screen name="AppointmentConfirmed" component={AppointmentConfirmedScreen} />
    </AppointmentsStack.Navigator>
  );
}

function SearchNavigator() {
  return (
    <SearchStack.Navigator screenOptions={{ headerShown: false }}>
      <SearchStack.Screen name="SearchMain" component={SearchScreen} />
      <SearchStack.Screen name="DoctorOverview" component={DoctorOverviewScreen} />
      <SearchStack.Screen name="CreateAppointment" component={CreateAppointmentScreen} />
      <SearchStack.Screen name="Payment" component={PaymentScreen} />
      <SearchStack.Screen name="AppointmentConfirmed" component={AppointmentConfirmedScreen} />
      <SearchStack.Screen name="AppointmentAlert" component={AppointmentAlertScreen} options={{ presentation: 'transparentModal', animation: 'fade' }} />
      <SearchStack.Screen name="VideoCall" component={VideoCallScreen} options={{ presentation: 'fullScreenModal' }} />
      <SearchStack.Screen name="AudioCall" component={AudioCallScreen} options={{ presentation: 'fullScreenModal' }} />
      <SearchStack.Screen name="Chat" component={ChatScreen} />
      <SearchStack.Screen name="Messages" component={MessagesScreen} />
      <SearchStack.Screen name="Reviews" component={ReviewsScreen} />
    </SearchStack.Navigator>
  );
}

function AccountNavigator() {
  return (
    <AccountStack.Navigator screenOptions={{ headerShown: false }}>
      <AccountStack.Screen name="MyAccount" component={MyAccountScreen} />
      <AccountStack.Screen name="EditProfile" component={EditProfileScreen} />
      <AccountStack.Screen name="PatientOverview" component={PatientOverviewScreen} />
      <AccountStack.Screen name="MyHealth" component={MyHealthScreen} />
      <AccountStack.Screen name="Insurance" component={InsuranceScreen} />
      <AccountStack.Screen name="PreferredPharmacy" component={PreferredPharmacyScreen} />
      <AccountStack.Screen name="AddDependent" component={AddDependentScreen} />
      <AccountStack.Screen name="Notifications" component={NotificationsScreen} />
      <AccountStack.Screen name="Settings" component={SettingsScreen} />
      <AccountStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <AccountStack.Screen name="PeerReview" component={PeerReviewScreen} />
      <AccountStack.Screen name="AboutUs" component={AboutUsScreen} />
      <AccountStack.Screen name="Reviews" component={ReviewsScreen} />
    </AccountStack.Navigator>
  );
}

const TAB_ITEMS = [
  { name: 'SearchTab', label: 'Search', icon: 'search' },
  { name: 'AppointmentsTab', label: 'Appointments', icon: 'calendar' },
  { name: 'HomeTab', label: 'Home', icon: 'stethoscope' },
  { name: 'AccountTab', label: 'My Account', icon: 'user' },
];

function TabBarContent({ state, navigation }: any) {
  return (
    <>
      {state.routes.map((route: any, index: number) => {
        const focused = state.index === index;
        const item = TAB_ITEMS[index];
        return (
          <TouchableOpacity
            key={route.key}
            style={tabStyles.tab}
            onPress={() => { if (!focused) navigation.navigate(route.name); }}
            activeOpacity={0.7}
          >
            <View style={[tabStyles.pill, focused && tabStyles.pillActive]}>
              <FontAwesome
                name={item.icon as any}
                size={21}
                color={focused ? Colors.tabBarActive : Colors.tabBarInactive}
              />
            </View>
            <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const pb = Math.max(insets.bottom, 8);

  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={80}
        tint="systemChromeMaterial"
        style={[tabStyles.container, { paddingBottom: pb }]}
      >
        <View style={tabStyles.row}>
          <TabBarContent state={state} navigation={navigation} />
        </View>
      </BlurView>
    );
  }

  return (
    <View style={[tabStyles.container, tabStyles.androidBg, { paddingBottom: pb }]}>
      <View style={tabStyles.row}>
        <TabBarContent state={state} navigation={navigation} />
      </View>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    borderTopWidth: 0,
    ...Platform.select({
      ios: {},
      android: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 16,
      },
    }),
  },
  androidBg: { backgroundColor: Colors.tabBar },
  row: { flexDirection: 'row', paddingTop: 10 },
  tab: { flex: 1, alignItems: 'center' },
  pill: {
    width: 48, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 3,
  },
  pillActive: { backgroundColor: Colors.primaryFaded },
  label: { fontSize: 10, color: Colors.tabBarInactive, fontWeight: '500', fontFamily: 'Poppins_500Medium' },
  labelActive: { color: Colors.tabBarActive, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
});

export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="SearchTab" component={SearchNavigator} />
      <Tab.Screen name="AppointmentsTab" component={AppointmentsNavigator} />
      <Tab.Screen name="HomeTab" component={HomeNavigator} />
      <Tab.Screen name="AccountTab" component={AccountNavigator} />
    </Tab.Navigator>
  );
}
