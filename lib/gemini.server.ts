/**
 * Gemini client: server-only module.
 *
 * This file reads GEMINI_API_KEY from process.env and must NEVER be imported
 * in client components or pages. The .server.ts suffix is a convention;
 * enforcement comes from the route-handler boundary.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY && process.env.NODE_ENV === "production") {
  throw new Error("GEMINI_API_KEY is not set in production environment.");
}

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

export interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface GeminiRequest {
  systemInstruction?: { parts: { text: string }[] };
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
  };
}

/**
 * Streams a response from Gemini as an SSE ReadableStream.
 * Returns a ReadableStream<string> of text chunks.
 */
export async function streamGeminiResponse(
  systemPrompt: string,
  userPrompt: string
): Promise<ReadableStream<string>> {
  if (!GEMINI_API_KEY) {
    // Dev fallback: return a mock stream
    return new ReadableStream({
      start(controller) {
        const mockBrief = getMockBrief();
        let i = 0;
        const interval = setInterval(() => {
          if (i < mockBrief.length) {
            controller.enqueue(mockBrief[i]);
            i++;
          } else {
            clearInterval(interval);
            controller.close();
          }
        }, 20);
      },
    });
  }

  const body: GeminiRequest = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
      topP: 0.8,
    },
  };

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${error}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream<string>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }

      const chunk = decoder.decode(value, { stream: true });
      // Parse SSE lines
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            controller.close();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const text =
              parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              controller.enqueue(text);
            }
          } catch {
            // Skip non-JSON lines
          }
        }
      }
    },
  });
}

function getMockBrief(): string[] {
  const sections = [
    `<h3>Why the numbers disagree</h3>\n<p>NASSCOM counts only entities registered under their GCC framework (1,580), while Deloitte includes captive R&D units and shared-service centres that function as capability centres (1,700+). ANSR's broader definition encompasses all offshore-owned development centres, yielding the highest count (1,800+).</p>\n\n`,
    `<h3>Your scenario</h3>\n<p>Based on your inputs: a mid-sized company looking to establish a software engineering centre with 30-75 people, targeting first hires within 3-6 months, prioritising talent depth.</p>\n\n`,
    `<h3>Recommended cities</h3>\n<ul>\n<li><strong>Bengaluru</strong>: deepest engineering talent pool in India (1.8M+ tech professionals). Higher cost and attrition (18-22%), but unmatched access to senior full-stack, ML, and platform engineers.</li>\n<li><strong>Hyderabad</strong>: fastest-growing GCC hub. 15-20% lower salary costs than Bengaluru with rapidly expanding senior talent, especially in cloud and data engineering.</li>\n<li><strong>Pune</strong>: strong engineering base with the lowest attrition among Tier-1 cities (14-16%). Ideal if retention and cost balance matter.</li>\n</ul>\n\n`,
    `<h3>Cost envelope (Year 1)</h3>\n<p>For a 50-person engineering team:</p>\n<ul>\n<li><strong>Entity setup:</strong> ₹20-30 lakhs (one-time) + 4-6 months lead time</li>\n<li><strong>Annual payroll:</strong> ₹6-10 crore (depending on city and seniority mix)</li>\n<li><strong>Office &amp; overhead:</strong> ₹60-90 lakhs/year</li>\n<li><strong>Total Year-1 estimate:</strong> ₹7-12 crore</li>\n</ul>\n\n`,
    `<h3>Entity vs. EOR</h3>\n<p>With a 3-6 month timeline and 30-75 person target, <strong>starting with an EOR and transitioning to an entity</strong> is the pragmatic path. An EOR gets you hiring in 2-4 weeks; begin the entity registration process in parallel. Expect the entity to be operational by month 5-7.</p>\n\n`,
    `<h3>Key risks</h3>\n<ul>\n<li><strong>Attrition in Bengaluru:</strong> budget for 18-22% annual attrition; over-hire by 10-15% in the first cohort.</li>\n<li><strong>IP protection:</strong> India's IP regime is strong for software copyright but weaker on trade-secret enforcement. Use robust NDAs and escrow code repositories from day one.</li>\n<li><strong>Regulatory timeline:</strong> GST and PF registration can take 6-8 weeks; factor this into your entity timeline.</li>\n</ul>`,
  ];

  // Split into character chunks for streaming effect
  const allText = sections.join("");
  const chunks: string[] = [];
  for (let i = 0; i < allText.length; i += 15) {
    chunks.push(allText.slice(i, i + 15));
  }
  return chunks;
}
