import { useState } from 'react';
import HouseView from '../components/HouseView';
import CrossCurrentsMini from '../components/CrossCurrentsMini';
import ActivityFeed from '../components/ActivityFeed';
import CatalystWatch from '../components/CatalystWatch';
import QuantBriefPanel from '../components/QuantBriefPanel';
import TriageTop5Panel from '../components/TriageTop5Panel';
import TopIdeasTop5Panel from '../components/TopIdeasTop5Panel';
import EarningsTodayPanel from '../components/EarningsTodayPanel';
import MorningBriefFull from '../components/MorningBriefFull';
import { BRAND } from '../utils/colors';

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

/**
 * PM Dashboard — the new front page.
 *
 * Designed for a 2-5 minute "what matters today" read by a time-constrained PM
 * sitting down at their desk. Composes existing Wave 4 building blocks plus
 * four new lightweight panels (QuantBriefPanel, TriageTop5Panel,
 * TopIdeasTop5Panel, EarningsTodayPanel).
 *
 * Layout:
 *   Hero (full width)         — HouseView (T.W.'s regime + drivers + catalysts)
 *   Two-column grid:
 *     Left rail  (FLOW)       — Quant Brief, Cross-Currents mini, Activity feed
 *     Right rail (ACTION)     — Top Ideas, Triage, Catalysts, Earnings
 *   Footer                    — Expandable full morning playbook text
 *
 * Empty-state contract: every panel renders a one-line muted placeholder
 * when its data is null/[]. Never crash, never show "—" without context.
 *
 * Phase 1 scope. Phase 2 adds URL routing. Phase 3 wires the bottom-up
 * top_ideas pipeline.
 */
export default function PMDashboard({ data, tickerStatus, onTickerClick, onNavigate }) {
  const [briefOpen, setBriefOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingTop: 4 }}>
      {/* Hero — House View as full-width regime statement */}
      <HouseView data={data} />

      {/* Two-column layout — flow (context) vs action (what to do today) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 18,
          alignItems: 'start',
        }}
      >
        {/* LEFT RAIL — FLOW (context, scannable) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <QuantBriefPanel data={data} />
          <CrossCurrentsMini
            data={data}
            onTickerClick={onTickerClick}
            onSeeAll={() => onNavigate?.('desk_intel')}
            maxDissents={3}
          />
          <ActivityFeed data={data} onTickerClick={onTickerClick} limit={10} />
        </div>

        {/* RIGHT RAIL — ACTION (what to do) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <TopIdeasTop5Panel data={data} onTickerClick={onTickerClick} />
          <TriageTop5Panel data={data} onTickerClick={onTickerClick} />
          <div>
            <div style={sectionLabel}>Today's Catalysts</div>
            <CatalystWatch
              data={data}
              sectorFilter="all"
              tickerStatus={tickerStatus}
              onTickerClick={onTickerClick}
            />
          </div>
          <EarningsTodayPanel data={data} onTickerClick={onTickerClick} />
        </div>
      </div>

      {/* Footer — full desk brief, collapsed by default */}
      <div
        style={{
          background: BRAND.card,
          border: `1px solid ${BRAND.border}`,
          borderRadius: 5,
          padding: '12px 14px',
        }}
      >
        <button
          onClick={() => setBriefOpen((v) => !v)}
          style={{
            all: 'unset',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <span style={{ ...sectionLabel, marginBottom: 0 }}>
            Full Morning Playbook
            <span
              style={{
                color: BRAND.muted,
                fontWeight: 500,
                marginLeft: 8,
                textTransform: 'none',
                letterSpacing: 0.5,
              }}
            >
              {briefOpen ? '— click to collapse' : '— click to expand'}
            </span>
          </span>
          <span style={{ fontFamily: sans, fontSize: 14, color: BRAND.gold }}>
            {briefOpen ? '▾' : '▸'}
          </span>
        </button>
        {briefOpen && (
          <div style={{ marginTop: 12 }}>
            <MorningBriefFull data={data} />
          </div>
        )}
      </div>
    </div>
  );
}
