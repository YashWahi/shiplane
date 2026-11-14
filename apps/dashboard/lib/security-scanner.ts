import { prisma } from "./prisma";

interface FindingCandidate {
  severity: "critical" | "high" | "medium" | "low" | "info";
  code: string;
  message: string;
  recommendation: string;
  filePath?: string;
  lineNumber?: number;
}

const SECRET_PATTERNS = [
  {
    name: "Stripe Live Secret Key",
    regex: /sk_live_[a-zA-Z0-9]{20,}/g,
  },
  {
    name: "Stripe Test Secret Key",
    regex: /sk_test_[a-zA-Z0-9]{20,}/g,
  },
  {
    name: "AWS Access Key ID",
    regex: /AKIA[0-9A-Z]{16}/g,
  },
  {
    name: "Google API Key",
    regex: /AIza[a-zA-Z0-9\-_]{35}/g,
  },
  {
    name: "GitHub Personal Access Token",
    regex: /ghp_[a-zA-Z0-9]{36}/g,
  },
];

const CONFIG_FILES_TO_CHECK = [
  "/.env",
  "/config.json",
  "/.git/config",
  "/wp-config.php",
];

const REQUIRED_SECURITY_HEADERS = [
  "Strict-Transport-Security",
  "X-Content-Type-Options",
  "X-Frame-Options",
];

/**
 * Wraps native fetch with an explicit timeout (default: 5 seconds).
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Check 1: Leaked API Keys in Frontend Assets (HTML + loaded scripts)
 */
async function checkLeakedApiKeys(appUrl: string): Promise<FindingCandidate[]> {
  const findings: FindingCandidate[] = [];
  try {
    const htmlResponse = await fetchWithTimeout(appUrl);
    if (!htmlResponse.ok) return findings;

    const htmlText = await htmlResponse.text();

    // Extract all <script src="..."> URLs
    const scriptUrls: string[] = [];
    const scriptTagRegex = /<script\b[^>]*?\bsrc=["']([^"']+)["'][^>]*>/gi;
    let match: RegExpExecArray | null;

    while ((match = scriptTagRegex.exec(htmlText)) !== null) {
      try {
        const resolved = new URL(match[1], appUrl).toString();
        scriptUrls.push(resolved);
      } catch {
        // Ignore unparseable script URLs
      }
    }

    // Fetch up to 10 scripts in parallel to avoid unbounded requests
    const scriptFetches = scriptUrls.slice(0, 10).map(async (scriptUrl) => {
      try {
        const scriptRes = await fetchWithTimeout(scriptUrl);
        if (scriptRes.ok) {
          const content = await scriptRes.text();
          return { url: scriptUrl, content };
        }
      } catch {
        // Individual script fetch failure
      }
      return null;
    });

    const scriptResults = await Promise.allSettled(scriptFetches);
    const scriptContents: Array<{ url: string; content: string }> = [];

    for (const res of scriptResults) {
      if (res.status === "fulfilled" && res.value) {
        scriptContents.push(res.value);
      }
    }

    // Analyze HTML and scripts for secret patterns
    const assetsToInspect = [
      { url: appUrl, content: htmlText },
      ...scriptContents,
    ];

    for (const asset of assetsToInspect) {
      for (const pattern of SECRET_PATTERNS) {
        const matches = asset.content.match(pattern.regex);
        if (matches && matches.length > 0) {
          const masked = matches[0].slice(0, 8) + "..." + matches[0].slice(-4);
          findings.push({
            severity: "critical",
            code: "LEAKED_API_KEY",
            message: `Detected exposed ${pattern.name} (${masked}) in client-accessible asset`,
            recommendation:
              "Rotate the leaked credential immediately and ensure secret keys are only accessed server-side.",
            filePath: asset.url,
          });
        }
      }
    }
  } catch (err) {
    console.warn(`[SecurityScanner] Check 1 (Leaked Keys) failed for ${appUrl}:`, err);
  }
  return findings;
}

/**
 * Check 2: Overly Permissive CORS
 */
async function checkCors(appUrl: string): Promise<FindingCandidate[]> {
  const findings: FindingCandidate[] = [];
  try {
    const origin = "https://evil-attacker.com";
    const res = await fetchWithTimeout(appUrl, {
      method: "GET",
      headers: { Origin: origin },
    });

    const allowOrigin = res.headers.get("access-control-allow-origin");
    if (allowOrigin === "*" || allowOrigin === origin) {
      findings.push({
        severity: "high",
        code: "OPEN_CORS",
        message: `Overly permissive CORS policy allows arbitrary origins: ${allowOrigin}`,
        recommendation:
          "Configure specific, trusted domain names in Access-Control-Allow-Origin instead of wildcards or arbitrary origin reflection.",
      });
    }
  } catch (err) {
    console.warn(`[SecurityScanner] Check 2 (CORS) failed for ${appUrl}:`, err);
  }
  return findings;
}

