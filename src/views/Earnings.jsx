import { useMemo } from 'react';
import ScoreBadge from '../components/ScoreBadge';
import SectorTag from '../components/SectorTag';
import { BRAND, SCORE_COLORS } from '../utils/colors';
import { formatDate } from '../utils/format';

const mono = "'JetBrains Mono', monospace";
const sans = 'Arial, sans-serif';

export default function Earnings({ data, sectorFilter }) {
  const items = useMemo(() => {
    const events = data?.earnings_events || [];
    const updates = data?.earnings_updates || [];
    const updateMap = {};
    updates.forEach((u) => { if (u.ticker) updateMap[u.ticker] = u; });
    let merged = events.map((e) => ({ ...e, update: updateMap[e.ticker] || null }));
    if (sectorFilter !== 'all') merged = merged.filter((e) => e.sector?.toLowerCase() === sectorFilter.toLowerCase());
    merged.sort((a, b) => ((b.report_date || '') > (a.report_date || '') ? 1 : -1));
    return merged;
  }, [data, sectorFilter]);

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: BRAND.muted, fontFamily: sans, fontSize: 12, padding: 40 }}>
        No earnings updates for current filter. Updates populate as companies report.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item, i) => {
        const beat = item.result?.toLowerCase() === 'beat' || item.surprise?.toLowerCase() === 'beat';
        const miss = item.result?.toLowerCase() === 'miss' || item.surprise?.toLowerCase() === 'miss';
        const update = item.update;

        return (
          <div key={item.ticker + i} style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ background: BRAND.navyDark, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: mono, fontWeight: 700, fontSize: 13, color: BRAND.white }}>{item.ticker}</span>
              {item.sector && <SectorTag sector={item.sector} />}
              {item.quarter && <span style={{ fontSize: 10, color: BRAND.textSecondary }}>{item.quarter}</span>}
              {item.report_date && <span style={{ fontFamily: mono, fontSize: 10, color: BRAND.muted }}>{formatDate(item.report_date)}</span>}
              {(beat || miss) && (
                <span style={{ display: 'inline-block', background: beat ? SCORE_COLORS.green : SCORE_COLORS.red, color: '#fff', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', borderRadius: 9999, padding: '2px 8px' }}>
                  {beat ? 'Beat' : 'Miss'}
                </span>
              )}
              {(item.prior_score || item.new_score) && (
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ScoreBadge score={item.prior_score || 'no_data'} size="sm" />
                  <span style={{ fontSize: 11, color: BRAND.muted }}>→</span>
                  <ScoreBadge score={item.new_score || 'no_data'} size="sm" />
                </span>
              )}
            </div>
            <div style={{ padding: '10px 12px' }}>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 6 }}>
                {item.eps_actual != null && (
                  <span style={{ fontSize: 11 }}>
                    <span style={{ fontWeight: 700, color: BRAND.muted }}>EPS: </span>
                    <span style={{ fontFamily: mono, color: BRAND.text }}>${item.eps_actual}</span>
                    {item.eps_estimate != null && <span style={{ color: BRAND.textSecondary }}> vs ${item.eps_estimate}e</span>}
                  </span>
                )}
                {item.rev_actual != null && (
                  <span style={{ fontSize: 11 }}>
                    <span style={{ fontWeight: 700, color: BRAND.muted }}>Rev: </span>
                    <span style={{ fontFamily: mono, color: BRAND.text }}>${item.rev_actual}M</span>
                    {item.rev_estimate != null && <span style={{ color: BRAND.textSecondary }}> vs ${item.rev_estimate}Me</span>}
                  </span>
                )}
              </div>
              {update?.note_text && (
                <div style={{ fontFamily: sans, fontSize: 12, lineHeight: 1.5, color: BRAND.text, marginTop: 6 }}>{update.note_text}</div>
              )}
              {(() => {
                let changes = update?.key_changes;
                if (typeof changes === 'string') { try { changes = JSON.parse(changes); } catch { changes = null; } }
                if (!Array.isArray(changes) || changes.length === 0) return null;
                return (
                  <div style={{ marginTop: 6 }}>
                    {changes.map((change, j) => (
                      <div key={j} style={{ fontSize: 10, color: BRAND.text, padding: '2px 0', display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ color: BRAND.muted }}>•</span>
                        <span>{typeof change === 'string' ? change : change.description || change.text || JSON.stringify(change)}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
