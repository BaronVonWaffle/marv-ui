import MorningBriefFull from '../components/MorningBriefFull';
import { BRAND } from '../utils/colors';

const sans = 'Arial, sans-serif';

/**
 * /playbook route — standalone view of the full morning playbook text
 * for direct sharing/printing. The PM Dashboard footer also embeds this
 * inline (collapsed by default).
 */
export default function PlaybookRoute({ data }) {
  return (
    <div style={{ paddingTop: 8 }}>
      <div
        style={{
          fontSize: 11,
          color: BRAND.gold,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          marginBottom: 10,
          fontWeight: 700,
          fontFamily: sans,
        }}
      >
        Full Morning Playbook
        {data?.desk_brief_date && (
          <span
            style={{
              color: BRAND.muted,
              fontWeight: 500,
              marginLeft: 10,
              textTransform: 'none',
              letterSpacing: 0.5,
            }}
          >
            — {data.desk_brief_date}
          </span>
        )}
      </div>
      <MorningBriefFull data={data} />
    </div>
  );
}
