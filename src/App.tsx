import { useState, useCallback } from 'react';
import {
  Zap, LayoutDashboard, Repeat, TrendingUp, BarChart2,
  Link2, Layers, Mic, Star, Search, ChevronRight, Sparkles
} from 'lucide-react';
import { api, KnowledgeBase, Analysis, Generated, Usage, Demo, setApiKey, getApiKey } from './lib/api';

// ── Tab registry ────────────────────────────────────────────────────────────
type TabId = 'pipeline' | 'showcase' | 'repurpose' | 'trends' | 'data' | 'chain' | 'carousel' | 'voice' | 'score' | 'seo';

const TABS: { id: TabId; label: string; icon: React.ReactNode; group: string; desc: string }[] = [
  { id: 'pipeline',  label: 'Generate',    icon: <Zap size={15} />,             group: 'Core',      desc: 'Turn any insight into LinkedIn, Email, Twitter and Blog content in 2 clicks' },
  { id: 'showcase',  label: 'Examples',    icon: <LayoutDashboard size={15} />,  group: 'Core',      desc: 'See real output for 3 different brands — no API key needed' },
  { id: 'repurpose', label: 'Repurpose',   icon: <Repeat size={15} />,           group: 'Tools',     desc: 'Take existing content and rewrite it for different channels and formats' },
  { id: 'trends',    label: 'Trend Radar', icon: <TrendingUp size={15} />,       group: 'Tools',     desc: 'Discover what\'s happening in your industry and turn trends into content angles' },
  { id: 'data',      label: 'Data → Story',icon: <BarChart2 size={15} />,        group: 'Tools',     desc: 'Paste stats or research findings and get ready-to-publish marketing narratives' },
  { id: 'chain',     label: 'Content Chain',icon: <Link2 size={15} />,           group: 'Tools',     desc: 'Build a sequence of connected posts that guide your audience toward a goal' },
  { id: 'carousel',  label: 'Carousel',    icon: <Layers size={15} />,           group: 'Tools',     desc: 'Design slide-by-slide carousel content with visual direction for each slide' },
  { id: 'voice',     label: 'Brand Voice', icon: <Mic size={15} />,              group: 'Tools',     desc: 'Analyze your writing style and generate new content that sounds exactly like you' },
  { id: 'score',     label: 'Score',       icon: <Star size={15} />,             group: 'Analytics', desc: 'Get a quality score on any piece of content with specific improvement suggestions' },
  { id: 'seo',       label: 'SEO',         icon: <Search size={15} />,           group: 'Analytics', desc: 'Optimize content for search: title tags, meta descriptions, keyword placement' },
];

const CHANNELS = ['LinkedIn', 'Twitter/X', 'Email', 'Blog', 'Instagram', 'TikTok/Video'];

const DEFAULT_KB: KnowledgeBase = {
  company_name: '',
  industry: '',
  description: '',
  target_audience: '',
  value_prop: '',
  brand_voice: '',
  competitors: '',
  goals: '',
};

// ── Shared UI atoms ──────────────────────────────────────────────────────────
function CostBadge({ usage }: { usage: Usage }) {
  return (
    <span className="badge bg-green-100 text-green-700">
      ${usage.cost_usd} · {usage.input_tokens + usage.output_tokens} tok
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex items-center gap-2 text-gray-500 text-sm">
      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      Generating…
    </div>
  );
}

function ChannelBadge({ ch }: { ch: string }) {
  const colors: Record<string, string> = {
    'LinkedIn': 'bg-blue-100 text-blue-700',
    'Twitter/X': 'bg-gray-200 text-gray-500',
    'Email': 'bg-purple-100 text-purple-700',
    'Blog': 'bg-amber-100 text-amber-700',
    'Instagram': 'bg-pink-100 text-pink-700',
    'TikTok/Video': 'bg-cyan-900/40 text-cyan-300',
  };
  return <span className={`badge ${colors[ch] ?? 'bg-gray-200 text-gray-500'}`}>{ch}</span>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="text-xs text-gray-500 hover:text-gray-500 transition-colors px-2 py-0.5 rounded">
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-red-300 text-sm">{msg}</div>
  );
}

