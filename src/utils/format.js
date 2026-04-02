import { SCORE_COLORS, BRAND } from './colors';

export function formatPct(value) {
  return `${Math.round(value * 100)}%`;
}

export function formatScore(value) {
  const str = value.toFixed(2);
  return value > 0 ? `+${str}` : str;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function formatDate(str) {
  if (!str) return '—';
  const [year, month, day] = str.split('-');
  return MONTHS[parseInt(month) - 1] + ' ' + parseInt(day);
}

export function formatDateWithYear(str) {
  if (!str) return '—';
  const [year, month, day] = str.split('-');
  return MONTHS[parseInt(month) - 1] + ' ' + parseInt(day) + ', ' + year;
}

export function formatDateTime(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d)) return '—';
  const month = MONTHS[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  let hours = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return month + ' ' + day + ', ' + year + ' ' + hours + ':' + mins + ' ' + ampm;
}

export function colorForDev(value) {
  if (value > 0.6) return SCORE_COLORS.red;
  if (value > 0.4) return SCORE_COLORS.yellow;
  return SCORE_COLORS.green;
}

export function colorForFund(value) {
  if (value < -0.3) return SCORE_COLORS.red;
  if (value < 0) return SCORE_COLORS.yellow;
  return SCORE_COLORS.green;
}

export function colorForMaturity(year) {
  if (year <= 2026) return SCORE_COLORS.red;
  if (year <= 2027) return SCORE_COLORS.yellow;
  return BRAND.navy;
}
