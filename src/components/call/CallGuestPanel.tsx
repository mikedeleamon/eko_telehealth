import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Alert,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import SheetModal from '../common/SheetModal';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../theme';
import { useTranslation } from '../../i18n/useTranslation';
import { useAdmitCallGuest, useCallInvites, useInviteToCall, useRemoveCallGuest } from '../../hooks/queries';
import type { CallInvite } from '../../api/types';

interface Props {
  /** The visit whose guest list this is. No appointment, no conference. */
  appointmentId?: string;
  /** Poll for knocks only while the call is actually up. */
  active: boolean;
}

/**
 * Conference controls for a visit's call (patient-feedback item 10): invite a
 * third party, see who is knocking, let them in, remove them.
 *
 * Rendered by both call screens for the two PARTIES to a visit. A guest gets
 * 404s from the invite list by design — who else was invited is not theirs to
 * know — so the panel simply stays empty for them rather than erroring.
 *
 * The knock prompt is polled rather than pushed: Stream carries the media, not
 * our membership state, and there is no other realtime channel to the app.
 */
export default function CallGuestPanel({ appointmentId, active }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [email, setEmail] = useState('');

  const { data: invites = [] } = useCallInvites(appointmentId, active);
  const invite = useInviteToCall(appointmentId);
  const admit = useAdmitCallGuest(appointmentId);
  const remove = useRemoveCallGuest(appointmentId);

  const knocking = invites.filter((i) => i.status === 'knocking');
  const present = invites.filter((i) => i.status === 'admitted');

  const send = async () => {
    const value = email.trim();
    if (!value) return;
    try {
      await invite.mutateAsync(value);
      setEmail('');
      setSheetOpen(false);
    } catch (err) {
      Alert.alert(t('call.inviteFailed'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    }
  };

  const confirmRemove = (guest: CallInvite) => {
    Alert.alert(t('call.removeGuestTitle', { name: guest.inviteeName }), t('call.removeGuestConfirm'), [
      { text: t('documents.cancel'), style: 'cancel' },
      { text: t('call.removeGuest'), style: 'destructive', onPress: () => remove.mutate(guest.id) },
    ]);
  };

  if (!appointmentId) return null;

  return (
    <>
      {/* Knock prompts sit above everything: someone is waiting at the door. */}
      {knocking.map((guest) => (
        <View key={guest.id} style={styles.knockCard}>
          <FontAwesome name="hand-paper-o" size={16} color={Colors.white} />
          <Text style={styles.knockText} numberOfLines={2}>
            {t('call.knockingTitle', { name: guest.inviteeName })}
          </Text>
          <TouchableOpacity
            style={styles.admitBtn}
            onPress={() => admit.mutate(guest.id)}
            accessibilityRole="button"
            accessibilityLabel={t('call.admit')}
          >
            <Text style={styles.admitText}>{t('call.admit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => remove.mutate(guest.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={t('call.removeGuest')}
          >
            <FontAwesome name="times" size={16} color="rgba(255,255,255,0.75)" />
          </TouchableOpacity>
        </View>
      ))}

      {/* Who is already in the room, beyond the two parties. */}
      {present.length > 0 && (
        <View style={styles.presentRow}>
          {present.map((guest) => (
            <TouchableOpacity
              key={guest.id}
              style={styles.presentChip}
              onPress={() => confirmRemove(guest)}
              accessibilityRole="button"
              accessibilityLabel={`${guest.inviteeName} — ${t('call.removeGuest')}`}
            >
              <FontAwesome name="user" size={11} color={Colors.white} />
              <Text style={styles.presentText} numberOfLines={1}>{guest.inviteeName}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <SheetModal visible={sheetOpen} onRequestClose={() => setSheetOpen(false)}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setSheetOpen(false)}>
            <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
              <View style={styles.grabber} />
              <Text style={styles.sheetTitle}>{t('call.inviteTitle')}</Text>
              <Text style={styles.sheetHint}>{t('call.inviteHint')}</Text>

              <Text style={styles.fieldLabel}>{t('call.inviteEmailLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('call.inviteEmailPlaceholder')}
                placeholderTextColor={Colors.textGray}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                accessibilityLabel={t('call.inviteEmailLabel')}
              />

              <TouchableOpacity
                style={[styles.sendBtn, (!email.trim() || invite.isPending) && styles.sendBtnDisabled]}
                onPress={send}
                disabled={!email.trim() || invite.isPending}
                accessibilityRole="button"
                accessibilityLabel={t('call.inviteSend')}
              >
                {invite.isPending ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.sendText}>{t('call.inviteSend')}</Text>
                )}
              </TouchableOpacity>

              {invites.length === 0 ? (
                <Text style={styles.emptyText}>{t('call.noGuests')}</Text>
              ) : (
                invites.map((guest) => (
                  <View key={guest.id} style={styles.guestRow}>
                    <View style={styles.guestInfo}>
                      <Text style={styles.guestName} numberOfLines={1}>{guest.inviteeName}</Text>
                      <Text style={styles.guestStatus}>
                        {guest.status === 'admitted'
                          ? t('call.guestAdmitted')
                          : guest.status === 'knocking'
                            ? t('call.guestKnocking')
                            : t('call.guestInvited')}
                      </Text>
                    </View>
                    {guest.status === 'knocking' && (
                      <TouchableOpacity
                        style={styles.rowAdmit}
                        onPress={() => admit.mutate(guest.id)}
                        accessibilityRole="button"
                        accessibilityLabel={t('call.admit')}
                      >
                        <Text style={styles.rowAdmitText}>{t('call.admit')}</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => confirmRemove(guest)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityRole="button"
                      accessibilityLabel={t('call.removeGuest')}
                    >
                      <FontAwesome name="trash-o" size={17} color={Colors.red} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SheetModal>

      {/* The control that opens all of the above, styled to sit in the call bar. */}
      <GuestButton onPress={() => setSheetOpen(true)} count={present.length} pending={knocking.length} />
    </>
  );
}

/**
 * Exported so the call screens can place it inside their own control row —
 * the panel renders it last so the button's position is the screen's choice,
 * not this component's.
 */
function GuestButton({ onPress, count, pending }: { onPress: () => void; count: number; pending: number }) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={styles.floatingGuestBtn}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('call.guests')}
    >
      <FontAwesome name="user-plus" size={16} color={Colors.white} />
      <Text style={styles.floatingGuestText}>{count > 0 ? `${t('call.guests')} · ${count}` : t('call.addGuest')}</Text>
      {pending > 0 && <View style={styles.pendingDot} />}
    </TouchableOpacity>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },

  knockCard: {
    position: 'absolute', top: 110, left: 16, right: 16, zIndex: 20,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(0,0,0,0.72)', borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  knockText: { flex: 1, color: Colors.white, fontSize: 13, fontFamily: 'Poppins_500Medium' },
  admitBtn: { backgroundColor: Colors.green, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7 },
  admitText: { color: Colors.white, fontSize: 12, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' },

  presentRow: {
    position: 'absolute', top: 168, left: 16, right: 16, zIndex: 15,
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
  },
  presentChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 14,
    paddingHorizontal: 10, paddingVertical: 5, maxWidth: 180,
  },
  presentText: { color: Colors.white, fontSize: 11, fontFamily: 'Poppins_500Medium' },

  floatingGuestBtn: {
    position: 'absolute', top: 56, left: 16, zIndex: 15,
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 18,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  floatingGuestText: { color: Colors.white, fontSize: 12, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  pendingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.orange },

  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 36,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderGray, marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  sheetHint: { fontSize: 12.5, color: Colors.textGray, marginTop: 6, marginBottom: 18, lineHeight: 18, fontFamily: 'Poppins_400Regular' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMedium, marginBottom: 8, fontFamily: 'Poppins_600SemiBold' },
  input: {
    backgroundColor: Colors.field, borderRadius: 12, paddingHorizontal: 14, height: 50,
    fontSize: 14, color: Colors.textDark, marginBottom: 14, fontFamily: 'Poppins_400Regular',
  },
  sendBtn: {
    backgroundColor: Colors.primary, borderRadius: 24, height: 48,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { color: Colors.white, fontSize: 15, fontWeight: '700', fontFamily: 'Poppins_700Bold' },

  emptyText: { fontSize: 13, color: Colors.textGray, textAlign: 'center', fontFamily: 'Poppins_400Regular' },
  guestRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderTopWidth: 1, borderTopColor: Colors.borderGray, paddingVertical: 12,
  },
  guestInfo: { flex: 1 },
  guestName: { fontSize: 14, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },
  guestStatus: { fontSize: 12, color: Colors.textGray, marginTop: 1, fontFamily: 'Poppins_400Regular' },
  rowAdmit: { backgroundColor: Colors.green, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  rowAdmitText: { color: Colors.white, fontSize: 12, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' },
});
