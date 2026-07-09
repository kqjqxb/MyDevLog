import { differenceInCalendarDays, format, formatDistanceToNowStrict, parseISO } from 'date-fns';

/** "3 days ago", "5 minutes ago", etc. */
export function relativeTime(iso: string): string {
  try {
    return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true });
  } catch {
    return '';
  }
}

/** Absolute date formatted as DD.MM.YYYY. */
export function absoluteDate(iso: string): string {
  try {
    return format(parseISO(iso), 'MM.dd.yyyy');
  } catch {
    return '';
  }
}

/** Whole calendar days between the given ISO date and now (never negative). */
export function daysSince(iso: string): number {
  try {
    return Math.max(0, differenceInCalendarDays(new Date(), parseISO(iso)));
  } catch {
    return 0;
  }
}
