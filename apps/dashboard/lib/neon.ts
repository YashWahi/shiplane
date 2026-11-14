const NEON_API_BASE = "https://console.neon.tech/api/v2";

export function isNeonConfigured(): boolean {
  return Boolean(process.env.NEON_API_KEY && process.env.NEON_API_KEY.startsWith("napi_"));
}

export interface NeonDatabaseResult {
  projectId: string;
  connectionUri: string;
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

/**
 * Creates a serverless PostgreSQL database project on Neon.
 */
export async function createNeonDatabase(name: string): Promise<NeonDatabaseResult> {
  const apiKey = process.env.NEON_API_KEY;
  const orgId = process.env.NEON_ORG_ID;

  if (!apiKey) {
    throw new Error("NEON_API_KEY is not configured.");
  }

  const cleanName = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .slice(0, 32);

  const payload: any = {
    project: {
      name: `nebula-${cleanName}`,
      ...(orgId ? { org_id: orgId } : {}),
    },
  };

  const response = await fetch(`${NEON_API_BASE}/projects`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Neon] Failed to create project:", response.status, errorText);
    throw new Error(`Neon API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as any;
  const project = data.project;
  const connectionUriObj = data.connection_uris?.[0];

  if (!connectionUriObj) {
    throw new Error("Neon project created, but no connection URI returned.");
  }

  const connectionUri = connectionUriObj.connection_uri;
  const params = connectionUriObj.connection_parameters || {};

  return {
    projectId: project.id,
    connectionUri,
    host: params.host || project.proxy_host,
    port: 5432,
    user: params.role || "neondb_owner",
    password: params.password || "",
    database: params.database || "neondb",
  };
}

/**
 * Deletes a project on Neon.
 */
export async function deleteNeonDatabase(projectId: string): Promise<boolean> {
  const apiKey = process.env.NEON_API_KEY;
  if (!apiKey) return false;

  try {
    const response = await fetch(`${NEON_API_BASE}/projects/${projectId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return response.ok;
  } catch (err) {
    console.error(`[Neon] Failed to delete project ${projectId}:`, err);
    return false;
  }
}
