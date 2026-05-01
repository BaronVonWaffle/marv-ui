import { useNavigate, useLocation } from 'react-router-dom';
import { BRAND } from '../utils/colors';

const TABS = [
  { path: '/',            label: 'PM' },
  { path: '/pod',         label: 'The Pod' },
  { path: '/issuer',      label: 'Issuer',         matchPrefix: '/issuer' },
  { path: '/top-ideas',   label: 'Top Ideas' },
  { path: '/earnings',    label: 'Earnings' },
  { path: '/universe',    label: 'Universe' },
  { path: '/macro',       label: 'Macro' },
  { path: '/alerts',      label: 'Alerts' },
  { path: '/library',     label: 'Library' },
  { path: '/methodology', label: 'Methodology' },
  { path: '/legacy',      label: 'Legacy' },
];

function isActive(tab, pathname) {
  if (tab.matchPrefix) return pathname === tab.matchPrefix || pathname.startsWith(tab.matchPrefix + '/');
  if (tab.path === '/') return pathname === '/';
  return pathname === tab.path;
}

export default function NavTabs() {
  const navigate = useNavigate();
  const location = useLocation();

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
        overflowX: 'auto',
      }}
    >
      {TABS.map((tab) => {
        const active = isActive(tab, location.pathname);
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
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
