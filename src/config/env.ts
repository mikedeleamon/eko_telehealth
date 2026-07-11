/**
 * Central runtime configuration.
 *
 * Values come from EXPO_PUBLIC_* environment variables (see .env.example).
 * Anything prefixed EXPO_PUBLIC_ is inlined into the JS bundle at build time,
 * so never put secrets here — only public URLs and feature flags.
 */

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';

export const env = {
  /** Base URL of the Eko Telehealth backend, e.g. https://api.ekotelehealth.com */
  apiUrl,

  /**
   * When true (or when no API URL is configured) all data comes from the
   * in-app mock adapter so the app is fully navigable without a backend.
   */
  useMockApi: process.env.EXPO_PUBLIC_USE_MOCK_API === 'true' || !apiUrl,

  /** Realtime provider for chat + calls: 'mock' today, 'twilio' once wired. */
  realtimeProvider: (process.env.EXPO_PUBLIC_REALTIME_PROVIDER ?? 'mock') as 'mock' | 'twilio',

  /** Request timeout in ms for API calls. */
  requestTimeoutMs: 15000,
};
