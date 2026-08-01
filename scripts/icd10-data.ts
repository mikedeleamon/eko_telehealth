/**
 * Canonical curated ICD-10-CM subset — the single source of truth consumed by:
 *   - this repo's scripts/seed-icd10.ts (upserts into icd10_codes)
 *   - eko_telehealth's scripts/build-icd10-subset.ts (generates src/constants/icd10.ts)
 *
 * There is no shared package between the two repos, so this file is
 * duplicated (not symlinked) into eko_telehealth/scripts/icd10-data.ts.
 * Keep the two copies identical — that's what ICD10_SUBSET_VERSION is for:
 * bump it in both places when the list changes.
 *
 * SCOPE NOTE: this is a hand-picked ~100-code starter set covering common
 * primary-care presenting complaints, chronic-disease chapters, and
 * well-visit/encounter Z-codes — the codes clinicians reach for most often,
 * enriched with hand-written lay synonyms ("sore throat" → J02.9) that don't
 * exist in the official CMS files. Every code+description pair here has been
 * cross-checked line-for-line against the official CMS 2027 ICD-10-CM release
 * (icd10cm_order_2027.txt from https://www.cms.gov/medicare/coding-billing/icd-10-codes)
 * and is exact as of that release. This is the enrichment layer on top of the
 * FULL official code set — see scripts/data/icd10cm_codes_2027.txt and
 * seed-icd10.ts, which bulk-seeds every one of the ~74,900 official billable
 * codes and then overlays this file's synonyms/chapter/category on the
 * subset below. The spec's ~1,200-code target for the bundled local subset
 * (src/constants/icd10.ts) is still not met — that asset only ships this
 * ~100-code enriched subset, not the full table, by design (D6: bundled
 * subset is for instant offline type-ahead, the long tail lives server-side).
 */

export interface Icd10SeedEntry {
  code: string;
  description: string;
  chapter: string;
  category: string;
  isBillable: boolean;
  /** Lay terms folded into search. */
  synonyms: string;
}

export const ICD10_SUBSET_VERSION = '2027-cms-validated+symptoms';

