/**
 * Condition/symptom → category synonyms, so "Search by condition" (the
 * search bar's own placeholder, SOW 1.10 "Research") actually works instead
 * of only ever matching a doctor's name or specialty text. Deliberately not
 * a full clinical taxonomy (see doctorondemand.com/what-we-treat-all
 * referenced in the BRD for what that would look like) — just enough
 * everyday terms per category to make the existing placeholder honest.
 */
const CONDITION_SYNONYMS: Record<string, string[]> = {
  'Primary Care': ['checkup', 'check up', 'physical', 'flu', 'cold', 'fever', 'cough', 'general', 'wellness'],
  'Eye Doctor': ['eye', 'eyes', 'vision', 'glasses', 'contacts', 'blurry', 'cataract', 'glaucoma'],
  'OBGYN': ['pregnant', 'pregnancy', 'period', 'menstrual', 'gynecology', 'gynaecology', 'fertility', 'contraception', 'prenatal'],
  'Cardiology': ['heart', 'chest pain', 'blood pressure', 'hypertension', 'palpitations', 'cholesterol'],
  'Dermatology': ['skin', 'rash', 'acne', 'eczema', 'psoriasis', 'mole', 'hair loss'],
  'Pediatrics': ['child', 'children', 'kid', 'kids', 'baby', 'infant', 'newborn', 'vaccination', 'immunization'],
  'Dentistry': ['teeth', 'tooth', 'dental', 'toothache', 'cavity', 'gum'],
  'Mental Health': ['anxiety', 'depression', 'stress', 'therapy', 'counseling', 'counselling', 'mental', 'panic', 'insomnia'],
  'Physiotherapy': ['back pain', 'joint', 'sprain', 'physical therapy', 'mobility', 'injury', 'rehab', 'rehabilitation'],
};

/** Whether `query` matches `category` via a condition/symptom synonym. */
export function matchesConditionSynonym(query: string, category: string): boolean {
  const synonyms = CONDITION_SYNONYMS[category];
  if (!synonyms) return false;
  const q = query.toLowerCase();
  return synonyms.some((s) => s.includes(q) || q.includes(s));
}
