/**
 * In-app mock backend. Serves the same shapes the real API will return so
 * every endpoint module (and therefore every screen) works with zero
 * infrastructure. Delete nothing here when the backend lands — it stays
 * useful for demos, offline development and UI tests.
 */
import {
  MOCK_APPOINTMENTS,
  MOCK_CONVERSATIONS,
  MOCK_DOCTORS,
  MOCK_DOCTOR_APPOINTMENTS,
  MOCK_DOCTOR_SCHEDULE,
  MOCK_EARNINGS,
  MOCK_MEDICAL_NOTES,
  MOCK_NOTIFICATIONS,
  MOCK_PATIENTS,
  MOCK_PRESCRIPTIONS,
} from '../../constants';
import type {
  Appointment,
  AppNotification,
  AuthSession,
  AvailabilityBlock,
  AvailabilitySlot,
  CallInvite,
  CallTokenGrant,
  ChatMessage,
  EarningsAnalysis,
  MyCallInvite,
  RevenueGranularity,
  ChatTokenGrant,
  Complaint,
  ComplaintInput,
  ContentBlock,
  Conversation,
  CreateAppointmentInput,
  Currency,
  Doctor,
  AppointmentStatus,
  Dependent,
  DoctorAgendaItem,
  DoctorEarnings,
  EarningItem,
  Insurance,
  LoginResult,
  MedicalNote,
  MedicalNoteInput,
  NextAvailableMatch,
  NoteAmendment,
  PatientSummary,
  PatientBiometrics,
  PayoutMethod,
  PayoutMethodInput,
  Bank,
  PatientVisitNote,
  Prescription,
  PrescriptionInput,
  FeeBreakdown,
  PaymentIntent,
  PaymentPreview,
  PaymentReceipt,
  PaymentStatus,
  PromoStatus,
  Pharmacy,
  PharmacyInput,
  PharmacyDirectoryEntry,
  GovIdStatus,
  PickedFile,
  ProviderState,
  Review,
  ReviewSummary,
  StoredDocument,
  SupportMessage,
  DocumentCategory,
  LabResult,
  LabInput,
  User,
  UserRole,
  UserSettings,
  VisitType,
} from '../types';
import { splitFee } from '../../utils/format';

/**
 * Mock mode keeps per-user records in memory so the screens behave like the
 * real thing within a session (they reset on reload — there's no backend).
 */
const mockDependents: Dependent[] = [
  { id: 'dep-1', firstName: 'Chidi', lastName: 'Doe', dob: '12-04-2015', relationship: 'Son' },
];
let mockInsurance: Insurance | null = null;
let mockPharmacy: Pharmacy | null = null;
let mockBiometrics: PatientBiometrics | null = null;
/** "Jul 23, 2026" — matches the real backend's recordedAt format. */
function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
let mockGovId: GovIdStatus = { status: 'none', url: null };
/** The admin-curated pharmacy directory (Batch 3 Phase 3) — mirrors an approved Pharmacy provider application. */
const MOCK_PHARMACY_DIRECTORY: PharmacyDirectoryEntry[] = [
  { id: 'pharmacy-1', name: 'GreenCross Pharmacy', address: 'Surulere, Lagos', fax: '+2348012345678' },
  { id: 'pharmacy-2', name: 'MedPlus Pharmacy', address: 'Ikeja, Lagos', fax: '+2348023456789' },
];
/** The signed-in mock user's own spoken languages (task 2.5), editable via updateProfile. */
let mockSpokenLanguages: string[] = ['English'];
/** The signed-in mock user's own display currency (task 2.4), editable via updateProfile. */
let mockPreferredCurrency = 'NGN';
/** Login 2FA opt-in, editable via updateProfile — toggle it in Settings, then sign out and back in to see the code step. */
let mockTwoFactorEnabled = false;
/** The mock doctor's recurring weekly working hours (scheduling foundation), editable via the Availability screen. Mon-Fri 9-5, matching the real backend's day-one backfill default. */
let mockDoctorAvailability: AvailabilityBlock[] = [1, 2, 3, 4, 5].map((weekday) => ({
  id: `avail-${weekday}`,
  weekday,
  startMinute: 9 * 60,
  endMinute: 17 * 60,
  slotMinutes: 60,
}));
/** Admin-editable prose (task 2.2), mirroring the backend's seeded content_blocks. */
const MOCK_CONTENT_BLOCKS: ContentBlock[] = [
  {
    key: 'about_mission',
    title: 'Our Mission',
    body: 'Eko Telehealth connects patients with licensed, verified doctors for video, clinic, and home visits — bringing quality healthcare within reach, wherever you are.',
  },
  {
    key: 'about_contact',
    title: 'Contact Us',
    body: 'Have a question or need help? Reach our support team at support@ekotelehealth.com, or use "Report a Problem" in Settings to file a trackable request.',
  },
  {
    key: 'terms_of_service',
    title: 'Terms of Service',
    body: 'By using Eko Telehealth, you agree to receive care from licensed providers subject to their own professional obligations, to provide accurate information during registration and consultations, and to use the platform only for its intended purpose of arranging and conducting telehealth visits. Eko Telehealth is a marketplace connecting patients and providers; it does not itself practice medicine. Full terms are available on request from support@ekotelehealth.com.',
  },
  {
    key: 'privacy_policy',
    title: 'Privacy Policy',
    body: 'Eko Telehealth collects the information needed to provide care: your account details, appointment history, and any medical information you or your provider add to your record. This information is shared only with providers you consult and is never sold. You can request a copy or deletion of your data at any time via support@ekotelehealth.com.',
  },
];
/** The signed-in mock user's own filed reports (task 2.1), newest first. */
let mockComplaints: Complaint[] = [
  {
    id: 'c-1',
    category: 'billing',
    subject: 'Charged twice for the same visit',
    description: 'I was charged twice on my card for my last video visit. Please refund the duplicate charge.',
    status: 'pending',
    submittedAt: 'Jul 19, 2026',
  },
  {
    id: 'c-2',
    category: 'technical',
    subject: 'Video call kept freezing',
    description: 'The video kept freezing every couple of minutes during my consultation and we had to finish over audio only.',
    status: 'resolved',
    resolutionNote: "Traced to a CDN region issue on our video provider's side, resolved. Sorry for the disruption — let us know if it happens again.",
    submittedAt: 'Jul 10, 2026',
  },
];
/**
 * Support threads keyed by complaint (task #05). A report is also a
 * conversation with the platform — c-1 has a worked exchange waiting on
 * support, c-2 carries its resolution note as the closing message, mirroring
 * how the real backend files a resolution into the transcript.
 */
