import Macro from './Macro';
import Alerts from './Alerts';
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

// Wave 9 (2026-05-14): consolidates the old /macro and /alerts tabs into one
// "Tape" view. Same underlying components — just stacked under a single route
// so the nav bar has 6 tabs instead of 11.
export default function Tape({ data, sectorFilter, onTickerClick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={sectionLabel}>Macro & Connections</div>
        <Macro
          data={data}
          sectorFilter={sectorFilter}
          onTickerClick={onTickerClick}
        />
      </div>
      <div>
        <div style={sectionLabel}>Alerts</div>
        <Alerts
          data={data}
          sectorFilter={sectorFilter}
          onTickerClick={onTickerClick}
        />
      </div>
    </div>
  );
}
