import { useState, useEffect } from 'react';
import * as api from '../api';
import { useI18n } from '../i18n';

const HERO_CARDS = [
  { id: 'start', icon: '🚀', color: '#6366f1', title: { en: 'Start a New Product', zh: '开始新产品' }, desc: { en: 'Describe your idea and get BOM, timeline & cost in 60 seconds', zh: '描述你的想法，60秒获得BOM、时间线和成本' }, target: 'quick_start' },
  { id: 'workspace', icon: '📋', color: '#0ea5e9', title: { en: 'My Projects', zh: '我的项目' }, desc: { en: 'Track all your hardware projects from idea to production', zh: '从创意到量产，追踪你的所有项目' }, target: 'project_workspace' },
  { id: 'search', icon: '🔍', color: '#10b981', title: { en: 'Find Components', zh: '找元器件' }, desc: { en: 'Search across Mouser, DigiKey & LCSC with price comparison', zh: '跨Mouser、DigiKey、LCSC搜索比价' }, target: 'component_search' },
  { id: 'order', icon: '📦', color: '#f59e0b', title: { en: 'Order Prototype', zh: '下单打样' }, desc: { en: 'Split your BOM into packages and checkout with one click', zh: '拆分BOM为采购包，一键下单' }, target: 'prototype_bundle' },
];

const QUICK_IDEAS = [
  { icon: '⏰', label: { en: 'Flip Clock', zh: '翻页闹钟' }, prompt: 'Design a mechanical flip clock with LED backlight, alarm function, and USB-C charging. Minimalist aesthetic for home decoration.' },
  { icon: '🎙️', label: { en: 'AI Voice Module', zh: 'AI语音模块' }, prompt: 'Design a compact AI voice interaction module for fashion/retail products. Includes microphone array, speaker, WiFi, and edge AI processor for voice commands.' },
  { icon: '🎿', label: { en: 'Ski Airbag Vest', zh: '滑雪气囊马甲' }, prompt: 'Design an inflatable airbag vest for skiers that detects falls via IMU and deploys air cushions in under 100ms.' },
  { icon: '🤖', label: { en: 'Home Robot', zh: '家务机器人' }, prompt: 'Design a wheeled mobile robot for household chores including vacuuming and fetching items. Budget under $500 BOM.' },
  { icon: '💡', label: { en: 'Smart Light', zh: '智能灯' }, prompt: 'Design a smart desk lamp with ambient light sensor, color temperature control, WiFi, and voice assistant integration.' },
  { icon: '🌡️', label: { en: 'Air Quality Monitor', zh: '空气质量检测仪' }, prompt: 'Create a portable device measuring PM2.5, CO2, VOCs, temperature and humidity with color display and BLE.' },
];

function StatCard({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function LaunchpadPage({ onNavigate }) {
  const { t, lang } = useI18n();
  const [dashboard, setDashboard] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);

  useEffect(() => {
    api.fetchProjectDashboard().then(setDashboard).catch(() => {});
    api.fetchProjects().then(r => setRecentProjects((r.items || []).slice(0, 3))).catch(() => {});
  }, []);

  const navigate = (target) => {
    if (onNavigate) onNavigate(target);
  };

  const l = (obj) => obj?.[lang] || obj?.en || '';

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {lang === 'zh' ? '从想法到实物，一站搞定' : 'From Idea to Physical Product'}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 15, margin: 0 }}>
          {lang === 'zh' ? '无论你要做翻页闹钟还是家务机器人，这里是你的硬件创业起点' : 'Whether it\'s a flip clock or a home robot, this is your hardware starting point'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14, marginBottom: 32 }}>
        {HERO_CARDS.map(c => (
          <div key={c.id} onClick={() => navigate(c.target)}
            style={{ background: '#161c27', borderRadius: 14, padding: 22, cursor: 'pointer', border: '1px solid #1e2a3a', transition: 'all .2s', position: 'relative', overflow: 'hidden' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = c.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2a3a'; e.currentTarget.style.transform = 'none'; }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>{c.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{l(c.title)}</div>
            <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{l(c.desc)}</div>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle at top right, ${c.color}15, transparent)` }} />
          </div>
        ))}
      </div>

      <div style={{ background: '#161c27', borderRadius: 14, padding: 22, marginBottom: 24, border: '1px solid #1e2a3a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{lang === 'zh' ? '快速开始 — 选一个试试' : 'Quick Start — Pick an Idea'}</h3>
          <button onClick={() => navigate('product_wizard')} style={{ background: 'none', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}>
            {lang === 'zh' ? '自定义想法 →' : 'Custom Idea →'}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
          {QUICK_IDEAS.map(idea => (
            <div key={idea.prompt} onClick={() => navigate('quick_start')}
              style={{ background: '#0f1520', borderRadius: 10, padding: '14px 12px', cursor: 'pointer', textAlign: 'center', border: '1px solid transparent', transition: 'border-color .2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{idea.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{l(idea.label)}</div>
            </div>
          ))}
        </div>
      </div>

      {recentProjects.length > 0 && (
        <div style={{ background: '#161c27', borderRadius: 14, padding: 22, marginBottom: 24, border: '1px solid #1e2a3a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{lang === 'zh' ? '最近项目' : 'Recent Projects'}</h3>
            <button onClick={() => navigate('project_workspace')} style={{ background: 'none', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}>
              {lang === 'zh' ? '查看全部 →' : 'View All →'}
            </button>
          </div>
          {recentProjects.map(p => (
            <div key={p.id} onClick={() => navigate('project_workspace')}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#0f1520', borderRadius: 8, marginBottom: 6, cursor: 'pointer' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{p.description?.slice(0, 60)}</div>
              </div>
              <span style={{ background: '#1e2a3a', borderRadius: 6, padding: '3px 10px', fontSize: 11, color: '#94a3b8' }}>{p.stage}</span>
            </div>
          ))}
        </div>
      )}

      {dashboard && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, padding: '16px 0' }}>
          <StatCard label={lang === 'zh' ? '项目总数' : 'Projects'} value={dashboard.total_projects} color="#6366f1" />
          <StatCard label={lang === 'zh' ? '已支出' : 'Spent'} value={`$${dashboard.total_spent_usd?.toLocaleString() || 0}`} color="#10b981" />
          <StatCard label={lang === 'zh' ? '总预算' : 'Budget'} value={`$${dashboard.total_budget_usd?.toLocaleString() || 0}`} color="#0ea5e9" />
        </div>
      )}
    </div>
  );
}
