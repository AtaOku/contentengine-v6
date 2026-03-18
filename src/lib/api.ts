// API client for ContentEngine v6

const BASE = '';

// ── API Key management ────────────────────────────────────────────────────────
let _apiKey = '';
export const setApiKey = (key: string) => { _apiKey = key; };
export const getApiKey = () => _apiKey;

async function post<T>(path: string, body: unknown): Promise<T> {
  const payload = typeof body === 'object' && body !== null
    ? { ...body as object, api_key: _apiKey }
    : body;
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API error');
  }
  return res.json();
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed`);
  return res.json();
}

export const api = {
  health: () => get<{ status: string; version: string }>('/api/health'),
  demos: () => get<{ demos: Demo[] }>('/api/demos'),

  analyze: (knowledge_base: KnowledgeBase) =>
    post<{ analysis: Analysis; usage: Usage }>('/api/analyze', { knowledge_base }),

  generate: (knowledge_base: KnowledgeBase, analysis: Analysis, topic: string, channels: string[]) =>
    post<{ result: Generated; usage: Usage }>('/api/generate', { knowledge_base, analysis, topic, channels }),

  repurpose: (content: string, source_format: string, target_channels: string[], brand_voice: string) =>
    post<{ result: RepurposeResult; usage: Usage }>('/api/repurpose', { content, source_format, target_channels, brand_voice }),

  trends: (industry: string, audience: string, count?: number) =>
    post<{ result: TrendsResult; usage: Usage }>('/api/trends', { industry, audience, count }),

  dataInsights: (data: string, context: string, channels: string[]) =>
    post<{ result: DataResult; usage: Usage }>('/api/data-insights', { data, context, channels }),

  chain: (topic: string, audience: string, pieces: number, goal: string) =>
    post<{ result: ChainResult; usage: Usage }>('/api/chain', { topic, audience, pieces, goal }),

  carousel: (topic: string, platform: string, slides: number, brand_voice: string) =>
    post<{ result: CarouselResult; usage: Usage }>('/api/carousel', { topic, platform, slides, brand_voice }),

  voice: (samples: string[], topic: string) =>
    post<{ result: VoiceResult; usage: Usage }>('/api/voice', { samples, topic }),

  score: (content: string, channel: string, goal: string) =>
    post<{ result: ScoreResult; usage: Usage }>('/api/score', { content, channel, goal }),

  seo: (content: string, keyword: string, secondary_keywords: string[]) =>
    post<{ result: SeoResult; usage: Usage }>('/api/seo', { content, keyword, secondary_keywords }),
};

// --- Types ---

export interface Usage {
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
}

export interface KnowledgeBase {
  company_name: string;
  industry: string;
  description: string;
  target_audience: string;
  value_prop: string;
  brand_voice: string;
  competitors?: string;
  goals?: string;
}

export interface Analysis {
  company_summary: string;
  target_audience: {
    primary: string;
    pain_points: string[];
    desires: string[];
  };
  value_propositions: string[];
  content_pillars: Array<{ pillar: string; rationale: string; content_types: string[] }>;
  brand_voice_descriptors: string[];
  recommended_topics: string[];
  content_opportunities: string[];
}

export interface Generated {
  topic: string;
  content: Record<string, { content: string; notes: string }>;
  strategic_notes: string;
  cta_options: string[];
}

export interface RepurposeResult {
  source_summary: string;
  key_message: string;
  repurposed: Record<string, { content: string; adaptation_notes: string }>;
}

export interface TrendsResult {
  trends: Array<{
    trend: string;
    why_relevant: string;
    content_angle: string;
    content_ideas: string[];
    urgency: string;
    formats: string[];
  }>;
}

export interface DataResult {
  data_story: string;
  key_stat: string;
  visualization_suggestion: string;
  content: Record<string, { content: string; data_usage: string }>;
}

export interface ChainResult {
  chain_title: string;
  arc: string;
  pieces: Array<{
    number: number;
    title: string;
    hook: string;
    angle: string;
    content: string;
    bridge: string;
  }>;
}

export interface CarouselResult {
  carousel_title: string;
  hook_strategy: string;
  caption: string;
  slides: Array<{
    number: number;
    headline: string;
    body: string;
    visual_direction: string;
    design_note: string;
  }>;
}

export interface VoiceResult {
  voice_analysis: {
    tone: string;
    sentence_structure: string;
    vocabulary: string;
    personality: string;
    what_to_avoid: string;
  };
  new_content: string;
  voice_applied: string;
}

export interface ScoreResult {
  overall_score: number;
  grades: Record<string, { score: number; rationale: string }>;
  strengths: string[];
  improvements: Array<{ issue: string; fix: string }>;
  verdict: string;
}

export interface SeoResult {
  optimized_content: string;
  title_tag: string;
  meta_description: string;
  keyword_usage: { primary: string; secondary: string };
  internal_link_suggestions: string[];
  schema_type: string;
  readability_score: string;
}

export interface Demo {
  id: string;
  label: string;
  company: string;
  tagline: string;
  description: string;
  topic: string;
  analysis: Partial<Analysis>;
  generated: Partial<Record<string, { content: string; notes: string }>>;
}
