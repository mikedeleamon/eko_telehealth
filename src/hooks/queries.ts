/**
 * React Query hooks — the only way screens should talk to the API.
 * Screens never import `api` directly; that keeps caching, retries and
 * invalidation in one place.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { AvailabilityBlock, CashoutInput, ComplaintInput, CreateAppointmentInput, DocumentCategory, LabInput, MedicalNoteInput, PatientBiometrics, PatientConditionInput, PatientConditionUpdate, PickedFile, PrescriptionInput, RevenueGranularity, SymptomLogInput, SymptomLogUpdate, VisitType } from '../api/types';
import { searchIcd10 } from '../services/icd10';

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
  icd10Search: (q: string) => ['icd10-search', q] as const,
  codeFavorites: ['icd10-favorites'] as const,
  patientConditions: (patientId: string) => ['patient-conditions', patientId] as const,
  myConditions: ['my-conditions'] as const,
  dependentConditions: (dependentId: string) => ['dependent-conditions', dependentId] as const,
  mySymptoms: ['my-symptoms'] as const,
  patientSymptoms: (patientId: string) => ['patient-symptoms', patientId] as const,
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
  supportThread: (complaintId: string) => ['support-thread', complaintId] as const,
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
  documents: (category?: DocumentCategory) => ['documents', category ?? 'all'] as const,
  patientDocuments: (patientId: string) => ['patient-documents', patientId] as const,
  earningsAnalysis: (params: { from?: string; to?: string; granularity?: string }) =>
    ['earnings-analysis', params.from ?? '', params.to ?? '', params.granularity ?? ''] as const,
  callInvites: (appointmentId?: string) => ['call-invites', appointmentId ?? 'none'] as const,
  myCallInvites: ['my-call-invites'] as const,
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.medicalNotes(patientId) });
      qc.invalidateQueries({ queryKey: queryKeys.codeFavorites });
    },
  });
}

/** Create or finalize/update a draft record; refreshes the shared record list. */
export function useUpdateMedicalNote(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, input }: { noteId: string; input: MedicalNoteInput }) =>
      api.practice.updateMedicalNote(noteId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.medicalNotes(patientId) });
      qc.invalidateQueries({ queryKey: queryKeys.codeFavorites });
    },
  });
}

/**
 * Debounced merge of the bundled local subset + server long-tail search
 * (see services/icd10). Reference data — stays fresh for the whole session.
 */
export function useIcd10Search(query: string) {
  return useQuery({
    queryKey: queryKeys.icd10Search(query),
    queryFn: () => searchIcd10(query),
    enabled: query.trim().length > 0,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

/** The signed-in doctor's ranked code shortlist — the picker's Frequent tab. */
export function useCodeFavorites() {
  return useQuery({
    queryKey: queryKeys.codeFavorites,
    queryFn: api.practice.codeFavorites,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function usePinCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.practice.pinCode(code),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.codeFavorites }),
  });
}

/** A patient's problem list, as seen by their treating doctors. */
export function usePatientConditions(patientId?: string) {
  return useQuery({
    queryKey: queryKeys.patientConditions(patientId ?? ''),
    queryFn: () => api.conditions.list(patientId!),
    enabled: !!patientId,
  });
}

export function useAddCondition(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PatientConditionInput) => api.conditions.add(patientId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.patientConditions(patientId) });
      qc.invalidateQueries({ queryKey: queryKeys.myConditions });
    },
  });
}

export function useUpdateCondition(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PatientConditionUpdate }) => api.conditions.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.patientConditions(patientId) }),
  });
}

/** The signed-in patient's own problem list — read-only. */
export function useMyConditions() {
  return useQuery({ queryKey: queryKeys.myConditions, queryFn: api.me.conditions });
}

export function useDependentConditions(dependentId?: string) {
  return useQuery({
    queryKey: queryKeys.dependentConditions(dependentId ?? ''),
    queryFn: () => api.me.dependentConditions(dependentId!),
    enabled: !!dependentId,
  });
}

/** The signed-in patient's own symptom log — powers SymptomLogScreen. */
export function useMySymptoms() {
  return useQuery({ queryKey: queryKeys.mySymptoms, queryFn: api.me.symptoms });
}

