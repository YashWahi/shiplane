import { NextResponse } from "next/server";

export async function GET() {
  const contract = {
    name: "ShipLane API",
    version: "1.0.0",
    baseUrl: "https://ShipLane.app/api/v1",
    authentication: {
      type: "Bearer",
      flows: ["device_code", "api_key"],
    },
    workflows: [
      "device_login",
      "create_app",
      "deploy",
      "provision_database",
      "set_secrets",
      "create_preview",
      "enable_scaling",
    ],
    endpoints: [
      {
        method: "POST",
        path: "/device/code",
        description: "Initiate RFC 8628 Device Authorization flow for AI agents and CLI tools.",
        request: {
          contentType: "application/json",
          body: {
            scopes: "string (e.g. deploy,database)",
            client_name: "string (e.g. Antigravity Agent)",
          },
        },
        responses: {
          "200": {
            device_code: "string",
            user_code: "string",
            verification_uri: "string",
            expires_in: 900,
            interval: 5,
          },
          "422": { error: "Validation error" },
        },
      },
      {
        method: "POST",
        path: "/device/token",
        description: "Poll for access token using device_code until approved by the user.",
        request: {
          contentType: "application/json",
          body: {
            device_code: "string",
            client_id: "string?",
          },
        },
        responses: {
          "200": {
            access_token: "string",
            token_type: "Bearer",
            expires_in: 2592000,
          },
          "400": {
            error: "authorization_pending | slow_down | expired_token | access_denied",
          },
        },
      },
      {
        method: "GET",
        path: "/applications",
        description: "List all active applications for the authenticated account.",
        request: {
          headers: { Authorization: "Bearer <token>" },
        },
        responses: {
          "200": {
            applications: [
              {
                id: "string",
                name: "string",
                subdomain: "string",
                url: "string",
                status: "live | sleeping | deploying",
                createdAt: "string",
              },
            ],
          },
          "401": { error: "Missing or invalid token" },
        },
      },
      {
        method: "POST",
        path: "/applications",
        description: "Create a new autonomous application with default subdomain.",
        request: {
          contentType: "application/json",
          headers: { Authorization: "Bearer <token>" },
          body: {
            name: "string",
            subdomain: "string?",
            runtime: "string?",
            repository: "string?",
          },
        },
        responses: {
          "201": {
            id: "string",
            name: "string",
            subdomain: "string",
            url: "string",
            status: "sleeping",
          },
          "409": { error: "Subdomain already taken" },
          "422": { error: "Validation error" },
        },
      },
      {
        method: "GET",
        path: "/applications/:id",
        description: "Get detailed configuration, status, and attached resources for an application.",
        request: {
          headers: { Authorization: "Bearer <token>" },
          params: { id: "string" },
        },
        responses: {
          "200": {
            id: "string",
            name: "string",
            subdomain: "string",
            url: "string",
            status: "string",
            scalingEnabled: "boolean",
            minInstances: "number",
            maxInstances: "number",
            databases: "array",
            secrets: "array",
          },
          "404": { error: "Application not found" },
        },
      },
      {
        method: "PATCH",
        path: "/applications/:id",
        description: "Update application properties, build command, or start command.",
        request: {
          contentType: "application/json",
          headers: { Authorization: "Bearer <token>" },
          params: { id: "string" },
          body: {
            name: "string?",
            buildCommand: "string?",
            startCommand: "string?",
            port: "number?",
          },
        },
        responses: {
          "200": { id: "string", updated: true },
          "403": { error: "Not the resource owner" },
        },
      },
      {
        method: "DELETE",
        path: "/applications/:id",
        description: "Soft-delete application and stop all running container instances.",
        request: {
          headers: { Authorization: "Bearer <token>" },
          params: { id: "string" },
        },
        responses: {
          "200": { success: true, deleted: true },
          "404": { error: "Application not found" },
        },
      },
      {
        method: "POST",
        path: "/deploy",
        description: "Deploy a tar.gz archive to an application.",
        request: {
          contentType: "multipart/form-data",
          headers: { Authorization: "Bearer <token>" },
          fields: ["applicationId", "archive", "env", "force"],
        },
        responses: {
          "202": {
            taskId: "string",
            status: "queued",
            watchUrl: "string",
          },
          "200": {
            status: "unchanged",
            message: "Source hash identical to latest deployment",
          },
          "422": { error: "Invalid archive format (must be .tar.gz)" },
        },
      },
      {
        method: "GET",
        path: "/deployments/:id",
        description: "Poll deployment progress, status, current step, and error diagnostic logs.",
        request: {
          headers: { Authorization: "Bearer <token>" },
          params: { id: "string" },
        },
        responses: {
          "200": {
            id: "string",
            applicationId: "string",
            status: "QUEUED | ANALYZING | BUILDING | RELEASING | HEALTH_CHECK | LIVE | FAILED",
            currentStep: "string?",
            failedStep: "string?",
            errorSummary: "string?",
            url: "string?",
            logs: ["{ timestamp, stream, line }"],
          },
          "404": { error: "Deployment not found" },
        },
      },
      {
        method: "GET",
        path: "/databases",
        description: "List all database instances provisioned for an application.",
        request: {
          headers: { Authorization: "Bearer <token>" },
          query: { applicationId: "string" },
        },
        responses: {
          "200": {
            databases: [
              {
                id: "string",
                engine: "POSTGRES | MYSQL | REDIS | MONGODB",
                status: "PROVISIONING | RUNNING | SLEEPING | STOPPED",
                host: "string",
                port: "number",
                databaseName: "string",
                region: "string",
              },
            ],
          },
        },
      },
      {
        method: "POST",
        path: "/databases",
        description: "Provision an isolated containerized database and auto-inject connection string.",
        request: {
          contentType: "application/json",
          headers: { Authorization: "Bearer <token>" },
          body: {
            applicationId: "string",
            engine: "POSTGRES | MYSQL | REDIS | MONGODB",
          },
        },
        responses: {
          "201": {
            id: "string",
            engine: "POSTGRES | MYSQL | REDIS | MONGODB",
            status: "RUNNING",
            connectionEnvVar: "DATABASE_URL | REDIS_URL | MONGODB_URI",
          },
          "422": { error: "Unsupported database engine" },
        },
      },
      {
        method: "GET",
        path: "/databases/:id",
        description: "Inspect specific database instance status, host, and port.",
        request: {
          headers: { Authorization: "Bearer <token>" },
          params: { id: "string" },
        },
        responses: {
          "200": {
            id: "string",
            engine: "string",
            status: "string",
            host: "string",
            port: "number",
          },
          "404": { error: "Database not found" },
        },
      },
      {
        method: "DELETE",
        path: "/databases/:id",
        description: "Terminate container and permanently remove database instance.",
        request: {
          headers: { Authorization: "Bearer <token>" },
          params: { id: "string" },
        },
        responses: {
          "200": { success: true, deleted: true },
          "404": { error: "Database not found" },
        },
      },
      {
        method: "GET",
        path: "/secrets",
        description: "List environment variable names (values are masked; write-only).",
        request: {
          headers: { Authorization: "Bearer <token>" },
          query: { applicationId: "string" },
        },
        responses: {
          "200": {
            variables: ["string"],
          },
        },
      },
      {
        method: "PUT",
        path: "/secrets",
        description: "Encrypt and set write-only application environment variables via AES-256-GCM.",
        request: {
          contentType: "application/json",
          headers: { Authorization: "Bearer <token>" },
          body: {
            applicationId: "string",
            variables: { KEY: "value" },
          },
        },
        responses: {
          "200": {
            success: true,
            updated: ["string"],
          },
          "422": { error: "Validation error" },
        },
      },
      {
        method: "DELETE",
        path: "/secrets",
        description: "Delete environment variables by key names.",
        request: {
          contentType: "application/json",
          headers: { Authorization: "Bearer <token>" },
          body: {
            applicationId: "string",
            names: ["string"],
          },
        },
        responses: {
          "200": { success: true, deleted: ["string"] },
        },
      },
      {
        method: "GET",
        path: "/previews",
        description: "List active preview environments for an application.",
        request: {
          headers: { Authorization: "Bearer <token>" },
          query: { applicationId: "string" },
        },
        responses: {
          "200": {
            previews: [
              {
                id: "string",
                branch: "string",
                previewUrl: "string",
                status: "CREATING | LIVE | EXPIRED | DESTROYED",
                expiresAt: "string",
              },
            ],
          },
        },
      },
      {
        method: "POST",
        path: "/previews",
        description: "Create an ephemeral preview environment for a Git branch (7-day TTL).",
        request: {
          contentType: "application/json",
          headers: { Authorization: "Bearer <token>" },
          body: {
            applicationId: "string",
            branch: "string",
          },
        },
        responses: {
          "201": {
            id: "string",
            branch: "string",
            previewUrl: "https://pr-*.ShipLane.app",
            status: "CREATING",
            expiresAt: "string",
          },
          "422": { error: "Validation error" },
        },
      },
      {
        method: "GET",
        path: "/previews/:id",
        description: "Get status and URL for a specific preview environment.",
        request: {
          headers: { Authorization: "Bearer <token>" },
          params: { id: "string" },
        },
        responses: {
          "200": {
            id: "string",
            branch: "string",
            previewUrl: "string",
            status: "string",
            expiresAt: "string",
          },
          "404": { error: "Preview not found" },
        },
      },
      {
        method: "DELETE",
        path: "/previews/:id",
        description: "Destroy an ephemeral preview environment and teardown containers.",
        request: {
          headers: { Authorization: "Bearer <token>" },
          params: { id: "string" },
        },
        responses: {
          "200": { success: true, destroyed: true },
        },
      },
      {
        method: "GET",
        path: "/scaling",
        description: "Fetch autoscaling configuration and active replica status.",
        request: {
          headers: { Authorization: "Bearer <token>" },
          query: { applicationId: "string" },
        },
        responses: {
          "200": {
            scalingEnabled: "boolean",
            minInstances: "number",
            maxInstances: "number",
            currentInstances: "number",
          },
        },
      },
      {
        method: "PATCH",
        path: "/scaling",
        description: "Enable or modify autonomous auto-scaling thresholds.",
        request: {
          contentType: "application/json",
          headers: { Authorization: "Bearer <token>" },
          body: {
            applicationId: "string",
            enabled: "boolean",
            minInstances: "number?",
            maxInstances: "number?",
          },
        },
        responses: {
          "200": {
            success: true,
            scalingEnabled: "boolean",
            minInstances: "number",
            maxInstances: "number",
          },
          "422": { error: "Validation error" },
        },
      },
      {
        method: "GET",
        path: "/logs",
        description: "Stream live stdout/stderr logs or inspect historical deployment logs.",
        request: {
          headers: { Authorization: "Bearer <token>" },
          query: {
            applicationId: "string",
            tail: "number?",
            format: "json | text?",
          },
        },
        responses: {
          "200": {
            logs: [
              {
                timestamp: "string",
                stream: "stdout | stderr",
                line: "string",
              },
            ],
          },
        },
      },
      {
        method: "GET",
        path: "/health",
        description: "Retrieve latest container health check probe results and latency.",
        request: {
          headers: { Authorization: "Bearer <token>" },
          query: { applicationId: "string" },
        },
        responses: {
          "200": {
            status: "healthy | degraded | offline",
            responseTimeMs: "number",
            statusCode: "number",
            checkedAt: "string",
          },
        },
      },
      {
        method: "GET",
        path: "/metrics",
        description: "Get runtime CPU, memory, request rates, and concurrency telemetry.",
        request: {
          headers: { Authorization: "Bearer <token>" },
          query: { applicationId: "string" },
        },
        responses: {
          "200": {
            cpuPercent: "number",
            memoryMB: "number",
            requestsPerMinute: "number",
            activeInstances: "number",
          },
        },
      },
      {
        method: "GET",
        path: "/security/scans",
        description: "List container security scan history and CVE finding counts.",
        request: {
          headers: { Authorization: "Bearer <token>" },
          query: { applicationId: "string" },
        },
        responses: {
          "200": {
            scans: [
              {
                id: "string",
                deploymentId: "string",
                status: "running | passed | findings_detected",
                findingsCount: "number",
                createdAt: "string",
              },
            ],
          },
        },
      },
      {
        method: "POST",
        path: "/security/scans",
        description: "Trigger an on-demand container security scan.",
        request: {
          contentType: "application/json",
          headers: { Authorization: "Bearer <token>" },
          body: {
            applicationId: "string",
            deploymentId: "string",
          },
        },
        responses: {
          "202": {
            scanId: "string",
            status: "running",
          },
        },
      },
      {
        method: "GET",
        path: "/security/scans/:id",
        description: "Retrieve granular CVE findings and code remediation recommendations.",
        request: {
          headers: { Authorization: "Bearer <token>" },
          params: { id: "string" },
        },
        responses: {
          "200": {
            id: "string",
            status: "string",
            findings: [
              {
                severity: "HIGH | MEDIUM | LOW",
                code: "string",
                message: "string",
                recommendation: "string",
                filePath: "string?",
                lineNumber: "number?",
              },
            ],
          },
          "404": { error: "Security scan not found" },
        },
      },
      {
        method: "GET",
        path: "/domains",
        description: "List verified custom domains and certificate states.",
        request: {
          headers: { Authorization: "Bearer <token>" },
          query: { applicationId: "string" },
        },
        responses: {
          "200": {
            domains: [
              {
                id: "string",
                hostname: "string",
                verificationState: "verified | pending",
                certificateState: "issued | pending",
              },
            ],
          },
        },
      },
      {
        method: "POST",
        path: "/domains",
        description: "Attach a custom apex or subdomain with automated Let's Encrypt TLS.",
        request: {
          contentType: "application/json",
          headers: { Authorization: "Bearer <token>" },
          body: {
            applicationId: "string",
            hostname: "string",
          },
        },
        responses: {
          "201": {
            id: "string",
            hostname: "string",
            dnsRecord: {
              type: "CNAME",
              name: "string",
              value: "cname.ShipLane.app",
            },
          },
          "409": { error: "Domain already registered" },
        },
      },
      {
        method: "DELETE",
        path: "/domains/:id",
        description: "Detach custom domain and remove edge TLS routes.",
        request: {
          headers: { Authorization: "Bearer <token>" },
          params: { id: "string" },
        },
        responses: {
          "200": { success: true, deleted: true },
        },
      },
    ],
    errors: {
      "401": "Missing or invalid token",
      "403": "Not the resource owner",
      "404": "Unknown resource",
      "409": "Name or subdomain conflict",
      "422": "Validation error",
      "429": "Rate limited",
      "503": "Platform busy",
    },
    features: {
      autoScaling: true,
      multiDatabase: ["POSTGRES", "MYSQL", "REDIS", "MONGODB"],
      previewEnvironments: true,
      writeOnlySecrets: true,
    },
    limits: {
      freePlan: {
        apps: 1,
        databases: 1,
        deploysPerMonth: 30,
      },
      instance: {
        cpu: 1,
        memoryMB: 512,
        maxInstances: 20,
      },
      previewTtlDays: 7,
    },
  };

  return NextResponse.json(contract, { status: 200 });
}
