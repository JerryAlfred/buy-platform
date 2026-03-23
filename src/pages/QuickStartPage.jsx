import { useState, useEffect } from 'react';
import * as api from '../api';
import { useI18n } from '../i18n';

const TEMPLATES = [
  { id: 'flip_clock', icon: '⏰', name: { en: 'Flip Clock', zh: '翻页闹钟' }, desc: { en: 'Mechanical flip display + LED backlight + alarm + USB-C', zh: '机械翻页显示 + LED背光 + 闹钟 + USB-C' }, prompt: 'Design a mechanical flip clock with stepper motor driven flip digits, LED backlight, alarm function, real-time clock IC, and USB-C charging. Minimalist aesthetic suitable for home or office.', type: 'consumer_electronics', budget: 3000 },
  { id: 'ai_voice', icon: '🎙️', name: { en: 'AI Voice Module', zh: 'AI语音模块' }, desc: { en: 'Compact voice AI for fashion/retail products', zh: '紧凑型语音AI模块，服务时尚/零售品牌' }, prompt: 'Design a compact AI voice interaction module for fashion and retail products. Includes 2-mic MEMS array, class-D amplifier with speaker, ESP32-S3 for edge inference, WiFi connectivity. Must be small enough to embed in handbags, jewelry boxes, or retail displays.', type: 'consumer_electronics', budget: 5000 },
  { id: 'smart_light', icon: '💡', name: { en: 'Smart Desk Lamp', zh: '智能台灯' }, desc: { en: 'Ambient sensor + color temp + WiFi + voice control', zh: '环境传感器 + 色温调节 + WiFi + 语音控制' }, prompt: 'Design a smart desk lamp with ambient light sensor, adjustable color temperature 2700K-6500K, WiFi for app control, and voice assistant integration. Premium aluminum body.', type: 'smart_home', budget: 4000 },
  { id: 'pet_tracker', icon: '🐕', name: { en: 'Pet GPS Tracker', zh: '宠物GPS追踪器' }, desc: { en: 'Tiny GPS + 4G + waterproof collar attachment', zh: '迷你GPS + 4G + 防水项圈配件' }, prompt: 'Design a miniature pet GPS tracker with GPS/GNSS, 4G LTE-M connectivity, IP67 waterproof, 7-day battery life, and collar attachment mechanism. Must be under 30g.', type: 'iot_sensor', budget: 5000 },
  { id: 'midi_controller', icon: '🎹', name: { en: 'MIDI Controller', zh: 'MIDI控制器' }, desc: { en: 'Mechanical keys + rotary encoders + USB + BLE', zh: '机械按键 + 旋钮编码器 + USB + 蓝牙' }, prompt: 'Design a compact MIDI controller with 16 mechanical key switches with RGB LEDs, 4 rotary encoders, USB-C and BLE MIDI connectivity. Aluminum enclosure.', type: 'consumer_electronics', budget: 4000 },
  { id: 'plant_monitor', icon: '🌱', name: { en: 'Smart Plant Monitor', zh: '智能植物监测器' }, desc: { en: 'Soil moisture + light + temp + auto watering', zh: '土壤湿度 + 光照 + 温度 + 自动浇水' }, prompt: 'Design a smart plant monitoring device with soil moisture sensor, ambient light sensor, temperature/humidity sensor, small water pump for auto-watering, solar panel, and BLE connectivity.', type: 'smart_home', budget: 2000 },
];

const STEPS = [
  { num: 1, title: { en: 'Describe Your Idea', zh: '描述你的想法' } },
  { num: 2, title: { en: 'Review Plan', zh: '查看方案' } },
  { num: 3, title: { en: 'Create Project', zh: '创建项目' } },
];