const mockSupportMessages: SupportMessage[] = [
  {
    id: 'sm-1',
    complaintId: 'c-1',
    authorRole: 'admin',
    authorName: 'Eko Admin',
    body: 'Thanks for flagging this — I can see two authorisations against your card for Jul 18. Checking with our payment provider now.',
    createdAt: '2026-07-19T14:10:00.000Z',
  },
  {
    id: 'sm-2',
    complaintId: 'c-1',
    authorRole: 'user',
    authorName: 'Martin Doe',
    body: 'Thank you. Only one visit actually happened, so the second one should not be there.',
    createdAt: '2026-07-19T15:02:00.000Z',
  },
  {
    id: 'sm-3',
    complaintId: 'c-2',
    authorRole: 'admin',
    authorName: 'Eko Admin',
    body: "Traced to a CDN region issue on our video provider's side, resolved. Sorry for the disruption — let us know if it happens again.",
    createdAt: '2026-07-12T15:00:00.000Z',
  },
];
// Provider credentials and patient condition uploads (SOW 1.6) share this
// store, exactly as they share the `documents` table server-side. `category`
// is what separates the two populations everywhere.
const mockDocuments: StoredDocument[] = [
  { id: 'doc-seed-1', name: 'MDCN Practising License 2026', category: 'license', fileName: 'mdcn-license-2026.pdf', mimeType: 'application/pdf', sizeBytes: 482_000, url: null, uploadedAt: 'Jan 12, 2026', createdAt: '2026-01-12T09:00:00.000Z' },
  { id: 'doc-seed-2', name: 'Board Certification — Internal Medicine', category: 'certification', fileName: 'board-cert.pdf', mimeType: 'application/pdf', sizeBytes: 1_204_000, url: null, uploadedAt: 'Nov 3, 2025', createdAt: '2025-11-03T09:00:00.000Z' },
  { id: 'doc-seed-3', name: 'Rash on left forearm', category: 'condition', fileName: 'forearm-rash.jpg', mimeType: 'image/jpeg', sizeBytes: 1_840_000, url: null, description: 'Started Tuesday, itchy and worse at night. No new soap or detergent.', uploadedAt: 'Jul 24, 2026', createdAt: '2026-07-24T08:20:00.000Z' },
  { id: 'doc-seed-4', name: 'Previous discharge summary', category: 'condition', fileName: 'discharge-summary.pdf', mimeType: 'application/pdf', sizeBytes: 620_000, url: null, description: 'From the hospital stay in March, in case it is relevant.', uploadedAt: 'Jul 20, 2026', createdAt: '2026-07-20T14:05:00.000Z' },
];
/**
 * Conference invites (patient-feedback item 10). Seeded against appointment
 * '1' — the upcoming Video Visit — and already knocking, so the in-call
 * "someone is asking to join" prompt is reachable in a demo where there is
 * only ever one signed-in user and no second device to knock from.
 */
const mockCallInvites: CallInvite[] = [
  {
    id: 'inv-seed-1',
    appointmentId: '1',
    inviteeId: 'guest-seed-1',
    inviteeName: 'Ada Doe',
    invitedById: 'pat-1',
    invitedByName: 'Martin Doe',
    status: 'knocking',
    knockedAt: '2026-07-27T09:58:00.000Z',
    admittedAt: null,
    createdAt: '2026-07-27T09:55:00.000Z',
  },
];
const mockMedicalNotes: MedicalNote[] = [...(MOCK_MEDICAL_NOTES as MedicalNote[])];

/**
 * Project full mock notes down to the patient-facing summary shape and sort
 * newest first — mirrors the server's toPatientVisitNote, so the mock can't
 * accidentally show a field the real API withholds (subjective/objective/
 * assessment/amendments never leave this function).
 */
function toPatientVisitNotes(notes: MedicalNote[]): PatientVisitNote[] {
  return notes
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((n) => ({
      id: n.id,
      date: n.date,
      visitType: n.visitType,
      doctorName: n.doctorName,
      doctorSpecialty: n.doctorSpecialty,
      reason: n.reason,
      primaryDiagnosis: n.primaryDiagnosis,
      secondaryDiagnoses: n.secondaryDiagnoses ?? [],
      plan: n.plan,
      createdAt: n.createdAt,
    }));
}
// Lab results, seeded for the signed-in patient (pat-1) and a doctor's roster
// patient (p4 / Augustine) so both surfaces show data in mock mode.
const mockLabs: LabResult[] = [
  { id: 'lab-1', patientId: 'pat-1', testName: 'Fasting Blood Glucose', loincCode: '1558-6', specimen: 'Serum', value: '5.2', unit: 'mmol/L', referenceRange: '3.9–5.5', flag: 'normal', status: 'resulted', orderedBy: 'Dr. Amara Okafor', performingLab: 'Lagoon Clinical Labs', collectedDate: 'Jul 8, 2026', resultedDate: 'Jul 9, 2026', notes: 'Within normal limits.', attachmentUrl: null, createdAt: '2026-07-09T09:00:00Z' },
  { id: 'lab-2', patientId: 'pat-1', testName: 'Total Cholesterol', loincCode: '2093-3', specimen: 'Serum', value: '6.1', unit: 'mmol/L', referenceRange: '< 5.2', flag: 'high', status: 'resulted', orderedBy: 'Dr. Amara Okafor', performingLab: 'Lagoon Clinical Labs', collectedDate: 'Jul 8, 2026', resultedDate: 'Jul 9, 2026', notes: 'Borderline high — advise dietary review.', attachmentUrl: null, createdAt: '2026-07-09T09:05:00Z' },
  { id: 'lab-3', patientId: 'pat-1', testName: 'Haemoglobin (CBC)', loincCode: '718-7', specimen: 'Whole blood', value: '13.8', unit: 'g/dL', referenceRange: '13.0–17.0', flag: 'normal', status: 'resulted', orderedBy: 'Dr. Amara Okafor', performingLab: 'Lagoon Clinical Labs', collectedDate: 'Mar 2, 2026', resultedDate: 'Mar 3, 2026', attachmentUrl: null, createdAt: '2026-03-03T09:00:00Z' },
  { id: 'lab-4', patientId: 'p4', testName: 'Thyroid Stimulating Hormone', loincCode: '3016-3', specimen: 'Serum', value: '0.2', unit: 'mIU/L', referenceRange: '0.4–4.0', flag: 'low', status: 'resulted', orderedBy: 'Dr. Sarah Johnson', performingLab: 'St. Nicholas Lab', collectedDate: 'Jun 4, 2026', resultedDate: 'Jun 5, 2026', notes: 'Suppressed TSH — check free T4.', attachmentUrl: null, createdAt: '2026-06-05T10:00:00Z' },
  // Chidi (dep-1) — Martin's dependent (proxy access). See the matching
  // prescription in MOCK_PRESCRIPTIONS for why dependentId, not patientId, is
  // what makes this Chidi's result.
  { id: 'lab-5', patientId: 'pat-1', dependentId: 'dep-1', testName: 'Rapid Strep Test', specimen: 'Throat swab', value: 'Positive', flag: 'abnormal', status: 'resulted', orderedBy: 'Dr. Amara Okafor', performingLab: 'Lagoon Clinical Labs', collectedDate: 'Jul 22, 2026', resultedDate: 'Jul 22, 2026', notes: 'Started on amoxicillin.', attachmentUrl: null, createdAt: '2026-07-22T11:15:00Z' },
];
const mockPrescriptions: Prescription[] = [...(MOCK_PRESCRIPTIONS as Prescription[])];
const mockEarnings: EarningItem[] = [...(MOCK_EARNINGS as EarningItem[])];

// Mirrors the backend's default rates (services/platformSettings.ts) — the
// mock has no admin-managed settings, so these are fixed constants.
const MOCK_RATES = { serviceChargePct: 0, commissionPct: 0.175, vatPct: 0.075 };

/**
 * Demo promo codes (mirrors the seed data in db/seed.ts). Redemption counts
 * are session-scoped (reset on reload, like the rest of mock mode) — enough
 * to demonstrate the UI states without a real backend.
 */
interface MockPromo {
  kind: 'percent' | 'flat';
  value: number;
  minSpend: number;
  maxRedemptions: number | null;
  perUserLimit: number;
  active: boolean;
}
const MOCK_PROMOS: Record<string, MockPromo> = {
  SAVE20: { kind: 'percent', value: 0.2, minSpend: 0, maxRedemptions: null, perUserLimit: 1, active: true },
  WELCOME2000: { kind: 'flat', value: 2000, minSpend: 10000, maxRedemptions: 50, perUserLimit: 1, active: true },
};
const mockPromoRedemptionCount: Record<string, number> = {};

