import fs from "fs";
import path from "path";
import { ProjectSpec, DatabaseEngineType } from "@ShipLane/shared";

/**
 * Reads a file content safely, returning an empty string if it does not exist or fails to read.
 */
function readFileSafe(filePath: string): string {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf8");
    }
  } catch (error) {
    console.warn(`[AgentDetection] Could not read file ${filePath}:`, error);
  }
  return "";
}

/**
 * Extracts environment variable keys from .env.example or .env files.
 */
function extractExpectedEnvVars(projectDir: string): string[] {
  const envFiles = [".env.example", ".env.sample", ".env.template", ".env"];
  const vars = new Set<string>();

  for (const envFile of envFiles) {
    const fullPath = path.join(projectDir, envFile);
    const content = readFileSafe(fullPath);
    if (content) {
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=/);
          if (match) {
            vars.add(match[1]);
          }
        }
      }
    }
  }

  return Array.from(vars);
}

/**
 * Scans project files to detect database requirements and specific engine.
 */
function detectDatabase(
  projectDir: string,
  pkgJson: any,
  pythonContent: string,
  envVars: string[]
): { needsDatabase: boolean; databaseEngine: DatabaseEngineType | null } {
  // Check Prisma schema
  const prismaPaths = [
    path.join(projectDir, "schema.prisma"),
    path.join(projectDir, "prisma", "schema.prisma"),
  ];

  for (const p of prismaPaths) {
    const prismaContent = readFileSafe(p);
    if (prismaContent) {
      if (/provider\s*=\s*["']postgresql["']/i.test(prismaContent)) {
        return { needsDatabase: true, databaseEngine: "POSTGRES" };
      }
      if (/provider\s*=\s*["']mysql["']/i.test(prismaContent)) {
        return { needsDatabase: true, databaseEngine: "MYSQL" };
      }
      if (/provider\s*=\s*["']sqlite["']/i.test(prismaContent)) {
        return { needsDatabase: true, databaseEngine: "POSTGRES" };
      }
    }
  }

  // Check Knex configuration
  const knexFiles = ["knexfile.js", "knexfile.ts", "knexfile.cjs", "knexfile.json"];
  for (const kf of knexFiles) {
    const knexContent = readFileSafe(path.join(projectDir, kf));
    if (knexContent) {
      if (/client:\s*["'](pg|postgres|postgresql)["']/i.test(knexContent)) {
        return { needsDatabase: true, databaseEngine: "POSTGRES" };
      }
      if (/client:\s*["'](mysql|mysql2)["']/i.test(knexContent)) {
        return { needsDatabase: true, databaseEngine: "MYSQL" };
      }
    }
  }

  // Check Node package dependencies
  if (pkgJson) {
    const allDeps = {
      ...(pkgJson.dependencies || {}),
      ...(pkgJson.devDependencies || {}),
    };

    if (allDeps["pg"] || allDeps["pg-promise"] || allDeps["@prisma/client"]) {
      return { needsDatabase: true, databaseEngine: "POSTGRES" };
    }
    if (allDeps["mysql"] || allDeps["mysql2"]) {
      return { needsDatabase: true, databaseEngine: "MYSQL" };
    }
  }

  // Check Python dependencies
  if (pythonContent) {
    if (
      /psycopg2|asyncpg|dj-database-url/i.test(pythonContent) ||
      pythonContent.includes("postgres")
    ) {
      return { needsDatabase: true, databaseEngine: "POSTGRES" };
    }
    if (/mysqlclient|pymysql/i.test(pythonContent) || pythonContent.includes("mysql")) {
      return { needsDatabase: true, databaseEngine: "MYSQL" };
    }
  }

  // Check expected env vars
  for (const envVar of envVars) {
    const upper = envVar.toUpperCase();
    if (upper.includes("POSTGRES") || upper === "DATABASE_URL") {
      return { needsDatabase: true, databaseEngine: "POSTGRES" };
    }
    if (upper.includes("MYSQL")) {
      return { needsDatabase: true, databaseEngine: "MYSQL" };
    }
  }

  return { needsDatabase: false, databaseEngine: null };
}

/**
 * Scans code files recursively for ephemeral storage writes and unsupported SQLite usage.
 */
function detectHazards(
  projectDir: string,
  pkgJson: any,
  pythonContent: string
): string[] {
  const hazards = new Set<string>();

  // SQLite hazard detection
  let hasSqlite = false;
  if (pkgJson) {
    const allDeps = {
      ...(pkgJson.dependencies || {}),
      ...(pkgJson.devDependencies || {}),
    };
    if (allDeps["sqlite3"] || allDeps["better-sqlite3"] || allDeps["sqlite"]) {
      hasSqlite = true;
    }
  }

  if (pythonContent && /sqlite3/i.test(pythonContent)) {
    hasSqlite = true;
  }

  const prismaContent =
    readFileSafe(path.join(projectDir, "schema.prisma")) ||
    readFileSafe(path.join(projectDir, "prisma", "schema.prisma"));
  if (prismaContent && /provider\s*=\s*["']sqlite["']/i.test(prismaContent)) {
    hasSqlite = true;
  }

  if (hasSqlite) {
    hazards.add(
      "SQLite is not supported for production persistence. Data will be lost on deploy. Use ShipLane's managed Postgres instead."
    );
  }

  // Scan files for local disk writes (fs.writeFile, open('...', 'w'), etc.)
  const ignoredDirs = new Set([
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    ".cache",
    "venv",
    ".venv",
    "__pycache__",
  ]);

  let foundLocalWrite = false;

  function scanDirectory(currentDir: string, depth = 0) {
    if (depth > 4 || foundLocalWrite) return;
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (!ignoredDirs.has(entry.name)) {
            scanDirectory(path.join(currentDir, entry.name), depth + 1);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if ([".js", ".ts", ".jsx", ".tsx", ".py"].includes(ext)) {
            const fileText = readFileSafe(path.join(currentDir, entry.name));

            // Check for Node fs file writes not targeting tmp
            const nodeWriteMatch =
              /fs\.(writeFile|writeFileSync|createWriteStream)\s*\(\s*([^,\)]+)/.exec(
                fileText
              );
            if (nodeWriteMatch) {
              const targetArg = nodeWriteMatch[2];
              if (!targetArg.includes("tmp") && !targetArg.includes("os.tmpdir")) {
                foundLocalWrite = true;
                break;
              }
            }

            // Check for Python write patterns
            const pythonWriteMatch =
              /open\s*\(\s*([^,]+),\s*['"][awx\+]+['"]/.exec(fileText);
            if (pythonWriteMatch) {
              const targetArg = pythonWriteMatch[1];
              if (!targetArg.includes("tmp") && !targetArg.includes("tempfile")) {
                foundLocalWrite = true;
                break;
              }
            }
          }
        }
      }
    } catch {
      // Ignore file access errors during scanning
    }
  }

  scanDirectory(projectDir);

  if (foundLocalWrite) {
    hazards.add(
      "Local disk is ephemeral. Use ShipLane's S3 storage for file uploads."
    );
  }

  return Array.from(hazards);
}

/**
 * Analyzes the project directory to determine runtime, framework, build/start commands,
 * port, database requirements, expected environment variables, and deployment hazards.
 *
 * @param projectDir The root path of the project source.
 * @returns Fully populated ProjectSpec object.
 */
export async function analyzeProject(projectDir: string): Promise<ProjectSpec> {
  try {
    const expectedEnvVars = extractExpectedEnvVars(projectDir);

    // 1. Dockerfile Check
    const dockerfilePath = path.join(projectDir, "Dockerfile");
    if (fs.existsSync(dockerfilePath)) {
      const hazards = detectHazards(projectDir, null, "");
      const { needsDatabase, databaseEngine } = detectDatabase(
        projectDir,
        null,
        "",
        expectedEnvVars
      );

      return {
        runtime: "dockerfile",
        framework: null,
        buildCommand: null,
        startCommand: null,
        port: 80,
        needsDatabase,
        databaseEngine,
        expectedEnvVars,
        hazards,
      };
    }

    // 2. Node.js Check
    const pkgJsonPath = path.join(projectDir, "package.json");
    if (fs.existsSync(pkgJsonPath)) {
      let pkg: any = {};
      try {
        pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
      } catch (err) {
        console.warn(`[AgentDetection] Failed to parse package.json at ${pkgJsonPath}`);
      }

      const allDeps = {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
      };

      const scripts = pkg.scripts || {};
      let framework: string | null = null;
      let port = 3000;
      let buildCommand = scripts.build ? "npm run build" : null;
      let startCommand = scripts.start ? "npm start" : "node index.js";

      if (allDeps["next"]) {
        framework = "nextjs";
        port = 3000;
        buildCommand = scripts.build ? "npm run build" : "next build";
        startCommand = scripts.start ? "npm run start" : "next start";
      } else if (allDeps["express"]) {
        framework = "express";
        port = 3000;
      } else if (allDeps["fastify"]) {
        framework = "fastify";
        port = 3000;
      } else if (allDeps["vite"]) {
        framework = "vite";
        port = 5173;
        buildCommand = scripts.build ? "npm run build" : "vite build";
        startCommand = scripts.start ? "npm run start" : "npx vite preview --host 0.0.0.0 --port 5173";
      } else if (allDeps["react-scripts"]) {
        framework = "react-scripts";
        port = 3000;
        buildCommand = scripts.build ? "npm run build" : "react-scripts build";
        startCommand = scripts.start ? "npm run start" : "react-scripts start";
      }

      const { needsDatabase, databaseEngine } = detectDatabase(
        projectDir,
        pkg,
        "",
        expectedEnvVars
      );
      const hazards = detectHazards(projectDir, pkg, "");

      return {
        runtime: "node",
        framework,
        buildCommand,
        startCommand,
        port,
        needsDatabase,
        databaseEngine,
        expectedEnvVars,
        hazards,
      };
    }

    // 3. Python Check
    const reqTxtPath = path.join(projectDir, "requirements.txt");
    const pipfilePath = path.join(projectDir, "Pipfile");
    const pyprojectPath = path.join(projectDir, "pyproject.toml");

    const hasPythonManifest =
      fs.existsSync(reqTxtPath) ||
      fs.existsSync(pipfilePath) ||
      fs.existsSync(pyprojectPath);

    if (hasPythonManifest) {
      const pythonContent = [
        readFileSafe(reqTxtPath),
        readFileSafe(pipfilePath),
        readFileSafe(pyprojectPath),
      ].join("\n");

      let framework: string | null = null;
      let port = 8000;
      let startCommand = "python main.py";

      if (/fastapi/i.test(pythonContent)) {
        framework = "fastapi";
        port = 8000;
        startCommand = "uvicorn main:app --host 0.0.0.0 --port 8000";
      } else if (/flask/i.test(pythonContent)) {
        framework = "flask";
        port = 8000;
        startCommand = "flask run --host=0.0.0.0 --port=8000";
      } else if (/django/i.test(pythonContent)) {
        framework = "django";
        port = 8000;
        startCommand = "python manage.py runserver 0.0.0.0:8000";
      } else if (fs.existsSync(path.join(projectDir, "app.py"))) {
        startCommand = "python app.py";
      }

      const { needsDatabase, databaseEngine } = detectDatabase(
        projectDir,
        null,
        pythonContent,
        expectedEnvVars
      );
      const hazards = detectHazards(projectDir, null, pythonContent);

      return {
        runtime: "python",
        framework,
        buildCommand: null,
        startCommand,
        port,
        needsDatabase,
        databaseEngine,
        expectedEnvVars,
        hazards,
      };
    }

    // 4. Go Check
    const goModPath = path.join(projectDir, "go.mod");
    if (fs.existsSync(goModPath)) {
      const { needsDatabase, databaseEngine } = detectDatabase(
        projectDir,
        null,
        "",
        expectedEnvVars
      );
      const hazards = detectHazards(projectDir, null, "");

      return {
        runtime: "go",
        framework: null,
        buildCommand: "go build -o app .",
        startCommand: "./app",
        port: 8080,
        needsDatabase,
        databaseEngine,
        expectedEnvVars,
        hazards,
      };
    }

    // 5. Static Check
    const indexPath = path.join(projectDir, "index.html");
    if (fs.existsSync(indexPath)) {
      return {
        runtime: "static",
        framework: null,
        buildCommand: null,
        startCommand: null,
        port: 80,
        needsDatabase: false,
        databaseEngine: null,
        expectedEnvVars,
        hazards: [],
      };
    }

    // Fallback default
    return {
      runtime: "static",
      framework: null,
      buildCommand: null,
      startCommand: null,
      port: 80,
      needsDatabase: false,
      databaseEngine: null,
      expectedEnvVars,
      hazards: [],
    };
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error(`[AgentDetection] Error analyzing project at ${projectDir}:`, err);
    throw new Error(`Failed to analyze project: ${err}`);
  }
}
