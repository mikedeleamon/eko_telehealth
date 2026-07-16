/**
 * Domain models shared by every API module. These mirror the contracts the
 * backend must implement — the web and admin clients should use the same
 * shapes (see the integration guide PDF for the full endpoint list).
 */

export type UserRole = 'Patient' | 'Doctor';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
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

export type AppointmentStatus = 'upcoming' | 'past' | 'cancelled';

export interface Appointment {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  type: VisitType;
  status: AppointmentStatus;
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

export interface PatientSummary {
  id: string;
  name: string;
  age: number;
  gender: string;
  condition: string;
  lastVisit: string;
}

export interface DoctorAgendaItem {
  id: string;
  name: string;
  type: string;
  time: string;
  status: 'confirmed' | 'cancelled' | 'rescheduled' | 'pending';
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
