import { useEffect, useState } from 'react';
import { BRAND, SCORE_COLORS } from '../utils/colors';

const sans = 'Arial, sans-serif';
const mono = "'JetBrains Mono', monospace";

// Per-analyst color stripe — same convention used in ActivityFeed and
// AnalystTeamBlock. Imported inline to avoid a tiny shared util file.
// Wave 6: expanded from 4 to 13 voices.
const ANALYST_COLORS = {
  'T.W.': '#c8a44e', // Macro — gold
  'Q.T.': '#7fa3c4', // Quant — slate blue
  'A.V.': '#5eb4a9', // Chemicals — teal
  'J.R.': '#5294d0', // Machinery — blue
  'K.M.': '#d08c52', // Autos & Cyclicals — burnt orange
  'S.K.': '#a48dc8', // Tech — purple
  'F.B.': '#6fb86f', // Financials — green
  'G.W.': '#c87fa4', // TMT — magenta
  'B.L.': '#d05252', // Healthcare — red
  'N.S.': '#b4a05e', // Consumer Staples — olive
  'R.D.': '#e0934e', // Energy — amber
  'P.C.': '#5eb4d0', // Utilities — sky blue
  'D.E.': '#9ca85e', // Services — moss
};

// Wave 6: top-trade action → glyph + color (mirrors CoverageTeam.jsx).
const TRADE_ACTION_GLYPH = {
  add: { symbol: '+', color: SCORE_COLORS.green, label: 'Add' },
  trim: { symbol: '−', color: SCORE_COLORS.red, label: 'Trim' },
  watch: { symbol: '·', color: '#c8a44e', label: 'Watch' },
  avoid: { symbol: '×', color: SCORE_COLORS.red, label: 'Avoid' },
};

const ACTION_GLYPHS = {
  'Published':      '▸',
  'Revised':        '↻',
  'Propagated':     '→',
  'Logged':         '•',
  'Shift complete': '◼',
};

const CALL_TYPE_LABELS = {
  'initial':           'Initial',
  'revision':          'Revision',
  'thesis':            'Thesis',
  'situation_flag':    'Situation flag',
  'ai_tier_revision':  'AI Tier',
  'macro_dissent':     'Macro dissent',
};

function formatDate(tsStr) {
  if (!tsStr) return '—';
  const iso = tsStr.includes('T') ? tsStr : tsStr.replace(' ', 'T');
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = d.getDate();
  return `${month} ${day}`;
}

