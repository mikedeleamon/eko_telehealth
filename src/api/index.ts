/**
 * Eko Telehealth API surface.
 *
 * Every function documents the real backend route it will call. While
 * env.useMockApi is true (the default until EXPO_PUBLIC_API_URL is set),
 * calls are served by the in-app mock adapter instead — same types, same
 * behavior, no backend required.
 */
import { env } from '../config/env';
import { request } from './client';
import { mockApi } from './mock/mockApi';
import type {
  Appointment,
  AppNotification,
  AuthSession,
  CallTokenGrant,
  ChatMessage,
  ChatTokenGrant,
  Conversation,
  CreateAppointmentInput,
  Doctor,
  DoctorAgendaItem,
  PatientSummary,
  PaymentIntent,
  PaymentStatus,
  ProviderState,
  Review,
  User,
  UserRole,
} from './types';

export const api = {
  auth: {
    /** POST /auth/login */
    login(email: string, password: string, role: UserRole): Promise<AuthSession> {
      if (env.useMockApi) return mockApi.login(email, password, role);
      return request<AuthSession>('/auth/login', { method: 'POST', body: { email, password, role }, anonymous: true });
    },

    /** POST /auth/signup — `phone` enables SMS password reset for the account. */
    signup(input: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      role: UserRole;
      phone?: string;
    }): Promise<AuthSession> {
      if (env.useMockApi) return mockApi.signup(input);
      return request<AuthSession>('/auth/signup', { method: 'POST', body: input, anonymous: true });
    },

    /** POST /auth/forgot-password */
    requestPasswordReset(email: string): Promise<void> {
      if (env.useMockApi) return Promise.resolve();
      return request<void>('/auth/forgot-password', { method: 'POST', body: { email }, anonymous: true });
    },

    /**
     * POST /auth/reset-password — set a new password using a delivered code.
     * Anonymous: the code is the proof of identity, and the backend requires it
     * to have been issued to this exact destination (email address or phone).
     */
    resetPassword(
      channel: 'email' | 'sms',
      destination: string,
      code: string,
      newPassword: string,
    ): Promise<void> {
      if (env.useMockApi) return Promise.resolve();
      return request<void>('/auth/reset-password', {
        method: 'POST',
        body: { channel, destination, code, newPassword },
        anonymous: true,
      });
    },

    /** PATCH /auth/me — update the signed-in user's profile (not email; that's the login id). */
    updateProfile(input: { firstName?: string; lastName?: string; phone?: string }): Promise<User> {
      if (env.useMockApi) return mockApi.updateProfile(input);
      return request<User>('/auth/me', { method: 'PATCH', body: input });
    },

    /** POST /auth/change-password — signed-in change; needs the current password. */
    changePassword(currentPassword: string, newPassword: string): Promise<void> {
      if (env.useMockApi) return Promise.resolve();
      return request<void>('/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      });
    },

    /** POST /auth/send-code — send an email/SMS verification code. */
    requestCode(channel: 'email' | 'sms', destination: string): Promise<void> {
      if (env.useMockApi) return Promise.resolve();
      return request<void>('/auth/send-code', { method: 'POST', body: { channel, destination }, anonymous: true });
    },

    /**
     * POST /auth/verify — email or SMS OTP check. `destination` is required:
     * the backend binds each code to the address/number it was sent to.
     */
    verifyCode(channel: 'email' | 'sms', destination: string, code: string): Promise<void> {
      if (env.useMockApi) return Promise.resolve();
      return request<void>('/auth/verify', {
        method: 'POST',
        body: { channel, destination, code },
        anonymous: true,
      });
    },
  },

  doctors: {
    /** GET /doctors?category=&query= */
    list(params?: { category?: string; query?: string }): Promise<Doctor[]> {
      if (env.useMockApi) return mockApi.getDoctors(params);
      const qs = new URLSearchParams();
      if (params?.category) qs.set('category', params.category);
      if (params?.query) qs.set('query', params.query);
      const suffix = qs.toString() ? `?${qs}` : '';
      return request<Doctor[]>(`/doctors${suffix}`);
    },

    /** GET /doctors/:id */
    get(id: string): Promise<Doctor | undefined> {
      if (env.useMockApi) return mockApi.getDoctor(id);
      return request<Doctor>(`/doctors/${id}`);
    },
  },

  appointments: {
    /** GET /appointments (scoped to the signed-in user by the backend) */
    list(): Promise<Appointment[]> {
      if (env.useMockApi) return mockApi.getAppointments();
      return request<Appointment[]>('/appointments');
    },

    /** POST /appointments */
    create(input: CreateAppointmentInput): Promise<Appointment> {
      if (env.useMockApi) return mockApi.createAppointment(input);
      return request<Appointment>('/appointments', { method: 'POST', body: input });
    },

    /** POST /appointments/:id/cancel */
    cancel(id: string): Promise<void> {
      if (env.useMockApi) return Promise.resolve();
      return request<void>(`/appointments/${id}/cancel`, { method: 'POST' });
    },
  },

  messaging: {
    /** GET /conversations */
    conversations(): Promise<Conversation[]> {
      if (env.useMockApi) return mockApi.getConversations();
      return request<Conversation[]>('/conversations');
    },

    /** POST /conversations — start (or return) a thread with a doctor; the
     *  backend also ensures the Stream channel exists with both members. */
    createConversation(doctorId: string): Promise<Conversation> {
      if (env.useMockApi) return mockApi.createConversation(doctorId);
      return request<Conversation>('/conversations', { method: 'POST', body: { doctorId } });
    },

    /** GET /conversations/:id/messages */
    messages(conversationId: string): Promise<ChatMessage[]> {
      if (env.useMockApi) return mockApi.getMessages(conversationId);
      return request<ChatMessage[]>(`/conversations/${conversationId}/messages`);
    },
  },

  notifications: {
    /** GET /notifications */
    list(): Promise<AppNotification[]> {
      if (env.useMockApi) return mockApi.getNotifications();
      return request<AppNotification[]>('/notifications');
    },
  },

  // Doctor-side resources
  practice: {
    /** GET /practice/patients */
    patients(): Promise<PatientSummary[]> {
      if (env.useMockApi) return mockApi.getPatients();
      return request<PatientSummary[]>('/practice/patients');
    },

    /** GET /practice/agenda */
    agenda(): Promise<DoctorAgendaItem[]> {
      if (env.useMockApi) return mockApi.getDoctorAgenda();
      return request<DoctorAgendaItem[]>('/practice/agenda');
    },

    /**
     * GET /practice/appointments — the doctor's own appointments.
     * `/appointments` is patient-scoped, so doctors need their own listing.
     */
    appointments(): Promise<Appointment[]> {
      if (env.useMockApi) return mockApi.getDoctorAppointments();
      return request<Appointment[]>('/practice/appointments');
    },

    /** POST /practice/appointments/:id/accept — accept; patient must then pay. */
    accept(id: string): Promise<Appointment> {
      if (env.useMockApi) return mockApi.decideAppointment(id, 'pending_payment');
      return request<Appointment>(`/practice/appointments/${id}/accept`, { method: 'POST' });
    },

    /** POST /practice/appointments/:id/decline */
    decline(id: string, reason?: string): Promise<Appointment> {
      if (env.useMockApi) return mockApi.decideAppointment(id, 'declined');
      return request<Appointment>(`/practice/appointments/${id}/decline`, { method: 'POST', body: { reason } });
    },
  },

  payments: {
    /**
     * POST /payments/intent — backend creates a Flutterwave/PayPal checkout.
     * Only valid once the doctor has accepted (status 'pending_payment').
     */
    createIntent(input: { appointmentId: string; provider: 'flutterwave' | 'paypal' }): Promise<PaymentIntent> {
      if (env.useMockApi) return mockApi.createPaymentIntent(input);
      return request<PaymentIntent>('/payments/intent', { method: 'POST', body: input });
    },

    /**
     * GET /payments/:id — poll after returning from the hosted checkout. The
     * provider redirect carries no trustworthy result, so this is the only way
     * to learn whether the money actually moved.
     */
    get(id: string): Promise<PaymentStatus> {
      if (env.useMockApi) return mockApi.getPaymentStatus(id);
      return request<PaymentStatus>(`/payments/${id}`);
    },
  },

  providers: {
    /** GET /providers/me — this Doctor account's onboarding state. */
    me(): Promise<ProviderState> {
      if (env.useMockApi) return mockApi.getProviderState();
      return request<ProviderState>('/providers/me');
    },

    /** POST /providers/apply — submit for admin review; approval creates the profile. */
    apply(input: { specialty: string; category: string; location: string; fee: string }): Promise<{ id: string; status: string; submittedAt: string }> {
      if (env.useMockApi) return Promise.resolve({ id: 'mock-app', status: 'pending', submittedAt: 'Today' });
      return request('/providers/apply', { method: 'POST', body: input });
    },
  },

  calls: {
    /** POST /calls/token — backend mints a Stream Video access token for the room. */
    token(roomName: string): Promise<CallTokenGrant> {
      if (env.useMockApi) return mockApi.getCallToken(roomName);
      return request<CallTokenGrant>('/calls/token', { method: 'POST', body: { roomName } });
    },
  },

  chat: {
    /** POST /chat/token — backend mints a Stream Chat access token for the user. */
    token(): Promise<ChatTokenGrant> {
      if (env.useMockApi) return mockApi.getChatToken();
      return request<ChatTokenGrant>('/chat/token', { method: 'POST' });
    },
  },

  reviews: {
    /** GET /reviews?subject= — published reviews (moderated by the admin console). */
    list(subject?: string): Promise<Review[]> {
      if (env.useMockApi) return mockApi.getReviews();
      const suffix = subject ? `?subject=${encodeURIComponent(subject)}` : '';
      return request<Review[]>(`/reviews${suffix}`);
    },

    /** POST /reviews — submit for moderation; goes live once an admin approves. */
    submit(input: { subject: string; rating: number; text: string }): Promise<Review> {
      if (env.useMockApi) return mockApi.submitReview(input);
      return request<Review>('/reviews', { method: 'POST', body: input });
    },
  },
};
