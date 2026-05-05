import { useState } from 'react';
import CoverageTeam from '../components/CoverageTeam';
import HouseView from '../components/HouseView';
import CrossCurrents from '../components/CrossCurrents';
import ActivityFeed from '../components/ActivityFeed';
import { BRAND } from '../utils/colors';

const sans = 'Arial, sans-serif';
const mono = "'JetBrains Mono', monospace";

// Wave 6: sort + position filter controls above the Coverage Team grid.
const SORT_OPTIONS = [
  { id: 'sector',     label: 'Sector A–Z' },
  { id: 'recent',     label: 'Most active' },
  { id: 'hit_rate',   label: 'Hit rate' },
  { id: 'top_trades', label: 'Top trades' },
];

const FILTER_OPTIONS = [
  { id: 'all',      label: 'All' },
  { id: 'concur',   label: 'Concur' },
  { id: 'dissent',  label: 'Dissent' },
  { id: 'watching', label: 'Watching' },
];

function ControlsBar({ sortBy, onSortChange, filterPosition, onFilterChange }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        padding: '4px 2px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            fontFamily: sans,
            fontSize: 9,
            color: BRAND.muted,
            textTransform: 'uppercase',
            letterSpacing: 0.7,
            fontWeight: 700,
          }}
        >
          Sort:
        </span>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          style={{
            fontFamily: sans,
            fontSize: 11,
            color: BRAND.text,
            background: BRAND.card,
            border: `1px solid ${BRAND.border}`,
            borderRadius: 3,
            padding: '3px 6px',
            cursor: 'pointer',
          }}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            fontFamily: sans,
            fontSize: 9,
            color: BRAND.muted,
            textTransform: 'uppercase',
            letterSpacing: 0.7,
            fontWeight: 700,
          }}
        >
          Vs House View:
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {FILTER_OPTIONS.map((f) => {
            const isActive = filterPosition === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onFilterChange(f.id)}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  fontFamily: sans,
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? BRAND.card : BRAND.muted,
                  background: isActive ? BRAND.gold : 'transparent',
                  border: `1px solid ${isActive ? BRAND.gold : BRAND.border}`,
                  borderRadius: 3,
                  padding: '3px 8px',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Desk Intelligence — the home surface for the senior analyst team POC.
// Everything the T.W./A.V./J.R./S.K. team produces surfaces here so the
// Dashboard stays focused on quantitative pipeline output.
//
// Sections (in order):
//   1. Coverage Team cards  (who covered what, when, hit rate)
//   2. Today's Cross-Currents (dissents + T.W. synthesis)
//   3. Today's Activity Feed (timestamped log of all analyst actions)
//   4. [Phase B.4] T.W. House View — regime + drivers + catalysts

export default function ThePod({ data, onTickerClick, onAnalystClick }) {
  const hasTeam = Boolean(data?.has_analyst_team);
  const [sortBy, setSortBy] = useState('sector');
  const [filterPosition, setFilterPosition] = useState('all');

  if (!hasTeam) {
    return (
      <div
        style={{
          padding: '40px 16px',
          textAlign: 'center',
          fontFamily: sans,
          color: BRAND.textSecondary,
          fontSize: 12,
        }}
      >
        Analyst team content not present in this snapshot.
      </div>
    );
  }

  const snapshotGeneratedAt = data?.snapshot_generated_at || data?.generated_at;
  const shiftDateLabel = snapshotGeneratedAt
    ? new Date(
        snapshotGeneratedAt.includes('T')
          ? snapshotGeneratedAt
          : snapshotGeneratedAt.replace(' ', 'T')
      ).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Page header — surface-level framing, sets the narrative */}
      <div
        style={{
          padding: '2px 2px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: sans,
              fontSize: 18,
              fontWeight: 700,
              color: BRAND.text,
              letterSpacing: 0.3,
              marginBottom: 2,
            }}
          >
            Desk Intelligence
          </div>
          <div
            style={{
              fontFamily: sans,
              fontSize: 10.5,
              color: BRAND.textSecondary,
              letterSpacing: 0.3,
            }}
          >
            Senior analyst team output — Macro, Quant, and 11 sector
            fundamentals. Click any card for the two-minute pitch.
          </div>
        </div>
        {shiftDateLabel && (
          <div
            style={{
              fontFamily: mono,
              fontSize: 10,
              color: BRAND.textSecondary,
              letterSpacing: 0.4,
            }}
          >
            Shift of {shiftDateLabel}
          </div>
        )}
      </div>

      {/* 1. Coverage Team — clicking a ticker pill in the top trades row
          opens IssuerDetail directly (skip the AnalystPanel hop). The
          ControlsBar drives sort + position filter on the team grid. */}
      <ControlsBar
        sortBy={sortBy}
        onSortChange={setSortBy}
        filterPosition={filterPosition}
        onFilterChange={setFilterPosition}
      />
      <CoverageTeam
        data={data}
        onAnalystClick={onAnalystClick}
        onTickerClick={onTickerClick}
        sortBy={sortBy}
        filterPosition={filterPosition}
      />

      {/* 2. T.W. House View — regime frame that Cross-Currents references */}
      <HouseView data={data} />

      {/* 3. Today's Cross-Currents */}
      <CrossCurrents data={data} onTickerClick={onTickerClick} />

      {/* 4. Today's Activity Feed */}
      <ActivityFeed data={data} onTickerClick={onTickerClick} />

    </div>
  );
}