export const ICD10_SEED_DATA: Icd10SeedEntry[] = [
  // ── Respiratory (J00-J99) ─────────────────────────────────────────────
  { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified', chapter: 'Diseases of the respiratory system', category: 'J00-J06', isBillable: true, synonyms: 'common cold, uri, cold, upper respiratory infection' },
  { code: 'J02.9', description: 'Acute pharyngitis, unspecified', chapter: 'Diseases of the respiratory system', category: 'J00-J06', isBillable: true, synonyms: 'sore throat, throat infection, pharyngitis' },
  { code: 'J03.90', description: 'Acute tonsillitis, unspecified', chapter: 'Diseases of the respiratory system', category: 'J00-J06', isBillable: true, synonyms: 'tonsillitis, swollen tonsils' },
  { code: 'J01.90', description: 'Acute sinusitis, unspecified', chapter: 'Diseases of the respiratory system', category: 'J00-J06', isBillable: true, synonyms: 'sinus infection, sinusitis' },
  { code: 'J20.9', description: 'Acute bronchitis, unspecified', chapter: 'Diseases of the respiratory system', category: 'J20-J22', isBillable: true, synonyms: 'chest cold, bronchitis' },
  { code: 'J18.9', description: 'Pneumonia, unspecified organism', chapter: 'Diseases of the respiratory system', category: 'J09-J18', isBillable: true, synonyms: 'pneumonia, chest infection, lung infection' },
  { code: 'J45.909', description: 'Unspecified asthma, uncomplicated', chapter: 'Diseases of the respiratory system', category: 'J40-J47', isBillable: true, synonyms: 'asthma, wheezing' },
  { code: 'J44.9', description: 'Chronic obstructive pulmonary disease, unspecified', chapter: 'Diseases of the respiratory system', category: 'J40-J47', isBillable: true, synonyms: 'copd, emphysema, chronic bronchitis' },
  { code: 'J30.9', description: 'Allergic rhinitis, unspecified', chapter: 'Diseases of the respiratory system', category: 'J30-J39', isBillable: true, synonyms: 'hay fever, allergies, allergic rhinitis' },
  { code: 'J06.0', description: 'Acute laryngopharyngitis', chapter: 'Diseases of the respiratory system', category: 'J00-J06', isBillable: true, synonyms: 'laryngitis, hoarse voice' },

  // ── Endocrine/metabolic (E00-E89) ────────────────────────────────────
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', chapter: 'Endocrine, nutritional and metabolic diseases', category: 'E08-E13', isBillable: true, synonyms: 'diabetes, type 2 diabetes, high blood sugar, t2dm' },
  { code: 'E11.65', description: 'Type 2 diabetes mellitus with hyperglycemia', chapter: 'Endocrine, nutritional and metabolic diseases', category: 'E08-E13', isBillable: true, synonyms: 'diabetes with high blood sugar, hyperglycemia' },
  { code: 'E10.9', description: 'Type 1 diabetes mellitus without complications', chapter: 'Endocrine, nutritional and metabolic diseases', category: 'E08-E13', isBillable: true, synonyms: 'type 1 diabetes, insulin dependent diabetes' },
  { code: 'E78.5', description: 'Hyperlipidemia, unspecified', chapter: 'Endocrine, nutritional and metabolic diseases', category: 'E70-E88', isBillable: true, synonyms: 'high cholesterol, hyperlipidemia, dyslipidemia' },
  { code: 'E66.9', description: 'Obesity, unspecified', chapter: 'Endocrine, nutritional and metabolic diseases', category: 'E65-E68', isBillable: true, synonyms: 'obesity, overweight' },
  { code: 'E03.9', description: 'Hypothyroidism, unspecified', chapter: 'Endocrine, nutritional and metabolic diseases', category: 'E00-E07', isBillable: true, synonyms: 'underactive thyroid, hypothyroidism, low thyroid' },
  { code: 'E05.90', description: 'Thyrotoxicosis, unspecified without thyrotoxic crisis or storm', chapter: 'Endocrine, nutritional and metabolic diseases', category: 'E00-E07', isBillable: true, synonyms: 'hyperthyroidism, overactive thyroid' },
  { code: 'E86.0', description: 'Dehydration', chapter: 'Endocrine, nutritional and metabolic diseases', category: 'E86-E87', isBillable: true, synonyms: 'dehydration, fluid loss' },

  // ── Circulatory (I00-I99) ─────────────────────────────────────────────
  { code: 'I10', description: 'Essential (primary) hypertension', chapter: 'Diseases of the circulatory system', category: 'I10-I16', isBillable: true, synonyms: 'high blood pressure, hypertension, htn' },
  { code: 'I25.10', description: 'Atherosclerotic heart disease of native coronary artery without angina pectoris', chapter: 'Diseases of the circulatory system', category: 'I20-I25', isBillable: true, synonyms: 'coronary artery disease, cad, heart disease' },
  { code: 'I48.91', description: 'Unspecified atrial fibrillation', chapter: 'Diseases of the circulatory system', category: 'I44-I49', isBillable: true, synonyms: 'atrial fibrillation, afib, irregular heartbeat' },
  { code: 'I83.90', description: 'Asymptomatic varicose veins of unspecified lower extremity', chapter: 'Diseases of the circulatory system', category: 'I80-I89', isBillable: true, synonyms: 'varicose veins' },
  { code: 'I95.9', description: 'Hypotension, unspecified', chapter: 'Diseases of the circulatory system', category: 'I95', isBillable: true, synonyms: 'low blood pressure, hypotension' },

  // ── Digestive (K00-K95) ───────────────────────────────────────────────
  { code: 'K21.9', description: 'Gastro-esophageal reflux disease without esophagitis', chapter: 'Diseases of the digestive system', category: 'K20-K31', isBillable: true, synonyms: 'gerd, acid reflux, heartburn' },
  { code: 'K29.70', description: 'Gastritis, unspecified, without bleeding', chapter: 'Diseases of the digestive system', category: 'K20-K31', isBillable: true, synonyms: 'gastritis, stomach inflammation' },
  { code: 'K30', description: 'Functional dyspepsia', chapter: 'Diseases of the digestive system', category: 'K20-K31', isBillable: true, synonyms: 'indigestion, upset stomach, dyspepsia' },
  { code: 'K59.00', description: 'Constipation, unspecified', chapter: 'Diseases of the digestive system', category: 'K55-K64', isBillable: true, synonyms: 'constipation' },
  { code: 'K59.1', description: 'Functional diarrhea', chapter: 'Diseases of the digestive system', category: 'K55-K64', isBillable: true, synonyms: 'diarrhea, loose stool' },
  { code: 'K58.9', description: 'Irritable bowel syndrome, unspecified', chapter: 'Diseases of the digestive system', category: 'K55-K64', isBillable: true, synonyms: 'ibs, irritable bowel syndrome' },
  { code: 'K52.9', description: 'Noninfective gastroenteritis and colitis, unspecified', chapter: 'Diseases of the digestive system', category: 'K50-K52', isBillable: true, synonyms: 'gastroenteritis, stomach flu' },
  { code: 'K35.80', description: 'Unspecified acute appendicitis', chapter: 'Diseases of the digestive system', category: 'K35-K38', isBillable: true, synonyms: 'appendicitis' },
  { code: 'K80.20', description: 'Calculus of gallbladder without cholecystitis without obstruction', chapter: 'Diseases of the digestive system', category: 'K80-K87', isBillable: true, synonyms: 'gallstones, cholelithiasis' },

  // ── Infectious/parasitic (A00-B99) ──────────────────────────────────
  { code: 'A09', description: 'Infectious gastroenteritis and colitis, unspecified', chapter: 'Certain infectious and parasitic diseases', category: 'A00-A09', isBillable: true, synonyms: 'food poisoning, infectious diarrhea, stomach bug' },
  { code: 'B34.9', description: 'Viral infection, unspecified', chapter: 'Certain infectious and parasitic diseases', category: 'B25-B34', isBillable: true, synonyms: 'viral infection, virus' },
  { code: 'B54', description: 'Unspecified malaria', chapter: 'Certain infectious and parasitic diseases', category: 'B50-B54', isBillable: true, synonyms: 'malaria' },
  { code: 'B35.9', description: 'Dermatophytosis, unspecified', chapter: 'Certain infectious and parasitic diseases', category: 'B35-B49', isBillable: true, synonyms: 'ringworm, fungal skin infection, tinea' },
  { code: 'B37.31', description: 'Acute candidiasis of vulva and vagina', chapter: 'Certain infectious and parasitic diseases', category: 'B35-B49', isBillable: true, synonyms: 'yeast infection, vaginal candidiasis' },
  { code: 'A49.9', description: 'Bacterial infection, unspecified', chapter: 'Certain infectious and parasitic diseases', category: 'A30-A49', isBillable: true, synonyms: 'bacterial infection' },

  // ── Genitourinary (N00-N99) ──────────────────────────────────────────
  { code: 'N39.0', description: 'Urinary tract infection, site not specified', chapter: 'Diseases of the genitourinary system', category: 'N30-N39', isBillable: true, synonyms: 'uti, urinary tract infection, bladder infection' },
  { code: 'N30.90', description: 'Cystitis, unspecified without hematuria', chapter: 'Diseases of the genitourinary system', category: 'N30-N39', isBillable: true, synonyms: 'cystitis, bladder infection' },
  { code: 'N76.0', description: 'Acute vaginitis', chapter: 'Diseases of the genitourinary system', category: 'N70-N77', isBillable: true, synonyms: 'vaginitis, vaginal infection' },
  { code: 'N40.1', description: 'Benign prostatic hyperplasia with lower urinary tract symptoms', chapter: 'Diseases of the genitourinary system', category: 'N40-N53', isBillable: true, synonyms: 'enlarged prostate, bph' },
  { code: 'N94.6', description: 'Dysmenorrhea, unspecified', chapter: 'Diseases of the genitourinary system', category: 'N80-N98', isBillable: true, synonyms: 'menstrual cramps, painful periods, dysmenorrhea' },

  // ── Skin (L00-L99) ────────────────────────────────────────────────────
  { code: 'L30.9', description: 'Dermatitis, unspecified', chapter: 'Diseases of the skin and subcutaneous tissue', category: 'L20-L30', isBillable: true, synonyms: 'rash, dermatitis, skin irritation' },
  { code: 'L23.9', description: 'Allergic contact dermatitis, unspecified cause', chapter: 'Diseases of the skin and subcutaneous tissue', category: 'L20-L30', isBillable: true, synonyms: 'contact dermatitis, allergic rash' },
  { code: 'L20.9', description: 'Atopic dermatitis, unspecified', chapter: 'Diseases of the skin and subcutaneous tissue', category: 'L20-L30', isBillable: true, synonyms: 'eczema, atopic dermatitis' },
  { code: 'L03.90', description: 'Cellulitis, unspecified', chapter: 'Diseases of the skin and subcutaneous tissue', category: 'L00-L08', isBillable: true, synonyms: 'cellulitis, skin infection' },
  { code: 'L70.0', description: 'Acne vulgaris', chapter: 'Diseases of the skin and subcutaneous tissue', category: 'L60-L75', isBillable: true, synonyms: 'acne, pimples, breakout' },
  { code: 'L50.9', description: 'Urticaria, unspecified', chapter: 'Diseases of the skin and subcutaneous tissue', category: 'L49-L54', isBillable: true, synonyms: 'hives, urticaria' },
  { code: 'L29.9', description: 'Pruritus, unspecified', chapter: 'Diseases of the skin and subcutaneous tissue', category: 'L27-L30', isBillable: true, synonyms: 'itching, itchy skin, pruritus' },

  // ── Musculoskeletal (M00-M99) ───────────────────────────────────────
  { code: 'M54.50', description: 'Low back pain, unspecified', chapter: 'Diseases of the musculoskeletal system', category: 'M50-M54', isBillable: true, synonyms: 'back pain, low back pain, lumbago' },
  { code: 'M25.50', description: 'Pain in unspecified joint', chapter: 'Diseases of the musculoskeletal system', category: 'M20-M25', isBillable: true, synonyms: 'joint pain, arthralgia' },
  { code: 'M79.10', description: 'Myalgia, unspecified site', chapter: 'Diseases of the musculoskeletal system', category: 'M60-M79', isBillable: true, synonyms: 'muscle pain, myalgia, body aches' },
  { code: 'M62.830', description: 'Muscle spasm of back', chapter: 'Diseases of the musculoskeletal system', category: 'M60-M79', isBillable: true, synonyms: 'back spasm, muscle spasm' },
  { code: 'M19.90', description: 'Unspecified osteoarthritis, unspecified site', chapter: 'Diseases of the musculoskeletal system', category: 'M15-M19', isBillable: true, synonyms: 'osteoarthritis, arthritis, joint degeneration' },
  { code: 'M54.2', description: 'Cervicalgia', chapter: 'Diseases of the musculoskeletal system', category: 'M50-M54', isBillable: true, synonyms: 'neck pain, cervicalgia' },

  // ── Nervous system (G00-G99) ────────────────────────────────────────
  { code: 'G43.909', description: 'Migraine, unspecified, not intractable, without status migrainosus', chapter: 'Diseases of the nervous system', category: 'G40-G47', isBillable: true, synonyms: 'migraine, migraine headache' },
  { code: 'G47.00', description: 'Insomnia, unspecified', chapter: 'Diseases of the nervous system', category: 'G40-G47', isBillable: true, synonyms: 'insomnia, trouble sleeping, cant sleep' },
  { code: 'G47.30', description: 'Sleep apnea, unspecified', chapter: 'Diseases of the nervous system', category: 'G40-G47', isBillable: true, synonyms: 'sleep apnea, snoring, obstructive sleep apnea' },

  // ── Mental/behavioural (F01-F99) ────────────────────────────────────
  { code: 'F41.1', description: 'Generalized anxiety disorder', chapter: 'Mental, behavioural and neurodevelopmental disorders', category: 'F40-F48', isBillable: true, synonyms: 'anxiety, generalized anxiety, gad, worrying' },
  { code: 'F41.9', description: 'Anxiety disorder, unspecified', chapter: 'Mental, behavioural and neurodevelopmental disorders', category: 'F40-F48', isBillable: true, synonyms: 'anxiety, anxious, nervousness' },
  { code: 'F32.9', description: 'Major depressive disorder, single episode, unspecified', chapter: 'Mental, behavioural and neurodevelopmental disorders', category: 'F30-F39', isBillable: true, synonyms: 'depression, feeling depressed, low mood' },
  { code: 'F33.9', description: 'Major depressive disorder, recurrent, unspecified', chapter: 'Mental, behavioural and neurodevelopmental disorders', category: 'F30-F39', isBillable: true, synonyms: 'recurrent depression, chronic depression' },
  { code: 'F43.10', description: 'Post-traumatic stress disorder, unspecified', chapter: 'Mental, behavioural and neurodevelopmental disorders', category: 'F40-F48', isBillable: true, synonyms: 'ptsd, post traumatic stress disorder, trauma' },
  { code: 'F51.01', description: 'Primary insomnia', chapter: 'Mental, behavioural and neurodevelopmental disorders', category: 'F51-F59', isBillable: true, synonyms: 'insomnia, sleeplessness' },

  // ── Blood/immune (D50-D89) ───────────────────────────────────────────
  { code: 'D64.9', description: 'Anemia, unspecified', chapter: 'Diseases of the blood and blood-forming organs', category: 'D60-D64', isBillable: true, synonyms: 'anemia, low blood count, anaemia' },
  { code: 'D50.9', description: 'Iron deficiency anemia, unspecified', chapter: 'Diseases of the blood and blood-forming organs', category: 'D50-D53', isBillable: true, synonyms: 'iron deficiency, low iron, anaemia' },
  { code: 'D69.6', description: 'Thrombocytopenia, unspecified', chapter: 'Diseases of the blood and blood-forming organs', category: 'D65-D69', isBillable: true, synonyms: 'low platelets, thrombocytopenia' },

  // ── Eye/ear (H00-H95) ────────────────────────────────────────────────
  { code: 'H10.9', description: 'Unspecified conjunctivitis', chapter: 'Diseases of the eye and adnexa', category: 'H10-H11', isBillable: true, synonyms: 'pink eye, conjunctivitis, red eye' },
  { code: 'H66.90', description: 'Otitis media, unspecified, unspecified ear', chapter: 'Diseases of the ear and mastoid process', category: 'H65-H75', isBillable: true, synonyms: 'ear infection, otitis media' },
  { code: 'H61.20', description: 'Impacted cerumen, unspecified ear', chapter: 'Diseases of the ear and mastoid process', category: 'H60-H62', isBillable: true, synonyms: 'ear wax, cerumen impaction, blocked ear' },
  { code: 'H92.09', description: 'Otalgia, unspecified ear', chapter: 'Diseases of the ear and mastoid process', category: 'H90-H94', isBillable: true, synonyms: 'ear pain, earache, otalgia' },

  // ── Symptoms, signs, abnormal findings (R00-R99) ────────────────────
  { code: 'R50.9', description: 'Fever, unspecified', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R50-R69', isBillable: true, synonyms: 'fever, high temperature, febrile' },
  { code: 'R05.9', description: 'Cough, unspecified', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R00-R09', isBillable: true, synonyms: 'cough' },
  { code: 'R07.0', description: 'Pain in throat', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R00-R09', isBillable: true, synonyms: 'sore throat, throat pain' },
  { code: 'R10.9', description: 'Unspecified abdominal pain', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R10-R19', isBillable: true, synonyms: 'stomach ache, abdominal pain, belly pain' },
  { code: 'R11.0', description: 'Nausea', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R10-R19', isBillable: true, synonyms: 'nausea, feeling sick, queasy' },
  { code: 'R42', description: 'Dizziness and giddiness', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R40-R46', isBillable: true, synonyms: 'dizziness, lightheaded, vertigo' },
  { code: 'R51.9', description: 'Headache, unspecified', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R50-R69', isBillable: true, synonyms: 'headache' },
  { code: 'R53.83', description: 'Other fatigue', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R50-R69', isBillable: true, synonyms: 'fatigue, tiredness, low energy, exhaustion' },
  { code: 'R06.02', description: 'Shortness of breath', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R00-R09', isBillable: true, synonyms: 'shortness of breath, breathlessness, dyspnea' },
  { code: 'R07.9', description: 'Chest pain, unspecified', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R00-R09', isBillable: true, synonyms: 'chest pain' },
  { code: 'R21', description: 'Rash and other nonspecific skin eruption', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R20-R23', isBillable: true, synonyms: 'skin rash, rash, eruption' },
  { code: 'R60.9', description: 'Edema, unspecified', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R50-R69', isBillable: true, synonyms: 'swelling, edema, fluid retention' },
  { code: 'R19.7', description: 'Diarrhea, unspecified', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R10-R19', isBillable: true, synonyms: 'diarrhea, loose stools' },
  // Added for the symptom catalog (src/constants/symptoms.ts, ICD-10 spec §7.2)
  // — every code a patient-reported symptom can suggest must live here too.
  { code: 'R68.83', description: 'Chills (without fever)', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R50-R69', isBillable: true, synonyms: 'chills, shivering' },
  { code: 'R63.4', description: 'Abnormal weight loss', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R60-R69', isBillable: true, synonyms: 'weight loss, losing weight, unintentional weight loss' },
  { code: 'R63.5', description: 'Abnormal weight gain', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R60-R69', isBillable: true, synonyms: 'weight gain, gaining weight' },
  { code: 'R09.81', description: 'Nasal congestion', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R00-R09', isBillable: true, synonyms: 'nasal congestion, stuffy nose, blocked nose' },
  { code: 'R06.2', description: 'Wheezing', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R00-R09', isBillable: true, synonyms: 'wheezing, whistling breath' },
  { code: 'R49.0', description: 'Dysphonia', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R47-R49', isBillable: true, synonyms: 'hoarseness, hoarse voice, dysphonia' },
  { code: 'R11.10', description: 'Vomiting, unspecified', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R10-R19', isBillable: true, synonyms: 'vomiting, throwing up' },
  { code: 'R63.0', description: 'Anorexia', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R60-R69', isBillable: true, synonyms: 'loss of appetite, not hungry, poor appetite' },
  { code: 'R12', description: 'Heartburn', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R10-R19', isBillable: true, synonyms: 'heartburn, acid reflux feeling' },
  { code: 'R14.0', description: 'Abdominal distension (gaseous)', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R10-R19', isBillable: true, synonyms: 'bloating, gassy, abdominal distension' },
  { code: 'R23.3', description: 'Spontaneous ecchymoses', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R20-R23', isBillable: true, synonyms: 'bruising easily, easy bruising' },
  { code: 'R30.0', description: 'Dysuria', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R30-R39', isBillable: true, synonyms: 'painful urination, burning urination, dysuria' },
  { code: 'R35.0', description: 'Frequency of micturition', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R30-R39', isBillable: true, synonyms: 'frequent urination, urinating often' },
  { code: 'R31.9', description: 'Hematuria, unspecified', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R30-R39', isBillable: true, synonyms: 'blood in urine, hematuria' },
  { code: 'R00.2', description: 'Palpitations', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R00-R09', isBillable: true, synonyms: 'palpitations, racing heart, heart pounding' },
  { code: 'R00.8', description: 'Other abnormal heart beat', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R00-R09', isBillable: true, synonyms: 'irregular heartbeat, skipped beat, heart flutter' },
  { code: 'R20.2', description: 'Paresthesia of skin', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R20-R23', isBillable: true, synonyms: 'numbness, tingling, pins and needles' },
  { code: 'R45.82', description: 'Worries', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R40-R46', isBillable: true, synonyms: 'anxiety, worrying, feeling anxious' },
  { code: 'R45.2', description: 'Unhappiness', chapter: 'Symptoms, signs and abnormal clinical findings', category: 'R40-R46', isBillable: true, synonyms: 'low mood, feeling down, sadness' },

  // ── Pregnancy/reproductive (O00-O9A, Z34) ───────────────────────────
  { code: 'Z34.90', description: 'Encounter for supervision of normal pregnancy, unspecified, unspecified trimester', chapter: 'Factors influencing health status', category: 'Z30-Z39', isBillable: true, synonyms: 'pregnancy checkup, prenatal visit, antenatal care' },

  // ── Well-visit / encounter (Z00-Z99) ─────────────────────────────────
  { code: 'Z00.00', description: 'Encounter for general adult medical examination without abnormal findings', chapter: 'Factors influencing health status', category: 'Z00-Z13', isBillable: true, synonyms: 'annual checkup, physical exam, wellness visit, general checkup' },
  { code: 'Z00.01', description: 'Encounter for general adult medical examination with abnormal findings', chapter: 'Factors influencing health status', category: 'Z00-Z13', isBillable: true, synonyms: 'checkup with abnormal findings, physical exam abnormal' },
  { code: 'Z01.419', description: 'Encounter for gynecological examination (general) (routine) without abnormal findings', chapter: 'Factors influencing health status', category: 'Z00-Z13', isBillable: true, synonyms: 'gyn exam, pap smear, gynecological checkup' },
  { code: 'Z23', description: 'Encounter for immunization', chapter: 'Factors influencing health status', category: 'Z20-Z29', isBillable: true, synonyms: 'vaccination, immunization, vaccine' },
  { code: 'Z71.3', description: 'Dietary counseling and surveillance', chapter: 'Factors influencing health status', category: 'Z70-Z76', isBillable: true, synonyms: 'nutrition counseling, diet counseling' },
  { code: 'Z71.89', description: 'Other specified counseling', chapter: 'Factors influencing health status', category: 'Z70-Z76', isBillable: true, synonyms: 'counseling, general counseling' },
  { code: 'Z13.220', description: 'Encounter for screening for lipoid disorders', chapter: 'Factors influencing health status', category: 'Z00-Z13', isBillable: true, synonyms: 'cholesterol screening, lipid panel, lipid screening' },
  { code: 'Z12.11', description: 'Encounter for screening for malignant neoplasm of colon', chapter: 'Factors influencing health status', category: 'Z00-Z13', isBillable: true, synonyms: 'colonoscopy, colon cancer screening' },
  { code: 'Z79.4', description: 'Long term (current) use of insulin', chapter: 'Factors influencing health status', category: 'Z77-Z99', isBillable: true, synonyms: 'on insulin, insulin therapy' },
  { code: 'Z79.899', description: 'Other long term (current) drug therapy', chapter: 'Factors influencing health status', category: 'Z77-Z99', isBillable: true, synonyms: 'long term medication, chronic medication use' },
  { code: 'Z71.9', description: 'Counseling, unspecified', chapter: 'Factors influencing health status', category: 'Z70-Z76', isBillable: true, synonyms: 'general counseling visit' },
  { code: 'Z00.129', description: 'Encounter for routine child health examination without abnormal findings', chapter: 'Factors influencing health status', category: 'Z00-Z13', isBillable: true, synonyms: 'child checkup, well child visit, pediatric exam' },

  // ── Injury/other (S00-T88) ────────────────────────────────────────────
  { code: 'S93.409A', description: 'Sprain of unspecified ligament of unspecified ankle, initial encounter', chapter: 'Injury, poisoning and certain other consequences of external causes', category: 'S90-S99', isBillable: true, synonyms: 'ankle sprain, twisted ankle' },
  { code: 'T78.40XA', description: 'Allergy, unspecified, initial encounter', chapter: 'Injury, poisoning and certain other consequences of external causes', category: 'T78', isBillable: true, synonyms: 'allergic reaction, allergy' },

  // ── Non-billable parent/header codes (for the "not billable" pill) ──
  { code: 'J06', description: 'Acute upper respiratory infections of multiple and unspecified sites', chapter: 'Diseases of the respiratory system', category: 'J00-J06', isBillable: false, synonyms: 'upper respiratory infection' },
  { code: 'E11', description: 'Type 2 diabetes mellitus', chapter: 'Endocrine, nutritional and metabolic diseases', category: 'E08-E13', isBillable: false, synonyms: 'diabetes, type 2 diabetes' },
  { code: 'M54', description: 'Dorsalgia', chapter: 'Diseases of the musculoskeletal system', category: 'M50-M54', isBillable: false, synonyms: 'back pain' },
];
