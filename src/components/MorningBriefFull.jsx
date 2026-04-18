import { useMemo } from 'react';
import { BRAND } from '../utils/colors';

const sans = 'Arial, sans-serif';
const AMBER = '#c9a633';
const BORDER_INFO = '#3D7A9E';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function formatBriefDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (isNaN(dt)) return null;
  return `${DAYS[dt.getUTCDay()]} ${MONTHS[dt.getUTCMonth()]} ${dt.getUTCDate()}`;
}

function daysBetweenIso(a, b) {
  if (!a || !b) return null;
  const da = new Date(`${a}T00:00:00Z`);
  const db = new Date(`${b}T00:00:00Z`);
  if (isNaN(da) || isNaN(db)) return null;
  return Math.round((db - da) / 86400000);
}

function classifyLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return 'blank';
  if (/^=+$/.test(trimmed) && trimmed.length >= 10) return 'hr';
  // ALL-CAPS header: has at least one letter, zero lowercase letters, >2 chars
  if (trimmed.length > 2 && /[A-Za-z]/.test(trimmed) && !/[a-z]/.test(trimmed)) return 'header';
  if (trimmed.startsWith('-') || trimmed.startsWith('•')) return 'bullet';
  return 'body';
}

export default function MorningBriefFull({ data }) {
  const briefText = data?.desk_brief || '';
  const briefDate = data?.desk_brief_date || null;

  const lines = useMemo(() => {
    if (!briefText) return [];
    const raw = briefText.split(/\r?\n/);
    // Drop leading header title line + leading blanks, so our styled header
    // "Morning Brief · Fri Apr 17" is the single top-level header on screen.
    let i = 0;
    while (i < raw.length && !raw[i].trim()) i++;
    if (i < raw.length && /^MORNING PLAYBOOK/i.test(raw[i].trim())) i++;
    while (i < raw.length && !raw[i].trim()) i++;
    // Also drop the immediately-following separator line if present
    if (i < raw.length && /^=+$/.test(raw[i].trim())) i++;
    while (i < raw.length && !raw[i].trim()) i++;
    const sliced = raw.slice(i);
    return sliced.map((line) => ({ kind: classifyLine(line), text: line }));
  }, [briefText]);

  const snapshotIso = (data?.snapshot_generated_at || data?.generated_at || '').slice(0, 10) || null;
  const daysStale = daysBetweenIso(briefDate, snapshotIso);
  const showStaleBadge = daysStale != null && daysStale > 3;

  const empty = !briefText;

  const cardBase = {
    background: BRAND.card,
    border: `1px solid ${BRAND.border}`,
    borderRadius: 5,
    padding: empty ? '14px 18px' : '20px 24px',
  };
  const cardWithAccent = empty
    ? cardBase
    : { ...cardBase, borderLeft: `3px solid ${BORDER_INFO}` };

  if (empty) {
    return (
      <div id="morning-brief-full" style={cardBase}>
        <div
          style={{
            fontFamily: sans,
            fontSize: 12,
            color: BRAND.textSecondary,
            padding: '12px 0',
            textAlign: 'center',
          }}
        >
          Morning brief loads after 6:00 AM playbook run
        </div>
      </div>
    );
  }

  return (
    <div id="morning-brief-full" style={cardWithAccent}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 14,
          paddingBottom: 10,
          borderBottom: `1px solid ${BRAND.border}`,
        }}
      >
        <span
          style={{
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 700,
            color: BRAND.gold,
            textTransform: 'uppercase',
            letterSpacing: 1.1,
          }}
        >
          Morning Brief
        </span>
        {briefDate && (
          <span style={{ fontFamily: sans, fontSize: 12, color: BRAND.textSecondary }}>
            · {formatBriefDate(briefDate)}
          </span>
        )}
        {showStaleBadge && (
          <span
            title={`Latest brief is ${daysStale} days older than the current snapshot.`}
            style={{
              fontFamily: sans,
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 10,
              background: 'rgba(201, 166, 51, 0.15)',
              border: `1px solid ${AMBER}`,
              color: AMBER,
              fontWeight: 600,
            }}
          >
            {daysStale}d stale
          </span>
        )}
      </div>

      <div style={{ fontFamily: sans, fontSize: 14, lineHeight: 1.6, color: BRAND.text }}>
        {lines.map((ln, i) => {
          if (ln.kind === 'blank') {
            return <div key={i} style={{ height: 10 }} />;
          }
          if (ln.kind === 'hr') {
            return (
              <hr
                key={i}
                style={{
                  border: 'none',
                  borderTop: `1px solid ${BRAND.border}`,
                  margin: '14px 0',
                }}
              />
            );
          }
          if (ln.kind === 'header') {
            return (
              <div
                key={i}
                style={{
                  fontFamily: sans,
                  fontSize: 12,
                  fontWeight: 700,
                  color: BRAND.gold,
                  textTransform: 'uppercase',
                  letterSpacing: 1.1,
                  marginTop: 14,
                  marginBottom: 6,
                }}
              >
                {ln.text.trim()}
              </div>
            );
          }
          if (ln.kind === 'bullet') {
            return (
              <div
                key={i}
                style={{
                  fontFamily: sans,
                  fontSize: 13,
                  color: BRAND.text,
                  paddingLeft: 14,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {ln.text}
              </div>
            );
          }
          return (
            <div
              key={i}
              style={{
                fontFamily: sans,
                fontSize: 13,
                color: BRAND.text,
                whiteSpace: 'pre-wrap',
              }}
            >
              {ln.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
