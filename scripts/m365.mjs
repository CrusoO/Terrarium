import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const m365Entry = path.join(
  root,
  "node_modules",
  "@pnp",
  "cli-microsoft365",
  "dist",
  "index.js"
);

const DEFAULT_TIMEOUT_MS = 45_000;

export function runM365(subArgs, { inherit = false, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [m365Entry, ...subArgs], {
      cwd: root,
      shell: false,
      stdio: inherit ? "inherit" : ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        CLIMICROSOFT365_NOUPDATE: "1",
      },
    });
    let stdout = "";
    let stderr = "";
    if (!inherit) {
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        const text = chunk.toString();
        stderr += text;
        process.stderr.write(text);
      });
    }

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(
        new Error(
          `Timed out after ${timeoutMs / 1000}s running: m365 ${subArgs.join(" ")}\n` +
            `If this was a plan lookup, press Ctrl+C and re-run with --ownerGroupName "Your Team Name".`
        )
      );
    }, timeoutMs);

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout);
      else {
        const message = (stderr.trim() || stdout.trim() || `m365 exited ${code}`).trim();
        reject(new Error(message || `m365 exited ${code}`));
      }
    });
  });
}

export async function m365Json(subArgs, options) {
  const stdout = await runM365([...subArgs, "--output", "json"], options);
  const text = stdout.trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Could not parse m365 JSON output:\n${text.slice(0, 500)}`);
  }
}
