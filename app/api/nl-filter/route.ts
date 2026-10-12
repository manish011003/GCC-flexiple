import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory rate limiting map: 20 requests per minute per IP
const ipRateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  entry.count++;
  return true;
}

export interface ParsedFilters {
  query: string | null;
  city: string | null;
  sector: string | null;
  parent_country: string | null;
  type: 'captive' | 'mid-market' | 'unknown' | null;
  evidence_tier: 'A' | 'B' | 'C' | null;
}

const VALID_TYPES = ['captive', 'mid-market', 'unknown'];
const VALID_TIERS = ['A', 'B', 'C'];

export async function POST(request: NextRequest) {
  // 1. IP extraction & rate limiting
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait a minute before making more queries.' },
      { status: 429 }
    );
  }

  let promptText = '';
  try {
    const body = await request.json();
    promptText = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  if (!promptText) {
    return NextResponse.json({
      filters: {
        query: null,
        city: null,
        sector: null,
        parent_country: null,
        type: null,
        evidence_tier: null,
      },
    });
  }

  const fallbackFilters: ParsedFilters = {
    query: promptText,
    city: null,
    sector: null,
    parent_country: null,
    type: null,
    evidence_tier: null,
  };

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  if (!apiKey) {
    // Graceful offline heuristic parser when API key is not configured
    return NextResponse.json({ filters: parseHeuristically(promptText) });
  }

  const systemInstruction = `You are a query parser for an India GCC database.
Convert the user's natural language request into structured filter criteria.
Allowed fields:
- query: string or null (general keywords that don't fit into city/sector/country)
- city: string or null (e.g., "Bengaluru", "Hyderabad", "Pune", "Chennai", "Gurugram", "Mumbai", "Kochi", "Ahmedabad")
- sector: string or null (e.g., "Retail", "Banking", "Aerospace", "Technology", "Healthcare", "Pharma")
- parent_country: string or null (e.g., "United States", "United Kingdom", "Germany", "Japan")
- type: "captive" | "mid-market" | "unknown" | null
- evidence_tier: "A" | "B" | "C" | null

Output ONLY valid JSON matching this schema:
{
  "query": "string or null",
  "city": "string or null",
  "sector": "string or null",
  "parent_country": "string or null",
  "type": "captive" | "mid-market" | "unknown" | null,
  "evidence_tier": "A" | "B" | "C" | null
}`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!geminiRes.ok) {
      console.warn(`Gemini NL filter call returned status ${geminiRes.status}. Using fallback.`);
      return NextResponse.json({ filters: fallbackFilters });
    }

    const data = await geminiRes.json();
    const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawContent) {
      return NextResponse.json({ filters: fallbackFilters });
    }

    const parsed = JSON.parse(rawContent);

    const validatedFilters: ParsedFilters = {
      query: typeof parsed.query === 'string' && parsed.query.trim().length > 0 ? parsed.query.trim() : null,
      city: typeof parsed.city === 'string' && parsed.city.trim().length > 0 ? parsed.city.trim() : null,
      sector: typeof parsed.sector === 'string' && parsed.sector.trim().length > 0 ? parsed.sector.trim() : null,
      parent_country:
        typeof parsed.parent_country === 'string' && parsed.parent_country.trim().length > 0
          ? parsed.parent_country.trim()
          : null,
      type: VALID_TYPES.includes(parsed.type) ? parsed.type : null,
      evidence_tier: VALID_TIERS.includes(parsed.evidence_tier) ? parsed.evidence_tier : null,
    };

    return NextResponse.json({ filters: validatedFilters });
  } catch (err) {
    console.warn('Gemini NL filter exception, falling back to keyword search:', (err as Error).message);
    return NextResponse.json({ filters: fallbackFilters });
  }
}

/**
 * Fallback parser for offline or dev mode
 */
function parseHeuristically(text: string): ParsedFilters {
  const lower = text.toLowerCase();

  let city: string | null = null;
  if (lower.includes('bengaluru') || lower.includes('bangalore')) city = 'Bengaluru';
  else if (lower.includes('hyderabad')) city = 'Hyderabad';
  else if (lower.includes('pune')) city = 'Pune';
  else if (lower.includes('chennai')) city = 'Chennai';
  else if (lower.includes('gurugram') || lower.includes('gurgaon') || lower.includes('ncr')) city = 'Gurugram';
  else if (lower.includes('mumbai')) city = 'Mumbai';

  let sector: string | null = null;
  if (lower.includes('retail') || lower.includes('ecommerce')) sector = 'Retail';
  else if (lower.includes('bank') || lower.includes('finance') || lower.includes('bfsi')) sector = 'Banking';
  else if (lower.includes('pharma') || lower.includes('health')) sector = 'Pharmaceutical';
  else if (lower.includes('aerospace') || lower.includes('aviation')) sector = 'Aerospace';

  let parent_country: string | null = null;
  if (lower.includes('us') || lower.includes('american') || lower.includes('united states')) parent_country = 'United States';
  else if (lower.includes('uk') || lower.includes('british')) parent_country = 'United Kingdom';
  else if (lower.includes('germany') || lower.includes('german')) parent_country = 'Germany';

  let type: ParsedFilters['type'] = null;
  if (lower.includes('captive')) type = 'captive';
  else if (lower.includes('mid-market')) type = 'mid-market';

  let tier: ParsedFilters['evidence_tier'] = null;
  if (lower.includes('tier a') || lower.includes('tier 1')) tier = 'A';
  else if (lower.includes('tier b')) tier = 'B';
  else if (lower.includes('tier c')) tier = 'C';

  return {
    query: text,
    city,
    sector,
    parent_country,
    type,
    evidence_tier: tier,
  };
}
