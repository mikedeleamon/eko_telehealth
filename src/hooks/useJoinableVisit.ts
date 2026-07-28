import { useAuth } from '../context/AuthContext';
import { useAppointments, usePracticeAppointments } from './queries';
import type { Appointment } from '../api/types';

/**
 * Statuses a call may actually be placed for. Mirrors JOINABLE_STATUSES in the
 * backend's routes/calls.ts — the server is the enforcement point, this is
 * only so the UI doesn't offer a button that's guaranteed to fail.
 *
 * `pending_payment` is excluded on purpose: a visit that hasn't been paid for
 * must not be consultable.
 */
const JOINABLE: Appointment['status'][] = ['upcoming', 'checked_in'];

/**
 * Find the visit a call between these two parties would belong to.
 *
 * Several screens offer a call button without any appointment context — a
 * doctor's public profile, the chat header, the provider's patient profile.
 * Calls are authorized per-appointment now, so those screens have to resolve
 * one (or hide the button). Returns undefined when there's no open visit,
 * which is the signal to hide it.
 *
 * Pass `doctorId` from a patient-facing screen, `patientId` from a
 * provider-facing one; which list is consulted follows the signed-in account.
 */
export function useJoinableVisit(opts: { doctorId?: string; patientId?: string }): Appointment | undefined {
  const { isDoctor } = useAuth();
  const { data: patientAppointments = [] } = useAppointments(!isDoctor);
  const { data: practiceAppointments = [] } = usePracticeAppointments(isDoctor);

  // No counterparty id means nothing to match against — return no visit rather
  // than falling through to "any open appointment", which would hand the
  // caller a room belonging to a different patient entirely.
  const counterpartId = isDoctor ? opts.patientId : opts.doctorId;
  if (!counterpartId) return undefined;

  const candidates = isDoctor ? practiceAppointments : patientAppointments;
  const open = candidates.filter((a) => JOINABLE.includes(a.status));
  const match = open.filter((a) => (isDoctor ? a.patientId : a.doctorId) === counterpartId);

  // Soonest first — with two open visits for the same counterparty, the call
  // belongs to the one about to happen. Appointments without a structured
  // startAt (legacy rows) sort last rather than winning by accident.
  return [...match].sort((a, b) => (a.startAt ?? '9999').localeCompare(b.startAt ?? '9999'))[0];
}
