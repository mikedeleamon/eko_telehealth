/**
 * Domain models shared by every API module. These mirror the contracts the
 * backend must implement — the web and admin clients should use the same
 * shapes (see the integration guide PDF for the full endpoint list).
 */

/**
 * The account's permission type, stored on the account itself (backend column
 * `users.account_type`). Resolved server-side at login — the client never asks
 * the user to pick it. 'Admin' accounts sign in through the separate admin
 * console, not the mobile app, but are part of the same enum.
 */
export type AccountType = 'Patient' | 'Doctor' | 'Admin';

/** The account types the mobile surfaces ever see (Admins use the web console). */
export type UserRole = 'Patient' | 'Doctor';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  /** The account's stored type. See {@link AccountType}. */
  accountType: UserRole;
}

export interface AuthSession {
  user: User;
  /** JWT (or opaque) access token sent as `Authorization: Bearer <token>`. */
  accessToken: string;
  /** Used to silently renew the access token when it expires. */
  refreshToken?: string;
}

export type VisitType = 'Video Visit' | 'Clinic Visit' | 'Home Visit';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  category: string;
  rating: number;
  reviews: number;
  location: string;
  /** Display fee, already formatted with currency (e.g. "₦15,000"). */
  fee: string;
  available: boolean;
  nextAvailable: string;
  avatar: string | null;
}

/**
 * Booking lifecycle. A visit is only real once it reads 'upcoming', which
 * only a verified payment webhook can set:
 *   pending_approval → pending_payment → upcoming
 * with declined / cancelled / past as terminal states.
 */
export type AppointmentStatus =
  | 'pending_approval'
  | 'pending_payment'
  | 'upcoming'
  | 'declined'
  | 'cancelled'
  | 'past';

/** Statuses that belong in the "Upcoming" tab; everything else is history. */
export const ACTIVE_STATUSES: AppointmentStatus[] = ['pending_approval', 'pending_payment', 'upcoming'];

export interface Appointment {
  id: string;
  /** The counterparty's name — the doctor for patients, the patient for doctors. */
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  type: VisitType;
  status: AppointmentStatus;
  /** Display fee, e.g. "₦15,000" — needed to prompt for payment. */
  fee?: string;
  /** Why the doctor declined, when they gave a reason. */
  declineReason?: string;
  /**
   * The patient's id, on doctor-scoped schedules only. The real
   * /practice/appointments endpoint must return it — without it, schedule
   * entries can only be matched to patients by display name.
   */
  patientId?: string;
}

export interface CreateAppointmentInput {
  doctorId: string;
  date: string;
  time: string;
  type: VisitType;
  reason?: string;
  /** Booking on behalf of a dependent (proxy access). */
  dependentId?: string;
}

export interface Conversation {
  id: string;
  doctorId: string;
  lastMessage: string;
  time: string;
  unread: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  text: string;
  fromMe: boolean;
  time: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
}

export interface PatientBiometrics {
  bloodPressure?: string;
  heartRate?: string;
  temperature?: string;
  weight?: string;
  height?: string;
  bmi?: string;
  bloodType?: string;
}

export interface PatientSummary {
  id: string;
  name: string;
  age: number;
  gender: string;
  condition: string;
  lastVisit: string;
  /** Free-text reason the patient booked — shown on the profile screen. */
  reason?: string;
  /** Reported symptoms for the current/most recent visit. */
  symptoms?: string;
  allergies?: string;
  phone?: string;
  email?: string;
  biometrics?: PatientBiometrics;
}

/**
 * An addendum appended to a locked medical record. Records are immutable once
 * saved; corrections and additions are made as amendments, never by editing the
 * original. A record can carry any number of them.
 */
export interface NoteAmendment {
  id: string;
  /** The written change/addition. */
  text: string;
  /** Who added it (authenticated user id + display name), stamped server-side. */
  authorId: string;
  authorName: string;
  /** ISO timestamp the amendment was added. */
  createdAt: string;
}

/**
 * A SOAP-format medical record. Shared across every doctor treating the
 * patient. Immutable once saved: the SOAP body can never be edited — a doctor
 * appends {@link NoteAmendment}s to the locked record instead (enforced
 * server-side, mirrored here).
 */
export interface MedicalNote {
  id: string;
  patientId: string;
  /** The visit this record documents — records are always tied to a real appointment. */
  appointmentId: string;
  /** Display date inherited from the linked appointment, e.g. "Jun 10, 2026". */
  date: string;
  visitType?: string;
  /** Author — matches the authenticated user id. */
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  reason: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  /** Append-only addenda to this locked record, oldest first. */
  amendments?: NoteAmendment[];
  /** ISO timestamp — required; lists sort on this, not the display date. */
  createdAt: string;
  updatedAt?: string;
}

