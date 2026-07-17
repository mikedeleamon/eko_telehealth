export const APP_NAME = 'Eko Telehealth';

export const TUTORIAL_DATA = [
  {
    id: '1',
    title: 'Care, delivered to where you are',
    subtitle: 'Find verified doctors and specialists near you, in other states, and abroad — all in one trusted place.',
    color: '#E8F4FD',
  },
  {
    id: '2',
    title: 'Every kind of visit, your choice',
    subtitle: 'Video visit, clinic visit, home visit — book the type of care that works best for you.',
    color: '#FDE8EC',
  },
  {
    id: '3',
    title: 'Care for the people you love, from anywhere',
    subtitle: "Book appointments for yourself, a dependent or a parent — and stay on top of their care even from the diaspora.",
    color: '#FFFDE7',
  },
];

export const GENDER_OPTIONS = ['Male', 'Female', 'Others'];

export const DOCTOR_CATEGORIES = ['Primary Care', 'Eye Doctor', 'OBGYN'];

export const SPECIALTY_CHIPS = [
  { label: 'Primary Care', count: 10, color: '#F97653' },
  { label: 'Eye Doctor', count: 8, color: '#6C5CE7' },
  { label: 'OBGYN', count: 5, color: '#00CAAE' },
  { label: 'Cardiology', count: 3, color: '#3B82F6' },
  { label: 'Dermatology', count: 7, color: '#F5A623' },
];

export const APPOINTMENT_TYPES = [
  { label: 'Video Visit', icon: 'video-camera' },
  { label: 'Clinic Visit', icon: 'hospital-o' },
  { label: 'Home Visit', icon: 'home' },
];

export const MOCK_DOCTORS = [
  {
    id: '1',
    name: 'Dr. Amara Okafor MD',
    specialty: 'Therapist, Primary care doctor',
    category: 'Primary Care',
    rating: 4.9,
    reviews: 79,
    location: 'Victoria Island, Lagos',
    fee: '₦15,000',
    available: true,
    nextAvailable: '29, June',
    avatar: null,
  },
  {
    id: '2',
    name: 'Dr. Chinedu Eze MD',
    specialty: 'Eye Specialist, Eye Doctor',
    category: 'Eye Doctor',
    rating: 4.9,
    reviews: 79,
    location: 'Ikeja, Lagos',
    fee: '₦22,000',
    available: true,
    nextAvailable: '29, June',
    avatar: null,
  },
  {
    id: '3',
    name: 'Dr. Funmilayo Adeyemi',
    specialty: 'OBGYN Specialist',
    category: 'OBGYN',
    rating: 4.7,
    reviews: 213,
    location: 'Garki, Abuja',
    fee: '₦28,000',
    available: false,
    nextAvailable: '2, July',
    avatar: null,
  },
  {
    id: '4',
    name: 'Dr. James Whitfield MD',
    specialty: 'Cardiologist, Internal Medicine',
    category: 'Cardiology',
    rating: 4.6,
    reviews: 87,
    location: 'London, UK · Remote',
    fee: '₦38,000',
    available: true,
    nextAvailable: '30, June',
    avatar: null,
  },
  {
    id: '5',
    name: 'Dr. Aisha Bello MD',
    specialty: 'Dermatologist',
    category: 'Dermatology',
    rating: 4.9,
    reviews: 301,
    location: 'Port Harcourt, Rivers',
    fee: '₦20,000',
    available: true,
    nextAvailable: '1, July',
    avatar: null,
  },
];

export const MOCK_APPOINTMENTS = [
  {
    id: '1',
    doctor: 'Dr. Amara Okafor MD',
    specialty: 'Primary Care',
    date: 'Mon, Jun 29, 2026',
    time: '10:00 AM',
    type: 'Video Visit',
    status: 'upcoming',
  },
  {
    id: '2',
    doctor: 'Dr. Chinedu Eze MD',
    specialty: 'Eye Doctor',
    date: 'Wed, Jul 2, 2026',
    time: '2:30 PM',
    type: 'Clinic Visit',
    status: 'upcoming',
  },
  {
    id: '3',
    doctor: 'Dr. Funmilayo Adeyemi',
    specialty: 'OBGYN',
    date: 'May 15, 2026',
    time: '11:00 AM',
    type: 'Video Visit',
    status: 'past',
  },
  {
    id: '4',
    doctor: 'Dr. James Whitfield MD',
    specialty: 'Cardiology',
    date: 'Apr 28, 2026',
    time: '3:00 PM',
    type: 'Clinic Visit',
    status: 'past',
  },
];

export const MOCK_CONVERSATIONS = [
  { id: 'c1', doctorId: '1', lastMessage: "Thank you, I'll review your information shortly.", time: '2:03 PM', unread: 2 },
  { id: 'c2', doctorId: '2', lastMessage: 'Your prescription is ready for pickup.', time: 'Yesterday', unread: 0 },
  { id: 'c3', doctorId: '4', lastMessage: 'Let me know if the symptoms persist.', time: 'Mon', unread: 0 },
  { id: 'c4', doctorId: '5', lastMessage: 'See you at your next appointment!', time: 'Jun 14', unread: 1 },
];

