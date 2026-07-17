import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '../../../constants/Colors';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoButton from '../../../components/common/EkoButton';
import { api } from '../../../api';
import { queryKeys } from '../../../hooks/queries';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

const POLL_MS = 3000;
/** ~1 minute: webhooks usually land in seconds, but the provider can lag. */
const MAX_POLLS = 20;

/**
 * Shown after handing off to the provider's hosted checkout.
 *
 * The redirect back from a payment provider proves nothing — only our backend
 * webhook does — so this polls GET /payments/:id until the appointment flips to
 * 'upcoming' rather than assuming success on return.
 */
export default function PaymentPendingScreen({ navigation, route }: Props) {
  const { paymentId, doctor, appointment } = route.params ?? {};
  const [state, setState] = useState<'polling' | 'confirmed' | 'failed' | 'timeout'>('polling');
  const qc = useQueryClient();
  const cancelled = useRef(false);

  useEffect(() => {
    if (!paymentId) {
      setState('timeout');
      return;
    }
    let tries = 0;

    const tick = async () => {
      if (cancelled.current) return;
      try {
        const payment = await api.payments.get(paymentId);
        if (cancelled.current) return;

        if (payment.appointmentStatus === 'upcoming' || payment.status === 'succeeded') {
          qc.invalidateQueries({ queryKey: queryKeys.appointments });
          qc.invalidateQueries({ queryKey: queryKeys.notifications });
          setState('confirmed');
          return;
        }
        if (payment.status === 'failed') {
          setState('failed');
          return;
        }
      } catch {
        // Transient error — keep polling; the timeout path is the backstop.
      }
      if (++tries >= MAX_POLLS) {
        setState('timeout');
        return;
      }
      setTimeout(tick, POLL_MS);
    };

    tick();
    return () => {
      cancelled.current = true;
    };
  }, [paymentId, qc]);

  const body = {
    polling: {
      icon: null,
      title: 'Confirming your payment…',
      text: 'This usually takes a few seconds. You can leave this screen — we\'ll notify you either way.',
    },
    confirmed: {
      icon: 'check-circle' as const,
      title: 'Appointment Confirmed',
      text: `Your visit with ${doctor?.name ?? 'your doctor'} is booked and paid.`,
    },
    failed: {
      icon: 'times-circle' as const,
      title: 'Payment Failed',
      text: 'Your payment did not go through, so the visit is still awaiting payment. You can try again.',
    },
    timeout: {
      icon: 'clock-o' as const,
      title: 'Still Processing',
      text: 'Your payment is taking longer than usual to confirm. We\'ll notify you once it clears — no need to pay again.',
    },
  }[state];

  const iconColor =
    state === 'confirmed' ? Colors.green : state === 'failed' ? Colors.red : Colors.accent;

  return (
    <View style={styles.container}>
      <EkoHeader title="Payment" onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        {state === 'polling' ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />
        ) : (
          <FontAwesome name={body.icon!} size={64} color={iconColor} style={styles.spinner} />
        )}

        <Text style={styles.title}>{body.title}</Text>
        <Text style={styles.text}>{body.text}</Text>

        {state !== 'polling' && (
          <View style={styles.actions}>
            {state === 'failed' && (
              <EkoButton
                title="Try Again"
                variant="accent"
                onPress={() => navigation.replace('Payment', { appointment, doctor })}
                style={styles.btn}
              />
            )}
            <EkoButton
              title="View Appointments"
              variant={state === 'failed' ? 'outline' : 'accent'}
              onPress={() => navigation.navigate('AppointmentsTab')}
              style={styles.btn}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  spinner: { marginBottom: 28 },
  title: {
    fontSize: 22, fontWeight: '700', color: Colors.textDark,
    marginBottom: 12, textAlign: 'center', fontFamily: 'Poppins_700Bold',
  },
  text: {
    fontSize: 14, color: Colors.textGray, textAlign: 'center',
    lineHeight: 22, fontFamily: 'Poppins_400Regular',
  },
  actions: { marginTop: 32, alignSelf: 'stretch', gap: 12 },
  btn: { width: '100%' },
});
