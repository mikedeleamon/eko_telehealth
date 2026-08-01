/**
 * Curated symptom catalog for patient self-logging (ICD-10 spec §7.2).
 * `suggestedCode` is an R00-R99 ("Symptoms, signs and abnormal findings")
 * code wherever one exists — that chapter exists precisely for "patient
 * reports X, no diagnosis yet". Mapping a symptom to a diagnostic code (e.g.
 * a sore throat to Streptococcal pharyngitis) would be a category error, so
 * entries with no clean R-code equivalent (back pain, insomnia, anxiety as a
 * *feeling* rather than a diagnosis, etc.) are deliberately left uncoded —
 * see D4 in the spec. Every code used here is also in src/constants/icd10.ts
 * so the provider's DiagnosisPicker can always resolve it.
 *
 * `labelKey` resolves to `symptoms.catalog.<key>` in the i18n locale files —
 * both EN and FR are required (see i18n/locales). Display labels are always
 * resolved at render time via useTranslation(), never cached on the record,
 * so a language switch is reflected immediately.
 */
export type SymptomBodySystem =
  | 'general'
  | 'respiratory'
  | 'cardiac'
  | 'digestive'
  | 'skin'
  | 'pain'
  | 'mental'
  | 'urinary'
  | 'other';

export interface SymptomCatalogEntry {
  key: string;
  labelKey: string;
  bodySystem: SymptomBodySystem;
  /** ICD-10 R-chapter symptom code, NOT a diagnosis (see file header). */
  suggestedCode?: string;
}

function entry(key: string, bodySystem: SymptomBodySystem, suggestedCode?: string): SymptomCatalogEntry {
  return { key, labelKey: `symptoms.catalog.${key}`, bodySystem, suggestedCode };
}

export const SYMPTOM_CATALOG: SymptomCatalogEntry[] = [
  // ── General ──────────────────────────────────────────────────────────────
  entry('fever', 'general', 'R50.9'),
  entry('fatigue', 'general', 'R53.83'),
  entry('chills', 'general', 'R68.83'),
  entry('weight_loss', 'general', 'R63.4'),
  entry('weight_gain', 'general', 'R63.5'),
  entry('swelling', 'general', 'R60.9'),
  entry('dizziness', 'general', 'R42'),

  // ── Respiratory ──────────────────────────────────────────────────────────
  entry('cough', 'respiratory', 'R05.9'),
  entry('shortness_of_breath', 'respiratory', 'R06.02'),
  entry('sore_throat', 'respiratory', 'R07.0'),
  entry('nasal_congestion', 'respiratory', 'R09.81'),
  entry('runny_nose', 'respiratory'),
  entry('wheezing', 'respiratory', 'R06.2'),
  entry('hoarseness', 'respiratory', 'R49.0'),

  // ── Cardiac ──────────────────────────────────────────────────────────────
  entry('chest_pain', 'cardiac', 'R07.9'),
  entry('palpitations', 'cardiac', 'R00.2'),
  entry('irregular_heartbeat', 'cardiac', 'R00.8'),

  // ── Digestive ────────────────────────────────────────────────────────────
  entry('abdominal_pain', 'digestive', 'R10.9'),
  entry('nausea', 'digestive', 'R11.0'),
  entry('vomiting', 'digestive', 'R11.10'),
  entry('diarrhea', 'digestive', 'R19.7'),
  entry('constipation', 'digestive'),
  entry('loss_of_appetite', 'digestive', 'R63.0'),
  entry('heartburn', 'digestive', 'R12'),
  entry('bloating', 'digestive', 'R14.0'),

  // ── Skin ─────────────────────────────────────────────────────────────────
  entry('rash', 'skin', 'R21'),
  entry('itching', 'skin'),
  entry('bruising_easily', 'skin', 'R23.3'),
  entry('dry_skin', 'skin'),

  // ── Pain ─────────────────────────────────────────────────────────────────
  entry('headache', 'pain', 'R51.9'),
  entry('back_pain', 'pain'),
  entry('joint_pain', 'pain'),
  entry('muscle_pain', 'pain'),
  entry('joint_swelling', 'pain'),

  // ── Mental / wellbeing ───────────────────────────────────────────────────
  entry('anxiety', 'mental', 'R45.82'),
  entry('low_mood', 'mental', 'R45.2'),
  entry('stress', 'mental'),
  entry('trouble_sleeping', 'mental'),

  // ── Urinary ──────────────────────────────────────────────────────────────
  entry('painful_urination', 'urinary', 'R30.0'),
  entry('frequent_urination', 'urinary', 'R35.0'),
  entry('blood_in_urine', 'urinary', 'R31.9'),

  // ── Other ────────────────────────────────────────────────────────────────
  entry('numbness_tingling', 'other', 'R20.2'),
  entry('blurred_vision', 'other'),
  entry('ear_pain', 'other'),
  entry('eye_redness', 'other'),
];

export function findSymptomEntry(key: string): SymptomCatalogEntry | undefined {
  return SYMPTOM_CATALOG.find((e) => e.key === key);
}
