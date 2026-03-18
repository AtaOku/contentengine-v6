"""Shared utilities for ContentEngine v6 API endpoints."""
import json
import os
import anthropic
from http.server import BaseHTTPRequestHandler

# ---------------------------------------------------------------------------
# CORS + Response helpers
# ---------------------------------------------------------------------------

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

def cors_response(handler: BaseHTTPRequestHandler, status: int, body: dict):
    payload = json.dumps(body).encode()
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(payload)))
    for k, v in CORS_HEADERS.items():
        handler.send_header(k, v)
    handler.end_headers()
    handler.wfile.write(payload)

def handle_options(handler: BaseHTTPRequestHandler):
    handler.send_response(204)
    for k, v in CORS_HEADERS.items():
        handler.send_header(k, v)
    handler.end_headers()

def read_body(handler: BaseHTTPRequestHandler) -> dict:
    length = int(handler.headers.get("Content-Length", 0))
    if length == 0:
        return {}
    raw = handler.rfile.read(length)
    return json.loads(raw)

# ---------------------------------------------------------------------------
# Claude API helper
# ---------------------------------------------------------------------------

def call_claude(system: str, user: str, max_tokens: int = 2000) -> tuple[str, dict]:
    """Call Claude API. Returns (text, usage_dict)."""
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    client = anthropic.Anthropic(api_key=api_key)
    msg = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    text = msg.content[0].text if msg.content else ""
    usage = {
        "input_tokens": msg.usage.input_tokens,
        "output_tokens": msg.usage.output_tokens,
        "cost_usd": round(msg.usage.input_tokens * 0.000003 + msg.usage.output_tokens * 0.000015, 4),
    }
    return text, usage

# ---------------------------------------------------------------------------
# PROMPT TEMPLATES
# ---------------------------------------------------------------------------

SYSTEM_ANALYST = """You are a senior content strategist and marketing analyst. 
You analyze brand/company information and extract structured, actionable insights.
Always respond with valid JSON only — no markdown fences, no preamble, no commentary.
Be specific and actionable. Avoid generic marketing advice."""

SYSTEM_GENERATOR = """You are an expert content writer specializing in multi-channel marketing copy.
You write in the exact brand voice specified. You never add meta-commentary or explain your choices.
Output only the requested content. Always respond with valid JSON only — no markdown fences."""

SYSTEM_REPURPOSE = """You are a content repurposing specialist. 
Given content in one format, you adapt it perfectly for new channels and audiences.
Always respond with valid JSON only — no markdown fences, no preamble."""

SYSTEM_TRENDS = """You are a trend analyst and content strategist.
You identify relevant trends and translate them into specific content opportunities.
Always respond with valid JSON only — no markdown fences."""

SYSTEM_DATA = """You are a data storytelling expert.
You transform raw data and statistics into compelling marketing narratives.
Always respond with valid JSON only — no markdown fences."""

SYSTEM_CHAIN = """You are a content sequence strategist.
You build coherent multi-touch content journeys that guide audiences through a narrative arc.
Always respond with valid JSON only — no markdown fences."""

SYSTEM_CAROUSEL = """You are a social media carousel specialist.
You create scroll-stopping slide sequences with strong visual hooks and clear progression.
Always respond with valid JSON only — no markdown fences."""

SYSTEM_VOICE = """You are a brand voice analyst and copywriter.
You analyze writing samples, extract voice patterns, then apply them precisely to new content.
Always respond with valid JSON only — no markdown fences."""

SYSTEM_SCORE = """You are a content quality analyst.
You evaluate marketing content against proven performance criteria.
Always respond with valid JSON only — no markdown fences."""

SYSTEM_SEO = """You are an SEO specialist.
You optimize content for search engines while maintaining natural readability.
Always respond with valid JSON only — no markdown fences."""


