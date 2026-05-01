import CoverageTeam from '../components/CoverageTeam';
import HouseView from '../components/HouseView';
import CrossCurrents from '../components/CrossCurrents';
import ActivityFeed from '../components/ActivityFeed';
import { BRAND } from '../utils/colors';

const sans = 'Arial, sans-serif';
const mono = "'JetBrains Mono', monospace";

// Desk Intelligence — the home surface for the senior analyst team POC.
// Everything the T.W./A.V./J.R./S.K. team produces surfaces here so the
// Dashboard stays focused on quantitative pipeline output.
//
// Sections (in order):
//   1. Coverage Team cards  (who covered what, when, hit rate)
//   2. Today's Cross-Currents (dissents + T.W. synthesis)
//   3. Today's Activity Feed (timestamped log of all analyst actions)
//   4. [Phase B.4] T.W. House View — regime + drivers + catalysts

export default function DeskIntelligence({ data, onTickerClick, onAnalystClick }) {
  const hasTeam = Boolean(data?.has_analyst_team);

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
            Senior analyst team output — T.W. macro, A.V. chemicals, J.R. industrials & machinery, S.K. software & tech
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

      {/* 1. Coverage Team */}
      <CoverageTeam data={data} onAnalystClick={onAnalystClick} />

      {/* 2. T.W. House View — regime frame that Cross-Currents references */}
      <HouseView data={data} />

      {/* 3. Today's Cross-Currents */}
      <CrossCurrents data={data} onTickerClick={onTickerClick} />

      {/* 4. Today's Activity Feed */}
      <ActivityFeed data={data} onTickerClick={onTickerClick} />

    </div>
  );
}
