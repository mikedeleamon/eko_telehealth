# ICD-10 Integration — Full Spec

**Status:** approved for build · **Date:** 2026-07-28
**Repos touched:** `eko_telehealth` (Expo app), `eko_telehealth_backend` (Express + Drizzle + Postgres)

---

## 1. Scope

### In

| Surface | What it gets |
|---|---|
| Provider — visit notes | Coded primary + secondary diagnoses on the SOAP record, replacing free-text strings |
| Provider — problem list | Add/resolve coded chronic + ongoing conditions on a patient's chart |
| Provider — code search | Text search over code + description + lay synonyms, plus per-provider favorites and recents |
| Patient — problem list | Read-only "My Conditions" view of active/resolved coded conditions |
| Patient — symptom logging | Plain-language symptom log whose entries carry a *suggested* code, surfaced to the provider as code candidates |
| Patient — visit notes | Diagnoses rendered as descriptions, with the code available but de-emphasized |

### Out (deliberately deferred)

- **Prescription ↔ diagnosis linkage.** Not selected. The schema below leaves room (`prescriptions.indication_code`) but nothing is built.
- **Claims / billing export.** `is_billable` is captured so the data is claim-ready later, but there is no 837/superbill generation.
- **AI code suggestion from note text.** Explicitly rejected in favor of search + favorites. Symptom-driven *candidates* (§7.2) are a deterministic lookup, not a model.
- **ICD-11 / SNOMED CT.** `code_system` is carried on every coded value so a second system is additive, not a migration.

---

## 2. Decisions and rationale

**D1 — A diagnosis is an object, not a string.** `primaryDiagnosis: string` becomes `primaryDiagnosis: CodedDiagnosis`. The clinician's own phrasing survives as `label`; the canonical ICD-10 text lives in `description`.

**D2 — `description` is denormalized onto every record at write time.** ICD-10-CM is revised annually (Oct 1). A signed note must say the same thing in 2030 that it said the day it was signed. The reference table is a lookup, never a join for display of a historical record.

**D3 — Codes are optional; finalization nudges, it does not block.** A clinician mid-consult who cannot find a code must still be able to sign the note. Blocking produces garbage codes, which is worse than no code. Finalize shows a dismissible "no code attached" warning. `canFinalize` in `MedicalNotes.tsx:144` keeps requiring a *primary diagnosis* — it just no longer requires that diagnosis to be coded.

**D4 — Patient-reported symptoms and provider diagnoses are separate tables.** A symptom the patient logged must never silently become a diagnosis on their chart. The symptom log's `suggested_code` is an input to the provider's picker, nothing more.

**D5 — Access control stays in route middleware, not RLS.** The backend is Express + Drizzle over Supabase-hosted Postgres, with `requireAuth` + `auditAccess` on clinical routes (`practice.ts`). ICD-10 tables follow the same pattern — no Postgres RLS policies are introduced, because nothing else in the codebase uses them and a split enforcement model is a security liability.

**D6 — Bundled subset first, remote lookup behind the same interface.** A curated ~1,200-code asset ships in the app for instant, offline type-ahead. A server search endpoint covers the long tail. One `Icd10Source` interface; a future external terminology API is a third implementation.

---

## 3. Data model

### 3.1 Shared type — `src/api/types.ts`

Insert above `PatientVisitNote` (currently line ~296):