function formatTime(tsStr) {
  if (!tsStr) return '';
  const iso = tsStr.includes('T') ? tsStr : tsStr.replace(' ', 'T');
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} ET`;
}

function truncate(s, n) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n).trimEnd() + '…' : s;
}

// Sector-call direction color (shared with CoverageTeam card).
function sectorCallColor(call) {
  if (!call) return BRAND.muted;
  const c = call.toLowerCase();
  if (/\b(long|overweight|positive|buy)\b/.test(c)) return SCORE_COLORS.green;
  if (/\bneutral\b/.test(c)) return SCORE_COLORS.yellow;
  if (/\b(underweight|short|avoid|negative|sell)\b/.test(c)) return SCORE_COLORS.red;
  return BRAND.muted;
}

function regimeAccent(regime) {
  if (!regime) return BRAND.muted;
  const r = regime.toLowerCase();
  if (r.includes('risk-off')) return SCORE_COLORS.red;
  if (r.includes('range-bound')) return SCORE_COLORS.yellow;
  if (r.includes('caveats')) return BRAND.gold;
  if (r.includes('risk-on')) return '#5eb4a9';
  return BRAND.gold;
}

// Color the analyst's current_view by directional bias.
//   Long / Overweight / Positive / Buy  → green
//   Neutral                              → yellow
//   Sell / Avoid / Underweight / Short   → red
// For pure AI Tier calls (no credit-direction word), map by tier number:
//   Tier 1-2 → green (winners), Tier 3 → yellow, Tier 4-5 → red.
// Falls back to default text color if no category matches.
function viewColor(view) {
  if (!view) return BRAND.text;
  const v = view.toLowerCase();
  if (/\b(long|overweight|positive|buy)\b/.test(v)) return SCORE_COLORS.green;
  if (/\bneutral\b/.test(v)) return SCORE_COLORS.yellow;
  if (/\b(sell|avoid|underweight|short)\b/.test(v)) return SCORE_COLORS.red;
  const tierMatch = v.match(/tier\s*(\d)/);
  if (tierMatch) {
    const tier = parseInt(tierMatch[1], 10);
    if (tier <= 2) return SCORE_COLORS.green;
    if (tier === 3) return SCORE_COLORS.yellow;
    return SCORE_COLORS.red;
  }
  return BRAND.text;
}

// ----------------------------------------------------------------------
// Track Record table — one row per call, evidence basis expandable.
// ----------------------------------------------------------------------

function TrackRecordRow({ call, accent, onTickerClick }) {
  const [expanded, setExpanded] = useState(false);
  const hasEvidence = Boolean(call.evidence_basis_md && call.evidence_basis_md.trim());
  const callTypeLabel = CALL_TYPE_LABELS[call.call_type] || call.call_type;
  const isResolved = Boolean(call.outcome_date);

  // Color the "Hit?" cell when resolved.
  let hitDisplay = '—';
  let hitColor = BRAND.muted;
  if (isResolved) {
    if (call.was_correct === true) {
      hitDisplay = '✓';
      hitColor = SCORE_COLORS.green;
    } else if (call.was_correct === false) {
      hitDisplay = '✗';
      hitColor = SCORE_COLORS.red;
    } else {
      hitDisplay = '?';
    }
  }

  return (
    <>
      <tr
        onClick={() => hasEvidence && setExpanded(!expanded)}
        style={{
          cursor: hasEvidence ? 'pointer' : 'default',
          borderBottom: `1px solid ${BRAND.border}`,
        }}
      >
        <td
          style={{
            padding: '7px 6px',
            fontFamily: mono,
            fontSize: 11,
            fontWeight: 700,
            color: BRAND.text,
          }}
        >
          {call.ticker ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTickerClick?.(call.ticker);
              }}
              style={{
                all: 'unset',
                cursor: 'pointer',
                color: BRAND.text,
                fontWeight: 700,
                padding: '0 2px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = BRAND.text; }}
            >
              {call.ticker}
            </button>
          ) : (
            <span style={{ color: BRAND.muted, fontStyle: 'italic' }}>(macro)</span>
          )}
        </td>
        <td
          style={{
            padding: '7px 6px',
            fontFamily: mono,
            fontSize: 10.5,
            color: BRAND.textSecondary,
          }}
        >
          {formatDate(call.call_date)}
        </td>
        <td
          style={{
            padding: '7px 6px',
            fontFamily: sans,
            fontSize: 10.5,
            color: BRAND.textSecondary,
          }}
        >
          {callTypeLabel}
        </td>
        <td
          style={{
            padding: '7px 6px',
            fontFamily: sans,
            fontSize: 10.5,
            color: BRAND.text,
          }}
        >
          <span style={{ color: BRAND.muted }}>
            {call.prior_view || '—'}
          </span>
          <span style={{ color: BRAND.muted, margin: '0 4px' }}>→</span>
          <span style={{ color: viewColor(call.current_view), fontWeight: 600 }}>
            {call.current_view || '—'}
          </span>
        </td>
        <td
          style={{
            padding: '7px 6px',
            fontFamily: sans,
            fontSize: 10.5,
            color: isResolved ? BRAND.text : BRAND.muted,
            fontStyle: isResolved ? 'normal' : 'italic',
          }}
        >
          {isResolved ? truncate(call.outcome_summary || '—', 28) : 'pending'}
        </td>
        <td
          style={{
            padding: '7px 6px',
            fontFamily: mono,
            fontSize: 12,
            fontWeight: 700,
            color: hitColor,
            textAlign: 'center',
            width: 28,
          }}
        >
          {hitDisplay}
        </td>
        <td
          style={{
            padding: '7px 6px',
            fontFamily: mono,
            fontSize: 12,
            color: BRAND.muted,
            width: 18,
            textAlign: 'center',
          }}
        >
          {hasEvidence ? (expanded ? '−' : '+') : ''}
        </td>
      </tr>
      {expanded && hasEvidence && (
        <tr>
          <td colSpan={7} style={{ padding: '0 6px 12px 6px' }}>
            <div
              style={{
                background: BRAND.altRow,
                border: `1px solid ${BRAND.border}`,
                borderLeft: `3px solid ${accent}`,
                borderRadius: 3,
                padding: '10px 12px',
                fontFamily: sans,
                fontSize: 10.5,
                color: BRAND.textSecondary,
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: BRAND.gold,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                Evidence basis
              </div>
              {call.evidence_basis_md}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function TrackRecordTable({ calls, accent, onTickerClick }) {
  if (!calls || calls.length === 0) {
    return (
      <div
        style={{
          fontFamily: sans,
          fontSize: 11,
          color: BRAND.muted,
          fontStyle: 'italic',
          padding: '14px 0',
        }}
      >
        No track record entries yet.
      </div>
    );
  }

  const sorted = [...calls].sort((a, b) => {
    if (a.call_date !== b.call_date) return a.call_date < b.call_date ? 1 : -1;
    return (b.call_id || 0) - (a.call_id || 0);
  });

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: sans,
        }}
      >
        <thead>
          <tr style={{ borderBottom: `1px solid ${BRAND.border}` }}>
            {[
              ['Ticker', 'left'],
              ['Date', 'left'],
              ['Type', 'left'],
              ['Call (prior → current)', 'left'],
              ['Outcome', 'left'],
              ['Hit?', 'center'],
              ['', 'center'],
            ].map(([label, align]) => (
              <th
                key={label || 'expand'}
                style={{
                  padding: '6px',
                  fontFamily: sans,
                  fontSize: 9,
                  fontWeight: 700,
                  color: BRAND.gold,
                  textTransform: 'uppercase',
                  letterSpacing: 0.9,
                  textAlign: align,
                }}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => (
            <TrackRecordRow
              key={c.call_id}
              call={c}
              accent={accent}
              onTickerClick={onTickerClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ----------------------------------------------------------------------
// Recent activity for this analyst — filtered slice of the global feed.
// ----------------------------------------------------------------------

function RecentActivityRow({ entry, accent, onTickerClick }) {
  const glyph = ACTION_GLYPHS[entry.action_verb] || '·';
  const isShiftComplete = entry.action_verb === 'Shift complete';

  return (
    <div
      title={(entry.message_md || '').length > 130 ? entry.message_md : undefined}
      style={{
        display: 'grid',
        gridTemplateColumns: '3px 70px 18px 1fr',
        gap: 10,
        padding: '5px 2px',
        borderBottom: `1px solid ${BRAND.border}`,
        alignItems: 'baseline',
      }}
    >
      <div style={{ background: accent, borderRadius: 1, alignSelf: 'stretch' }} />
      <span
        style={{
          fontFamily: mono,
          fontSize: 9.5,
          color: BRAND.muted,
          letterSpacing: 0.3,
        }}
      >
        {formatDate(entry.timestamp)} {formatTime(entry.timestamp)}
      </span>
      <span
        style={{
          fontFamily: mono,
          fontSize: 11,
          color: isShiftComplete ? BRAND.gold : BRAND.textSecondary,
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        {glyph}
      </span>
      <span
        style={{
          fontFamily: sans,
          fontSize: 10.5,
          color: BRAND.text,
          lineHeight: 1.45,
        }}
      >
        <strong
          style={{
            color: isShiftComplete ? BRAND.gold : BRAND.textSecondary,
            fontWeight: 600,
            marginRight: 6,
          }}
        >
          {entry.action_verb}
        </strong>
        {entry.ticker && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTickerClick?.(entry.ticker);
            }}
            style={{
              all: 'unset',
              cursor: 'pointer',
              color: BRAND.text,
              fontWeight: 700,
              marginRight: 4,
              padding: '0 2px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = accent; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = BRAND.text; }}
          >
            {entry.ticker}
          </button>
        )}
        <span style={{ color: BRAND.textSecondary }}>
          {truncate(entry.message_md, 130)}
        </span>
      </span>
    </div>
  );
}

// ----------------------------------------------------------------------
// Wave 6 — Tab shell + new tab content components
// ----------------------------------------------------------------------

function TabBar({ active, onChange, counts }) {
  const tabs = [
    { id: 'pitch',    label: 'Pitch' },
    { id: 'calls',    label: `Calls${counts.calls ? ` (${counts.calls})` : ''}` },
    { id: 'earnings', label: `Earnings${counts.earnings ? ` (${counts.earnings})` : ''}` },
    { id: 'memos',    label: `Memos${counts.memos ? ` (${counts.memos})` : ''}` },
  ];
  return (
    <div
      style={{
        display: 'flex',
        gap: 0,
        marginBottom: 16,
        borderBottom: `1px solid ${BRAND.border}`,
      }}
    >
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              fontFamily: sans,
              fontSize: 11,
              fontWeight: isActive ? 700 : 400,
              color: isActive ? BRAND.gold : BRAND.muted,
              padding: '8px 14px',
              borderBottom: isActive ? `2px solid ${BRAND.gold}` : '2px solid transparent',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// SectionHeader — small reusable label used at the top of each Pitch
// sub-block. Visually quieter than the all-caps gold labels used in the
// existing track-record / activity sections.
function SectionHeader({ children }) {
  return (
    <div
      style={{
        fontSize: 9.5,
        color: BRAND.gold,
        textTransform: 'uppercase',
        letterSpacing: 1.1,
        fontFamily: sans,
        fontWeight: 700,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

// ----- PITCH TAB -------------------------------------------------------
// The two-minute analyst read. Order of blocks is the order a PM walking
// by would want them: today's call → vs house view → top trades → what
// changed → book pulse.
function PitchTab({
  analyst,
  initials,
  accent,
  myShiftToday,
  myShiftsRecent,
  myFeed,
  myTopTrades,
  bookSize,
  v2CoveredCount,
  v2CoveragePct,
  myMemos,
  onTickerClick,
}) {
  const isTW = initials === 'T.W.';
  // Today's call: prefer fresh shift_reports_today.top_thing_md; fall
  // back to coverage_team.last_shift_top_thing_md (snapshot may lag a
  // shift on a non-shift day).
  const todayHook =
    myShiftToday?.top_thing_md || analyst?.last_shift_top_thing_md || null;
  const vsHouseView = myShiftToday?.vs_house_view_md || null;

  // Memo state breakdown for Book Pulse.
  const memoCounts = myMemos.reduce(
    (acc, m) => {
      acc.total += 1;
      const k = (m.memo_status || 'unknown').toLowerCase();
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    },
    { total: 0 }
  );
  const refreshDue = memoCounts.refresh_due || 0;
  const stale = memoCounts.stale || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* TODAY'S CALL */}
      <div>
        <SectionHeader>Today's call</SectionHeader>
        {todayHook ? (
          <div
            style={{
              fontFamily: sans,
              fontSize: 12,
              color: BRAND.text,
              lineHeight: 1.6,
              background: BRAND.altRow,
              borderLeft: `3px solid ${accent}`,
              borderRadius: 3,
              padding: '10px 14px',
            }}
          >
            {todayHook}
          </div>
        ) : (
          <div
            style={{
              fontFamily: sans,
              fontSize: 11,
              color: BRAND.muted,
              fontStyle: 'italic',
              padding: '4px 0',
            }}
          >
            No shift report yet.
          </div>
        )}
      </div>

      {/* VS HOUSE VIEW */}
      {vsHouseView && (
        <div>
          <SectionHeader>Vs House View</SectionHeader>
          <div
            style={{
              fontFamily: sans,
              fontSize: 11.5,
              color: BRAND.text,
              lineHeight: 1.5,
              padding: '6px 12px',
              borderLeft: `2px solid ${BRAND.border}`,
            }}
          >
            {vsHouseView}
          </div>
        </div>
      )}

      {/* TOP TRADES — directional pitches the analyst would lead with */}
      {!isTW && (
        <div>
          <SectionHeader>Top trades ({myTopTrades.length} active)</SectionHeader>
          {myTopTrades.length === 0 ? (
            <div
              style={{
                fontFamily: sans,
                fontSize: 11,
                color: BRAND.muted,
                fontStyle: 'italic',
                padding: '4px 0',
              }}
            >
              None active.
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {myTopTrades.map((t) => {
                const g = TRADE_ACTION_GLYPH[String(t.action || '').toLowerCase()] || {
                  symbol: '·',
                  color: BRAND.muted,
                  label: t.action || '—',
                };
                return (
                  <div
                    key={`${t.ticker}-${t.established_date}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '90px 80px 60px 1fr',
                      gap: 12,
                      alignItems: 'baseline',
                      padding: '6px 10px',
                      borderRadius: 3,
                      background: BRAND.altRow,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onTickerClick?.(t.ticker)}
                      style={{
                        all: 'unset',
                        cursor: 'pointer',
                        fontFamily: mono,
                        fontSize: 12,
                        fontWeight: 700,
                        color: BRAND.text,
                      }}
                    >
                      {t.ticker}
                    </button>
                    <span
                      style={{
                        fontFamily: sans,
                        fontSize: 10,
                        color: g.color,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 0.6,
                      }}
                    >
                      {g.symbol} {g.label}
                    </span>
                    <span
                      style={{
                        fontFamily: sans,
                        fontSize: 10,
                        color: BRAND.muted,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      {t.conviction}
                    </span>
                    <span
                      style={{
                        fontFamily: sans,
                        fontSize: 11,
                        color: BRAND.textSecondary,
                        lineHeight: 1.4,
                      }}
                    >
                      {t.thesis_one_liner}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* WHAT CHANGED — last 7d activity feed (entries this analyst made) */}
      <div>
        <SectionHeader>What changed (last 7d)</SectionHeader>
        {myFeed.length === 0 ? (
          <div
            style={{
              fontFamily: sans,
              fontSize: 11,
              color: BRAND.muted,
              fontStyle: 'italic',
              padding: '4px 0',
            }}
          >
            No activity entries.
          </div>
        ) : (
          <div
            style={{
              background: BRAND.altRow,
              border: `1px solid ${BRAND.border}`,
              borderRadius: 4,
              padding: '4px 14px',
              maxHeight: 240,
              overflowY: 'auto',
            }}
          >
            {myFeed.slice(0, 12).map((e) => (
              <RecentActivityRow
                key={e.activity_id}
                entry={e}
                accent={accent}
                onTickerClick={onTickerClick}
              />
            ))}
          </div>
        )}
        {myShiftsRecent.length > 1 && (
          <div
            style={{
              fontFamily: sans,
              fontSize: 9.5,
              color: BRAND.muted,
              fontStyle: 'italic',
              marginTop: 6,
            }}
          >
            {myShiftsRecent.length} shift reports in the last 14 days.
          </div>
        )}
      </div>

      {/* BOOK PULSE — coverage metrics. Surfaces the v2 scoring gap to
          the desk; engine migration is the queued Wave 7 work. */}
      {!isTW && (
        <div>
          <SectionHeader>Book pulse</SectionHeader>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 14,
              padding: '10px 12px',
              background: BRAND.altRow,
              borderRadius: 4,
            }}
          >
            <PulseStat
              label="Active top trades"
              value={String(myTopTrades.length)}
              hint={
                myTopTrades.length === 0
                  ? 'Quiet pitch'
                  : `${myTopTrades.length} of max 5`
              }
            />
            <PulseStat
              label="Memos"
              value={`${memoCounts.total}`}
              hint={
                refreshDue || stale
                  ? `${refreshDue} refresh-due, ${stale} stale`
                  : `book size ${bookSize}`
              }
              hintColor={refreshDue || stale ? SCORE_COLORS.yellow : undefined}
            />
            <PulseStat
              label="Fundamental v2"
              value={
                v2CoveragePct == null
                  ? '—'
                  : `${v2CoveredCount}/${bookSize} (${v2CoveragePct}%)`
              }
              hint="Engine migration: Wave 7"
              hintColor={
                v2CoveragePct != null && v2CoveragePct < 50
                  ? SCORE_COLORS.yellow
                  : undefined
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PulseStat({ label, value, hint, hintColor }) {
  return (
    <div>
      <div
        style={{
          color: BRAND.muted,
          fontSize: 9,
          fontFamily: sans,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: mono,
          fontSize: 14,
          fontWeight: 700,
          color: BRAND.text,
        }}
      >
        {value}
      </div>
      {hint && (
        <div
          style={{
            fontFamily: sans,
            fontSize: 9.5,
            color: hintColor || BRAND.muted,
            marginTop: 2,
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

// ----- EARNINGS TAB ----------------------------------------------------
// Per-quarter earnings updates this analyst published. One card per
// (ticker, year, quarter). Sections collapsed for scan; click to expand.
function EarningsTab({ earnings, accent, onTickerClick }) {
  if (earnings.length === 0) {
    return (
      <div
        style={{
          fontFamily: sans,
          fontSize: 11,
          color: BRAND.muted,
          fontStyle: 'italic',
          padding: '12px 0',
        }}
      >
        No earnings updates published by this analyst.
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SectionHeader>Earnings updates ({earnings.length})</SectionHeader>
      {earnings.map((e) => (
        <div
          key={`${e.ticker}-${e.year}-${e.quarter}-${e.published_at}`}
          style={{
            background: BRAND.altRow,
            borderLeft: `3px solid ${accent}`,
            borderRadius: 3,
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'baseline',
              fontFamily: mono,
              fontSize: 12,
            }}
          >
            <button
              type="button"
              onClick={() => onTickerClick?.(e.ticker)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                color: BRAND.text,
                fontWeight: 700,
              }}
            >
              {e.ticker}
            </button>
            <span style={{ color: BRAND.muted }}>
              {e.year} Q{e.quarter}
            </span>
          </div>
          {e.chat_blurb_text && (
            <div
              style={{
                fontFamily: sans,
                fontSize: 11.5,
                color: BRAND.text,
                lineHeight: 1.5,
              }}
            >
              {e.chat_blurb_text}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ----- MEMOS TAB -------------------------------------------------------
// Coverage memos for this analyst's book. Status pill colors:
//   initiated   green
//   refreshed   blue
//   refresh_due amber
//   stale       red
//   queued      grey
const MEMO_STATUS_COLOR = {
  initiated: SCORE_COLORS.green,
  refreshed: '#5294d0',
  refresh_due: SCORE_COLORS.yellow,
  stale: SCORE_COLORS.red,
  queued: BRAND.muted,
};

function MemosTab({ memos, accent, onTickerClick }) {
  if (memos.length === 0) {
    return (
      <div
        style={{
          fontFamily: sans,
          fontSize: 11,
          color: BRAND.muted,
          fontStyle: 'italic',
          padding: '12px 0',
        }}
      >
        No coverage memos for this analyst's book yet.
      </div>
    );
  }
  // Sort: refresh_due + stale first (action items), then initiated/refreshed.
  const sorted = [...memos].sort((a, b) => {
    const order = { stale: 0, refresh_due: 1, initiated: 2, refreshed: 3, queued: 4 };
    const ao = order[a.memo_status] ?? 9;
    const bo = order[b.memo_status] ?? 9;
    if (ao !== bo) return ao - bo;
    return (b.last_refreshed_date || '').localeCompare(a.last_refreshed_date || '');
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <SectionHeader>Coverage memos ({memos.length})</SectionHeader>
      {sorted.map((m) => {
        const statusColor = MEMO_STATUS_COLOR[m.memo_status] || BRAND.muted;
        return (
          <div
            key={m.ticker}
            style={{
              background: BRAND.altRow,
              borderLeft: `3px solid ${accent}`,
              borderRadius: 3,
              padding: '8px 12px',
              display: 'grid',
              gridTemplateColumns: '90px 110px 1fr 130px',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => onTickerClick?.(m.ticker)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                fontFamily: mono,
                fontSize: 12,
                fontWeight: 700,
                color: BRAND.text,
              }}
            >
              {m.ticker}
            </button>
            <span
              style={{
                fontFamily: sans,
                fontSize: 9.5,
                fontWeight: 700,
                color: BRAND.card,
                background: statusColor,
                textTransform: 'uppercase',
                letterSpacing: 0.7,
                padding: '2px 8px',
                borderRadius: 3,
                textAlign: 'center',
              }}
            >
              {(m.memo_status || '—').replace(/_/g, ' ')}
            </span>
            <span
              style={{
                fontFamily: sans,
                fontSize: 10.5,
                color: BRAND.textSecondary,
              }}
            >
              {m.quarters_covered || ''}
            </span>
            <span
              style={{
                fontFamily: mono,
                fontSize: 10,
                color: BRAND.muted,
                textAlign: 'right',
              }}
            >
              {m.last_refreshed_date || m.initiated_date || '—'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ----------------------------------------------------------------------
// Main panel
// ----------------------------------------------------------------------

export default function AnalystPanel({ initials, data, onClose, onTickerClick }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Wave 6: tabbed shell — Pitch is the default landing.
  const [activeTab, setActiveTab] = useState('pitch');

  const team = data?.analyst_team?.coverage_team || [];
  const analyst = team.find((a) => a.initials === initials);
  if (!analyst) return null;

  const accent = ANALYST_COLORS[initials] || BRAND.sage;
  const tr = analyst.track_record_summary || {};
  const hit = tr.hit_rate_pct;

  const allCalls = data?.analyst_team?.track_record || [];
  const myCalls = allCalls.filter((c) => c.analyst_initials === initials);

  const allFeed = data?.analyst_team?.activity_feed || [];
  const myFeed = allFeed
    .filter((e) => e.analyst_initials === initials)
    .slice(0, 30);

  // Wave 6: derivations for the Pitch / Memos / Earnings tabs.
  const myTopTrades = data?.analyst_team?.top_trades_by_analyst?.[initials] || [];
  const myShiftToday = (data?.shift_reports_today || []).find(
    (s) => s.analyst_initials === initials
  );
  const myShiftsRecent = (data?.shift_reports_recent || []).filter(
    (s) => s.analyst_initials === initials
  );
  const myMemos = (data?.coverage_memos || []).filter(
    (m) => m.analyst_initials === initials
  );
  const myEarnings = (data?.analyst_team?.earnings_updates || []).filter(
    (e) => e.analyst_initials === initials
  );

  // Per-analyst book derivation: any ticker that has at least one
  // issuer_detail section last_updated_by = this analyst.
  const allIssuerDetail = data?.analyst_team?.issuer_detail || {};
  const myBook = new Set(
    Object.entries(allIssuerDetail)
      .filter(([, sections]) =>
        Object.values(sections || {}).some(
          (s) => s && s.last_updated_by === initials
        )
      )
      .map(([t]) => t)
  );

  // Fundamental scoring v2 coverage for this analyst's book. Diagnostic
  // surfaced in Wave 6 planning: engine reads stale fmp_financials and
  // covers ~24% of universe. Wave 7 will migrate to xbrl_financials.
  const v2Tickers = new Set(
    (data?.fundamental_scores_v2 || []).map((r) => r.ticker)
  );
  const v2CoveredCount = [...myBook].filter((t) => v2Tickers.has(t)).length;
  const v2CoveragePct = myBook.size
    ? Math.round((100 * v2CoveredCount) / myBook.size)
    : null;

  // Sector call block — for A.V./J.R./S.K. use sector_call; for T.W. use
  // regime from house_view in the same visual slot.
  const isTW = initials === 'T.W.';
  const houseView = data?.analyst_team?.house_view;
  let callLabel = null;
  let callColor = BRAND.muted;
  let callThesis = null;
  if (isTW && houseView) {
    const conv = houseView.conviction ? ` · ${houseView.conviction}` : '';
    callLabel = `${houseView.regime || '—'}${conv}`;
    callColor = regimeAccent(houseView.regime);
    callThesis = houseView.positioning_md || null;
  } else if (analyst.sector_call) {
    callLabel = analyst.sector_call;
    callColor = sectorCallColor(analyst.sector_call);
    callThesis = analyst.sector_call_thesis_md || null;
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 12, 19, 0.72)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: 50,
        paddingBottom: 50,
        overflow: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: BRAND.card,
          border: `1px solid ${BRAND.border}`,
          borderRadius: 6,
          padding: '24px 28px',
          maxWidth: 920,
          width: '94%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* HEADER — initials + sector + close */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
            paddingBottom: 14,
            borderBottom: `1px solid ${BRAND.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <div
              style={{
                fontFamily: sans,
                fontSize: 28,
                fontWeight: 700,
                color: accent,
                letterSpacing: 0.5,
                lineHeight: 1,
              }}
            >
              {analyst.initials}
            </div>
            <div
              style={{
                fontFamily: sans,
                fontSize: 11,
                color: BRAND.gold,
                textTransform: 'uppercase',
                letterSpacing: 0.9,
              }}
            >
              {analyst.sector}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: BRAND.muted,
              fontSize: 22,
              lineHeight: 1,
              cursor: 'pointer',
              padding: '2px 8px',
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* SECTOR CALL HEADER — pill + thesis. For T.W. this slot carries
            the macro regime call from House View. */}
        {callLabel && (
          <div
            style={{
              marginBottom: 20,
              padding: '12px 14px',
              background: BRAND.altRow,
              borderLeft: `4px solid ${callColor}`,
              borderRadius: 3,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontFamily: sans,
                  fontSize: 9,
                  color: BRAND.muted,
                  textTransform: 'uppercase',
                  letterSpacing: 1.1,
                  fontWeight: 700,
                }}
              >
                {isTW ? 'Macro Regime' : 'Sector Call'}
              </span>
              <span
                style={{
                  display: 'inline-block',
                  fontFamily: sans,
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: 0.7,
                  textTransform: 'uppercase',
                  color: BRAND.card,
                  background: callColor,
                  padding: '3px 10px',
                  borderRadius: 3,
                }}
              >
                {callLabel}
              </span>
            </div>
            {callThesis && (
              <div
                style={{
                  fontFamily: sans,
                  fontSize: 11.5,
                  color: BRAND.text,
                  lineHeight: 1.6,
                }}
              >
                {callThesis}
              </div>
            )}
          </div>
        )}

        {/* SUMMARY STATS ROW */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 18,
            marginBottom: 18,
          }}
        >
          <div>
            <div style={{ color: BRAND.muted, fontSize: 9.5, fontFamily: sans, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>
              Names covered
            </div>
            <div style={{ fontFamily: mono, fontSize: 18, fontWeight: 700, color: BRAND.text }}>
              {analyst.names_covered_count ?? '—'}
            </div>
          </div>
          <div>
            <div style={{ color: BRAND.muted, fontSize: 9.5, fontFamily: sans, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>
              Total calls
            </div>
            <div style={{ fontFamily: mono, fontSize: 18, fontWeight: 700, color: BRAND.text }}>
              {tr.total_calls ?? 0}
            </div>
          </div>
          <div>
            <div style={{ color: BRAND.muted, fontSize: 9.5, fontFamily: sans, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>
              Resolved
            </div>
            <div style={{ fontFamily: mono, fontSize: 18, fontWeight: 700, color: BRAND.text }}>
              {tr.resolved_calls ?? 0}
            </div>
          </div>
          <div>
            <div style={{ color: BRAND.muted, fontSize: 9.5, fontFamily: sans, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>
              Hit rate
            </div>
            <div
              style={{
                fontFamily: mono,
                fontSize: 18,
                fontWeight: 700,
                color: hit != null ? SCORE_COLORS.green : BRAND.muted,
              }}
            >
              {hit != null ? `${hit}%` : 'pending'}
            </div>
          </div>
        </div>

        {/* WAVE 6 TABS — Pitch is the default landing.
            Pitch  : two-minute analyst pitch (today's call, top trades,
                     vs house view, what changed, book pulse)
            Calls  : track-record table (the call-history view that was
                     the entire panel pre-Wave 6)
            Earnings: per-quarter earnings updates this analyst published
            Memos  : coverage_memos for this analyst's book */}
        <TabBar
          active={activeTab}
          onChange={setActiveTab}
          counts={{
            calls: myCalls.length,
            earnings: myEarnings.length,
            memos: myMemos.length,
          }}
        />

        {activeTab === 'pitch' && (
          <PitchTab
            analyst={analyst}
            initials={initials}
            accent={accent}
            myShiftToday={myShiftToday}
            myShiftsRecent={myShiftsRecent}
            myFeed={myFeed}
            myTopTrades={myTopTrades}
            bookSize={myBook.size}
            v2CoveredCount={v2CoveredCount}
            v2CoveragePct={v2CoveragePct}
            myMemos={myMemos}
            onTickerClick={onTickerClick}
          />
        )}

        {activeTab === 'calls' && (
          <div>
            <div
              style={{
                fontSize: 9.5,
                color: BRAND.gold,
                textTransform: 'uppercase',
                letterSpacing: 1.1,
                fontFamily: sans,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              Track Record ({myCalls.length})
            </div>
            <TrackRecordTable
              calls={myCalls}
              accent={accent}
              onTickerClick={onTickerClick}
            />
            <div
              style={{
                fontFamily: sans,
                fontSize: 9.5,
                color: BRAND.muted,
                fontStyle: 'italic',
                marginTop: 6,
              }}
            >
              Click a row to expand evidence basis. Outcomes are filled
              retroactively at the next Story Arc Review or when a clear
              confirming/disconfirming event occurs.
            </div>
          </div>
        )}

        {activeTab === 'earnings' && (
          <EarningsTab
            earnings={myEarnings}
            accent={accent}
            onTickerClick={onTickerClick}
          />
        )}

        {activeTab === 'memos' && (
          <MemosTab
            memos={myMemos}
            accent={accent}
            onTickerClick={onTickerClick}
          />
        )}
      </div>
    </div>
  );
}
