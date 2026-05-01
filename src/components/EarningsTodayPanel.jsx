import { useMemo } from 'react';
import SectorTag from './SectorTag';
import { BRAND, SCORE_COLORS } from '../utils/colors';

const sans = 'Arial, sans-serif';
const mono = "'JetBrains Mono', monospace";

const sectionLabel = {
  fontSize: 10,
  fontWeight: 700,
  fontFamily: sans,
  textTransform: 'uppercase',
  color: BRAND.gold,
  letterSpacing: 1.2,
  marginBottom: 6,
};

function pickAnalystEarnings(data, days = 3) {
  // analyst_team.earnings_updates is an array of {ticker, year, quarter,
  // published_at, analyst_initials, section_1_print_summary_md, ...}
  const all = data?.analyst_team?.earnings_updates || [];
  if (!Array.isArray(all) || all.length === 0) return [];
  const today = (data?.snapshot_generated_at || data?.generated_at || '').slice(0, 10)
    || new Date().toISOString().slice(0, 10);
  const todayMs = Date.parse(today + 'T00:00:00Z');
  const lookbackMs = days * 86400000;
  return all
    .filter((u) => {
      if (!u?.published_at) return false;
      const pub = Date.parse(u.published_at.replace(' ', 'T'));
      if (isNaN(pub)) return false;
      return pub >= todayMs - lookbackMs;
    })
    .sort((a, b) => (a.published_at < b.published_at ? 1 : -1))
    .slice(0, 5);
}

function pickUpcomingEarnings(data, days = 2) {
  // upcoming_events from overnight pipeline; filter to next N days, earnings only.
  const events = data?.upcoming_events || [];
  const issuers = data?.issuers || [];
  const issuerByTicker = {};
  for (const r of issuers) if (r?.ticker) issuerByTicker[r.ticker] = r;
  const today = (data?.snapshot_generated_at || data?.generated_at || '').slice(0, 10)
    || new Date().toISOString().slice(0, 10);
  const todayMs = Date.parse(today + 'T00:00:00Z');
  const horizonMs = days * 86400000;
  const out = [];
  for (const ev of events) {
    if (!ev?.event_date) continue;
    const evMs = Date.parse(ev.event_date + 'T00:00:00Z');
    if (isNaN(evMs)) continue;
    if (evMs < todayMs || evMs > todayMs + horizonMs) continue;
    const name = String(ev.event_name || '').toLowerCase();
    const isEarnings = ev.event_type === 'earnings'
      || (ev.event_type === 'investor_conference' && name.includes('earnings'));
    if (!isEarnings) continue;
    let tickers = [];
    if (Array.isArray(ev.presenting_tickers)) tickers = ev.presenting_tickers;
    else if (typeof ev.presenting_tickers === 'string') {
      try { const p = JSON.parse(ev.presenting_tickers); if (Array.isArray(p)) tickers = p; } catch {}
    }
    if (tickers.length !== 1) continue;
    const t = tickers[0];
    const issuer = issuerByTicker[t];
    out.push({ date: ev.event_date, ticker: t, sector: issuer?.sector, name: ev.event_name });
  }
  out.sort((a, b) => a.date.localeCompare(b.date) || a.ticker.localeCompare(b.ticker));
  return out.slice(0, 5);
}

function takeawayLine(md) {
  if (!md) return '';
  // Take the first non-header substantive line.
  const lines = md.split(/\r?\n/).map((l) => l.trim());
  for (const line of lines) {
    if (!line) continue;
    if (/^#/.test(line)) continue;
    if (/^\*\*Q\d|FY\d/.test(line)) continue;
    // Strip leading bullet/asterisk markers
    const cleaned = line.replace(/^[·•\-*]\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '');
    if (cleaned.length < 20) continue;
    return cleaned.length > 140 ? cleaned.slice(0, 140).trimEnd() + '…' : cleaned;
  }
  return '';
}

function PublishedRow({ row, onTickerClick }) {
  const takeaway = takeawayLine(row.section_1_print_summary_md);
  const qLabel = row.quarter && row.year ? `Q${row.quarter} ${row.year}` : '';
  return (
    <button
      onClick={() => onTickerClick?.(row.ticker)}
      style={{
        all: 'unset',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '9px 14px',
        width: '100%',
        boxSizing: 'border-box',
        cursor: 'pointer',
        borderBottom: `1px solid ${BRAND.border}`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = BRAND.cardHover; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: mono, fontWeight: 700, fontSize: 12, color: BRAND.text }}>
          {row.ticker}
        </span>
        <span
          style={{
            fontFamily: mono,
            fontSize: 9,
            color: BRAND.gold,
            background: 'rgba(200,164,78,0.12)',
            padding: '1px 5px',
            borderRadius: 3,
            letterSpacing: 0.5,
          }}
        >
          REPORTED · {qLabel}
        </span>
        <span
          style={{
            fontFamily: mono,
            fontSize: 9.5,
            color: BRAND.textSecondary,
            marginLeft: 'auto',
            letterSpacing: 0.3,
          }}
        >
          {row.analyst_initials}
        </span>
      </span>
      {takeaway && (
        <span
          style={{
            fontFamily: sans,
            fontSize: 10.5,
            color: BRAND.textSecondary,
            lineHeight: 1.45,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {takeaway}
        </span>
      )}
    </button>
  );
}

function UpcomingRow({ row, onTickerClick, today }) {
  const isToday = row.date === today;
  return (
    <button
      onClick={() => onTickerClick?.(row.ticker)}
      style={{
        all: 'unset',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        width: '100%',
        boxSizing: 'border-box',
        cursor: 'pointer',
        borderBottom: `1px solid ${BRAND.border}`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = BRAND.cardHover; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ fontFamily: mono, fontWeight: 700, fontSize: 12, color: BRAND.text, minWidth: 60 }}>
        {row.ticker}
      </span>
      {row.sector && <SectorTag sector={row.sector} />}
      <span
        style={{
          fontFamily: mono,
          fontSize: 9,
          color: isToday ? SCORE_COLORS.yellow : BRAND.textSecondary,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          marginLeft: 'auto',
        }}
      >
        {isToday ? 'Today' : 'Tomorrow'}
      </span>
    </button>
  );
}

export default function EarningsTodayPanel({ data, onTickerClick }) {
  const recent = useMemo(() => pickAnalystEarnings(data, 3), [data]);
  const upcoming = useMemo(() => pickUpcomingEarnings(data, 2), [data]);
  const today = (data?.snapshot_generated_at || data?.generated_at || '').slice(0, 10)
    || new Date().toISOString().slice(0, 10);

  const empty = recent.length === 0 && upcoming.length === 0;

  return (
    <div>
      <div style={sectionLabel}>Earnings — Recent + Next 48h</div>
      <div
        style={{
          background: BRAND.card,
          border: `1px solid ${BRAND.border}`,
          borderRadius: 5,
          overflow: 'hidden',
        }}
      >
        {empty ? (
          <div style={{ padding: 16, fontFamily: sans, fontSize: 10.5, color: BRAND.muted, fontStyle: 'italic' }}>
            No recent earnings or upcoming reports in the next 48 hours.
          </div>
        ) : (
          <>
            {recent.map((r) => (
              <PublishedRow key={`${r.ticker}-${r.year}-${r.quarter}`} row={r} onTickerClick={onTickerClick} />
            ))}
            {upcoming.map((r) => (
              <UpcomingRow
                key={`${r.ticker}-${r.date}`}
                row={r}
                onTickerClick={onTickerClick}
                today={today}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
