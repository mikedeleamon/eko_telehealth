import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FontAwesome } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import {
    GlassView,
    GlassContainer,
    isLiquidGlassAvailable,
    isGlassEffectAPIAvailable,
} from 'expo-glass-effect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useTheme, useThemeMode, type ThemeColors } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/useTranslation';

// Home (Doctors) stack
import MyDoctorsScreen from '../screens/main/doctors/MyDoctorsScreen';
import DoctorOverviewScreen from '../screens/main/doctors/DoctorOverviewScreen';
import CreateAppointmentScreen from '../screens/main/doctors/CreateAppointmentScreen';
import AppointmentConfirmedScreen from '../screens/main/doctors/AppointmentConfirmedScreen';
import VideoCallScreen from '../screens/main/doctors/VideoCallScreen';
import AudioCallScreen from '../screens/main/doctors/AudioCallScreen';
import ChatScreen from '../screens/main/doctors/ChatScreen';
import MessagesScreen from '../screens/main/doctors/MessagesScreen';
import PaymentScreen from '../screens/main/doctors/PaymentScreen';
import PaymentPendingScreen from '../screens/main/doctors/PaymentPendingScreen';
import FilterScreen from '../screens/main/doctors/FilterScreen';
import ReviewsScreen from '../screens/main/account/ReviewsScreen';

// Appointments
import AppointmentsScreen from '../screens/main/appointments/AppointmentsScreen';
import AppointmentDetailsScreen from '../screens/main/appointments/AppointmentDetailsScreen';

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
import PaymentInfoScreen from '../screens/main/account/PaymentInfoScreen';
import PaymentHistoryScreen from '../screens/main/account/PaymentHistoryScreen';
import ReportProblemScreen from '../screens/main/account/ReportProblemScreen';
import DocumentsScreen from '../screens/main/account/DocumentsScreen';
import MyHealthScreen from '../screens/main/health/MyHealthScreen';
import MyPrescriptionsScreen from '../screens/main/health/MyPrescriptionsScreen';
import LabsScreen from '../screens/main/health/LabsScreen';
import ChangePasswordScreen from '../screens/auth/ChangePasswordScreen';

// Doctor earnings
import EarningsScreen from '../screens/main/earnings/EarningsScreen';
import CashOutScreen from '../screens/main/earnings/CashOutScreen';

// Doctor
import DashboardScreen from '../screens/main/dashboard/DashboardScreen';
import ProviderApplyScreen from '../screens/main/dashboard/ProviderApplyScreen';
import PatientsScreen from '../screens/main/dashboard/PatientsScreen';
import PatientProfileScreen from '../screens/main/dashboard/PatientProfileScreen';
import MedicalHistoryScreen from '../screens/main/dashboard/MedicalHistoryScreen';
import MedicalNotesScreen from '../screens/main/dashboard/MedicalNotesScreen';
import PrescriptionHistoryScreen from '../screens/main/dashboard/PrescriptionHistoryScreen';
import AddPrescriptionScreen from '../screens/main/dashboard/AddPrescriptionScreen';
import DoctorSettingsScreen from '../screens/main/dashboard/DoctorSettingsScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const AppointmentsStack = createNativeStackNavigator();
const SearchStack = createNativeStackNavigator();
const AccountStack = createNativeStackNavigator();
const PrescriptionsStack = createNativeStackNavigator();
const DashboardStack = createNativeStackNavigator();
const PatientsStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();
const EarningsStack = createNativeStackNavigator();

function HomeNavigator() {
    return (
        <HomeStack.Navigator screenOptions={{ headerShown: false }}>
            <HomeStack.Screen
                name='MyDoctors'
                component={MyDoctorsScreen}
            />
            <HomeStack.Screen
                name='DoctorOverview'
                component={DoctorOverviewScreen}
            />
            <HomeStack.Screen
                name='CreateAppointment'
                component={CreateAppointmentScreen}
            />
            <HomeStack.Screen
                name='AppointmentConfirmed'
                component={AppointmentConfirmedScreen}
            />
            <HomeStack.Screen
                name='AppointmentDetails'
                component={AppointmentDetailsScreen}
            />
            <HomeStack.Screen
                name='VideoCall'
                component={VideoCallScreen}
                options={{ presentation: 'fullScreenModal' }}
            />
            <HomeStack.Screen
                name='AudioCall'
                component={AudioCallScreen}
                options={{ presentation: 'fullScreenModal' }}
            />
            <HomeStack.Screen
                name='Chat'
                component={ChatScreen}
            />
            <HomeStack.Screen
                name='Messages'
                component={MessagesScreen}
            />
            <HomeStack.Screen
                name='Payment'
                component={PaymentScreen}
            />
            <HomeStack.Screen
                name='PaymentPending'
                component={PaymentPendingScreen}
            />
            <HomeStack.Screen
                name='Filter'
                component={FilterScreen}
            />
            <HomeStack.Screen
                name='Reviews'
                component={ReviewsScreen}
            />
            <HomeStack.Screen
                name='Notifications'
                component={NotificationsScreen}
            />
        </HomeStack.Navigator>
    );
}

