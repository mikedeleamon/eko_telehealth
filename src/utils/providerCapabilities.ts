import type { AppointmentProviderType } from '../api/types';

/**
 * Client-side mirror of the backend's capability matrix
 * (eko_telehealth_backend/src/lib/providerCapabilities.ts) — UX only, so a
 * Nurse/Therapist doesn't tap into a form that will 403. The real gate is
 * always server-side.
 */
export function canAuthorPrescriptions(providerType: AppointmentProviderType | null | undefined): boolean {
  return (providerType ?? 'Doctor') === 'Doctor';
}

export function canOrderLabs(providerType: AppointmentProviderType | null | undefined): boolean {
  return (providerType ?? 'Doctor') === 'Doctor';
}
