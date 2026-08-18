import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(root, "docs", "stories.catalog.json");
const outDir = path.join(root, "docs", "stories");

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const stories = catalog.stories ?? [];
const expected = (catalog.phaseCount ?? 6) * (catalog.storiesPerPhase ?? 4);

if (stories.length !== expected) {
  throw new Error(
    `Catalog must have ${expected} stories (got ${stories.length}). Edit docs/stories.catalog.json.`
  );
}

const ids = new Set();
for (const story of stories) {
  if (ids.has(story.id)) throw new Error(`Duplicate story id: ${story.id}`);
  ids.add(story.id);
  if (!/^P[1-6]-S[1-4]$/.test(story.id)) {
    throw new Error(`Bad story id ${story.id}; expected Pn-Sm`);
  }
}

await mkdir(outDir, { recursive: true });

const keep = new Set();
for (const story of stories) {
  const filename = `${story.id}-${story.slug}.md`;
  keep.add(filename);
  const body = render(story);
  await writeFile(path.join(outDir, filename), body, "utf8");
}

for (const name of await readdir(outDir)) {
  if (name.endsWith(".md") && !keep.has(name)) {
    await unlink(path.join(outDir, name));
  }
}

console.log(`Wrote ${stories.length} stories to docs/stories/`);

function render(story) {
  const list = (items) =>
    (items?.length ? items : ["None"]).map((item) => `- ${item}`).join("\n");
  const csv = (items) => (items?.length ? items.join(", ") : "none");

  return `# ${story.id}: ${story.title}

> Generated from \`docs/stories.catalog.json\`. Do not hand-edit. Run \`node scripts/generate-stories.mjs\`.

- **Phase:** ${story.phase} — ${story.phaseName}
- **Packages:** ${csv(story.packages)}
- **Depends on:** ${csv(story.dependsOn)}
- **Parallel with:** ${csv(story.parallelWith)}

## Goal

${story.goal}

## Contract changes

${list(story.contractChanges)}

## Acceptance criteria

${list(story.acceptance)}

## Non-goals

${list(story.nonGoals)}

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update \`packages/contracts\` first. Do not start work from another story.
`;
}
