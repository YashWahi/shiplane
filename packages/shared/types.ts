export type DatabaseEngineType = "POSTGRES" | "MYSQL" | "REDIS" | "MONGODB";

export interface ProjectSpec {
  runtime: "node" | "python" | "go" | "ruby" | "java" | "static" | "dockerfile" | string;
  framework?: string | null;
  buildCommand?: string | null;
  startCommand?: string | null;
  port: number;
  needsDatabase: boolean;
  databaseEngine?: DatabaseEngineType | null;
  expectedEnvVars: string[];
  hazards: string[];
}

export interface DeployOptions {
  applicationId: string;
  env?: Record<string, string>;
  force?: boolean;
}

export interface ContainerOptions {
  image: string;
  name: string;
  port: number;
  env?: Record<string, string>;
  memoryLimitMB?: number;
  cpuLimit?: number;
  labels?: Record<string, string>;
  network?: string;
}

export interface SecurityFindingResult {
  severity: "critical" | "high" | "medium" | "low" | "info";
  code: string;
  message: string;
  recommendation: string;
  filePath?: string;
  lineNumber?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
