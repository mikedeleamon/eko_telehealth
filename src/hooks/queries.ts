/**
 * React Query hooks — the only way screens should talk to the API.
 * Screens never import `api` directly; that keeps caching, retries and
 * invalidation in one place.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { CreateAppointmentInput } from '../api/types';

export const queryKeys = {
  doctors: (params?: { category?: string; query?: string }) => ['doctors', params ?? {}] as const,
  doctor: (id: string) => ['doctors', id] as const,
  appointments: ['appointments'] as const,
  conversations: ['conversations'] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  notifications: ['notifications'] as const,
  patients: ['patients'] as const,
  agenda: ['agenda'] as const,
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

export function useDoctorAgenda() {
  return useQuery({ queryKey: queryKeys.agenda, queryFn: api.practice.agenda });
}
