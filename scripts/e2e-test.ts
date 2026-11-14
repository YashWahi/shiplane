import fs from "fs";
import path from "path";
import readline from "readline";
import * as tar from "tar";
import { prisma } from "../apps/dashboard/lib/prisma";

// ANSI color codes
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

const BASE_URL = process.env.NEBULA_API_BASE_URL || process.env.ShipLane_API_BASE_URL || "http://localhost:3000/api/v1";
const INGRESS_URL = process.env.NEBULA_INGRESS_URL || "http://127.0.0.1:8081";

async function resolveApiKey(): Promise<string> {
  const envKey = process.env.NEBULA_API_KEY || process.env.ShipLane_API_KEY;
  if (envKey && envKey.trim().startsWith("neb_live_")) {
    return envKey.trim();
  }

  // Attempt automatic resolution from database
  try {
    const key = await prisma.apiKey.findFirst({
      where: { revokedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (key) {
      console.log(`${CYAN}ℹ️  Using auto-detected database API key prefix: ${key.prefix}...${RESET}`);
    }
  } catch {}

  // If interactive terminal, prompt
  if (process.stdin.isTTY) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    return new Promise((resolve) => {
      rl.question(
        `\n${YELLOW}🔑 Please enter your NEBULA_API_KEY (neb_live_...): ${RESET}`,
        (answer) => {
          rl.close();
          resolve(answer.trim());
        }
      );
    });
  }

  return "";
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeFetch(url: string, options?: RequestInit) {
  try {
    return await fetch(url, options);
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === "ECONNREFUSED" || error.message?.includes("fetch failed")) {
      if (url.includes("localhost:3000")) {
        console.error(
          `\n${RED}❌ Connection refused: Is the dashboard running on port 3000?${RESET}`
        );
        console.error(
          `${YELLOW}👉 Run 'npm run dev:dashboard' in another terminal window.${RESET}\n`
        );
      }
    }
    throw err;
  }
}

async function main() {
  console.log("");
  console.log(`${BOLD}${CYAN}=========================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}🚀 Nebula END-TO-END DEPLOYMENT TEST${RESET}`);
  console.log(`${BOLD}${CYAN}=========================================================================${RESET}`);
  console.log("");

  // 1. Resolve API Key
  let apiKey = await resolveApiKey();

  if (!apiKey || !apiKey.startsWith("neb_live_")) {
    console.error(
      `\n${RED}❌ Invalid or missing API key. Key must start with 'neb_live_'.${RESET}`
    );
    console.error(
      `${YELLOW}Run 'npm run db:seed' to seed the database and generate a test API key.${RESET}\n`
    );
    process.exit(1);
  }

  console.log(`✅ [E2E] API Key configured: ${apiKey.slice(0, 14)}...`);
  console.log(`📡 [E2E] API Endpoint: ${BASE_URL}`);

  // 2. Fetch Applications to find demo app
  console.log(`\n🔍 [E2E] Fetching application details for subdomain 'demo'...`);
  const appsRes = await safeFetch(`${BASE_URL}/applications`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (appsRes.status === 401) {
    console.error(
      `\n${RED}❌ Unauthorized: The provided API key was rejected by the server.${RESET}`
    );
    process.exit(1);
  }

  if (!appsRes.ok) {
    console.error(`\n${RED}❌ Failed to fetch applications (HTTP ${appsRes.status})${RESET}`);
    process.exit(1);
  }

  const appsData = (await appsRes.json()) as {
    applications?: Array<{ id: string; name: string; subdomain: string }>;
  };
  const applications = appsData.applications || [];
  const demoApp =
    applications.find((app) => app.subdomain === "demo") || applications[0];

  if (!demoApp) {
    console.error(
      `\n${RED}❌ No demo application found.${RESET}`
    );
    process.exit(1);
  }

  console.log(`✅ [E2E] Target app: ${BOLD}${demoApp.name}${RESET} (ID: ${demoApp.id}, Subdomain: ${demoApp.subdomain})`);

  // 3. Package Fixture Archive
  const fixtureDir = path.resolve(__dirname, "fixtures/hello-world");
  if (!fs.existsSync(fixtureDir)) {
    console.error(`\n${RED}❌ Fixture directory not found at: ${fixtureDir}${RESET}`);
    process.exit(1);
  }

  console.log(`\n📦 [E2E] Packaging fixture from ${fixtureDir}...`);
  const archivePath = path.resolve(__dirname, "temp-test-archive.tar.gz");

  const filesToPackage = fs.readdirSync(fixtureDir).filter((f) => f !== "node_modules");

  await tar.c(
    {
      gzip: true,
      file: archivePath,
      cwd: fixtureDir,
    },
    filesToPackage
  );

  const archiveBuffer = fs.readFileSync(archivePath);
  console.log(`✅ [E2E] Archive created (${(archiveBuffer.length / 1024).toFixed(2)} KB)`);

  // 4. Trigger Deployment via POST /api/v1/deploy
  console.log(`\n🚀 [E2E] Triggering deployment via POST /api/v1/deploy...`);
  const formData = new FormData();
  formData.append("applicationId", demoApp.id);
  formData.append("force", "true");
  formData.append(
    "archive",
    new Blob([archiveBuffer], { type: "application/gzip" }),
    "source.tar.gz"
  );
  formData.append(
    "env",
    JSON.stringify({
      NODE_ENV: "production",
      CUSTOM_TEST_VAR: "nebula-e2e-ok",
    })
  );

  const deployRes = await safeFetch(`${BASE_URL}/deploy`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  // Clean up temporary local archive file
  if (fs.existsSync(archivePath)) {
    fs.unlinkSync(archivePath);
  }

  if (!deployRes.ok) {
    const errorText = await deployRes.text();
    console.error(`\n${RED}❌ Deployment request failed (HTTP ${deployRes.status}):${RESET}`, errorText);
    process.exit(1);
  }

  const deployData = (await deployRes.json()) as {
    taskId?: string;
    deploymentId?: string;
    watchUrl?: string;
  };

  const taskId = deployData.taskId || deployData.deploymentId;
  if (!taskId) {
    console.error(`\n${RED}❌ Server did not return a taskId:${RESET}`, deployData);
    process.exit(1);
  }

  console.log(`✅ [E2E] Deployment queued! Task ID: ${BOLD}${taskId}${RESET}`);
  console.log(`👀 [E2E] Watch URL: ${deployData.watchUrl || `/api/v1/deployments/${taskId}`}`);
  console.log(`\n${YELLOW}💡 Note: If steps do not advance, ensure 'npm run dev:workers' is active.${RESET}`);

  // 5. Poll Deployment Status
  console.log(`\n⏳ [E2E] Polling deployment progress...`);
  let pollAttempts = 0;
  const maxAttempts = 60;
  let finalStatus = "QUEUED";

  while (pollAttempts < maxAttempts) {
    await sleep(2000);
    pollAttempts++;

    const pollRes = await safeFetch(`${BASE_URL}/deployments/${taskId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!pollRes.ok) {
      console.warn(`[E2E] Poll check warning (HTTP ${pollRes.status}), retrying...`);
      continue;
    }

    const pollData = (await pollRes.json()) as {
      deployment?: {
        status: string;
        currentStep?: string;
        failedStep?: string;
        errorSummary?: string;
      };
    };

    const dep = pollData.deployment;
    if (!dep) continue;

    finalStatus = dep.status;
    const stepLabel = dep.currentStep || dep.status;

    process.stdout.write(`⏳ [Nebula] Step: ${CYAN}${stepLabel}${RESET} (Status: ${dep.status})\r`);

    if (dep.status === "LIVE") {
      console.log(`\n✅ [Nebula] Deployment reached status: ${GREEN}${BOLD}LIVE${RESET}`);
      break;
    }

    if (dep.status === "FAILED") {
      console.log(`\n\n${RED}❌ Deployment Failed!${RESET}`);
      console.error(`${RED}Failed Step : ${dep.failedStep || "UNKNOWN"}${RESET}`);
      console.error(`${RED}Error Details: ${dep.errorSummary || "No detailed message provided"}${RESET}`);
      process.exit(1);
    }
  }

  if (finalStatus !== "LIVE") {
    console.error(`\n${RED}❌ Deployment timed out after ${maxAttempts * 2} seconds without reaching LIVE status.${RESET}`);
    console.error(`${YELLOW}Is the build worker running? ('npm run dev:workers')${RESET}`);
    process.exit(1);
  }

  // 6. Verify the Live App via Traefik
  console.log(`\n🌐 [E2E] Verifying live HTTP response from Traefik at ${INGRESS_URL}...`);

  let routedSuccess = false;
  let responseText = "";

  for (let i = 1; i <= 6; i++) {
    try {
      await sleep(1500);
      const appRes = await safeFetch(INGRESS_URL, {
        headers: {
          Host: `${demoApp.subdomain}.nebula.local`,
        },
      });

      if (appRes && appRes.ok) {
        responseText = await appRes.text();
        if (responseText.includes("Hello from Nebula") || responseText.includes("Hello from ShipLane")) {
          routedSuccess = true;
          break;
        }
      }
    } catch {}
  }

  if (routedSuccess) {
    console.log("");
    console.log(`${BOLD}${GREEN}=========================================================================${RESET}`);
    console.log(`${BOLD}${GREEN}🎉 ✅ SUCCESS: App is live and routed correctly!${RESET}`);
    console.log(`${BOLD}${GREEN}=========================================================================${RESET}`);
    console.log(`Response received from ${CYAN}${INGRESS_URL} (Host: ${demoApp.subdomain}.nebula.local)${RESET}:`);
    console.log(`${BOLD}"${responseText.trim()}"${RESET}`);
    console.log(`${BOLD}${GREEN}=========================================================================${RESET}`);
    console.log("");
  } else {
    console.warn(`\n${YELLOW}⚠️  Could not verify response directly via ${INGRESS_URL}.${RESET}`);
    console.warn(`${YELLOW}👉 Ensure Traefik container is running ('npm run infra:up').${RESET}\n`);
  }
}

main()
  .catch((err) => {
    console.error(`\n${RED}❌ Unexpected test error:${RESET}`, err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
