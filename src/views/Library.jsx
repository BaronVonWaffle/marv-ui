import { useState, useMemo } from 'react';
import { BRAND } from '../utils/colors';
import { formatDate } from '../utils/format';

const sans = 'Arial, sans-serif';

const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'credit_profile', label: 'Credit Profiles' },
  { key: 'deep_dive', label: 'Deep Dives' },
  { key: 'cap_structure', label: 'Capital Structure' },
  { key: 'earnings', label: 'Earnings' },
  { key: 'pre_game', label: 'Pre-Game' },
  { key: 'other', label: 'Other' },
];

const TYPE_COLORS = {
  deep_dive: BRAND.sage,
  cap_structure: BRAND.navyLight,
  earnings: '#e67e22',
  credit_profile: '#0097a7',
  pre_game: '#7c4dff',
};

function typeBadgeColor(type) { return TYPE_COLORS[type] || BRAND.muted; }
function typeLabel(type) {
  const entry = TYPE_FILTERS.find((f) => f.key === type);
  return entry ? entry.label : type || 'Other';
}

export default function Library({ data }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortMode, setSortMode] = useState('recent');

  const docs = useMemo(() => {
    let list = data?.research || [];
    if (typeFilter !== 'all') {
      list = list.filter((d) => {
        const dt = (d.document_type || '').toLowerCase();
        if (typeFilter === 'other') return !Object.keys(TYPE_COLORS).includes(dt);
        return dt === typeFilter;
      });
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) => (d.issuer_name || '').toLowerCase().includes(q) || (d.document_type || '').toLowerCase().includes(q));
    }
    if (sortMode === 'recent') list = [...list].sort((a, b) => (b.date_produced || '') > (a.date_produced || '') ? 1 : -1);
    else list = [...list].sort((a, b) => (a.issuer_name || '').localeCompare(b.issuer_name || ''));
    return list;
  }, [data, typeFilter, search, sortMode]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search issuer or type..."
          style={{ flex: '1 1 200px', padding: '7px 10px', fontFamily: sans, fontSize: 12, border: `1px solid ${BRAND.border}`, borderRadius: 4, outline: 'none', boxSizing: 'border-box', background: BRAND.card, color: BRAND.text }}
        />
        <button
          onClick={() => setSortMode(sortMode === 'recent' ? 'alpha' : 'recent')}
          style={{ fontFamily: sans, fontSize: 10, fontWeight: 600, padding: '6px 10px', border: `1px solid ${BRAND.border}`, borderRadius: 4, background: BRAND.card, color: BRAND.text, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {sortMode === 'recent' ? '↓ Most Recent' : '↓ Issuer A-Z'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {TYPE_FILTERS.map((f) => {
          const active = typeFilter === f.key;
          return (
            <button
              key={f.key} onClick={() => setTypeFilter(f.key)}
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

      {docs.length === 0 && (
        <div style={{ textAlign: 'center', color: BRAND.muted, fontFamily: sans, fontSize: 12, padding: 40 }}>
          No research documents yet. Documents appear here as credit skills produce output.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
        {docs.map((doc, i) => {
          const color = typeBadgeColor(doc.document_type);
          return (
            <div
              key={doc.filename || i}
              onClick={() => window.open(import.meta.env.BASE_URL + 'research/' + doc.filename, '_blank')}
              style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 5, padding: '12px 14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = BRAND.hover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = BRAND.card)}
            >
              <span style={{ alignSelf: 'flex-start', display: 'inline-block', background: color, color: '#fff', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', borderRadius: 3, padding: '2px 7px' }}>
                {typeLabel(doc.document_type)}
              </span>
              <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 14, color: BRAND.text }}>{doc.issuer_name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: BRAND.muted }}>{doc.date_produced ? formatDate(doc.date_produced) : '—'}</span>
                {doc.file_size_kb != null && <span style={{ fontSize: 10, color: BRAND.muted }}>{doc.file_size_kb} KB</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
