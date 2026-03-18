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
    <span className="badge bg-green-900/40 text-green-400">
      ${usage.cost_usd} · {usage.input_tokens + usage.output_tokens} tok
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex items-center gap-2 text-gray-400 text-sm">
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
    'LinkedIn': 'bg-blue-900/40 text-blue-300',
    'Twitter/X': 'bg-gray-700 text-gray-300',
    'Email': 'bg-purple-900/40 text-purple-300',
    'Blog': 'bg-amber-900/40 text-amber-300',
    'Instagram': 'bg-pink-900/40 text-pink-300',
    'TikTok/Video': 'bg-cyan-900/40 text-cyan-300',
  };
  return <span className={`badge ${colors[ch] ?? 'bg-gray-700 text-gray-300'}`}>{ch}</span>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-0.5 rounded">
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
              <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 ${step > s.n ? 'bg-green-600 text-white' : step === s.n ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-500'}`}>
                {step > s.n ? '✓' : s.n}
              </span>
              <span className={`text-xs ${step === s.n ? 'text-gray-200 font-medium' : 'text-gray-500'}`}>{s.label}</span>
            </div>
            {i < 2 && <div className={`flex-1 h-px mx-3 ${step > s.n ? 'bg-green-700' : 'bg-gray-800'}`} />}
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
          {analysis && <span className="badge bg-green-900/40 text-green-400">✓ Analyzed</span>}
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
          <p className="text-sm text-gray-300 italic">"{analysis.company_summary}"</p>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="section-header mb-2">Audience Pain Points</p>
              <ul className="space-y-1">
                {analysis.target_audience?.pain_points?.map((p, i) => (
                  <li key={i} className="text-xs text-gray-400 flex gap-1.5"><span className="text-red-400 mt-0.5">·</span>{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="section-header mb-2">Value Props</p>
              <ul className="space-y-1">
                {analysis.value_propositions?.map((v, i) => (
                  <li key={i} className="text-xs text-gray-400 flex gap-1.5"><span className="text-green-400 mt-0.5">·</span>{v}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="section-header mb-2">Voice DNA</p>
              <div className="flex flex-wrap gap-1">
                {analysis.brand_voice_descriptors?.map((d, i) => (
                  <span key={i} className="badge bg-brand-900/50 text-brand-300">{d}</span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="section-header mb-2">Suggested Topics — click to use</p>
            <div className="flex flex-wrap gap-2">
              {analysis.recommended_topics?.map((t, i) => (
                <button key={i} onClick={() => setTopic(t)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${topic === t ? 'border-brand-500 bg-brand-900/30 text-brand-300' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Topic + Channel selector */}
          <div className="border-t border-gray-800 pt-4 space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Topic (or select above)</label>
              <input className="input w-full" placeholder="Custom topic…" value={topic} onChange={e => setTopic(e.target.value)} />
            </div>
            <div>
              <p className="section-header mb-2">Channels</p>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map(ch => (
                  <button key={ch} onClick={() => toggleChannel(ch)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${channels.includes(ch) ? 'border-brand-500 bg-brand-900/30 text-brand-300' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
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
              {totalCost > 0 && <span className="badge bg-green-900/40 text-green-400">Total: ${totalCost.toFixed(4)}</span>}
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
                  <span key={i} className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300">{cta}</span>
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
            <p className="text-xs text-gray-400">Just now · 🌐</p>
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
        <span className="text-xs text-gray-400 italic">{notes}</span>
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
          <span className="text-gray-400 w-12">From:</span>
          <span className="text-gray-700 font-medium">you@company.com</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400 w-12">To:</span>
          <span className="text-gray-700">your-list@subscribers.com</span>
        </div>
        <div className="flex items-center gap-2 text-xs border-t border-gray-200 pt-1.5">
          <span className="text-gray-400 w-12">Subject:</span>
          <span className="text-gray-900 font-semibold">{subject}</span>
        </div>
      </div>
      {/* Email body */}
      <div className="px-6 py-5">
        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{body}</p>
      </div>
      {/* Footer */}
      <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-t border-gray-200">
        <span className="text-xs text-gray-400 italic">{notes}</span>
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
        <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">A</div>
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-gray-900">Your Name</span>
            <span className="text-gray-400 text-sm">@yourhandle · now</span>
          </div>
          <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap leading-relaxed">{content}</p>
          {/* Char count */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-4 text-gray-400 text-xs">
              <span>💬 12</span><span>🔁 34</span><span>❤️ 247</span><span>📊 4.2K</span>
            </div>
            <span className={`text-xs ${isOver ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
              {charCount}/280
            </span>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-t border-gray-100">
        <span className="text-xs text-gray-400 italic">{notes}</span>
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
        <div className="flex items-center gap-3 text-xs text-gray-400">
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
          if (line.startsWith('### ')) return <h3 key={i} className="text-base font-medium text-gray-700 mt-3 mb-1">{line.slice(4)}</h3>;
          if (line.trim() === '') return <div key={i} className="h-2" />;
          if (line.startsWith('- ') || line.startsWith('• ')) return <li key={i} className="text-sm text-gray-700 ml-4 leading-relaxed">{line.slice(2)}</li>;
          return <p key={i} className="text-sm text-gray-800 leading-relaxed">{line}</p>;
        })}
      </div>
      <div className="bg-gray-50 px-4 py-2 border-t border-gray-100">
        <span className="text-xs text-gray-400 italic">{notes}</span>
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
        <span className="text-gray-400 text-xs">Visual goes here</span>
      </div>
      <div className="px-4 py-3">
        <div className="flex gap-3 text-lg mb-2">❤️ 💬 ✈️ <span className="ml-auto">🔖</span></div>
        <p className="text-xs font-semibold text-gray-900 mb-1">1,247 likes</p>
        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed"><span className="font-semibold">yourhandle</span> {content}</p>
      </div>
      <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-t border-gray-100">
        <span className="text-xs text-gray-400 italic">{notes}</span>
        <CopyButton text={content} />
      </div>
    </div>
  );
}

function GenericChannelCard({ ch, content, notes }: { ch: string; content: string; notes: string }) {
  return (
    <div className="bg-gray-800/60 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <ChannelBadge ch={ch} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 italic">{notes}</span>
          <CopyButton text={content} />
        </div>
      </div>
      <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{content}</p>
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
const STATIC_DEMOS: Demo[] = [
  {
    id: 'tech_saas', label: 'SaaS / B2B Tech', company: 'Nexus Analytics',
    tagline: 'Turn raw data into revenue decisions',
    description: 'B2B analytics platform for e-commerce teams. Predicts churn through behavioral signals.',
    topic: 'Why 73% of retailers make pricing decisions with 3-month-old data',
    analysis: {
      company_summary: 'Nexus Analytics turns behavioral data into predictive revenue signals for mid-market e-commerce.',
      brand_voice_descriptors: ['Direct', 'Data-confident', 'Jargon-free'],
      recommended_topics: ['The 11-week data lag killing your margins', 'Churn prediction vs churn reaction', 'Real-time cohort analysis for non-data-scientists'],
    },
    generated: {
      'LinkedIn': { content: "Your pricing team made a decision last Tuesday based on November data.\n\nIn e-commerce, 3-month-old data isn't insight — it's archaeology.\n\nWe audited 47 mid-market retailers. Average lag between customer behavior change and reporting visibility: 11.4 weeks.\n\nBy the time you see the trend, you've already lost the margin.\n\nNexus Analytics closes that gap to 72 hours.\n\n→ See how [link in bio]\n\n#EcommerceAnalytics #RetailTech #DataDriven", notes: 'Leads with a concrete scenario before the stat' },
      'Twitter/X': { content: "Your e-commerce team is making today's decisions with November's data.\n\n11-week average lag between behavior change and reporting visibility.\n\nThat's not analytics. That's archaeology.\n\n#EcommerceData", notes: 'Uses the archaeology metaphor as a hook' },
      'Email': { content: "Subject: The 11-week problem killing your margins\n\nHere's what we found analyzing 47 mid-market retailers:\n\nAverage time between a customer behavior shift and it appearing in your analytics dashboard: 11.4 weeks.\n\nThat means the churn you're seeing right now? You could have seen it in February.\n\nNexus Analytics was built for this. Real-time behavioral scoring. No data science team required.\n\n→ Book a 20-minute demo", notes: 'Opens with insight, not a feature pitch' },
      'Blog': { content: "## The 11-Week Blind Spot Killing E-commerce Margins\n\nMost e-commerce analytics dashboards have a dirty secret: the data you're looking at is already ancient.\n\n### The Lag Problem\n\nWe audited 47 mid-market retailers — companies doing between $10M and $100M in annual online revenue. What we found was sobering.\n\nThe average time between a meaningful customer behavior change and that change appearing in a reporting dashboard: **11.4 weeks**.\n\n### Why This Matters for Margins\n\nThink about what happens in 11 weeks. A customer cohort starts showing early churn signals in week one. By week four, they're actively disengaging. By week eight, they've churned. By week eleven, it shows up in your retention report.\n\nYou didn't lose them to a competitor. You lost them to a data lag.\n\n### What Real-Time Looks Like\n\nNexus Analytics scores every customer interaction in real time — surfacing risk signals within 72 hours, not 11 weeks. Marketing teams can intervene when it still matters.\n\n→ See how Nexus Analytics works in a 20-minute demo.", notes: 'Educational angle, positions as thought leadership' },
    }
  },
  {
    id: 'fashion_ecom', label: 'Fashion E-commerce', company: 'Maeven Studio',
    tagline: 'Slow fashion, sharp style',
    description: 'Sustainable fashion brand for conscious millennial women. Premium basics, transparent supply chain.',
    topic: "The real cost of fast fashion returns — and what we're doing differently",
    analysis: {
      company_summary: 'Maeven Studio makes premium sustainable basics for women who want to buy less and wear more.',
      brand_voice_descriptors: ['Honest', 'Understated', 'Direct'],
      recommended_topics: ["Why returns are fashion's dirty secret", 'The real cost of buying twice', 'Supply chain transparency as a marketing strategy'],
    },
    generated: {
      'LinkedIn': { content: "The fashion industry returns 30% of online orders.\n\nMost brands absorb that as a cost of doing business.\n\nWe decided to understand it instead.\n\nAfter mapping our return patterns for 18 months, we found that 67% came from fit uncertainty.\n\nSo we built a fit guarantee: get measured at home, we'll alter any piece that doesn't fit. Free.\n\nReturns dropped 41%. Customer lifetime value increased 28%.\n\nSustainability isn't just about materials. It's about making clothes people actually keep.\n\n#SlowFashion #SustainableStyle", notes: 'Uses data to tell a story, not to show off' },
      'Twitter/X': { content: "30% of fashion orders get returned.\nMost end up in landfill.\n\nWe spent 18 months figuring out why.\n\nAnswer: fit uncertainty.\n\nSo we built a fit guarantee. Returns dropped 41%.\n\nSustainability starts with clothes people actually keep. #SlowFashion", notes: 'Tight, punchy, ends with the insight' },
      'Email': { content: "Subject: Why we built a fit guarantee (and what happened next)\n\nFashion has a return problem nobody talks about honestly.\n\n30% of everything ordered online comes back. Most of it ends up in landfill.\n\nWe tracked our own returns for 18 months. 67% came from fit uncertainty — not quality issues, not changed minds.\n\nSo we built something different. Every Maeven piece now comes with a fit guarantee. Get measured at home, we'll alter anything that doesn't fit. Free.\n\nSince launch: returns down 41%. Customer lifetime value up 28%.\n\nSustainability isn't just about organic cotton. It's about making clothes worth keeping.\n\n→ Shop the new collection", notes: 'Story-first, product second — earns the CTA' },
      'Blog': { content: "## Why Fashion's Return Problem Is Also a Sustainability Problem\n\nEvery year, billions of garments ordered online make a round trip back to the warehouse. The industry treats this as a logistics problem. We think it's a design problem.\n\n### The Numbers Behind the Box\n\nFashion has a 30% return rate online — roughly three times the rate of consumer electronics. Most returned items don't get resold. They get liquidated, donated, or discarded.\n\n### What We Found When We Looked Closely\n\nAt Maeven Studio, we tracked our own returns for 18 months — not just the rate, but the reason.\n\n**67% of our returns came from fit uncertainty.**\n\nNot quality issues. Not changed minds. Just customers who couldn't tell from photos whether a garment would fit their body.\n\n### The Fit Guarantee\n\nWe built a simple solution: every Maeven piece comes with a fit guarantee. Order a free measuring kit. If anything doesn't fit perfectly, we'll alter it at no cost.\n\nThe results after six months: returns down 41%, customer lifetime value up 28%.\n\nWe think that's what slow fashion actually means — not just better materials, but fewer wasted journeys.", notes: 'Thought leadership positioning' },
    }
  },
  {
    id: 'healthtech', label: 'HealthTech / Wellness', company: 'Forma Health',
    tagline: 'Preventive health intelligence for teams',
    description: 'B2B wellness platform for HR teams. Predictive health scoring to reduce corporate healthcare costs.',
    topic: 'Why employee wellness programs fail — and what actually works',
    analysis: {
      company_summary: 'Forma Health helps employers predict and prevent workforce health deterioration before it becomes costly.',
      brand_voice_descriptors: ['Evidence-based', 'Empathetic', 'Precise'],
      recommended_topics: ['The 23% participation problem', 'Why wellness ROI is measured wrong', 'Prediction beats reaction: the health cost formula'],
    },
    generated: {
      'LinkedIn': { content: "The average company spends $1,200 per employee per year on wellness benefits.\n\nParticipation rate: 23%.\n\nWe analyzed 6 years of wellness program data across 140 enterprise clients.\n\nThe programs that failed treated health as an employee responsibility.\n\nThe programs that worked treated health deterioration as a predictable pattern.\n\nPrediction beats reaction. Every time.\n\nForma identifies the 15% of employees whose trajectory will drive 60% of next year's healthcare costs — and intervenes now.\n\nROI on preventive intervention vs reactive care: 4.2x.\n\n#HRTech #EmployeeWellness #PeopleOps", notes: 'Leads with the failure pattern before the solution' },
      'Twitter/X': { content: "Companies spend $1,200/employee/year on wellness.\nParticipation rate: 23%.\n\n6 years of data across 140 clients:\n\nPrograms that fail → treat health as employee responsibility\nPrograms that work → treat deterioration as a predictable pattern\n\nPrediction beats reaction. Always. #HRTech", notes: 'Contrast structure works well in tweet format' },
      'Email': { content: "Subject: Why 77% of your employees skip wellness benefits\n\nYou're spending roughly $1,200 per employee per year on wellness benefits.\n\nAnd 77% of your workforce isn't using them.\n\nWe've spent 6 years asking why — analyzing program data across 140 enterprise clients.\n\nThe pattern is consistent: programs that fail treat health as an individual responsibility. Programs that work treat health deterioration as a predictable organizational pattern — and intervene before it becomes expensive.\n\nForma Health identifies the 15% of employees whose health trajectory will drive 60% of next year's healthcare costs — and gives HR teams tools to intervene now.\n\nROI on preventive intervention vs reactive care: 4.2x.\n\n→ See how Forma works for teams like yours", notes: 'Reframes the problem before presenting the solution' },
      'Blog': { content: "## The Employee Wellness Paradox: Why Most Programs Fail\n\nYour company has a wellness program. Statistically, roughly 23% of your employees are using it.\n\nThe other 77% aren't lazy. The program is probably solving the wrong problem.\n\n### Six Years of Wellness Program Data\n\nForma Health has analyzed enterprise wellness outcomes since 2018 — across 140 clients and more than 200,000 employee data points.\n\nThe finding that changed how we think about everything:\n\n**Programs that fail treat health as an individual responsibility. Programs that succeed treat health deterioration as a predictable organizational pattern.**\n\n### The Access Fallacy\n\nMost wellness programs are built on an access model: give employees tools, then measure utilization. The implicit assumption is that low utilization means employees are unmotivated.\n\nBut low utilization correlates with program design, not employee motivation. Specifically, it correlates with requiring employees to self-identify as having a health problem before they'll engage with a solution.\n\n### What Prediction-First Looks Like\n\nInstead of waiting for employees to raise their hand, Forma uses biometric screening and behavioral signals to identify health trajectories — the 15% of employees whose current pattern will drive 60% of next year's healthcare costs.\n\nHR teams get actionable cohort data. Employees get targeted, relevant support before a health issue becomes a crisis.\n\nThe ROI: 4.2x preventive vs reactive care.\n\n→ Learn how Forma Health works for enterprise HR teams", notes: 'Substantive thought leadership' },
    }
  },
];

function ShowcaseTab({ onUseDemoKB }: { onUseDemoKB: (kb: KnowledgeBase) => void }) {
  const [active, setActive] = useState<string>('tech_saas');
  const [activeChannel, setActiveChannel] = useState<string>('LinkedIn');
  const demo = STATIC_DEMOS.find(d => d.id === active)!;

  const availableChannels = Object.keys(demo.generated ?? {});

  const switchDemo = (id: string) => {
    setActive(id);
    const d = STATIC_DEMOS.find(d => d.id === id)!;
    const chs = Object.keys(d.generated ?? {});
    if (!chs.includes(activeChannel)) setActiveChannel(chs[0]);
  };

  const useThis = () => {
    const kbMap: Record<string, KnowledgeBase> = {
      tech_saas: { company_name: 'Nexus Analytics', industry: 'SaaS / Analytics', description: 'B2B analytics platform that helps mid-market e-commerce teams predict churn and understand behavioral signals.', target_audience: 'E-commerce directors and heads of retention at $10M-$100M online retailers', value_prop: 'Real-time behavioral scoring that predicts churn 11 weeks before it shows in your dashboard', brand_voice: 'Direct, data-confident, jargon-free', competitors: 'Mixpanel, Amplitude', goals: 'Generate demos, build authority in e-commerce analytics' },
      fashion_ecom: { company_name: 'Maeven Studio', industry: 'Fashion E-commerce', description: 'Sustainable fashion brand for conscious millennial women. Premium basics, transparent supply chain, based in Berlin.', target_audience: 'Conscious millennial women, 28–40, reducing fast fashion', value_prop: 'Sustainable premium basics with full supply chain transparency and a fit guarantee', brand_voice: 'Honest, understated, direct', competitors: 'Everlane, Organic Basics', goals: 'Build community, drive repeat purchase' },
      healthtech: { company_name: 'Forma Health', industry: 'HealthTech / Wellness', description: 'B2B wellness platform for HR teams. Combines biometric screening and predictive health scoring to reduce corporate healthcare costs.', target_audience: 'HR directors and Chief People Officers at 500–5000 person companies', value_prop: 'Predictive health scoring that identifies high-risk employee cohorts before they become costly', brand_voice: 'Evidence-based, empathetic, precise', competitors: 'Virgin Pulse, Noom for Business', goals: 'Build thought leadership, generate enterprise leads' },
    };
    onUseDemoKB(kbMap[active]);
  };

  const currentContent = demo.generated?.[activeChannel as keyof typeof demo.generated];

  return (
    <div className="space-y-5">
      {/* Brand selector cards */}
      <div className="grid grid-cols-3 gap-3">
        {STATIC_DEMOS.map(d => (
          <button key={d.id} onClick={() => switchDemo(d.id)}
            className={`text-left p-4 rounded-xl border transition-all ${active === d.id
              ? 'border-brand-500 bg-brand-900/20'
              : 'border-gray-800 bg-gray-900/40 hover:border-gray-700'}`}>
            <p className={`text-xs font-semibold mb-0.5 ${active === d.id ? 'text-brand-300' : 'text-gray-500'}`}>{d.label}</p>
            <p className="text-sm font-medium text-gray-200">{d.company}</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{d.tagline}</p>
          </button>
        ))}
      </div>

      {/* Topic + Voice DNA */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1.5">Topic used to generate this content</p>
          <p className="text-sm text-gray-200 italic">"{demo.topic}"</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-2">Brand Voice</p>
          <div className="flex flex-wrap gap-1.5">
            {demo.analysis?.brand_voice_descriptors?.map((d, i) => (
              <span key={i} className="badge bg-brand-900/40 text-brand-300">{d}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Channel switcher + output */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-2 flex-wrap">
            {availableChannels.map(ch => (
              <button key={ch} onClick={() => setActiveChannel(ch)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${activeChannel === ch
                  ? 'border-brand-500 bg-brand-900/30 text-brand-300'
                  : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'}`}>
                {ch === 'Twitter/X' ? '𝕏 Twitter' : ch}
              </button>
            ))}
          </div>
          <button onClick={useThis} className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3">
            Use This Brand <ChevronRight size={12} />
          </button>
        </div>
        {currentContent && (
          <ChannelOutputCard ch={activeChannel} content={currentContent.content} notes={currentContent.notes} />
        )}
      </div>

      {/* Bottom CTA */}
      <div className="card p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-200">Generate content for your own brand</p>
          <p className="text-xs text-gray-500 mt-0.5">Enter your Anthropic API key above, click "Use This Brand" to pre-fill, or go to Generate</p>
        </div>
        <button onClick={useThis} className="btn-primary flex items-center gap-1.5">
          Use This Brand <ChevronRight size={14} />
        </button>
      </div>
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
            <select className="input w-full bg-gray-800" value={source} onChange={e => setSource(e.target.value)}>
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
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${targets.includes(ch) ? 'border-brand-500 bg-brand-900/30 text-brand-300' : 'border-gray-700 text-gray-400'}`}>
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
            <p className="text-sm text-gray-300 italic">"{result.key_message}"</p>
          </div>
          {Object.entries(result.repurposed ?? {}).map(([ch, val]: any) => (
            <div key={ch} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <ChannelBadge ch={ch} />
                <CopyButton text={val.content} />
              </div>
              <p className="text-sm text-gray-200 whitespace-pre-wrap">{val.content}</p>
              <p className="text-xs text-gray-600 mt-2">{val.adaptation_notes}</p>
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

  const urgencyColor = (u: string) => u === 'high' ? 'text-red-400' : u === 'medium' ? 'text-amber-400' : 'text-gray-400';

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
          <p className="text-xs text-gray-400">{t.why_relevant}</p>
          <p className="text-sm text-gray-200">{t.content_angle}</p>
          <div className="flex flex-wrap gap-1">
            {t.formats?.map((f: string, j: number) => <span key={j} className="badge bg-gray-800 text-gray-400">{f}</span>)}
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
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${channels.includes(ch) ? 'border-brand-500 bg-brand-900/30 text-brand-300' : 'border-gray-700 text-gray-400'}`}>{ch}</button>)}
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
            <p className="text-sm text-gray-200">{result.data_story}</p>
            <p className="text-xs text-gray-500 mt-2">Key stat: <span className="text-brand-300">{result.key_stat}</span></p>
          </div>
          {Object.entries(result.content ?? {}).map(([ch, val]: any) => (
            <div key={ch} className="card p-4">
              <div className="flex items-center justify-between mb-2"><ChannelBadge ch={ch} /><CopyButton text={val.content} /></div>
              <p className="text-sm text-gray-200 whitespace-pre-wrap">{val.content}</p>
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

  const scoreColor = (s: number) => s >= 80 ? 'text-green-400' : s >= 60 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="space-y-4">
      <div className="card p-5 space-y-3">
        <p className="section-header">Content Score</p>
        <textarea className="input w-full h-32 resize-none" placeholder="Paste content to score…" value={content} onChange={e => setContent(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-500 mb-1 block">Channel</label>
            <select className="input w-full bg-gray-800" value={channel} onChange={e => setChannel(e.target.value)}>
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
                  <span className="text-xs text-gray-400 w-32 capitalize">{dim.replace('_', ' ')}</span>
                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full"><div className={`h-1.5 rounded-full ${val.score >= 80 ? 'bg-green-500' : val.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${val.score}%` }} /></div>
                  <span className={`text-xs font-medium ${scoreColor(val.score)}`}>{val.score}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-300 italic">"{result.verdict}"</p>
          </div>
          {result.improvements?.length > 0 && (
            <div className="card p-4 space-y-2">
              <p className="section-header mb-2">Improvements</p>
              {result.improvements.map((imp: any, i: number) => (
                <div key={i} className="text-sm"><span className="text-red-400">→ {imp.issue}: </span><span className="text-gray-300">{imp.fix}</span></div>
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
            <select className="input w-full bg-gray-800" value={pieces} onChange={e => setPieces(Number(e.target.value))}>
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
            <p className="text-sm text-gray-300 italic">"{result.chain_title}"</p>
            <p className="text-xs text-gray-500 mt-1">{result.arc}</p>
          </div>
          {result.pieces?.map((piece: any, i: number) => (
            <div key={i} className="card overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800/40 transition-colors"
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-900/60 text-brand-300 text-xs flex items-center justify-center font-bold flex-shrink-0">{piece.number}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{piece.title}</p>
                    <p className="text-xs text-gray-500">{piece.angle}</p>
                  </div>
                </div>
                <span className="text-gray-600 text-xs">{expanded === i ? '▲' : '▼'}</span>
              </button>
              {expanded === i && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-800">
                  <div className="mt-3 bg-gray-800/60 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-brand-400 font-medium">Hook</span>
                      <CopyButton text={piece.hook} />
                    </div>
                    <p className="text-sm text-gray-300 italic">"{piece.hook}"</p>
                  </div>
                  <div className="bg-gray-800/60 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400 font-medium">Full Content</span>
                      <CopyButton text={piece.content} />
                    </div>
                    <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{piece.content}</p>
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
      Cover: 'bg-brand-900/50 text-brand-300',
      Content: 'bg-gray-800 text-gray-300',
      Data: 'bg-green-900/40 text-green-300',
      Quote: 'bg-purple-900/40 text-purple-300',
      CTA: 'bg-amber-900/40 text-amber-300',
    };
    return colors[type] ?? 'bg-gray-800 text-gray-400';
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
            <select className="input w-full bg-gray-800" value={platform} onChange={e => setPlatform(e.target.value)}>
              {['LinkedIn', 'Instagram', 'Twitter/X'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Slides</label>
            <select className="input w-full bg-gray-800" value={slides} onChange={e => setSlides(Number(e.target.value))}>
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
            <p className="text-sm font-medium text-gray-200">{result.carousel_title}</p>
            <p className="text-xs text-gray-500 mt-1">{result.hook_strategy}</p>
          </div>

          {/* Slide navigator */}
          <div className="card p-4 space-y-4">
            <div className="flex gap-1.5 flex-wrap">
              {result.slides?.map((s: any, i: number) => (
                <button key={i} onClick={() => setActiveSlide(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${activeSlide === i ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
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
                  <div className="bg-gray-800/80 rounded-xl p-6 text-center min-h-32 flex flex-col items-center justify-center gap-2">
                    <p className="text-base font-semibold text-gray-100 leading-snug">{s.headline}</p>
                    {s.body && <p className="text-sm text-gray-400">{s.body}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-800/40 rounded p-2">
                      <p className="text-gray-500 mb-0.5">Visual</p>
                      <p className="text-gray-300">{s.visual_direction}</p>
                    </div>
                    <div className="bg-gray-800/40 rounded p-2">
                      <p className="text-gray-500 mb-0.5">Design note</p>
                      <p className="text-gray-300">{s.design_note}</p>
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
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{result.caption}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {result.hashtags?.map((h: string, i: number) => (
                <span key={i} className="badge bg-brand-900/40 text-brand-300">#{h}</span>
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
                <div><span className="text-xs text-gray-500 block mb-0.5">Tone</span><span className="text-gray-200">{result.voice_analysis.tone}</span></div>
                <div><span className="text-xs text-gray-500 block mb-0.5">Vocabulary</span><span className="text-gray-200">{result.voice_analysis.vocabulary}</span></div>
                <div className="col-span-2"><span className="text-xs text-gray-500 block mb-0.5">Sentence Style</span><span className="text-gray-200">{result.voice_analysis.sentence_structure}</span></div>
                <div className="col-span-2"><span className="text-xs text-gray-500 block mb-0.5">Personality</span><span className="text-gray-300 italic">"{result.voice_analysis.personality}"</span></div>
                {result.voice_analysis.what_to_avoid && (
                  <div className="col-span-2 bg-red-900/20 border border-red-900/40 rounded p-2">
                    <span className="text-xs text-red-400 block mb-0.5">Avoid</span>
                    <span className="text-xs text-gray-300">{result.voice_analysis.what_to_avoid}</span>
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
              <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{result.new_content}</p>
            </div>
          )}
          {result.voice_applied && (
            <div className="card p-4">
              <p className="section-header mb-1">Why it works</p>
              <p className="text-xs text-gray-400">{result.voice_applied}</p>
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
              <div className="flex items-center justify-between mt-0.5 bg-gray-800/60 rounded p-2">
                <p className="text-sm text-gray-200">{result.title_tag}</p>
                <CopyButton text={result.title_tag} />
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500">Meta Description</span>
              <div className="flex items-center justify-between mt-0.5 bg-gray-800/60 rounded p-2">
                <p className="text-sm text-gray-200">{result.meta_description}</p>
                <CopyButton text={result.meta_description} />
              </div>
            </div>
          </div>

          <div className="card p-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-gray-500 block mb-1">Primary Keyword Usage</span>
              <p className="text-gray-300">{result.keyword_usage?.primary}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 block mb-1">Secondary Keywords</span>
              <p className="text-gray-300">{result.keyword_usage?.secondary}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 block mb-1">Readability</span>
              <p className="text-gray-300">{result.readability_score}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 block mb-1">Schema Type</span>
              <p className="text-gray-300">{result.schema_type}</p>
            </div>
          </div>

          {result.internal_link_suggestions?.length > 0 && (
            <div className="card p-4">
              <p className="section-header mb-2">Internal Link Opportunities</p>
              <ul className="space-y-1">
                {result.internal_link_suggestions.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-gray-400 flex gap-2"><span className="text-brand-500">→</span>{s}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="section-header">Optimized Content</p>
              <CopyButton text={result.optimized_content} />
            </div>
            <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{result.optimized_content}</p>
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
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
          <Zap size={20} className="text-white" />
        </div>
        <div>
          <span className="font-semibold text-lg text-gray-100">ContentEngine</span>
          <span className="text-xs text-gray-500 ml-2">AI</span>
        </div>
      </div>

      {/* Hero */}
      <div className="text-center max-w-lg mb-10">
        <h1 className="text-2xl font-semibold text-gray-100 mb-3 leading-snug">
          Turn any insight into<br />multi-channel content
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed">
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
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-start gap-3">
            <span className="text-brand-400 mt-0.5 flex-shrink-0">{item.icon}</span>
            <div>
              <p className="text-xs font-medium text-gray-200">{item.label}</p>
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-300"
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
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-xs text-gray-600">or</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        <button
          onClick={onViewExamples}
          className="w-full py-2.5 text-sm text-gray-400 border border-gray-800 rounded-lg hover:border-gray-700 hover:text-gray-300 transition-colors flex items-center justify-center gap-2"
        >
          <LayoutDashboard size={14} /> View Examples — No API Key Needed
        </button>

        <p className="text-xs text-gray-600 text-center">
          Get your free API key at{' '}
          <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300">
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
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-semibold text-sm text-gray-100">ContentEngine</span>
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
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-300"
            >
              {showKey ? 'hide' : 'show'}
            </button>
          </div>
          <span className={`text-xs flex-shrink-0 ${keyValid ? 'text-green-400' : 'text-gray-600'}`}>
            {keyValid ? '✓ Ready' : '⚠ No key'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <a href="https://notion.so/326feccf871081f7a3cde0e1033be38b" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Case Study →</a>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="border-b border-gray-800 px-4 flex items-center overflow-x-auto">
        {groups.map((group, gi) => (
          <div key={group} className="flex items-center flex-shrink-0">
            {gi > 0 && <div className="w-px h-4 bg-gray-800 mx-2" />}
            <span className="text-xs text-gray-700 pr-1">{group}</span>
            {TABS.filter(t => t.group === group).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? 'border-brand-500 text-brand-300 font-medium' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                {t.icon}<span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Tab description banner */}
      {activeTab && (
        <div className="bg-gray-900/50 border-b border-gray-800/60 px-6 py-2 flex items-center justify-between">
          <p className="text-xs text-gray-500">{activeTab.desc}</p>
          {!keyValid && tab !== 'showcase' && (
            <span className="text-xs text-amber-500/80">← Enter API key in header to generate</span>
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
