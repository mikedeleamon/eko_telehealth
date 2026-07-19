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
  { id: 's1', doctor: 'Emeka Obi', patientId: 'p1', specialty: 'Consultation', date: 'Fri, Jul 24, 2026', time: '12:30 PM', type: 'Video Visit', status: 'pending_approval', fee: '₦15,000' },
  { id: 's2', doctor: 'Yusuf Ibrahim', patientId: 'p2', specialty: 'First Visit', date: 'Fri, Jul 24, 2026', time: '11:30 AM', type: 'Clinic Visit', status: 'pending_approval', fee: '₦15,000' },
  // Bisi has no MOCK_PATIENTS record, so her entry stays unmatched (no patientId).
  { id: 's3', doctor: 'Bisi Alade', specialty: 'Consultation', date: 'Thu, Jul 23, 2026', time: '12:30 PM', type: 'Video Visit', status: 'pending_payment', fee: '₦15,000' },
  { id: 's4', doctor: 'Ngozi Nwosu', patientId: 'p5', specialty: 'Follow-up', date: 'Tue, Jun 30, 2026', time: '3:00 PM', type: 'Video Visit', status: 'upcoming', fee: '₦15,000' },
  { id: 's5', doctor: 'Augustine Watts', patientId: 'p4', specialty: 'Consultation', date: 'Jun 10, 2026', time: '10:30 AM', type: 'Clinic Visit', status: 'past', fee: '₦15,000' },
  // Past visits (dates align with each patient's lastVisit) so every patient
  // has at least one appointment a SOAP note can link to.
  { id: 's6', doctor: 'Emeka Obi', patientId: 'p1', specialty: 'Follow-up', date: 'Sat, Jun 20, 2026', time: '9:30 AM', type: 'Video Visit', status: 'past', fee: '₦15,000' },
  { id: 's7', doctor: 'Yusuf Ibrahim', patientId: 'p2', specialty: 'First Visit', date: 'Mon, Jul 20, 2026', time: '10:00 AM', type: 'Clinic Visit', status: 'upcoming', fee: '₦15,000' },
  { id: 's8', doctor: 'Alex Stewart', patientId: 'p3', specialty: 'Consultation', date: 'Fri, Jun 12, 2026', time: '2:00 PM', type: 'Video Visit', status: 'past', fee: '₦15,000' },
  { id: 's9', doctor: 'Ngozi Nwosu', patientId: 'p5', specialty: 'Antenatal Visit', date: 'Fri, May 29, 2026', time: '11:00 AM', type: 'Clinic Visit', status: 'past', fee: '₦15,000' },
  { id: 's10', doctor: 'Tunde Bakare', patientId: 'p6', specialty: 'Annual Physical', date: 'Thu, May 14, 2026', time: '3:30 PM', type: 'Clinic Visit', status: 'past', fee: '₦15,000' },
];

