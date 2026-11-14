import fs from "fs";
import os from "os";
import path from "path";
import * as tar from "tar";
import AdmZip from "adm-zip";

/**
 * Converts a ZIP archive buffer into a gzip-compressed tar archive (.tar.gz) buffer.
 * Automatically unwraps single root folders commonly produced by GitHub/GitLab export downloads.
 */
export async function convertZipToTarGz(zipBuffer: Buffer): Promise<Buffer> {
  const zip = new AdmZip(zipBuffer);
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "nebula-zip-"));
  try {
    zip.extractAllTo(tempDir, true);
    let contentDir = tempDir;
    const items = await fs.promises.readdir(tempDir);
    if (items.length === 1) {
      const singlePath = path.join(tempDir, items[0]);
      const stat = await fs.promises.stat(singlePath);
      if (stat.isDirectory()) {
        contentDir = singlePath;
      }
    }
    const contents = await fs.promises.readdir(contentDir);
    if (contents.length === 0) {
      throw new Error("ZIP archive is empty.");
    }
    const outTar = path.join(tempDir, "archive.tar.gz");
    await tar.c(
      {
        gzip: true,
        file: outTar,
        cwd: contentDir,
      },
      contents
    );
    return await fs.promises.readFile(outTar);
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * Normalizes an uploaded deployment archive to a gzip-compressed tar archive (.tar.gz).
 * Accepts .tar.gz (0x1f, 0x8b) and .zip (0x50, 0x4b).
 */
export async function normalizeDeploymentArchive(buffer: Buffer): Promise<Buffer> {
  if (buffer.length < 2) {
    throw new Error("Archive is empty or invalid.");
  }
  // Gzip magic number (0x1f, 0x8b)
  if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
    return buffer;
  }
  // ZIP magic number ('PK' / 0x50, 0x4b)
  if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
    return await convertZipToTarGz(buffer);
  }
  throw new Error("Unsupported archive format. Please upload a .zip or .tar.gz file.");
}
