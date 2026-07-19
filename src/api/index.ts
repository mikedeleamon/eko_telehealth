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
  CashoutInput,
  ChatMessage,
  ChatTokenGrant,
  Conversation,
  CreateAppointmentInput,
  Dependent,
  Doctor,
  DoctorAgendaItem,
  DoctorEarnings,
  Insurance,
  MedicalNote,
  MedicalNoteInput,
  PatientSummary,
  PaymentMethod,
  Pharmacy,
  Prescription,
  PrescriptionInput,
  PaymentIntent,
  PaymentStatus,
  ProviderState,
  Review,
  User,
  UserRole,
  UserSettings,
} from './types';

export const api = {
  auth: {
    /**
     * POST /auth/login — the account's type is resolved from the stored account
     * (users.account_type), never sent by the client, so a user can't sign in as
     * an account type theirs isn't.
     */
    login(email: string, password: string): Promise<AuthSession> {
      if (env.useMockApi) return mockApi.login(email, password);
      return request<AuthSession>('/auth/login', { method: 'POST', body: { email, password }, anonymous: true });
    },

    /**
     * POST /auth/signup — `phone` enables SMS password reset for the account.
     *
     * Returns no session: this only records a pending signup. The account is
     * created when the emailed code is confirmed via verifyCode('email', …),
     * so the user must verify before they can sign in.
     */
    signup(input: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      accountType: UserRole;
      phone?: string;
    }): Promise<void> {
      if (env.useMockApi) return mockApi.signup(input);
      return request<void>('/auth/signup', { method: 'POST', body: input, anonymous: true });
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

    /**
     * GET /practice/patients/:patientId/notes — every SOAP note for the
     * patient, across all treating doctors (shared record).
     */
    medicalNotes(patientId: string): Promise<MedicalNote[]> {
      if (env.useMockApi) return mockApi.getMedicalNotes(patientId);
      return request<MedicalNote[]>(`/practice/patients/${patientId}/notes`);
    },

    /**
     * POST /practice/patients/:patientId/notes — author identity comes from
     * the bearer token server-side; the client never sends doctor fields.
     */
    addMedicalNote(input: MedicalNoteInput): Promise<MedicalNote> {
      if (env.useMockApi) return mockApi.addMedicalNote(input);
      return request<MedicalNote>(`/practice/patients/${input.patientId}/notes`, { method: 'POST', body: input });
    },

    /**
     * POST /practice/notes/:noteId/amendments — append an amendment to a locked
     * record. Records are immutable, so there is no PATCH to edit the SOAP body;
     * corrections are made as append-only amendments. Author is stamped
     * server-side from the bearer token.
     */
    addNoteAmendment(noteId: string, text: string): Promise<MedicalNote> {
      if (env.useMockApi) return mockApi.addNoteAmendment(noteId, text);
      return request<MedicalNote>(`/practice/notes/${noteId}/amendments`, { method: 'POST', body: { text } });
    },

    /**
     * GET /practice/patients/:patientId/prescriptions — the patient's full
     * medication record (current + historical), shared across treating doctors.
     */
    prescriptions(patientId: string): Promise<Prescription[]> {
      if (env.useMockApi) return mockApi.getPrescriptions(patientId);
      return request<Prescription[]>(`/practice/patients/${patientId}/prescriptions`);
    },

    /**
     * POST /practice/patients/:patientId/prescriptions — write a new
     * prescription (becomes a current medication). Prescriber is stamped
     * server-side from the bearer token.
     */
    addPrescription(input: PrescriptionInput): Promise<Prescription> {
      if (env.useMockApi) return mockApi.addPrescription(input);
      return request<Prescription>(`/practice/patients/${input.patientId}/prescriptions`, { method: 'POST', body: input });
    },

    /** GET /practice/earnings — the doctor's wallet: balance + earnings ledger. */
    earnings(): Promise<DoctorEarnings> {
      if (env.useMockApi) return mockApi.getDoctorEarnings();
      return request<DoctorEarnings>('/practice/earnings');
    },

    /**
     * POST /practice/payouts — withdraw to the saved payment method. The
     * backend resolves the destination from /me/payment-method (never sent by
     * the client) and returns the updated wallet.
     */
    cashOut(input: CashoutInput): Promise<DoctorEarnings> {
      if (env.useMockApi) return mockApi.cashOut(input.amount);
      return request<DoctorEarnings>('/practice/payouts', { method: 'POST', body: input });
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

  /** Per-user records: dependents, insurance, pharmacy, settings. */
  me: {
    /** GET /me/dependents */
    dependents(): Promise<Dependent[]> {
      if (env.useMockApi) return mockApi.getDependents();
      return request<Dependent[]>('/me/dependents');
    },

    /** POST /me/dependents */
    addDependent(input: { firstName: string; lastName: string; dob: string; relationship?: string }): Promise<Dependent> {
      if (env.useMockApi) return mockApi.addDependent(input);
      return request<Dependent>('/me/dependents', { method: 'POST', body: input });
    },

    /** DELETE /me/dependents/:id */
    removeDependent(id: string): Promise<void> {
      if (env.useMockApi) return Promise.resolve();
      return request<void>(`/me/dependents/${id}`, { method: 'DELETE' });
    },

    /** GET /me/insurance — null when none saved. */
    insurance(): Promise<Insurance | null> {
      if (env.useMockApi) return mockApi.getInsurance();
      return request<Insurance | null>('/me/insurance');
    },

    /** PUT /me/insurance — upsert. */
    saveInsurance(input: Insurance): Promise<Insurance> {
      if (env.useMockApi) return mockApi.saveInsurance(input);
      return request<Insurance>('/me/insurance', { method: 'PUT', body: input });
    },

    /** GET /me/pharmacy — null when none saved. */
    pharmacy(): Promise<Pharmacy | null> {
      if (env.useMockApi) return mockApi.getPharmacy();
      return request<Pharmacy | null>('/me/pharmacy');
    },

    /** PUT /me/pharmacy — upsert. */
    savePharmacy(input: Pharmacy): Promise<Pharmacy> {
      if (env.useMockApi) return mockApi.savePharmacy(input);
      return request<Pharmacy>('/me/pharmacy', { method: 'PUT', body: input });
    },

    /**
     * GET /me/payment-method — the account's saved payment/payout method, or
     * null. Doctors withdraw to it; patients pay from it. See the production
     * note on PaymentMethod: a live backend returns only masked/tokenized data.
     */
    paymentMethod(): Promise<PaymentMethod | null> {
      if (env.useMockApi) return mockApi.getPaymentMethod();
      return request<PaymentMethod | null>('/me/payment-method');
    },

    /** PUT /me/payment-method — upsert. */
    savePaymentMethod(input: PaymentMethod): Promise<PaymentMethod> {
      if (env.useMockApi) return mockApi.savePaymentMethod(input);
      return request<PaymentMethod>('/me/payment-method', { method: 'PUT', body: input });
    },

    /** GET /me/settings — returns defaults before the first save. */
    settings(): Promise<UserSettings> {
      if (env.useMockApi) return mockApi.getSettings();
      return request<UserSettings>('/me/settings');
    },

    /** PATCH /me/settings — partial update. */
    saveSettings(input: Partial<UserSettings>): Promise<UserSettings> {
      if (env.useMockApi) return mockApi.saveSettings(input);
      return request<UserSettings>('/me/settings', { method: 'PATCH', body: input });
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
