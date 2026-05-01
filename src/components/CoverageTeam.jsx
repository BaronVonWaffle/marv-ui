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

// Sector-call direction → pill color.
// Green: positive / overweight / long
// Yellow: neutral
// Red: negative / underweight / short / avoid
function sectorCallColor(call) {
  if (!call) return BRAND.muted;
  const c = call.toLowerCase();
  if (/\b(long|overweight|positive|buy)\b/.test(c)) return SCORE_COLORS.green;
  if (/\bneutral\b/.test(c)) return SCORE_COLORS.yellow;
  if (/\b(underweight|short|avoid|negative|sell)\b/.test(c)) return SCORE_COLORS.red;
  return BRAND.muted;
}

// T.W. uses the regime call from house_view in place of a sector call.
// Regime-family accent colors mirror HouseView.jsx conventions.
function regimeAccent(regime) {
  if (!regime) return BRAND.muted;
  const r = regime.toLowerCase();
  if (r.includes('risk-off')) return SCORE_COLORS.red;
  if (r.includes('range-bound')) return SCORE_COLORS.yellow;
  if (r.includes('caveats')) return BRAND.gold;
  if (r.includes('risk-on')) return '#5eb4a9';
  return BRAND.gold;
}

function formatShiftTimestamp(tsStr) {
  if (!tsStr) return null;
  // DuckDB exports timestamps like "2026-04-24 12:27:53.217143" —
  // swap the space for T so Date can parse consistently across browsers.
  const iso = tsStr.includes('T') ? tsStr : tsStr.replace(' ', 'T');
  const d = new Date(iso);
  if (isNaN(d)) return null;
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${month} ${day}, ${hh}:${mm} ET`;
}

function truncate(s, n) {
  if (!s) return null;
  return s.length > n ? s.slice(0, n).trimEnd() + '…' : s;
}

function AnalystCard({ analyst, onClick, houseView }) {
  const {
    initials,
    sector,
    names_covered_count,
    last_shift_timestamp,
    sector_call,
    sector_call_thesis_md,
    track_record_summary,
  } = analyst;

  const tr = track_record_summary || {};
  const total = tr.total_calls ?? 0;
  const resolved = tr.resolved_calls ?? 0;
  const hitRate = tr.hit_rate_pct;

  const shiftTs = formatShiftTimestamp(last_shift_timestamp);
  const hasShift = Boolean(shiftTs);

  // For the 3 sector analysts: use sector_call + sector_call_thesis_md.
  // For T.W.: use regime + positioning_md snippet from house_view in place
  // of a sector call. Same visual slot, different data source.
  const isTW = initials === 'T.W.';
  let callLabel = null;
  let callColor = BRAND.muted;
  let callThesis = null;

  if (isTW && houseView) {
    const conviction = houseView.conviction ? ` · ${houseView.conviction}` : '';
    callLabel = `${houseView.regime || '—'}${conviction}`;
    callColor = regimeAccent(houseView.regime);
    // Pull one-sentence positioning summary
    const body = houseView.positioning_md || '';
    const firstPeriod = body.indexOf('. ');
    callThesis = firstPeriod > 0 ? body.slice(0, firstPeriod + 1) : truncate(body, 220);
  } else if (sector_call) {
    callLabel = sector_call;
    callColor = sectorCallColor(sector_call);
    callThesis = sector_call_thesis_md;
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(initials)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(initials);
        }
      }}
      style={{
        background: BRAND.card,
        border: `1px solid ${BRAND.border}`,
        borderRadius: 5,
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'background 0.15s ease, border-color 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 9,
        minHeight: 150,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = BRAND.cardHover;
        e.currentTarget.style.borderColor = BRAND.sage;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = BRAND.card;
        e.currentTarget.style.borderColor = BRAND.border;
      }}
    >
      {/* Header — initials + sector */}
      <div>
        <div
          style={{
            fontFamily: sans,
            fontSize: 22,
            fontWeight: 700,
            color: BRAND.text,
            letterSpacing: 0.5,
            lineHeight: 1,
          }}
        >
          {initials}
        </div>
        <div
          style={{
            fontFamily: sans,
            fontSize: 9.5,
            color: BRAND.gold,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginTop: 4,
          }}
        >
          {sector}
        </div>
      </div>

      {/* Stats row — names covered + last shift timestamp */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          fontFamily: mono,
          fontSize: 10,
          color: BRAND.textSecondary,
          letterSpacing: 0.3,
        }}
      >
        <span>
          {names_covered_count != null
            ? `${names_covered_count} name${names_covered_count === 1 ? '' : 's'}`
            : '— coverage'}
        </span>
        <span style={{ color: BRAND.muted }}>·</span>
        <span>{hasShift ? shiftTs : 'No shift yet'}</span>
      </div>

      {/* Sector call pill + thesis — replaces the prior top-thing preview.
          For T.W. the "call" is the macro regime from House View. */}
      {callLabel ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div>
            <span
              style={{
                display: 'inline-block',
                fontFamily: sans,
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: 0.7,
                textTransform: 'uppercase',
                color: BRAND.card,
                background: callColor,
                padding: '2px 8px',
                borderRadius: 3,
              }}
            >
              {isTW ? 'Regime' : 'Sector call'} · {callLabel}
            </span>
          </div>
          {callThesis && (
            <div
              style={{
                fontFamily: sans,
                fontSize: 10.5,
                color: BRAND.textSecondary,
                lineHeight: 1.45,
              }}
            >
              {callThesis}
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            fontFamily: sans,
            fontSize: 10.5,
            color: BRAND.muted,
            fontStyle: 'italic',
            lineHeight: 1.4,
            flex: 1,
          }}
        >
          {isTW ? 'House View not published' : 'Sector call not published'}
        </div>
      )}

      {/* Track record summary footer */}
      <div
        style={{
          borderTop: `1px solid ${BRAND.border}`,
          paddingTop: 7,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: mono,
          fontSize: 10,
        }}
      >
        <span style={{ color: BRAND.textSecondary }}>
          {total} call{total === 1 ? '' : 's'} · {resolved} resolved
        </span>
        <span
          style={{
            color: hitRate != null ? SCORE_COLORS.green : BRAND.muted,
          }}
        >
          {hitRate != null ? `${hitRate}% hit` : 'pending'}
        </span>
      </div>
    </div>
  );
}

export default function CoverageTeam({ data, onAnalystClick }) {
  const team = data?.analyst_team?.coverage_team;
  if (!Array.isArray(team) || team.length === 0) return null;
  const houseView = data?.analyst_team?.house_view;

  return (
    <div>
      <div style={sectionLabel}>Coverage Team</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
        }}
      >
        {team.map((a) => (
          <AnalystCard
            key={a.initials}
            analyst={a}
            onClick={onAnalystClick}
            houseView={houseView}
          />
        ))}
      </div>
    </div>
  );
}