def prompt_analyze(kb: dict) -> str:
    return f"""Analyze this brand and extract structured insights for content strategy.

BRAND KNOWLEDGE BASE:
{json.dumps(kb, indent=2)}

Return JSON with this exact structure:
{{
  "company_summary": "2-sentence brand essence",
  "target_audience": {{
    "primary": "primary segment description",
    "pain_points": ["pain1", "pain2", "pain3"],
    "desires": ["desire1", "desire2", "desire3"]
  }},
  "value_propositions": ["vp1", "vp2", "vp3"],
  "content_pillars": [
    {{"pillar": "name", "rationale": "why", "content_types": ["type1", "type2"]}}
  ],
  "competitive_angles": ["angle1", "angle2"],
  "brand_voice_descriptors": ["descriptor1", "descriptor2", "descriptor3"],
  "content_opportunities": ["opportunity1", "opportunity2", "opportunity3"],
  "recommended_topics": ["topic1", "topic2", "topic3", "topic4", "topic5"]
}}"""


def prompt_generate_batch(kb: dict, analysis: dict, topic: str, channels: list) -> str:
    channel_specs = {
        "LinkedIn": "professional, 150-200 words, insight-led, 3-5 hashtags",
        "Twitter/X": "punchy, under 280 chars, hook in first 5 words, 1-2 hashtags",
        "Email": "subject line + preview text + 200-word body, conversational, clear CTA",
        "Blog": "SEO-optimized, 350-400 words, H2 subheadings, strong intro + conclusion",
        "Instagram": "visual-first, 100-150 words, storytelling, 10-15 hashtags",
        "TikTok/Video": "script format, hook (3s) + content (45s) + CTA (12s)",
    }
    specs = {ch: channel_specs.get(ch, "platform-appropriate content") for ch in channels}
    return f"""Generate multi-channel content for this topic and brand.

BRAND KNOWLEDGE BASE:
{json.dumps(kb, indent=2)}

STRATEGIC ANALYSIS:
{json.dumps(analysis, indent=2)}

TOPIC: {topic}

CHANNELS & SPECS:
{json.dumps(specs, indent=2)}

Return JSON:
{{
  "topic": "{topic}",
  "content": {{
    {', '.join(f'"{ch}": {{"content": "...", "notes": "brief note"}}' for ch in channels)}
  }},
  "strategic_notes": "why this topic works for this brand",
  "cta_options": ["cta1", "cta2", "cta3"]
}}"""


def prompt_repurpose(original_content: str, source_format: str, target_channels: list, brand_voice: str) -> str:
    return f"""Repurpose this content from {source_format} into new channel formats.

ORIGINAL CONTENT:
{original_content}

BRAND VOICE: {brand_voice}

TARGET CHANNELS: {', '.join(target_channels)}

Return JSON:
{{
  "source_summary": "what the original content is about",
  "repurposed": {{
    {', '.join(f'"{ch}": {{"content": "...", "adaptation_notes": "what changed and why"}}' for ch in target_channels)}
  }},
  "key_message": "the core message preserved across all versions"
}}"""


def prompt_trends(industry: str, audience: str, n: int = 5) -> str:
    return f"""Identify {n} trending topics relevant to this brand's content strategy.

INDUSTRY: {industry}
TARGET AUDIENCE: {audience}

For each trend, provide actionable content angles — not just trend names.

Return JSON:
{{
  "trends": [
    {{
      "trend": "trend name",
      "why_relevant": "1 sentence",
      "content_angle": "specific angle for this brand",
      "content_ideas": ["idea1", "idea2"],
      "urgency": "high|medium|low",
      "formats": ["best format1", "best format2"]
    }}
  ]
}}"""


def prompt_data_to_content(data_input: str, context: str, channels: list) -> str:
    return f"""Transform this data into compelling marketing content.

DATA / STATISTICS:
{data_input}

BRAND CONTEXT: {context}

TARGET CHANNELS: {', '.join(channels)}

Find the most compelling narrative angle in the data. Make numbers human.

Return JSON:
{{
  "data_story": "the core narrative this data tells",
  "key_stat": "the most compelling single statistic",
  "content": {{
    {', '.join(f'"{ch}": {{"content": "...", "data_usage": "how data is presented"}}' for ch in channels)}
  }},
  "visualization_suggestion": "what chart/visual would make this data hit harder"
}}"""


