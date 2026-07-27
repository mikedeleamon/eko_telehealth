/**
 * React Query hooks — the only way screens should talk to the API.
 * Screens never import `api` directly; that keeps caching, retries and
 * invalidation in one place.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { AvailabilityBlock, CashoutInput, ComplaintInput, CreateAppointmentInput, DocumentCategory, LabInput, MedicalNoteInput, PatientBiometrics, PickedFile, PrescriptionInput, VisitType } from '../api/types';

export const queryKeys = {
  doctors: (params?: { category?: string; query?: string }) => ['doctors', params ?? {}] as const,
  doctor: (id: string) => ['doctors', id] as const,
  doctorAvailabilitySlots: (doctorId: string, date: string) => ['doctor-availability-slots', doctorId, date] as const,
  practiceAvailability: ['practice-availability'] as const,
  appointments: ['appointments'] as const,
  conversations: ['conversations'] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  notifications: ['notifications'] as const,
  patients: ['patients'] as const,
  agenda: ['agenda'] as const,
  practiceAppointments: ['practice-appointments'] as const,
  medicalNotes: (patientId: string) => ['medical-notes', patientId] as const,
  prescriptions: (patientId: string) => ['prescriptions', patientId] as const,
  myPrescriptions: ['my-prescriptions'] as const,
  myPayments: ['my-payments'] as const,
  earnings: ['earnings'] as const,
  payoutMethod: ['payout-method'] as const,
  banks: ['banks'] as const,
  paymentMethodLegacy: ['payment-method'] as const,
  providerState: ['provider-state'] as const,
  payment: (id: string) => ['payments', id] as const,
  paymentPreview: (appointmentId: string, code?: string) => ['payment-preview', appointmentId, code ?? ''] as const,
  appointmentBreakdown: (id: string) => ['appointment-breakdown', id] as const,
  reviews: (subject?: string) => ['reviews', subject ?? 'all'] as const,
  reviewSummary: (subject?: string) => ['review-summary', subject ?? 'all'] as const,
  complaints: ['complaints'] as const,
  currencies: ['currencies'] as const,
  pharmacyDirectory: ['pharmacy-directory'] as const,
  govId: ['gov-id'] as const,
  biometrics: ['biometrics'] as const,
  patientBiometrics: (patientId: string) => ['patient-biometrics', patientId] as const,
  contentBlocks: ['content-blocks'] as const,
  contentBlock: (key: string) => ['content-blocks', key] as const,
  dependents: ['dependents'] as const,
  insurance: ['insurance'] as const,
  pharmacy: ['pharmacy'] as const,
  settings: ['settings'] as const,
  documents: ['documents'] as const,
  labs: (patientId?: string) => ['labs', patientId ?? 'me'] as const,
  myVisitNotes: ['my-visit-notes'] as const,
  dependentPrescriptions: (dependentId: string) => ['dependent-prescriptions', dependentId] as const,
  dependentLabs: (dependentId: string) => ['dependent-labs', dependentId] as const,
  dependentNotes: (dependentId: string) => ['dependent-notes', dependentId] as const,
};

export function useDoctors(params?: { category?: string; query?: string }) {
  return useQuery({ queryKey: queryKeys.doctors(params), queryFn: () => api.doctors.list(params) });
}

export function useDoctor(id: string) {
  return useQuery({ queryKey: queryKeys.doctor(id), queryFn: () => api.doctors.get(id), enabled: !!id });
}

export function useAppointments(enabled = true) {
  return useQuery({ queryKey: queryKeys.appointments, queryFn: api.appointments.list, enabled });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAppointmentInput) => api.appointments.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.appointments }),
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.appointments.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.appointments }),
  });
}

/** Patient E-Check-In — only valid once an appointment is 'upcoming'. */
export function useCheckInAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.appointments.checkIn(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.appointments }),
  });
}

/** Real open slots for a doctor on a given Lagos calendar date ('YYYY-MM-DD'), replacing the old hardcoded slot list. */
export function useDoctorAvailabilitySlots(doctorId: string, date: string) {
  return useQuery({
    queryKey: queryKeys.doctorAvailabilitySlots(doctorId, date),
    queryFn: () => api.doctors.availability(doctorId, date),
    enabled: !!doctorId && !!date,
  });
}

/** "Book Next Available" — user-triggered on button press, not auto-fetched, so this is a mutation not a query. */
export function useNextAvailableMatch() {
  return useMutation({
    mutationFn: ({ category, type }: { category: string; type: VisitType }) => api.doctors.match(category, type),
  });
}