function AppointmentsNavigator() {
    return (
        <AppointmentsStack.Navigator screenOptions={{ headerShown: false }}>
            <AppointmentsStack.Screen
                name='AppointmentsList'
                component={AppointmentsScreen}
            />
            <AppointmentsStack.Screen
                name='AppointmentDetails'
                component={AppointmentDetailsScreen}
            />
            <AppointmentsStack.Screen
                name='DoctorOverview'
                component={DoctorOverviewScreen}
            />
            <AppointmentsStack.Screen
                name='CreateAppointment'
                component={CreateAppointmentScreen}
            />
            <AppointmentsStack.Screen
                name='Payment'
                component={PaymentScreen}
            />
            <AppointmentsStack.Screen
                name='PaymentPending'
                component={PaymentPendingScreen}
            />
            <AppointmentsStack.Screen
                name='AppointmentConfirmed'
                component={AppointmentConfirmedScreen}
            />
            <AppointmentsStack.Screen
                name='VideoCall'
                component={VideoCallScreen}
                options={{ presentation: 'fullScreenModal' }}
            />
            <AppointmentsStack.Screen
                name='AudioCall'
                component={AudioCallScreen}
                options={{ presentation: 'fullScreenModal' }}
            />
            <AppointmentsStack.Screen
                name='Chat'
                component={ChatScreen}
            />
            <AppointmentsStack.Screen
                name='Reviews'
                component={ReviewsScreen}
            />
        </AppointmentsStack.Navigator>
    );
}

function SearchNavigator() {
    return (
        <SearchStack.Navigator screenOptions={{ headerShown: false }}>
            <SearchStack.Screen
                name='SearchMain'
                component={SearchScreen}
            />
            <SearchStack.Screen
                name='DoctorOverview'
                component={DoctorOverviewScreen}
            />
            <SearchStack.Screen
                name='CreateAppointment'
                component={CreateAppointmentScreen}
            />
            <SearchStack.Screen
                name='Payment'
                component={PaymentScreen}
            />
            <SearchStack.Screen
                name='PaymentPending'
                component={PaymentPendingScreen}
            />
            <SearchStack.Screen
                name='AppointmentConfirmed'
                component={AppointmentConfirmedScreen}
            />
            <SearchStack.Screen
                name='VideoCall'
                component={VideoCallScreen}
                options={{ presentation: 'fullScreenModal' }}
            />
            <SearchStack.Screen
                name='AudioCall'
                component={AudioCallScreen}
                options={{ presentation: 'fullScreenModal' }}
            />
            <SearchStack.Screen
                name='Chat'
                component={ChatScreen}
            />
            <SearchStack.Screen
                name='Messages'
                component={MessagesScreen}
            />
            <SearchStack.Screen
                name='Reviews'
                component={ReviewsScreen}
            />
        </SearchStack.Navigator>
    );
}

function AccountNavigator() {
    return (
        <AccountStack.Navigator screenOptions={{ headerShown: false }}>
            <AccountStack.Screen
                name='MyAccount'
                component={MyAccountScreen}
            />
            <AccountStack.Screen
                name='EditProfile'
                component={EditProfileScreen}
            />
            <AccountStack.Screen
                name='PatientOverview'
                component={PatientOverviewScreen}
            />
            <AccountStack.Screen
                name='PaymentInfo'
                component={PaymentInfoScreen}
            />
            <AccountStack.Screen
                name='PaymentHistory'
                component={PaymentHistoryScreen}
            />
            <AccountStack.Screen
                name='MyHealth'
                component={MyHealthScreen}
            />
            <AccountStack.Screen
                name='Labs'
                component={LabsScreen}
            />
            <AccountStack.Screen
                name='Insurance'
                component={InsuranceScreen}
            />
            <AccountStack.Screen
                name='PreferredPharmacy'
                component={PreferredPharmacyScreen}
            />
            <AccountStack.Screen
                name='AddDependent'
                component={AddDependentScreen}
            />
            <AccountStack.Screen
                name='Notifications'
                component={NotificationsScreen}
            />
            <AccountStack.Screen
                name='Settings'
                component={SettingsScreen}
            />
            <AccountStack.Screen
                name='ChangePassword'
                component={ChangePasswordScreen}
            />
            <AccountStack.Screen
                name='PeerReview'
                component={PeerReviewScreen}
            />
            <AccountStack.Screen
                name='AboutUs'
                component={AboutUsScreen}
            />
            <AccountStack.Screen
                name='Reviews'
                component={ReviewsScreen}
            />
            <AccountStack.Screen
                name='ReportProblem'
                component={ReportProblemScreen}
            />
        </AccountStack.Navigator>
    );
}