// Seed SOAP visit notes. Authors mix the logged-in mock doctor (doc-1, whose
// notes are editable) with other providers (read-only) so both permission
// states are demoable — Augustine Watts (p4) has one of each.
export const MOCK_MEDICAL_NOTES = [
  {
    id: 'note-1', patientId: 'p4', appointmentId: 's5', date: 'Jun 10, 2026', visitType: 'Clinic Visit',
    doctorId: 'doc-1', doctorName: 'Dr. Sarah Johnson', doctorSpecialty: 'Primary Care',
    reason: 'Recurrent migraines — treatment plan review',
    subjective: 'Reports 3 migraine episodes in the past two weeks, each lasting 4-6 hours. Photophobia and nausea present. Triptan provides partial relief. Sleep has been irregular.',
    objective: 'BP 128/82, HR 74. Neurological exam unremarkable. No papilloedema. Neck supple, no focal deficits.',
    assessment: 'Chronic migraine without aura, suboptimally controlled on current abortive-only regimen.',
    plan: 'Start propranolol 40mg BID as prophylaxis. Maintain headache diary. Review in 6 weeks; consider neurology referral if frequency does not improve.',
    createdAt: '2026-06-10T15:10:00Z',
  },
  {
    id: 'note-2', patientId: 'p4', appointmentId: 'ext-901', date: 'Apr 3, 2026', visitType: 'Video Visit',
    doctorId: '4', doctorName: 'Dr. James Whitfield MD', doctorSpecialty: 'Cardiologist, Internal Medicine',
    reason: 'Palpitations during migraine episodes',
    subjective: 'Describes fluttering sensation in chest accompanying severe headaches. No syncope, no exertional chest pain.',
    objective: 'BP 130/84, HR 78 regular. ECG normal sinus rhythm. No murmurs.',
    assessment: 'Palpitations likely catecholamine-mediated during pain episodes. No structural cardiac concern.',
    plan: 'Reassurance. 24-hour Holter if symptoms persist. Follow up with primary care for migraine control.',
    createdAt: '2026-04-03T11:40:00Z',
  },
  {
    id: 'note-3', patientId: 'p1', appointmentId: 's6', date: 'Sat, Jun 20, 2026', visitType: 'Video Visit',
    doctorId: '1', doctorName: 'Dr. Amara Okafor MD', doctorSpecialty: 'Therapist, Primary care doctor',
    reason: 'Hypertension follow-up and medication review',
    subjective: 'Occasional morning headaches. Adherent to amlodipine. Diet high in salt during recent travel.',
    objective: 'Home BP log averages 146/93. Weight stable at 84kg.',
    assessment: 'Stage 1 hypertension, above target on monotherapy.',
    plan: 'Add lisinopril 10mg daily. Reinforce low-sodium diet. Recheck BP in 4 weeks.',
    createdAt: '2026-06-20T10:05:00Z',
  },
  {
    id: 'note-4', patientId: 'p3', appointmentId: 's8', date: 'Fri, Jun 12, 2026', visitType: 'Video Visit',
    doctorId: '1', doctorName: 'Dr. Amara Okafor MD', doctorSpecialty: 'Therapist, Primary care doctor',
    reason: 'Quarterly diabetes management review',
    subjective: 'Increased thirst and post-prandial fatigue. Metformin tolerated well. Walking 30 minutes most days.',
    objective: 'HbA1c 7.9% (up from 7.4%). Fasting glucose 152 mg/dL. BMI 28.1.',
    assessment: 'Type 2 diabetes with worsening glycaemic control.',
    plan: 'Add empagliflozin 10mg daily. Refer to dietitian. Repeat HbA1c in 3 months.',
    createdAt: '2026-06-12T14:45:00Z',
  },
  {
    id: 'note-5', patientId: 'p5', appointmentId: 's9', date: 'Fri, May 29, 2026', visitType: 'Clinic Visit',
    doctorId: '3', doctorName: 'Dr. Funmilayo Adeyemi', doctorSpecialty: 'OBGYN Specialist',
    reason: 'Antenatal check-up — 20 weeks gestation',
    subjective: 'Feeling well. Mild lower back discomfort after long periods standing. Foetal movements felt daily.',
    objective: 'BP 116/74. Fundal height consistent with dates. Foetal heart rate 148 bpm. Anomaly scan normal.',
    assessment: 'Uncomplicated pregnancy at 20 weeks.',
    plan: 'Continue folic acid and iron. Routine bloods at 28 weeks. Next visit in 4 weeks.',
    createdAt: '2026-05-29T12:20:00Z',
  },
];

/**
 * Prescriptions per patient. 'active' rows are current medications; 'completed'
 * and 'discontinued' are the historical trail. Doctor identity mirrors the
 * shared record model (any treating doctor's scripts appear here).
 */
