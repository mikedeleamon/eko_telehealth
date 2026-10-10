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

// Languages patients/providers can select as spoken (task 2.5) — the app's
// major Nigerian languages plus common international ones for the
// international-provider use case. Distinct from the app's own display
// language (i18n locales, EN/FR only).
export const LANGUAGE_OPTIONS = [
  'English', 'Yoruba', 'Igbo', 'Hausa', 'Pidgin', 'French', 'Arabic', 'Spanish', 'Portuguese',
];

export const SPECIALTY_CHIPS = [
  { label: 'Primary Care', count: 10, color: '#F97653' },
  { label: 'Eye Doctor', count: 8, color: '#6C5CE7' },
  { label: 'OBGYN', count: 5, color: '#00CAAE' },
  { label: 'Cardiology', count: 3, color: '#3B82F6' },
  { label: 'Dermatology', count: 7, color: '#F5A623' },
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
    canProvideInHome: true,
    spokenLanguages: ['English', 'Igbo'],
    patientCount: 1240,
    yearsExperience: 9,
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
    canProvideInHome: false,
    spokenLanguages: ['English', 'Yoruba', 'Pidgin'],
    patientCount: 860,
    yearsExperience: 6,
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
    canProvideInHome: false,
    spokenLanguages: ['English', 'Yoruba'],
    patientCount: 3100,
    yearsExperience: 14,
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
    canProvideInHome: false,
    spokenLanguages: ['English'],
    patientCount: 640,
    yearsExperience: 18,
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
    canProvideInHome: true,
    spokenLanguages: ['English', 'Hausa', 'Pidgin'],
    patientCount: 4200,
    yearsExperience: 11,
  },
];

