import { useMemo, useState } from 'react';
import SectorTag from '../components/SectorTag';
import { BRAND, SCORE_COLORS } from '../utils/colors';
import { formatDate } from '../utils/format';

const mono = "'JetBrains Mono', monospace";
const sans = 'Arial, sans-serif';

// Wave 9.3 (2026-05-14): Earnings tab redesigned as a running log of
// recaps in the "PM walking by your desk, 2 min to brief what happened"
// register. Primary feed: earnings_updates.delta_note (one short prose
// blurb per print). Enriched with earnings_events numbers (EPS/rev
// actual vs estimate) and the deeper analyst_team.earnings_updates
// memos (4 sections + chat_blurb_text) when an analyst has published
// one for that ticker. Cards are expandable when a deep memo exists.

const FILTERS = [
  { key: 'all',  label: 'All' },
  { key: 'beat', label: 'Beats' },
  { key: 'miss', label: 'Misses' },
  { key: 'memo', label: 'Has Memo' },
];

function indexByTickerLatest(rows) {
  const out = {};
  for (const r of rows || []) {
    if (!r?.ticker) continue;
    const cur = out[r.ticker];
    const rDate = r.report_date || r.published_at || '';
    if (!cur || (cur.report_date || cur.published_at || '') < rDate) out[r.ticker] = r;
  }
  return out;
}

function indexAnalystMemos(rows) {
  // Group by ticker; keep all memos sorted by published_at desc so we can
  // try to match to a specific print period later.
  const out = {};
  for (const r of rows || []) {
    if (!r?.ticker) continue;
    (out[r.ticker] ||= []).push(r);
  }
  for (const t of Object.keys(out)) {
    out[t].sort((a, b) => (b.published_at || '').localeCompare(a.published_at || ''));
  }
  return out;
}

function matchMemo(memosForTicker, reportDate) {
  if (!memosForTicker || memosForTicker.length === 0) return null;
  if (!reportDate) return memosForTicker[0];
  // Pick the most recent memo whose published_at is >= report_date - 7d
  // (analyst usually publishes a few days after the print). Fall back to
  // the most recent memo overall.
  const target = new Date(reportDate);
  const cutoff = new Date(target);
  cutoff.setDate(cutoff.getDate() - 7);
  for (const m of memosForTicker) {
    const pub = m.published_at ? new Date(m.published_at) : null;
    if (pub && pub >= cutoff) return m;
  }
  return memosForTicker[0];
}

function fmtSurprise(actual, estimate) {
  if (actual == null || estimate == null || estimate === 0) return null;
  const surprise = ((actual - estimate) / Math.abs(estimate)) * 100;
  return `${surprise > 0 ? '+' : ''}${surprise.toFixed(1)}%`;
}

