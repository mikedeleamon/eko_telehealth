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
  MOCK_NOTIFICATIONS,
  MOCK_PATIENTS,
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
  DoctorAgendaItem,
  PatientSummary,
  PaymentIntent,
  PaymentStatus,
  ProviderState,
  Review,
  User,
  UserRole,
} from '../types';

const MOCK_REVIEWS: Review[] = [
  { id: 'r1', author: 'Jane D.', rating: 5, text: 'Excellent doctor! Very thorough and caring.', date: 'Nov 20, 2025' },
  { id: 'r2', author: 'Mark S.', rating: 4, text: 'Great experience overall. Short wait time.', date: 'Nov 15, 2025' },
  { id: 'r3', author: 'Alice M.', rating: 5, text: 'Highly recommend! Very knowledgeable and professional.', date: 'Oct 30, 2025' },
];

/** Simulated network latency so loading states are visible during development. */
const delay = (ms = 450) => new Promise<void>((resolve) => setTimeout(resolve, ms));

let appointmentSeq = 100;

export const mockApi = {
  async login(email: string, _password: string, role: UserRole): Promise<AuthSession> {
    await delay(700);
    const isDoctor = role === 'Doctor';
    return {
      user: {
        id: isDoctor ? 'doc-1' : 'pat-1',
        firstName: isDoctor ? 'Sarah' : 'Martin',
        lastName: isDoctor ? 'Johnson' : 'Doe',
        email: email || (isDoctor ? 'dr.johnson@ekotelehealth.com' : 'martin@ekotelehealth.com'),
        role,
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };
  },

  async signup(input: {
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    /** Accepted to match the live contract; the mock user model has no phone. */
    phone?: string;
  }): Promise<AuthSession> {
    await delay(700);
    const { phone: _phone, ...user } = input;
    return {
      user: { id: 'new-1', ...user },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };
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
      role: 'Patient',
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