```ts
/** Terminology a coded value came from. Only ICD-10-CM ships in v1. */
export type CodeSystem = 'icd10cm';

/**
 * A diagnosis as recorded on a clinical record. `description` is the canonical
 * terminology text COPIED AT WRITE TIME — a later ICD-10 revision must never
 * change what a signed note said. `label` is the clinician's own phrasing when
 * they overrode it, and is what renders when present.
 *
 * `code` is optional: a record may carry a diagnosis that was never coded
 * (legacy free-text records, or a clinician who could not find the code and
 * finalized anyway). Such a record is valid and displays normally.
 */
export interface CodedDiagnosis {
  code?: string;                 // 'J06.9'
  description: string;           // 'Acute upper respiratory infection, unspecified'
  label?: string;                // clinician override, e.g. 'Viral URI'
  codeSystem?: CodeSystem;       // absent when code is absent
  /** Provider certainty. Drives patient-facing wording (see §7.1). */
  status?: 'confirmed' | 'provisional' | 'ruled_out';
}

/** A code as it comes back from search — reference data, not a record. */
export interface Icd10Code {
  code: string;
  description: string;
  chapter?: string;
  category?: string;
  /** Leaf codes only. Non-billable parents are shown with a warning. */
  isBillable: boolean;
}

/** Clinical status of an entry on the patient's problem list. */
export type ConditionStatus = 'active' | 'resolved' | 'inactive';

export interface PatientCondition {
  id: string;
  patientId: string;
  /** Set when the condition belongs to the account holder's dependent. */
  dependentId?: string;
  dependentName?: string;
  diagnosis: CodedDiagnosis;
  clinicalStatus: ConditionStatus;
  /** ISO date (YYYY-MM-DD), both optional — onset is often unknown. */
  onsetDate?: string;
  resolvedDate?: string;
  /** Provenance: the visit note that introduced this condition, if any. */
  sourceNoteId?: string;
  addedByName: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PatientConditionInput {
  patientId: string;
  diagnosis: CodedDiagnosis;
  clinicalStatus?: ConditionStatus;   // defaults 'active'
  onsetDate?: string;
  sourceNoteId?: string;
  notes?: string;
}

/** Patient-reported symptom. NEVER a diagnosis — see D4. */
export interface SymptomLog {
  id: string;
  /** Stable key into the curated symptom catalog, e.g. 'sore_throat'. */
  symptomKey: string;
  /** Localized display label, resolved at read time from the catalog. */
  label: string;
  /** Candidate code for the provider's picker. Never shown to the patient. */
  suggestedCode?: string;
  severity?: 1 | 2 | 3 | 4 | 5;
  /** ISO date the patient says it started. */
  startedAt: string;
  /** Set when the patient logged this against a specific upcoming visit. */
  appointmentId?: string;
  notes?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface SymptomLogInput {
  symptomKey: string;
  severity?: 1 | 2 | 3 | 4 | 5;
  startedAt: string;
  appointmentId?: string;
  notes?: string;
}
```

### 3.2 Changed types

```ts
// PatientVisitNote (types.ts:296) — patient projection
-  primaryDiagnosis?: string;
-  secondaryDiagnoses?: string[];
+  primaryDiagnosis?: CodedDiagnosis;
+  secondaryDiagnoses?: CodedDiagnosis[];

// MedicalNote (types.ts:313) — same two fields, same change.
// `assessment` stays as-is: legacy free text, mirrors the primary diagnosis's
// display text for new records.

// MedicalNoteInput (types.ts:356) — same two fields, same change.
```

### 3.3 Backend — Drizzle schema (`src/db/schema.ts`)

```ts
/**
 * ICD-10-CM reference data. Read-only to every client; written only by the
 * seed script (see scripts/seed-icd10.ts). Not user data — no audit logging,
 * no per-user scoping.
 */
export const icd10Codes = pgTable('icd10_codes', {
  code: text('code').primaryKey(),                  // 'J06.9'
  description: text('description').notNull(),
  chapter: text('chapter'),                         // 'Diseases of the respiratory system'
  category: text('category'),                       // 'J00-J06'
  /** Leaf codes are billable; parent/header codes are not. */
  isBillable: boolean('is_billable').notNull().default(true),
  /** Lay terms folded into search: 'sore throat, head cold, chest infection'. */
  synonyms: text('synonyms').notNull().default(''),
  /** Set when a code is retired by an annual revision. Retired codes remain
   *  readable (old notes reference them) but are excluded from search. */
  retiredAt: timestamp('retired_at', { withTimezone: true }),
});

/**
 * Per-provider code shortlist. `useCount` and `lastUsedAt` drive the recents
 * ranking; `pinned` overrides it. Written on every note finalize.
 */
export const providerCodeFavorites = pgTable(
  'provider_code_favorites',
  {
    doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
    code: text('code').notNull().references(() => icd10Codes.code),
    useCount: integer('use_count').notNull().default(0),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }).defaultNow().notNull(),
    pinned: boolean('pinned').notNull().default(false),
  },
  (t) => ({ pk: primaryKey({ columns: [t.doctorId, t.code] }) }),
);

/**
 * The patient problem list — coded conditions that persist across visits,
 * as opposed to a diagnosis recorded on one note. `patientId` holds a
 * roster-patient id (no FK), matching medicalNotes/prescriptions/labs.
 */
export const patientConditions = pgTable('patient_conditions', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').notNull(),
  /** Set when the condition belongs to the account holder's dependent —
   *  derived the same way medicalNotes.dependentId is. */
  dependentId: uuid('dependent_id').references(() => dependents.id),
  code: text('code').references(() => icd10Codes.code),
  /** Denormalized at write time — see D2. Required even when code is null. */
  description: text('description').notNull(),
  label: text('label'),
  codeSystem: text('code_system').$type<'icd10cm'>(),
  clinicalStatus: text('clinical_status')
    .$type<'active' | 'resolved' | 'inactive'>()
    .notNull()
    .default('active'),
  onsetDate: text('onset_date'),        // YYYY-MM-DD
  resolvedDate: text('resolved_date'),
  /** Provenance — which note introduced it. Nullable: a provider can add a
   *  historical condition outside a visit. */
  sourceNoteId: uuid('source_note_id').references(() => medicalNotes.id, { onDelete: 'set null' }),
  addedBy: uuid('added_by').references(() => doctors.id),
  addedByName: text('added_by_name').notNull().default(''),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

/**
 * Patient-reported symptoms. Deliberately NOT a diagnosis table (D4): the
 * suggested code is a search hint for the provider's picker and is never
 * rendered to the patient as a finding.
 */
export const symptomLogs = pgTable('symptom_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  dependentId: uuid('dependent_id').references(() => dependents.id),
  /** Key into the curated catalog shipped in the app (src/constants/symptoms.ts). */
  symptomKey: text('symptom_key').notNull(),
  suggestedCode: text('suggested_code').references(() => icd10Codes.code),
  severity: integer('severity'),        // 1..5
  startedAt: text('started_at').notNull(),
  appointmentId: uuid('appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
  notes: text('notes'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Icd10CodeRow = typeof icd10Codes.$inferSelect;
export type PatientConditionRow = typeof patientConditions.$inferSelect;
export type SymptomLogRow = typeof symptomLogs.$inferSelect;
```

