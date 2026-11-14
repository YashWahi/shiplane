import "dotenv/config";

if (!process.env.MASTER_ENCRYPTION_KEY) {
  process.env.MASTER_ENCRYPTION_KEY =
    "0000000000000000000000000000000000000000000000000000000000000000";
}

import { prisma } from "../apps/dashboard/lib/prisma";
import { generateApiKey } from "../apps/dashboard/lib/crypto";
import { Plan } from "@prisma/client";

async function main() {
  console.log("🌱 [Nebula Seed] Starting database initialization...");

  // 1. Clear existing data gracefully in reverse-dependency order
  console.log("🧹 [Nebula Seed] Clearing existing data...");
  await prisma.securityFinding.deleteMany();
  await prisma.securityScan.deleteMany();
  await prisma.deploymentLog.deleteMany();
  await prisma.deployment.deleteMany();
  await prisma.previewEnvironment.deleteMany();
  await prisma.healthCheck.deleteMany();
  await prisma.cronJob.deleteMany();
  await prisma.domain.deleteMany();
  await prisma.storageBucket.deleteMany();
  await prisma.databaseInstance.deleteMany();
  await prisma.environmentVariable.deleteMany();
  await prisma.application.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.usageEvent.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.accountIdentity.deleteMany();
  await prisma.deviceCode.deleteMany();
  await prisma.account.deleteMany();

  // 2. Create Demo & Developer Accounts
  console.log("👤 [Nebula Seed] Creating demo and developer accounts...");
  const demoAccount = await prisma.account.create({
    data: {
      email: "demo@nebula.local",
      name: "Demo User",
      plan: Plan.PRO,
      status: "active",
    },
  });

  const devAccount = await prisma.account.create({
    data: {
      email: "dev@nebula.local",
      name: "Local Developer",
      plan: Plan.PRO,
      status: "active",
    },
  });

  // 3. Generate and save API Keys
  console.log("🔑 [Nebula Seed] Generating API keys...");
  const demoKey = generateApiKey("neb_live");
  await prisma.apiKey.create({
    data: {
      accountId: demoAccount.id,
      name: "Demo API Key",
      hashedKey: demoKey.hashedKey,
      prefix: demoKey.prefix,
      scopes: "deploy,database,secrets,admin",
    },
  });

  const devKey = generateApiKey("neb_live");
  await prisma.apiKey.create({
    data: {
      accountId: devAccount.id,
      name: "Default Local Development Key",
      hashedKey: devKey.hashedKey,
      prefix: devKey.prefix,
      scopes: "deploy,database,secrets,admin",
    },
  });

  // 4. Create Sample Application for Demo Account
  console.log("🚀 [Nebula Seed] Creating sample application 'demo-app'...");
  const app = await prisma.application.create({
    data: {
      accountId: demoAccount.id,
      name: "demo-app",
      subdomain: "demo",
      sourceType: "archive",
      runtime: "Node 20",
      status: "sleeping",
      scalingEnabled: true,
      minInstances: 0,
      maxInstances: 3,
      currentInstances: 0,
      port: 3000,
    },
  });

  console.log("✅ [Nebula Seed] Sample application ready:", `${app.name} (${app.subdomain}.nebula.local)`);
  console.log("");
  console.log("=========================================================================");
  console.log(`🔑 DEMO API KEY: ${demoKey.rawKey}`);
  console.log(`🔑 DEV API KEY:  ${devKey.rawKey}`);
  console.log("=========================================================================");
  console.log("Use this Bearer token in the 'Authorization: Bearer <key>' header");
  console.log("for curl, Postman, or autonomous AI coding agents.");
  console.log("=========================================================================");
  console.log("");
}

main()
  .catch((err) => {
    console.error("❌ [ShipLane Seed] Error during database seeding:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
