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
 *
 * 'Provider' is the generic bucket for every non-Doctor provider type
 * (Therapist, Nurse, Pharmacy, ...) — the specific domain type is never on
 * this field, see backend db/schema.ts's users.accountType doc comment.
 * 'Doctor' is kept as a legacy alias, not something new signups pick.
 */
export type AccountType = 'Patient' | 'Doctor' | 'Provider' | 'Admin';

/** The account types the mobile surfaces ever see (Admins use the web console). */
export type UserRole = 'Patient' | 'Doctor' | 'Provider';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  /** The account's stored type. See {@link AccountType}. */
  accountType: UserRole;
  /**
   * Languages this account holder speaks (task 2.5) — personal, editable
   * from EditProfileScreen. Distinct from the app's own display language
   * (store/localeStore.ts) — this is who they can communicate with.
   */
  spokenLanguages: string[];
  /**
   * Display currency (task 2.4), e.g. 'NGN'. Converts fees for browsing/
   * checkout preview only — never changes what's actually charged, which
   * stays canonical NGN (or its PayPal conversion) throughout the backend.
   */
  preferredCurrency: string;
  /** Login 2FA opt-in — when true, /auth/login returns a TwoFactorChallenge instead of a session. */
  twoFactorEnabled: boolean;
}

export interface AuthSession {
  user: User;
  /** JWT (or opaque) access token sent as `Authorization: Bearer <token>`. */
  accessToken: string;
  /** Used to silently renew the access token when it expires. */
  refreshToken?: string;
}

/**
 * POST /auth/login response when the account has 2FA enabled: no session yet,
 * just proof the password checked out plus a code already on its way to the
 * account's email. Trade it for a session via POST /auth/login/verify-2fa.
 */
export interface TwoFactorChallenge {
  twoFactorRequired: true;
  challenge: string;
}

export type LoginResult = AuthSession | TwoFactorChallenge;

export type VisitType = 'Video Visit' | 'Clinic Visit' | 'Home Visit';

/**
 * The appointment-based provider types (Batch 3 Phase 2) — the only ones the
 * mobile self-signup apply flow can submit. Pharmacy/Lab/Clinic are
 * admin-created only, never self-applied from the app.
 */
export type AppointmentProviderType = 'Doctor' | 'Nurse' | 'Therapist';

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
  /** Admin-granted privilege — Home Visit can only be booked when this is true. */
  canProvideInHome: boolean;
  /** Languages this provider consults in — what the language filter searches. */
  spokenLanguages: string[];
  /**
   * Which appointment-based provider this is (Batch 3 Phase 2). Absent on
   * legacy-shaped mock data — treat missing as 'Doctor', same as the
   * backend's column default.
   */
  providerType?: AppointmentProviderType;
}

/**
 * Booking lifecycle. A visit is only real once it reads 'upcoming', which
 * only a verified payment webhook can set:
 *   pending_approval → pending_payment → upcoming → checked_in
 * with declined / cancelled / no_show / past as terminal states. checked_in
 * is patient-triggered (E-Check-In); no_show is doctor-triggered, manual only.
 */
export type AppointmentStatus =
  | 'pending_approval'
  | 'pending_payment'
  | 'upcoming'
  | 'checked_in'
  | 'declined'
  | 'cancelled'
  | 'no_show'
  | 'past';

/** Statuses that belong in the "Upcoming" tab; everything else is history. */
export const ACTIVE_STATUSES: AppointmentStatus[] = ['pending_approval', 'pending_payment', 'upcoming', 'checked_in'];

export interface Appointment {
  id: string;
  /** The counterparty's name — the doctor for patients, the patient for doctors. */
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  /** ISO instant — real structured start time. Absent on legacy appointments booked before the slot model shipped. */
  startAt?: string;
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
  /** The provider's id, on patient-scoped views — lets a proxy cross-reference which doctor to request a case conference with. */
  doctorId?: string;
  /** Set when this visit was booked for a dependent (proxy access) — the dependent's id. */
  dependentId?: string;
  /** A paid 2nd-opinion request (BRD 1.4 "Peer Reviews") rather than an ordinary visit. */
  isPeerReview?: boolean;
  /** A proxy's paid case-conference request (BRD 1.2 "Proxies") about a dependent's care. */
  isCaseConference?: boolean;
  /**
   * Who the visit is for — the dependent's name on a proxy booking, the account
   * holder's otherwise. Distinct from `doctor`, which is the counterparty.
   */
  patientName?: string;
  /** Free text the patient gave at booking, shown on Appointment Details. */
  reason?: string;
}