**`medicalNotes` change:**

```ts
-  primaryDiagnosis: text('primary_diagnosis'),
-  secondaryDiagnoses: jsonb('secondary_diagnoses').$type<string[]>().notNull().default([]),
+  primaryDiagnosis: jsonb('primary_diagnosis').$type<CodedDiagnosis | null>(),
+  secondaryDiagnoses: jsonb('secondary_diagnoses').$type<CodedDiagnosis[]>().notNull().default([]),
```

Diagnoses on a note are jsonb rather than relational because a finalized note is immutable — there is nothing to update, and no query needs to join through them. A future "how many patients did I code J06.9 for" report reads `patient_conditions` or a jsonb GIN index, not a join table.

**`auditLog.resourceType`** gains `'patient_condition'`:

```ts
resourceType: text('resource_type')
  .$type<'document' | 'prescription' | 'lab' | 'medical_note' | 'patient_condition'>()
  .notNull(),
```

### 3.4 Migration — `migrations/0031_icd10_diagnosis_coding.sql`

```sql
-- ICD-10 diagnosis coding across notes, the problem list and symptom logging.
--
-- Three things happen here:
--   1. Reference data (icd10_codes) with a tsvector index, seeded separately
--      by scripts/seed-icd10.ts — the migration creates the shape, not the rows.
--   2. medical_notes.primary_diagnosis / secondary_diagnoses convert from
--      text/text[] to jsonb CodedDiagnosis. Existing free-text values are
--      preserved as { description } with NO code — they display normally and
--      report as uncoded. Nothing is discarded and nothing is guessed.
--   3. New tables: provider_code_favorites, patient_conditions, symptom_logs.
--
-- Access control is enforced in route middleware (requireAuth + auditAccess),
-- consistent with every other clinical table here. No RLS policies.
--
--   psql "$DATABASE_URL" -f migrations/0031_icd10_diagnosis_coding.sql

-- ── 1. Reference data ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS icd10_codes (
  code        text PRIMARY KEY,
  description text NOT NULL,
  chapter     text,
  category    text,
  is_billable boolean NOT NULL DEFAULT true,
  synonyms    text NOT NULL DEFAULT '',
  retired_at  timestamptz
);

ALTER TABLE icd10_codes
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', code), 'A') ||
    setweight(to_tsvector('english', description), 'B') ||
    setweight(to_tsvector('english', synonyms), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS icd10_codes_search_idx ON icd10_codes USING gin (search_vector);
-- Prefix match on the code itself ('J06' → J06.9) needs its own index; the
-- tsvector handles whole tokens, not prefixes.
CREATE INDEX IF NOT EXISTS icd10_codes_code_prefix_idx ON icd10_codes (code text_pattern_ops);

-- ── 2. Convert existing diagnoses to jsonb ────────────────────────────────
ALTER TABLE medical_notes
  ALTER COLUMN primary_diagnosis TYPE jsonb
  USING CASE
    WHEN primary_diagnosis IS NULL OR btrim(primary_diagnosis) = '' THEN NULL
    ELSE jsonb_build_object('description', primary_diagnosis)
  END;

ALTER TABLE medical_notes
  ALTER COLUMN secondary_diagnoses TYPE jsonb
  USING COALESCE(
    (SELECT jsonb_agg(jsonb_build_object('description', d))
       FROM jsonb_array_elements_text(secondary_diagnoses) AS d
      WHERE btrim(d) <> ''),
    '[]'::jsonb
  );

ALTER TABLE medical_notes ALTER COLUMN secondary_diagnoses SET DEFAULT '[]'::jsonb;

-- ── 3. New tables ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS provider_code_favorites (
  doctor_id    uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  code         text NOT NULL REFERENCES icd10_codes(code),
  use_count    integer NOT NULL DEFAULT 0,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  pinned       boolean NOT NULL DEFAULT false,
  PRIMARY KEY (doctor_id, code)
);
CREATE INDEX IF NOT EXISTS provider_code_favorites_rank_idx
  ON provider_code_favorites (doctor_id, pinned DESC, last_used_at DESC);

CREATE TABLE IF NOT EXISTS patient_conditions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL,
  dependent_id    uuid REFERENCES dependents(id),
  code            text REFERENCES icd10_codes(code),
  description     text NOT NULL,
  label           text,
  code_system     text,
  clinical_status text NOT NULL DEFAULT 'active',
  onset_date      text,
  resolved_date   text,
  source_note_id  uuid REFERENCES medical_notes(id) ON DELETE SET NULL,
  added_by        uuid REFERENCES doctors(id),
  added_by_name   text NOT NULL DEFAULT '',
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz
);
CREATE INDEX IF NOT EXISTS patient_conditions_patient_idx
  ON patient_conditions (patient_id, clinical_status);
-- One ACTIVE row per (patient, dependent, code): re-diagnosing something the
-- patient already has should update the existing entry, not duplicate it.
CREATE UNIQUE INDEX IF NOT EXISTS patient_conditions_active_uniq
  ON patient_conditions (patient_id, COALESCE(dependent_id, '00000000-0000-0000-0000-000000000000'::uuid), code)
  WHERE clinical_status = 'active' AND code IS NOT NULL;

CREATE TABLE IF NOT EXISTS symptom_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dependent_id   uuid REFERENCES dependents(id),
  symptom_key    text NOT NULL,
  suggested_code text REFERENCES icd10_codes(code),
  severity       integer,
  started_at     text NOT NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  notes          text,
  resolved_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS symptom_logs_user_idx ON symptom_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS symptom_logs_appointment_idx ON symptom_logs (appointment_id);
```