export function useConversations() {
  return useQuery({ queryKey: queryKeys.conversations, queryFn: api.messaging.conversations });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: queryKeys.messages(conversationId),
    queryFn: () => api.messaging.messages(conversationId),
    enabled: !!conversationId,
  });
}

export function useNotifications() {
  return useQuery({ queryKey: queryKeys.notifications, queryFn: api.notifications.list });
}

export function usePatients() {
  return useQuery({ queryKey: queryKeys.patients, queryFn: api.practice.patients });
}

/** The doctor's own appointments (/appointments is patient-scoped). */
export function usePracticeAppointments(enabled = true) {
  return useQuery({
    queryKey: queryKeys.practiceAppointments,
    queryFn: api.practice.appointments,
    enabled,
  });
}

/** All SOAP notes for a patient, shared across their treating doctors. */
export function useMedicalNotes(patientId: string) {
  return useQuery({
    queryKey: queryKeys.medicalNotes(patientId),
    queryFn: () => api.practice.medicalNotes(patientId),
    enabled: !!patientId,
  });
}

export function useAddMedicalNote(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MedicalNoteInput) => api.practice.addMedicalNote(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.medicalNotes(patientId) }),
  });
}

/** Create or finalize/update a draft record; refreshes the shared record list. */
export function useUpdateMedicalNote(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, input }: { noteId: string; input: MedicalNoteInput }) =>
      api.practice.updateMedicalNote(noteId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.medicalNotes(patientId) }),
  });
}

/** Append an amendment to a locked record; refreshes the shared record list. */
export function useAddNoteAmendment(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, text }: { noteId: string; text: string }) =>
      api.practice.addNoteAmendment(noteId, text),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.medicalNotes(patientId) }),
  });
}

/** A patient's full medication record (current + historical), shared across doctors. */
export function usePrescriptions(patientId: string) {
  return useQuery({
    queryKey: queryKeys.prescriptions(patientId),
    queryFn: () => api.practice.prescriptions(patientId),
    enabled: !!patientId,
  });
}

export function useAddPrescription(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PrescriptionInput) => api.practice.addPrescription(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.prescriptions(patientId) }),
  });
}

/** The doctor's wallet — balance + earnings/withdrawal ledger. */
export function useDoctorEarnings(enabled = true) {
  return useQuery({ queryKey: queryKeys.earnings, queryFn: api.practice.earnings, enabled });
}

/** Withdraw to the saved payment method; writes the returned wallet back to cache. */
export function useCashOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CashoutInput) => api.practice.cashOut(input),
    onSuccess: (data) => qc.setQueryData(queryKeys.earnings, data),
  });
}

/** Accept or decline a request; both refresh the practice list. */
export function useAppointmentDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, reason }: { id: string; decision: 'accept' | 'decline'; reason?: string }) =>
      decision === 'accept' ? api.practice.accept(id) : api.practice.decline(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.practiceAppointments });
      qc.invalidateQueries({ queryKey: queryKeys.agenda });
    },
  });
}

/** A doctor's take-home detail for a paid visit — only meaningful once a payment has settled. */
export function useAppointmentBreakdown(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.appointmentBreakdown(id),
    queryFn: () => api.practice.appointmentBreakdown(id),
    enabled: enabled && !!id,
    retry: false, // 404 until the visit is paid — not worth retrying
  });
}

/** Doctor marks a patient as not attending — manual only, once the visit's start time has passed. */
export function useMarkNoShow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.practice.markNoShow(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.practiceAppointments });
      qc.invalidateQueries({ queryKey: queryKeys.agenda });
    },
  });
}

/** The signed-in doctor's recurring weekly working hours ("set my hours"). */
export function useDoctorAvailability() {
  return useQuery({ queryKey: queryKeys.practiceAvailability, queryFn: api.practice.availability });
}

export function useSaveDoctorAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (blocks: AvailabilityBlock[]) => api.practice.saveAvailability(blocks),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.practiceAvailability }),
  });
}

/**
 * The fee breakdown for a visit before checkout starts (PaymentScreen).
 * `code` is part of the query key — applying/clearing a promo code is a
 * genuinely different query, not a refetch of the same one, so the cache
 * can't serve a stale (or stale-discounted) amount across that change.
 */
export function usePaymentPreview(appointmentId: string, code?: string) {
  return useQuery({
    queryKey: queryKeys.paymentPreview(appointmentId, code),
    queryFn: () => api.payments.preview(appointmentId, code),
    enabled: !!appointmentId,
  });
}

// ── Per-user records ────────────────────────────────────────────────────────

