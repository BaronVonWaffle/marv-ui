import { BRAND } from '../utils/colors';

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

// Subtle per-analyst color stripe. Desaturated so rows feel coordinated,
// not rainbow. Coverage: T.W. gold, A.V. teal, J.R. blue, S.K. purple.
const ANALYST_COLORS = {
  'T.W.': '#c8a44e',
  'A.V.': '#5eb4a9',
  'J.R.': '#5294d0',
  'S.K.': '#a48dc8',
};

// Glyphs for the 5 action verbs in use. Keep them narrow-column friendly.
const ACTION_GLYPHS = {
  'Published':      '▸',
  'Revised':        '↻',
  'Propagated':     '→',
  'Logged':         '•',
  'Shift complete': '◼',
};

function formatFeedTime(tsStr) {
  if (!tsStr) return '—';
  const iso = tsStr.includes('T') ? tsStr : tsStr.replace(' ', 'T');
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} ET`;
}

function truncate(s, n) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n).trimEnd() + '…' : s;
}

function FeedRow({ entry, onTickerClick }) {
  const color = ANALYST_COLORS[entry.analyst_initials] || BRAND.muted;
  const glyph = ACTION_GLYPHS[entry.action_verb] || '·';
  const message = entry.message_md || '';
  const displayMessage = truncate(message, 130);
  const isShiftComplete = entry.action_verb === 'Shift complete';

  return (
    <div
      title={message.length > 130 ? message : undefined}
      style={{
        display: 'grid',
        gridTemplateColumns: '3px 42px 58px 18px 1fr',
        gap: 10,
        padding: '5px 2px',
        borderBottom: `1px solid ${BRAND.border}`,
        alignItems: 'baseline',
        transition: 'background 0.12s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = BRAND.altRow;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Left color stripe */}
      <div
        style={{
          background: color,
          borderRadius: 1,
          alignSelf: 'stretch',
          minHeight: 12,
        }}
      />

      {/* Analyst initials — monospace, analyst color */}
      <span
        style={{
          fontFamily: mono,
          fontSize: 10,
          color,
          fontWeight: 700,
          letterSpacing: 0.3,
        }}
      >
        {entry.analyst_initials}
      </span>

      {/* Timestamp HH:MM ET */}
      <span
        style={{
          fontFamily: mono,
          fontSize: 9.5,
          color: BRAND.muted,
          letterSpacing: 0.3,
        }}
      >
        {formatFeedTime(entry.timestamp)}
      </span>

      {/* Action glyph */}
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

      {/* Message — action verb bold, then ticker (clickable), then message */}
      <span
        style={{
          fontFamily: sans,
          fontSize: 10.5,
          color: BRAND.text,
          lineHeight: 1.45,
          overflow: 'hidden',
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
              borderRadius: 2,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = color; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = BRAND.text; }}
          >
            {entry.ticker}
          </button>
        )}
        <span style={{ color: BRAND.textSecondary }}>{displayMessage}</span>
      </span>
    </div>
  );
}

export default function ActivityFeed({ data, onTickerClick, limit, maxHeight = 400 }) {
  const fullEntries = data?.analyst_team?.activity_feed;
  if (!Array.isArray(fullEntries) || fullEntries.length === 0) return null;

  // `limit` is honored when provided (used by PM Dashboard to show just the
  // top N entries). When undefined, the full feed renders inside a scroll
  // region — original Wave 4 behavior.
  const entries = limit ? fullEntries.slice(0, limit) : fullEntries;
  const isCapped = limit && fullEntries.length > limit;

  return (
    <div>
      <div style={sectionLabel}>
        Today's Activity Feed
        <span
          style={{
            color: BRAND.muted,
            fontWeight: 500,
            letterSpacing: 0.5,
            marginLeft: 8,
            textTransform: 'none',
          }}
        >
          ({isCapped ? `latest ${limit} of ${fullEntries.length}` : `${fullEntries.length} entries`})
        </span>
      </div>
      <div
        style={{
          background: BRAND.card,
          border: `1px solid ${BRAND.border}`,
          borderRadius: 5,
          padding: '4px 14px',
          maxHeight: limit ? undefined : maxHeight,
          overflowY: limit ? undefined : 'auto',
        }}
      >
        {entries.map((e) => (
          <FeedRow
            key={e.activity_id}
            entry={e}
            onTickerClick={onTickerClick}
          />
        ))}
      </div>
    </div>
  );
}