**Rollback note.** Step 2 is lossy in one direction only: converting jsonb back to text recovers `description` but drops any attached code. Take a `pg_dump` of `medical_notes` before running.

---

## 4. Code source strategy

### 4.1 The curated subset

`src/constants/icd10.ts` — a generated asset, not hand-maintained:

```ts
/** Generated by scripts/build-icd10-subset.ts — do not edit by hand. */
export const ICD10_SUBSET: Icd10Code[] = [ /* ~1,200 entries */ ];
export const ICD10_SUBSET_VERSION = '2026-10-01';
```

Selection rule for the subset, in priority order:

1. Every code appearing in the top ~300 primary-care presenting complaints (URI, hypertension, T2DM, asthma, UTI, gastroenteritis, malaria, anaemia, dermatitis, anxiety, depression, back pain, migraine…).
2. Every code reachable from the symptom catalog in §7.2.
3. Codes matching Eko's active specialties, from the specialty list already in `src/constants`.
4. `Z00–Z99` encounter codes for well visits, screening and follow-ups — these dominate telehealth volume and are routinely missing from clinical-only subsets.

Each entry carries hand-written `synonyms` in lay language. This is the single highest-leverage field in the whole feature: "sore throat" → J02.9 is what makes the picker feel fast.

### 4.2 The source interface

`src/services/icd10/index.ts`:

```ts
export interface Icd10Source {
  search(query: string, opts?: { limit?: number; signal?: AbortSignal }): Promise<Icd10Code[]>;
  get(code: string): Promise<Icd10Code | null>;
}

export const localSource: Icd10Source;   // in-memory over ICD10_SUBSET
export const remoteSource: Icd10Source;  // GET /reference/icd10?q=

/**
 * Paints local matches immediately, then merges server matches in, deduped by
 * code with local entries winning. Server failure is silent — the picker keeps
 * working offline on the subset alone.
 */
export function searchIcd10(query: string, opts?): Promise<Icd10Code[]>;
```

Local search: normalize (lowercase, strip periods from the query so `j069` and `J06.9` both hit), then rank —

1. exact code match
2. code prefix match
3. description starts-with
4. description word-boundary contains
5. synonym match

Ties break on `isBillable` first, then alphabetically by code. Debounce 200 ms on the remote leg only; local runs on every keystroke.

---

## 5. API surface

### 5.1 Backend routes

**`src/routes/reference.ts`** (new, mounted at `/reference`, auth required, **not** audit-logged — reference data is not patient data):

```
GET /reference/icd10?q=<query>&limit=<n>       → Icd10Code[]
GET /reference/icd10/:code                     → Icd10Code | 404
```

Search implementation:

