import fs from 'node:fs';
import path from 'node:path';

interface UrlCheckResult {
  candidateId: string;
  originalUrl: string;
  status: number | string;
  ok: boolean;
  redirected: boolean;
  finalUrl?: string;
  flag?: string;
}

const CANDIDATES_FILE = path.resolve(process.cwd(), 'data/candidates.json');

function extractHostname(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function isRelatedDomain(originalUrl: string, finalUrl: string): boolean {
  const origHost = extractHostname(originalUrl);
  const finalHost = extractHostname(finalUrl);

  if (origHost === finalHost) return true;

  // Check shared root domain e.g. corporate.target.com and target.com
  const origParts = origHost.split('.');
  const finalParts = finalHost.split('.');

  const origRoot = origParts.slice(-2).join('.');
  const finalRoot = finalParts.slice(-2).join('.');

  return origRoot === finalRoot;
}

async function checkUrl(candidateId: string, urlStr: string): Promise<UrlCheckResult> {
  const timeoutMs = 8000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };

  try {
    let response: Response;
    try {
      // Try HEAD first for speed
      response = await fetch(urlStr, {
        method: 'HEAD',
        headers,
        signal: controller.signal,
        redirect: 'follow',
      });
      // Some servers return 405 on HEAD, retry with GET
      if (response.status === 405 || response.status === 403) {
        response = await fetch(urlStr, {
          method: 'GET',
          headers,
          signal: controller.signal,
          redirect: 'follow',
        });
      }
    } catch {
      // Fallback to GET on protocol/header abort
      response = await fetch(urlStr, {
        method: 'GET',
        headers,
        signal: controller.signal,
        redirect: 'follow',
      });
    }

    clearTimeout(timeoutId);

    const finalUrl = response.url || urlStr;
    const redirected = response.redirected || finalUrl !== urlStr;
    const is200 = response.status >= 200 && response.status < 300;

    let flag: string | undefined;

    if (!is200) {
      flag = `HTTP ${response.status} ${response.statusText}`;
    } else if (redirected && !isRelatedDomain(urlStr, finalUrl)) {
      flag = `REDIRECTED to unrelated domain: ${finalUrl}`;
    }

    return {
      candidateId,
      originalUrl: urlStr,
      status: response.status,
      ok: is200 && !flag?.startsWith('REDIRECTED'),
      redirected,
      finalUrl,
      flag,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const errMessage = (err as Error).name === 'AbortError' ? 'TIMEOUT (8s)' : (err as Error).message;
    return {
      candidateId,
      originalUrl: urlStr,
      status: 'FAILED',
      ok: false,
      redirected: false,
      flag: `Connection error: ${errMessage}`,
    };
  }
}

async function runLinkChecker() {
  console.log('🔗 Running Groundtruth Source URL Link Checker...\n');

  if (!fs.existsSync(CANDIDATES_FILE)) {
    console.error(`Candidates file not found: ${CANDIDATES_FILE}`);
    process.exit(1);
  }

  let candidates: any[] = [];
  try {
    candidates = JSON.parse(fs.readFileSync(CANDIDATES_FILE, 'utf-8'));
  } catch (err) {
    console.error(`Failed to parse candidates.json: ${(err as Error).message}`);
    process.exit(1);
  }

  if (candidates.length === 0) {
    console.log('No candidates found in data/candidates.json. Run `npm run collect` first.');
    process.exit(0);
  }

  // Gather unique URLs per candidate
  const urlQueue: { candidateId: string; url: string }[] = [];
  const seenUrls = new Set<string>();

  for (const item of candidates) {
    const company = item.company || item;
    const candidateId = company.id || 'unknown';

    if (Array.isArray(company.sources)) {
      for (const src of company.sources) {
        if (src?.url && !seenUrls.has(src.url)) {
          seenUrls.add(src.url);
          urlQueue.push({ candidateId, url: src.url });
        }
      }
    }

    if (company.route_source?.url && !seenUrls.has(company.route_source.url)) {
      seenUrls.add(company.route_source.url);
      urlQueue.push({ candidateId, url: company.route_source.url });
    }
  }

  console.log(`Checking ${urlQueue.length} unique source URL(s) across ${candidates.length} candidate(s)...\n`);

  const results: UrlCheckResult[] = [];
  let failedCount = 0;
  let redirectWarningCount = 0;

  for (const item of urlQueue) {
    process.stdout.write(`Checking [${item.candidateId}] ${item.url.slice(0, 70)}... `);
    const result = await checkUrl(item.candidateId, item.url);
    results.push(result);

    if (result.ok && !result.flag) {
      console.log(`✅ [${result.status}] OK`);
    } else if (result.flag?.startsWith('REDIRECTED')) {
      redirectWarningCount++;
      console.log(`⚠️  ${result.flag}`);
    } else {
      failedCount++;
      console.log(`❌ [${result.status}] ${result.flag}`);
    }
  }

  console.log('\n----------------------------------------');
  console.log(`Summary:`);
  console.log(`Total URLs Checked: ${results.length}`);
  console.log(`Healthy (200 OK):   ${results.filter((r) => r.ok && !r.flag).length}`);
  console.log(`Redirect Warnings:  ${redirectWarningCount}`);
  console.log(`Failed / Non-200:   ${failedCount}`);

  // Write structured health results to data/link-health.json
  const linkHealthOutput = {
    last_run: new Date().toISOString(),
    total_checked: results.length,
    healthy_count: results.filter((r) => r.ok && !r.flag).length,
    failed_count: failedCount,
    redirect_count: redirectWarningCount,
    links: results.reduce((acc, r) => {
      acc[r.originalUrl] = {
        candidate_id: r.candidateId,
        status: r.status,
        ok: r.ok,
        redirected: r.redirected,
        final_url: r.finalUrl || r.originalUrl,
        checked_at: new Date().toISOString().split('T')[0],
        flag: r.flag || null,
      };
      return acc;
    }, {} as Record<string, any>),
  };

  const healthPath = path.resolve(process.cwd(), 'data/link-health.json');
  fs.writeFileSync(healthPath, JSON.stringify(linkHealthOutput, null, 2), 'utf-8');
  console.log(`📄 Wrote link health report to ${healthPath}`);

  if (failedCount > 0) {
    console.warn('\n⚠️  One or more source URLs failed verification. Inspect the flags above before approving candidates.');
    process.exit(1);
  } else {
    console.log('\n✅ All checked source URLs returned HTTP 200 and valid domain resolutions.');
    process.exit(0);
  }
}

runLinkChecker();