/** Author fields are stamped server-side from the bearer token, never sent. */
export interface MedicalNoteInput {
  patientId: string;
  appointmentId: string;
  date: string;
  visitType?: string;
  reason: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

/**
 * A prescription on a patient's medication record. 'active' entries are the
 * patient's current medications; 'completed' and 'discontinued' are history.
 */
export type PrescriptionStatus = 'active' | 'completed' | 'discontinued';

export interface Prescription {
  id: string;
  patientId: string;
  /** Medication name, e.g. "Amlodipine". */
  drug: string;
  /** Strength per unit, e.g. "10 mg". */
  strength: string;
  /** Dose form, e.g. "Tablet", "Capsule", "Inhaler". */
  form: string;
  /** Route of administration, e.g. "Oral". */
  route: string;
  /** Sig / frequency, e.g. "Once daily". */
  frequency: string;
  /** Course length, e.g. "30 days" or "Ongoing". */
  duration: string;
  /** Quantity to dispense, e.g. "30". */
  quantity: string;
  /** Number of authorised refills. */
  refills: string;
  /** Free-text patient instructions (Sig). */
  instructions?: string;
  status: PrescriptionStatus;
  /** Prescriber. */
  doctorId: string;
  doctorName: string;
  /** Display date prescribed, e.g. "Jun 20, 2026". */
  datePrescribed: string;
  /** ISO timestamp — lists sort on this. */
  createdAt: string;
}

/** Prescriber identity is stamped server-side; the client never sends it. */
export interface PrescriptionInput {
  patientId: string;
  drug: string;
  strength: string;
  form: string;
  route: string;
  frequency: string;
  duration: string;
  quantity: string;
  refills: string;
  instructions?: string;
}

export interface DoctorAgendaItem {
  id: string;
  name: string;
  type: string;
  time: string;
  status: 'confirmed' | 'cancelled' | 'rescheduled' | 'pending';
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  /** Display date, e.g. "Jul 16, 2026". */
  date: string;
}

export interface PaymentIntent {
  id: string;
  /** 'flutterwave' | 'paypal' — the two providers named in the pitch. */
  provider: string;
  amount: number;
  currency: string;
  /** Provider checkout URL or client secret, depending on provider. */
  checkoutRef: string;
  status: 'pending' | 'succeeded' | 'failed';
}

/** GET /payments/:id — the post-checkout truth, since the redirect proves nothing. */
export interface PaymentStatus extends PaymentIntent {
  /** The visit is only booked once this reads 'upcoming'. */
  appointmentStatus: AppointmentStatus;
}

/** A person the account holder can book on behalf of (proxy access). */
export interface Dependent {
  id: string;
  firstName: string;
  lastName: string;
  /** Display string, as collected: DD-MM-YYYY. */
  dob: string;
  relationship?: string;
}

export interface Insurance {
  provider: string;
  memberId: string;
  groupNumber?: string;
}

export interface Pharmacy {
  name?: string;
  address: string;
  fax: string;
}

/** Theme preference. 'system' follows the device's light/dark appearance. */
export type ThemeMode = 'system' | 'light' | 'dark';

/**
 * Per-user preferences. The notification flags are advisory for future
 * push/email fan-out — transactional messages (OTP, resets) ignore them.
 */
export interface UserSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  /** Full theme preference, not just a dark on/off — see {@link ThemeMode}. */
  themeMode: ThemeMode;
  locationAccess: boolean;
}

/** GET /providers/me — a Doctor account's onboarding state. */
export interface ProviderState {
  /** 'live' = bookable profile exists; 'pending' = awaiting admin review. */
  state: 'live' | 'pending' | 'rejected' | 'none';
  doctorId: string | null;
  application: { id: string; status: string; submittedAt: string } | null;
}

/** Access token grant for joining a video/audio room (Stream Video). */
export interface CallTokenGrant {
  token: string;
  roomName: string;
  identity: string;
  expiresAt: string;
  /** Public Stream API key + call type, so the SDK can init from the grant. */
  apiKey?: string;
  callType?: string;
}

/** Access token grant for connecting to Stream Chat. */
export interface ChatTokenGrant {
  token: string;
  apiKey: string;
  identity: string;
  userId: string;
  expiresAt: string;
}