```sql
SELECT code, description, chapter, category, is_billable
  FROM icd10_codes
 WHERE retired_at IS NULL
   AND (search_vector @@ websearch_to_tsquery('english', $1)
        OR code LIKE upper($2) || '%')
 ORDER BY (code LIKE upper($2) || '%') DESC,
          ts_rank(search_vector, websearch_to_tsquery('english', $1)) DESC,
          is_billable DESC
 LIMIT $3;
```

**`src/routes/practice.ts`** (additions, all `auditAccess`-wrapped where they touch patient data):

```
GET    /practice/patients/:patientId/conditions          → PatientCondition[]
POST   /practice/patients/:patientId/conditions          → PatientCondition
PATCH  /practice/conditions/:id                          → PatientCondition
       body: { clinicalStatus?, resolvedDate?, notes?, onsetDate? }
GET    /practice/patients/:patientId/symptoms            → SymptomLog[]
GET    /practice/icd10/favorites                         → Icd10Code[] (ranked)
POST   /practice/icd10/favorites/:code/pin               → 204
DELETE /practice/icd10/favorites/:code/pin               → 204
```

`PATCH /practice/conditions/:id` is the only mutation on an existing condition, and it cannot change the code — a wrong code is resolved and a new condition added, preserving the record of what was believed and when.

Note finalize side effect, inside the existing `POST /notes` and `PATCH /notes/:noteId` handlers, in the same transaction:

```ts
// Every code used on a finalized note bumps the author's shortlist.
for (const dx of [input.primaryDiagnosis, ...(input.secondaryDiagnoses ?? [])]) {
  if (!dx?.code || status !== 'final') continue;
  await db.insert(providerCodeFavorites)
    .values({ doctorId: docId!, code: dx.code, useCount: 1 })
    .onConflictDoUpdate({
      target: [providerCodeFavorites.doctorId, providerCodeFavorites.code],
      set: { useCount: sql`${providerCodeFavorites.useCount} + 1`, lastUsedAt: new Date() },
    });
}
```

Favorites ranking: `pinned DESC, (use_count * exp(-days_since_last_use / 60)) DESC` — recency-decayed frequency, so a code used heavily last year yields to one used twice last week.

**`src/routes/me.ts`** (patient side):

```
GET    /me/conditions                        → PatientCondition[]
GET    /me/dependents/:id/conditions         → PatientCondition[]
GET    /me/symptoms                          → SymptomLog[]
POST   /me/symptoms                          → SymptomLog
PATCH  /me/symptoms/:id                      → SymptomLog   (severity, notes, resolvedAt)
DELETE /me/symptoms/:id                      → 204          (own log, soft-delete)
```

Patients cannot write conditions. The "this looks wrong" affordance in §7.3 opens the existing support/message flow; it does not mutate the chart.

### 5.2 Zod schemas (`practice.ts`)

```ts
const codedDiagnosisSchema = z.object({
  code: z.string().max(10).optional(),
  description: z.string().min(1).max(300),
  label: z.string().max(300).optional(),
  codeSystem: z.literal('icd10cm').optional(),
  status: z.enum(['confirmed', 'provisional', 'ruled_out']).optional(),
});

// noteInputSchema changes:
-  primaryDiagnosis: z.string().optional(),
-  secondaryDiagnoses: z.array(z.string()).optional(),
+  primaryDiagnosis: codedDiagnosisSchema.optional(),
+  secondaryDiagnoses: z.array(codedDiagnosisSchema).max(12).optional(),
```

**Server-side validation on write:** when `code` is present, the server looks it up in `icd10_codes` and overwrites `description` and `codeSystem` from the table. The client never gets to define what a code means. Unknown code → 422.

### 5.3 App API layer (`src/api/index.ts`)

Following the existing mock-parity pattern exactly:

```ts
reference: {
  /** GET /reference/icd10?q= — server-side long-tail search. Local subset
   *  search happens in services/icd10 and never reaches this. */
  searchIcd10(q: string, limit = 25): Promise<Icd10Code[]> {
    if (env.useMockApi) return mockApi.searchIcd10(q, limit);
    return request<Icd10Code[]>(`/reference/icd10?q=${encodeURIComponent(q)}&limit=${limit}`);
  },
},
```

plus `api.practice.conditions/addCondition/updateCondition/patientSymptoms/codeFavorites/pinCode` and `api.me.conditions/symptoms/logSymptom/updateSymptom`. Every one gets a mock adapter twin in `src/api/mock/mockApi.ts` so the app keeps running with `useMockApi`.

### 5.4 Query keys and hooks (`src/hooks/queries.ts`)

