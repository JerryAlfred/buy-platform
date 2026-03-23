import { useState, useEffect } from 'react';
import * as api from '../api';

export default function TimelinePage() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.fetchEvents({ limit: 100 }).then(d => setEvents(d.events || [])).catch(() => {});
  }, []);

  const actorColors = { ai: 'var(--purple)', human: 'var(--accent)', system: 'var(--text3)' };
  const typeColors = {
    order_created: 'var(--accent)', supplier_added: 'var(--green)', negotiation_started: 'var(--purple)',
    quote_received: 'var(--yellow)', order_approved: 'var(--green)', ai_sourcing: 'var(--purple)',
    status_changed: 'var(--accent)', error: 'var(--red)',
  };

  const filtered = filter === 'all' ? events : events.filter(e => e.actor === filter);
  const actors = [...new Set(events.map(e => e.actor).filter(Boolean))];

  return (
    <>
      <h2 className="page-title">Supply Chain Timeline</h2>
      <p className="page-sub">Real-time event feed — every sourcing, negotiation, and order event in one stream</p>

      <div className="kpis">
        {[
          { l: 'Total Events', v: events.length, c: 'var(--accent)' },
          { l: 'AI Actions', v: events.filter(e => e.actor === 'ai').length, c: 'var(--purple)' },
          { l: 'Human Actions', v: events.filter(e => e.actor === 'human').length, c: 'var(--green)' },
          { l: 'Today', v: events.filter(e => e.created_at?.startsWith(new Date().toISOString().slice(0, 10))).length, c: 'var(--yellow)' },
        ].map(k => <div key={k.l} className="kpi"><div className="kpi-label">{k.l}</div><div className="kpi-value" style={{ color: k.c }}>{k.v}</div></div>)}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', ...actors].map(a => (
          <button key={a} className={`btn ${filter === a ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '4px 14px', fontSize: '.82rem' }} onClick={() => setFilter(a)}>
            {a === 'all' ? 'All' : a.charAt(0).toUpperCase() + a.slice(1)}
          </button>
        ))}
      </div>

      <div className="panel">
        {filtered.length ? (
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: 'var(--border)' }} />
            {filtered.map(e => (
              <div key={e.id} style={{ position: 'relative', paddingBottom: 20, paddingLeft: 24 }}>
                <div style={{
                  position: 'absolute', left: -4, top: 4, width: 12, height: 12, borderRadius: '50%',
                  background: actorColors[e.actor] || 'var(--text3)', border: '2px solid var(--bg)',
                }} />
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '.78rem', color: 'var(--text3)', minWidth: 120 }}>
                    {e.created_at?.replace('T', ' ').slice(0, 16)}
                  </span>
                  <span className={`badge badge-${e.type?.includes('error') ? 'red' : e.actor === 'ai' ? 'purple' : 'blue'}`} style={{ fontSize: '.72rem' }}>
                    {e.type}
                  </span>
                  <span style={{ fontSize: '.78rem', color: actorColors[e.actor], fontWeight: 600 }}>
                    {e.actor}
                  </span>
                </div>
                <div style={{ fontSize: '.88rem', lineHeight: 1.5 }}>{e.summary}</div>
                {e.details && <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginTop: 4 }}>{typeof e.details === 'string' ? e.details : JSON.stringify(e.details).slice(0, 200)}</div>}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🕐</div>
            <div>No events recorded yet</div>
          </div>
        )}
      </div>
    </>
  );
}