def prompt_chain(topic: str, audience: str, n_pieces: int, goal: str) -> str:
    return f"""Create a {n_pieces}-piece content chain on this topic.

TOPIC: {topic}
AUDIENCE: {audience}
GOAL: {goal}

Build a narrative arc: each piece should stand alone but also advance the overall story.

Return JSON:
{{
  "chain_title": "overall series name",
  "arc": "the narrative journey across pieces",
  "pieces": [
    {{
      "number": 1,
      "title": "...",
      "hook": "opening line",
      "angle": "what this piece covers",
      "content": "full content",
      "bridge": "how it connects to next piece"
    }}
  ]
}}"""


def prompt_carousel(topic: str, platform: str, n_slides: int, brand_voice: str) -> str:
    return f"""Create a {n_slides}-slide carousel for {platform}.

TOPIC: {topic}
BRAND VOICE: {brand_voice}

Rules: Slide 1 = scroll-stopping hook. Last slide = clear CTA. Each slide = one idea.

Return JSON:
{{
  "carousel_title": "series name for reference",
  "hook_strategy": "why slide 1 will stop scrolling",
  "slides": [
    {{
      "number": 1,
      "headline": "short, punchy headline",
      "body": "1-3 lines of supporting copy",
      "visual_direction": "what to show visually",
      "design_note": "layout/color suggestion"
    }}
  ],
  "caption": "post caption to accompany the carousel"
}}"""


def prompt_voice(samples: list, new_topic: str) -> str:
    return f"""Analyze these brand voice samples, extract the voice DNA, then write new content.

WRITING SAMPLES:
{chr(10).join(f'{i+1}. {s}' for i, s in enumerate(samples))}

NEW TOPIC TO WRITE ABOUT: {new_topic}

Return JSON:
{{
  "voice_analysis": {{
    "tone": "description",
    "sentence_structure": "patterns observed",
    "vocabulary": "word choice tendencies",
    "personality": "3 adjectives",
    "what_to_avoid": "patterns NOT in this voice"
  }},
  "new_content": "content written in this exact voice",
  "voice_applied": "brief note on how voice was applied"
}}"""


def prompt_score(content: str, channel: str, goal: str) -> str:
    return f"""Score this {channel} content against marketing performance criteria.

CONTENT:
{content}

GOAL: {goal}

Return JSON:
{{
  "overall_score": 0-100,
  "grades": {{
    "hook_strength": {{"score": 0-100, "rationale": "..."}},
    "clarity": {{"score": 0-100, "rationale": "..."}},
    "cta_strength": {{"score": 0-100, "rationale": "..."}},
    "audience_fit": {{"score": 0-100, "rationale": "..."}},
    "originality": {{"score": 0-100, "rationale": "..."}}
  }},
  "strengths": ["strength1", "strength2"],
  "improvements": [
    {{"issue": "...", "fix": "specific rewrite suggestion"}}
  ],
  "verdict": "one-sentence summary"
}}"""


def prompt_seo(content: str, target_keyword: str, secondary_keywords: list) -> str:
    return f"""Optimize this content for SEO without sacrificing readability.

CONTENT:
{content}

PRIMARY KEYWORD: {target_keyword}
SECONDARY KEYWORDS: {', '.join(secondary_keywords)}

Return JSON:
{{
  "optimized_content": "the rewritten, SEO-optimized version",
  "title_tag": "60 chars max",
  "meta_description": "155 chars max",
  "keyword_usage": {{
    "primary": "where/how primary keyword is used",
    "secondary": "where secondary keywords appear"
  }},
  "internal_link_suggestions": ["anchor text → topic to link to"],
  "schema_type": "recommended schema markup type",
  "readability_score": "estimated Flesch score and assessment"
}}"""
