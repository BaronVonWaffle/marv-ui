import { useEffect, useState } from 'react';
import { BRAND, SCORE_COLORS } from '../utils/colors';

const sans = 'Arial, sans-serif';
const mono = "'JetBrains Mono', monospace";

// Per-analyst color stripe — same convention used in ActivityFeed and
// AnalystTeamBlock. Imported inline to avoid a tiny shared util file.
const ANALYST_COLORS = {
  'T.W.': '#c8a44e',
  'A.V.': '#5eb4a9',
  'J.R.': '#5294d0',
  'S.K.': '#a48dc8',
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
// Main panel
// ----------------------------------------------------------------------

export default function AnalystPanel({ initials, data, onClose, onTickerClick }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

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

        {/* TOP THING THIS SHIFT */}
        {analyst.last_shift_top_thing_md && (
          <div style={{ marginBottom: 22 }}>
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
              Top thing this shift
            </div>
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
              {analyst.last_shift_top_thing_md}
            </div>
          </div>
        )}

        {/* TRACK RECORD TABLE */}
        <div style={{ marginBottom: 24 }}>
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
            Click a row to expand evidence basis. Outcomes are filled retroactively at the next Story Arc Review or when a clear confirming/disconfirming event occurs.
          </div>
        </div>

        {/* RECENT ACTIVITY (this analyst only) */}
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
            Recent Activity ({myFeed.length})
          </div>
          {myFeed.length === 0 ? (
            <div style={{ fontFamily: sans, fontSize: 11, color: BRAND.muted, fontStyle: 'italic', padding: '12px 0' }}>
              No activity entries yet.
            </div>
          ) : (
            <div
              style={{
                background: BRAND.altRow,
                border: `1px solid ${BRAND.border}`,
                borderRadius: 4,
                padding: '4px 14px',
                maxHeight: 320,
                overflowY: 'auto',
              }}
            >
              {myFeed.map((e) => (
                <RecentActivityRow
                  key={e.activity_id}
                  entry={e}
                  accent={accent}
                  onTickerClick={onTickerClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