```ts
icd10Search: (q: string) => ['icd10-search', q] as const,
codeFavorites: ['icd10-favorites'] as const,
patientConditions: (patientId: string) => ['patient-conditions', patientId] as const,
myConditions: ['my-conditions'] as const,
dependentConditions: (id: string) => ['dependent-conditions', id] as const,
patientSymptoms: (patientId: string) => ['patient-symptoms', patientId] as const,
mySymptoms: ['my-symptoms'] as const,
```

Hooks: `useIcd10Search`, `useCodeFavorites`, `usePatientConditions`, `useAddCondition`, `useUpdateCondition`, `useMyConditions`, `useMySymptoms`, `useLogSymptom`, `usePatientSymptoms`.

Cache policy: `icd10Search` and `codeFavorites` get `staleTime: Infinity` and `gcTime: 24h` — reference data does not change during a session. `useAddCondition` invalidates `patientConditions` and `myConditions`.

---

## 6. Provider UX

### 6.1 `DiagnosisPicker` — new shared component

`src/components/medical/DiagnosisPicker.tsx`. A bottom-sheet modal, following the existing `pickerOpen` modal pattern in `MedicalNotes.tsx:83`.

```ts
interface DiagnosisPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (dx: CodedDiagnosis) => void;
  /** Codes already on the note — shown checked, selecting again removes. */
  selected: CodedDiagnosis[];
  /** Suggested from the patient's symptom log + active conditions. */
  candidates?: Icd10Code[];
  patientId: string;
}
```

Three tabs. **Frequent** is the default tab, not Search:

| Tab | Contents |
|---|---|
| **Frequent** | Pinned codes first, then recency-decayed recents from `useCodeFavorites`. Above them, a "For this patient" band: active problem-list entries and symptom-log candidates. |
| **Search** | Debounced type-ahead over `searchIcd10()`. Empty state explains you can search by code or plain language. |
| **Browse** | Chapter → category → code drill-down, from the `chapter`/`category` columns. The fallback when the clinician knows the neighborhood but not the term. |

Row anatomy: monospace code · description · a `★` pin toggle · a warning pill on `isBillable === false` reading *"Not billable — pick a more specific code"*. Tapping the row selects; tapping the pill does not block selection (D3 applies to specificity too).

After selecting, an inline "Rename for this note" affordance sets `label`, and a segmented control sets `status` (Confirmed / Provisional / Ruled out), defaulting to Confirmed.

Accessibility: every row gets `accessibilityRole="button"` and an `accessibilityLabel` of `` `${code}: ${description}` `` — the code alone is unreadable aloud. Theming via `useTheme()` + `makeStyles(Colors)`, matching `VisitNotesScreen.tsx:99`.

### 6.2 `MedicalNotes.tsx` — assessment section rewrite

State (replacing lines 91–92, 135–138):

```ts
const [primaryDiagnosis, setPrimaryDiagnosis] = useState<CodedDiagnosis | null>(note?.primaryDiagnosis ?? null);
const [secondaryDiagnoses, setSecondaryDiagnoses] = useState<CodedDiagnosis[]>(note?.secondaryDiagnoses ?? []);
const [pickerTarget, setPickerTarget] = useState<'primary' | 'secondary' | null>(null);
```

`renderAssessment()` (line 207) becomes:

- **Read-only:** primary as `label ?? description` in body text, with the code beneath in a muted monospace pill. Secondaries as a bulleted list, same treatment. Uncoded legacy diagnoses render identically minus the pill — no "missing data" styling on historical records.
- **Editable:** primary is a tappable row that opens the picker (not a `TextInput`). Secondaries are chips with an `×`; a `+ Add diagnosis` row appends. Long-press-drag reorders secondaries.
- A **"Free text instead"** escape hatch below the primary row opens a plain `TextInput` producing `{ description }` with no code. This is what keeps D3 honest — the escape hatch must be visible, not buried.

`buildInput` (line 152):

```ts
assessment: displayText(primaryDiagnosis),       // legacy mirror: label ?? description
primaryDiagnosis: primaryDiagnosis ?? undefined,
secondaryDiagnoses,
```

`canFinalize` (line 144) becomes `canDraft && !!primaryDiagnosis` — a diagnosis is still required, coding is not.

Finalize confirmation dialog gains a line when any diagnosis lacks a code: *"1 diagnosis has no ICD-10 code. You can finalize anyway."* — informational, with the primary button still "Finalize".

### 6.3 Problem-list write on finalize

After a successful finalize, if any diagnosis is `status: 'confirmed'` and is not already an active condition for that patient, show a sheet:

> **Add to this patient's ongoing conditions?**
> ☑ E11.9 — Type 2 diabetes mellitus without complications
> ☐ J06.9 — Acute upper respiratory infection

