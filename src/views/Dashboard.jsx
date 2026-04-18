import { useMemo } from 'react';
import StatCardTierMoves from '../components/StatCardTierMoves';
import StatCardSectorTilt from '../components/StatCardSectorTilt';
import StatCardPlaceholder from '../components/StatCardPlaceholder';
import SectorSpreadStrip from '../components/SectorSpreadStrip';
import BriefSummaryLine from '../components/BriefSummaryLine';
import SectorTag from '../components/SectorTag';
import { BRAND } from '../utils/colors';
import { formatDate, formatDateWithYear } from '../utils/format';

const mono = "'JetBrains Mono', monospace";
const sans = 'Arial, sans-serif';

const sectionLabel = {
  fontSize: 10,
  fontWeight: 700,
  fontFamily: sans,
  textTransform: 'uppercase',
  color: BRAND.gold,
  letterSpacing: 1.2,
  marginBottom: 6,
};

const card = {
  background: BRAND.card,
  border: `1px solid ${BRAND.border}`,
  borderRadius: 5,
  padding: '10px 14px',
};

const placeholderCard = {
  ...card,
  border: `0.5px dashed ${BRAND.border}`,
};

const placeholderBody = {
  fontFamily: sans,
  fontSize: 11,
  color: BRAND.textSecondary,
  padding: '18px 0',
  textAlign: 'center',
};

function snapshotDateISO(generatedAt) {
  if (!generatedAt) return null;
  const d = new Date(generatedAt);
  if (isNaN(d)) return null;
  return d.toISOString().slice(0, 10);
}

function priorBusinessDay(iso) {
  if (!iso) return null;
  const [y, m, day] = iso.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1, day));
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export default function Dashboard({ data, sectorFilter, onTickerClick }) {
  const currentScores = data?.fundamental_scores_v2 || [];
  const scoreHistory = data?.score_history_v2 || [];
  const issuers = data?.issuers || [];
  const staleTables = data?.stale_tables || [];
  const snapshotGeneratedAt = data?.snapshot_generated_at || data?.generated_at || null;

  const issuersByTicker = useMemo(() => {
    const out = {};
    for (const row of issuers) {
      if (row?.ticker) out[row.ticker] = row;
    }
    return out;
  }, [issuers]);

  const scoreHistoryByTicker = useMemo(() => {
    const out = {};
    for (const row of scoreHistory) {
      if (!row?.ticker) continue;
      (out[row.ticker] ||= []).push(row);
    }
    for (const k of Object.keys(out)) {
      out[k].sort((a, b) => (a.score_date || '').localeCompare(b.score_date || ''));
    }
    return out;
  }, [scoreHistory]);

  const snapshotDate = snapshotDateISO(snapshotGeneratedAt);
  const closeDate = priorBusinessDay(snapshotDate);
  const asOfLabel = closeDate ? `As of ${formatDate(closeDate)} close (T-1)` : 'As of — (T-1)';

  const isStale = Array.isArray(staleTables) && staleTables.length > 0;

  const briefs = useMemo(() => {
    if (!Array.isArray(data?.morning_briefs)) return [];
    if (!sectorFilter || sectorFilter === 'all') return data.morning_briefs;
    return data.morning_briefs.filter(
      (b) => b.sector?.toLowerCase() === sectorFilter.toLowerCase()
    );
  }, [data, sectorFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* SECTION 1: Dashboard sub-header — data-as-of + hygiene */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '2px 2px',
        }}
      >
        <span
          style={{
            fontFamily: mono,
            fontSize: 10,
            color: BRAND.textSecondary,
            letterSpacing: 0.4,
          }}
        >
          {asOfLabel}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isStale ? '#c9a633' : '#2d9d6e',
              display: 'inline-block',
            }}
          />
          {isStale ? (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                const m = document.getElementById('methodology-stale');
                if (m) m.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{ fontFamily: sans, fontSize: 10, color: '#c9a633', textDecoration: 'none' }}
            >
              {staleTables.length} stale
            </a>
          ) : (
            <span style={{ fontFamily: sans, fontSize: 10, color: BRAND.textSecondary }}>
              Data OK
            </span>
          )}
        </span>
      </div>

      {/* SECTION 2: Brief summary line */}
      <BriefSummaryLine data={data} />

      {/* SECTION 3: Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
        }}
      >
        <StatCardTierMoves
          currentScores={currentScores}
          scoreHistoryByTicker={scoreHistoryByTicker}
        />
        <StatCardSectorTilt
          currentScores={currentScores}
          issuersByTicker={issuersByTicker}
          sectorFilter={sectorFilter}
        />
        <StatCardPlaceholder title="Equity reversals" subtext="Coming · Session 8" />
      </div>

      {/* SECTION 4: Sector spread strip */}
      <SectorSpreadStrip issuers={issuers} sectorFilter={sectorFilter} />

      {/* SECTION 5: Notables */}
      {/* C-A.2.2 */}
      <div style={placeholderCard}>
        <div style={sectionLabel}>Notables</div>
        <div style={placeholderBody}>Populated in C-A.2.2</div>
      </div>

      {/* SECTION 6: Movers */}
      {/* C-A.2.2 */}
      <div style={placeholderCard}>
        <div style={sectionLabel}>Movers</div>
        <div style={placeholderBody}>Populated in C-A.2.2</div>
      </div>

      {/* SECTION 7: Catalyst Watch */}
      {/* C-A.2.3 */}
      <div style={placeholderCard}>
        <div style={sectionLabel}>Catalyst Watch</div>
        <div style={placeholderBody}>Populated in C-A.2.3</div>
      </div>

      {/* SECTION 8: Macro Calendar */}
      {/* C-A.2.3 */}
      <div style={placeholderCard}>
        <div style={sectionLabel}>Macro Calendar</div>
        <div style={placeholderBody}>Populated in C-A.2.3</div>
      </div>

      {/* SECTION 9: Morning Brief (full) */}
      {/* C-A.2.3 — for now we still render existing sector briefs so the anchor is usable */}
      <div id="morning-brief-full" style={placeholderCard}>
        <div style={sectionLabel}>Morning Brief</div>
        {briefs.length === 0 ? (
          <div style={placeholderBody}>Populated in C-A.2.3</div>
        ) : (
          briefs.map((brief, i) => (
            <div key={i} style={{ marginBottom: i < briefs.length - 1 ? 12 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                {brief.sector && <SectorTag sector={brief.sector} />}
                <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 600, color: BRAND.text }}>
                  {formatDateWithYear(brief.brief_date)}
                </span>
              </div>
              <pre
                style={{
                  fontFamily: sans,
                  fontSize: 12,
                  lineHeight: 1.6,
                  color: BRAND.text,
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                  background: BRAND.navyDark,
                  padding: '8px 10px',
                  borderRadius: 4,
                }}
              >
                {brief.brief_text}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