function fmtUsdMillions(val) {
  if (val == null) return null;
  const n = Number(val);
  if (Number.isNaN(n)) return null;
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(2)}`;
}

function MemoSection({ label, body }) {
  if (!body) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{
        fontFamily: sans,
        fontSize: 9,
        fontWeight: 700,
        color: BRAND.gold,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: sans,
        fontSize: 11.5,
        lineHeight: 1.55,
        color: BRAND.text,
        whiteSpace: 'pre-wrap',
      }}>
        {body}
      </div>
    </div>
  );
}

function EarningsCard({ row, event, memo, onTickerClick }) {
  const [expanded, setExpanded] = useState(false);
  const beat = (row.beat_miss || '').toLowerCase() === 'beat';
  const miss = (row.beat_miss || '').toLowerCase() === 'miss';
  const epsSurprise = event ? fmtSurprise(event.eps_actual, event.eps_estimated) : null;
  const revSurprise = event ? fmtSurprise(event.revenue_actual, event.revenue_estimated) : null;

  return (
    <div style={{
      background: BRAND.card,
      border: `1px solid ${BRAND.border}`,
      borderRadius: 5,
      overflow: 'hidden',
    }}>
      {/* Header strip */}
      <div style={{
        background: BRAND.navyDark,
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
      }}>
        <button
          type="button"
          onClick={() => onTickerClick?.(row.ticker)}
          style={{
            display: 'inline-block',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontFamily: mono,
            fontWeight: 700,
            fontSize: 13,
            color: BRAND.white,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = BRAND.gold; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = BRAND.white; }}
        >
          {row.ticker}
        </button>
        {row.sector && <SectorTag sector={row.sector} />}
        {row.report_date && (
          <span style={{ fontFamily: mono, fontSize: 10, color: BRAND.muted }}>
            {formatDate(row.report_date)}
          </span>
        )}
        {(beat || miss) && (
          <span style={{
            display: 'inline-block',
            background: beat ? SCORE_COLORS.green : SCORE_COLORS.red,
            color: '#fff',
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            borderRadius: 9999,
            padding: '2px 8px',
            letterSpacing: 0.4,
          }}>
            {beat ? 'Beat' : 'Miss'}
          </span>
        )}
        {memo && (
          <span style={{
            display: 'inline-block',
            border: `1px solid ${BRAND.gold}`,
            color: BRAND.gold,
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            borderRadius: 3,
            padding: '1px 6px',
            letterSpacing: 0.4,
          }}>
            {memo.analyst_initials} memo
          </span>
        )}
      </div>

      {/* Numbers strip (if available) */}
      {event && (event.eps_actual != null || event.revenue_actual != null) && (
        <div style={{
          padding: '8px 12px',
          display: 'flex',
          gap: 18,
          flexWrap: 'wrap',
          borderBottom: `1px solid ${BRAND.border}`,
          fontFamily: mono,
          fontSize: 11,
        }}>
          {event.eps_actual != null && (
            <span>
              <span style={{ color: BRAND.muted }}>EPS </span>
              <span style={{ color: BRAND.text, fontWeight: 700 }}>
                ${Number(event.eps_actual).toFixed(2)}
              </span>
              {event.eps_estimated != null && (
                <span style={{ color: BRAND.textSecondary }}>
                  {' '}vs ${Number(event.eps_estimated).toFixed(2)}E
                </span>
              )}
              {epsSurprise && (
                <span style={{
                  marginLeft: 6,
                  color: epsSurprise.startsWith('+') ? SCORE_COLORS.green : SCORE_COLORS.red,
                }}>
                  ({epsSurprise})
                </span>
              )}
            </span>
          )}
          {event.revenue_actual != null && (
            <span>
              <span style={{ color: BRAND.muted }}>Rev </span>
              <span style={{ color: BRAND.text, fontWeight: 700 }}>
                {fmtUsdMillions(event.revenue_actual)}
              </span>
              {event.revenue_estimated != null && (
                <span style={{ color: BRAND.textSecondary }}>
                  {' '}vs {fmtUsdMillions(event.revenue_estimated)}E
                </span>
              )}
              {revSurprise && (
                <span style={{
                  marginLeft: 6,
                  color: revSurprise.startsWith('+') ? SCORE_COLORS.green : SCORE_COLORS.red,
                }}>
                  ({revSurprise})
                </span>
              )}
            </span>
          )}
        </div>
      )}

      {/* Body — the 2-min brief */}
      <div style={{ padding: '10px 12px' }}>
        {/* Chat blurb if memo present takes precedence — that's the analyst's hot take */}
        {memo?.chat_blurb_text && !row.delta_note && (
          <div style={{
            fontFamily: sans,
            fontSize: 12,
            lineHeight: 1.55,
            color: BRAND.text,
            whiteSpace: 'pre-wrap',
          }}>
            {memo.chat_blurb_text}
          </div>
        )}
        {row.delta_note && (
          <div style={{
            fontFamily: sans,
            fontSize: 12,
            lineHeight: 1.55,
            color: BRAND.text,
            whiteSpace: 'pre-wrap',
          }}>
            {row.delta_note}
          </div>
        )}
        {!row.delta_note && !memo?.chat_blurb_text && (
          <div style={{
            fontFamily: sans,
            fontSize: 11,
            fontStyle: 'italic',
            color: BRAND.muted,
          }}>
            No recap written yet for this print.
          </div>
        )}

        {memo && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            style={{
              display: 'inline-block',
              background: 'none',
              border: 'none',
              padding: '6px 0 0 0',
              cursor: 'pointer',
              marginTop: 4,
              fontFamily: sans,
              fontSize: 10,
              fontWeight: 700,
              color: BRAND.gold,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
            }}
          >
            {expanded ? '▾ Hide deep memo' : '▸ Expand deep memo'}
          </button>
        )}

        {expanded && memo && (
          <div style={{ marginTop: 4 }}>
            {memo.chat_blurb_text && row.delta_note && (
              <MemoSection label="Chat blurb" body={memo.chat_blurb_text} />
            )}
            <MemoSection label="Print summary" body={memo.section_1_print_summary_md} />
            <MemoSection label="Thesis check" body={memo.section_2_thesis_check_md} />
            <MemoSection label="Capital structure check" body={memo.section_3_capital_structure_check_md} />
            <MemoSection label="Forward view" body={memo.section_4_forward_view_md} />
            <MemoSection label="vs prior quarter" body={memo.prior_quarter_delta_md} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Earnings({ data, sectorFilter, onTickerClick }) {
  const [filter, setFilter] = useState('all');

  const { rows, eventMap, memoIndex } = useMemo(() => {
    const updates = data?.earnings_updates || [];
    const events = data?.earnings_events || [];
    const memos = (data?.analyst_team?.earnings_updates) || [];
    // Dedupe by (ticker, report_date) — the staging script can emit
    // multiple rows per print across staged_date refreshes. Keep the
    // newest revision (latest staged_date, falling back to created_at).
    const byKey = new Map();
    for (const u of updates) {
      if (!u?.ticker || !u?.report_date) continue;
      const key = `${u.ticker}|${u.report_date}`;
      const prev = byKey.get(key);
      const uStamp = u.staged_date || u.created_at || '';
      const pStamp = prev ? (prev.staged_date || prev.created_at || '') : '';
      if (!prev || uStamp > pStamp) byKey.set(key, u);
    }
    const deduped = Array.from(byKey.values());
    return {
      rows: deduped.sort((a, b) =>
        (b.report_date || '').localeCompare(a.report_date || '')
      ),
      eventMap: indexByTickerLatest(events),
      memoIndex: indexAnalystMemos(memos),
    };
  }, [data]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (sectorFilter && sectorFilter !== 'all') {
        if ((r.sector || '').toLowerCase() !== sectorFilter.toLowerCase()) return false;
      }
      if (filter === 'beat' && (r.beat_miss || '').toLowerCase() !== 'beat') return false;
      if (filter === 'miss' && (r.beat_miss || '').toLowerCase() !== 'miss') return false;
      if (filter === 'memo') {
        if (!(memoIndex[r.ticker] && memoIndex[r.ticker].length > 0)) return false;
      }
      return true;
    });
  }, [rows, filter, sectorFilter, memoIndex]);

  const totalCounts = useMemo(() => {
    const beats = rows.filter((r) => (r.beat_miss || '').toLowerCase() === 'beat').length;
    const misses = rows.filter((r) => (r.beat_miss || '').toLowerCase() === 'miss').length;
    const withMemo = rows.filter((r) => memoIndex[r.ticker]?.length > 0).length;
    return { total: rows.length, beats, misses, withMemo };
  }, [rows, memoIndex]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header strip — counts + filter chips */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        padding: '4px 0',
      }}>
        <span style={{ fontFamily: sans, fontSize: 11, color: BRAND.muted }}>
          <span style={{ color: BRAND.text, fontWeight: 700 }}>{totalCounts.total}</span> prints
          {' · '}
          <span style={{ color: SCORE_COLORS.green }}>{totalCounts.beats} beats</span>
          {' · '}
          <span style={{ color: SCORE_COLORS.red }}>{totalCounts.misses} misses</span>
          {' · '}
          <span style={{ color: BRAND.gold }}>{totalCounts.withMemo} have memos</span>
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  fontFamily: sans,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                  padding: '4px 9px',
                  borderRadius: 3,
                  background: active ? BRAND.gold : 'transparent',
                  color: active ? BRAND.navyDark : BRAND.muted,
                  border: `1px solid ${active ? BRAND.gold : BRAND.border}`,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: BRAND.muted,
          fontFamily: sans,
          fontSize: 12,
          fontStyle: 'italic',
          padding: 40,
        }}>
          No earnings recaps for current filter.
        </div>
      ) : (
        filtered.map((row, i) => (
          <EarningsCard
            key={`${row.ticker}-${row.report_date || i}`}
            row={row}
            event={eventMap[row.ticker]}
            memo={matchMemo(memoIndex[row.ticker], row.report_date)}
            onTickerClick={onTickerClick}
          />
        ))
      )}
    </div>
  );
}