export const MOCK_NOTIFICATIONS = [
  { id: '1', title: 'Appointment Reminder', body: 'Your appointment with Dr. Amara Okafor is tomorrow at 10:00 AM.', time: '2h ago' },
  { id: '2', title: 'Appointment Confirmed', body: 'Dr. Chinedu Eze confirmed your Jul 2 appointment.', time: '1d ago' },
  { id: '3', title: 'New Message', body: 'You have a new message from Dr. Funmilayo Adeyemi.', time: '2d ago' },
  { id: '4', title: 'Payment Successful', body: 'Your payment of ₦15,000 for the video visit has been processed.', time: '3d ago' },
];

// ---- Doctor-side mock data ----

// status drives the colored dot + soft row tint in the dashboard agenda
export const MOCK_DOCTOR_APPOINTMENTS = [
  { id: 'd1', name: 'Emeka Obi', type: 'Consultation', time: '12:30 pm', status: 'confirmed' },
  { id: 'd2', name: 'Yusuf Ibrahim', type: 'First Visit', time: '11:30 am', status: 'cancelled' },
  { id: 'd3', name: 'Bisi Alade', type: 'Consultation', time: '12:30 pm', status: 'rescheduled' },
  { id: 'd4', name: 'Augustine Watts', type: 'Consultation', time: '10:30 am', status: 'pending' },
  { id: 'd5', name: 'Emeka Obi', type: 'Consultation', time: '12:30 pm', status: 'confirmed' },
];

// Mock source for GET /practice/appointments — same shape as MOCK_APPOINTMENTS,
// but `doctor` holds the patient's name and `specialty` the visit reason.
// Includes pending requests so the Accept/Decline actions have real targets.
export const MOCK_DOCTOR_SCHEDULE = [
  { id: 's1', doctor: 'Emeka Obi', specialty: 'Consultation', date: 'Fri, Jul 24, 2026', time: '12:30 PM', type: 'Video Visit', status: 'pending_approval', fee: '₦15,000' },
  { id: 's2', doctor: 'Yusuf Ibrahim', specialty: 'First Visit', date: 'Fri, Jul 24, 2026', time: '11:30 AM', type: 'Clinic Visit', status: 'pending_approval', fee: '₦15,000' },
  { id: 's3', doctor: 'Bisi Alade', specialty: 'Consultation', date: 'Thu, Jul 23, 2026', time: '12:30 PM', type: 'Video Visit', status: 'pending_payment', fee: '₦15,000' },
  { id: 's4', doctor: 'Ngozi Nwosu', specialty: 'Follow-up', date: 'Tue, Jun 30, 2026', time: '3:00 PM', type: 'Video Visit', status: 'upcoming', fee: '₦15,000' },
  { id: 's5', doctor: 'Augustine Watts', specialty: 'Consultation', date: 'Jun 10, 2026', time: '10:30 AM', type: 'Clinic Visit', status: 'past', fee: '₦15,000' },
];

export const MOCK_PATIENTS = [
  { id: 'p1', name: 'Emeka Obi', age: 34, gender: 'Male', condition: 'Hypertension', lastVisit: 'Jun 20, 2026' },
  { id: 'p2', name: 'Yusuf Ibrahim', age: 28, gender: 'Male', condition: 'First Visit', lastVisit: 'New patient' },
  { id: 'p3', name: 'Alex Stewart', age: 45, gender: 'Male', condition: 'Diabetes Type 2', lastVisit: 'Jun 12, 2026' },
  { id: 'p4', name: 'Augustine Watts', age: 52, gender: 'Female', condition: 'Migraine', lastVisit: 'Jun 5, 2026' },
  { id: 'p5', name: 'Ngozi Nwosu', age: 31, gender: 'Female', condition: 'Pregnancy care', lastVisit: 'May 29, 2026' },
  { id: 'p6', name: 'Tunde Bakare', age: 40, gender: 'Male', condition: 'Annual checkup', lastVisit: 'May 14, 2026' },
];

export const TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
];

export const MY_CHART_ITEMS = [
  { id: '1', label: 'Appointments', icon: 'calendar' },
  { id: '2', label: 'Health Summary', icon: 'heartbeat' },
  { id: '3', label: 'Medications', icon: 'medkit' },
  { id: '4', label: 'Messages', icon: 'envelope' },
  { id: '5', label: 'Find Care', icon: 'search' },
  { id: '6', label: 'Billing', icon: 'credit-card' },
  { id: '7', label: 'Test Results', icon: 'flask' },
  { id: '8', label: 'Todo', icon: 'check-square-o' },
];
