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
  Complaint,
  ComplaintInput,
  ContentBlock,
  Conversation,
  CreateAppointmentInput,
  Currency,
  Dependent,
  Doctor,
  DoctorAgendaItem,
  DoctorEarnings,
  Insurance,
  LoginResult,
  MedicalNote,
  MedicalNoteInput,
  PatientSummary,
  PaymentMethod,
  Pharmacy,
  Prescription,
  PrescriptionInput,
  FeeBreakdown,
  PaymentIntent,
  PaymentPreview,
  PaymentReceipt,
  PaymentStatus,
  ProviderState,
  Review,
  ReviewSummary,
  StoredDocument,
  DocumentCategory,
  PickedFile,
  PresignResult,
  LabResult,
  LabInput,
  User,
  UserRole,
  UserSettings,
} from './types';

/**
 * Presign an R2 PUT for `kind`, upload the picked file's bytes straight to R2,
 * and return the object key to record with the metadata. Live mode only — the
 * backend never receives the bytes. Callers in mock mode skip this entirely.
 */
async function uploadToR2(kind: 'document' | 'lab', file: PickedFile): Promise<string> {
  const presign = await request<PresignResult>('/uploads/presign', {
    method: 'POST',
    body: { kind, contentType: file.mimeType },
  });
  const blob = await (await fetch(file.uri)).blob();
  const put = await fetch(presign.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.mimeType },
    body: blob,
  });
  if (!put.ok) throw new Error('Upload failed. Please try again.');
  return presign.key;
}

