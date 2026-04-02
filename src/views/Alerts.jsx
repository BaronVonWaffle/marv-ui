import { useState, useMemo } from 'react';
import SectorTag from '../components/SectorTag';
import SeverityDot from '../components/SeverityDot';
import { BRAND } from '../utils/colors';
import { formatDate } from '../utils/format';

const mono = "'JetBrains Mono', monospace";
const sans = 'Arial, sans-serif';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'flag', label: 'Equity Flags' },
  { key: 'macro', label: 'Macro Connections' },
  { key: 'catalyst', label: 'Catalysts' },
];

const TYPE_BADGE = {
  flag: { label: 'Flag', bg: '#e67e22', color: '#fff' },
  macro: { label: 'Macro', bg: '#2196f3', color: '#fff' },
  catalyst: { label: 'Catalyst', bg: '#7c4dff', color: '#fff' },
};

function normalizeAlerts(data) {
  const alerts = [];
  (data?.equity_flags || []).forEach((f) => {
    alerts.push({ type: 'flag', ticker: f.ticker, sector: f.sector, severity: f.severity || 'medium', date: f.date || f.flag_date, text: [f.flag_type, f.peer_group_context].filter(Boolean).join(' — ') });
  });
  (data?.connection_summary || []).forEach((c) => {
    const isConvergent = (c.equity_convergence || '').toLowerCase().includes('convergent');
    alerts.push({ type: 'macro', ticker: c.ticker, sector: c.sector, severity: isConvergent ? 'critical' : 'medium', date: c.date || c.analysis_date, text: [c.equity_convergence, c.dominant_driver].filter(Boolean).join(' — '), convergent: isConvergent });
  });
  (data?.catalysts || []).forEach((c) => {
    alerts.push({ type: 'catalyst', ticker: c.ticker, sector: c.sector, severity: c.urgency || 'low', date: c.date, text: [c.catalyst_type, c.description].filter(Boolean).join(' — ') });
  });
  return alerts;
}

export default function Alerts({ data, sectorFilter, onTickerClick }) {
  const [filter, setFilter] = useState('all');

  const alerts = useMemo(() => {
    let list = normalizeAlerts(data);
    if (sectorFilter !== 'all') list = list.filter((a) => a.sector?.toLowerCase() === sectorFilter.toLowerCase());
    if (filter !== 'all') list = list.filter((a) => a.type === filter);
    list.sort((a, b) => ((b.date || '') > (a.date || '') ? 1 : -1));
    return list;
  }, [data, sectorFilter, filter]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                fontFamily: sans, fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 9999,
                border: active ? 'none' : `1px solid ${BRAND.border}`,
                background: active ? BRAND.sage : BRAND.card,
                color: active ? BRAND.navyDark : BRAND.textSecondary,
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {alerts.length === 0 && (
        <div style={{ fontSize: 12, color: BRAND.muted, textAlign: 'center', padding: 24 }}>No alerts</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {alerts.map((alert, i) => {
          const badge = TYPE_BADGE[alert.type];
          return (
            <div key={i} style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 5, padding: '8px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span onClick={() => onTickerClick?.(alert.ticker)} style={{ fontFamily: mono, fontWeight: 700, fontSize: 12, color: BRAND.white, cursor: 'pointer' }} onMouseEnter={(e) => { e.target.style.color = BRAND.sage; e.target.style.textDecoration = 'underline'; }} onMouseLeave={(e) => { e.target.style.color = BRAND.white; e.target.style.textDecoration = 'none'; }}>
                  {alert.ticker}
                </span>
                {alert.sector && <SectorTag sector={alert.sector} />}
                <span style={{
                  display: 'inline-block',
                  background: alert.convergent ? 'rgba(192, 57, 43, 0.2)' : badge.bg,
                  color: alert.convergent ? '#c0392b' : badge.color,
                  fontSize: 9, fontWeight: 700, textTransform: 'uppercase', borderRadius: 3, padding: '1px 6px',
                  border: alert.convergent ? '1px solid rgba(192, 57, 43, 0.4)' : 'none',
                }}>
                  {alert.convergent ? 'Convergent' : badge.label}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SeverityDot severity={alert.severity} />
                  <span style={{ fontSize: 10, color: BRAND.textSecondary, textTransform: 'capitalize' }}>{alert.severity}</span>
                </span>
                <span style={{ marginLeft: 'auto', fontFamily: mono, fontSize: 10, color: BRAND.muted }}>
                  {alert.date ? formatDate(alert.date) : ''}
                </span>
              </div>
              {alert.text && (
                <div style={{ fontFamily: sans, fontSize: 11, color: BRAND.text, marginTop: 4, lineHeight: 1.5 }}>
                  {alert.text}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
