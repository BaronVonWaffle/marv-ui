const REBRAND_WINDOW_DAYS = 30;

function daysBetween(isoA, isoB) {
  const a = new Date(`${isoA}T00:00:00Z`);
  const b = new Date(`${isoB}T00:00:00Z`);
  if (isNaN(a) || isNaN(b)) return Infinity;
  return Math.round((b - a) / 86400000);
}

export function isSuppressed(ticker, tickerStatus) {
  if (!ticker || !tickerStatus) return false;
  return tickerStatus[ticker]?.status === 'suppressed';
}

export function tickerDisplay(ticker, tickerStatus, todayIso) {
  const info = tickerStatus?.[ticker];
  if (!info || info.status !== 'rebranded' || !info.equity_ticker || !info.as_of) {
    return { primary: ticker, suffix: null };
  }
  const today = todayIso || new Date().toISOString().slice(0, 10);
  const days = daysBetween(info.as_of, today);
  if (days >= 0 && days <= REBRAND_WINDOW_DAYS) {
    return { primary: info.equity_ticker, suffix: `(was ${ticker})` };
  }
  return { primary: ticker, suffix: null };
}