export const MOCK_PRESCRIPTIONS = [
  // Emeka (p1) — hypertension
  {
    id: 'rx-1', patientId: 'p1', drug: 'Amlodipine', strength: '10 mg', form: 'Tablet', route: 'Oral',
    frequency: 'Once daily', duration: 'Ongoing', quantity: '30', refills: '3',
    instructions: 'Take one tablet in the morning with water.',
    status: 'active', doctorId: 'doc-1', doctorName: 'Dr. Sarah Johnson',
    datePrescribed: 'Jun 20, 2026', createdAt: '2026-06-20T10:10:00Z',
  },
  {
    id: 'rx-2', patientId: 'p1', drug: 'Lisinopril', strength: '10 mg', form: 'Tablet', route: 'Oral',
    frequency: 'Once daily', duration: 'Ongoing', quantity: '30', refills: '3',
    instructions: 'Take one tablet daily. Monitor blood pressure.',
    status: 'active', doctorId: 'doc-1', doctorName: 'Dr. Sarah Johnson',
    datePrescribed: 'Jun 20, 2026', createdAt: '2026-06-20T10:12:00Z',
  },
  {
    id: 'rx-3', patientId: 'p1', drug: 'Hydrochlorothiazide', strength: '25 mg', form: 'Tablet', route: 'Oral',
    frequency: 'Once daily', duration: '90 days', quantity: '90', refills: '0',
    instructions: 'Discontinued — switched to amlodipine due to ankle oedema.',
    status: 'discontinued', doctorId: 'doc-1', doctorName: 'Dr. Sarah Johnson',
    datePrescribed: 'Feb 14, 2026', createdAt: '2026-02-14T09:30:00Z',
  },
  // Augustine (p4) — migraine
  {
    id: 'rx-4', patientId: 'p4', drug: 'Propranolol', strength: '40 mg', form: 'Tablet', route: 'Oral',
    frequency: 'Twice daily', duration: 'Ongoing', quantity: '60', refills: '2',
    instructions: 'Migraine prophylaxis. Do not stop abruptly.',
    status: 'active', doctorId: 'doc-1', doctorName: 'Dr. Sarah Johnson',
    datePrescribed: 'Jun 10, 2026', createdAt: '2026-06-10T15:15:00Z',
  },
  {
    id: 'rx-5', patientId: 'p4', drug: 'Sumatriptan', strength: '50 mg', form: 'Tablet', route: 'Oral',
    frequency: 'As needed', duration: 'PRN', quantity: '9', refills: '1',
    instructions: 'Take at onset of migraine. Max 2 tablets in 24 hours.',
    status: 'active', doctorId: 'doc-1', doctorName: 'Dr. Sarah Johnson',
    datePrescribed: 'Apr 3, 2026', createdAt: '2026-04-03T11:45:00Z',
  },
  {
    id: 'rx-6', patientId: 'p4', drug: 'Amitriptyline', strength: '10 mg', form: 'Tablet', route: 'Oral',
    frequency: 'At night', duration: '30 days', quantity: '30', refills: '0',
    instructions: 'Completed trial — limited benefit, prophylaxis switched to propranolol.',
    status: 'completed', doctorId: 'doc-1', doctorName: 'Dr. Sarah Johnson',
    datePrescribed: 'Jan 8, 2026', createdAt: '2026-01-08T13:20:00Z',
  },
  // Alex (p3) — diabetes
  {
    id: 'rx-7', patientId: 'p3', drug: 'Metformin', strength: '1000 mg', form: 'Tablet', route: 'Oral',
    frequency: 'Twice daily', duration: 'Ongoing', quantity: '60', refills: '5',
    instructions: 'Take with breakfast and dinner to reduce GI upset.',
    status: 'active', doctorId: 'doc-1', doctorName: 'Dr. Sarah Johnson',
    datePrescribed: 'Jun 12, 2026', createdAt: '2026-06-12T14:50:00Z',
  },
  {
    id: 'rx-8', patientId: 'p3', drug: 'Empagliflozin', strength: '10 mg', form: 'Tablet', route: 'Oral',
    frequency: 'Once daily', duration: 'Ongoing', quantity: '30', refills: '3',
    instructions: 'Take in the morning. Stay well hydrated.',
    status: 'active', doctorId: 'doc-1', doctorName: 'Dr. Sarah Johnson',
    datePrescribed: 'Jun 12, 2026', createdAt: '2026-06-12T14:52:00Z',
  },
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

/**
 * Doctor earnings ledger. Earning amounts are take-home (consultation fee minus
 * the 25% taxes & fees shown on AppointmentDetails, e.g. ₦15,000 fee → ₦11,250).
 * The mock derives the balance / month / pending totals from these rows.
 */
export const MOCK_EARNINGS = [
  { id: 'ern-1', kind: 'earning', title: 'Emeka Obi', date: 'Jul 18, 2026', time: '10:00 AM', amount: 11250, status: 'settled' },
  { id: 'ern-2', kind: 'earning', title: 'Alex Stewart', date: 'Jul 17, 2026', time: '2:30 PM', amount: 15000, status: 'settled' },
  { id: 'ern-3', kind: 'withdrawal', title: 'Withdrawal', date: 'Jul 16, 2026', time: '9:15 AM', amount: 25000, status: 'settled' },
  { id: 'ern-4', kind: 'earning', title: 'Ngozi Nwosu', date: 'Jul 15, 2026', time: '11:00 AM', amount: 7500, status: 'settled' },
  { id: 'ern-5', kind: 'earning', title: 'Augustine Watts', date: 'Jul 12, 2026', time: '3:00 PM', amount: 11250, status: 'settled' },
  { id: 'ern-6', kind: 'earning', title: 'Emeka Obi', date: 'Jul 8, 2026', time: '10:30 AM', amount: 11250, status: 'settled' },
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
