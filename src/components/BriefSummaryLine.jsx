import { BRAND } from '../utils/colors';

const sans = 'Arial, sans-serif';
const BORDER_INFO = '#3D7A9E';

export default function BriefSummaryLine({ data }) {
  const raw =
    (data?.morning_briefs && !Array.isArray(data.morning_briefs) && data.morning_briefs.desk_brief) ||
    data?.desk_brief ||
    null;

  const teaser = raw ? String(raw).trim().slice(0, 80) : null;
  const text = teaser ? `${teaser}${raw.length > 80 ? '…' : ''}` : 'Brief loading at 6:00 AM';

  const handleClick = () => {
    const el = document.getElementById('morning-brief-full');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      onClick={handleClick}
      style={{
        background: BRAND.card,
        borderLeft: `2px solid ${BORDER_INFO}`,
        borderRadius: 3,
        padding: '5px 10px',
        cursor: 'pointer',
        fontFamily: sans,
        fontSize: 11,
        color: teaser ? BRAND.text : BRAND.textSecondary,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
      title={teaser ? raw : text}
    >
      {text}
    </div>
  );
}