export function useLogSymptom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SymptomLogInput) => api.me.logSymptom(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.mySymptoms }),
  });
}

export function useUpdateSymptom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SymptomLogUpdate }) => api.me.updateSymptom(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.mySymptoms }),
  });
}

export function useRemoveSymptom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.me.removeSymptom(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.mySymptoms }),
  });
}

/**
 * A patient's symptom logs, as seen by a treating provider — feeds the
 * DiagnosisPicker's "For this patient" candidates band (spec §7.2).
 */
export function usePatientSymptoms(patientId?: string) {
  return useQuery({
    queryKey: queryKeys.patientSymptoms(patientId ?? ''),
    queryFn: () => api.conditions.patientSymptoms(patientId!),
    enabled: !!patientId,
  });
}

export function useUnpinCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.practice.unpinCode(code),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.codeFavorites }),
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

/**
 * The provider's revenue analysis over a chosen range (SOW 1.18) — the trend
 * and breakdown behind the wallet total, not the wallet itself.
 */
export function useEarningsAnalysis(
  params: { from?: string; to?: string; granularity?: RevenueGranularity } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.earningsAnalysis(params),
    queryFn: () => api.practice.earningsAnalysis(params),
    enabled,
  });
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

// ── Uploads: provider credentials + patient condition photos (SOW 1.6) ──────

/** Pass 'condition' for a patient's own condition uploads; omit for everything they own. */
export function useDocuments(category?: DocumentCategory) {
  return useQuery({ queryKey: queryKeys.documents(category), queryFn: () => api.documents.list(category) });
}

/** A treating provider's read of one patient's condition uploads. */
export function usePatientDocuments(patientId?: string) {
  return useQuery({
    queryKey: queryKeys.patientDocuments(patientId ?? ''),
    queryFn: () => api.practice.patientDocuments(patientId!),
    enabled: !!patientId,
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      category: DocumentCategory;
      file: PickedFile;
      appointmentId?: string;
      description?: string;
    }) => api.documents.upload(input),
    // Invalidates both the all-documents key and every category-scoped one —
    // a new condition photo has to land in the patient's list AND in any
    // unfiltered view of the same store.
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useRemoveDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.documents.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
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

/**
 * The support thread on one report. Reading it clears the unread count
 * server-side, so the complaints list is invalidated alongside the thread on
 * every change — otherwise the badge would linger on a thread just read.
 */
export function useSupportThread(complaintId?: string) {
  return useQuery({
    queryKey: queryKeys.supportThread(complaintId ?? ''),
    queryFn: () => api.complaints.messages(complaintId!),
    enabled: !!complaintId,
  });
}

export function useReplyToSupport(complaintId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.complaints.reply(complaintId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.supportThread(complaintId) });
      // A reply reopens a resolved report, so the list's status is stale too.
      qc.invalidateQueries({ queryKey: queryKeys.complaints });
    },
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

// ── Conference: guests invited into a visit's call ──────────────────────────

/**
 * The invite list for a visit, as a party to it sees it. Polled while a call
 * is up: a guest knocking is an event the room has to notice, and there's no
 * push channel for it — Stream carries media, not our own membership state.
 */
export function useCallInvites(appointmentId?: string, poll = false) {
  return useQuery({
    queryKey: queryKeys.callInvites(appointmentId),
    queryFn: () => api.calls.invites.list(appointmentId!),
    enabled: !!appointmentId,
    refetchInterval: poll ? 5000 : false,
    // A guest calling this gets a 404 by design — the list is for parties to
    // the visit only. That's an expected answer, not a flaky request, so it
    // isn't retried; the panel just stays empty for them.
    retry: false,
  });
}

/** Visits the signed-in user has been invited into — the guest's only way in. */
export function useMyCallInvites(enabled = true) {
  return useQuery({ queryKey: queryKeys.myCallInvites, queryFn: api.calls.invites.mine, enabled });
}

export function useInviteToCall(appointmentId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => api.calls.invites.create(appointmentId!, email),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.callInvites(appointmentId) }),
  });
}

export function useAdmitCallGuest(appointmentId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => api.calls.invites.admit(inviteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.callInvites(appointmentId) }),
  });
}

export function useRemoveCallGuest(appointmentId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => api.calls.invites.remove(inviteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.callInvites(appointmentId) }),
  });
}
