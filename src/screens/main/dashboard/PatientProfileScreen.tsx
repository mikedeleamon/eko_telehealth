import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import Cross from '../../../components/common/Cross';
import type { PatientSummary } from '../../../api/types';
import { useTranslation } from '../../../i18n/useTranslation';

interface Props {
    navigation: NativeStackNavigationProp<any>;
    route: RouteProp<any>;
}

interface Vital {
    icon: string;
    label: string;
    value?: string;
    color: string;
}

export default function PatientProfileScreen({ navigation, route }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const patient = route.params?.patient as PatientSummary | undefined;

    if (!patient) {
        return (
            <View style={styles.missing}>
                <Text style={styles.missingText}>{t('patients.patientNotFoundDot')}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel={t('common.goBack')}>
                    <Text style={styles.missingLink}>{t('common.goBack')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const b = patient.biometrics ?? {};
    const vitals: Vital[] = [
        {
            icon: 'heartbeat',
            label: t('patients.bloodPressure'),
            value: b.bloodPressure,
            color: Colors.red,
        },
        {
            icon: 'heart',
            label: t('patients.heartRate'),
            value: b.heartRate,
            color: Colors.accent,
        },
        {
            icon: 'thermometer-half',
            label: t('patients.temperature'),
            value: b.temperature,
            color: Colors.orange,
        },
        {
            icon: 'balance-scale',
            label: t('patients.weight'),
            value: b.weight,
            color: Colors.primary,
        },
        {
            icon: 'arrows-v',
            label: t('patients.height'),
            value: b.height,
            color: Colors.blue,
        },
        { icon: 'calculator', label: t('patients.bmi'), value: b.bmi, color: Colors.green },
    ].filter((v) => !!v.value);

    const counterpart = { id: patient.id, name: patient.name };

    return (
        <View style={styles.container}>
            <StatusBar barStyle='light-content' />

            <ScrollView
                contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                showsVerticalScrollIndicator={false}
            >
                <LinearGradient
                    colors={[Colors.gradientStart, Colors.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.header, { paddingTop: insets.top + 12 }]}
                >
                    <Cross
                        size={140}
                        opacity={0.09}
                        rotation={14}
                        style={{ top: -40, right: -20 }}
                    />
                    <Cross
                        size={70}
                        opacity={0.07}
                        rotation={-12}
                        style={{ bottom: 20, left: -18 }}
                    />
                    <Cross
                        size={44}
                        opacity={0.06}
                        rotation={20}
                        style={{ top: 40, right: 90 }}
                    />

                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backBtn}
                        hitSlop={hit}
                        accessibilityRole="button"
                        accessibilityLabel={t('a11y.back')}
                    >
                        <FontAwesome
                            name='arrow-left'
                            size={20}
                            color={Colors.white}
                        />
                    </TouchableOpacity>

                    <View style={styles.profileArea}>
                        <View style={styles.avatar}>
                            <FontAwesome
                                name='user'
                                size={40}
                                color={Colors.primary}
                            />
                        </View>
                        <Text style={styles.name}>{patient.name}</Text>
                        <Text style={styles.sub}>
                            {patient.age} {t('patients.yearsShort')} · {t(`options.gender.${patient.gender}`, { defaultValue: patient.gender })}
                        </Text>
                        <View style={styles.conditionPill}>
                            <Text style={styles.conditionText}>
                                {patient.condition}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.body}>
                    {/* Current Reason for visit */}
                    <Text style={styles.sectionTitle}>
                        {t('patients.currentReasonForVisit')}
                    </Text>
                    <View style={styles.card}>
                        <View style={styles.cardIconRow}>
                            <View
                                style={[
                                    styles.cardIcon,
                                    { backgroundColor: Colors.primaryFaded },
                                ]}
                            >
                                <FontAwesome
                                    name='stethoscope'
                                    size={16}
                                    color={Colors.primary}
                                />
                            </View>
                            <Text style={styles.reasonText}>
                                {patient.reason ?? patient.condition}
                            </Text>
                        </View>
                        {patient.symptoms ? (
                            <>
                                <View style={styles.divider} />
                                <Text style={styles.symptomLabel}>
                                    {t('patients.reportedSymptoms')}
                                </Text>
                                <Text style={styles.symptomText}>
                                    {patient.symptoms}
                                </Text>
                            </>
                        ) : null}
                    </View>

                    {/* Biometrics */}
                    {vitals.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>{t('patients.biometrics')}</Text>
                            <View style={styles.vitalsGrid}>
                                {vitals.map((v) => (
                                    <View
                                        key={v.label}
                                        style={styles.vitalCard}
                                    >
                                        <View
                                            style={[
                                                styles.vitalIcon,
                                                {
                                                    backgroundColor:
                                                        v.color + '1A',
                                                },
                                            ]}
                                        >
                                            <FontAwesome
                                                name={v.icon as any}
                                                size={16}
                                                color={v.color}
                                            />
                                        </View>
                                        <Text style={styles.vitalValue}>
                                            {v.value}
                                        </Text>
                                        <Text style={styles.vitalLabel}>
                                            {v.label}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    {/* Medical info */}
                    <Text style={styles.sectionTitle}>{t('patients.medicalInformation')}</Text>
                    <View style={styles.card}>
                        <InfoRow
                            icon='tint'
                            label={t('patients.bloodTypeLabel')}
                            value={b.bloodType ?? '—'}
                        />
                        <View style={styles.divider} />
                        <InfoRow
                            icon='exclamation-triangle'
                            label={t('patients.allergies')}
                            value={patient.allergies ?? t('account.noneReported')}
                        />
                        <View style={styles.divider} />
                        <InfoRow
                            icon='calendar-check-o'
                            label={t('patients.lastVisitInfo')}
                            value={patient.lastVisit}
                        />
                    </View>

                    {/* Contact */}
                    {(patient.phone || patient.email) && (
                        <>
                            <Text style={styles.sectionTitle}>{t('patients.contactLabel')}</Text>
                            <View style={styles.card}>
                                {patient.phone ? (
                                    <InfoRow
                                        icon='phone'
                                        label={t('patients.phoneLabel')}
                                        value={patient.phone}
                                    />
                                ) : null}
                                {patient.phone && patient.email ? (
                                    <View style={styles.divider} />
                                ) : null}
                                {patient.email ? (
                                    <InfoRow
                                        icon='envelope-o'
                                        label={t('patients.emailLabel')}
                                        value={patient.email}
                                    />
                                ) : null}
                            </View>
                        </>
                    )}

                    {/* Medical records — shared visit notes across doctors */}
                    <TouchableOpacity
                        style={styles.historyRow}
                        onPress={() =>
                            navigation.navigate('MedicalHistory', { patient })
                        }
                        activeOpacity={0.85}
                    >
                        <View style={styles.historyIcon}>
                            <FontAwesome
                                name='folder-open-o'
                                size={17}
                                color={Colors.primary}
                            />
                        </View>
                        <View style={styles.historyInfo}>
                            <Text style={styles.historyTitle}>
                                {t('patients.medicalHistory')}
                            </Text>
                            <Text style={styles.historySub}>
                                {t('patients.visitNotesAllDoctors')}
                            </Text>
                        </View>
                        <FontAwesome
                            name='chevron-right'
                            size={14}
                            color={Colors.textGray}
                        />
                    </TouchableOpacity>

                    {/* Prescription history — current medications + past scripts */}
                    <TouchableOpacity
                        style={styles.historyRowStacked}
                        onPress={() =>
                            navigation.navigate('PrescriptionHistory', { patient })
                        }
                        activeOpacity={0.85}
                    >
                        <View style={styles.historyIcon}>
                            <FontAwesome
                                name='medkit'
                                size={16}
                                color={Colors.primary}
                            />
                        </View>
                        <View style={styles.historyInfo}>
                            <Text style={styles.historyTitle}>
                                {t('prescriptions.title')}
                            </Text>
                            <Text style={styles.historySub}>
                                {t('prescriptions.profileSubtitle')}
                            </Text>
                        </View>
                        <FontAwesome
                            name='chevron-right'
                            size={14}
                            color={Colors.textGray}
                        />
                    </TouchableOpacity>

                    {/* Labs — shared lab results, view + add */}
                    <TouchableOpacity
                        style={styles.historyRowStacked}
                        onPress={() =>
                            navigation.navigate('Labs', { patient })
                        }
                        activeOpacity={0.85}
                    >
                        <View style={styles.historyIcon}>
                            <FontAwesome
                                name='flask'
                                size={16}
                                color={Colors.primary}
                            />
                        </View>
                        <View style={styles.historyInfo}>
                            <Text style={styles.historyTitle}>
                                {t('labs.title')}
                            </Text>
                            <Text style={styles.historySub}>
                                {t('labs.profileSubtitle')}
                            </Text>
                        </View>
                        <FontAwesome
                            name='chevron-right'
                            size={14}
                            color={Colors.textGray}
                        />
                    </TouchableOpacity>

                    {/* Actions */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.actionPrimary]}
                            onPress={() =>
                                navigation.navigate('VideoCall', {
                                    doctor: counterpart,
                                })
                            }
                            activeOpacity={0.85}
                            accessibilityRole="button"
                            accessibilityLabel={t('patients.startVisitBtn')}
                        >
                            <FontAwesome
                                name='video-camera'
                                size={16}
                                color={Colors.white}
                            />
                            <Text style={styles.actionPrimaryText}>
                                {t('patients.startVisitBtn')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.actionSecondary]}
                            onPress={() =>
                                navigation.navigate('Chat', {
                                    doctor: counterpart,
                                })
                            }
                            activeOpacity={0.85}
                            accessibilityRole="button"
                            accessibilityLabel={t('patients.messageBtn')}
                        >
                            <FontAwesome
                                name='comment-o'
                                size={16}
                                color={Colors.primary}
                            />
                            <Text style={styles.actionSecondaryText}>
                                {t('patients.messageBtn')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

function InfoRow({
    icon,
    label,
    value,
}: {
    icon: string;
    label: string;
    value: string;
}) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
    return (
        <View style={styles.infoRow}>
            <FontAwesome
                name={icon as any}
                size={15}
                color={Colors.textGray}
                style={styles.infoIcon}
            />
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );
}

const hit = { top: 8, bottom: 8, left: 8, right: 8 };

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bgLight },
    missing: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    missingText: {
        fontSize: 16,
        color: Colors.textGray,
        fontFamily: 'Poppins_400Regular',
    },
    missingLink: {
        fontSize: 15,
        color: Colors.primary,
        fontWeight: '700',
        fontFamily: 'Poppins_600SemiBold',
    },

    header: {
        paddingHorizontal: 20,
        paddingBottom: 28,
        overflow: 'hidden',
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        ...Platform.select({
            ios: {
                shadowColor: Colors.gradientStart,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
            },
            android: { elevation: 8 },
        }),
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        marginLeft: -8,
    },
    profileArea: { alignItems: 'center', marginTop: 4 },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    name: {
        fontSize: 21,
        fontWeight: '800',
        color: Colors.white,
        fontFamily: 'Poppins_700Bold',
    },
    sub: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 2,
        fontFamily: 'Poppins_400Regular',
    },
    conditionPill: {
        marginTop: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 12,
    },
    conditionText: {
        fontSize: 12,
        color: Colors.white,
        fontWeight: '600',
        fontFamily: 'Poppins_600SemiBold',
    },

    body: { padding: 16 },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textGray,
        marginTop: 16,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        fontFamily: 'Poppins_600SemiBold',
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.06)',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 8,
            },
            android: { elevation: 2 },
        }),
    },
    cardIconRow: { flexDirection: 'row', alignItems: 'flex-start' },
    cardIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    reasonText: {
        flex: 1,
        fontSize: 14,
        color: Colors.textDark,
        lineHeight: 20,
        fontFamily: 'Poppins_500Medium',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.borderGray,
        marginVertical: 12,
    },
    symptomLabel: {
        fontSize: 12,
        color: Colors.textGray,
        marginBottom: 4,
        fontFamily: 'Poppins_600SemiBold',
    },
    symptomText: {
        fontSize: 14,
        color: Colors.textMedium,
        lineHeight: 20,
        fontFamily: 'Poppins_400Regular',
    },

    vitalsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    vitalCard: {
        width: '31.5%',
        backgroundColor: Colors.surface,
        borderRadius: 14,
        padding: 12,
        alignItems: 'center',
        marginBottom: 10,
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.05)',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 6,
            },
            android: { elevation: 1 },
        }),
    },
    vitalIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    vitalValue: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textDark,
        textAlign: 'center',
        fontFamily: 'Poppins_700Bold',
    },
    vitalLabel: {
        fontSize: 10,
        color: Colors.textGray,
        marginTop: 2,
        textAlign: 'center',
        fontFamily: 'Poppins_400Regular',
    },

    infoRow: { flexDirection: 'row', alignItems: 'center' },
    infoIcon: { width: 22 },
    infoLabel: {
        fontSize: 13,
        color: Colors.textGray,
        fontFamily: 'Poppins_400Regular',
    },
    infoValue: {
        flex: 1,
        fontSize: 14,
        color: Colors.textDark,
        fontWeight: '600',
        textAlign: 'right',
        fontFamily: 'Poppins_600SemiBold',
    },

    historyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        marginTop: 24,
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.06)',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 8,
            },
            android: { elevation: 2 },
        }),
    },
    historyRowStacked: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        marginTop: 12,
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.06)',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 8,
            },
            android: { elevation: 2 },
        }),
    },
    historyIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: Colors.primaryFaded,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    historyInfo: { flex: 1 },
    historyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textDark,
        fontFamily: 'Poppins_600SemiBold',
    },
    historySub: {
        fontSize: 12,
        color: Colors.textGray,
        marginTop: 1,
        fontFamily: 'Poppins_400Regular',
    },

    actionsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 52,
        borderRadius: 26,
    },
    actionPrimary: { backgroundColor: Colors.primary },
    actionPrimaryText: {
        color: Colors.white,
        fontSize: 15,
        fontWeight: '700',
        fontFamily: 'Poppins_600SemiBold',
    },
    actionSecondary: { backgroundColor: Colors.primaryFaded },
    actionSecondaryText: {
        color: Colors.primary,
        fontSize: 15,
        fontWeight: '700',
        fontFamily: 'Poppins_600SemiBold',
    },
});
