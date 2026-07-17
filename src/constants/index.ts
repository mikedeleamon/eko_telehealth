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

// Relationship options for adding a dependent (with "Other" fallback in the UI).
export const RELATIONSHIP_OPTIONS = ['Child', 'Spouse', 'Parent', 'Sibling', 'Grandparent', 'Ward'];

// Categories patients search providers by — used for the provider application.
export const PROVIDER_CATEGORY_OPTIONS = [
  'Primary Care', 'Eye Doctor', 'OBGYN', 'Cardiology', 'Dermatology',
  'Pediatrics', 'Dentistry', 'Mental Health', 'Physiotherapy',
];

// Common provider specialties (with "Other" fallback in the UI).
export const SPECIALTY_OPTIONS = [
  'General Practitioner', 'Cardiologist', 'Dermatologist', 'Ophthalmologist',
  'Obstetrician/Gynaecologist', 'Paediatrician', 'Dentist', 'Psychiatrist',
  'Physiotherapist', 'Internal Medicine', 'Endocrinologist', 'Neurologist',
];

// Common Nigerian HMOs / insurers (with "Other" fallback in the UI).
export const INSURANCE_PROVIDER_OPTIONS = [
  'AXA Mansard', 'Hygeia HMO', 'Reliance HMO', 'Avon HMO', 'Leadway Health',
  'Total Health Trust', 'NHIS', 'Blue Cross Blue Shield', 'Aetna', 'Cigna',
];

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
  {
    id: 'p1', name: 'Emeka Obi', age: 34, gender: 'Male', condition: 'Hypertension', lastVisit: 'Jun 20, 2026',
    reason: 'Follow-up for high blood pressure and medication review',
    symptoms: 'Occasional headaches, mild dizziness in the mornings',
    allergies: 'Penicillin',
    phone: '+234 803 111 2233', email: 'emeka.obi@example.com',
    biometrics: { bloodPressure: '148/95 mmHg', heartRate: '82 bpm', temperature: '36.7 °C', weight: '84 kg', height: '178 cm', bmi: '26.5', bloodType: 'O+' },
  },
  {
    id: 'p2', name: 'Yusuf Ibrahim', age: 28, gender: 'Male', condition: 'First Visit', lastVisit: 'New patient',
    reason: 'New patient consultation — persistent cough for two weeks',
    symptoms: 'Dry cough, sore throat, low-grade fever at night',
    allergies: 'None reported',
    phone: '+234 806 445 7788', email: 'yusuf.ibrahim@example.com',
    biometrics: { bloodPressure: '122/78 mmHg', heartRate: '76 bpm', temperature: '37.4 °C', weight: '71 kg', height: '175 cm', bmi: '23.2', bloodType: 'A+' },
  },
  {
    id: 'p3', name: 'Alex Stewart', age: 45, gender: 'Male', condition: 'Diabetes Type 2', lastVisit: 'Jun 12, 2026',
    reason: 'Quarterly diabetes management and HbA1c review',
    symptoms: 'Increased thirst, fatigue after meals',
    allergies: 'Sulfa drugs',
    phone: '+234 701 223 9090', email: 'alex.stewart@example.com',
    biometrics: { bloodPressure: '134/86 mmHg', heartRate: '88 bpm', temperature: '36.6 °C', weight: '92 kg', height: '181 cm', bmi: '28.1', bloodType: 'B+' },
  },
  {
    id: 'p4', name: 'Augustine Watts', age: 52, gender: 'Female', condition: 'Migraine', lastVisit: 'Jun 5, 2026',
    reason: 'Recurrent migraines — evaluating current treatment plan',
    symptoms: 'Throbbing headaches, light sensitivity, nausea',
    allergies: 'Aspirin',
    phone: '+234 809 556 3412', email: 'augustine.watts@example.com',
    biometrics: { bloodPressure: '128/82 mmHg', heartRate: '74 bpm', temperature: '36.8 °C', weight: '68 kg', height: '165 cm', bmi: '25.0', bloodType: 'AB+' },
  },
  {
    id: 'p5', name: 'Ngozi Nwosu', age: 31, gender: 'Female', condition: 'Pregnancy care', lastVisit: 'May 29, 2026',
    reason: 'Antenatal check-up — 24 weeks gestation',
    symptoms: 'Mild back pain, occasional swelling in ankles',
    allergies: 'None reported',
    phone: '+234 802 778 1265', email: 'ngozi.nwosu@example.com',
    biometrics: { bloodPressure: '118/76 mmHg', heartRate: '80 bpm', temperature: '36.9 °C', weight: '73 kg', height: '168 cm', bmi: '25.9', bloodType: 'O-' },
  },
  {
    id: 'p6', name: 'Tunde Bakare', age: 40, gender: 'Male', condition: 'Annual checkup', lastVisit: 'May 14, 2026',
    reason: 'Routine annual physical and preventive screening',
    symptoms: 'No active complaints',
    allergies: 'None reported',
    phone: '+234 805 990 4471', email: 'tunde.bakare@example.com',
    biometrics: { bloodPressure: '120/80 mmHg', heartRate: '70 bpm', temperature: '36.6 °C', weight: '78 kg', height: '176 cm', bmi: '25.2', bloodType: 'A-' },
  },
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