Default-checked for codes in chronic-leaning chapters (E00–E89 endocrine/metabolic, I00–I99 circulatory, F01–F99 mental/behavioural, plus a curated chronic set flagged in the subset asset); default-unchecked otherwise. One confirm posts them all with `sourceNoteId` set.

This is the only automatic write to the problem list, and it is always user-confirmed.

### 6.4 Provider problem-list view

A **Conditions** card on `PatientProfileScreen.tsx`, above prescriptions: active conditions with onset date and "added by", collapsed resolved ones behind a "Show resolved" toggle. Row actions: *Resolve* (sets `clinicalStatus: 'resolved'`, `resolvedDate` today), *Mark inactive*, *Edit onset/notes*.

---

## 7. Patient UX

### 7.1 Visit notes — `VisitNotesScreen.tsx`

Line 31 currently flattens diagnoses into a string array. It becomes:

```ts
const diagnoses = [item.primaryDiagnosis, ...(item.secondaryDiagnoses ?? [])]
  .filter(Boolean) as CodedDiagnosis[];
```

Rendering rules:

- **Text is the description, always.** `label ?? description`. Never the code as the headline.
- The code renders beneath, small, muted, monospace, long-press to copy — labelled *"Clinical code"*, not "ICD-10", which means nothing to a patient. It exists for insurance forms and second opinions, which is a real and frequent need.
- `status: 'provisional'` renders a *"Suspected"* chip; `'ruled_out'` renders *"Ruled out"* in muted styling. Showing a ruled-out code with no qualifier is actively harmful.
- Uncoded diagnoses render with no pill and no placeholder.

### 7.2 Symptom logging

**Catalog** — `src/constants/symptoms.ts`, ~60 entries:

```ts
export interface SymptomCatalogEntry {
  key: string;                 // 'sore_throat'
  labelKey: string;            // i18n key — EN/FR both required
  bodySystem: 'general' | 'respiratory' | 'digestive' | 'skin' | 'pain' | 'mental' | ...;
  /** ICD-10 R-chapter symptom code, NOT a diagnosis. */
  suggestedCode?: string;      // 'R07.0' for sore throat
}
```

Codes come from R00–R99 (*Symptoms, signs and abnormal findings*) wherever one exists — that chapter exists precisely for "patient reports X, no diagnosis yet", which is exactly what a patient log is. Mapping a patient report to a diagnostic code like J02.9 would be a category error.

**Screen** — `src/screens/main/health/SymptomLogScreen.tsx`, reached from `MyHealthScreen` (which routes by label at lines 48–51) and from Appointment Details as *"Tell your doctor what's going on"* before a visit.

Flow: browse or search the catalog by plain language → pick → set severity (1–5, worded not numbered: "Mild" … "Severe") → set start date → optional free-text note. The list shows active symptoms with a "Resolved" swipe action. **Codes are never displayed on this screen.**

**Provider payoff** — when a provider opens the note authoring screen, `usePatientSymptoms(patientId)` fetches logs from the last 30 days and any tied to this appointment. Their `suggestedCode` values, plus the codes on active problem-list entries, become the `candidates` band at the top of the picker's Frequent tab, headed *"For this patient"*. Each candidate shows its provenance: *"Patient reported: sore throat, 3 days"*.

That band is the entire return on coding the patient side. Without it, symptom logging is a nicer text box.

### 7.3 My Conditions

`src/screens/main/health/MyConditionsScreen.tsx`, registered in `TabNavigator.tsx` alongside `Labs` and `VisitNotes`, and surfaced as a tile on `MyHealthScreen`.

Active conditions first (description, onset, "added by Dr. X on <date>", link to the source visit note), resolved below a divider. Read-only. A footer row — *"Something here look wrong?"* — opens the existing complaint/support thread pre-filled with the condition reference. Under `useDependents`, a person switcher at top reuses the pattern already in the prescriptions/labs dependent screens.

---

## 8. i18n

All new strings land in `src/i18n/locales/en.ts` and `fr.ts` together — the app ships EN/FR and a missing FR key is a visible defect. New namespaces:

- `diagnosis.*` — picker chrome: `searchPlaceholder`, `frequent`, `browse`, `notBillable`, `notBillableHelp`, `renameForNote`, `confirmed`, `provisional`, `ruledOut`, `freeTextInstead`, `noCodeWarning`, `addToConditions`.
- `conditions.*` — `title`, `active`, `resolved`, `showResolved`, `onsetDate`, `addedBy`, `resolve`, `markInactive`, `looksWrong`, `emptyState`.
- `symptoms.*` — `title`, `logSymptom`, `severity1`…`severity5`, `startedWhen`, `stillHaveIt`, `markResolved`, plus one `symptoms.catalog.<key>` per catalog entry.

