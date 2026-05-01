import { BRAND, SCORE_COLORS } from '../utils/colors';
import renderMarkdown from '../utils/markdownLite.jsx';

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

const cardShell = {
  background: BRAND.card,
  border: `1px solid ${BRAND.border}`,
  borderRadius: 5,
  padding: '14px 16px',
};

// Wave 3.3 expanded the fundamental-analyst roster from 3 to 11. T.W. and
// Q.T. cover cross-sector and don't write per-name vs_house_view sections
// in issuer_detail — they're excluded from this band rendering.
const ANALYSTS = [
  { initials: 'A.V.', sector: 'Chemicals' },
  { initials: 'J.R.', sector: 'Industrials & Machinery' },
  { initials: 'K.M.', sector: 'Autos & Cyclicals' },
  { initials: 'S.K.', sector: 'Software & Tech' },
  { initials: 'F.B.', sector: 'Financials' },
  { initials: 'G.W.', sector: 'TMT' },
  { initials: 'B.L.', sector: 'Healthcare' },
  { initials: 'N.S.', sector: 'Consumer Staples' },
  { initials: 'R.D.', sector: 'Energy' },
  { initials: 'P.C.', sector: 'Utilities' },
  { initials: 'D.E.', sector: 'Services' },
];

// Parse position from the vs_house_view markdown body. Picks whichever
// verb (dissents / concurs / watching) appears FIRST in the head.
// This handles cases like "S.K. concurs ... No dissent." correctly —
// "concurs" wins because it appears earlier in the text.
function detectPosition(contentMd) {
  if (!contentMd) return 'unknown';
  const head = contentMd.slice(0, 300).toLowerCase();
  const dissentIdx = head.search(/\bdissents?\b/);
  const concurIdx = head.search(/\bconcurs?\b/);
  const watchingIdx = head.search(/\bwatching\b/);
  const candidates = [
    dissentIdx >= 0 ? { idx: dissentIdx, pos: 'dissent' } : null,
    concurIdx >= 0 ? { idx: concurIdx, pos: 'concur' } : null,
    watchingIdx >= 0 ? { idx: watchingIdx, pos: 'watching' } : null,
  ].filter(Boolean).sort((a, b) => a.idx - b.idx);
  return candidates[0]?.pos || 'unknown';
}

// Extract the punch line from vs_house_view body. Returns the first
// paragraph (up to maxLen chars), minus the trailing "— A.V." signoff.
function extractPunchLine(contentMd, maxLen = 200) {
  if (!contentMd) return '';
  // Strip trailing signoff line
  let text = contentMd.replace(/\n+—\s*[A-Z]\.[A-Z]\.\s*$/m, '').trim();
  // Take first paragraph
  const firstPara = text.split(/\n\n+/)[0].trim();
  if (firstPara.length <= maxLen) return firstPara;
  // Cut on sentence boundary if possible
  const cut = firstPara.slice(0, maxLen);
  const lastPeriod = cut.lastIndexOf('. ');
  if (lastPeriod > maxLen * 0.6) return cut.slice(0, lastPeriod + 1);
  return cut.trimEnd() + '…';
}

function DissentCard({ stance, onTickerClick }) {
  return (
    <button
      onClick={() => onTickerClick?.(stance.ticker)}
      style={{
        all: 'unset',
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        background: BRAND.altRow,
        borderLeft: `3px solid ${BRAND.gold}`,
        borderRadius: 3,
        padding: '9px 12px',
        cursor: 'pointer',
        transition: 'background 0.15s ease, border-left-color 0.15s ease',
        width: '100%',
        boxSizing: 'border-box',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = BRAND.cardHover;
        e.currentTarget.style.borderLeftColor = SCORE_COLORS.yellow;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = BRAND.altRow;
        e.currentTarget.style.borderLeftColor = BRAND.gold;
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 700,
            color: BRAND.gold,
            letterSpacing: 0.3,
          }}
        >
          ◆ {stance.ticker}
        </span>
        <span
          style={{
            fontFamily: mono,
            fontSize: 9.5,
            color: BRAND.muted,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          }}
        >
          DISSENT · {stance.analyst}
        </span>
      </div>
      <div
        style={{
          fontFamily: sans,
          fontSize: 10.5,
          color: BRAND.textSecondary,
          lineHeight: 1.45,
        }}
      >
        {stance.punch}
      </div>
    </button>
  );
}

function AnalystBand({ analyst, stances, onTickerClick }) {
  const dissents = stances?.dissents || [];
  const concurs = stances?.concurs || [];
  const watching = stances?.watching || [];
  const totalCalls = dissents.length + concurs.length + watching.length;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr',
        gap: 16,
        padding: '12px 0',
        borderTop: `1px solid ${BRAND.border}`,
        alignItems: 'start',
      }}
    >
      {/* Left: analyst identity + summary */}
      <div>
        <div
          style={{
            fontFamily: sans,
            fontSize: 15,
            fontWeight: 700,
            color: BRAND.text,
            letterSpacing: 0.3,
          }}
        >
          {analyst.initials}
        </div>
        <div
          style={{
            fontFamily: sans,
            fontSize: 9,
            color: BRAND.gold,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginTop: 2,
          }}
        >
          {analyst.sector}
        </div>
        <div
          style={{
            fontFamily: mono,
            fontSize: 9.5,
            color: BRAND.textSecondary,
            marginTop: 10,
            lineHeight: 1.5,
          }}
        >
          <div>
            <span style={{ color: dissents.length > 0 ? BRAND.gold : BRAND.muted, fontWeight: 700 }}>
              {dissents.length}
            </span>{' '}
            dissent{dissents.length === 1 ? '' : 's'}
          </div>
          <div style={{ color: BRAND.muted }}>
            {concurs.length} concur{concurs.length === 1 ? '' : 's'}
            {watching.length > 0 && ` · ${watching.length} watching`}
          </div>
          <div style={{ color: BRAND.muted, fontSize: 9 }}>
            {totalCalls} name{totalCalls === 1 ? '' : 's'} total
          </div>
        </div>
      </div>

      {/* Right: dissent cards, or concur-only message */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {dissents.length === 0 ? (
          <div
            style={{
              fontFamily: sans,
              fontSize: 10.5,
              fontStyle: 'italic',
              color: BRAND.muted,
              padding: '10px 0',
              lineHeight: 1.4,
            }}
          >
            {analyst.initials === 'S.K.'
              ? 'Concur across all 5 names — for AI-disruption reasons rather than cyclical margin. Each name is a defensive single-name posture.'
              : `Concurring with T.W.'s regime on all covered names this shift.`}
          </div>
        ) : (
          dissents.map((s) => (
            <DissentCard key={s.ticker} stance={s} onTickerClick={onTickerClick} />
          ))
        )}
      </div>
    </div>
  );
}

