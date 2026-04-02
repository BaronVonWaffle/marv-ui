import { useMemo } from 'react';
import SectorTag from '../components/SectorTag';
import { BRAND, SCORE_COLORS } from '../utils/colors';
import { formatDate } from '../utils/format';

const mono = "'JetBrains Mono', monospace";
const sans = 'Arial, sans-serif';

const CONVICTION_ORDER = { high: 0, medium: 1, low: 2 };

function DirectionBadge({ direction }) {
  const isShort = direction?.toLowerCase() === 'short';
  return (
    <span style={{ display: 'inline-block', background: isShort ? SCORE_COLORS.red : SCORE_COLORS.green, color: '#fff', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', borderRadius: 9999, padding: '2px 8px' }}>
      {isShort ? 'Short' : 'Long'}
    </span>
  );
}

function ConvictionBadge({ conviction }) {
  return (
    <span style={{ display: 'inline-block', background: 'rgba(143,164,181,0.15)', color: BRAND.textSecondary, fontSize: 9, fontWeight: 600, textTransform: 'capitalize', borderRadius: 9999, padding: '2px 8px' }}>
      {conviction || 'N/A'}
    </span>
  );
}

function IdeaCard({ idea }) {
  const footerItems = [
    { label: 'Entry', value: idea.entry },
    { label: 'Catalyst', value: idea.catalyst },
    { label: 'Updated', value: idea.date ? formatDate(idea.date) : idea.updated ? formatDate(idea.updated) : null },
  ].filter((f) => f.value);

  return (
    <div style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 5, padding: '10px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: mono, fontWeight: 700, fontSize: 14, color: BRAND.white }}>{idea.ticker}</span>
        {idea.sector && <SectorTag sector={idea.sector} />}
        <DirectionBadge direction={idea.direction} />
        <ConvictionBadge conviction={idea.conviction} />
      </div>
      {idea.thesis && (
        <div style={{ fontFamily: sans, fontSize: 12, lineHeight: 1.5, color: BRAND.text, marginTop: 8 }}>{idea.thesis}</div>
      )}
      {footerItems.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
          {footerItems.map((item) => (
            <span key={item.label} style={{ fontSize: 10 }}>
              <span style={{ fontWeight: 700, color: BRAND.muted }}>{item.label}:</span>{' '}
              <span style={{ color: BRAND.text }}>{item.value}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TopIdeas({ data, sectorFilter }) {
  const { shorts, longs } = useMemo(() => {
    let ideas = data?.top_ideas || [];
    if (sectorFilter !== 'all') ideas = ideas.filter((i) => i.sector?.toLowerCase() === sectorFilter.toLowerCase());
    const s = ideas.filter((i) => i.direction?.toLowerCase() === 'short').sort((a, b) => (CONVICTION_ORDER[a.conviction] ?? 3) - (CONVICTION_ORDER[b.conviction] ?? 3));
    const l = ideas.filter((i) => i.direction?.toLowerCase() === 'long').sort((a, b) => (CONVICTION_ORDER[a.conviction] ?? 3) - (CONVICTION_ORDER[b.conviction] ?? 3));
    return { shorts: s, longs: l };
  }, [data, sectorFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: BRAND.gold, letterSpacing: 1.2, paddingBottom: 5, borderBottom: `2px solid ${SCORE_COLORS.red}`, marginBottom: 8 }}>
          Top Shorts
        </div>
        {shorts.length === 0 && <div style={{ fontSize: 11, color: BRAND.muted, padding: 12 }}>No short ideas</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shorts.map((idea, i) => <IdeaCard key={idea.ticker || i} idea={idea} />)}
        </div>
      </div>
      <div>
        <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: BRAND.gold, letterSpacing: 1.2, paddingBottom: 5, borderBottom: `2px solid ${SCORE_COLORS.green}`, marginBottom: 8 }}>
          Top Longs
        </div>
        {longs.length === 0 && <div style={{ fontSize: 11, color: BRAND.muted, padding: 12 }}>No long ideas</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {longs.map((idea, i) => <IdeaCard key={idea.ticker || i} idea={idea} />)}
        </div>
      </div>
    </div>
  );
}