export default function QuickStartPage({ onNavigate }) {
  const { lang } = useI18n();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [created, setCreated] = useState(false);

  const l = (obj) => obj?.[lang] || obj?.en || '';

  const generate = async (prompt) => {
    setLoading(true);
    try {
      const r = await api.generateProductPlan({ prompt, use_llm: true });
      setPlan(r);
      setStep(2);
      if (r.prd?.product_name) setProjectName(r.prd.product_name);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const createProject = async () => {
    try {
      const template = selectedTemplate;
      await api.createProject({
        name: projectName || 'New Product',
        description: customPrompt || template?.prompt || '',
        product_type: template?.type || 'consumer_electronics',
        budget_usd: template?.budget || plan?.cost_estimate?.total_prototype || 5000,
      });
      setCreated(true);
      setStep(3);
    } catch { /* ignore */ }
  };

  const S = {
    page: { maxWidth: 800, margin: '0 auto', padding: '0 16px' },
    stepBar: { display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 },
    stepDot: (active, done) => ({
      display: 'flex', alignItems: 'center', gap: 8,
    }),
    stepNum: (active, done) => ({
      width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 700,
      background: done ? '#10b981' : active ? '#6366f1' : '#1e2a3a',
      color: done || active ? '#fff' : '#64748b',
    }),
    stepLabel: (active) => ({ fontSize: 13, color: active ? '#e2e8f0' : '#64748b' }),
    stepLine: { width: 40, height: 2, background: '#1e2a3a', alignSelf: 'center' },
  };

  return (
    <div style={S.page}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
          {lang === 'zh' ? '快速开始你的硬件项目' : 'Quick Start Your Hardware Project'}
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 14, margin: '4px 0 0' }}>
          {lang === 'zh' ? '选一个模板或描述你的想法，AI帮你生成完整方案' : 'Pick a template or describe your idea — AI generates a complete plan'}
        </p>
      </div>

      <div style={S.stepBar}>
        {STEPS.map((s, i) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={S.stepDot(step === s.num, step > s.num)}>
              <div style={S.stepNum(step === s.num, step > s.num)}>{step > s.num ? '✓' : s.num}</div>
              <span style={S.stepLabel(step >= s.num)}>{l(s.title)}</span>
            </div>
            {i < STEPS.length - 1 && <div style={S.stepLine} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 10 }}>{lang === 'zh' ? '选一个模板快速开始' : 'Pick a Template'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10 }}>
              {TEMPLATES.map(t => (
                <div key={t.id} onClick={() => { setSelectedTemplate(t); setCustomPrompt(t.prompt); }}
                  style={{
                    background: selectedTemplate?.id === t.id ? '#1e1b4b' : '#161c27',
                    border: `1px solid ${selectedTemplate?.id === t.id ? '#6366f1' : '#1e2a3a'}`,
                    borderRadius: 10, padding: 14, cursor: 'pointer', transition: 'all .15s',
                  }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{t.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{l(t.name)}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>{l(t.desc)}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 8 }}>{lang === 'zh' ? '或者，描述你的想法' : 'Or, Describe Your Own Idea'}</h3>
            <textarea value={customPrompt} onChange={e => { setCustomPrompt(e.target.value); setSelectedTemplate(null); }}
              rows={4} placeholder={lang === 'zh' ? '用一段话描述你想做的硬件产品...' : 'Describe the hardware product you want to build...'}
              style={{ width: '100%', background: '#0f1520', border: '1px solid #1e2a3a', borderRadius: 10, padding: '12px 14px', color: '#e2e8f0', fontSize: 14, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>

          <button onClick={() => generate(customPrompt)} disabled={!customPrompt.trim() || loading}
            style={{ width: '100%', background: loading ? '#334155' : '#6366f1', border: 'none', borderRadius: 10, color: '#fff', padding: '14px 0', fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer' }}>
            {loading ? (lang === 'zh' ? 'AI 正在生成方案...' : 'AI is generating your plan...') : (lang === 'zh' ? '生成产品方案' : 'Generate Product Plan')}
          </button>
        </>
      )}

      {step === 2 && plan && (
        <>
          <div style={{ background: '#161c27', borderRadius: 12, padding: 20, marginBottom: 16, border: '1px solid #1e2a3a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, color: '#6366f1' }}>{plan.prd?.product_name || 'Your Product'}</h3>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Source: {plan.source === 'llm' ? 'AI (GPT-4o)' : 'Smart Template Engine'}</div>
              </div>
              <button onClick={() => setStep(1)} style={{ background: 'none', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
                {'← '}{lang === 'zh' ? '修改' : 'Edit'}
              </button>
            </div>

            {plan.prd?.key_features?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>KEY FEATURES</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {plan.prd.key_features.map((f, i) => <span key={i} style={{ background: '#0f1520', borderRadius: 6, padding: '4px 10px', fontSize: 12 }}>{f}</span>)}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
              <div style={{ background: '#0f1520', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>${plan.cost_estimate?.bom_prototype}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>BOM Cost</div>
              </div>
              <div style={{ background: '#0f1520', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0ea5e9' }}>{plan.total_weeks}w</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Timeline</div>
              </div>
              <div style={{ background: '#0f1520', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>{plan.bom?.length || 0}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>BOM Items</div>
              </div>
            </div>

            {plan.tech_stack?.mcu && (
              <div style={{ background: '#0f1520', borderRadius: 8, padding: 10, fontSize: 13 }}>
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>MCU:</span> {plan.tech_stack.mcu.name} — <span style={{ color: '#94a3b8' }}>{plan.tech_stack.mcu.pros}</span>
              </div>
            )}
          </div>

          {plan.bom?.length > 0 && (
            <div style={{ background: '#161c27', borderRadius: 12, padding: 20, marginBottom: 16, border: '1px solid #1e2a3a' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>BOM ({plan.bom.length} items)</h4>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {plan.bom.map((b, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e2a3a', fontSize: 13 }}>
                    <span><span style={{ color: '#6366f1', fontWeight: 600, marginRight: 8 }}>{b.category}</span>{b.part}</span>
                    <span style={{ color: '#10b981' }}>x{b.qty} @ ${b.unit_cost}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ background: '#161c27', borderRadius: 12, padding: 20, marginBottom: 16, border: '1px solid #1e2a3a' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>{lang === 'zh' ? '项目名称' : 'Project Name'}</h4>
            <input value={projectName} onChange={e => setProjectName(e.target.value)}
              style={{ width: '100%', background: '#0f1520', border: '1px solid #1e2a3a', borderRadius: 8, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, boxSizing: 'border-box' }} />
          </div>

          <button onClick={createProject}
            style={{ width: '100%', background: '#10b981', border: 'none', borderRadius: 10, color: '#fff', padding: '14px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            {lang === 'zh' ? '创建项目并开始' : 'Create Project & Start Building'}
          </button>
        </>
      )}

      {step === 3 && created && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2 style={{ margin: '0 0 8px' }}>{lang === 'zh' ? '项目创建成功！' : 'Project Created!'}</h2>
          <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>
            {lang === 'zh' ? '你的硬件项目已经就绪，下一步：' : 'Your hardware project is ready. Next steps:'}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate?.('project_workspace')} style={{ background: '#6366f1', border: 'none', borderRadius: 8, color: '#fff', padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>
              {lang === 'zh' ? '查看项目' : 'View Project'}
            </button>
            <button onClick={() => onNavigate?.('component_search')} style={{ background: '#0ea5e9', border: 'none', borderRadius: 8, color: '#fff', padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>
              {lang === 'zh' ? '搜索元器件' : 'Search Components'}
            </button>
            <button onClick={() => onNavigate?.('prototype_bundle')} style={{ background: '#10b981', border: 'none', borderRadius: 8, color: '#fff', padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>
              {lang === 'zh' ? '下单打样' : 'Order Prototype'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
