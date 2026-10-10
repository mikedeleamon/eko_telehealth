/**
 * Date math for the doctor's Scheduler and My Day. Everything here works in
 * the device's local time, which for this platform's users is Lagos time —
 * the same convention every other screen already uses for display.
 */
import type { Appointment, TimeOffBlock } from '../api/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MINUTE_MS = 60_000;
export const DAY_MS = 24 * 60 * MINUTE_MS;

/** A length nobody stored: rows booked before durations existed held one hourly slot. */
export const FALLBACK_DURATION_MINUTES = 60;

/** Statuses that still hold the doctor's time. Mirrors the backend's slot math. */
export function holdsTime(a: Appointment): boolean {
  return a.status !== 'cancelled' && a.status !== 'declined';
}

/** Local midnight of `d`. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

export function addMonths(d: Date, months: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + months, 1);
}

/** 'YYYY-MM-DD' for the local calendar day — the form the slot and time-off endpoints take. */
export function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * When an appointment starts. `startAt` when the row has one; otherwise the
 * display strings rows carried before the slot model ("Fri, Jul 24, 2026" +
 * "9:30 AM"), which the seeded demo data still uses. Returns null for
 * anything unparseable (the oldest rows' time looks like "01-02:00"), which
 * keeps them off the calendar rather than pinning them to a wrong hour.
 */
export function appointmentStart(a: Appointment): Date | null {
  if (a.startAt) {
    const d = new Date(a.startAt);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const date = /([A-Za-z]{3}) (\d{1,2}), (\d{4})/.exec(a.date ?? '');
  const time = /^(\d{1,2}):(\d{2})\s*([AP]M)$/i.exec((a.time ?? '').trim());
  if (!date || !time) return null;
  const month = MONTHS.indexOf(date[1]);
  if (month < 0) return null;
  let hour = Number(time[1]) % 12;
  if (time[3].toUpperCase() === 'PM') hour += 12;
  return new Date(Number(date[3]), month, Number(date[2]), hour, Number(time[2]));
}

export function appointmentDuration(a: Appointment): number {
  return a.durationMinutes ?? FALLBACK_DURATION_MINUTES;
}

export function appointmentEnd(a: Appointment, start: Date): Date {
  return new Date(start.getTime() + appointmentDuration(a) * MINUTE_MS);
}

export interface ScheduledAppointment {
  appointment: Appointment;
  start: Date;
  end: Date;
}

/** Appointments that can be placed on a calendar, earliest first. */
export function placeAppointments(list: Appointment[]): ScheduledAppointment[] {
  return list
    .map((appointment) => {
      const start = appointmentStart(appointment);
      return start ? { appointment, start, end: appointmentEnd(appointment, start) } : null;
    })
    .filter((x): x is ScheduledAppointment => x !== null)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** The part of each block that falls on `day`, for the day view's banners. */
export function blocksOnDay(blocks: TimeOffBlock[], day: Date): { block: TimeOffBlock; allDay: boolean; start: Date; end: Date }[] {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = dayStart + DAY_MS;
  return blocks
    .map((block) => {
      const start = new Date(block.startAt).getTime();
      const end = new Date(block.endAt).getTime();
      if (start >= dayEnd || end <= dayStart) return null;
      const clippedStart = Math.max(start, dayStart);
      const clippedEnd = Math.min(end, dayEnd);
      return {
        block,
        // Covers the whole day, whether entered as all-day or as a long window.
        allDay: clippedStart === dayStart && clippedEnd === dayEnd,
        start: new Date(clippedStart),
        end: new Date(clippedEnd),
      };
    })
    .filter((x): x is { block: TimeOffBlock; allDay: boolean; start: Date; end: Date } => x !== null)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** BCP-47 tag for the app's locale, for Intl date/time formatting. */
export function localeTag(locale: string): string {
  return locale === 'fr' ? 'fr-FR' : 'en-US';
}

/** "9:00 AM" (en) / "09:00" (fr). */
export function formatTime(d: Date, locale: string): string {
  return d.toLocaleTimeString(localeTag(locale), { hour: 'numeric', minute: '2-digit' });
}

/** "9:00 – 10:00 AM"-style range, each end formatted on its own. */
export function formatTimeRange(start: Date, end: Date, locale: string): string {
  return `${formatTime(start, locale)} – ${formatTime(end, locale)}`;
}

/** "8 Oct, Thu" — the reference design's day label. */
export function formatDayLabel(d: Date, locale: string): string {
  const tag = localeTag(locale);
  const day = d.getDate();
  const month = d.toLocaleDateString(tag, { month: 'short' });
  const weekday = d.toLocaleDateString(tag, { weekday: 'short' });
  return `${day} ${month}, ${weekday}`;
}

/** "Thu, Oct 8" style, for lists. */
export function formatShortDate(d: Date, locale: string): string {
  return d.toLocaleDateString(localeTag(locale), { weekday: 'short', month: 'short', day: 'numeric' });
}

/** "OCTOBER, 2026" — the reference design's month heading. */
export function formatMonthHeading(d: Date, locale: string): string {
  const month = d.toLocaleDateString(localeTag(locale), { month: 'long' });
  return `${month.toUpperCase()}, ${d.getFullYear()}`;
}

/** "1 hr", "2 hrs", "30 min", "1 hr 30 min" — `t` supplies the localized units. */
export function formatDuration(minutes: number, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const parts: string[] = [];
  if (hours) parts.push(t('scheduler.durationHours', { count: hours }));
  if (rest || !hours) parts.push(t('scheduler.durationMinutes', { count: rest }));
  return parts.join(' ');
}

/**
 * The visit lengths a booking starting at `startAt` can take across
 * back-to-back open slots — mirrors the backend's contiguousDurations, so the
 * form only ever offers a length the server will accept.
 */
export function contiguousDurations(slots: { startAt: string; durationMinutes?: number }[], startAt: string): number[] {
  const byStart = new Map(slots.map((s) => [new Date(s.startAt).getTime(), s]));
  const durations: number[] = [];
  let total = 0;
  let cursor = byStart.get(new Date(startAt).getTime());
  while (cursor) {
    const length = cursor.durationMinutes ?? FALLBACK_DURATION_MINUTES;
    total += length;
    durations.push(total);
    cursor = byStart.get(new Date(cursor.startAt).getTime() + length * MINUTE_MS);
  }
  return durations;
}
