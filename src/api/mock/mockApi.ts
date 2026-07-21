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
  CallTokenGrant,
  ChatMessage,
  ChatTokenGrant,
  Complaint,
  ComplaintInput,
  Conversation,
  CreateAppointmentInput,
  Doctor,
  AppointmentStatus,
  Dependent,
  DoctorAgendaItem,
  DoctorEarnings,
  EarningItem,
  Insurance,
  MedicalNote,
  MedicalNoteInput,
  NoteAmendment,
  PatientSummary,
  PaymentMethod,
  Prescription,
  PrescriptionInput,
  FeeBreakdown,
  PaymentIntent,
  PaymentPreview,
  PaymentReceipt,
  PaymentStatus,
  PromoStatus,
  Pharmacy,
  ProviderState,
  Review,
  ReviewSummary,
  StoredDocument,
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
/** The signed-in mock user's own spoken languages (task 2.5), editable via updateProfile. */
let mockSpokenLanguages: string[] = ['English'];
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
const mockDocuments: StoredDocument[] = [
  { id: 'doc-seed-1', name: 'MDCN Practising License 2026', category: 'license', fileName: 'mdcn-license-2026.pdf', mimeType: 'application/pdf', sizeBytes: 482_000, url: null, uploadedAt: 'Jan 12, 2026', createdAt: '2026-01-12T09:00:00.000Z' },
  { id: 'doc-seed-2', name: 'Board Certification — Internal Medicine', category: 'certification', fileName: 'board-cert.pdf', mimeType: 'application/pdf', sizeBytes: 1_204_000, url: null, uploadedAt: 'Nov 3, 2025', createdAt: '2025-11-03T09:00:00.000Z' },
];
const mockMedicalNotes: MedicalNote[] = [...(MOCK_MEDICAL_NOTES as MedicalNote[])];
// Lab results, seeded for the signed-in patient (pat-1) and a doctor's roster
// patient (p4 / Augustine) so both surfaces show data in mock mode.
const mockLabs: LabResult[] = [
  { id: 'lab-1', patientId: 'pat-1', testName: 'Fasting Blood Glucose', loincCode: '1558-6', specimen: 'Serum', value: '5.2', unit: 'mmol/L', referenceRange: '3.9–5.5', flag: 'normal', status: 'resulted', orderedBy: 'Dr. Amara Okafor', performingLab: 'Lagoon Clinical Labs', collectedDate: 'Jul 8, 2026', resultedDate: 'Jul 9, 2026', notes: 'Within normal limits.', attachmentUrl: null, createdAt: '2026-07-09T09:00:00Z' },
  { id: 'lab-2', patientId: 'pat-1', testName: 'Total Cholesterol', loincCode: '2093-3', specimen: 'Serum', value: '6.1', unit: 'mmol/L', referenceRange: '< 5.2', flag: 'high', status: 'resulted', orderedBy: 'Dr. Amara Okafor', performingLab: 'Lagoon Clinical Labs', collectedDate: 'Jul 8, 2026', resultedDate: 'Jul 9, 2026', notes: 'Borderline high — advise dietary review.', attachmentUrl: null, createdAt: '2026-07-09T09:05:00Z' },
  { id: 'lab-3', patientId: 'pat-1', testName: 'Haemoglobin (CBC)', loincCode: '718-7', specimen: 'Whole blood', value: '13.8', unit: 'g/dL', referenceRange: '13.0–17.0', flag: 'normal', status: 'resulted', orderedBy: 'Dr. Amara Okafor', performingLab: 'Lagoon Clinical Labs', collectedDate: 'Mar 2, 2026', resultedDate: 'Mar 3, 2026', attachmentUrl: null, createdAt: '2026-03-03T09:00:00Z' },
  { id: 'lab-4', patientId: 'p4', testName: 'Thyroid Stimulating Hormone', loincCode: '3016-3', specimen: 'Serum', value: '0.2', unit: 'mIU/L', referenceRange: '0.4–4.0', flag: 'low', status: 'resulted', orderedBy: 'Dr. Sarah Johnson', performingLab: 'St. Nicholas Lab', collectedDate: 'Jun 4, 2026', resultedDate: 'Jun 5, 2026', notes: 'Suppressed TSH — check free T4.', attachmentUrl: null, createdAt: '2026-06-05T10:00:00Z' },
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
let mockPaymentMethod: PaymentMethod | null = null;
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
  { id: 'r1', author: 'Jane D.', rating: 5, title: 'So many words, so little time', text: 'Excellent doctor! Very thorough and caring. Took the time to answer every one of my questions and never made me feel rushed. The follow-up notes were detailed and easy to understand.', date: 'Apr 16, 2026', verified: true, comments: 100 },
  { id: 'r2', author: 'Mark S.', rating: 5, title: 'Excellent work', text: 'Great experience overall. Short wait time and the video call was crystal clear. Prescriptions were sent to my pharmacy within the hour — the whole thing was seamless.', date: 'Jan 28, 2026', verified: true, comments: 10 },
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
 * Derive the wallet totals from the ledger so balance/pending/month stay
 * consistent as withdrawals are added. Balance = settled earnings minus every
 * withdrawal (pending ones are money already on its way out).
 */
function summarizeEarnings(): DoctorEarnings {
  let balance = 0;
  let pending = 0;
  let thisMonth = 0;
  for (const item of mockEarnings) {
    if (item.kind === 'earning') {
      if (item.status === 'settled') {
        balance += item.amount;
        thisMonth += item.amount;
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

export const mockApi = {
  async login(email: string, _password: string): Promise<AuthSession> {
    await delay(700);
    const normalized = email.trim().toLowerCase();
    // Look the account up by email; unknown emails default to a patient account.
    const account = MOCK_ACCOUNTS[normalized] ?? {
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
        email: normalized || 'martin@ekotelehealth.com',
        accountType: account.accountType,
        spokenLanguages: mockSpokenLanguages,
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };
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
    return {
      id: String(++appointmentSeq),
      doctor: doctor?.name ?? 'Doctor',
      specialty: doctor?.category ?? 'Consultation',
      date: input.date,
      time: input.time,
      type: input.type,
      status: 'upcoming',
    };
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
      createdAt: now.toISOString(),
    };
    mockPrescriptions.push(prescription);
    return prescription;
  },

  /** The signed-in mock patient (pat-1)'s own medication record. */
  async getMyPrescriptions(): Promise<Prescription[]> {
    await delay();
    return mockPrescriptions
      .filter((p) => p.patientId === 'pat-1')
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
    return mockLabs
      .filter((l) => l.patientId === pid)
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

  async getPaymentMethod(): Promise<PaymentMethod | null> {
    await delay(300);
    return mockPaymentMethod;
  },

  async savePaymentMethod(input: PaymentMethod): Promise<PaymentMethod> {
    await delay(500);
    mockPaymentMethod = input;
    return input;
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

  async savePharmacy(input: Pharmacy): Promise<Pharmacy> {
    await delay(500);
    mockPharmacy = input;
    return input;
  },

  async getDocuments(): Promise<StoredDocument[]> {
    await delay();
    return [...mockDocuments].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async addDocument(input: {
    name: string;
    category: DocumentCategory;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    url: string | null;
  }): Promise<StoredDocument> {
    await delay(500);
    const now = new Date();
    const doc: StoredDocument = {
      id: `doc-${Date.now()}`,
      ...input,
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
    return { state: 'live', doctorId: 'doc-1', application: null };
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

  async getCallToken(roomName: string): Promise<CallTokenGrant> {
    await delay(300);
    return {
      token: 'mock-stream-token',
      roomName,
      identity: 'mock-user',
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      apiKey: 'mock-stream-key',
      callType: 'default',
    };
  },

  async updateProfile(input: { firstName?: string; lastName?: string; phone?: string; spokenLanguages?: string[] }): Promise<User> {
    await delay(500);
    if (input.spokenLanguages !== undefined) mockSpokenLanguages = input.spokenLanguages;
    return {
      id: 'pat-1',
      firstName: input.firstName ?? 'Martin',
      lastName: input.lastName ?? 'Doe',
      email: 'martin@ekotelehealth.com',
      accountType: 'Patient',
      spokenLanguages: mockSpokenLanguages,
    };
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

  async submitReview(input: { subject: string; rating: number; text: string; title?: string }): Promise<Review> {
    await delay(600);
    return { id: `r-${Date.now()}`, author: 'You', rating: input.rating, text: input.text, title: input.title, date: 'Today', verified: true, comments: 0 };
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
