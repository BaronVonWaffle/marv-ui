import { useState, useMemo } from 'react';
import useData from './hooks/useData';
import Header from './components/Header';
import NavTabs from './components/NavTabs';
import Dashboard from './views/Dashboard';
import DeskIntelligence from './views/DeskIntelligence';
import Universe from './views/Universe';
import Macro from './views/Macro';
import Alerts from './views/Alerts';
import TopIdeas from './views/TopIdeas';
import Earnings from './views/Earnings';
import Library from './views/Library';
import Methodology from './views/Methodology';
import IssuerDetail from './panels/IssuerDetail';
import AnalystPanel from './panels/AnalystPanel';
import { BRAND } from './utils/colors';

const sans = 'Arial, sans-serif';

export default function App() {
  const { data, loading, error } = useData();
  const [activeView, setActiveView] = useState('dashboard');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [selectedAnalyst, setSelectedAnalyst] = useState(null);

  const sectors = useMemo(() => {
    if (!data?.scores) return [];
    return Array.from(new Set(data.scores.map((s) => s.sector).filter(Boolean))).sort();
  }, [data]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: sans,
          color: BRAND.muted,
          background: BRAND.bg,
          gap: 12,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            border: `3px solid ${BRAND.border}`,
            borderTop: `3px solid ${BRAND.sage}`,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: 12 }}>Loading pipeline data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: sans,
          background: BRAND.bg,
          gap: 8,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: BRAND.text }}>
          Failed to load data
        </div>
        <div style={{ fontSize: 12, color: '#c0392b' }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ background: BRAND.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        nameCount={data?.scores?.length || 0}
        sectorFilter={sectorFilter}
        onSectorFilterChange={setSectorFilter}
        sectors={sectors}
        generatedAt={data?.generated_at}
      />
      <NavTabs activeView={activeView} onViewChange={setActiveView} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 13, width: '100%', boxSizing: 'border-box', flex: 1 }}>
        {activeView === 'dashboard' && (
          <Dashboard
            data={data}
            sectorFilter={sectorFilter}
            onTickerClick={setSelectedTicker}
          />
        )}
        {activeView === 'desk_intel' && (
          <DeskIntelligence
            data={data}
            onTickerClick={setSelectedTicker}
            onAnalystClick={setSelectedAnalyst}
          />
        )}
        {activeView === 'universe' && (
          <Universe data={data} sectorFilter={sectorFilter} onTickerClick={setSelectedTicker} />
        )}
        {activeView === 'macro' && (
          <Macro data={data} sectorFilter={sectorFilter} onTickerClick={setSelectedTicker} />
        )}
        {activeView === 'alerts' && (
          <Alerts data={data} sectorFilter={sectorFilter} onTickerClick={setSelectedTicker} />
        )}
        {activeView === 'topideas' && (
          <TopIdeas data={data} sectorFilter={sectorFilter} />
        )}
        {activeView === 'earnings' && (
          <Earnings data={data} sectorFilter={sectorFilter} />
        )}
        {activeView === 'library' && (
          <Library data={data} sectorFilter={sectorFilter} />
        )}
        {activeView === 'methodology' && (
          <Methodology data={data} />
        )}
      </div>

      {/* Footer */}
      <footer
        style={{
          borderTop: `1px solid ${BRAND.border}`,
          padding: '8px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: 1100,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <span style={{ fontFamily: sans, fontSize: 9.5, color: BRAND.muted, letterSpacing: 0.5 }}>
          CONFIDENTIAL — INTERNAL USE ONLY
        </span>
        <span style={{ fontFamily: sans, fontSize: 9.5, color: BRAND.muted }}>
          marv.sumridge.io
        </span>
      </footer>

      {selectedTicker && (
        <IssuerDetail
          ticker={selectedTicker}
          data={data}
          onClose={() => setSelectedTicker(null)}
        />
      )}

      {selectedAnalyst && (
        <AnalystPanel
          initials={selectedAnalyst}
          data={data}
          onClose={() => setSelectedAnalyst(null)}
          onTickerClick={(t) => {
            // Close the analyst panel and open the issuer panel underneath.
            setSelectedAnalyst(null);
            setSelectedTicker(t);
          }}
        />
      )}
    </div>
  );
}
