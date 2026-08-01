/**
 * ICD-10 code source. Two implementations behind one interface (spec D6): a
 * bundled local subset for instant offline type-ahead, and a server search
 * for the long tail. searchIcd10() is what the picker actually calls — it
 * merges both, local entries winning on dedup, with the remote leg silently
 * dropped on failure so the picker keeps working offline.
 */
import { api } from '../../api';
import type { Icd10Code } from '../../api/types';
import { ICD10_SUBSET, type Icd10SubsetEntry } from '../../constants/icd10';

export interface Icd10Source {
  search(query: string, opts?: { limit?: number; signal?: AbortSignal }): Promise<Icd10Code[]>;
  get(code: string): Promise<Icd10Code | null>;
}

const REMOTE_DEBOUNCE_MS = 200;
const DEFAULT_LIMIT = 25;

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\./g, '');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toPublicCode(entry: Icd10SubsetEntry): Icd10Code {
  const { code, description, chapter, category, isBillable } = entry;
  return { code, description, chapter, category, isBillable };
}

/**
 * Ranking per spec §4.2: exact code, code prefix, description starts-with,
 * description word-boundary contains, synonym match. Ties break on
 * isBillable first, then alphabetically by code.
 */
function rankLocal(query: string, limit: number): Icd10SubsetEntry[] {
  const normalizedQuery = normalize(query);
  const looseQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const wordBoundary = new RegExp(`\\b${escapeRegExp(looseQuery)}`);
  const scored: { entry: Icd10SubsetEntry; rank: number }[] = [];

  for (const entry of ICD10_SUBSET) {
    const normalizedCode = normalize(entry.code);
    const description = entry.description.toLowerCase();
    const synonyms = entry.synonyms.toLowerCase();

    let rank: number | null = null;
    if (normalizedCode === normalizedQuery) rank = 0;
    else if (normalizedCode.startsWith(normalizedQuery)) rank = 1;
    else if (description.startsWith(looseQuery)) rank = 2;
    else if (wordBoundary.test(description)) rank = 3;
    else if (synonyms.split(',').some((s) => s.trim().includes(looseQuery))) rank = 4;

    if (rank !== null) scored.push({ entry, rank });
  }

  scored.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    if (a.entry.isBillable !== b.entry.isBillable) return a.entry.isBillable ? -1 : 1;
    return a.entry.code.localeCompare(b.entry.code);
  });

  return scored.slice(0, limit).map((s) => s.entry);
}

/** In-memory search over the bundled subset — runs on every keystroke. */
export const localSource: Icd10Source = {
  async search(query, opts) {
    return rankLocal(query, opts?.limit ?? DEFAULT_LIMIT).map(toPublicCode);
  },
  async get(code) {
    const entry = ICD10_SUBSET.find((e) => e.code === code);
    return entry ? toPublicCode(entry) : null;
  },
};

/** GET /reference/icd10 — the long tail. Failure is silent by design. */
export const remoteSource: Icd10Source = {
  async search(query, opts) {
    try {
      return await api.reference.searchIcd10(query, opts?.limit ?? DEFAULT_LIMIT);
    } catch {
      return [];
    }
  },
  async get(code) {
    try {
      return await api.reference.getIcd10(code);
    } catch {
      return null;
    }
  },
};

let remoteDebounceTimer: ReturnType<typeof setTimeout> | null = null;
/** Settles a superseded call's remote leg with [] instead of leaving it
 *  hanging forever when a newer keystroke cancels its timer. */
let resolvePendingRemote: ((codes: Icd10Code[]) => void) | null = null;

/**
 * Paints local matches immediately, then merges server matches in, deduped by
 * code with local entries winning. Server failure is silent — the picker
 * keeps working offline on the subset alone. Debounced 200ms on the remote
 * leg only; local runs unthrottled.
 */
export function searchIcd10(query: string, opts?: { limit?: number; signal?: AbortSignal }): Promise<Icd10Code[]> {
  const limit = opts?.limit ?? DEFAULT_LIMIT;
  const localPromise = localSource.search(query, { limit, signal: opts?.signal });

  if (remoteDebounceTimer) {
    clearTimeout(remoteDebounceTimer);
    resolvePendingRemote?.([]);
  }
  const remotePromise = new Promise<Icd10Code[]>((resolve) => {
    resolvePendingRemote = resolve;
    remoteDebounceTimer = setTimeout(() => {
      resolvePendingRemote = null;
      remoteSource.search(query, { limit, signal: opts?.signal }).then(resolve, () => resolve([]));
    }, REMOTE_DEBOUNCE_MS);
  });

  return Promise.all([localPromise, remotePromise]).then(([local, remote]) => {
    const seenCodes = new Set(local.map((c) => c.code));
    const merged = [...local, ...remote.filter((r) => !seenCodes.has(r.code))];
    return merged.slice(0, limit);
  });
}