/** Mirrors backend services/promos.ts resolvePromo, for mock mode. */
function resolveMockPromo(rawCode: string | undefined, subtotal: number): { code: string | null; discount: number; status: PromoStatus | null } {
  if (!rawCode?.trim()) return { code: null, discount: 0, status: null };
  const code = rawCode.trim().toUpperCase();
  const promo = MOCK_PROMOS[code];
  if (!promo) return { code, discount: 0, status: 'not_found' };
  if (!promo.active) return { code, discount: 0, status: 'inactive' };
  if (subtotal < promo.minSpend) return { code, discount: 0, status: 'min_spend' };
  const used = mockPromoRedemptionCount[code] ?? 0;
  if (promo.maxRedemptions != null && used >= promo.maxRedemptions) return { code, discount: 0, status: 'limit_reached' };
  if (used >= promo.perUserLimit) return { code, discount: 0, status: 'user_limit_reached' };
  const discount = promo.kind === 'percent' ? Math.round(subtotal * promo.value) : Math.round(promo.value);
  return { code, discount, status: 'applied' };
}

/**
 * Mirrors backend lib/pricing.ts computeFeeBreakdown, for mock mode.
 * `discount` is capped at the platform's own share (serviceCharge +
 * providerCommission) exactly like the backend — it can never reduce the
 * provider's payout.
 */
function mockFeeBreakdown(feeDisplay: string | undefined, type: VisitType | undefined, discount = 0): FeeBreakdown {
  const consultationFee = (feeDisplay && splitFee(feeDisplay)?.amount) || 15000;
  const serviceCharge = Math.round(consultationFee * MOCK_RATES.serviceChargePct);
  const providerCommission = Math.round(consultationFee * MOCK_RATES.commissionPct);
  const vat = type === 'Video Visit' ? Math.round(consultationFee * MOCK_RATES.vatPct) : 0;
  const cappedDiscount = Math.max(0, Math.min(discount, serviceCharge + providerCommission));
  return {
    consultationFee,
    serviceCharge,
    vat,
    discount: cappedDiscount,
    providerCommission,
    providerPayout: consultationFee - providerCommission,
  };
}

/** Single saved payment/payout method per session (upsert), like insurance/pharmacy. */
let mockPayoutMethod: PayoutMethod | null = null;
const MOCK_BANKS: Bank[] = [
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '044', name: 'Access Bank' },
  { code: '033', name: 'United Bank for Africa' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '070', name: 'Fidelity Bank' },
];
/** Minimum a doctor can withdraw at once. */
const MIN_CASHOUT = 1000;
let mockSettings: UserSettings = {
  pushNotifications: true,
  emailNotifications: true,
  smsNotifications: false,
  themeMode: 'system',
  locationAccess: true,
};

const MOCK_REVIEWS: Review[] = [
  { id: 'r1', author: 'Jane D.', rating: 5, title: 'So many words, so little time', text: 'Excellent doctor! Very thorough and caring. Took the time to answer every one of my questions and never made me feel rushed. The follow-up notes were detailed and easy to understand.', date: 'Apr 16, 2026', verified: true, comments: 100, communicationRating: 5, experienceRating: 5, speedyResponseRating: 4 },
  { id: 'r2', author: 'Mark S.', rating: 5, title: 'Excellent work', text: 'Great experience overall. Short wait time and the video call was crystal clear. Prescriptions were sent to my pharmacy within the hour — the whole thing was seamless.', date: 'Jan 28, 2026', verified: true, comments: 10, communicationRating: 5, experienceRating: 4, speedyResponseRating: 5 },
  { id: 'r3', author: 'Sam S.', rating: 5, title: 'So many words', text: 'Highly recommend! Very knowledgeable and professional. Explained my diagnosis clearly and laid out every option before we decided on a plan together.', date: 'Jan 16, 2026', verified: true, comments: 80 },
  { id: 'r4', author: 'Alice M.', rating: 4, title: 'Really helpful', text: 'Solid consultation and genuinely helpful advice. Knocked a star off only because the app kept me waiting a couple of minutes past my slot.', date: 'Dec 30, 2025', verified: true, comments: 4 },
  { id: 'r5', author: 'Tunde A.', rating: 4, title: 'Would book again', text: 'Professional and friendly. Answered my follow-up message the same day.', date: 'Dec 12, 2025', verified: true, comments: 2 },
  { id: 'r6', author: 'Ngozi E.', rating: 3, title: 'Decent but rushed', text: 'The advice was fine but the call felt a little rushed towards the end.', date: 'Nov 20, 2025', verified: false, comments: 1 },
];