/**
 * Check 3: Missing Security Headers
 */
async function checkSecurityHeaders(appUrl: string): Promise<FindingCandidate[]> {
  const findings: FindingCandidate[] = [];
  try {
    const res = await fetchWithTimeout(appUrl, { method: "GET" });
    const headers = res.headers;

    for (const requiredHeader of REQUIRED_SECURITY_HEADERS) {
      if (!headers.get(requiredHeader.toLowerCase())) {
        findings.push({
          severity: "medium",
          code: "MISSING_HEADER",
          message: `Missing security header: ${requiredHeader}`,
          recommendation: `Add the '${requiredHeader}' header to secure responses against clickjacking, MIME sniffing, or insecure transport.`,
        });
      }
    }
  } catch (err) {
    console.warn(`[SecurityScanner] Check 3 (Headers) failed for ${appUrl}:`, err);
  }
  return findings;
}

/**
 * Check 4: Exposed Configuration Files
 */
async function checkExposedConfigFiles(appUrl: string): Promise<FindingCandidate[]> {
  const findings: FindingCandidate[] = [];

  const checks = CONFIG_FILES_TO_CHECK.map(async (configPath) => {
    try {
      const targetUrl = new URL(configPath, appUrl).toString();
      const res = await fetchWithTimeout(targetUrl, { method: "GET" });
      if (res.status === 200) {
        findings.push({
          severity: "critical",
          code: "EXPOSED_CONFIG",
          message: `Exposed configuration file accessible at ${configPath}`,
          recommendation: `Block public HTTP access to '${configPath}' in your web server or reverse proxy configuration.`,
          filePath: configPath,
        });
      }
    } catch {
      // Individual probe error (e.g. timeout or connection reset)
    }
  });

  await Promise.allSettled(checks);
  return findings;
}

/**
 * Executes automated security scanning for a deployment.
 *
 * @param deploymentId The deployment ID to scan.
 * @param appUrl The public or internal URL where the deployment is reachable.
 */
export async function runSecurityScan(
  deploymentId: string,
  appUrl: string
): Promise<void> {
  console.log(`[SecurityScanner] Starting automated security scan for deployment ${deploymentId} (${appUrl})`);

  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
  });

  if (!deployment) {
    console.error(`[SecurityScanner] Deployment ${deploymentId} not found. Aborting scan.`);
    return;
  }

  // 1. Initialize Scan record in DB
  const scan = await prisma.securityScan.upsert({
    where: { deploymentId },
    create: {
      deploymentId,
      applicationId: deployment.applicationId,
      status: "running",
      startedAt: new Date(),
    },
    update: {
      status: "running",
      startedAt: new Date(),
      completedAt: null,
    },
  });

  // Clear previous findings if this deployment is re-scanned
  await prisma.securityFinding.deleteMany({
    where: { scanId: scan.id },
  });

  // 2. Execute checks in parallel using Promise.allSettled
  const results = await Promise.allSettled([
    checkLeakedApiKeys(appUrl),
    checkCors(appUrl),
    checkSecurityHeaders(appUrl),
    checkExposedConfigFiles(appUrl),
  ]);

  const allFindings: FindingCandidate[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allFindings.push(...result.value);
    }
  }

  // 3. Save findings to DB
  for (const finding of allFindings) {
    await prisma.securityFinding.create({
      data: {
        scanId: scan.id,
        severity: finding.severity,
        code: finding.code,
        message: finding.message,
        recommendation: finding.recommendation,
        filePath: finding.filePath || null,
        lineNumber: finding.lineNumber || null,
      },
    });
  }

  // 4. Finalize Scan
  await prisma.securityScan.update({
    where: { id: scan.id },
    data: {
      status: "completed",
      completedAt: new Date(),
    },
  });

  const criticalCount = allFindings.filter((f) => f.severity === "critical").length;
  if (criticalCount > 0) {
    console.warn(
      `[SecurityScanner] [${deploymentId}] WARNING: ${criticalCount} critical vulnerability finding(s) detected!`
    );
  }

  console.log(
    `[SecurityScanner] [${deploymentId}] Scan completed. Total findings: ${allFindings.length} (${criticalCount} critical).`
  );
}

