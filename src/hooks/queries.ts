/**
 * React Query hooks — the only way screens should talk to the API.
 * Screens never import `api` directly; that keeps caching, retries and
 * invalidation in one place.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { CreateAppointmentInput, MedicalNoteInput, PrescriptionInput } from '../api/types';

export const queryKeys = {
  doctors: (params?: { category?: string; query?: string }) => ['doctors', params ?? {}] as const,
  doctor: (id: string) => ['doctors', id] as const,
  appointments: ['appointments'] as const,
  conversations: ['conversations'] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  notifications: ['notifications'] as const,
  patients: ['patients'] as const,
  agenda: ['agenda'] as const,
  practiceAppointments: ['practice-appointments'] as const,
  medicalNotes: (patientId: string) => ['medical-notes', patientId] as const,
  prescriptions: (patientId: string) => ['prescriptions', patientId] as const,
  providerState: ['provider-state'] as const,
  payment: (id: string) => ['payments', id] as const,
  reviews: (subject?: string) => ['reviews', subject ?? 'all'] as const,
  dependents: ['dependents'] as const,
  insurance: ['insurance'] as const,
  pharmacy: ['pharmacy'] as const,
  settings: ['settings'] as const,
};

export function useDoctors(params?: { category?: string; query?: string }) {
  return useQuery({ queryKey: queryKeys.doctors(params), queryFn: () => api.doctors.list(params) });
}

export function useDoctor(id: string) {
  return useQuery({ queryKey: queryKeys.doctor(id), queryFn: () => api.doctors.get(id), enabled: !!id });
}

export function useAppointments() {
  return useQuery({ queryKey: queryKeys.appointments, queryFn: api.appointments.list });
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

export function useSettings() {
  return useQuery({ queryKey: queryKeys.settings, queryFn: api.me.settings });
}

export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.me.saveSettings,
    // Write the server's copy back so a rejected toggle can't drift from it.
    onSuccess: (data) => qc.setQueryData(queryKeys.settings, data),
  });
}

/** Doctor onboarding state — gates the practice UI until a profile is live. */
export function useProviderState(enabled = true) {
  return useQuery({ queryKey: queryKeys.providerState, queryFn: api.providers.me, enabled });
}

export function useReviews(subject?: string) {
  return useQuery({ queryKey: queryKeys.reviews(subject), queryFn: () => api.reviews.list(subject) });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { subject: string; rating: number; text: string }) => api.reviews.submit(input),
    // Submissions are 'pending' until moderated, so the published list won't
    // change yet — invalidate anyway for when moderation is instant (mock).
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });
}

export function useDoctorAgenda(enabled = true) {
  // Gate on role at the call site: /practice/agenda 403s for non-doctors.
  return useQuery({ queryKey: queryKeys.agenda, queryFn: api.practice.agenda, enabled });
}
