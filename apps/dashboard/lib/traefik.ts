import fs from "fs";
import path from "path";
import yaml from "js-yaml";

function resolveConfigDir(): string {
  if (process.env.TRAEFIK_CONFIG_PATH) {
    return path.isAbsolute(process.env.TRAEFIK_CONFIG_PATH)
      ? process.env.TRAEFIK_CONFIG_PATH
      : path.resolve(process.cwd(), process.env.TRAEFIK_CONFIG_PATH);
  }

  // Default is '../../infra/traefik/dynamic' relative to apps/dashboard,
  // or 'infra/traefik/dynamic' when running from repository root.
  if (fs.existsSync(path.resolve(process.cwd(), "infra"))) {
    return path.resolve(process.cwd(), "infra/traefik/dynamic");
  }
  return path.resolve(process.cwd(), "../../infra/traefik/dynamic");
}

export const configDir = resolveConfigDir();

// Ensure the Traefik dynamic configuration directory exists on module load
try {
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
} catch (error) {
  console.error(`[Traefik] Failed to initialize dynamic directory ${configDir}:`, error);
}

/**
 * Writes or updates the Traefik dynamic YAML route configuration for an application.
 *
 * @param appId The application identifier.
 * @param subdomain The subdomain prefix.
 * @param containerIp The internal IP address of the container.
 * @param port The internal application port.
 */
export async function writeRouteConfig(
  appId: string,
  subdomain: string,
  containerIp: string,
  port: number
): Promise<void> {
  try {
    const domain = process.env.NEBULA_DOMAIN || "nebula.local";
    const routerName = `app-${appId}`;
    const serviceName = `app-${appId}-service`;
    const useTls = process.env.ENABLE_TLS === "true";

    const config = {
      http: {
        routers: {
          [routerName]: {
            rule: `Host(\`${subdomain}.${domain}\`) || Host(\`${subdomain}.nebula.local\`) || Host(\`${subdomain}.localhost\`)`,
            entryPoints: ["web"],
            service: serviceName,
            ...(useTls
              ? {
                  tls: {
                    certResolver: "letsencrypt",
                  },
                }
              : {}),
          },
        },
        services: {
          [serviceName]: {
            loadBalancer: {
              servers: [
                {
                  url: `http://${containerIp}:${port}`,
                },
              ],
            },
          },
        },
      },
    };

    const yamlStr = yaml.dump(config, { indent: 2, lineWidth: -1 });
    const targetFile = path.join(configDir, `${appId}.yml`);

    await fs.promises.mkdir(configDir, { recursive: true });
    await fs.promises.writeFile(targetFile, yamlStr, "utf8");

    console.log(`[Traefik] Generated route config for ${appId} at ${targetFile}`);
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error(`[Traefik] Failed to write route config for app ${appId}:`, err);
    throw new Error(`Failed to write Traefik route config: ${err}`);
  }
}

/**
 * Writes or updates the Traefik dynamic YAML route configuration for a preview deployment.
 *
 * @param previewId The preview deployment identifier.
 * @param subdomain The preview subdomain prefix.
 * @param containerIp The internal IP address of the container.
 * @param port The internal application port.
 */
export async function writePreviewRouteConfig(
  previewId: string,
  subdomain: string,
  containerIp: string,
  port: number
): Promise<void> {
  try {
    const domain = process.env.NEBULA_DOMAIN || "nebula.local";
    const routerName = `preview-${previewId}`;
    const serviceName = `preview-${previewId}-service`;
    const useTls = process.env.ENABLE_TLS === "true";

    const config = {
      http: {
        routers: {
          [routerName]: {
            rule: `Host(\`${subdomain}.${domain}\`) || Host(\`${subdomain}.nebula.local\`) || Host(\`${subdomain}.localhost\`)`,
            entryPoints: ["web"],
            service: serviceName,
            ...(useTls
              ? {
                  tls: {
                    certResolver: "letsencrypt",
                  },
                }
              : {}),
          },
        },
        services: {
          [serviceName]: {
            loadBalancer: {
              servers: [
                {
                  url: `http://${containerIp}:${port}`,
                },
              ],
            },
          },
        },
      },
    };

    const yamlStr = yaml.dump(config, { indent: 2, lineWidth: -1 });
    const targetFile = path.join(configDir, `preview-${previewId}.yml`);

    await fs.promises.mkdir(configDir, { recursive: true });
    await fs.promises.writeFile(targetFile, yamlStr, "utf8");

    console.log(`[Traefik] Generated preview route config for ${previewId} at ${targetFile}`);
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error(`[Traefik] Failed to write preview route config for ${previewId}:`, err);
    throw new Error(`Failed to write Traefik preview route config: ${err}`);
  }
}

/**
 * Removes the Traefik route configuration file for an application.
 *
 * @param appId The application identifier.
 */
export async function deleteRouteConfig(appId: string): Promise<void> {
  try {
    const targetFile = path.join(configDir, `${appId}.yml`);
    if (fs.existsSync(targetFile)) {
      await fs.promises.unlink(targetFile);
      console.log(`[Traefik] Deleted route config for app ${appId}`);
    }
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error(`[Traefik] Failed to delete route config for app ${appId}:`, err);
    throw new Error(`Failed to delete Traefik route config: ${err}`);
  }
}

/**
 * Removes the Traefik preview route configuration file.
 *
 * @param previewId The preview deployment identifier.
 */
export async function deletePreviewRouteConfig(previewId: string): Promise<void> {
  try {
    const targetFile = path.join(configDir, `preview-${previewId}.yml`);
    if (fs.existsSync(targetFile)) {
      await fs.promises.unlink(targetFile);
      console.log(`[Traefik] Deleted preview route config for ${previewId}`);
    }
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error(`[Traefik] Failed to delete preview route config for ${previewId}:`, err);
    throw new Error(`Failed to delete Traefik preview route config: ${err}`);
  }
}