function PrescriptionsNavigator() {
    return (
        <PrescriptionsStack.Navigator screenOptions={{ headerShown: false }}>
            <PrescriptionsStack.Screen
                name='MyPrescriptions'
                component={MyPrescriptionsScreen}
            />
        </PrescriptionsStack.Navigator>
    );
}

// ---- Doctor stacks ----

function DashboardNavigator() {
    return (
        <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
            <DashboardStack.Screen
                name='Dashboard'
                component={DashboardScreen}
            />
            <DashboardStack.Screen
                name='ProviderApply'
                component={ProviderApplyScreen}
            />
            <DashboardStack.Screen
                name='Messages'
                component={MessagesScreen}
            />
            <DashboardStack.Screen
                name='Chat'
                component={ChatScreen}
            />
            <DashboardStack.Screen
                name='VideoCall'
                component={VideoCallScreen}
                options={{ presentation: 'fullScreenModal' }}
            />
            <DashboardStack.Screen
                name='AudioCall'
                component={AudioCallScreen}
                options={{ presentation: 'fullScreenModal' }}
            />
        </DashboardStack.Navigator>
    );
}

function PatientsNavigator() {
    return (
        <PatientsStack.Navigator screenOptions={{ headerShown: false }}>
            <PatientsStack.Screen
                name='Patients'
                component={PatientsScreen}
            />
            <PatientsStack.Screen
                name='PatientProfile'
                component={PatientProfileScreen}
            />
            <PatientsStack.Screen
                name='MedicalHistory'
                component={MedicalHistoryScreen}
            />
            <PatientsStack.Screen
                name='MedicalNotes'
                component={MedicalNotesScreen}
            />
            <PatientsStack.Screen
                name='PrescriptionHistory'
                component={PrescriptionHistoryScreen}
            />
            <PatientsStack.Screen
                name='Labs'
                component={LabsScreen}
            />
            <PatientsStack.Screen
                name='AddPrescription'
                component={AddPrescriptionScreen}
            />
            <PatientsStack.Screen
                name='Chat'
                component={ChatScreen}
            />
            <PatientsStack.Screen
                name='VideoCall'
                component={VideoCallScreen}
                options={{ presentation: 'fullScreenModal' }}
            />
            <PatientsStack.Screen
                name='AudioCall'
                component={AudioCallScreen}
                options={{ presentation: 'fullScreenModal' }}
            />
        </PatientsStack.Navigator>
    );
}

function SettingsNavigator() {
    return (
        <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
            <SettingsStack.Screen
                name='DoctorSettings'
                component={DoctorSettingsScreen}
            />
            <SettingsStack.Screen
                name='EditProfile'
                component={EditProfileScreen}
            />
            <SettingsStack.Screen
                name='Notifications'
                component={NotificationsScreen}
            />
            <SettingsStack.Screen
                name='Preferences'
                component={SettingsScreen}
            />
            <SettingsStack.Screen
                name='PaymentInfo'
                component={PaymentInfoScreen}
            />
            <SettingsStack.Screen
                name='Documents'
                component={DocumentsScreen}
            />
            <SettingsStack.Screen
                name='ChangePassword'
                component={ChangePasswordScreen}
            />
            <SettingsStack.Screen
                name='Reviews'
                component={ReviewsScreen}
            />
            <SettingsStack.Screen
                name='AboutUs'
                component={AboutUsScreen}
            />
            <SettingsStack.Screen
                name='ReportProblem'
                component={ReportProblemScreen}
            />
        </SettingsStack.Navigator>
    );
}

function EarningsNavigator() {
    return (
        <EarningsStack.Navigator screenOptions={{ headerShown: false }}>
            <EarningsStack.Screen
                name='Earnings'
                component={EarningsScreen}
            />
            <EarningsStack.Screen
                name='CashOut'
                component={CashOutScreen}
                options={{
                    presentation: 'transparentModal',
                    animation: 'fade',
                }}
            />
            <EarningsStack.Screen
                name='PaymentInfo'
                component={PaymentInfoScreen}
            />
            <EarningsStack.Screen
                name='Messages'
                component={MessagesScreen}
            />
            <EarningsStack.Screen
                name='Chat'
                component={ChatScreen}
            />
        </EarningsStack.Navigator>
    );
}

