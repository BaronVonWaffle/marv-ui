import { BRAND } from '../utils/colors';

const sans = 'Arial, sans-serif';
const BORDER_INFO = '#3D7A9E';

function isAllCapsHeader(t) {
  return t.length > 2 && /[A-Za-z]/.test(t) && !/[a-z]/.test(t);
}

function firstSubstantiveLine(text) {
  if (!text) return null;
  const lines = text.split(/\r?\n/);
  let skippedFirstHeader = false;
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (/^=+$/.test(t)) continue;
    if (/^MORNING PLAYBOOK/i.test(t)) continue;
    if (!skippedFirstHeader && isAllCapsHeader(t)) {
      skippedFirstHeader = true;
      continue;
    }
    return t;
  }
  return null;
}

export default function BriefSummaryLine({ data }) {
  const brief = data?.desk_brief || null;
  const substantive = firstSubstantiveLine(brief);
  const hasContent = !!substantive;
  const teaser = hasContent
    ? substantive.slice(0, 80) + (substantive.length > 80 ? '…' : '')
    : 'Brief loading at 6:00 AM';

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
        color: hasContent ? BRAND.text : BRAND.textSecondary,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
      title={hasContent ? substantive : teaser}
    >
      {teaser}
    </div>
  );
}