function HeroHeader({ totalDissents, totalCalls, synthesisPending, netRead }) {
  return (
    <div style={{ paddingBottom: 14 }}>
      {/* Top row — compact stats: dissent count left, synthesis status right */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 16,
          marginBottom: netRead ? 16 : 4,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span
              style={{
                fontFamily: sans,
                fontSize: 30,
                fontWeight: 700,
                color: totalDissents > 0 ? BRAND.gold : BRAND.muted,
                lineHeight: 1,
                letterSpacing: 0.5,
              }}
            >
              {totalDissents}
            </span>
            <span
              style={{
                fontFamily: sans,
                fontSize: 11,
                color: BRAND.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {totalDissents === 1 ? 'dissent flagged' : 'dissents flagged'}
            </span>
          </div>
          <div
            style={{
              fontFamily: mono,
              fontSize: 10,
              color: BRAND.muted,
              marginTop: 4,
              letterSpacing: 0.3,
            }}
          >
            across {totalCalls} names covered this shift
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontFamily: sans,
              fontSize: 9,
              color: BRAND.gold,
              textTransform: 'uppercase',
              letterSpacing: 1,
              fontWeight: 700,
            }}
          >
            T.W. Synthesis
          </div>
          <div
            style={{
              fontFamily: sans,
              fontSize: 10.5,
              color: netRead ? BRAND.textSecondary : BRAND.muted,
              fontStyle: netRead ? 'normal' : 'italic',
              marginTop: 4,
              lineHeight: 1.4,
            }}
          >
            {synthesisPending
              ? 'Pending — T.W. polls shift reports at end of shift'
              : 'Published · see net read below'}
          </div>
        </div>
      </div>

      {/* Full-width net-read block — only when T.W. has published synthesis */}
      {netRead && (
        <div
          style={{
            background: BRAND.altRow,
            borderLeft: `3px solid ${BRAND.gold}`,
            borderRadius: 3,
            padding: '14px 20px',
            maxWidth: 780,
            margin: '0 auto',
          }}
        >
          {renderMarkdown(netRead, { paraSize: 11.5, bulletSize: 11 })}
        </div>
      )}
    </div>
  );
}

export default function CrossCurrents({ data, onTickerClick }) {
  const at = data?.analyst_team;
  if (!at) return null;

  const issuerDetail = at.issuer_detail || {};

  // Classify every ticker's vs_house_view stance.
  const stances = [];
  for (const [ticker, sections] of Object.entries(issuerDetail)) {
    const vs = sections?.vs_house_view;
    if (!vs) continue;
    stances.push({
      ticker,
      analyst: vs.last_updated_by,
      position: detectPosition(vs.content_md),
      punch: extractPunchLine(vs.content_md),
    });
  }

  // Group by analyst and position.
  const byAnalyst = {};
  for (const s of stances) {
    if (!byAnalyst[s.analyst]) {
      byAnalyst[s.analyst] = { concurs: [], dissents: [], watching: [] };
    }
    if (s.position === 'dissent') byAnalyst[s.analyst].dissents.push(s);
    else if (s.position === 'concur') byAnalyst[s.analyst].concurs.push(s);
    else if (s.position === 'watching') byAnalyst[s.analyst].watching.push(s);
  }

  const totalDissents = stances.filter((s) => s.position === 'dissent').length;
  const totalCalls = stances.length;

  // cross_currents row may be null until T.W. publishes Cross-Currents
  // synthesis (see Phase C / Wave 4 Step 2.C). Populated = show net_read.
  // Wave 4 redesigned cross_currents to long format with `positions` array
  // and `synthesis_md` (preferred) — falls back to legacy net_read_md.
  const cc = at.cross_currents;
  const synthesisPending = !cc;
  const netRead = cc?.synthesis_md || cc?.net_read_md || null;

  return (
    <div>
      <div style={sectionLabel}>Today's Cross-Currents</div>
      <div style={cardShell}>
        <HeroHeader
          totalDissents={totalDissents}
          totalCalls={totalCalls}
          synthesisPending={synthesisPending}
          netRead={netRead}
        />
        {ANALYSTS.map((a) => (
          <AnalystBand
            key={a.initials}
            analyst={a}
            stances={byAnalyst[a.initials] || { concurs: [], dissents: [], watching: [] }}
            onTickerClick={onTickerClick}
          />
        ))}
      </div>
    </div>
  );
}