// ── Knowledge Base Form ──────────────────────────────────────────────────────
function KBForm({ kb, onChange }: { kb: KnowledgeBase; onChange: (kb: KnowledgeBase) => void }) {
  const set = (k: keyof KnowledgeBase) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...kb, [k]: e.target.value });

  return (
    <div className="space-y-3">
      <p className="section-header">Brand Knowledge Base</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Company Name *</label>
          <input className="input w-full" placeholder="Acme Corp" value={kb.company_name} onChange={set('company_name')} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Industry *</label>
          <input className="input w-full" placeholder="SaaS / E-commerce / HealthTech" value={kb.industry} onChange={set('industry')} />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">What you do (1–2 sentences) *</label>
        <textarea className="input w-full h-16 resize-none" placeholder="We help mid-market e-commerce teams…" value={kb.description} onChange={set('description')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Target Audience *</label>
          <input className="input w-full" placeholder="E-commerce directors, 30–45" value={kb.target_audience} onChange={set('target_audience')} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Brand Voice *</label>
          <input className="input w-full" placeholder="Direct, data-confident, jargon-free" value={kb.brand_voice} onChange={set('brand_voice')} />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Core Value Proposition *</label>
        <textarea className="input w-full h-14 resize-none" placeholder="Real-time behavioral scoring that predicts churn 11 weeks earlier…" value={kb.value_prop} onChange={set('value_prop')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Competitors (optional)</label>
          <input className="input w-full" placeholder="Mixpanel, Amplitude…" value={kb.competitors} onChange={set('competitors')} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Content Goals (optional)</label>
          <input className="input w-full" placeholder="Generate leads, build authority…" value={kb.goals} onChange={set('goals')} />
        </div>
      </div>
    </div>
  );
}

// ── Pipeline Tab ─────────────────────────────────────────────────────────────
function PipelineTab({
  kb, setKb, analysis, setAnalysis, generated, setGenerated, keyValid
}: {
  kb: KnowledgeBase; setKb: (kb: KnowledgeBase) => void;
  analysis: Analysis | null; setAnalysis: (a: Analysis) => void;
  generated: Generated | null; setGenerated: (g: Generated) => void;
  keyValid: boolean;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usages, setUsages] = useState<Usage[]>([]);
  const [topic, setTopic] = useState('');
  const [channels, setChannels] = useState(['LinkedIn', 'Twitter/X', 'Email', 'Blog']);
  const [apiKey, setApiKey] = useState('');

  const kbValid = kb.company_name && kb.industry && kb.description && kb.target_audience && kb.value_prop && kb.brand_voice;

  const runAnalyze = async () => {
    setError(null);
    setLoading('analyze');
    try {
      // inject api key if provided (for dev; in prod Vercel env handles it)
      const { analysis: a, usage } = await api.analyze(kb);
      setAnalysis(a);
      setUsages(prev => [...prev, usage]);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(null); }
  };

  const runGenerate = async () => {
    if (!analysis) return;
    setError(null);
    setLoading('generate');
    try {
      const t = topic || (analysis.recommended_topics?.[0] ?? 'Key industry insight');
      const { result, usage } = await api.generate(kb, analysis, t, channels);
      setGenerated(result);
      setUsages(prev => [...prev, usage]);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(null); }
  };

  const totalCost = usages.reduce((s, u) => s + u.cost_usd, 0);

  const toggleChannel = (ch: string) =>
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);

  const step = !analysis ? 1 : !generated ? 2 : 3;

  return (
    <div className="space-y-5">
      {/* Progress indicator */}
      <div className="flex items-center gap-0">
        {[
          { n: 1, label: 'Setup Brand' },
          { n: 2, label: 'Pick Topic & Channels' },
          { n: 3, label: 'Generated Content' },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 ${step >= s.n ? 'opacity-100' : 'opacity-30'}`}>
              <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 ${step > s.n ? 'bg-green-600 text-white' : step === s.n ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {step > s.n ? '✓' : s.n}
              </span>
              <span className={`text-xs ${step === s.n ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>{s.label}</span>
            </div>
            {i < 2 && <div className={`flex-1 h-px mx-3 ${step > s.n ? 'bg-green-700' : 'bg-gray-100'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: KB */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center font-bold">1</span>
            <span className="font-medium text-sm">Brand Setup</span>
          </div>
          {analysis && <span className="badge bg-green-100 text-green-700">✓ Analyzed</span>}
        </div>
        <KBForm kb={kb} onChange={setKb} />
        <div className="mt-4 flex items-center gap-3">
          <button className="btn-primary flex items-center gap-2" onClick={runAnalyze} disabled={!kbValid || !keyValid || loading !== null}>
            {loading === 'analyze' ? <Spinner /> : <><Sparkles size={14} /> Analyze Brand</>}
          </button>
          {analysis && <span className="text-xs text-gray-500">{analysis.recommended_topics?.length ?? 0} topics suggested</span>}
        </div>
      </div>

      {/* Step 2: Analysis results */}
      {analysis && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center font-bold">2</span>
            <span className="font-medium text-sm">Strategic Analysis</span>
          </div>
          <p className="text-sm text-gray-500 italic">"{analysis.company_summary}"</p>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="section-header mb-2">Audience Pain Points</p>
              <ul className="space-y-1">
                {analysis.target_audience?.pain_points?.map((p, i) => (
                  <li key={i} className="text-xs text-gray-500 flex gap-1.5"><span className="text-red-600 mt-0.5">·</span>{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="section-header mb-2">Value Props</p>
              <ul className="space-y-1">
                {analysis.value_propositions?.map((v, i) => (
                  <li key={i} className="text-xs text-gray-500 flex gap-1.5"><span className="text-green-600 mt-0.5">·</span>{v}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="section-header mb-2">Voice DNA</p>
              <div className="flex flex-wrap gap-1">
                {analysis.brand_voice_descriptors?.map((d, i) => (
                  <span key={i} className="badge bg-brand-50 text-brand-700">{d}</span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="section-header mb-2">Suggested Topics — click to use</p>
            <div className="flex flex-wrap gap-2">
              {analysis.recommended_topics?.map((t, i) => (
                <button key={i} onClick={() => setTopic(t)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${topic === t ? 'border-brand-500 bg-brand-100 text-brand-600' : 'border-gray-300 text-gray-500 hover:border-gray-400'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Topic + Channel selector */}
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Topic (or select above)</label>
              <input className="input w-full" placeholder="Custom topic…" value={topic} onChange={e => setTopic(e.target.value)} />
            </div>
            <div>
              <p className="section-header mb-2">Channels</p>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map(ch => (
                  <button key={ch} onClick={() => toggleChannel(ch)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${channels.includes(ch) ? 'border-brand-500 bg-brand-100 text-brand-600' : 'border-gray-300 text-gray-500 hover:border-gray-400'}`}>
                    {ch}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn-primary flex items-center gap-2" onClick={runGenerate} disabled={loading !== null || channels.length === 0}>
              {loading === 'generate' ? <Spinner /> : <><Zap size={14} /> Generate {channels.length} Channels</>}
            </button>
          </div>
        </div>
      )}

      {error && <ErrorBox msg={error} />}

      {/* Step 3: Generated content */}
      {generated && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center font-bold">3</span>
              <span className="font-medium text-sm">Generated Content</span>
            </div>
            <div className="flex items-center gap-2">
              {totalCost > 0 && <span className="badge bg-green-100 text-green-700">Total: ${totalCost.toFixed(4)}</span>}
            </div>
          </div>
          <p className="text-xs text-gray-500 italic">{generated.strategic_notes}</p>

          <div className="space-y-4">
            {Object.entries(generated.content ?? {}).map(([ch, { content, notes }]) => (
              <div key={ch}>
                <div className="flex items-center gap-2 mb-2">
                  <ChannelBadge ch={ch} />
                </div>
                <ChannelOutputCard ch={ch} content={content} notes={notes} />
              </div>
            ))}
          </div>

          {generated.cta_options?.length > 0 && (
            <div>
              <p className="section-header mb-2">CTA Options</p>
              <div className="flex flex-wrap gap-2">
                {generated.cta_options.map((cta, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500">{cta}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Channel Output Cards ─────────────────────────────────────────────────────
function LinkedInCard({ content, notes }: { content: string; notes: string }) {
  const [liked, setLiked] = useState(false);
  const lines = content.split('\n');
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg">
      {/* LinkedIn header */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">A</div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Your Name</p>
            <p className="text-xs text-gray-500">Your Title · 1st</p>
            <p className="text-xs text-gray-500">Just now · 🌐</p>
          </div>
          <button className="ml-auto text-blue-600 text-xs font-semibold border border-blue-600 rounded-full px-3 py-1">+ Follow</button>
        </div>
      </div>
      {/* Post content */}
      <div className="px-4 py-3">
        <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{content}</p>
      </div>
      {/* Reactions */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <span>👍❤️💡</span><span>247 reactions · 38 comments</span>
        </div>
        <div className="border-t border-gray-100 pt-2 flex justify-around">
          {[
            { icon: '👍', label: 'Like', active: liked, action: () => setLiked(v => !v) },
            { icon: '💬', label: 'Comment', active: false, action: () => {} },
            { icon: '🔁', label: 'Repost', active: false, action: () => {} },
            { icon: '↗️', label: 'Send', active: false, action: () => {} },
          ].map(btn => (
            <button key={btn.label} onClick={btn.action}
              className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded hover:bg-gray-100 transition-colors ${btn.active ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
              <span>{btn.icon}</span>{btn.label}
            </button>
          ))}
        </div>
      </div>
      {/* Notes + Copy */}
      <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-t border-gray-100">
        <span className="text-xs text-gray-500 italic">{notes}</span>
        <CopyButton text={content} />
      </div>
    </div>
  );
}

function EmailCard({ content, notes }: { content: string; notes: string }) {
  // Try to parse subject line if present
  const lines = content.split('\n');
  let subject = '';
  let body = content;
  const subjectLine = lines.find(l => l.toLowerCase().startsWith('subject:'));
  if (subjectLine) {
    subject = subjectLine.replace(/^subject:\s*/i, '');
    body = lines.filter(l => !l.toLowerCase().startsWith('subject:')).join('\n').trim();
  } else {
    subject = lines[0];
    body = lines.slice(1).join('\n').trim();
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg">
      {/* Email header */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 space-y-1.5">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500 w-12">From:</span>
          <span className="text-gray-500 font-medium">you@company.com</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500 w-12">To:</span>
          <span className="text-gray-500">your-list@subscribers.com</span>
        </div>
        <div className="flex items-center gap-2 text-xs border-t border-gray-200 pt-1.5">
          <span className="text-gray-500 w-12">Subject:</span>
          <span className="text-gray-900 font-semibold">{subject}</span>
        </div>
      </div>
      {/* Email body */}
      <div className="px-6 py-5">
        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{body}</p>
      </div>
      {/* Footer */}
      <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-t border-gray-200">
        <span className="text-xs text-gray-500 italic">{notes}</span>
        <CopyButton text={content} />
      </div>
    </div>
  );
}

function TwitterCard({ content, notes }: { content: string; notes: string }) {
  const charCount = content.length;
  const isOver = charCount > 280;
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg">
      {/* Tweet header */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-white text-sm font-bold flex-shrink-0">A</div>
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-gray-900">Your Name</span>
            <span className="text-gray-500 text-sm">@yourhandle · now</span>
          </div>
          <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap leading-relaxed">{content}</p>
          {/* Char count */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-4 text-gray-500 text-xs">
              <span>💬 12</span><span>🔁 34</span><span>❤️ 247</span><span>📊 4.2K</span>
            </div>
            <span className={`text-xs ${isOver ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
              {charCount}/280
            </span>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-t border-gray-100">
        <span className="text-xs text-gray-500 italic">{notes}</span>
        <CopyButton text={content} />
      </div>
    </div>
  );
}

function BlogCard({ content, notes }: { content: string; notes: string }) {
  const words = content.split(/\s+/).length;
  const readTime = Math.max(1, Math.round(words / 200));
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>📖 {readTime} min read</span>
          <span>·</span>
          <span>{words} words</span>
        </div>
        <CopyButton text={content} />
      </div>
      <div className="px-6 py-5">
        {content.split('\n').map((line, i) => {
          if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold text-gray-900 mt-4 mb-2">{line.slice(2)}</h1>;
          if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold text-gray-800 mt-4 mb-1.5">{line.slice(3)}</h2>;
          if (line.startsWith('### ')) return <h3 key={i} className="text-base font-medium text-gray-500 mt-3 mb-1">{line.slice(4)}</h3>;
          if (line.trim() === '') return <div key={i} className="h-2" />;
          if (line.startsWith('- ') || line.startsWith('• ')) return <li key={i} className="text-sm text-gray-500 ml-4 leading-relaxed">{line.slice(2)}</li>;
          return <p key={i} className="text-sm text-gray-800 leading-relaxed">{line}</p>;
        })}
      </div>
      <div className="bg-gray-50 px-4 py-2 border-t border-gray-100">
        <span className="text-xs text-gray-500 italic">{notes}</span>
      </div>
    </div>
  );
}

function InstagramCard({ content, notes }: { content: string; notes: string }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg">
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white text-xs font-bold">A</div>
        <span className="text-sm font-semibold text-gray-900">yourhandle</span>
      </div>
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 aspect-square flex items-center justify-center mx-4 rounded-lg">
        <span className="text-gray-500 text-xs">Visual goes here</span>
      </div>
      <div className="px-4 py-3">
        <div className="flex gap-3 text-lg mb-2">❤️ 💬 ✈️ <span className="ml-auto">🔖</span></div>
        <p className="text-xs font-semibold text-gray-900 mb-1">1,247 likes</p>
        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed"><span className="font-semibold">yourhandle</span> {content}</p>
      </div>
      <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-t border-gray-100">
        <span className="text-xs text-gray-500 italic">{notes}</span>
        <CopyButton text={content} />
      </div>
    </div>
  );
}

function GenericChannelCard({ ch, content, notes }: { ch: string; content: string; notes: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <ChannelBadge ch={ch} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 italic">{notes}</span>
          <CopyButton text={content} />
        </div>
      </div>
      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{content}</p>
    </div>
  );
}

function ChannelOutputCard({ ch, content, notes }: { ch: string; content: string; notes: string }) {
  switch (ch) {
    case 'LinkedIn': return <LinkedInCard content={content} notes={notes} />;
    case 'Email': return <EmailCard content={content} notes={notes} />;
    case 'Twitter/X': return <TwitterCard content={content} notes={notes} />;
    case 'Blog': return <BlogCard content={content} notes={notes} />;
    case 'Instagram': return <InstagramCard content={content} notes={notes} />;
    default: return <GenericChannelCard ch={ch} content={content} notes={notes} />;
  }
}
// ── Single Demo: Maeven Studio ───────────────────────────────────────────────
const MAEVEN_KB: KnowledgeBase = {
  company_name: 'Maeven Studio',
  industry: 'Fashion E-commerce',
  description: 'Sustainable fashion brand for conscious millennial women. Premium basics, transparent supply chain, based in Berlin.',
  target_audience: 'Conscious millennial women, 28–40, reducing fast fashion',
  value_prop: 'Sustainable premium basics with full supply chain transparency and a fit guarantee',
  brand_voice: 'Honest, understated, direct',
  competitors: 'Everlane, Organic Basics',
  goals: 'Build community, drive repeat purchase',
};

const MAEVEN_ANALYSIS = {
  company_summary: 'Maeven Studio makes premium sustainable basics for women who want to buy less and wear more.',
  brand_voice_descriptors: ['Honest', 'Understated', 'Direct'],
  positioning: 'Radical transparency in a greenwashed market. Maeven earns trust by showing the math — return rates, supply chain, environmental cost — not hiding it.',
  content_opportunities: [
    'The real cost of fast fashion returns',
    'Why fit uncertainty is a sustainability problem',
    'Supply chain transparency as competitive advantage',
    'How to build a wardrobe of 12 pieces',
  ],
  avoid: 'Preachy sustainability messaging, vague eco-claims, pressure tactics, trend-chasing',
  topic: 'The real cost of fast fashion returns — and what we\'re doing differently',
  strategic_notes: 'Lead with data, not values. Let the numbers make the moral argument.',
};

const MAEVEN_CONTENT = {
  'LinkedIn': {
    content: "The fashion industry returns 30% of online orders.\n\nMost brands absorb that as a cost of doing business.\n\nWe decided to understand it instead.\n\nAfter mapping our return patterns for 18 months, we found that 67% came from fit uncertainty.\n\nSo we built a fit guarantee: get measured at home, we'll alter any piece that doesn't fit. Free.\n\nReturns dropped 41%. Customer lifetime value increased 28%.\n\nSustainability isn't just about materials. It's about making clothes people actually keep.\n\n#SlowFashion #SustainableStyle #FashionTech",
    notes: 'Data-led story, not values-led — earns credibility before the pitch',
  },
  'Twitter/X': {
    content: "30% of fashion orders get returned.\nMost end up in landfill.\n\nWe spent 18 months figuring out why.\n\nAnswer: fit uncertainty — not bad quality, not changed minds.\n\nSo we built a fit guarantee. Returns dropped 41%.\n\nSustainability starts with clothes people actually keep.\n\n#SlowFashion",
    notes: 'Same story, compressed — the data does the work',
  },
  'Email': {
    content: "Subject: Why we built a fit guarantee (and what happened next)\n\nFashion has a return problem nobody talks about honestly.\n\n30% of everything ordered online comes back. Most of it ends up in landfill — not resold, not donated, just waste.\n\nWe tracked our own returns for 18 months. 67% came from fit uncertainty. Not quality issues. Not changed minds. Just customers who couldn't tell from a photo whether something would actually fit their body.\n\nSo we built something different.\n\nEvery Maeven piece now comes with a fit guarantee. Get measured at home with our free kit. If anything doesn't fit perfectly, we'll alter it — free, no questions.\n\nSince launch: returns down 41%. Customer lifetime value up 28%.\n\nSustainability isn't just about organic cotton. It's about making clothes worth keeping.\n\n→ Shop the new collection\n\nMaeven Studio",
    notes: 'Story-first, product second — earns the CTA by the time it arrives',
  },
  'Blog': {
    content: "## Why Fashion's Return Problem Is Also a Sustainability Problem\n\nEvery year, billions of garments ordered online make a round trip back to the warehouse. The industry treats this as a logistics problem. We think it's a design problem.\n\n### The Numbers Behind the Box\n\nFashion has a 30% return rate online — roughly three times the rate of consumer electronics. Most returned items don't get resold. They get liquidated, donated, or discarded. The environmental cost is significant: packaging, shipping emissions, warehouse handling, and in too many cases, landfill.\n\n### What We Found When We Looked Closely\n\nAt Maeven Studio, we tracked our own returns for 18 months — not just the rate, but the reason.\n\n**67% of our returns came from fit uncertainty.**\n\nNot quality issues. Not changed minds. Just customers who couldn't tell from photos and measurements whether a garment would actually fit their body.\n\n### The Fit Guarantee\n\nWe built a simple solution: every Maeven piece comes with a fit guarantee. Order a free measuring kit. If anything doesn't fit perfectly when it arrives, we'll alter it at no cost.\n\nThe results after six months: returns down 41%, customer lifetime value up 28%.\n\nWe think that's what slow fashion actually means — not just better materials, but fewer wasted journeys.",
    notes: 'Thought leadership format — works as LinkedIn article too',
  },
};

const MAEVEN_CAROUSEL = [
  { slide: 1, type: 'Cover', headline: 'The fashion industry has a return problem.', body: "And most brands pretend it doesn't exist.", color: 'from-stone-800 to-stone-900' },
  { slide: 2, type: 'Data', headline: '30%', body: 'of all fashion orders get returned online.\nMost end up in landfill.', color: 'from-stone-700 to-stone-800' },
  { slide: 3, type: 'Insight', headline: 'We spent 18 months asking why.', body: 'Not to fix our logistics.\nTo fix the actual problem.', color: 'from-stone-800 to-stone-900' },
  { slide: 4, type: 'Data', headline: '67%', body: 'of returns came from fit uncertainty.\nNot bad quality. Not changed minds.', color: 'from-stone-700 to-stone-800' },
  { slide: 5, type: 'Solution', headline: 'So we built a fit guarantee.', body: 'Measure at home. We alter anything that doesn\'t fit. Free.', color: 'from-emerald-900 to-stone-900' },
  { slide: 6, type: 'Result', headline: 'Returns down 41%.\nLTV up 28%.', body: 'Sustainability isn\'t just materials.\nIt\'s clothes people actually keep.', color: 'from-stone-800 to-stone-900' },
  { slide: 7, type: 'CTA', headline: 'Shop the fit guarantee →', body: '@maeven.studio\nLink in bio', color: 'from-stone-900 to-stone-950' },
];

const MAEVEN_CHAIN = [
  { number: 1, title: 'The Problem Nobody Talks About', angle: 'Hook with industry-wide stat', hook: 'The fashion industry returns 30% of online orders. Most brands pretend this is normal.', channel: 'LinkedIn' },
  { number: 2, title: '18 Months of Data', angle: 'Behind-the-scenes research story', hook: 'We tracked every return for 18 months. What we found changed how we build products.', channel: 'LinkedIn' },
  { number: 3, title: 'The Fit Guarantee Explained', angle: 'How it actually works', hook: 'Here\'s exactly how our fit guarantee works — and why it\'s harder to build than it sounds.', channel: 'Email' },
  { number: 4, title: 'Customer Story', angle: 'Social proof through transformation', hook: '"I used to order 3 sizes and return 2. Now I order once." — How Sarah changed how she shops.', channel: 'Instagram' },
  { number: 5, title: 'The Bigger Picture', angle: 'Industry call to action', hook: 'What if every fashion brand tracked their returns this way? The math on what that would mean for the planet.', channel: 'Blog' },
];

const MAEVEN_CALENDAR = [
  { day: 'Mon', date: '24', channel: 'LinkedIn', type: 'Thought Leadership', title: 'The 30% problem', status: 'scheduled' },
  { day: 'Tue', date: '25', channel: 'Instagram', type: 'Carousel', title: '18 months of data', status: 'scheduled' },
  { day: 'Wed', date: '26', channel: 'Email', type: 'Newsletter', title: 'Fit guarantee explained', status: 'draft' },
  { day: 'Thu', date: '27', channel: 'Twitter/X', type: 'Thread', title: 'Returns are a design problem', status: 'idea' },
  { day: 'Fri', date: '28', channel: 'Blog', type: 'Long-form', title: 'Fashion\'s sustainability blind spot', status: 'draft' },
];

function ShowcaseTab({ onUseDemoKB }: { onUseDemoKB: (kb: KnowledgeBase) => void }) {
  const [activeSection, setActiveSection] = useState<string>('brand');
  const [activeChannel, setActiveChannel] = useState<string>('LinkedIn');
  const [activeSlide, setActiveSlide] = useState<number>(0);

  const sections = [
    { id: 'brand', label: '① Brand Setup' },
    { id: 'analysis', label: '② AI Analysis' },
    { id: 'content', label: '③ Multi-Channel' },
    { id: 'carousel', label: '④ IG Carousel' },
    { id: 'chain', label: '⑤ Content Chain' },
    { id: 'calendar', label: '⑥ Calendar' },
  ];

  const channelStatusColor = (status: string) => ({
    scheduled: 'bg-green-900/40 text-green-400',
    draft: 'bg-amber-900/40 text-amber-400',
    idea: 'bg-gray-100 text-gray-500',
  }[status] ?? 'bg-gray-100 text-gray-500');

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="card p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge bg-green-900/40 text-green-400">Live Demo</span>
              <span className="text-xs text-gray-500">No API key needed</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-100">Maeven Studio</h2>
            <p className="text-sm text-gray-500 mt-0.5">Sustainable fashion brand — Berlin · See how ContentEngine handles a full campaign</p>
          </div>
          <button onClick={() => onUseDemoKB(MAEVEN_KB)} className="btn-primary flex items-center gap-1.5 flex-shrink-0">
            <Sparkles size={14} /> Use This Brand
          </button>
        </div>
      </div>

      {/* Section nav */}
      <div className="flex gap-1.5 flex-wrap">
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${activeSection === s.id
              ? 'border-brand-500 bg-brand-50 text-brand-700'
              : 'border-gray-300 text-gray-500 hover:text-gray-600 hover:border-gray-400'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ① Brand Setup */}
      {activeSection === 'brand' && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Brand Knowledge Base</p>
              <p className="text-xs text-gray-500 mt-0.5">Everything ContentEngine knows about this brand before generating</p>
            </div>
            <span className="badge bg-brand-50 text-brand-700">Step 1 of 6</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Company', value: MAEVEN_KB.company_name },
              { label: 'Industry', value: MAEVEN_KB.industry },
              { label: 'Target Audience', value: MAEVEN_KB.target_audience },
              { label: 'Brand Voice', value: MAEVEN_KB.brand_voice },
              { label: 'Value Proposition', value: MAEVEN_KB.value_prop, full: true },
              { label: 'Description', value: MAEVEN_KB.description, full: true },
              { label: 'Competitors', value: MAEVEN_KB.competitors },
              { label: 'Content Goals', value: MAEVEN_KB.goals },
            ].map((f, i) => (
              <div key={i} className={f.full ? 'col-span-2' : ''}>
                <p className="text-xs text-gray-500 mb-1">{f.label}</p>
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-sm text-gray-600">{f.value}</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setActiveSection('analysis')} className="btn-primary w-full flex items-center justify-center gap-2">
            See AI Analysis → <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ② AI Analysis */}
      {activeSection === 'analysis' && (
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">AI Brand Analysis</p>
              <span className="badge bg-brand-50 text-brand-700">Step 2 of 6</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Brand Summary</p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600 italic">"{MAEVEN_ANALYSIS.company_summary}"</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Voice DNA</p>
              <div className="flex gap-2">
                {MAEVEN_ANALYSIS.brand_voice_descriptors.map((v, i) => (
                  <span key={i} className="badge bg-brand-50 text-brand-700 px-3 py-1">{v}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Strategic Positioning</p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">{MAEVEN_ANALYSIS.positioning}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-2">Content Opportunities</p>
                <ul className="space-y-1.5">
                  {MAEVEN_ANALYSIS.content_opportunities.map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                      <span className="text-brand-600 flex-shrink-0">→</span>{o}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Topic for This Demo</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 italic">"{MAEVEN_ANALYSIS.topic}"</p>
                </div>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">⚠ Avoid: {MAEVEN_ANALYSIS.avoid}</p>
              </div>
            </div>
          </div>
          <button onClick={() => setActiveSection('content')} className="btn-primary w-full flex items-center justify-center gap-2">
            See Generated Content <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ③ Multi-Channel Content */}
      {activeSection === 'content' && (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Multi-Channel Output</p>
                <p className="text-xs text-gray-500 mt-0.5">Same insight, adapted for each platform's format and audience</p>
              </div>
              <span className="badge bg-brand-50 text-brand-700">Step 3 of 6</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {Object.keys(MAEVEN_CONTENT).map(ch => (
                <button key={ch} onClick={() => setActiveChannel(ch)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${activeChannel === ch
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600'}`}>
                  {ch === 'Twitter/X' ? '𝕏 Twitter' : ch}
                </button>
              ))}
            </div>
          </div>
          <ChannelOutputCard
            ch={activeChannel}
            content={MAEVEN_CONTENT[activeChannel as keyof typeof MAEVEN_CONTENT]?.content ?? ''}
            notes={MAEVEN_CONTENT[activeChannel as keyof typeof MAEVEN_CONTENT]?.notes ?? ''}
          />
          <button onClick={() => setActiveSection('carousel')} className="btn-primary w-full flex items-center justify-center gap-2">
            See IG Carousel <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ④ Instagram Carousel */}
      {activeSection === 'carousel' && (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Instagram Carousel — 7 Slides</p>
                <p className="text-xs text-gray-500 mt-0.5">Same topic broken into a swipeable story format</p>
              </div>
              <span className="badge bg-brand-50 text-brand-700">Step 4 of 6</span>
            </div>
            {/* Slide dots */}
            <div className="flex gap-1.5 mb-4">
              {MAEVEN_CAROUSEL.map((_, i) => (
                <button key={i} onClick={() => setActiveSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${activeSlide === i ? 'bg-brand-500 w-6' : 'bg-gray-700 w-1.5'}`} />
              ))}
            </div>
          </div>

          {/* IG Phone Mockup */}
          <div className="flex justify-center">
            <div className="w-72 bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
              {/* IG header */}
              <div className="px-3 py-2 flex items-center gap-2 border-b border-gray-100">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white text-xs font-bold">M</div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-900">maeven.studio</p>
                </div>
                <span className="text-gray-400 text-lg">···</span>
              </div>

              {/* Square slide 1:1 */}
              {(() => {
                const slide = MAEVEN_CAROUSEL[activeSlide];
                return (
                  <div className={`aspect-square bg-gradient-to-br ${slide.color} flex flex-col justify-between p-6 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/5 -translate-y-6 translate-x-6" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/5 translate-y-4 -translate-x-4" />
                    <span className="text-xs text-white/50 uppercase tracking-widest">{slide.type}</span>
                    <div>
                      <p className="text-xl font-bold text-white leading-tight mb-2 whitespace-pre-line">{slide.headline}</p>
                      <p className="text-xs text-white/70 leading-relaxed whitespace-pre-line">{slide.body}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40">@maeven.studio</span>
                      <div className="flex gap-1">
                        {MAEVEN_CAROUSEL.map((_, i) => (
                          <button key={i} onClick={() => setActiveSlide(i)}
                            className={`rounded-full transition-all ${activeSlide === i ? 'bg-white w-3 h-1.5' : 'bg-white/30 w-1.5 h-1.5'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* IG footer */}
              <div className="px-3 py-2">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex gap-3 text-lg">❤️ 💬 ✈️</div>
                  <span className="text-lg">🔖</span>
                </div>
                <p className="text-xs font-semibold text-gray-900">1,247 likes</p>
                <p className="text-xs text-gray-600 mt-0.5"><span className="font-semibold">maeven.studio</span> Swipe to see our data →</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <div className="flex gap-2">
            <button onClick={() => setActiveSlide(s => Math.max(0, s - 1))} disabled={activeSlide === 0}
              className="btn-secondary flex-1">← Prev</button>
            <button onClick={() => setActiveSlide(s => Math.min(MAEVEN_CAROUSEL.length - 1, s + 1))} disabled={activeSlide === MAEVEN_CAROUSEL.length - 1}
              className="btn-secondary flex-1">Next →</button>
          </div>
          <button onClick={() => setActiveSection('chain')} className="btn-primary w-full flex items-center justify-center gap-2">
            See Content Chain <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ⑤ Content Chain */}
      {activeSection === 'chain' && (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Content Chain — 5 Posts</p>
                <p className="text-xs text-gray-500 mt-0.5">A sequence that guides the audience from awareness to conversion</p>
              </div>
              <span className="badge bg-brand-50 text-brand-700">Step 5 of 6</span>
            </div>
          </div>
          <div className="space-y-3">
            {MAEVEN_CHAIN.map((piece, i) => (
              <div key={i} className="card p-4">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{piece.number}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-800">{piece.title}</p>
                      <ChannelBadge ch={piece.channel} />
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{piece.angle}</p>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600 italic">"{piece.hook}"</p>
                    </div>
                  </div>
                </div>
                {i < MAEVEN_CHAIN.length - 1 && (
                  <div className="flex items-center gap-2 mt-3 ml-10 text-xs text-gray-500">
                    <span>↓</span><span>leads to next piece</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => setActiveSection('calendar')} className="btn-primary w-full flex items-center justify-center gap-2">
            See Content Calendar <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ⑥ Content Calendar */}
      {activeSection === 'calendar' && (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Content Calendar — Week View</p>
                <p className="text-xs text-gray-500 mt-0.5">All outputs scheduled across channels for the week</p>
              </div>
              <span className="badge bg-brand-50 text-brand-700">Step 6 of 6</span>
            </div>
          </div>

          <div className="space-y-2">
            {MAEVEN_CALENDAR.map((item, i) => (
              <div key={i} className="card p-4 flex items-center gap-4">
                <div className="text-center w-12 flex-shrink-0">
                  <p className="text-xs text-gray-500">{item.day}</p>
                  <p className="text-xl font-bold text-gray-800">{item.date}</p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ChannelBadge ch={item.channel} />
                    <span className="text-xs text-gray-500">{item.type}</span>
                  </div>
                  <p className="text-sm text-gray-600">{item.title}</p>
                </div>
                <span className={`badge ${channelStatusColor(item.status)} flex-shrink-0`}>{item.status}</span>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div className="card p-5 text-center space-y-3">
            <p className="text-sm font-medium text-gray-800">Ready to generate content for your brand?</p>
            <p className="text-xs text-gray-500">Enter your Anthropic API key, click below, and run the same flow for your company in under 2 minutes.</p>
            <button onClick={() => onUseDemoKB(MAEVEN_KB)} className="btn-primary flex items-center gap-2 mx-auto">
              <Sparkles size={14} /> Use Maeven's Brand as Template
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Tool Tabs (Repurpose, Trends, Data, Chain, Carousel, Voice, Score, SEO) ──
function RepurposeTab() {
  const [content, setContent] = useState('');
  const [source, setSource] = useState('Blog');
  const [targets, setTargets] = useState(['LinkedIn', 'Twitter/X']);
  const [voice, setVoice] = useState('professional and direct');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null); setLoading(true);
    try {
      const { result: r } = await api.repurpose(content, source, targets, voice);
      setResult(r);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="card p-5 space-y-3">
        <p className="section-header">Source Content</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Source Format</label>
            <select className="input w-full bg-gray-100" value={source} onChange={e => setSource(e.target.value)}>
              {['Blog', 'LinkedIn', 'Email', 'Twitter/X', 'Podcast transcript', 'Video script'].map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Brand Voice</label>
            <input className="input w-full" value={voice} onChange={e => setVoice(e.target.value)} />
          </div>
        </div>
        <textarea className="input w-full h-32 resize-none" placeholder="Paste your original content here…" value={content} onChange={e => setContent(e.target.value)} />
        <div>
          <p className="section-header mb-2">Repurpose To</p>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map(ch => (
              <button key={ch} onClick={() => setTargets(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch])}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${targets.includes(ch) ? 'border-brand-500 bg-brand-100 text-brand-600' : 'border-gray-300 text-gray-500'}`}>
                {ch}
              </button>
            ))}
          </div>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={run} disabled={!content || loading}>
          {loading ? <Spinner /> : <><Repeat size={14} /> Repurpose</>}
        </button>
      </div>
      {error && <ErrorBox msg={error} />}
      {result && (
        <div className="space-y-3">
          <div className="card p-4">
            <p className="section-header mb-1">Key Message Preserved</p>
            <p className="text-sm text-gray-500 italic">"{result.key_message}"</p>
          </div>
          {Object.entries(result.repurposed ?? {}).map(([ch, val]: any) => (
            <div key={ch} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <ChannelBadge ch={ch} />
                <CopyButton text={val.content} />
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{val.content}</p>
              <p className="text-xs text-gray-500 mt-2">{val.adaptation_notes}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrendsTab() {
  const [industry, setIndustry] = useState('');
  const [audience, setAudience] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null); setLoading(true);
    try { const { result: r } = await api.trends(industry, audience); setResult(r); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const urgencyColor = (u: string) => u === 'high' ? 'text-red-600' : u === 'medium' ? 'text-amber-400' : 'text-gray-500';

  return (
    <div className="space-y-4">
      <div className="card p-5 space-y-3">
        <p className="section-header">Trend Radar</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-500 mb-1 block">Industry</label><input className="input w-full" placeholder="SaaS / Fashion / HealthTech" value={industry} onChange={e => setIndustry(e.target.value)} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Target Audience</label><input className="input w-full" placeholder="E-commerce directors…" value={audience} onChange={e => setAudience(e.target.value)} /></div>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={run} disabled={!industry || loading}>
          {loading ? <Spinner /> : <><TrendingUp size={14} /> Find Trends</>}
        </button>
      </div>
      {error && <ErrorBox msg={error} />}
      {result?.trends?.map((t: any, i: number) => (
        <div key={i} className="card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{t.trend}</span>
            <span className={`text-xs font-medium uppercase ${urgencyColor(t.urgency)}`}>{t.urgency}</span>
          </div>
          <p className="text-xs text-gray-500">{t.why_relevant}</p>
          <p className="text-sm text-gray-800">{t.content_angle}</p>
          <div className="flex flex-wrap gap-1">
            {t.formats?.map((f: string, j: number) => <span key={j} className="badge bg-gray-100 text-gray-500">{f}</span>)}
          </div>
        </div>
      ))}
    </div>
  );
}

function DataTab() {
  const [data, setData] = useState('');
  const [context, setContext] = useState('');
  const [channels, setChannels] = useState(['LinkedIn', 'Twitter/X']);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null); setLoading(true);
    try { const { result: r } = await api.dataInsights(data, context, channels); setResult(r); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="card p-5 space-y-3">
        <p className="section-header">Data → Story</p>
        <textarea className="input w-full h-24 resize-none" placeholder="Paste your data, stats, research findings…&#10;e.g. 'Our Q3 data: 73% of users who onboard in under 5 minutes retain for 6+ months. Average onboard time: 8.2 min.'" value={data} onChange={e => setData(e.target.value)} />
        <input className="input w-full" placeholder="Brand context (optional)" value={context} onChange={e => setContext(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map(ch => <button key={ch} onClick={() => setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch])}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${channels.includes(ch) ? 'border-brand-500 bg-brand-100 text-brand-600' : 'border-gray-300 text-gray-500'}`}>{ch}</button>)}
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={run} disabled={!data || loading}>
          {loading ? <Spinner /> : <><BarChart2 size={14} /> Convert to Content</>}
        </button>
      </div>
      {error && <ErrorBox msg={error} />}
      {result && (
        <div className="space-y-3">
          <div className="card p-4">
            <p className="section-header mb-1">Data Story</p>
            <p className="text-sm text-gray-800">{result.data_story}</p>
            <p className="text-xs text-gray-500 mt-2">Key stat: <span className="text-brand-600">{result.key_stat}</span></p>
          </div>
          {Object.entries(result.content ?? {}).map(([ch, val]: any) => (
            <div key={ch} className="card p-4">
              <div className="flex items-center justify-between mb-2"><ChannelBadge ch={ch} /><CopyButton text={val.content} /></div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{val.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreTab() {
  const [content, setContent] = useState('');
  const [channel, setChannel] = useState('LinkedIn');
  const [goal, setGoal] = useState('engagement and brand awareness');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null); setLoading(true);
    try { const { result: r } = await api.score(content, channel, goal); setResult(r); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const scoreColor = (s: number) => s >= 80 ? 'text-green-600' : s >= 60 ? 'text-amber-400' : 'text-red-600';

  return (
    <div className="space-y-4">
      <div className="card p-5 space-y-3">
        <p className="section-header">Content Score</p>
        <textarea className="input w-full h-32 resize-none" placeholder="Paste content to score…" value={content} onChange={e => setContent(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-500 mb-1 block">Channel</label>
            <select className="input w-full bg-gray-100" value={channel} onChange={e => setChannel(e.target.value)}>
              {CHANNELS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label className="text-xs text-gray-500 mb-1 block">Goal</label><input className="input w-full" value={goal} onChange={e => setGoal(e.target.value)} /></div>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={run} disabled={!content || loading}>
          {loading ? <Spinner /> : <><Star size={14} /> Score Content</>}
        </button>
      </div>
      {error && <ErrorBox msg={error} />}
      {result && (
        <div className="space-y-3">
          <div className="card p-5 flex items-center gap-6">
            <div className="text-center">
              <p className={`text-5xl font-bold ${scoreColor(result.overall_score)}`}>{result.overall_score}</p>
              <p className="text-xs text-gray-500 mt-1">Overall</p>
            </div>
            <div className="flex-1 space-y-2">
              {Object.entries(result.grades ?? {}).map(([dim, val]: any) => (
                <div key={dim} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-32 capitalize">{dim.replace('_', ' ')}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full"><div className={`h-1.5 rounded-full ${val.score >= 80 ? 'bg-green-500' : val.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${val.score}%` }} /></div>
                  <span className={`text-xs font-medium ${scoreColor(val.score)}`}>{val.score}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500 italic">"{result.verdict}"</p>
          </div>
          {result.improvements?.length > 0 && (
            <div className="card p-4 space-y-2">
              <p className="section-header mb-2">Improvements</p>
              {result.improvements.map((imp: any, i: number) => (
                <div key={i} className="text-sm"><span className="text-red-600">→ {imp.issue}: </span><span className="text-gray-500">{imp.fix}</span></div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Chain Tab ─────────────────────────────────────────────────────────────────
function ChainTab() {
  const [goal, setGoal] = useState('');
  const [audience, setAudience] = useState('');
  const [pieces, setPieces] = useState(5);
  const [chainGoal, setChainGoal] = useState('Generate leads and build authority');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(0);

  const run = async () => {
    setError(null); setLoading(true);
    try { const { result: r } = await api.chain(goal, audience, pieces, chainGoal); setResult(r); setExpanded(0); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="card p-5 space-y-3">
        <p className="section-header">Content Chain</p>
        <p className="text-xs text-gray-500">A sequence of connected content pieces that build toward a goal — each one bridging to the next.</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Topic / Campaign</label>
            <input className="input w-full" placeholder="AI in B2B marketing in 2025" value={goal} onChange={e => setGoal(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Target Audience</label>
            <input className="input w-full" placeholder="Marketing directors at SaaS companies" value={audience} onChange={e => setAudience(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Chain Goal</label>
            <input className="input w-full" value={chainGoal} onChange={e => setChainGoal(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Number of Pieces</label>
            <select className="input w-full bg-gray-100" value={pieces} onChange={e => setPieces(Number(e.target.value))}>
              {[3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n} pieces</option>)}
            </select>
          </div>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={run} disabled={!goal || !audience || loading}>
          {loading ? <Spinner /> : <><Link2 size={14} /> Build Chain</>}
        </button>
      </div>
      {error && <ErrorBox msg={error} />}
      {result && (
        <div className="space-y-3">
          <div className="card p-4">
            <p className="section-header mb-1">Chain Strategy</p>
            <p className="text-sm text-gray-500 italic">"{result.chain_title}"</p>
            <p className="text-xs text-gray-500 mt-1">{result.arc}</p>
          </div>
          {result.pieces?.map((piece: any, i: number) => (
            <div key={i} className="card overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-xs flex items-center justify-center font-bold flex-shrink-0">{piece.number}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{piece.title}</p>
                    <p className="text-xs text-gray-500">{piece.angle}</p>
                  </div>
                </div>
                <span className="text-gray-500 text-xs">{expanded === i ? '▲' : '▼'}</span>
              </button>
              {expanded === i && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-200">
                  <div className="mt-3 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-brand-600 font-medium">Hook</span>
                      <CopyButton text={piece.hook} />
                    </div>
                    <p className="text-sm text-gray-500 italic">"{piece.hook}"</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 font-medium">Full Content</span>
                      <CopyButton text={piece.content} />
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{piece.content}</p>
                  </div>
                  {piece.bridge && (
                    <div className="flex items-start gap-2 text-xs text-gray-500">
                      <span className="text-brand-500 mt-0.5">→</span>
                      <span>Bridge to next: {piece.bridge}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Carousel Tab ──────────────────────────────────────────────────────────────
function CarouselTab() {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('LinkedIn');
  const [slides, setSlides] = useState(6);
  const [brandVoice, setBrandVoice] = useState('professional and direct');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const run = async () => {
    setError(null); setLoading(true);
    try { const { result: r } = await api.carousel(topic, platform, slides, brandVoice); setResult(r); setActiveSlide(0); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const slideTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Cover: 'bg-brand-50 text-brand-700',
      Content: 'bg-gray-100 text-gray-500',
      Data: 'bg-green-100 text-green-700',
      Quote: 'bg-purple-100 text-purple-700',
      CTA: 'bg-amber-100 text-amber-700',
    };
    return colors[type] ?? 'bg-gray-100 text-gray-500';
  };

  return (
    <div className="space-y-4">
      <div className="card p-5 space-y-3">
        <p className="section-header">Carousel Builder</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Topic</label>
            <input className="input w-full" placeholder="5 signs your content strategy is broken" value={topic} onChange={e => setTopic(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Platform</label>
            <select className="input w-full bg-gray-100" value={platform} onChange={e => setPlatform(e.target.value)}>
              {['LinkedIn', 'Instagram', 'Twitter/X'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Slides</label>
            <select className="input w-full bg-gray-100" value={slides} onChange={e => setSlides(Number(e.target.value))}>
              {[5, 6, 7, 8, 10].map(n => <option key={n} value={n}>{n} slides</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Brand Voice</label>
            <input className="input w-full" value={brandVoice} onChange={e => setBrandVoice(e.target.value)} />
          </div>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={run} disabled={!topic || loading}>
          {loading ? <Spinner /> : <><Layers size={14} /> Build Carousel</>}
        </button>
      </div>
      {error && <ErrorBox msg={error} />}
      {result && (
        <div className="space-y-4">
          <div className="card p-4">
            <p className="section-header mb-1">Carousel Title</p>
            <p className="text-sm font-medium text-gray-800">{result.carousel_title}</p>
            <p className="text-xs text-gray-500 mt-1">{result.hook_strategy}</p>
          </div>

          {/* Slide navigator */}
          <div className="card p-4 space-y-4">
            <div className="flex gap-1.5 flex-wrap">
              {result.slides?.map((s: any, i: number) => (
                <button key={i} onClick={() => setActiveSlide(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${activeSlide === i ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-700'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
            {result.slides?.[activeSlide] && (() => {
              const s = result.slides[activeSlide];
              return (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${slideTypeColor(s.type)}`}>{s.type}</span>
                    <span className="text-xs text-gray-500">Slide {s.number}</span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6 text-center min-h-32 flex flex-col items-center justify-center gap-2">
                    <p className="text-base font-semibold text-gray-900 leading-snug">{s.headline}</p>
                    {s.body && <p className="text-sm text-gray-500">{s.body}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-gray-500 mb-0.5">Visual</p>
                      <p className="text-gray-500">{s.visual_direction}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-gray-500 mb-0.5">Design note</p>
                      <p className="text-gray-500">{s.design_note}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="section-header">Caption</p>
              <CopyButton text={`${result.caption}\n\n${result.hashtags?.map((h: string) => `#${h}`).join(' ')}`} />
            </div>
            <p className="text-sm text-gray-500 whitespace-pre-wrap">{result.caption}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {result.hashtags?.map((h: string, i: number) => (
                <span key={i} className="badge bg-brand-100 text-brand-700">#{h}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Voice Tab ─────────────────────────────────────────────────────────────────
function VoiceTab() {
  const [samples, setSamples] = useState(['', '', '']);
  const [newTopic, setNewTopic] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSample = (i: number, val: string) => {
    const updated = [...samples];
    updated[i] = val;
    setSamples(updated);
  };

  const validSamples = samples.filter(s => s.trim().length > 20);

  const run = async () => {
    setError(null); setLoading(true);
    try { const { result: r } = await api.voice(validSamples, newTopic); setResult(r); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="card p-5 space-y-3">
        <p className="section-header">Brand Voice Analyzer</p>
        <p className="text-xs text-gray-500">Paste 2–3 samples of your best on-brand content. We'll extract your voice DNA and write new content in that style.</p>
        {samples.map((s, i) => (
          <div key={i}>
            <label className="text-xs text-gray-500 mb-1 block">Sample {i + 1} {i === 0 ? '(required)' : '(optional)'}</label>
            <textarea className="input w-full h-20 resize-none" placeholder={`Paste existing content sample ${i + 1}…`} value={s} onChange={e => updateSample(i, e.target.value)} />
          </div>
        ))}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Generate new content about</label>
          <input className="input w-full" placeholder="e.g. why we built our product differently" value={newTopic} onChange={e => setNewTopic(e.target.value)} />
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={run} disabled={validSamples.length < 1 || !newTopic || loading}>
          {loading ? <Spinner /> : <><Mic size={14} /> Analyze Voice & Generate</>}
        </button>
      </div>
      {error && <ErrorBox msg={error} />}
      {result && (
        <div className="space-y-4">
          {result.voice_analysis && (
            <div className="card p-5 space-y-3">
              <p className="section-header mb-1">Voice DNA</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-xs text-gray-500 block mb-0.5">Tone</span><span className="text-gray-800">{result.voice_analysis.tone}</span></div>
                <div><span className="text-xs text-gray-500 block mb-0.5">Vocabulary</span><span className="text-gray-800">{result.voice_analysis.vocabulary}</span></div>
                <div className="col-span-2"><span className="text-xs text-gray-500 block mb-0.5">Sentence Style</span><span className="text-gray-800">{result.voice_analysis.sentence_structure}</span></div>
                <div className="col-span-2"><span className="text-xs text-gray-500 block mb-0.5">Personality</span><span className="text-gray-500 italic">"{result.voice_analysis.personality}"</span></div>
                {result.voice_analysis.what_to_avoid && (
                  <div className="col-span-2 bg-red-50 border border-red-200 rounded p-2">
                    <span className="text-xs text-red-600 block mb-0.5">Avoid</span>
                    <span className="text-xs text-gray-500">{result.voice_analysis.what_to_avoid}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {result.new_content && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="section-header">Generated — In Your Voice</p>
                <CopyButton text={result.new_content} />
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{result.new_content}</p>
            </div>
          )}
          {result.voice_applied && (
            <div className="card p-4">
              <p className="section-header mb-1">Why it works</p>
              <p className="text-xs text-gray-500">{result.voice_applied}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── SEO Tab ───────────────────────────────────────────────────────────────────
function SeoTab() {
  const [content, setContent] = useState('');
  const [keyword, setKeyword] = useState('');
  const [secondary, setSecondary] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null); setLoading(true);
    try {
      const secArr = secondary.split(',').map(s => s.trim()).filter(Boolean);
      const { result: r } = await api.seo(content, keyword, secArr);
      setResult(r);
    }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="card p-5 space-y-3">
        <p className="section-header">SEO Optimizer</p>
        <textarea className="input w-full h-32 resize-none" placeholder="Paste your blog post or article…" value={content} onChange={e => setContent(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Primary Keyword</label>
            <input className="input w-full" placeholder="e.g. AI marketing automation" value={keyword} onChange={e => setKeyword(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Secondary Keywords (comma-separated)</label>
            <input className="input w-full" placeholder="marketing tools, content AI" value={secondary} onChange={e => setSecondary(e.target.value)} />
          </div>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={run} disabled={!content || !keyword || loading}>
          {loading ? <Spinner /> : <><Search size={14} /> Optimize for SEO</>}
        </button>
      </div>
      {error && <ErrorBox msg={error} />}
      {result && (
        <div className="space-y-4">
          <div className="card p-4 space-y-2">
            <p className="section-header mb-2">Meta Tags</p>
            <div>
              <span className="text-xs text-gray-500">Title Tag</span>
              <div className="flex items-center justify-between mt-0.5 bg-gray-50 rounded p-2">
                <p className="text-sm text-gray-800">{result.title_tag}</p>
                <CopyButton text={result.title_tag} />
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500">Meta Description</span>
              <div className="flex items-center justify-between mt-0.5 bg-gray-50 rounded p-2">
                <p className="text-sm text-gray-800">{result.meta_description}</p>
                <CopyButton text={result.meta_description} />
              </div>
            </div>
          </div>

          <div className="card p-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-gray-500 block mb-1">Primary Keyword Usage</span>
              <p className="text-gray-500">{result.keyword_usage?.primary}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 block mb-1">Secondary Keywords</span>
              <p className="text-gray-500">{result.keyword_usage?.secondary}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 block mb-1">Readability</span>
              <p className="text-gray-500">{result.readability_score}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 block mb-1">Schema Type</span>
              <p className="text-gray-500">{result.schema_type}</p>
            </div>
          </div>

          {result.internal_link_suggestions?.length > 0 && (
            <div className="card p-4">
              <p className="section-header mb-2">Internal Link Opportunities</p>
              <ul className="space-y-1">
                {result.internal_link_suggestions.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-gray-500 flex gap-2"><span className="text-brand-500">→</span>{s}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="section-header">Optimized Content</p>
              <CopyButton text={result.optimized_content} />
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{result.optimized_content}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Welcome Screen ────────────────────────────────────────────────────────────
function WelcomeScreen({ onKeySet, onViewExamples }: { onKeySet: (key: string) => void; onViewExamples: () => void }) {
  const [key, setKey] = useState('');
  const [show, setShow] = useState(false);
  const valid = key.startsWith('sk-ant-') && key.length > 20;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
          <Zap size={20} className="text-white" />
        </div>
        <div>
          <span className="font-semibold text-lg text-gray-900">ContentEngine</span>
          <span className="text-xs text-gray-500 ml-2">AI</span>
        </div>
      </div>

      {/* Hero */}
      <div className="text-center max-w-lg mb-10">
        <h1 className="text-2xl font-semibold text-gray-900 mb-3 leading-snug">
          Turn any insight into<br />multi-channel content
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Paste a topic or stat → get a LinkedIn post, email, tweet, and blog outline — all in one click. Built on Claude AI.
        </p>
      </div>

      {/* What it does */}
      <div className="grid grid-cols-2 gap-3 max-w-lg w-full mb-10">
        {[
          { icon: <Zap size={14} />, label: 'Generate', desc: 'LinkedIn, Email, Twitter, Blog in one click' },
          { icon: <Repeat size={14} />, label: 'Repurpose', desc: 'Adapt existing content for new channels' },
          { icon: <TrendingUp size={14} />, label: 'Trend Radar', desc: 'Find content angles in your industry' },
          { icon: <Mic size={14} />, label: 'Brand Voice', desc: 'Write new content that sounds like you' },
        ].map((item, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-3 flex items-start gap-3">
            <span className="text-brand-600 mt-0.5 flex-shrink-0">{item.icon}</span>
            <div>
              <p className="text-xs font-medium text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* API Key input */}
      <div className="w-full max-w-md space-y-3">
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            className="input w-full pr-16 py-3 text-sm"
            placeholder="Enter your Anthropic API key (sk-ant-…)"
            value={key}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && valid && onKeySet(key)}
            autoFocus
          />
          <button
            onClick={() => setShow(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-500"
          >
            {show ? 'hide' : 'show'}
          </button>
        </div>

        <button
          onClick={() => valid && onKeySet(key)}
          disabled={!valid}
          className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
        >
          <Sparkles size={15} /> Start Generating
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-500">or</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <button
          onClick={onViewExamples}
          className="w-full py-2.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:border-gray-300 hover:text-gray-500 transition-colors flex items-center justify-center gap-2"
        >
          <LayoutDashboard size={14} /> View Examples — No API Key Needed
        </button>

        <p className="text-xs text-gray-500 text-center">
          Get your free API key at{' '}
          <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-600">
            console.anthropic.com
          </a>
          {' '}· Your key stays in your browser, never stored on our servers
        </p>
      </div>
    </div>
  );
}

// ── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState<TabId>('pipeline');
  const [kb, setKb] = useState<KnowledgeBase>(DEFAULT_KB);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [apiKey, setApiKeyState] = useState(() => {
    const saved = sessionStorage.getItem('ce_api_key') || '';
    if (saved) setApiKey(saved);
    return saved;
  });
  const [showKey, setShowKey] = useState(false);
  const [onboarded, setOnboarded] = useState(() => !!sessionStorage.getItem('ce_api_key'));

  const handleKeyChange = (val: string) => {
    setApiKeyState(val);
    setApiKey(val);
    sessionStorage.setItem('ce_api_key', val);
  };

  const keyValid = apiKey.startsWith('sk-ant-') && apiKey.length > 20;

  // Show welcome screen if not onboarded
  if (!onboarded) {
    return (
      <WelcomeScreen
        onKeySet={(key) => {
          handleKeyChange(key);
          setOnboarded(true);
        }}
        onViewExamples={() => {
          setOnboarded(true);
          setTab('showcase');
        }}
      />
    );
  }

  const activeTab = TABS.find(t => t.id === tab);

  const renderTab = () => {
    switch (tab) {
      case 'pipeline': return <PipelineTab kb={kb} setKb={setKb} analysis={analysis} setAnalysis={setAnalysis} generated={generated} setGenerated={setGenerated} keyValid={keyValid} />;
      case 'showcase': return <ShowcaseTab onUseDemoKB={(newKb) => { setKb(newKb); setAnalysis(null); setGenerated(null); setTab('pipeline'); }} />;
      case 'repurpose': return <RepurposeTab />;
      case 'trends': return <TrendsTab />;
      case 'data': return <DataTab />;
      case 'score': return <ScoreTab />;
      case 'chain': return <ChainTab />;
      case 'carousel': return <CarouselTab />;
      case 'voice': return <VoiceTab />;
      case 'seo': return <SeoTab />;
      default: return null;
    }
  };

  const groups = ['Core', 'Tools', 'Analytics'];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-semibold text-sm text-gray-900">ContentEngine</span>
        </div>

        {/* API Key input */}
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              className="input w-full pr-16 text-xs"
              placeholder="Anthropic API key (sk-ant-…)"
              value={apiKey}
              onChange={e => handleKeyChange(e.target.value)}
            />
            <button
              onClick={() => setShowKey(v => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-500"
            >
              {showKey ? 'hide' : 'show'}
            </button>
          </div>
          <span className={`text-xs flex-shrink-0 ${keyValid ? 'text-green-600' : 'text-gray-500'}`}>
            {keyValid ? '✓ Ready' : '⚠ No key'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <a href="https://notion.so/326feccf871081f7a3cde0e1033be38b" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-gray-500 transition-colors">Case Study →</a>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="border-b border-gray-200 bg-white">
        {/* Core tabs — prominent */}
        <div className="px-4 flex items-center gap-1 border-b border-gray-100">
          {TABS.filter(t => t.group === 'Core').map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm border-b-2 transition-colors font-medium ${tab === t.id ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.icon}{t.label}
            </button>
          ))}
          <div className="w-px h-5 bg-gray-200 mx-2" />
          {/* Tools inline */}
          <div className="flex items-center gap-0.5 overflow-x-auto">
            {TABS.filter(t => t.group !== 'Core').map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1 px-3 py-3 text-xs border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? 'border-brand-500 text-brand-600 font-medium' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                {t.icon}<span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Tab description banner */}
      {activeTab && (
        <div className="bg-white/70 border-b border-gray-200/60 px-6 py-2 flex items-center justify-between">
          <p className="text-xs text-gray-500">{activeTab.desc}</p>
          {!keyValid && tab !== 'showcase' && (
            <span className="text-xs text-amber-600">← Enter API key in header to generate</span>
          )}
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {renderTab()}
        </div>
      </main>
    </div>
  );
}