/** Simulated network latency so loading states are visible during development. */
const delay = (ms = 450) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "10:05 AM" from a Date, without relying on Intl. */
function formatClock(d: Date): string {
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

/**
 * Parse a ledger row's display date ("Jul 18, 2026") back into a Date.
 *
 * The mock ledger stores what it renders, so this is the only way to bucket it
 * by time. Unparseable rows fall back to the epoch, which sorts them out of
 * every range rather than into an arbitrary one.
 */
function earningDate(item: EarningItem): Date {
  const m = /^([A-Za-z]{3}) (\d{1,2}), (\d{4})$/.exec(item.date);
  if (!m) return new Date(0);
  const month = MONTH_ABBR.indexOf(m[1]);
  return month < 0 ? new Date(0) : new Date(Number(m[3]), month, Number(m[2]));
}

/**
 * Derive the wallet totals from the ledger so balance/pending/month stay
 * consistent as withdrawals are added. Balance = settled earnings minus every
 * withdrawal (pending ones are money already on its way out).
 *
 * `thisMonth` is scoped to the current calendar month, honoring the
 * DoctorEarnings.thisMonth contract and matching the backend's own
 * summarizeEarnings. It used to sum every settled earning regardless of date —
 * harmless while the seed data was all recent, wrong the moment it wasn't.
 */
function summarizeEarnings(): DoctorEarnings {
  const now = new Date();
  let balance = 0;
  let pending = 0;
  let thisMonth = 0;
  for (const item of mockEarnings) {
    if (item.kind === 'earning') {
      if (item.status === 'settled') {
        balance += item.amount;
        const at = earningDate(item);
        if (at.getFullYear() === now.getFullYear() && at.getMonth() === now.getMonth()) thisMonth += item.amount;
      }
    } else {
      balance -= item.amount;
      if (item.status === 'pending') pending += item.amount;
    }
  }
  return { balance, thisMonth, pending, currency: 'NGN', items: [...mockEarnings] };
}

let appointmentSeq = 100;

/**
 * Seeded accounts, keyed by email. Stands in for the backend's `users` table:
 * the account's type (its stored accountType) is looked up here at login rather
 * than chosen by the caller, mirroring how the real /auth/login reads
 * users.account_type. Any email not seeded resolves to a Patient account so
 * arbitrary demo sign-ins still work; to demo the doctor experience, sign in as
 * dr.johnson@ekotelehealth.com (any password — the mock doesn't check it).
 */
const MOCK_ACCOUNTS: Record<string, { id: string; firstName: string; lastName: string; accountType: UserRole }> = {
  'martin@ekotelehealth.com': { id: 'pat-1', firstName: 'Martin', lastName: 'Doe', accountType: 'Patient' },
  'dr.johnson@ekotelehealth.com': { id: 'doc-1', firstName: 'Sarah', lastName: 'Johnson', accountType: 'Doctor' },
};

/** Shared by login() and verifyTwoFactorLogin() — the same session shape either way. */
function buildMockSession(normalizedEmail: string): AuthSession {
  const account = MOCK_ACCOUNTS[normalizedEmail] ?? {
    id: 'pat-1',
    firstName: 'Martin',
    lastName: 'Doe',
    accountType: 'Patient' as UserRole,
  };
  return {
    user: {
      id: account.id,
      firstName: account.firstName,
      lastName: account.lastName,
      email: normalizedEmail || 'martin@ekotelehealth.com',
      accountType: account.accountType,
      spokenLanguages: mockSpokenLanguages,
      preferredCurrency: mockPreferredCurrency,
      twoFactorEnabled: mockTwoFactorEnabled,
    },
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };
}

export const mockApi = {
  async login(email: string, _password: string): Promise<LoginResult> {
    await delay(700);
    const normalized = email.trim().toLowerCase();
    // Mirrors the live flow: with 2FA on, hold the session back and hand out
    // a challenge instead. Any 6-digit code is accepted below, same as the
    // rest of this mock's OTP endpoints.
    if (mockTwoFactorEnabled) {
      return { twoFactorRequired: true, challenge: `mock-challenge:${normalized}` };
    }
    return buildMockSession(normalized);
  },

  async verifyTwoFactorLogin(challenge: string, _code: string): Promise<AuthSession> {
    await delay(500);
    const normalized = challenge.split(':')[1] ?? '';
    return buildMockSession(normalized);
  },

  async signup(_input: {
    firstName: string;
    lastName: string;
    email: string;
    accountType: UserRole;
    /** Accepted to match the live contract; the mock user model has no phone. */
    phone?: string;
  }): Promise<void> {
    // Mirrors the live contract: signup only records a pending signup and
    // returns no session — the account appears once the email code is verified.
    await delay(700);
  },

  async getDoctors(params?: { category?: string; query?: string }): Promise<Doctor[]> {
    await delay();
    let list = MOCK_DOCTORS as Doctor[];
    if (params?.category) list = list.filter((d) => d.category === params.category);
    if (params?.query) {
      const q = params.query.toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q));
    }
    return list;
  },

  async getDoctor(id: string): Promise<Doctor | undefined> {
    await delay(250);
    return (MOCK_DOCTORS as Doctor[]).find((d) => d.id === id);
  },

  async getAppointments(): Promise<Appointment[]> {
    await delay();
    return MOCK_APPOINTMENTS as Appointment[];
  },

  async createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
    await delay(600);
    const doctor = (MOCK_DOCTORS as Doctor[]).find((d) => d.id === input.doctorId);
    // Mirrors the backend's server-side gate (routes/appointments.ts) so the
    // mock behaves the same as a real deployment, not just the client filter.
    if (input.type === 'Home Visit' && !doctor?.canProvideInHome) {
      throw new Error(`${doctor?.name ?? 'This doctor'} is not certified for home visits.`);
    }
    const startAt = new Date(input.startAt);
    return {
      id: String(++appointmentSeq),
      doctor: doctor?.name ?? 'Doctor',
      doctorId: doctor?.id,
      specialty: doctor?.category ?? 'Consultation',
      date: startAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      time: formatClock(startAt),
      type: input.type,
      status: 'upcoming',
      dependentId: input.dependentId,
      isPeerReview: input.isPeerReview ?? false,
      isCaseConference: input.isCaseConference ?? false,
    };
  },

  /**
   * GET /doctors/:id/availability?date= — mirrors the real backend's shape
   * (working hours minus already-past times), simplified: every mock doctor
   * shows the same 9-5 hourly slots, no collision checking against
   * MOCK_APPOINTMENTS since those store display strings, not real instants.
   */
  async getDoctorAvailabilitySlots(_doctorId: string, date: string): Promise<AvailabilitySlot[]> {
    await delay(300);
    const [year, month, day] = date.split('-').map(Number);
    const now = new Date();
    const slots: AvailabilitySlot[] = [];
    for (let hour = 9; hour < 17; hour++) {
      const startAt = new Date(year, month - 1, day, hour, 0, 0, 0);
      if (startAt <= now) continue;
      slots.push({ startAt: startAt.toISOString(), label: formatClock(startAt) });
    }
    return slots;
  },

  /**
   * GET /doctors/match?category=&type= — mock: matches the first doctor in
   * the category (Home Visit also requires canProvideInHome, mirroring the
   * real backend's eligibility filter). The slot is always "tomorrow, 9 AM"
   * — mock mode doesn't model real per-doctor schedules across multiple
   * doctors, so it isn't trying to reproduce the real earliest-across-N
   * search, just the shape of a match.
   */
  async matchNextAvailable(category: string, type: VisitType): Promise<NextAvailableMatch> {
    await delay(500);
    const doctor = (MOCK_DOCTORS as Doctor[]).find(
      (d) => d.category === category && (type !== 'Home Visit' || d.canProvideInHome),
    );
    if (!doctor) return { doctor: null, slot: null };
    const tomorrow9am = new Date();
    tomorrow9am.setDate(tomorrow9am.getDate() + 1);
    tomorrow9am.setHours(9, 0, 0, 0);
    return { doctor, slot: { startAt: tomorrow9am.toISOString(), label: formatClock(tomorrow9am) } };
  },

  /** POST /appointments/:id/check-in */
  async checkInAppointment(id: string): Promise<Appointment> {
    await delay(400);
    const found = (MOCK_APPOINTMENTS as Appointment[]).find((a) => a.id === id) ?? (MOCK_APPOINTMENTS[0] as Appointment);
    return { ...found, id, status: 'checked_in' };
  },

  /** GET /practice/availability */
  async getDoctorWorkingHours(): Promise<AvailabilityBlock[]> {
    await delay(300);
    return mockDoctorAvailability;
  },

  /** PUT /practice/availability — full replace. */
  async saveDoctorWorkingHours(blocks: AvailabilityBlock[]): Promise<AvailabilityBlock[]> {
    await delay(500);
    mockDoctorAvailability = blocks.map((b, i) => ({ ...b, id: b.id ?? `avail-new-${i}-${Date.now()}` }));
    return mockDoctorAvailability;
  },

  async getConversations(): Promise<Conversation[]> {
    await delay();
    return MOCK_CONVERSATIONS as Conversation[];
  },

  async createConversation(doctorId: string): Promise<Conversation> {
    await delay(300);
    return { id: `mock-conv-${doctorId}`, doctorId, lastMessage: '', time: 'now', unread: 0 };
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    await delay(300);
    return [
      { id: '1', conversationId, text: 'Hello! How can I help you today?', fromMe: false, time: '2:00 PM' },
      { id: '2', conversationId, text: "Hi doctor, I've been having some headaches lately.", fromMe: true, time: '2:01 PM' },
      { id: '3', conversationId, text: 'I see. How long have you been experiencing them? Are they accompanied by any other symptoms?', fromMe: false, time: '2:02 PM' },
      { id: '4', conversationId, text: 'About a week. I also feel a bit dizzy sometimes.', fromMe: true, time: '2:03 PM' },
    ];
  },

  async getNotifications(): Promise<AppNotification[]> {
    await delay();
    return MOCK_NOTIFICATIONS as AppNotification[];
  },

  async getPatients(): Promise<PatientSummary[]> {
    await delay();
    return MOCK_PATIENTS as PatientSummary[];
  },

  async getDoctorAgenda(): Promise<DoctorAgendaItem[]> {
    await delay();
    return MOCK_DOCTOR_APPOINTMENTS as DoctorAgendaItem[];
  },

  async getDoctorAppointments(): Promise<Appointment[]> {
    await delay();
    return MOCK_DOCTOR_SCHEDULE as Appointment[];
  },

  /** Mock accept/decline — echoes the requested status back to the caller. */
  async decideAppointment(id: string, status: AppointmentStatus): Promise<Appointment> {
    await delay(400);
    const found = (MOCK_DOCTOR_SCHEDULE as Appointment[]).find((a) => a.id === id);
    return { ...(found ?? (MOCK_DOCTOR_SCHEDULE[0] as Appointment)), id, status };
  },

  async getMedicalNotes(patientId: string): Promise<MedicalNote[]> {
    await delay();
    return mockMedicalNotes
      .filter((n) => n.patientId === patientId)
      // Drafts are private to their author (the mock doctor is always doc-1).
      .filter((n) => n.status !== 'draft' || n.doctorId === 'doc-1')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async addMedicalNote(input: MedicalNoteInput): Promise<MedicalNote> {
    await delay(500);
    // Author identity is stamped here, never taken from the client — mirrors
    // the real backend deriving it from the bearer token. The mock doctor
    // session is always doc-1 / Dr. Sarah Johnson.
    const note: MedicalNote = {
      id: `note-${Date.now()}`,
      ...input,
      status: input.status ?? 'final',
      doctorId: 'doc-1',
      doctorName: 'Dr. Sarah Johnson',
      doctorSpecialty: 'Primary Care',
      amendments: [],
      createdAt: new Date().toISOString(),
    };
    mockMedicalNotes.push(note);
    return note;
  },

  /**
   * Update an existing DRAFT (save-draft-again or finalize). A finalized record
   * is immutable — the SOAP body can never be edited, so this rejects it.
   */
  async updateMedicalNote(noteId: string, input: MedicalNoteInput): Promise<MedicalNote> {
    await delay(500);
    const note = mockMedicalNotes.find((n) => n.id === noteId);
    if (!note) throw new Error('Record not found.');
    if ((note.status ?? 'final') === 'final') throw new Error('A finalized record cannot be edited.');
    Object.assign(note, input, { status: input.status ?? 'final', updatedAt: new Date().toISOString() });
    return { ...note };
  },

  /**
   * Append an amendment to a locked record. The SOAP body is never touched —
   * this only adds to the amendments trail, mirroring the immutable record on
   * the backend. Author is stamped here (the mock doctor session).
   */
  async addNoteAmendment(noteId: string, text: string): Promise<MedicalNote> {
    await delay(400);
    const note = mockMedicalNotes.find((n) => n.id === noteId);
    if (!note) throw new Error('Record not found.');
    const amendment: NoteAmendment = {
      id: `amd-${Date.now()}`,
      text,
      authorId: 'doc-1',
      authorName: 'Dr. Sarah Johnson',
      createdAt: new Date().toISOString(),
    };
    note.amendments = [...(note.amendments ?? []), amendment];
    return { ...note };
  },

  async getPrescriptions(patientId: string): Promise<Prescription[]> {
    await delay();
    return mockPrescriptions
      .filter((p) => p.patientId === patientId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async addPrescription(input: PrescriptionInput): Promise<Prescription> {
    await delay(500);
    // Prescriber is stamped here, never taken from the client. A freshly written
    // prescription is a current medication ('active'). The mock doctor session
    // is always doc-1 / Dr. Sarah Johnson.
    const now = new Date();
    const prescription: Prescription = {
      id: `rx-${Date.now()}`,
      ...input,
      status: 'active',
      doctorId: 'doc-1',
      doctorName: 'Dr. Sarah Johnson',
      datePrescribed: `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`,
      // Mirrors the backend: referring at prescribe time starts the lifecycle.
      pharmacyName: input.pharmacyId ? MOCK_PHARMACY_DIRECTORY.find((p) => p.id === input.pharmacyId)?.name : undefined,
      fulfillmentStatus: input.pharmacyId ? 'sent' : 'none',
      createdAt: now.toISOString(),
    };
    mockPrescriptions.push(prescription);
    return prescription;
  },

  /** The signed-in mock patient (pat-1)'s own medication record. */
  /**
   * GET /me/notes — the patient's own visit notes, summary fields only.
   * Mirrors the server's projection: the SOAP body is dropped here too, so the
   * mock can't accidentally show a field the real API withholds.
   */
  async getMyVisitNotes(): Promise<PatientVisitNote[]> {
    await delay();
    return toPatientVisitNotes(
      mockMedicalNotes.filter((n) => n.patientId === 'pat-1' && !n.dependentId && (n.status ?? 'final') === 'final'),
    );
  },

  /**
   * GET /me/dependents/:id/prescriptions — a proxy's view of one of THEIR
   * dependent's medications (BRD 1.2 "Proxies"). Mirrors the real backend's
   * ownership check: only 'dep-1' exists for the mock signed-in patient, so
   * anything else returns empty rather than another patient's records.
   */
  async getDependentPrescriptions(dependentId: string): Promise<Prescription[]> {
    await delay();
    return mockPrescriptions
      .filter((p) => p.patientId === 'pat-1' && p.dependentId === dependentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  /** GET /me/dependents/:id/labs — a proxy's view of a dependent's lab results. */
  async getDependentLabs(dependentId: string): Promise<LabResult[]> {
    await delay();
    return mockLabs
      .filter((l) => l.patientId === 'pat-1' && l.dependentId === dependentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  /** GET /me/dependents/:id/notes — a proxy's view of a dependent's visit notes. */
  async getDependentVisitNotes(dependentId: string): Promise<PatientVisitNote[]> {
    await delay();
    return toPatientVisitNotes(
      mockMedicalNotes.filter(
        (n) => n.patientId === 'pat-1' && n.dependentId === dependentId && (n.status ?? 'final') === 'final',
      ),
    );
  },

  async getMyPrescriptions(): Promise<Prescription[]> {
    await delay();
    return mockPrescriptions
      .filter((p) => p.patientId === 'pat-1' && !p.dependentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  /**
   * GET /me/payments — the signed-in mock patient's settled payment history.
   * receipt-3's amount is illustrative only (a real PayPal charge would be
   * the NGN fee converted at env.paypal.ngnRate, computed server-side).
   */
  async getMyPayments(): Promise<PaymentReceipt[]> {
    await delay();
    return [
      {
        id: 'receipt-1',
        doctorName: 'Dr. Amara Okafor',
        specialty: 'Cardiology',
        visitType: 'Video Visit',
        date: 'Jul 18, 2026',
        time: '10:00 AM',
        provider: 'flutterwave',
        amount: 16125,
        currency: 'NGN',
        consultationFee: 15000,
        serviceCharge: 0,
        vat: 1125,
        discount: 0,
        createdAt: '2026-07-18T09:45:00.000Z',
      },
      {
        id: 'receipt-2',
        doctorName: 'Dr. Chinedu Eze',
        specialty: 'Dermatology',
        visitType: 'Clinic Visit',
        date: 'Jul 5, 2026',
        time: '2:30 PM',
        provider: 'flutterwave',
        amount: 12000,
        currency: 'NGN',
        consultationFee: 15000,
        serviceCharge: 0,
        vat: 0,
        discount: 3000,
        promoCode: 'SAVE20',
        createdAt: '2026-07-05T14:10:00.000Z',
      },
      {
        id: 'receipt-3',
        doctorName: 'Dr. Funmilayo Adeyemi',
        specialty: 'Pediatrics',
        visitType: 'Video Visit',
        date: 'Jun 22, 2026',
        time: '11:00 AM',
        provider: 'paypal',
        amount: 12.19,
        currency: 'USD',
        consultationFee: 15000,
        serviceCharge: 0,
        vat: 1125,
        discount: 0,
        createdAt: '2026-06-22T10:50:00.000Z',
      },
    ];
  },

  /** Labs for a roster patient (patientId given) or the signed-in patient (pat-1). */
  async getLabs(patientId?: string): Promise<LabResult[]> {
    await delay();
    const pid = patientId ?? 'pat-1';
    // Self-view (no patientId) excludes dependent-tagged rows — those are a
    // DEPENDENT's results, not the account holder's own; see
    // getDependentLabs. A doctor viewing a specific patient's chart still
    // sees everything tied to that patient, dependent-tagged or not.
    return mockLabs
      .filter((l) => l.patientId === pid && (patientId ? true : !l.dependentId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async addLab(patientId: string | undefined, input: LabInput, attachmentUri: string | null): Promise<LabResult> {
    await delay(500);
    const lab: LabResult = {
      id: `lab-${Date.now()}`,
      patientId: patientId ?? 'pat-1',
      ...input,
      attachmentUrl: attachmentUri,
      createdAt: new Date().toISOString(),
    };
    mockLabs.push(lab);
    return lab;
  },

  async removeLab(id: string): Promise<void> {
    await delay(300);
    const i = mockLabs.findIndex((l) => l.id === id);
    if (i >= 0) mockLabs.splice(i, 1);
  },

  async getDoctorEarnings(): Promise<DoctorEarnings> {
    await delay();
    return summarizeEarnings();
  },

  /**
   * GET /practice/earnings/analysis (SOW 1.18) — the trend and breakdown
   * behind the wallet figure. Mirrors the server's bucketing rules, including
   * the empty buckets: charting only the days that had earnings is how a
   * scattered week gets drawn as a smooth climb.
   */
  async getEarningsAnalysis(params: {
    from?: string;
    to?: string;
    granularity?: RevenueGranularity;
  }): Promise<EarningsAnalysis> {
    await delay();
    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    // yyyy-mm-dd is a LOCAL calendar date. `new Date("2026-07-01")` is UTC
    // midnight, which is still June 30th west of Greenwich — a range asked for
    // "from the 1st" would open on the previous month's last day.
    const localDay = (value: string) =>
      new Date(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10)));
    const from = startOfDay(params.from ? localDay(params.from) : new Date(now.getFullYear(), now.getMonth(), 1));
    const to = params.to ? new Date(startOfDay(localDay(params.to)).getTime() + 86_400_000) : startOfDay(new Date(now.getTime() + 86_400_000));
    const span = Math.max(86_400_000, to.getTime() - from.getTime());
    const days = Math.round(span / 86_400_000);
    const granularity: RevenueGranularity = params.granularity ?? (days <= 45 ? 'day' : days <= 190 ? 'week' : 'month');
    const previousFrom = new Date(from.getTime() - span);

    const key = (d: Date): string => {
      const start =
        granularity === 'month'
          ? new Date(d.getFullYear(), d.getMonth(), 1)
          : granularity === 'week'
            ? new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7))
            : startOfDay(d);
      return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    };
    const label = (k: string): string => {
      const [y, m, d] = k.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      if (granularity === 'month') return `${MONTH_ABBR[date.getMonth()]} ${date.getFullYear()}`;
      const short = `${MONTH_ABBR[date.getMonth()]} ${date.getDate()}`;
      return granularity === 'week' ? `Wk of ${short}` : short;
    };

    const series = new Map<string, { earned: number; visits: number }>();
    for (const cursor = new Date(from); cursor.getTime() < to.getTime(); ) {
      series.set(key(cursor), { earned: 0, visits: 0 });
      if (granularity === 'month') cursor.setMonth(cursor.getMonth() + 1);
      else cursor.setDate(cursor.getDate() + (granularity === 'week' ? 7 : 1));
    }

    const settled = mockEarnings.filter((e) => e.kind === 'earning' && e.status === 'settled');
    const inRange = settled.filter((e) => earningDate(e) >= from && earningDate(e) < to);
    const inPrevious = settled.filter((e) => earningDate(e) >= previousFrom && earningDate(e) < from);

    const byVisitType = new Map<string, { earned: number; visits: number }>();
    for (const item of inRange) {
      const bucket = series.get(key(earningDate(item)));
      if (bucket) {
        bucket.earned += item.amount;
        bucket.visits += 1;
      }
      // Seeded rows carry the visit type the earning came from; a row added
      // in-session by cashing out doesn't, and lands in 'Unknown' — the same
      // place the server puts an earning with no linked appointment.
      const type = (item as EarningItem & { visitType?: VisitType }).visitType ?? 'Unknown';
      const t = byVisitType.get(type) ?? { earned: 0, visits: 0 };
      byVisitType.set(type, { earned: t.earned + item.amount, visits: t.visits + 1 });
    }

    const earned = inRange.reduce((sum, e) => sum + e.amount, 0);
    const previousEarned = inPrevious.reduce((sum, e) => sum + e.amount, 0);
    const withdrawn = mockEarnings
      .filter((e) => e.kind === 'withdrawal' && earningDate(e) >= from && earningDate(e) < to)
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      range: { from: from.toISOString(), to: new Date(to.getTime() - 1).toISOString(), granularity },
      currency: 'NGN',
      totals: {
        earned,
        withdrawn,
        visits: inRange.length,
        averagePerVisit: inRange.length ? Math.round(earned / inRange.length) : 0,
      },
      previous: {
        earned: previousEarned,
        visits: inPrevious.length,
        earnedChangePct: previousEarned ? Math.round(((earned - previousEarned) / previousEarned) * 1000) / 10 : null,
      },
      series: [...series.entries()].map(([bucket, v]) => ({ bucket, label: label(bucket), ...v })),
      byVisitType: [...byVisitType.entries()].map(([type, v]) => ({ type, ...v })).sort((a, b) => b.earned - a.earned),
    };
  },

  /**
   * Withdraw `amount` to the saved payment method. Mirrors the real payout flow:
   * validates against the balance + minimum, records a still-processing
   * ('pending') withdrawal, and returns the updated wallet.
   */
  async cashOut(amount: number): Promise<DoctorEarnings> {
    await delay(600);
    const { balance } = summarizeEarnings();
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a valid amount.');
    if (amount < MIN_CASHOUT) throw new Error(`The minimum withdrawal is ₦${MIN_CASHOUT.toLocaleString('en-US')}.`);
    if (amount > balance) throw new Error('Amount exceeds your available balance.');
    const now = new Date();
    mockEarnings.unshift({
      id: `wd-${Date.now()}`,
      kind: 'withdrawal',
      title: 'Withdrawal',
      date: `${MONTH_ABBR[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`,
      time: formatClock(now),
      amount,
      status: 'pending',
    });
    return summarizeEarnings();
  },

  async getPayoutMethod(): Promise<PayoutMethod | null> {
    await delay(300);
    return mockPayoutMethod;
  },

  async savePayoutMethod(input: PayoutMethodInput): Promise<PayoutMethod> {
    await delay(600);
    if (input.rail === 'paypal') {
      mockPayoutMethod = { rail: 'paypal', accountName: input.paypalEmail, paypalEmail: input.paypalEmail };
    } else {
      // Stands in for the real Flutterwave account-resolve step, which is what
      // supplies accountName on the live path — never the client.
      mockPayoutMethod = {
        rail: 'flutterwave_bank',
        accountName: 'VERIFIED ACCOUNT NAME',
        bankCode: input.bankCode,
        bankName: input.bankName,
        accountNumberMasked: `••••${input.accountNumber.slice(-4)}`,
      };
    }
    return mockPayoutMethod;
  },

  async getBanks(): Promise<Bank[]> {
    await delay(300);
    return MOCK_BANKS;
  },

  async getDependents(): Promise<Dependent[]> {
    await delay();
    return [...mockDependents];
  },

  async addDependent(input: { firstName: string; lastName: string; dob: string; relationship?: string }): Promise<Dependent> {
    await delay(500);
    const dep = { id: `dep-${Date.now()}`, ...input };
    mockDependents.push(dep);
    return dep;
  },

  async getInsurance(): Promise<Insurance | null> {
    await delay(300);
    return mockInsurance;
  },

  async saveInsurance(input: Insurance): Promise<Insurance> {
    await delay(500);
    mockInsurance = input;
    return input;
  },

  async getPharmacy(): Promise<Pharmacy | null> {
    await delay(300);
    return mockPharmacy;
  },

  async savePharmacy(input: PharmacyInput): Promise<Pharmacy> {
    await delay(500);
    if ('pharmacyId' in input) {
      const directoryEntry = MOCK_PHARMACY_DIRECTORY.find((p) => p.id === input.pharmacyId);
      if (!directoryEntry) throw new Error('Pharmacy not found.');
      mockPharmacy = { pharmacyId: directoryEntry.id, name: directoryEntry.name, address: directoryEntry.address, fax: directoryEntry.fax };
    } else {
      mockPharmacy = { pharmacyId: null, ...input };
    }
    return mockPharmacy;
  },

  async getBiometrics(): Promise<PatientBiometrics | null> {
    await delay(300);
    return mockBiometrics;
  },

  async saveBiometrics(input: PatientBiometrics): Promise<PatientBiometrics> {
    await delay(400);
    mockBiometrics = { ...input, recordedAt: todayLabel() };
    return mockBiometrics;
  },

  async getPatientBiometrics(patientId: string): Promise<PatientBiometrics | null> {
    await delay(300);
    const patient = MOCK_PATIENTS.find((p) => p.id === patientId) as { biometrics?: PatientBiometrics } | undefined;
    return patient?.biometrics ?? null;
  },

  async savePatientBiometrics(patientId: string, input: PatientBiometrics): Promise<PatientBiometrics> {
    await delay(400);
    const saved = { ...input, recordedAt: todayLabel() };
    const patient = MOCK_PATIENTS.find((p) => p.id === patientId) as { biometrics?: PatientBiometrics } | undefined;
    if (patient) patient.biometrics = saved;
    return saved;
  },

  async getPreferredPharmacyFor(_patientId: string): Promise<PharmacyDirectoryEntry | null> {
    await delay(300);
    // Mirrors the live rule: only a directory pick is referable, free text isn't.
    return mockPharmacy?.pharmacyId
      ? MOCK_PHARMACY_DIRECTORY.find((p) => p.id === mockPharmacy!.pharmacyId) ?? null
      : null;
  },

  async referPrescription(prescriptionId: string, pharmacyId: string): Promise<Prescription> {
    await delay(500);
    const pharmacy = MOCK_PHARMACY_DIRECTORY.find((p) => p.id === pharmacyId);
    const rx = mockPrescriptions.find((p) => p.id === prescriptionId);
    if (!rx) throw new Error('Prescription not found');
    rx.pharmacyId = pharmacyId;
    rx.pharmacyName = pharmacy?.name;
    rx.fulfillmentStatus = 'sent';
    rx.fulfillmentNote = undefined;
    return rx;
  },

  async getPharmacyDirectory(): Promise<PharmacyDirectoryEntry[]> {
    await delay();
    return MOCK_PHARMACY_DIRECTORY;
  },

  async getGovIdStatus(): Promise<GovIdStatus> {
    await delay(300);
    return mockGovId;
  },

  async submitGovId(file: PickedFile): Promise<GovIdStatus> {
    await delay(500);
    mockGovId = { status: 'pending', fileName: file.name, url: file.uri };
    return mockGovId;
  },

  async getDocuments(category?: DocumentCategory): Promise<StoredDocument[]> {
    await delay();
    return mockDocuments
      .filter((d) => !category || d.category === category)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  /**
   * A treating provider's read of a patient's condition uploads (SOW 1.6).
   * Condition category only — the credential and identity files in the same
   * store are the patient's own business and never surface on a chart.
   */
  async getPatientConditionUploads(_patientId: string): Promise<StoredDocument[]> {
    await delay();
    return mockDocuments
      .filter((d) => d.category === 'condition')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async addDocument(input: {
    name: string;
    category: DocumentCategory;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    url: string | null;
    appointmentId?: string;
    description?: string;
  }): Promise<StoredDocument> {
    await delay(500);
    const now = new Date();
    const doc: StoredDocument = {
      id: `doc-${Date.now()}`,
      ...input,
      appointmentId: input.appointmentId ?? null,
      description: input.description?.trim() || null,
      uploadedAt: `${MONTH_ABBR[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`,
      createdAt: now.toISOString(),
    };
    mockDocuments.push(doc);
    return doc;
  },

  async removeDocument(id: string): Promise<void> {
    await delay(300);
    const i = mockDocuments.findIndex((d) => d.id === id);
    if (i >= 0) mockDocuments.splice(i, 1);
  },

  async getSettings(): Promise<UserSettings> {
    await delay(300);
    return { ...mockSettings };
  },

  async saveSettings(input: Partial<UserSettings>): Promise<UserSettings> {
    await delay(300);
    mockSettings = { ...mockSettings, ...input };
    return { ...mockSettings };
  },

  async getProviderState(): Promise<ProviderState> {
    await delay(300);
    // Mock doctors are always live, so the dashboard shows the real practice UI.
    return { state: 'live', doctorId: 'doc-1', providerType: 'Doctor', application: null };
  },

  async getPaymentStatus(id: string): Promise<PaymentStatus> {
    await delay(500);
    // No real checkout in mock mode, so a poll always reads as settled. No
    // appointment context here (only a payment id), so this falls back to
    // the same ₦15,000 / Video Visit default the rest of the mock uses.
    const breakdown = mockFeeBreakdown(undefined, 'Video Visit');
    return {
      id,
      provider: 'flutterwave',
      amount: breakdown.consultationFee + breakdown.serviceCharge + breakdown.vat - breakdown.discount,
      currency: 'NGN',
      checkoutRef: 'mock-checkout-ref',
      status: 'succeeded',
      appointmentStatus: 'upcoming',
      ...breakdown,
    };
  },

  /** GET /payments/preview/:appointmentId?code=X — the fee breakdown before checkout starts. */
  async getPaymentPreview(appointmentId: string, code?: string): Promise<PaymentPreview> {
    await delay(300);
    const appt = (MOCK_APPOINTMENTS as Appointment[]).find((a) => a.id === appointmentId);
    const draft = mockFeeBreakdown(appt?.fee, appt?.type);
    const { discount, status } = resolveMockPromo(code, draft.consultationFee + draft.serviceCharge);
    const breakdown = mockFeeBreakdown(appt?.fee, appt?.type, discount);
    return {
      ...breakdown,
      patientTotal: breakdown.consultationFee + breakdown.serviceCharge + breakdown.vat - breakdown.discount,
      promoStatus: status,
    };
  },

  async createPaymentIntent(input: { appointmentId: string; provider: string; code?: string }): Promise<PaymentIntent> {
    await delay(600);
    const appt = (MOCK_APPOINTMENTS as Appointment[]).find((a) => a.id === input.appointmentId);
    const draft = mockFeeBreakdown(appt?.fee, appt?.type);
    const { code, discount, status } = resolveMockPromo(input.code, draft.consultationFee + draft.serviceCharge);
    const breakdown = mockFeeBreakdown(appt?.fee, appt?.type, discount);
    // Only counted here, on a "settled" intent (mock mode has no separate
    // webhook step) — mirrors the backend only redeeming on confirmed payment.
    if (status === 'applied' && code) mockPromoRedemptionCount[code] = (mockPromoRedemptionCount[code] ?? 0) + 1;
    return {
      id: `pay_${Date.now()}`,
      provider: input.provider,
      amount: breakdown.consultationFee + breakdown.serviceCharge + breakdown.vat - breakdown.discount,
      currency: 'NGN',
      checkoutRef: 'mock-checkout-ref',
      status: 'pending',
      promoCode: status === 'applied' ? (code ?? undefined) : undefined,
      ...breakdown,
    };
  },

  /** GET /practice/appointments/:id/breakdown — a doctor's take-home detail for a paid visit. */
  async getAppointmentBreakdown(appointmentId: string): Promise<FeeBreakdown> {
    await delay(300);
    const appt =
      (MOCK_DOCTOR_SCHEDULE as Appointment[]).find((a) => a.id === appointmentId) ??
      (MOCK_APPOINTMENTS as Appointment[]).find((a) => a.id === appointmentId);
    return mockFeeBreakdown(appt?.fee, appt?.type);
  },

  /**
   * POST /calls/token. Mirrors the real route's contract: the caller names the
   * appointment and the ROOM COMES BACK from here — it is never chosen by the
   * client. The real route also rejects non-participants and unpaid/closed
   * visits; the mock has a single signed-in user so there's nobody to reject,
   * but the room derivation is kept identical so the shape can't drift.
   */
  async getCallToken(appointmentId: string): Promise<CallTokenGrant> {
    await delay(300);
    return {
      token: 'mock-stream-token',
      roomName: `visit-${appointmentId}`,
      identity: 'mock-user',
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      apiKey: 'mock-stream-key',
      callType: 'default',
      role: 'patient',
    };
  },

  /**
   * Conference invites (patient-feedback item 10).
   *
   * Mock mode has one signed-in user, so there is nobody on the other end to
   * knock or to admit. What it does model is the part the UI depends on: an
   * invite list that grows, an invite that can be withdrawn, and a knocking
   * guest that can be admitted — the seeded row below starts in 'knocking' so
   * the admit prompt is reachable in a demo without a second device.
   */
  async getCallInvites(appointmentId: string): Promise<CallInvite[]> {
    await delay(250);
    return mockCallInvites
      .filter((i) => i.appointmentId === appointmentId && i.status !== 'revoked')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getMyCallInvites(): Promise<MyCallInvite[]> {
    await delay(250);
    return [];
  },

  async createCallInvite(appointmentId: string, email: string): Promise<CallInvite> {
    await delay(500);
    if (!/.+@.+\..+/.test(email)) throw new Error('Enter a valid email address.');
    const existing = mockCallInvites.find((i) => i.appointmentId === appointmentId && i.inviteeName === email);
    if (existing) {
      existing.status = 'invited';
      return existing;
    }
    const invite: CallInvite = {
      id: `inv-${Date.now()}`,
      appointmentId,
      inviteeId: `guest-${Date.now()}`,
      inviteeName: email,
      invitedById: 'pat-1',
      invitedByName: 'You',
      status: 'invited',
      knockedAt: null,
      admittedAt: null,
      createdAt: new Date().toISOString(),
    };
    mockCallInvites.push(invite);
    return invite;
  },

  async admitCallInvite(id: string): Promise<CallInvite> {
    await delay(300);
    const invite = mockCallInvites.find((i) => i.id === id);
    if (!invite) throw new Error('Invite not found');
    invite.status = 'admitted';
    invite.admittedAt = new Date().toISOString();
    return invite;
  },

  async removeCallInvite(id: string): Promise<void> {
    await delay(300);
    const invite = mockCallInvites.find((i) => i.id === id);
    if (invite) invite.status = 'revoked';
  },

  async updateProfile(input: { firstName?: string; lastName?: string; phone?: string; spokenLanguages?: string[]; preferredCurrency?: string; twoFactorEnabled?: boolean }): Promise<User> {
    await delay(500);
    if (input.spokenLanguages !== undefined) mockSpokenLanguages = input.spokenLanguages;
    if (input.preferredCurrency) mockPreferredCurrency = input.preferredCurrency;
    if (input.twoFactorEnabled !== undefined) mockTwoFactorEnabled = input.twoFactorEnabled;
    return {
      id: 'pat-1',
      firstName: input.firstName ?? 'Martin',
      lastName: input.lastName ?? 'Doe',
      email: 'martin@ekotelehealth.com',
      accountType: 'Patient',
      spokenLanguages: mockSpokenLanguages,
      preferredCurrency: mockPreferredCurrency,
      twoFactorEnabled: mockTwoFactorEnabled,
    };
  },

  /** GET /currencies — active display currencies. */
  async getCurrencies(): Promise<Currency[]> {
    await delay(200);
    return [
      { code: 'NGN', symbol: '₦', ngnRate: 1 },
      { code: 'USD', symbol: '$', ngnRate: 1600 },
      { code: 'GBP', symbol: '£', ngnRate: 2000 },
      { code: 'EUR', symbol: '€', ngnRate: 1750 },
    ];
  },

  /** GET /content — every content block. */
  async getContentBlocks(): Promise<ContentBlock[]> {
    await delay(200);
    return MOCK_CONTENT_BLOCKS;
  },

  /** GET /content/:key — a single block. */
  async getContentBlock(key: string): Promise<ContentBlock> {
    await delay(200);
    const block = MOCK_CONTENT_BLOCKS.find((c) => c.key === key);
    if (!block) throw new Error('Content block not found');
    return block;
  },

  async getReviews(): Promise<Review[]> {
    await delay();
    return MOCK_REVIEWS;
  },

  /** Aggregate the mock reviews into the App Store-style summary. */
  async getReviewSummary(): Promise<ReviewSummary> {
    await delay(250);
    const distribution: [number, number, number, number, number] = [0, 0, 0, 0, 0];
    let sum = 0;
    for (const r of MOCK_REVIEWS) {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      distribution[star - 1] += 1;
      sum += r.rating;
    }
    const total = MOCK_REVIEWS.length;
    const average = total ? Math.round((sum / total) * 10) / 10 : 0;
    return { average, total, distribution };
  },

  async submitReview(input: {
    subject: string;
    communicationRating: number;
    experienceRating: number;
    speedyResponseRating: number;
    text: string;
    title?: string;
  }): Promise<Review> {
    await delay(600);
    // Overall score is derived, not picked separately — mirrors the live backend.
    const rating = Math.round((input.communicationRating + input.experienceRating + input.speedyResponseRating) / 3);
    return {
      id: `r-${Date.now()}`,
      author: 'You',
      rating,
      communicationRating: input.communicationRating,
      experienceRating: input.experienceRating,
      speedyResponseRating: input.speedyResponseRating,
      text: input.text,
      title: input.title,
      date: 'Today',
      verified: true,
      comments: 0,
    };
  },

  /** GET /complaints — the signed-in mock user's own filed reports. */
  async getComplaints(): Promise<Complaint[]> {
    await delay();
    return [...mockComplaints];
  },

  /** POST /complaints — file a report; goes to the admin queue as 'pending'. */
  async submitComplaint(input: ComplaintInput): Promise<Complaint> {
    await delay(600);
    const complaint: Complaint = {
      id: `c-${Date.now()}`,
      category: input.category,
      subject: input.subject,
      description: input.description,
      status: 'pending',
      submittedAt: 'Today',
    };
    mockComplaints = [complaint, ...mockComplaints];
    return complaint;
  },

  /** GET /complaints/:id/messages — the support thread, oldest first. */
  async getSupportMessages(complaintId: string): Promise<SupportMessage[]> {
    await delay();
    // Mirrors the server: opening the thread clears the filer's unread count.
    const complaint = mockComplaints.find((c) => c.id === complaintId);
    if (complaint) complaint.unread = 0;
    return mockSupportMessages
      .filter((m) => m.complaintId === complaintId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  /**
   * POST /complaints/:id/messages — reply to support. Reopens a resolved
   * report, same as the real route, and echoes a canned support acknowledgement
   * shortly after so the thread feels alive in demos.
   */
  async replyToSupport(complaintId: string, body: string): Promise<SupportMessage> {
    await delay(400);
    const message: SupportMessage = {
      id: `sm-${Date.now()}`,
      complaintId,
      authorRole: 'user',
      authorName: 'Martin Doe',
      body,
      createdAt: new Date().toISOString(),
    };
    mockSupportMessages.push(message);

    const complaint = mockComplaints.find((c) => c.id === complaintId);
    if (complaint) {
      complaint.status = 'pending';
      complaint.lastMessageAt = message.createdAt;
    }

    setTimeout(() => {
      mockSupportMessages.push({
        id: `sm-${Date.now()}-reply`,
        complaintId,
        authorRole: 'admin',
        authorName: 'Eko Admin',
        body: "Thanks — I've picked this up and will come back to you shortly.",
        createdAt: new Date().toISOString(),
      });
      if (complaint) complaint.unread = (complaint.unread ?? 0) + 1;
    }, 2500);

    return message;
  },

  async getChatToken(): Promise<ChatTokenGrant> {
    await delay(200);
    return {
      token: 'mock-stream-token',
      apiKey: 'mock-stream-key',
      identity: 'mock-user',
      userId: 'mock-user',
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    };
  },
};