export const api = {
  auth: {
    /**
     * POST /auth/login — the account's type is resolved from the stored account
     * (users.account_type), never sent by the client, so a user can't sign in as
     * an account type theirs isn't.
     */
    login(email: string, password: string): Promise<LoginResult> {
      if (env.useMockApi) return mockApi.login(email, password);
      return request<LoginResult>('/auth/login', { method: 'POST', body: { email, password }, anonymous: true });
    },

    /**
     * POST /auth/login/verify-2fa — completes a login that returned a
     * TwoFactorChallenge. The challenge already proves the password checked
     * out; only the emailed code is needed here.
     */
    verifyLogin2FA(challenge: string, code: string): Promise<AuthSession> {
      if (env.useMockApi) return mockApi.verifyTwoFactorLogin(challenge, code);
      return request<AuthSession>('/auth/login/verify-2fa', { method: 'POST', body: { challenge, code }, anonymous: true });
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
    updateProfile(input: { firstName?: string; lastName?: string; phone?: string; spokenLanguages?: string[]; preferredCurrency?: string; twoFactorEnabled?: boolean }): Promise<User> {
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
     * GET /practice/appointments/:id/breakdown — the doctor's take-home detail
     * for a paid visit. 404s until a payment has actually settled.
     */
    appointmentBreakdown(id: string): Promise<FeeBreakdown> {
      if (env.useMockApi) return mockApi.getAppointmentBreakdown(id);
      return request<FeeBreakdown>(`/practice/appointments/${id}/breakdown`);
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
     * PATCH /practice/notes/:noteId — update a DRAFT record (save-draft-again or
     * finalize by sending status:'final'). Only drafts are mutable; a finalized
     * record is immutable and the backend rejects edits to it.
     */
    updateMedicalNote(noteId: string, input: MedicalNoteInput): Promise<MedicalNote> {
      if (env.useMockApi) return mockApi.updateMedicalNote(noteId, input);
      return request<MedicalNote>(`/practice/notes/${noteId}`, { method: 'PATCH', body: input });
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
     * GET /payments/preview/:appointmentId?code=X — the fee breakdown for a
     * visit, without creating a payment row or checkout session. Lets
     * PaymentScreen show "you'll pay ₦X" before the patient picks a
     * provider, and reflect a promo code's discount (or its rejection
     * reason) as the patient types one in.
     */
    preview(appointmentId: string, code?: string): Promise<PaymentPreview> {
      if (env.useMockApi) return mockApi.getPaymentPreview(appointmentId, code);
      const qs = code ? `?code=${encodeURIComponent(code)}` : '';
      return request<PaymentPreview>(`/payments/preview/${appointmentId}${qs}`);
    },

    /**
     * POST /payments/intent — backend creates a Flutterwave/PayPal checkout.
     * Only valid once the doctor has accepted (status 'pending_payment').
     * `code` is re-validated server-side — never trust the discount preview() showed.
     */
    createIntent(input: { appointmentId: string; provider: 'flutterwave' | 'paypal'; code?: string }): Promise<PaymentIntent> {
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

    /**
     * GET /me/prescriptions — the signed-in patient's own medication record
     * (current + historical). Read-only from the patient's side; only a
     * prescriber can add to it.
     */
    prescriptions(): Promise<Prescription[]> {
      if (env.useMockApi) return mockApi.getMyPrescriptions();
      return request<Prescription[]>('/me/prescriptions');
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

    /** GET /me/payments — this patient's settled payment history, newest first. */
    payments(): Promise<PaymentReceipt[]> {
      if (env.useMockApi) return mockApi.getMyPayments();
      return request<PaymentReceipt[]>('/me/payments');
    },
  },

  providers: {
    /** GET /providers/me — this Doctor account's onboarding state. */
    me(): Promise<ProviderState> {
      if (env.useMockApi) return mockApi.getProviderState();
      return request<ProviderState>('/providers/me');
    },

    /** POST /providers/apply — submit for admin review; approval creates the profile. */
    apply(input: { specialty: string; category: string; location: string; fee: string; spokenLanguages: string[] }): Promise<{ id: string; status: string; submittedAt: string }> {
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

  /** Doctor "Documents & Certifications" — R2-backed credential storage. */
  documents: {
    /** GET /me/documents */
    list(): Promise<StoredDocument[]> {
      if (env.useMockApi) return mockApi.getDocuments();
      return request<StoredDocument[]>('/me/documents');
    },

    /**
     * Upload a picked file and record it. In live mode this presigns an R2 PUT,
     * uploads the bytes straight to R2, then records the metadata — the backend
     * never receives the file. In mock mode it just stores the local uri.
     */
    async upload(input: { name: string; category: DocumentCategory; file: PickedFile }): Promise<StoredDocument> {
      const { name, category, file } = input;
      if (env.useMockApi) {
        return mockApi.addDocument({
          name,
          category,
          fileName: file.name,
          mimeType: file.mimeType,
          sizeBytes: file.size,
          url: file.uri,
        });
      }
      const key = await uploadToR2('document', file);
      return request<StoredDocument>('/me/documents', {
        method: 'POST',
        body: {
          name,
          category,
          fileName: file.name,
          mimeType: file.mimeType,
          sizeBytes: file.size,
          key,
        },
      });
    },

    /** DELETE /me/documents/:id */
    remove(id: string): Promise<void> {
      if (env.useMockApi) return mockApi.removeDocument(id);
      return request<void>(`/me/documents/${id}`, { method: 'DELETE' });
    },
  },

  /**
   * Lab results. Two surfaces share one store: a patient's own labs (/me/labs)
   * and a doctor viewing a roster patient's labs
   * (/practice/patients/:patientId/labs). Pass `patientId` for the doctor
   * surface; omit it for the signed-in patient's own record.
   */
  labs: {
    /** GET labs for a patient (doctor) or the signed-in patient (omit patientId). */
    list(patientId?: string): Promise<LabResult[]> {
      if (env.useMockApi) return mockApi.getLabs(patientId);
      return patientId
        ? request<LabResult[]>(`/practice/patients/${patientId}/labs`)
        : request<LabResult[]>('/me/labs');
    },

    /**
     * Add a lab result, optionally with a scanned report. In live mode a report
     * is uploaded to R2 first (presigned PUT) and only its key is recorded.
     */
    async add(target: { patientId?: string }, data: LabInput, file?: PickedFile): Promise<LabResult> {
      const body: LabInput = { ...data };
      if (file) {
        body.attachmentName = file.name;
        if (!env.useMockApi) body.attachmentKey = await uploadToR2('lab', file);
      }
      if (env.useMockApi) {
        return mockApi.addLab(target.patientId, body, file?.uri ?? null);
      }
      return target.patientId
        ? request<LabResult>(`/practice/patients/${target.patientId}/labs`, { method: 'POST', body })
        : request<LabResult>('/me/labs', { method: 'POST', body });
    },

    /** Remove a lab result (doctor surface passes patientId; patient omits it). */
    remove(id: string, patientId?: string): Promise<void> {
      if (env.useMockApi) return mockApi.removeLab(id);
      return patientId
        ? request<void>(`/practice/patients/${patientId}/labs/${id}`, { method: 'DELETE' })
        : request<void>(`/me/labs/${id}`, { method: 'DELETE' });
    },
  },

  reviews: {
    /** GET /reviews?subject= — published reviews (moderated by the admin console). */
    list(subject?: string): Promise<Review[]> {
      if (env.useMockApi) return mockApi.getReviews();
      const suffix = subject ? `?subject=${encodeURIComponent(subject)}` : '';
      return request<Review[]>(`/reviews${suffix}`);
    },

    /** GET /reviews/summary?subject= — average + total + per-star distribution. */
    summary(subject?: string): Promise<ReviewSummary> {
      if (env.useMockApi) return mockApi.getReviewSummary();
      const suffix = subject ? `?subject=${encodeURIComponent(subject)}` : '';
      return request<ReviewSummary>(`/reviews/summary${suffix}`);
    },

    /**
     * POST /reviews — submit for moderation; goes live once an admin approves.
     * The overall rating isn't picked separately — the backend derives it from
     * the three dimension scores.
     */
    submit(input: {
      subject: string;
      communicationRating: number;
      experienceRating: number;
      speedyResponseRating: number;
      text: string;
      title?: string;
    }): Promise<Review> {
      if (env.useMockApi) return mockApi.submitReview(input);
      return request<Review>('/reviews', { method: 'POST', body: input });
    },
  },

  complaints: {
    /** GET /complaints — the signed-in user's own filed reports, newest first. */
    list(): Promise<Complaint[]> {
      if (env.useMockApi) return mockApi.getComplaints();
      return request<Complaint[]>('/complaints');
    },

    /** POST /complaints — file a report; goes to the admin queue as 'pending'. */
    submit(input: ComplaintInput): Promise<Complaint> {
      if (env.useMockApi) return mockApi.submitComplaint(input);
      return request<Complaint>('/complaints', { method: 'POST', body: input });
    },
  },

  currencies: {
    /** GET /currencies — active display currencies, for the preference picker. */
    list(): Promise<Currency[]> {
      if (env.useMockApi) return mockApi.getCurrencies();
      return request<Currency[]>('/currencies');
    },
  },

  content: {
    /** GET /content — every content block (AboutUsScreen renders several at once). */
    list(): Promise<ContentBlock[]> {
      if (env.useMockApi) return mockApi.getContentBlocks();
      return request<ContentBlock[]>('/content');
    },

    /** GET /content/:key — a single block (TermsOfServiceScreen, PrivacyPolicyScreen). */
    get(key: string): Promise<ContentBlock> {
      if (env.useMockApi) return mockApi.getContentBlock(key);
      return request<ContentBlock>(`/content/${key}`);
    },
  },
};