interface TabItem {
    name: string;
    /** i18n key under `tabs.*`. */
    labelKey: string;
    icon: string;
}

const PATIENT_TABS: TabItem[] = [
    { name: 'SearchTab', labelKey: 'tabs.search', icon: 'search' },
    {
        name: 'AppointmentsTab',
        labelKey: 'tabs.appointments',
        icon: 'calendar',
    },
    { name: 'HomeTab', labelKey: 'tabs.home', icon: 'stethoscope' },
    { name: 'PrescriptionsTab', labelKey: 'tabs.prescriptions', icon: 'medkit' },
    { name: 'AccountTab', labelKey: 'tabs.account', icon: 'user' },
];

const DOCTOR_TABS: TabItem[] = [
    { name: 'EarningsTab', labelKey: 'tabs.earnings', icon: 'money' },
    { name: 'PatientsTab', labelKey: 'tabs.patients', icon: 'user' },
    { name: 'DashboardTab', labelKey: 'tabs.dashboard', icon: 'dashboard' },
    { name: 'SchedulerTab', labelKey: 'tabs.scheduler', icon: 'calendar' },
    { name: 'SettingsTab', labelKey: 'tabs.settings', icon: 'sliders' },
];

// iOS 26+ only: the real UIGlassEffect API. Both checks matter — some iOS 26
// betas expose the class but crash on init, so isGlassEffectAPIAvailable()
// guards that. Falls back to the systemChromeMaterial BlurView on iOS <26.
// https://github.com/expo/expo/issues/40911
const canUseLiquidGlass =
    Platform.OS === 'ios' &&
    isLiquidGlassAvailable() &&
    isGlassEffectAPIAvailable();