export interface CreateAppointmentInput {
  doctorId: string;
  /** ISO instant — a slot returned by GET /doctors/:id/availability. */
  startAt: string;
  type: VisitType;
  reason?: string;
  /** Booking on behalf of a dependent (proxy access). */
  dependentId?: string;
  /** A paid 2nd-opinion request (BRD 1.4 "Peer Reviews") rather than an ordinary visit. */
  isPeerReview?: boolean;
  /** A proxy's paid case-conference request (BRD 1.2 "Proxies") about a dependent's care. */
  isCaseConference?: boolean;
}

/** GET /doctors/:id/availability?date= — one open slot. */
export interface AvailabilitySlot {
  /** ISO instant. */
  startAt: string;
  /** "9:00 AM", Lagos local. */
  label: string;
}

/**
 * GET /doctors/match?category=&type= — the earliest open slot across every
 * eligible doctor in a category ("Book Next Available" / flexible provider
 * selection). Both fields are null together when nobody has an opening in
 * the search window — a normal empty outcome, not an error.
 */
export interface NextAvailableMatch {
  doctor: Doctor | null;
  slot: AvailabilitySlot | null;
}

/** A doctor's recurring weekly working-hours block (GET/PUT /practice/availability). */
export interface AvailabilityBlock {
  /** Absent for a new block not yet saved. */
  id?: string;
  /** 0 = Sunday. */
  weekday: number;
  /** Minutes since midnight, Lagos local. */
  startMinute: number;
  endMinute: number;
  slotMinutes: number;
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
  /** Display date the vitals were last recorded, e.g. "Jul 23, 2026". Absent until first save. */
  recordedAt?: string;
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
  /**
   * The real account's dependents (proxy access), when this patient is linked
   * to one — lets the prescribe/lab-add screens offer "who is this for"
   * instead of always attributing the record to the account holder. Empty for
   * a patient not yet linked to a real account.
   */
  dependents?: { id: string; firstName: string; lastName: string }[];
  /**
   * The real account behind this roster entry, when one is linked. Roster ids
   * and user ids are separate spaces, so this is what matches a roster patient
   * to their own appointments. Absent for walk-ins with no app account.
   */
  userId?: string;
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
/**
 * A visit note as the PATIENT sees it (GET /me/notes) — deliberately not the
 * full SOAP record. Subjective, objective, assessment and the amendment trail
 * are provider-only and never sent here, so this is a separate type rather than
 * a Partial<MedicalNote>: a screen written against it can't reach for a field
 * the server was never going to send.
 */
export interface PatientVisitNote {
  id: string;
  /** Display date inherited from the linked appointment, e.g. "Jun 10, 2026". */
  date: string;
  visitType?: string;
  doctorName: string;
  doctorSpecialty: string;
  /** Why the patient came, as recorded by the provider. */
  reason: string;
  primaryDiagnosis?: string;
  secondaryDiagnoses?: string[];
  /** What to do next — the part written to be acted on. */
  plan: string;
  /** ISO timestamp; lists sort on this, not the display date. */
  createdAt: string;
}

export interface MedicalNote {
  id: string;
  patientId: string;
  /**
   * Set when this note documents the account holder's DEPENDENT's visit, not
   * their own — derived server-side from the linked appointment, never asked
   * for on the authoring form.
   */
  dependentId?: string;
  dependentName?: string;
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
  /** Free-text assessment (legacy) — mirrors the primary diagnosis for new records. */
  assessment: string;
  /** Structured assessment: the principal diagnosis. */
  primaryDiagnosis?: string;
  /** Additional diagnoses, in order. */
  secondaryDiagnoses?: string[];
  plan: string;
  /**
   * 'draft' records are still editable by their author; 'final' records are
   * locked — the SOAP body can never be edited, only amended. Absent = 'final'
   * (legacy records predate drafts).
   */
  status?: 'draft' | 'final';
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
  primaryDiagnosis?: string;
  secondaryDiagnoses?: string[];
  plan: string;
  /** 'draft' saves a resumable draft; 'final' locks the record. Defaults to 'final'. */
  status?: 'draft' | 'final';
}

/**
 * A prescription on a patient's medication record. 'active' entries are the
 * patient's current medications; 'completed' and 'discontinued' are history.
 */
export type PrescriptionStatus = 'active' | 'completed' | 'discontinued';

/**
 * Pharmacy referral lifecycle (Batch 4 / SOW 1.7). 'none' means the script
 * was never referred — the patient takes it wherever they like, which stays
 * a perfectly normal outcome.
 */
export type FulfillmentStatus = 'none' | 'sent' | 'accepted' | 'ready' | 'collected' | 'rejected';

export interface Prescription {
  id: string;
  patientId: string;
  /** Set when this is the account holder's DEPENDENT's medication, not their own. */
  dependentId?: string;
  dependentName?: string;
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
  /** The directory pharmacy this was referred to, if any. */
  pharmacyId?: string;
  pharmacyName?: string;
  fulfillmentStatus: FulfillmentStatus;
  /** Why the pharmacy rejected it — shown to both the patient and prescriber. */
  fulfillmentNote?: string;
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
  /** Refer straight to a directory pharmacy at prescribe time. */
  pharmacyId?: string;
  /** This prescription is for the patient's dependent, not the patient themselves. */
  dependentId?: string;
}

/**
 * A laboratory result on a patient's record. Both doctors and patients can view
 * and add labs (patients log outside results; doctors record ordered tests).
 * Fields follow lab record-keeping best practice: test identity (name + LOINC),
 * specimen, the result value with unit + reference range + interpretation flag,
 * order/result dates, the ordering provider and performing lab, and an optional
 * scanned report attachment.
 */
export type LabStatus = 'ordered' | 'collected' | 'resulted';
/** Interpretation of the value against its reference range. */
export type LabFlag = 'normal' | 'low' | 'high' | 'critical' | 'abnormal';

export interface LabResult {
  id: string;
  patientId: string;
  /** Set when this result is the account holder's DEPENDENT's, not their own. */
  dependentId?: string;
  dependentName?: string;
  /** Test or panel name, e.g. "Complete Blood Count", "Fasting Glucose". */
  testName: string;
  /** LOINC code, when known — the standard identifier for the observation. */
  loincCode?: string;
  /** Specimen type, e.g. "Blood", "Serum", "Urine". */
  specimen: string;
  /** Measured value, e.g. "5.4". Free text so qualitative results fit too. */
  value: string;
  /** Unit of measure, e.g. "mmol/L". */
  unit?: string;
  /** Reference/normal range, e.g. "3.9–5.5". */
  referenceRange?: string;
  flag: LabFlag;
  status: LabStatus;
  /** Ordering provider (may differ from whoever entered the record). */
  orderedBy?: string;
  /** Performing laboratory / facility. */
  performingLab?: string;
  /** Display date the specimen was collected, e.g. "Jul 10, 2026". */
  collectedDate: string;
  /** Display date the result came back. */
  resultedDate?: string;
  /** Interpretation / clinical notes. */
  notes?: string;
  /** Scanned report (PDF/image): R2 url/key (live) or local uri (mock). */
  attachmentUrl?: string | null;
  attachmentName?: string;
  /** ISO timestamp — lists sort on this. */
  createdAt: string;
}

/** Author of the record is contextual (patient vs doctor); patientId comes from the route. */
export interface LabInput {
  testName: string;
  loincCode?: string;
  specimen: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  flag: LabFlag;
  status: LabStatus;
  orderedBy?: string;
  performingLab?: string;
  collectedDate: string;
  resultedDate?: string;
  notes?: string;
  /** R2 object key from a prior presign, when a report was attached. */
  attachmentKey?: string;
  attachmentName?: string;
  /** This result is for the patient's dependent, not the patient themselves. */
  dependentId?: string;
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
  /** Overall score — the rounded average of the three dimensions below. */
  rating: number;
  text: string;
  /** Display date, e.g. "Jul 16, 2026". */
  date: string;
  /** Short headline for the review, App Store style. */
  title?: string;
  /** The author actually completed a consultation with the subject. */
  verified?: boolean;
  /** Number of comments/replies on the review (display-only count). */
  comments?: number;
  /** Per-dimension scores. Absent on reviews submitted before this shipped. */
  communicationRating?: number;
  experienceRating?: number;
  speedyResponseRating?: number;
}

/**
 * Aggregate ratings for a subject — powers the App Store-style summary header
 * (big average + total + per-star distribution bars). Computed server-side over
 * published reviews only, so it always matches the visible list.
 */
export interface ReviewSummary {
  /** Mean rating to one decimal, e.g. 4.5. 0 when there are no reviews. */
  average: number;
  /** Total number of published ratings. */
  total: number;
  /** Count per star: index 0 = 1★ … index 4 = 5★. */
  distribution: [number, number, number, number, number];
}

export type ComplaintCategory = 'billing' | 'appointment' | 'provider' | 'technical' | 'other';
export type ComplaintStatus = 'pending' | 'resolved' | 'dismissed';

/** A report a patient or doctor filed via Settings → Report a Problem (task 2.1). */
export interface Complaint {
  id: string;
  category: ComplaintCategory;
  subject: string;
  description: string;
  status: ComplaintStatus;
  /** Admin's note, shown once resolved/dismissed. */
  resolutionNote?: string;
  /** Display date, e.g. "Jul 19, 2026". */
  submittedAt: string;
  /** ISO timestamp of the latest support reply, absent until someone replies. */
  lastMessageAt?: string;
  /** Replies the filer hasn't read yet — drives the badge on the report card. */
  unread?: number;
}

/**
 * One message in a support thread. A report is also a conversation with the
 * platform: `authorRole` is which side wrote it, so the thread can be rendered
 * with the user's own messages on one side and support's on the other.
 */
export interface SupportMessage {
  id: string;
  complaintId: string;
  authorRole: 'user' | 'admin';
  authorName: string;
  body: string;
  /** ISO timestamp — the thread sorts on this, oldest first. */
  createdAt: string;
}

export interface ComplaintInput {
  category: ComplaintCategory;
  subject: string;
  description: string;
}

/**
 * NGN fee breakdown for a visit (see backend lib/pricing.ts
 * computeFeeBreakdown). Independent of whatever currency was actually
 * charged at the gateway (e.g. USD for PayPal) — always canonical NGN.
 */
export interface FeeBreakdown {
  consultationFee: number;
  serviceCharge: number;
  /** 0 unless the visit is a Video Visit — Clinic/Home visits are VAT-exempt. */
  vat: number;
  discount: number;
  providerCommission: number;
  /** consultationFee − providerCommission. VAT is never withheld from this. */
  providerPayout: number;
}

/**
 * Why a promo code did or didn't apply — see backend services/promos.ts.
 * 'applied' is the only status with a nonzero discount.
 */
export type PromoStatus = 'applied' | 'not_found' | 'inactive' | 'expired' | 'min_spend' | 'limit_reached' | 'user_limit_reached';

/** GET /payments/preview/:appointmentId — what a visit will cost before checkout starts. */
export interface PaymentPreview extends FeeBreakdown {
  /** consultationFee + serviceCharge + vat − discount. */
  patientTotal: number;
  /** Set only when a code was passed to the preview call; explains why discount is (or isn't) applied. */
  promoStatus?: PromoStatus | null;
}

export interface PaymentIntent extends FeeBreakdown {
  id: string;
  /** 'flutterwave' | 'paypal' — the two providers named in the pitch. */
  provider: string;
  /** What's actually charged at the gateway — patientTotal in NGN for Flutterwave, or its currency conversion for PayPal. */
  amount: number;
  currency: string;
  /** Provider checkout URL or client secret, depending on provider. */
  checkoutRef: string;
  status: 'pending' | 'succeeded' | 'failed';
  /** The promo code that produced `discount`, if any (uppercased). */
  promoCode?: string;
}

/** GET /payments/:id — the post-checkout truth, since the redirect proves nothing. */
export interface PaymentStatus extends PaymentIntent {
  /** The visit is only booked once this reads 'upcoming'. */
  appointmentStatus: AppointmentStatus;
}

/**
 * GET /currencies — an active display currency (task 2.4). Used only to
 * convert a canonical-NGN fee for browsing/preview — `ngnRate` is NGN per 1
 * unit of this currency (e.g. USD → 1600), matching the backend's PayPal
 * conversion convention.
 */
export interface Currency {
  code: string;
  symbol: string;
  ngnRate: number;
}

/**
 * Admin-editable prose (task 2.2) — AboutUsScreen, TermsOfServiceScreen,
 * PrivacyPolicyScreen. `key` is a fixed slug (see backend
 * migrations/0009_content_blocks.sql) — the app renders whatever an admin
 * has set for it, with an i18n fallback while it loads.
 */
export interface ContentBlock {
  key: string;
  title: string;
  body: string;
}

/**
 * GET /me/payments — one settled payment on a patient's spend history.
 *
 * `amount`/`currency` are what was actually charged at the gateway (USD for
 * PayPal, NGN for Flutterwave) — don't sum these across receipts, it mixes
 * currencies. consultationFee/serviceCharge/vat/discount are always
 * canonical NGN regardless of gateway, so those are what a "total spent"
 * figure should sum instead.
 */
export interface PaymentReceipt {
  id: string;
  doctorName: string;
  specialty: string;
  visitType: VisitType;
  date: string;
  time: string;
  provider: string;
  amount: number;
  currency: string;
  consultationFee?: number;
  serviceCharge?: number;
  vat?: number;
  discount: number;
  promoCode?: string;
  /** ISO 8601 — when the payment was created (not the visit date). */
  createdAt: string;
}

/**
 * A saved payment/payout method. Doctors withdraw earnings TO it; patients pay
 * consultation fees FROM it. One per account (upsert).
 *
 * NOTE (production): the mock stores what the user types locally, but a live
 * backend must NOT persist raw PANs / full bank numbers. Tokenize via
 * Flutterwave/PayPal and keep only a provider token + the masked last-4 fields
 * below. The UI only ever renders the masked form (see paymentMethodLabel).
 */
/**
 * Where a provider gets paid. Strictly money-OUT — patients pay through
 * hosted gateway checkout, so no card is stored: accepting one would drag
 * the platform into PCI scope for a field nothing reads.
 */
export type PayoutRail = 'flutterwave_bank' | 'paypal';

/** GET /me/payout-method — the account number comes back masked, never in full. */
export interface PayoutMethod {
  rail: PayoutRail;
  /** Resolved at the bank and stored server-side; never client-supplied for a bank rail. */
  accountName: string;
  bankCode?: string;
  bankName?: string;
  /** e.g. "••••4321". The full number is write-only. */
  accountNumberMasked?: string;
  paypalEmail?: string;
}

/** PUT /me/payout-method — one shape per rail. */
export type PayoutMethodInput =
  | { rail: 'flutterwave_bank'; bankCode: string; bankName: string; accountNumber: string }
  | { rail: 'paypal'; paypalEmail: string };

/** GET /banks — Nigerian banks with the codes Flutterwave transfers expect. */
export interface Bank {
  code: string;
  name: string;
}

/** One row on the doctor's earnings ledger — a payment in, or a withdrawal out. */
export interface EarningItem {
  id: string;
  kind: 'earning' | 'withdrawal';
  /** Patient name for an earning, or a withdrawal label. */
  title: string;
  /** Display date, e.g. "Feb 18, 2026". */
  date: string;
  /** Display time, e.g. "10:00 AM". */
  time: string;
  /** Positive Naira amount; the `kind` decides the sign shown. */
  amount: number;
  status: 'settled' | 'pending';
}

/** GET /practice/earnings — the doctor's wallet: balance + ledger. */
export interface DoctorEarnings {
  /** Available-to-withdraw balance, in the smallest sensible whole unit (₦). */
  balance: number;
  /** Total earned in the current calendar month. */
  thisMonth: number;
  /** Withdrawals still processing (not yet settled). */
  pending: number;
  /** ISO-4217 code, 'NGN'. */
  currency: string;
  items: EarningItem[];
}

/** POST /practice/payouts — the destination is the saved PaymentMethod, read server-side. */
export interface CashoutInput {
  amount: number;
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

/**
 * A patient's saved pharmacy preference (GET/PUT /me/pharmacy). Batch 3
 * Phase 3: may reference a directory pharmacy (in-network, `pharmacyId`
 * set) or be free text for one that isn't in the directory yet
 * (out-of-network fallback).
 */
export interface Pharmacy {
  pharmacyId?: string | null;
  name?: string;
  address: string;
  fax: string;
}

/** PUT /me/pharmacy input — pick a directory pharmacy, or enter one free text. */
export type PharmacyInput = { pharmacyId: string } | { name?: string; address: string; fax: string };

/** GET /pharmacies — the admin-curated directory a patient can pick from. */
export interface PharmacyDirectoryEntry {
  id: string;
  name: string;
  address: string;
  fax: string;
}

/**
 * GET/PUT /me/gov-id — government-ID verification status. Not a booking
 * gate, purely a trust signal: admin reviews the submitted document and
 * marks it verified or rejected.
 */
export interface GovIdStatus {
  status: 'none' | 'pending' | 'verified' | 'rejected';
  fileName?: string;
  url: string | null;
}

/**
 * A stored document / credential (Doctor "Documents & Certifications"). Files
 * live in R2; this row is the metadata. `url` is the object key (or public URL)
 * in live mode, and the local file uri in mock mode.
 */
/**
 * 'condition' is a PATIENT's picture/document of a medical condition (SOW 1.6);
 * every other value is a provider credential. The split matters beyond
 * labelling: only 'condition' uploads are readable by a treating provider
 * (GET /practice/patients/:id/documents) — a patient's own ID scan or
 * insurance card never leaves their own view.
 */
export type DocumentCategory = 'license' | 'certification' | 'government-id' | 'insurance' | 'condition' | 'other';

export interface StoredDocument {
  id: string;
  /** User-facing title, e.g. "MDCN Practising License 2026". */
  name: string;
  category: DocumentCategory;
  /** Original file name, e.g. "license.pdf". */
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** R2 key/public URL (live) or local file uri (mock); null if not resolvable. */
  url: string | null;
  /** The visit this was uploaded for, when the patient attached it to one. */
  appointmentId?: string | null;
  /** What the patient wants the provider to know about it — `name` is the title. */
  description?: string | null;
  /** Display date, e.g. "Jul 20, 2026". */
  uploadedAt: string;
  /** ISO timestamp — lists sort on this. */
  createdAt: string;
}

/** A file chosen from the device, ready to upload. */
export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}

/** POST /uploads/presign response — a short-lived R2 PUT URL. */
export interface PresignResult {
  uploadUrl: string;
  key: string;
  publicUrl: string | null;
  expiresIn: number;
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

/**
 * A verification document attached to a provider application (Batch 3 Phase
 * 1 — vetting). Uploaded to R2 ahead of submit via POST /uploads/presign
 * (kind:'provider-doc'); `uploadedAt` is server-stamped on submit, never sent.
 */
export interface ProviderApplicationDocument {
  key: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt?: string;
}

/** GET /providers/me — a provider account's onboarding state. */
export interface ProviderState {
  /** 'live' = bookable profile exists; 'pending' = awaiting admin review. */
  state: 'live' | 'pending' | 'rejected' | 'none';
  doctorId: string | null;
  /** Only set once live — drives capability-aware UX (e.g. hiding "Add prescription" for a Nurse). */
  providerType: AppointmentProviderType | null;
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
  /** How the server sees this caller: a party to the visit, or an admitted guest. */
  role?: 'patient' | 'provider' | 'guest';
}

/**
 * A third party invited into a visit's call (conference, patient-feedback
 * item 10). Entry takes both an invite and an admission — see the backend's
 * migrations/0029_call_invites.sql.
 */
export interface CallInvite {
  id: string;
  appointmentId: string;
  inviteeId: string;
  inviteeName: string;
  invitedById: string;
  invitedByName: string;
  status: 'invited' | 'knocking' | 'admitted' | 'declined' | 'revoked';
  knockedAt: string | null;
  admittedAt: string | null;
  createdAt: string;
}

/** An invite as the GUEST sees it — the visit's details, not the other invitees'. */
export interface MyCallInvite {
  id: string;
  appointmentId: string;
  status: CallInvite['status'];
  invitedByName: string;
  doctorName: string;
  visitType: VisitType;
  date: string;
  time: string;
}

/** One bucket of a revenue/earnings trend. */
export interface RevenueBucket {
  /** Sortable yyyy-mm-dd key for the bucket's start. */
  bucket: string;
  /** Axis label, e.g. "Jul 14" / "Wk of Jul 14" / "Jul 2026". */
  label: string;
}

export type RevenueGranularity = 'day' | 'week' | 'month';

export interface RevenueRange {
  from: string;
  /** Inclusive last day of the window, as the client asked for it. */
  to: string;
  granularity: RevenueGranularity;
}

/**
 * GET /practice/earnings/analysis — the provider's own revenue analysis
 * (SOW 1.18). Distinct from DoctorEarnings, which is the wallet: this is the
 * trend and the breakdown, over a range the provider chooses.
 */
export interface EarningsAnalysis {
  range: RevenueRange;
  currency: string;
  totals: {
    /** Settled earnings in the range. Withdrawals are never counted here. */
    earned: number;
    withdrawn: number;
    visits: number;
    averagePerVisit: number;
  };
  previous: {
    earned: number;
    visits: number;
    /** Change vs. the same-length preceding window; null when there's no base. */
    earnedChangePct: number | null;
  };
  series: (RevenueBucket & { earned: number; visits: number })[];
  byVisitType: { type: string; earned: number; visits: number }[];
}

/** Access token grant for connecting to Stream Chat. */
export interface ChatTokenGrant {
  token: string;
  apiKey: string;
  identity: string;
  userId: string;
  expiresAt: string;
}