Existing `patients.primaryDiagnosisPlaceholder` (en.ts:1267) becomes the free-text escape hatch's placeholder; `patients.primaryDiagnosisRequired` (en.ts:1276) stays valid.

The FR catalog labels need a French-speaking clinician's review, not machine translation — a mistranslated symptom name is a clinical safety issue, not a polish issue.

---

## 9. Back-compat

| Concern | Handling |
|---|---|
| Existing free-text diagnoses | Migrated to `{ description }` with no code. Display unchanged. Never auto-coded — guessing a code onto a signed note is falsifying a record. |
| Old app build vs. new server | The jsonb change is breaking for clients expecting strings. Ship server + app together, or have `toNote()` emit both shapes for one release (`primaryDiagnosis` string + `primaryDiagnosisCoded` object) behind a client-version header. **Recommendation: ship together** — this app is not yet at a user base where a phased client rollout earns its complexity. |
| Mock adapter | `src/constants/index.ts:329` seeds `primaryDiagnosis: 'Streptococcal pharyngitis'`; update to `{ code: 'J02.0', description: 'Streptococcal pharyngitis', codeSystem: 'icd10cm' }` and add mock conditions/symptoms so the mock path exercises every new screen. |
| Annual ICD-10 revision | Re-run the seed script; it upserts descriptions and sets `retired_at` on codes absent from the new release. Retired codes stay readable and stay out of search. Existing records are untouched by design (D2). |

---

## 10. Safety, audit, licensing

**Audit.** `patient_conditions` reads and writes go through `auditAccess('patient_condition')`; `symptom_logs` are the patient's own data on `/me` routes and follow that convention. `icd10_codes` is not audited — it is a dictionary.

**Immutability.** A finalized note's diagnoses cannot be edited, only amended, via the existing `NoteAmendment` trail. A coding correction is an amendment, exactly like any other correction. The `PATCH /practice/conditions/:id` route cannot change `code` (§5.1).

**Clinical framing.** Nothing in the UI asserts a code is correct. The picker is documentation support; the clinician is the author of the record. No auto-selection, no "most likely code" default, no pre-filled primary.

**Licensing.** ICD-10-CM — the US clinical modification — is published by CDC/NCHS and CMS and is in the **public domain**; the annual release files can be bundled and redistributed freely. ICD-10 and ICD-11 as published by the WHO are **WHO-copyrighted**, free to use under their licence terms but with attribution and redistribution conditions. Confirm which variant Eko's target market requires before seeding. ICD-10-CM is the practical default and the only one safe to bundle without a licence review; if a WHO variant is needed, that review must precede §11 Phase 1.

---

## 11. Build order

Each phase is independently shippable and leaves the app working.

**Phase 1 — Foundation.** `CodedDiagnosis` + related types; migration `0031`; `icd10_codes` table; `scripts/build-icd10-subset.ts` and `scripts/seed-icd10.ts`; `src/constants/icd10.ts` asset; `GET /reference/icd10`; `Icd10Source` + `searchIcd10()`; mock adapter twins.
*Done when:* `searchIcd10('sore throat')` returns J02.9 offline and online, and existing notes render unchanged after migration.

**Phase 2 — Provider coding.** `DiagnosisPicker`; `MedicalNotes.tsx` assessment rewrite; favorites table + write-on-finalize + `GET /practice/icd10/favorites`; pin/unpin.
*Done when:* a clinician can code a note from Frequent in two taps, finalize without a code, and see their recents reorder on the next note.

**Phase 3 — Problem list.** `patient_conditions` routes; add-to-conditions sheet on finalize; Conditions card on `PatientProfileScreen`; carry-forward band in the picker; patient `MyConditionsScreen`.
*Done when:* a condition added at one visit appears as a one-tap candidate at the next, and the patient sees it in plain language.

**Phase 4 — Patient symptoms.** Symptom catalog; `symptom_logs` routes; `SymptomLogScreen`; the "For this patient" candidates band wired to symptom logs.
*Done when:* a symptom logged before a visit appears as a code candidate in the provider's picker during it.

**Phase 5 — Polish.** Browse tab; FR clinical review of catalog + subset descriptions; `not billable` guidance copy; empty/error states; accessibility pass on the picker.

---

## 12. Open questions

1. **Market / variant** — ICD-10-CM (public domain, US-flavored) or WHO ICD-10? Determines the licence review and changes roughly 5% of the subset's codes. Blocks Phase 1 seeding.
2. **Subset size** — 1,200 is the estimate for good primary-care coverage at a bundle cost of roughly 150–250 KB. Worth confirming against the specialty mix once the specialty list is final.
3. **Dependent conditions** — the schema supports `dependentId` on both new tables; the UI in Phase 3/4 assumes account-holder only, with dependents deferred to a follow-up. Flag if dependents should be in scope from the start.