export function useDependents() {
  return useQuery({ queryKey: queryKeys.dependents, queryFn: api.me.dependents });
}

export function useAddDependent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { firstName: string; lastName: string; dob: string; relationship?: string }) =>
      api.me.addDependent(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.dependents }),
  });
}

export function useRemoveDependent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.me.removeDependent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.dependents }),
  });
}

export function useInsurance() {
  return useQuery({ queryKey: queryKeys.insurance, queryFn: api.me.insurance });
}

export function useSaveInsurance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.me.saveInsurance,
    onSuccess: (data) => qc.setQueryData(queryKeys.insurance, data),
  });
}

export function usePharmacy() {
  return useQuery({ queryKey: queryKeys.pharmacy, queryFn: api.me.pharmacy });
}

export function useSavePharmacy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.me.savePharmacy,
    onSuccess: (data) => qc.setQueryData(queryKeys.pharmacy, data),
  });
}

/** The patient's own preferred pharmacy, seen from the doctor's side — defaults the referral picker. */
export function usePreferredPharmacyFor(patientId: string) {
  return useQuery({
    queryKey: ['preferred-pharmacy-for', patientId] as const,
    queryFn: () => api.practice.preferredPharmacyFor(patientId),
    enabled: !!patientId,
  });
}

/** Route a prescription to a directory pharmacy (Batch 4 / SOW 1.7). */
export function useReferPrescription(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ prescriptionId, pharmacyId }: { prescriptionId: string; pharmacyId: string }) =>
      api.practice.referPrescription(prescriptionId, pharmacyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.prescriptions(patientId) }),
  });
}

/** The admin-curated pharmacy directory (Batch 3 Phase 3) — rarely changes, fine to cache long. */
export function usePharmacyDirectory() {
  return useQuery({ queryKey: queryKeys.pharmacyDirectory, queryFn: api.pharmacies.list, staleTime: 5 * 60 * 1000 });
}

/** The signed-in user's government-ID verification status. */
export function useGovId() {
  return useQuery({ queryKey: queryKeys.govId, queryFn: api.govId.status });
}

export function useSubmitGovId() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.govId.submit,
    onSuccess: (data) => qc.setQueryData(queryKeys.govId, data),
  });
}

/** The signed-in patient's own current vitals. */
export function useBiometrics() {
  return useQuery({ queryKey: queryKeys.biometrics, queryFn: api.me.biometrics });
}

export function useSaveBiometrics() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.me.saveBiometrics,
    onSuccess: (data) => qc.setQueryData(queryKeys.biometrics, data),
  });
}

/** A roster patient's current vitals, from the doctor's side. */
export function usePatientBiometrics(patientId: string) {
  return useQuery({
    queryKey: queryKeys.patientBiometrics(patientId),
    queryFn: () => api.practice.biometrics(patientId),
    enabled: !!patientId,
  });
}

export function useSavePatientBiometrics(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PatientBiometrics) => api.practice.saveBiometrics(patientId, input),
    onSuccess: (data) => qc.setQueryData(queryKeys.patientBiometrics(patientId), data),
  });
}

/** Where this provider gets paid. */
export function usePayoutMethod() {
  return useQuery({ queryKey: queryKeys.payoutMethod, queryFn: api.me.payoutMethod });
}

export function useSavePayoutMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.me.savePayoutMethod,
    onSuccess: (data) => qc.setQueryData(queryKeys.payoutMethod, data),
  });
}

/** Nigerian bank list for the payout picker — static, cache it hard. */
export function useBanks() {
  return useQuery({ queryKey: queryKeys.banks, queryFn: api.banks.list, staleTime: 60 * 60 * 1000 });
}

export function useSettings() {
  return useQuery({ queryKey: queryKeys.settings, queryFn: api.me.settings });
}

/** The signed-in patient's own prescriptions (read-only self view). */
export function useMyPrescriptions() {
  return useQuery({ queryKey: queryKeys.myPrescriptions, queryFn: api.me.prescriptions });
}

/**
 * A proxy's read-only view of one of THEIR dependent's clinical records (BRD
 * 1.2 "Proxies") — prescriptions, labs and visit notes, scoped server-side to
 * a dependent the caller actually owns. `enabled` gates on dependentId being
 * present, matching how DependentCareScreen already guards on `dependent`.
 */
export function useDependentPrescriptions(dependentId?: string) {
  return useQuery({
    queryKey: queryKeys.dependentPrescriptions(dependentId ?? ''),
    queryFn: () => api.me.dependentPrescriptions(dependentId!),
    enabled: !!dependentId,
  });
}

