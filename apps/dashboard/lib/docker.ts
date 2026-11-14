import Docker from "dockerode";
import * as tar from "tar";
import path from "path";
import { ContainerOptions } from "@ShipLane/shared";

const isWindows = process.platform === "win32";

/**
 * Docker client instance configured for the host system environment.
 */
export const docker = new Docker(
  process.env.DOCKER_HOST
    ? undefined
    : isWindows
      ? { socketPath: "//./pipe/docker_engine" }
      : { socketPath: "/var/run/docker.sock" }
);

export interface ExtendedContainerOptions extends Omit<ContainerOptions, "env"> {
  appId?: string;
  env?: Record<string, string> | string[];
}

/**
 * Ensures an isolated Docker bridge network exists for a given application ID.
 *
 * @param appId The application identifier.
 * @returns The network ID.
 */
export async function ensureNetwork(appId: string): Promise<string> {
  const cleanAppId = appId.toLowerCase();
  const networkName = `nebula-net-${cleanAppId}`;
  try {
    const networks = await docker.listNetworks();
    const existing = networks.find((n) => n.Name === networkName);
    let networkId = existing?.Id;

    if (!networkId) {
      const network = await docker.createNetwork({
        Name: networkName,
        Driver: "bridge",
        CheckDuplicate: true,
        Labels: {
          "nebula.managed": "true",
          "nebula.app.id": appId,
        },
      });
      networkId = network.id;
      console.log(`[Docker] Created bridge network ${networkName} (${networkId})`);
    }

    // Traefik joins each app network so it can reach apps without joining their
    // networks to one another.
    try {
      const proxyContainerName = "nebula-traefik";
      const proxy = docker.getContainer(proxyContainerName);
      const proxyInfo = await proxy.inspect();
      if (!proxyInfo.NetworkSettings?.Networks?.[networkName]) {
        await docker.getNetwork(networkName).connect({ Container: proxyContainerName });
      }
    } catch {
      // Fallback if running under legacy container name
      try {
        const legacyProxy = docker.getContainer("ShipLane-traefik");
        const proxyInfo = await legacyProxy.inspect();
        if (!proxyInfo.NetworkSettings?.Networks?.[networkName]) {
          await docker.getNetwork(networkName).connect({ Container: "ShipLane-traefik" });
        }
      } catch (traefikErr) {
        console.warn(`[Docker] Could not connect Traefik proxy to network ${networkName}:`, traefikErr);
      }
    }

    return networkId;
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error(`[Docker] Failed to ensure network ${networkName}:`, err);
    throw new Error(`Failed to ensure Docker network ${networkName}: ${err}`);
  }
}

/**
 * Builds a Docker image from a context directory using tar stream and tags it.
 *
 * @param contextPath The directory containing Dockerfile and build assets.
 * @param tag The tag for the built image.
 * @param dockerfileName The name of the Dockerfile (defaults to 'Dockerfile').
 * @param logger Optional callback for streaming build log lines.
 */