function TabBarContent({ state, navigation, items }: any) {
    const { t } = useTranslation();
    const Colors = useTheme();
    const tabStyles = makeTabStyles(Colors);
    return (
        <>
            {state.routes.map((route: any, index: number) => {
                const focused = state.index === index;
                const item = items[index];
                if (!item) return null;
                const label = t(item.labelKey);
                return (
                    <TouchableOpacity
                        key={route.key}
                        style={tabStyles.tab}
                        onPress={() => {
                            if (!focused) navigation.navigate(route.name);
                        }}
                        activeOpacity={0.7}
                        accessibilityRole='tab'
                        accessibilityLabel={label}
                        accessibilityState={{ selected: focused }}
                    >
                        <View
                            style={[
                                tabStyles.tabInner,
                                focused && tabStyles.tabInnerActive,
                            ]}
                        >
                            <FontAwesome
                                name={item.icon as any}
                                size={20}
                                color={
                                    focused
                                        ? Colors.tabBarActive
                                        : Colors.tabBarInactive
                                }
                            />
                            <Text
                                style={[
                                    tabStyles.label,
                                    focused && tabStyles.labelActive,
                                ]}
                            >
                                {label}
                            </Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </>
    );
}

const BAR_RADIUS = 32;

function CustomTabBar({ state, navigation, items }: any) {
    const insets = useSafeAreaInsets();
    const bottomMargin = Math.max(insets.bottom, 14);
    const Colors = useTheme();
    const { isDark } = useThemeMode();
    const tabStyles = makeTabStyles(Colors);

    const row = () => (
        <View style={tabStyles.row}>
            <TabBarContent
                state={state}
                navigation={navigation}
                items={items}
            />
        </View>
    );

    // True native Liquid Glass — one continuous frosted pill; the active
    // tab gets its own solid white capsule wrapped around icon + label.
    if (canUseLiquidGlass) {
        return (
            <View
                style={[tabStyles.wrapper, { paddingBottom: bottomMargin }]}
                pointerEvents='box-none'
            >
                <View style={tabStyles.shadowWrap}>
                    <GlassContainer spacing={20} style={tabStyles.bar}>
                        <GlassView
                            glassEffectStyle='regular'
                            colorScheme={isDark ? 'dark' : 'light'}
                            style={[
                                StyleSheet.absoluteFillObject,
                                tabStyles.barRadius,
                            ]}
                        />
                        {row()}
                    </GlassContainer>
                </View>
            </View>
        );
    }

    // iOS <26 — same frosted pill via the systemChromeMaterial BlurView.
    if (Platform.OS === 'ios') {
        return (
            <View
                style={[tabStyles.wrapper, { paddingBottom: bottomMargin }]}
                pointerEvents='box-none'
            >
                <View style={tabStyles.shadowWrap}>
                    <BlurView
                        intensity={80}
                        tint={
                            isDark
                                ? 'systemChromeMaterialDark'
                                : 'systemChromeMaterialLight'
                        }
                        style={tabStyles.bar}
                    >
                        {row()}
                    </BlurView>
                </View>
            </View>
        );
    }

    // Android has no native glass material. expo-blur does a real native
    // blur on SDK 31+ via the dimezisBlurView library; on older Android it
    // quietly renders a semi-transparent view instead, so we layer a themed
    // tint underneath to keep that path from looking washed out.
    return (
        <View
            style={[tabStyles.wrapper, { paddingBottom: bottomMargin }]}
            pointerEvents='box-none'
        >
            <View style={tabStyles.shadowWrap}>
                <BlurView
                    intensity={80}
                    tint={isDark ? 'dark' : 'light'}
                    blurMethod='dimezisBlurViewSdk31Plus'
                    style={tabStyles.bar}
                >
                    <View
                        style={[
                            StyleSheet.absoluteFill,
                            tabStyles.androidTint,
                            tabStyles.barRadius,
                        ]}
                        pointerEvents='none'
                    />
                    {row()}
                </BlurView>
            </View>
        </View>
    );
}

const makeTabStyles = (Colors: ThemeColors) =>
    StyleSheet.create({
        // Transparent margin around the floating pill — this is what separates it
        // from a flush, edge-to-edge "footer" bar.
        wrapper: {
            paddingHorizontal: 18,
            paddingTop: 8,
            backgroundColor: 'transparent',
        },
        shadowWrap: {
            borderRadius: BAR_RADIUS,
            ...Platform.select({
                ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.2,
                    shadowRadius: 22,
                },
                android: { elevation: 14 },
            }),
        },
        bar: {
            height: 64,
            borderRadius: BAR_RADIUS,
            overflow: 'hidden',
        },
        barRadius: { borderRadius: BAR_RADIUS },
        androidTint: { backgroundColor: Colors.tabBar, opacity: 0.6 },
        row: { flexDirection: 'row', flex: 1, paddingHorizontal: 6 },
        tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
        // Wraps icon + label together — the active tab gets a solid white
        // capsule around both, matching the reference design.
        tabInner: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 8,
            paddingHorizontal: 10,
            borderRadius: 20,
        },
        tabInnerActive: { backgroundColor: Colors.white },
        label: {
            fontSize: 10,
            marginTop: 4,
            color: Colors.tabBarInactive,
            fontWeight: '500',
            fontFamily: 'Poppins_500Medium',
        },
        labelActive: {
            color: Colors.tabBarActive,
            fontWeight: '700',
            fontFamily: 'Poppins_700Bold',
        },
    });

export default function TabNavigator() {
    const { isDoctor } = useAuth();
    const items = isDoctor ? DOCTOR_TABS : PATIENT_TABS;

    return (
        <Tab.Navigator
            initialRouteName={isDoctor ? 'DashboardTab' : 'HomeTab'}
            tabBar={(props) => (
                <CustomTabBar
                    {...props}
                    items={items}
                />
            )}
            screenOptions={{ headerShown: false }}
        >
            {isDoctor ? (
                <>
                    <Tab.Screen
                        name='EarningsTab'
                        component={EarningsNavigator}
                    />
                    <Tab.Screen
                        name='PatientsTab'
                        component={PatientsNavigator}
                    />
                    <Tab.Screen
                        name='DashboardTab'
                        component={DashboardNavigator}
                    />
                    <Tab.Screen
                        name='SchedulerTab'
                        component={AppointmentsNavigator}
                    />
                    <Tab.Screen
                        name='SettingsTab'
                        component={SettingsNavigator}
                    />
                </>
            ) : (
                <>
                    <Tab.Screen
                        name='SearchTab'
                        component={SearchNavigator}
                    />
                    <Tab.Screen
                        name='AppointmentsTab'
                        component={AppointmentsNavigator}
                    />
                    <Tab.Screen
                        name='HomeTab'
                        component={HomeNavigator}
                    />
                    <Tab.Screen
                        name='PrescriptionsTab'
                        component={PrescriptionsNavigator}
                    />
                    <Tab.Screen
                        name='AccountTab'
                        component={AccountNavigator}
                    />
                </>
            )}
        </Tab.Navigator>
    );
}
