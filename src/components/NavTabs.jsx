import { BRAND } from '../utils/colors';

const TABS = [
  { key: 'pm', label: 'PM' },
  { key: 'desk_intel', label: 'The Pod' },
  { key: 'topideas', label: 'Top Ideas' },
  { key: 'earnings', label: 'Earnings' },
  { key: 'universe', label: 'Universe' },
  { key: 'macro', label: 'Macro' },
  { key: 'alerts', label: 'Alerts' },
  { key: 'library', label: 'Library' },
  { key: 'methodology', label: 'Methodology' },
  { key: 'dashboard', label: 'Legacy' },
];

export default function NavTabs({ activeView, onViewChange }) {
  return (
    <div
      style={{
        background: BRAND.card,
        borderBottom: `1px solid ${BRAND.border}`,
        display: 'flex',
        gap: 0,
        maxWidth: 1100,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {TABS.map((tab) => {
        const active = activeView === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onViewChange(tab.key)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: active ? `2px solid ${BRAND.gold}` : '2px solid transparent',
              color: active ? BRAND.gold : BRAND.muted,
              fontWeight: active ? 600 : 400,
              fontFamily: 'Arial, sans-serif',
              fontSize: 11.5,
              padding: '9px 14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