export function useDependentLabs(dependentId?: string) {
  return useQuery({
    queryKey: queryKeys.dependentLabs(dependentId ?? ''),
    queryFn: () => api.me.dependentLabs(dependentId!),
    enabled: !!dependentId,
  });
}

export function useDependentVisitNotes(dependentId?: string) {
  return useQuery({
    queryKey: queryKeys.dependentNotes(dependentId ?? ''),
    queryFn: () => api.me.dependentNotes(dependentId!),
    enabled: !!dependentId,
  });
}

/** The signed-in patient's settled payment history (PaymentHistoryScreen). */
export function useMyPayments() {
  return useQuery({ queryKey: queryKeys.myPayments, queryFn: api.me.payments });
}

export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.me.saveSettings,
    // Write the server's copy back so a rejected toggle can't drift from it.
    onSuccess: (data) => qc.setQueryData(queryKeys.settings, data),
  });
}

// ── Documents & Certifications (Doctor) ─────────────────────────────────────

export function useDocuments() {
  return useQuery({ queryKey: queryKeys.documents, queryFn: api.documents.list });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; category: DocumentCategory; file: PickedFile }) => api.documents.upload(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.documents }),
  });
}

export function useRemoveDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.documents.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.documents }),
  });
}

// ── Labs ────────────────────────────────────────────────────────────────────

/** Labs for a roster patient (pass patientId) or the signed-in patient (omit it). */
/**
 * The patient's own visit notes (GET /me/notes) — summary fields only, never
 * the provider's raw SOAP body. Distinct from useMedicalNotes, which is the
 * provider-side view of the full record.
 */
export function useVisitNotes() {
  return useQuery({ queryKey: queryKeys.myVisitNotes, queryFn: api.me.notes });
}

export function useLabs(patientId?: string) {
  return useQuery({ queryKey: queryKeys.labs(patientId), queryFn: () => api.labs.list(patientId) });
}

export function useAddLab(patientId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, file }: { data: LabInput; file?: PickedFile }) => api.labs.add({ patientId }, data, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.labs(patientId) }),
  });
}

export function useRemoveLab(patientId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.labs.remove(id, patientId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.labs(patientId) }),
  });
}

/** Doctor onboarding state — gates the practice UI until a profile is live. */
export function useProviderState(enabled = true) {
  return useQuery({ queryKey: queryKeys.providerState, queryFn: api.providers.me, enabled });
}

export function useReviews(subject?: string) {
  return useQuery({ queryKey: queryKeys.reviews(subject), queryFn: () => api.reviews.list(subject) });
}

export function useReviewSummary(subject?: string) {
  return useQuery({ queryKey: queryKeys.reviewSummary(subject), queryFn: () => api.reviews.summary(subject) });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      subject: string;
      communicationRating: number;
      experienceRating: number;
      speedyResponseRating: number;
      text: string;
      title?: string;
    }) => api.reviews.submit(input),
    // Submissions are 'pending' until moderated, so the published list won't
    // change yet — invalidate anyway for when moderation is instant (mock).
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] });
      qc.invalidateQueries({ queryKey: ['review-summary'] });
    },
  });
}

export function useDoctorAgenda(enabled = true) {
  // Gate on role at the call site: /practice/agenda 403s for non-doctors.
  return useQuery({ queryKey: queryKeys.agenda, queryFn: api.practice.agenda, enabled });
}

/** The signed-in user's own filed reports (Settings → Report a Problem). */
export function useComplaints() {
  return useQuery({ queryKey: queryKeys.complaints, queryFn: api.complaints.list });
}

export function useSubmitComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ComplaintInput) => api.complaints.submit(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.complaints }),
  });
}

/** Active display currencies (task 2.4) — rarely changes, fine to cache long. */
export function useCurrencies() {
  return useQuery({ queryKey: queryKeys.currencies, queryFn: api.currencies.list, staleTime: 5 * 60 * 1000 });
}

/** Every admin-editable content block (task 2.2) — AboutUsScreen renders several at once. */
export function useContentBlocks() {
  return useQuery({ queryKey: queryKeys.contentBlocks, queryFn: api.content.list, staleTime: 5 * 60 * 1000 });
}

/** A single content block by key (TermsOfServiceScreen, PrivacyPolicyScreen). */
export function useContentBlock(key: string) {
  return useQuery({ queryKey: queryKeys.contentBlock(key), queryFn: () => api.content.get(key), staleTime: 5 * 60 * 1000 });
}
