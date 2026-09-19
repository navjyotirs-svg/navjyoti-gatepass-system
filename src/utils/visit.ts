export type VisitStatus = 'not_checked_in' | 'checked_in' | 'checked_out';

export function formatIstTime(value?: string | null) {
  if (!value) return 'Not Yet';
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(value)).toUpperCase();
}

export function formatIstDateTime(value?: string | null) {
  if (!value) return 'Not Yet';
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(value));
}

export function formatDuration(minutes?: number | null) {
  if (minutes == null) return 'Not Yet';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours > 0 ? `${hours}h ${remainder}m` : `${remainder}m`;
}

export function liveDuration(checkInAt?: string | null) {
  if (!checkInAt) return '—';
  return formatDuration(Math.max(0, Math.floor((Date.now() - new Date(checkInAt).getTime()) / 60000)));
}

