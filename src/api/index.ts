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
  UserRole,
} from './types';

export const api = {
  auth: {
    /** POST /auth/login */
    login(email: string, password: string, role: UserRole): Promise<AuthSession> {
      if (env.useMockApi) return mockApi.login(email, password, role);
      return request<AuthSession>('/auth/login', { method: 'POST', body: { email, password, role }, anonymous: true });
    },

    /** POST /auth/signup */
    signup(input: { firstName: string; lastName: string; email: string; password: string; role: UserRole }): Promise<AuthSession> {
      if (env.useMockApi) return mockApi.signup(input);
      return request<AuthSession>('/auth/signup', { method: 'POST', body: input, anonymous: true });
    },

    /** POST /auth/forgot-password */
    requestPasswordReset(email: string): Promise<void> {
      if (env.useMockApi) return Promise.resolve();
      return request<void>('/auth/forgot-password', { method: 'POST', body: { email }, anonymous: true });
    },

    /** POST /auth/send-code — send an email/SMS verification code. */
    requestCode(channel: 'email' | 'sms', destination: string): Promise<void> {
      if (env.useMockApi) return Promise.resolve();
      return request<void>('/auth/send-code', { method: 'POST', body: { channel, destination }, anonymous: true });
    },

    /** POST /auth/verify — email or SMS OTP verification. */
    verifyCode(channel: 'email' | 'sms', code: string): Promise<void> {
      if (env.useMockApi) return Promise.resolve();
      return request<void>('/auth/verify', { method: 'POST', body: { channel, code } });
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
  },

  payments: {
    /** POST /payments/intent — backend creates a Flutterwave/PayPal checkout. */
    createIntent(input: { appointmentId: string; provider: 'flutterwave' | 'paypal' }): Promise<PaymentIntent> {
      if (env.useMockApi) return mockApi.createPaymentIntent(input);
      return request<PaymentIntent>('/payments/intent', { method: 'POST', body: input });
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
};