export async function buildImage(
  contextPath: string,
  tag: string,
  dockerfileName: string = "Dockerfile",
  logger?: (log: string) => void
): Promise<void> {
  const logFn = logger || console.log;

  try {
    logFn(`[Docker] Starting build for image: ${tag} from ${contextPath}`);

    const tarStream = tar.c(
      {
        gzip: false,
        cwd: contextPath,
        filter(entryPath) {
          const normalized = entryPath.replace(/\\/g, "/").replace(/^\.\//, "");
          const segments = normalized.split("/");
          const baseName = segments[segments.length - 1]?.toLowerCase() || "";
          const excludedDirectories = new Set([
            ".git",
            "node_modules",
            ".next",
            "dist",
            "build",
            "coverage",
            ".cache",
          ]);

          if (segments.some((segment) => excludedDirectories.has(segment.toLowerCase()))) {
            return false;
          }
          if (
            (baseName.startsWith(".env.") &&
              ![".env.example", ".env.sample", ".env.template"].includes(baseName)) ||
            [".env", "id_rsa", "id_ed25519", "id_ecdsa", "credentials.json"].includes(baseName) ||
            [".pem", ".key", ".p12", ".pfx"].some((suffix) => baseName.endsWith(suffix))
          ) {
            return false;
          }

          const absoluteContext = path.resolve(contextPath);
          const candidate = path.resolve(absoluteContext, entryPath);
          return (
            candidate === absoluteContext ||
            candidate.startsWith(`${absoluteContext}${path.sep}`)
          );
        },
      },
      ["."]
    );

    const stream = (await docker.buildImage(tarStream as any, {
      t: tag,
      dockerfile: dockerfileName,
    })) as any;

    await new Promise<void>((resolve, reject) => {
      docker.modem.followProgress(
        stream,
        (err, res) => {
          if (err) {
            return reject(err);
          }
          resolve();
        },
        (event) => {
          if (event.error) {
            logFn(`[Docker Build Error] ${event.error}`);
            return reject(new Error(event.error));
          }
          if (event.stream) {
            logFn(event.stream.replace(/\r?\n$/, ""));
          } else if (event.status) {
            logFn(`[Docker Build Status] ${event.status} ${event.progress || ""}`.trim());
          }
        }
      );
    });

    logFn(`[Docker] Successfully built and tagged image: ${tag}`);
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error(`[Docker] Image build failed for ${tag}:`, err);
    throw new Error(`Docker build failed for ${tag}: ${err}`);
  }
}

/**
 * Runs a Docker container with enforced resource limits, networking, and labels.
 *
 * @param options Container configuration options.
 * @returns The container ID.
 */
export async function runContainer(
  options: ExtendedContainerOptions
): Promise<string> {
  try {
    const memoryLimitBytes = (options.memoryLimitMB ?? 512) * 1024 * 1024;
    const nanoCpus = (options.cpuLimit ?? 1) * 1e9;

    let envArray: string[] = [];
    if (Array.isArray(options.env)) {
      envArray = options.env;
    } else if (options.env && typeof options.env === "object") {
      envArray = Object.entries(options.env).map(([k, v]) => `${k}=${v}`);
    }

    const appId = options.appId || options.labels?.["nebula.appId"] || options.labels?.["ShipLane.appId"];
    let networkName = options.network;
    if (!networkName && appId) {
      await ensureNetwork(appId);
      networkName = `nebula-net-${appId.toLowerCase()}`;
    }

    const container = (await docker.createContainer({
      Image: options.image,
      name: options.name,
      Env: envArray,
      Labels: {
        "nebula.managed": "true",
        ...(appId ? { "nebula.app.id": appId } : {}),
        ...(options.labels || {}),
      },
      HostConfig: {
        Memory: memoryLimitBytes,
        MemorySwap: memoryLimitBytes,
        NanoCpus: nanoCpus,
        PidsLimit: 256,
        SecurityOpt: ["no-new-privileges:true"],
        CapAdd: ["CHOWN", "SETUID", "SETGID", "NET_BIND_SERVICE"],
        CapDrop: ["SYS_ADMIN", "NET_ADMIN", "SYS_RAWIO"],
        RestartPolicy: {
          Name: "unless-stopped",
        },
        NetworkMode: networkName || "bridge",
      },
      NetworkingConfig: networkName
        ? {
            EndpointsConfig: {
              [networkName]: {},
            },
          }
        : undefined,
    })) as Docker.Container;

    await container.start();
    console.log(`[Docker] Container ${options.name} (${container.id}) started`);

    return container.id;
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error(`[Docker] Failed to run container ${options.name}:`, err);
    throw new Error(`Failed to run container ${options.name}: ${err}`);
  }
}

/**
 * Stops a container (with a 5-second timeout) and removes it.
 * Ignores errors if the container is already stopped or removed.
 *
 * @param containerId The ID or name of the container to stop and remove.
 */
export async function stopAndRemoveContainer(containerId: string): Promise<void> {
  try {
    const container = docker.getContainer(containerId);

    try {
      await container.stop({ t: 5 });
      console.log(`[Docker] Container ${containerId} stopped`);
    } catch (stopErr: any) {
      // 304: container already stopped; 404: container not found
      if (stopErr.statusCode !== 304 && stopErr.statusCode !== 404) {
        console.warn(`[Docker] Warning while stopping container ${containerId}:`, stopErr.message);
      }
    }

    try {
      await container.remove({ force: true, v: true });
      console.log(`[Docker] Container ${containerId} removed`);
    } catch (removeErr: any) {
      if (removeErr.statusCode !== 404) {
        console.warn(`[Docker] Warning while removing container ${containerId}:`, removeErr.message);
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error(`[Docker] Error in stopAndRemoveContainer for ${containerId}:`, err);
  }
}

/**
 * Fetches one-shot stats from Docker and computes CPU % and memory usage in MB.
 *
 * @param containerId The ID or name of the container.
 * @returns Object with cpuPercent and memoryUsageMB.
 */
export async function getContainerStats(
  containerId: string
): Promise<{ cpuPercent: number; memoryUsageMB: number }> {
  try {
    const container = docker.getContainer(containerId);
    const stats: any = await container.stats({ stream: false });

    let cpuPercent = 0;
    const cpuTotal = stats.cpu_stats?.cpu_usage?.total_usage || 0;
    const preCpuTotal = stats.precpu_stats?.cpu_usage?.total_usage || 0;
    const cpuDelta = cpuTotal - preCpuTotal;

    const sysCpu = stats.cpu_stats?.system_cpu_usage || 0;
    const preSysCpu = stats.precpu_stats?.system_cpu_usage || 0;
    const systemDelta = sysCpu - preSysCpu;

    const onlineCpus =
      stats.cpu_stats?.online_cpus ||
      stats.cpu_stats?.cpu_usage?.percpu_usage?.length ||
      1;

    if (systemDelta > 0 && cpuDelta > 0) {
      cpuPercent = (cpuDelta / systemDelta) * onlineCpus * 100;
    }

    const memoryUsage = stats.memory_stats?.usage || 0;
    const memoryUsageMB = memoryUsage / (1024 * 1024);

    return {
      cpuPercent: Number(cpuPercent.toFixed(2)),
      memoryUsageMB: Number(memoryUsageMB.toFixed(2)),
    };
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error(`[Docker] Failed to get stats for container ${containerId}:`, err);
    throw new Error(`Failed to get container stats for ${containerId}: ${err}`);
  }
}

/**
 * Lists all containers matching a specific Docker label filter.
 *
 * @param label The label string (e.g. 'ShipLane.managed=true' or 'ShipLane.appId=app123').
 * @returns Array of container info objects.
 */
export async function listContainersByLabel(label: string): Promise<Docker.ContainerInfo[]> {
  try {
    const containers = await docker.listContainers({
      all: true,
      filters: {
        label: [label],
      },
    });
    return containers;
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error(`[Docker] Failed to list containers with label ${label}:`, err);
    throw new Error(`Failed to list containers by label ${label}: ${err}`);
  }
}
