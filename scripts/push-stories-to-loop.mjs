import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { m365Json, runM365 } from "./m365.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(root, "docs", "stories.catalog.json");

const args = parseArgs(process.argv.slice(2));
const planName = args.planName ?? process.env.LOOP_PLAN_NAME ?? "JIRA BOARD";
const bucketName = args.bucketName ?? process.env.LOOP_BUCKET_NAME ?? "To do";
const ownerGroupName = args.ownerGroupName ?? process.env.LOOP_GROUP_NAME;
const planIdArg = args.planId ?? process.env.LOOP_PLAN_ID;
const updateExisting = Boolean(args.update);

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const stories = catalog.stories ?? [];

await ensureLoggedIn();
await disablePrompts();

const plan = planIdArg
  ? { id: planIdArg, title: planName }
  : await findPlan(planName, ownerGroupName);
if (!plan) {
  throw new Error(
    `Plan "${planName}" was not found.\n` +
      `Re-run with your Microsoft 365 group/team name:\n` +
      `  node scripts\\push-stories-to-loop.mjs --planName "JIRA BOARD" --bucketName "To do" --ownerGroupName "Your Team Name"`
  );
}

const planId = plan.id ?? plan.Id;
console.log(`Using plan "${plan.title ?? plan.Title ?? planName}" (${planId})`);
console.log(`Listing existing tasks...`);
const existing = await m365Json(["planner", "task", "list", "--planId", planId]);
const tasks = Array.isArray(existing) ? existing : [];

let created = 0;
let updated = 0;
let skipped = 0;

for (const story of stories) {
  const title = `[${story.id}] ${story.title}`;
  const description = storyDescription(story);
  const matches = findTasksByStoryId(tasks, story.id);

  if (matches.length > 0) {
    if (!updateExisting) {
      console.log(`skip  ${title}`);
      skipped += 1;
      continue;
    }
    if (matches.length > 1) {
      console.log(
        `warn  ${title}: ${matches.length} cards share this id; updating all of them`
      );
    }
    for (const task of matches) {
      const taskId = task.id ?? task.Id;
      console.log(`update ${title} (${taskId}) ...`);
      await runM365(
        [
          "planner",
          "task",
          "set",
          "--id",
          taskId,
          "--title",
          title,
          "--description",
          description,
          "--output",
          "json",
        ],
        { timeoutMs: 60_000 }
      );
      updated += 1;
    }
    continue;
  }

  console.log(`create ${title} ...`);
  await runM365([
    "planner",
    "task",
    "add",
    "--planId",
    planId,
    "--bucketName",
    bucketName,
    "--title",
    title,
    "--description",
    description,
    "--appliedCategories",
    `category${story.phase}`,
    "--output",
    "json",
  ]);
  created += 1;
}

console.log(
  `Done. created=${created} updated=${updated} skipped=${skipped} plan="${planName}" bucket="${bucketName}"`
);
console.log("Refresh Microsoft Loop.");
if (!updateExisting && skipped > 0) {
  console.log(
    "Existing cards were left unchanged. Re-run with --update to patch their descriptions in place."
  );
}

function storyDescription(story) {
  return [
    story.goal,
    "",
    `Phase ${story.phase}: ${story.phaseName}`,
    `Packages: ${(story.packages ?? []).join(", ")}`,
    `Depends on: ${(story.dependsOn ?? []).join(", ") || "none"}`,
    "",
    "Acceptance:",
    ...(story.acceptance ?? []).map((line) => `- ${line}`),
    "",
    "Non-goals:",
    ...(story.nonGoals ?? []).map((line) => `- ${line}`),
    "",
    `Source: docs/stories/${story.id}-${story.slug}.md`,
  ].join("\n");
}

function findTasksByStoryId(list, id) {
  const prefix = `[${id}]`;
  return list.filter((task) =>
    String(task.title ?? task.Title ?? "").startsWith(prefix)
  );
}

async function disablePrompts() {
  try {
    await runM365(["cli", "config", "set", "--key", "prompt", "--value", "false"]);
  } catch {
    // older CLI configs may not allow this; continue
  }
}

async function ensureLoggedIn() {
  let status;
  try {
    status = await m365Json(["status"]);
  } catch (error) {
    throw new Error(
      `Could not read Microsoft 365 login status.\n${error.message}\n\nRun:\n  node scripts\\m365-login.mjs`
    );
  }

  const connected =
    status &&
    typeof status === "object" &&
    (status.connectedAs || status.ConnectedAs) &&
    String(status.connectedAs ?? status.ConnectedAs).toLowerCase() !== "disconnected";

  if (connected) {
    console.log(`Logged in as ${status.connectedAs ?? status.ConnectedAs}`);
    return;
  }

  throw new Error(
    'Not logged in. In this same PowerShell window run:\n  node scripts\\m365-login.mjs\nThen re-run the push command.'
  );
}

async function findPlan(name, groupName) {
  console.log("Looking up Loop/Planner lightweight plans (roster plans)...");
  const rosterPlans = await graphGet(
    "https://graph.microsoft.com/beta/me/planner/rosterPlans",
    { prefer: "include-unknown-enum-members" }
  );
  const classicPlans = await graphGet("https://graph.microsoft.com/v1.0/me/planner/plans");
  const all = [...rosterPlans, ...classicPlans];
  const titles = all.map((p) => p.title ?? p.Title).filter(Boolean);
  console.log(`Found ${all.length} plan(s): ${titles.join(", ") || "(none)"}`);

  const hit =
    pickPlan(all, name) ||
    pickPlan(all, "Project Terrarium Playground") ||
    all.find((p) => String(p.title ?? "").toLowerCase().includes("terrarium"));
  if (hit) return hit;

  if (groupName) {
    console.log(`No roster match. Trying M365 group "${groupName}"...`);
    try {
      const plans = await m365Json([
        "planner",
        "plan",
        "list",
        "--ownerGroupName",
        groupName,
      ]);
      return pickPlan(plans, name);
    } catch (error) {
      throw new Error(
        `Loop workspaces are not M365 groups, so "${groupName}" is not a Graph group.\n` +
          `Use the Loop page's Planner plan title, for example:\n` +
          `  node scripts\\push-stories-to-loop.mjs --planName "Project Terrarium Playground" --bucketName "To do" --update\n` +
          `(JIRA BOARD is a heading on the page, not the plan name.)\n` +
          originalError(error)
      );
    }
  }
  return null;
}

function originalError(error) {
  return error instanceof Error ? error.message : String(error);
}

async function graphGet(url, headers = {}) {
  const items = [];
  let next = url;
  while (next) {
    const args = ["request", "--url", next, "--method", "get"];
    if (headers.prefer) args.push("--prefer", headers.prefer);
    const page = await m365Json(args);
    if (Array.isArray(page)) {
      items.push(...page);
      break;
    }
    if (page?.value && Array.isArray(page.value)) items.push(...page.value);
    else if (page && typeof page === "object" && page.id) items.push(page);
    next = page?.["@odata.nextLink"] ?? null;
  }
  return items;
}

function pickPlan(plans, name) {
  const list = Array.isArray(plans) ? plans : [];
  const exact = list.find((p) => (p.title ?? p.Title) === name);
  if (exact) return exact;
  const lower = name.toLowerCase();
  return list.find((p) => String(p.title ?? p.Title ?? "").toLowerCase() === lower) ?? null;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) continue;
    const name = key.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      out[name] = true;
    } else {
      out[name] = next;
      i += 1;
    }
  }
  return out;
}
