#!/usr/bin/env node

/**
 * ShipLane MCP (Model Context Protocol) Server.
 * Exposes core ShipLane deployment & infrastructure operations to AI coding agents over stdio.
 */

const readline = require("readline");
const fs = require("fs");
const path = require("path");
const os = require("os");

const API_BASE = process.env.NEBULA_API_URL || process.env.ShipLane_API_URL || process.env.ANTIDEPLOY_API_URL || "http://localhost:3000/api/v1";

function resolveApiKey() {
  if (process.env.NEBULA_API_KEY) return process.env.NEBULA_API_KEY;
  if (process.env.ShipLane_API_KEY) return process.env.ShipLane_API_KEY;
  if (process.env.ANTIDEPLOY_API_KEY) return process.env.ANTIDEPLOY_API_KEY;

  // Check ~/.nebula/token, ~/.ShipLane/token, or ~/.antideploy/token
  const homeDir = os.homedir();
  for (const dirName of [".nebula", ".ShipLane", ".antideploy"]) {
    const tokenFile = path.join(homeDir, dirName, "token");
    if (fs.existsSync(tokenFile)) {
      return fs.readFileSync(tokenFile, "utf8").trim();
    }
    const configFile = path.join(homeDir, dirName, "config.json");
    if (fs.existsSync(configFile)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(configFile, "utf8"));
        if (parsed.token || parsed.apiKey) return parsed.token || parsed.apiKey;
      } catch {}
    }
  }
  return null;
}

async function apiRequest(endpoint, method = "GET", body = null) {
  const apiKey = resolveApiKey();
  const headers = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  try {
    return { status: response.status, ok: response.ok, data: JSON.parse(text) };
  } catch {
    return { status: response.status, ok: response.ok, raw: text };
  }
}

const TOOLS = [
  {
    name: "list_applications",
    description: "List all deployed applications and their statuses on ShipLane.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "create_application",
    description: "Create a new application on ShipLane.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name of the application" },
        subdomain: { type: "string", description: "Subdomain for the application URL" },
        runtime: { type: "string", description: "Runtime environment (e.g. Node 20, Python 3.12, Dockerfile)" },
        repository: { type: "string", description: "Optional Git repository URL" },
      },
      required: ["name", "subdomain"],
    },
  },
  {
    name: "deploy_application",
    description: "Trigger a deployment for an application.",
    inputSchema: {
      type: "object",
      properties: {
        applicationId: { type: "string", description: "The ID of the application to deploy" },
        env: { type: "object", description: "Optional environment variables for this deployment" },
      },
      required: ["applicationId"],
    },
  },
  {
    name: "get_deployment_status",
    description: "Get the build, release, and health check status of a deployment.",
    inputSchema: {
      type: "object",
      properties: {
        deploymentId: { type: "string", description: "The ID of the deployment" },
      },
      required: ["deploymentId"],
    },
  },
  {
    name: "get_deployment_logs",
    description: "Fetch build and runtime logs for an application or deployment.",
    inputSchema: {
      type: "object",
      properties: {
        applicationId: { type: "string", description: "The ID of the application" },
        limit: { type: "number", description: "Maximum number of log lines (default 100)" },
      },
      required: ["applicationId"],
    },
  },
  {
    name: "provision_database",
    description: "Provision a managed PostgreSQL database with automatic connection string injection.",
    inputSchema: {
      type: "object",
      properties: {
        applicationId: { type: "string", description: "Application ID to bind the database to" },
        engine: { type: "string", description: "Database engine: POSTGRES (default), MYSQL, REDIS, or MONGODB" },
        name: { type: "string", description: "Optional database name" },
      },
      required: ["applicationId"],
    },
  },
  {
    name: "set_secret",
    description: "Set an encrypted environment secret for an application.",
    inputSchema: {
      type: "object",
      properties: {
        applicationId: { type: "string", description: "Application ID" },
        key: { type: "string", description: "Secret variable name (e.g. STRIPE_API_KEY)" },
        value: { type: "string", description: "Secret variable value" },
      },
      required: ["applicationId", "key", "value"],
    },
  },
];

async function handleToolCall(name, args) {
  switch (name) {
    case "list_applications": {
      const res = await apiRequest("/applications");
      return res.data || res.raw;
    }
    case "create_application": {
      const res = await apiRequest("/applications", "POST", args);
      return res.data || res.raw;
    }
    case "deploy_application": {
      const res = await apiRequest("/deploy", "POST", args);
      return res.data || res.raw;
    }
    case "get_deployment_status": {
      const res = await apiRequest(`/deployments/${args.deploymentId}`);
      return res.data || res.raw;
    }
    case "get_deployment_logs": {
      const limit = args.limit || 100;
      const res = await apiRequest(`/logs?applicationId=${encodeURIComponent(args.applicationId)}&limit=${limit}`);
      return res.data || res.raw;
    }
    case "provision_database": {
      const payload = {
        applicationId: args.applicationId,
        engine: args.engine || "POSTGRES",
        name: args.name,
      };
      const res = await apiRequest("/databases", "POST", payload);
      return res.data || res.raw;
    }
    case "set_secret": {
      const payload = {
        applicationId: args.applicationId,
        key: args.key,
        value: args.value,
      };
      const res = await apiRequest("/secrets", "POST", payload);
      return res.data || res.raw;
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// JSON-RPC stdio transport loop
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", async (line) => {
  if (!line.trim()) return;

  let msg;
  try {
    msg = JSON.parse(line);
  } catch (err) {
    return;
  }

  const { id, method, params } = msg;

  if (method === "initialize") {
    const response = {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: "nebula-mcp",
          version: "1.0.0",
        },
      },
    };
    process.stdout.write(JSON.stringify(response) + "\n");
    return;
  }

  if (method === "notifications/initialized") {
    return;
  }

  if (method === "tools/list") {
    const response = {
      jsonrpc: "2.0",
      id,
      result: {
        tools: TOOLS,
      },
    };
    process.stdout.write(JSON.stringify(response) + "\n");
    return;
  }

  if (method === "tools/call") {
    try {
      const toolResult = await handleToolCall(params.name, params.arguments || {});
      const response = {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult, null, 2),
            },
          ],
        },
      };
      process.stdout.write(JSON.stringify(response) + "\n");
    } catch (error) {
      const response = {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32603,
          message: error.message || "Internal error",
        },
      };
      process.stdout.write(JSON.stringify(response) + "\n");
    }
    return;
  }

  if (id !== undefined) {
    const response = {
      jsonrpc: "2.0",
      id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`,
      },
    };
    process.stdout.write(JSON.stringify(response) + "\n");
  }
});
