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
  PaymentIntent,
  PaymentStatus,
  Pharmacy,
  ProviderState,
  Review,
  User,
  UserRole,
  UserSettings,
} from '../types';

/**
 * Mock mode keeps per-user records in memory so the screens behave like the
 * real thing within a session (they reset on reload — there's no backend).
 */
const mockDependents: Dependent[] = [
  { id: 'dep-1', firstName: 'Chidi', lastName: 'Doe', dob: '12-04-2015', relationship: 'Son' },
];
let mockInsurance: Insurance | null = null;
let mockPharmacy: Pharmacy | null = null;
const mockMedicalNotes: MedicalNote[] = [...(MOCK_MEDICAL_NOTES as MedicalNote[])];
const mockPrescriptions: Prescription[] = [...(MOCK_PRESCRIPTIONS as Prescription[])];
const mockEarnings: EarningItem[] = [...(MOCK_EARNINGS as EarningItem[])];
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
  { id: 'r1', author: 'Jane D.', rating: 5, text: 'Excellent doctor! Very thorough and caring.', date: 'Nov 20, 2025' },
  { id: 'r2', author: 'Mark S.', rating: 4, text: 'Great experience overall. Short wait time.', date: 'Nov 15, 2025' },
  { id: 'r3', author: 'Alice M.', rating: 5, text: 'Highly recommend! Very knowledgeable and professional.', date: 'Oct 30, 2025' },
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
    // No real checkout in mock mode, so a poll always reads as settled.
    return {
      id,
      provider: 'flutterwave',
      amount: 15000,
      currency: 'NGN',
      checkoutRef: 'mock-checkout-ref',
      status: 'succeeded',
      appointmentStatus: 'upcoming',
    };
  },

  async createPaymentIntent(input: { appointmentId: string; provider: string }): Promise<PaymentIntent> {
    await delay(600);
    return {
      id: `pay_${Date.now()}`,
      provider: input.provider,
      amount: 15000,
      currency: 'NGN',
      checkoutRef: 'mock-checkout-ref',
      status: 'pending',
    };
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

  async updateProfile(input: { firstName?: string; lastName?: string; phone?: string }): Promise<User> {
    await delay(500);
    return {
      id: 'pat-1',
      firstName: input.firstName ?? 'Martin',
      lastName: input.lastName ?? 'Doe',
      email: 'martin@ekotelehealth.com',
      accountType: 'Patient',
    };
  },

  async getReviews(): Promise<Review[]> {
    await delay();
    return MOCK_REVIEWS;
  },

  async submitReview(input: { subject: string; rating: number; text: string }): Promise<Review> {
    await delay(600);
    return { id: `r-${Date.now()}`, author: 'You', rating: input.rating, text: input.text, date: 'Today' };
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