export const MOCK_APPOINTMENTS = [
  {
    id: '1',
    doctorId: '1',
    doctor: 'Dr. Amara Okafor MD',
    specialty: 'Primary Care',
    date: 'Mon, Jun 29, 2026',
    time: '10:00 AM',
    startAt: '2026-06-29T09:00:00.000Z',
    type: 'Video Visit',
    status: 'upcoming',
    patientName: 'Martin Doe',
    reason: 'Persistent headaches for the past two weeks, worse in the mornings.',
  },
  {
    id: '1b',
    doctorId: '1',
    doctor: 'Dr. Amara Okafor MD',
    specialty: 'Primary Care',
    date: 'Mon, Jun 29, 2026',
    time: '11:00 AM',
    startAt: '2026-06-29T10:00:00.000Z',
    type: 'Video Visit',
    status: 'checked_in',
  },
  {
    id: '2',
    doctorId: '2',
    doctor: 'Dr. Chinedu Eze MD',
    specialty: 'Eye Doctor',
    date: 'Wed, Jul 2, 2026',
    time: '2:30 PM',
    type: 'Clinic Visit',
    status: 'upcoming',
    patientName: 'Martin Doe',
    reason: 'Blurred vision when reading; due for a prescription check.',
  },
  {
    id: '3',
    doctorId: '3',
    doctor: 'Dr. Funmilayo Adeyemi',
    specialty: 'OBGYN',
    date: 'May 15, 2026',
    time: '11:00 AM',
    type: 'Video Visit',
    status: 'past',
  },
  {
    id: '4',
    doctorId: '4',
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

// ---- Relative dates for doctor-side demo data ----
// The scheduler, My Day and Reports all key off "today", so data pinned to
// fixed dates goes stale (an empty day view, ₦0 this month) the moment the
// calendar moves past it. These anchor rows to whenever the app is running.
const MOCK_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MOCK_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Local time `dayOffset` days from today at hh:mm. */
function mockAt(dayOffset: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}
const mockDate = (d: Date) => `${MOCK_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
const mockDayDate = (d: Date) => `${MOCK_WEEKDAYS[d.getDay()]}, ${mockDate(d)}`;
function mockClock(d: Date): string {
  const h = d.getHours() % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
}
/** The date/time/startAt trio an appointment row carries, from one instant. */
const mockWhen = (d: Date) => ({ date: mockDayDate(d), time: mockClock(d), startAt: d.toISOString() });

// Mock source for GET /practice/appointments — same shape as MOCK_APPOINTMENTS,
// but `doctor` holds the patient's name and `specialty` the visit reason.
// Includes pending requests so the Accept/Decline actions have real targets.
// Live visits sit around today so the scheduler always has something to show;
// past visits keep their fixed dates because SOAP notes and each patient's
// lastVisit point at them.
export const MOCK_DOCTOR_SCHEDULE = [
  { id: 's1', doctor: 'Emeka Obi', patientId: 'p1', patientName: 'Emeka Obi', reason: 'Chest tightness after climbing stairs, started three days ago.', specialty: 'Consultation', ...mockWhen(mockAt(1, 12)), durationMinutes: 60, type: 'Video Visit', status: 'pending_approval', fee: '₦15,000' },
  { id: 's2', doctor: 'Yusuf Ibrahim', patientId: 'p2', patientName: 'Yusuf Ibrahim', reason: 'Cough still lingering after the first course of treatment.', specialty: 'Follow-up', ...mockWhen(mockAt(3, 10)), durationMinutes: 60, type: 'Clinic Visit', status: 'pending_approval', fee: '₦15,000' },
  // Bisi has no MOCK_PATIENTS record, so her entry stays unmatched (no patientId).
  { id: 's3', doctor: 'Bisi Alade', specialty: 'Consultation', reason: 'Recurring skin rash on both forearms.', ...mockWhen(mockAt(0, 14)), durationMinutes: 60, type: 'Video Visit', status: 'pending_payment', fee: '₦15,000' },
  { id: 's4', doctor: 'Ngozi Nwosu', patientId: 'p5', patientName: 'Ngozi Nwosu', reason: 'Follow-up on blood pressure medication started last month.', specialty: 'Follow-up', ...mockWhen(mockAt(0, 9)), durationMinutes: 60, type: 'Video Visit', status: 'upcoming', fee: '₦15,000' },
  { id: 's5', doctor: 'Augustine Watts', patientId: 'p4', patientName: 'Augustine Watts', specialty: 'Consultation', ...mockWhen(new Date(2026, 5, 10, 10, 30)), durationMinutes: 60, type: 'Clinic Visit', status: 'past', fee: '₦15,000' },
  // Past visits (dates align with each patient's lastVisit) so every patient
  // has at least one appointment a SOAP note can link to.
  { id: 's6', doctor: 'Emeka Obi', patientId: 'p1', patientName: 'Emeka Obi', specialty: 'Follow-up', ...mockWhen(new Date(2026, 5, 20, 9, 30)), durationMinutes: 60, type: 'Video Visit', status: 'past', fee: '₦15,000' },
  { id: 's7', doctor: 'Yusuf Ibrahim', patientId: 'p2', patientName: 'Yusuf Ibrahim', reason: 'New patient consultation — persistent cough for two weeks.', specialty: 'First Visit', ...mockWhen(mockAt(0, 11)), durationMinutes: 60, type: 'Clinic Visit', status: 'upcoming', fee: '₦15,000' },
  { id: 's8', doctor: 'Alex Stewart', patientId: 'p3', patientName: 'Alex Stewart', specialty: 'Consultation', ...mockWhen(new Date(2026, 5, 12, 14, 0)), durationMinutes: 60, type: 'Video Visit', status: 'past', fee: '₦15,000' },
  { id: 's9', doctor: 'Ngozi Nwosu', patientId: 'p5', patientName: 'Ngozi Nwosu', specialty: 'Antenatal Visit', ...mockWhen(new Date(2026, 4, 29, 11, 0)), durationMinutes: 60, type: 'Clinic Visit', status: 'past', fee: '₦15,000' },
  { id: 's10', doctor: 'Tunde Bakare', patientId: 'p6', patientName: 'Tunde Bakare', specialty: 'Annual Physical', ...mockWhen(new Date(2026, 4, 14, 15, 30)), durationMinutes: 60, type: 'Clinic Visit', status: 'past', fee: '₦15,000' },
  { id: 's11', doctor: 'Augustine Watts', patientId: 'p4', patientName: 'Augustine Watts', reason: 'Migraine follow-up — reviewing the propranolol dose.', specialty: 'Follow-up', ...mockWhen(mockAt(0, 15)), durationMinutes: 60, type: 'Video Visit', status: 'checked_in', fee: '₦15,000' },
  // A two-slot home visit the doctor booked themselves.
  { id: 's12', doctor: 'Alex Stewart', patientId: 'p3', patientName: 'Alex Stewart', reason: 'Home review of blood sugar log and foot check.', specialty: 'Follow-up', ...mockWhen(mockAt(5, 10)), durationMinutes: 120, type: 'Home Visit', status: 'pending_payment', fee: '₦15,000', scheduledByDoctor: true },
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
  // Martin (pat-1) — the signed-in mock patient's own record, shown in the
  // patient-facing Visit Notes screen.
  {
    id: 'note-6', patientId: 'pat-1', appointmentId: 'appt-pat1-1', date: 'Jul 4, 2026', visitType: 'Video Visit',
    doctorId: '1', doctorName: 'Dr. Amara Okafor MD', doctorSpecialty: 'Therapist, Primary care doctor',
    reason: 'Seasonal allergy follow-up',
    subjective: 'Sneezing and itchy eyes worse in the mornings. Cetirizine helps but wears off by evening.',
    objective: 'Nasal mucosa mildly boggy. Lungs clear. No wheeze.',
    assessment: 'Allergic rhinitis, seasonal, partially controlled.',
    plan: 'Continue cetirizine 10mg daily. Add saline nasal rinse. Review in 3 months if symptoms persist.',
    createdAt: '2026-07-04T10:05:00Z',
  },
  // Chidi (dep-1) — Martin's dependent (proxy access). dependentId is what
  // makes this Chidi's note, not Martin's own; matches the strep test + liquid
  // amoxicillin seeded above.
  {
    id: 'note-7', patientId: 'pat-1', dependentId: 'dep-1', appointmentId: 'appt-dep1-1', date: 'Jul 22, 2026', visitType: 'Clinic Visit',
    doctorId: '1', doctorName: 'Dr. Amara Okafor MD', doctorSpecialty: 'Therapist, Primary care doctor',
    reason: 'Sore throat and fever',
    subjective: "Two days of sore throat, fever to 38.6°C, and difficulty swallowing. No cough. Appetite reduced.",
    objective: 'Temp 38.4°C. Tonsils erythematous with exudate. Tender anterior cervical nodes. Rapid strep positive.',
    assessment: 'Streptococcal pharyngitis.',
    primaryDiagnosis: { code: 'J02.0', description: 'Streptococcal pharyngitis', codeSystem: 'icd10cm', status: 'confirmed' },
    plan: 'Started amoxicillin liquid 250mg three times daily for 5 days. Rest, fluids, and paracetamol for fever. Return if not improving in 48 hours.',
    createdAt: '2026-07-22T11:25:00Z',
  },
];

/**
 * Seed problem-list entries (Phase 3). p1/p3 exercise the doctor-facing
 * Conditions card; pat-1 exercises the patient-facing My Conditions screen,
 * with one resolved entry to demo the "Show resolved" toggle.
 */
export const MOCK_PATIENT_CONDITIONS = [
  {
    id: 'cond-1', patientId: 'p1',
    diagnosis: { code: 'I10', description: 'Essential (primary) hypertension', codeSystem: 'icd10cm' as const },
    clinicalStatus: 'active' as const,
    onsetDate: '2026-06-20',
    sourceNoteId: 'note-3',
    addedByName: 'Dr. Amara Okafor MD',
    createdAt: '2026-06-20T10:20:00Z',
  },
  {
    id: 'cond-2', patientId: 'p3',
    diagnosis: { code: 'E11.65', description: 'Type 2 diabetes mellitus with hyperglycemia', label: 'Type 2 diabetes, worsening control', codeSystem: 'icd10cm' as const },
    clinicalStatus: 'active' as const,
    onsetDate: '2025-11-02',
    sourceNoteId: 'note-4',
    addedByName: 'Dr. Amara Okafor MD',
    createdAt: '2026-06-12T15:00:00Z',
  },
  {
    id: 'cond-3', patientId: 'pat-1',
    diagnosis: { code: 'J30.9', description: 'Allergic rhinitis, unspecified', label: 'Seasonal allergic rhinitis', codeSystem: 'icd10cm' as const },
    clinicalStatus: 'active' as const,
    onsetDate: '2025-03-01',
    sourceNoteId: 'note-6',
    addedByName: 'Dr. Amara Okafor MD',
    createdAt: '2026-07-04T10:20:00Z',
  },
  {
    id: 'cond-4', patientId: 'pat-1',
    diagnosis: { code: 'J20.9', description: 'Acute bronchitis, unspecified', codeSystem: 'icd10cm' as const },
    clinicalStatus: 'resolved' as const,
    onsetDate: '2025-12-10',
    resolvedDate: '2026-01-05',
    addedByName: 'Dr. Amara Okafor MD',
    createdAt: '2025-12-10T09:00:00Z',
  },
];

/**
 * Seed symptom logs (Phase 4) for the signed-in mock patient (pat-1). The
 * unresolved sore_throat entry is what demoes the DiagnosisPicker's "For this
 * patient" candidates band — see suggestedCode on symptoms.sore_throat in
 * src/constants/symptoms.ts.
 */
export const MOCK_SYMPTOM_LOGS = [
  {
    id: 'symlog-1', symptomKey: 'sore_throat', suggestedCode: 'R07.0',
    severity: 3, startedAt: '2026-07-25', notes: 'Worse when swallowing.',
    createdAt: '2026-07-25T18:30:00Z',
  },
  {
    id: 'symlog-2', symptomKey: 'fatigue', suggestedCode: 'R53.83',
    severity: 2, startedAt: '2026-07-20',
    createdAt: '2026-07-20T08:15:00Z',
  },
  {
    id: 'symlog-3', symptomKey: 'rash', suggestedCode: 'R21',
    severity: 2, startedAt: '2026-06-01', resolvedAt: '2026-06-10T12:00:00Z',
    createdAt: '2026-06-01T09:00:00Z',
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
  // Martin (pat-1) — the signed-in mock patient's own medication record,
  // shown in the patient-facing Prescriptions tab.
  {
    id: 'rx-9', patientId: 'pat-1', drug: 'Cetirizine', strength: '10 mg', form: 'Tablet', route: 'Oral',
    frequency: 'Once daily', duration: 'Ongoing', quantity: '30', refills: '2',
    instructions: 'Take one tablet daily for seasonal allergies.',
    status: 'active', doctorId: 'doc-1', doctorName: 'Dr. Amara Okafor',
    datePrescribed: 'Jul 4, 2026', createdAt: '2026-07-04T10:00:00Z',
  },
  {
    id: 'rx-10', patientId: 'pat-1', drug: 'Omeprazole', strength: '20 mg', form: 'Capsule', route: 'Oral',
    frequency: 'Once daily', duration: '28 days', quantity: '28', refills: '1',
    instructions: 'Take 30 minutes before breakfast.',
    status: 'active', doctorId: 'doc-1', doctorName: 'Dr. Amara Okafor',
    datePrescribed: 'Jun 20, 2026', createdAt: '2026-06-20T09:00:00Z',
  },
  {
    id: 'rx-11', patientId: 'pat-1', drug: 'Amoxicillin', strength: '500 mg', form: 'Capsule', route: 'Oral',
    frequency: 'Three times daily', duration: '7 days', quantity: '21', refills: '0',
    instructions: 'Completed course for chest infection.',
    status: 'completed', doctorId: 'doc-1', doctorName: 'Dr. Amara Okafor',
    datePrescribed: 'Mar 12, 2026', createdAt: '2026-03-12T16:30:00Z',
  },
  // Chidi (dep-1) — Martin's dependent (proxy access). patientId stays the
  // account holder; dependentId is what makes this Chidi's medication and not
  // Martin's own — see schema.ts's dependentId doc comment on prescriptions.
  {
    id: 'rx-12', patientId: 'pat-1', dependentId: 'dep-1', drug: 'Amoxicillin', strength: '250 mg', form: 'Liquid', route: 'Oral',
    frequency: 'Three times daily', duration: '5 days', quantity: '1 bottle', refills: '0',
    instructions: 'Shake well. Take with food.',
    status: 'active', doctorId: 'doc-1', doctorName: 'Dr. Amara Okafor',
    datePrescribed: 'Jul 22, 2026', createdAt: '2026-07-22T11:20:00Z',
  },
];

export const MOCK_PATIENTS = [
  {
    id: 'p1', userId: 'p1', name: 'Emeka Obi', age: 34, gender: 'Male', condition: 'Hypertension', lastVisit: 'Jun 20, 2026',
    reason: 'Follow-up for high blood pressure and medication review',
    symptoms: 'Occasional headaches, mild dizziness in the mornings',
    allergies: 'Penicillin',
    phone: '+234 803 111 2233', email: 'emeka.obi@example.com',
    biometrics: { bloodPressure: '148/95 mmHg', heartRate: '82 bpm', temperature: '36.7 °C', weight: '84 kg', height: '178 cm', bmi: '26.5', bloodType: 'O+' },
  },
  {
    id: 'p2', userId: 'p2', name: 'Yusuf Ibrahim', age: 28, gender: 'Male', condition: 'First Visit', lastVisit: 'New patient',
    reason: 'New patient consultation — persistent cough for two weeks',
    symptoms: 'Dry cough, sore throat, low-grade fever at night',
    allergies: 'None reported',
    phone: '+234 806 445 7788', email: 'yusuf.ibrahim@example.com',
    biometrics: { bloodPressure: '122/78 mmHg', heartRate: '76 bpm', temperature: '37.4 °C', weight: '71 kg', height: '175 cm', bmi: '23.2', bloodType: 'A+' },
  },
  {
    id: 'p3', userId: 'p3', name: 'Alex Stewart', age: 45, gender: 'Male', condition: 'Diabetes Type 2', lastVisit: 'Jun 12, 2026',
    reason: 'Quarterly diabetes management and HbA1c review',
    symptoms: 'Increased thirst, fatigue after meals',
    allergies: 'Sulfa drugs',
    phone: '+234 701 223 9090', email: 'alex.stewart@example.com',
    biometrics: { bloodPressure: '134/86 mmHg', heartRate: '88 bpm', temperature: '36.6 °C', weight: '92 kg', height: '181 cm', bmi: '28.1', bloodType: 'B+' },
  },
  {
    id: 'p4', userId: 'p4', name: 'Augustine Watts', age: 52, gender: 'Female', condition: 'Migraine', lastVisit: 'Jun 5, 2026',
    reason: 'Recurrent migraines — evaluating current treatment plan',
    symptoms: 'Throbbing headaches, light sensitivity, nausea',
    allergies: 'Aspirin',
    phone: '+234 809 556 3412', email: 'augustine.watts@example.com',
    biometrics: { bloodPressure: '128/82 mmHg', heartRate: '74 bpm', temperature: '36.8 °C', weight: '68 kg', height: '165 cm', bmi: '25.0', bloodType: 'AB+' },
  },
  {
    id: 'p5', userId: 'p5', name: 'Ngozi Nwosu', age: 31, gender: 'Female', condition: 'Pregnancy care', lastVisit: 'May 29, 2026',
    reason: 'Antenatal check-up — 24 weeks gestation',
    symptoms: 'Mild back pain, occasional swelling in ankles',
    allergies: 'None reported',
    phone: '+234 802 778 1265', email: 'ngozi.nwosu@example.com',
    biometrics: { bloodPressure: '118/76 mmHg', heartRate: '80 bpm', temperature: '36.9 °C', weight: '73 kg', height: '168 cm', bmi: '25.9', bloodType: 'O-' },
  },
  {
    id: 'p6', userId: 'p6', name: 'Tunde Bakare', age: 40, gender: 'Male', condition: 'Annual checkup', lastVisit: 'May 14, 2026',
    reason: 'Routine annual physical and preventive screening',
    symptoms: 'No active complaints',
    allergies: 'None reported',
    phone: '+234 805 990 4471', email: 'tunde.bakare@example.com',
    biometrics: { bloodPressure: '120/80 mmHg', heartRate: '70 bpm', temperature: '36.6 °C', weight: '78 kg', height: '176 cm', bmi: '25.2', bloodType: 'A-' },
  },
];

/**
 * Doctor earnings ledger, relative to today (see mockAt above).
 *
 * Each earning mirrors the backend's split (lib/pricing.ts): the patient pays
 * the consultation fee (grossAmount), the platform withholds its 17.5%
 * commission (platformFee), and the provider is credited the rest (amount /
 * netAmount). VAT is on the patient's bill and never comes out of the
 * provider's share. The fee went from ₦12,000 to ₦15,000 about two months
 * ago, so the older rows carry the old price.
 * The mock derives the balance / month / pending totals from these rows.
 */
// Earlier months are seeded deliberately: the earnings analysis (SOW 1.18)
// compares a range against the preceding one, and a ledger that starts this
// month would make every trend read "no prior data" in mock mode.
function mockEarning(id: string, patientName: string, dayOffset: number, hour: number, minute: number, fee: number, visitType: string) {
  const at = mockAt(-dayOffset, hour, minute);
  const platformFee = Math.round(fee * 0.175);
  return {
    id, kind: 'earning', title: patientName, date: mockDate(at), time: mockClock(at), amount: fee - platformFee, status: 'settled', visitType,
    appointmentDate: mockDate(at), patientName, grossAmount: fee, platformFee, netAmount: fee - platformFee,
  };
}
function mockWithdrawal(id: string, dayOffset: number, hour: number, minute: number, amount: number, method: 'flutterwave_bank' | 'paypal', destination: string) {
  const at = mockAt(-dayOffset, hour, minute);
  return { id, kind: 'withdrawal', title: 'Withdrawal', date: mockDate(at), time: mockClock(at), amount, status: 'settled', method, destination };
}
export const MOCK_EARNINGS = [
  mockEarning('ern-1', 'Emeka Obi', 1, 10, 0, 15000, 'Video Visit'),
  mockEarning('ern-2', 'Alex Stewart', 2, 14, 30, 15000, 'Home Visit'),
  mockWithdrawal('ern-3', 3, 9, 15, 25000, 'flutterwave_bank', 'Guaranty Trust Bank ••••4321'),
  mockEarning('ern-4', 'Ngozi Nwosu', 4, 11, 0, 15000, 'Clinic Visit'),
  mockEarning('ern-5', 'Augustine Watts', 6, 15, 0, 15000, 'Video Visit'),
  mockEarning('ern-6', 'Emeka Obi', 9, 10, 30, 15000, 'Video Visit'),
  mockEarning('ern-7', 'Ngozi Nwosu', 20, 9, 30, 15000, 'Video Visit'),
  mockEarning('ern-8', 'Alex Stewart', 27, 16, 0, 15000, 'Home Visit'),
  mockWithdrawal('ern-12', 30, 12, 0, 40000, 'paypal', 'dr.johnson@ekotelehealth.com'),
  mockEarning('ern-9', 'Augustine Watts', 35, 11, 30, 15000, 'Clinic Visit'),
  mockEarning('ern-10', 'Emeka Obi', 48, 10, 0, 15000, 'Video Visit'),
  mockEarning('ern-11', 'Ngozi Nwosu', 62, 14, 0, 12000, 'Video Visit'),
  mockEarning('ern-13', 'Tunde Bakare', 75, 15, 30, 12000, 'Clinic Visit'),
  mockWithdrawal('ern-14', 80, 9, 45, 30000, 'flutterwave_bank', 'Guaranty Trust Bank ••••4321'),
  mockEarning('ern-15', 'Yusuf Ibrahim', 95, 10, 0, 12000, 'Clinic Visit'),
];
