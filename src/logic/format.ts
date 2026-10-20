const DAY = 86400000;

export function fmtDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${fmtDate(iso)}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

export function daysSince(iso: string, now = Date.now()): number {
  return Math.floor((now - new Date(iso).getTime()) / DAY);
}

export function relative(iso?: string): string {
  if (!iso) return '—';
  const d = daysSince(iso);
  if (d <= 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 45) return `${d} days ago`;
  const m = Math.round(d / 30.4);
  return m < 12 ? `${m} months ago` : `${Math.round(m / 12)} year${m >= 18 ? 's' : ''} ago`;
}

export function plural(n: number, word: string, pluralWord = `${word}s`): string {
  return `${n} ${n === 1 ? word : pluralWord}`;
}
