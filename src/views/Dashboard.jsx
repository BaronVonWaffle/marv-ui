import { useMemo } from 'react';
import StatCardTierMoves from '../components/StatCardTierMoves';
import StatCardSectorTilt from '../components/StatCardSectorTilt';
import StatCardPlaceholder from '../components/StatCardPlaceholder';
import SectorSpreadStrip from '../components/SectorSpreadStrip';
import BriefSummaryLine from '../components/BriefSummaryLine';
import Notables from '../components/Notables';
import Movers from '../components/Movers';
import CatalystWatch from '../components/CatalystWatch';
import MorningBriefFull from '../components/MorningBriefFull';
import SeverityDot from '../components/SeverityDot';
import { BRAND } from '../utils/colors';
import { formatDate } from '../utils/format';

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
  const equitySignals = data?.equity_signals || [];
  const issuers = data?.issuers || [];
  const staleTables = data?.stale_tables || [];
  const tickerStatus = data?.ticker_status || {};
  const snapshotGeneratedAt = data?.snapshot_generated_at || data?.generated_at || null;

  const fundamentalByTicker = useMemo(() => {
    const out = {};
    for (const row of currentScores) {
      if (row?.ticker) out[row.ticker] = row;
    }
    return out;
  }, [currentScores]);

  const equityByTicker = useMemo(() => {
    const out = {};
    for (const row of equitySignals) {
      if (row?.ticker) out[row.ticker] = row;
    }
    return out;
  }, [equitySignals]);

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

  const macroEvents = useMemo(() => {
    const rows = data?.economic_calendar || [];
    if (!rows.length) return [];
    const today = (data?.snapshot_generated_at || data?.generated_at || '').slice(0, 10)
      || new Date().toISOString().slice(0, 10);
    const sorted = [...rows].sort((a, b) => (a.event_date || '').localeCompare(b.event_date || ''));
    const future = sorted.filter((e) => e.event_date >= today);
    if (future.length >= 5) return future.slice(0, 5);
    const past = sorted.filter((e) => e.event_date < today).reverse();
    return [...future, ...past].slice(0, 5);
  }, [data]);

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
      <Notables
        data={data}
        fundamentalByTicker={fundamentalByTicker}
        historyByTicker={scoreHistoryByTicker}
        equityByTicker={equityByTicker}
        tickerStatus={tickerStatus}
        sectorFilter={sectorFilter}
        onTickerClick={onTickerClick}
      />

      {/* SECTION 6: Movers */}
      <Movers
        data={data}
        sectorFilter={sectorFilter}
        tickerStatus={tickerStatus}
        onTickerClick={onTickerClick}
      />

      {/* SECTION 7: Catalyst Watch */}
      <CatalystWatch
        data={data}
        sectorFilter={sectorFilter}
        tickerStatus={tickerStatus}
        onTickerClick={onTickerClick}
      />

      {/* SECTION 8: Macro Calendar */}
      <div style={card}>
        <div style={sectionLabel}>Macro Calendar</div>
        {macroEvents.length === 0 ? (
          <div style={{ fontSize: 11, color: BRAND.textSecondary, fontFamily: sans, padding: '10px 0', textAlign: 'center' }}>
            No events
          </div>
        ) : (
          macroEvents.map((evt, i) => {
            const impact = String(evt.impact_level || '').toLowerCase();
            const sev = impact === 'high' ? 'high' : impact === 'medium' ? 'medium' : 'low';
            return (
              <div
                key={`${evt.event_date}-${evt.event_name}-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 0',
                  borderBottom: i < macroEvents.length - 1 ? `1px solid ${BRAND.border}` : 'none',
                }}
              >
                <span style={{ fontFamily: mono, fontSize: 10, color: BRAND.textSecondary, minWidth: 48 }}>
                  {formatDate(evt.event_date)}
                </span>
                <SeverityDot severity={sev} />
                <span style={{ fontFamily: sans, fontSize: 11, color: BRAND.text, flex: 1 }}>
                  {evt.event_name}
                </span>
                {evt.expected_value != null && (
                  <span style={{ fontFamily: mono, fontSize: 10, color: BRAND.textSecondary }}>
                    est {String(evt.expected_value)}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* SECTION 9: Morning Brief (full) */}
      <MorningBriefFull data={data} />
    </div>
  );
}
