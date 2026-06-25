export const APP_NAME = 'Eko Telehealth';

export const TUTORIAL_DATA = [
  {
    id: '1',
    title: 'Locate and Book a Doctor in a Snap!',
    subtitle: 'Conveniently locate competent doctors and specialists near you, other states and abroad!',
    color: '#E8F4FD',
  },
  {
    id: '2',
    title: 'Many ways to book an appointment with a doctor in a snap!',
    subtitle: 'Video visit, clinic visit, home visit — choose what works best for you.',
    color: '#FDE8EC',
  },
  {
    id: '3',
    title: 'Flexible and High Quality Healthcare at the snap of your Finger',
    subtitle: "Schedule a healthcare appointment, either for yourself, your dependent or a parent, even while you're living in diaspora!",
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
    name: 'Dr. Julianna May MD',
    specialty: 'Therapist, Primary care doctor',
    category: 'Primary Care',
    rating: 4.9,
    reviews: 79,
    location: '9044 W.Houston St. New York, NY 10012',
    fee: '$80',
    available: true,
    nextAvailable: '29, June',
    avatar: null,
  },
  {
    id: '2',
    name: 'Dr. Mike Brinx MD',
    specialty: 'Eye Specialist, Eye Doctor',
    category: 'Eye Doctor',
    rating: 4.9,
    reviews: 79,
    location: '9044 W.Houston St. New York, NY 10012',
    fee: '$120',
    available: true,
    nextAvailable: '29, June',
    avatar: null,
  },
  {
    id: '3',
    name: 'Dr. Emily Rodriguez',
    specialty: 'OBGYN Specialist',
    category: 'OBGYN',
    rating: 4.7,
    reviews: 213,
    location: 'Chicago, IL',
    fee: '$150',
    available: false,
    nextAvailable: '2, July',
    avatar: null,
  },
  {
    id: '4',
    name: 'Dr. James Williams MD',
    specialty: 'Cardiologist, Internal Medicine',
    category: 'Cardiology',
    rating: 4.6,
    reviews: 87,
    location: '200 Medical Plaza, Houston, TX',
    fee: '$200',
    available: true,
    nextAvailable: '30, June',
    avatar: null,
  },
  {
    id: '5',
    name: 'Dr. Aisha Patel MD',
    specialty: 'Dermatologist',
    category: 'Dermatology',
    rating: 4.9,
    reviews: 301,
    location: 'Miami, FL',
    fee: '$110',
    available: true,
    nextAvailable: '1, July',
    avatar: null,
  },
];

export const MOCK_APPOINTMENTS = [
  {
    id: '1',
    doctor: 'Dr. Julianna May MD',
    specialty: 'Primary Care',
    date: 'Mon, Jun 29, 2026',
    time: '10:00 AM',
    type: 'Video Visit',
    status: 'upcoming',
  },
  {
    id: '2',
    doctor: 'Dr. Mike Brinx MD',
    specialty: 'Eye Doctor',
    date: 'Wed, Jul 2, 2026',
    time: '2:30 PM',
    type: 'Clinic Visit',
    status: 'upcoming',
  },
  {
    id: '3',
    doctor: 'Dr. Emily Rodriguez',
    specialty: 'OBGYN',
    date: 'May 15, 2026',
    time: '11:00 AM',
    type: 'Video Visit',
    status: 'past',
  },
  {
    id: '4',
    doctor: 'Dr. James Williams MD',
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
  { id: '1', title: 'Appointment Reminder', body: 'Your appointment with Dr. Julianna May is tomorrow at 10:00 AM.', time: '2h ago' },
  { id: '2', title: 'Appointment Confirmed', body: 'Dr. Mike Brinx confirmed your Jul 2 appointment.', time: '1d ago' },
  { id: '3', title: 'New Message', body: 'You have a new message from Dr. Emily Rodriguez.', time: '2d ago' },
  { id: '4', title: 'Payment Successful', body: 'Your payment of $80 for the video visit has been processed.', time: '3d ago' },
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
