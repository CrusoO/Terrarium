import { m365Json } from "./m365.mjs";

const status = await m365Json(["status"]);
const who = status?.connectedAs ?? status?.ConnectedAs ?? "(unknown)";
console.log(`Logged in as ${who}`);
console.log("Listing Microsoft 365 groups you belong to...");

const groups = await m365Json([
  "request",
  "--url",
  "https://graph.microsoft.com/v1.0/me/memberOf/microsoft.graph.group?$select=id,displayName&$top=100",
  "--method",
  "get",
]);

const list = Array.isArray(groups) ? groups : groups?.value ?? [];
if (!list.length) {
  console.log("No groups returned. This Loop workspace may not be an M365 Group.");
  process.exit(1);
}

const names = list
  .map((g) => g.displayName)
  .filter(Boolean)
  .sort((a, b) => a.localeCompare(b));

for (const name of names) console.log(`- ${name}`);
console.log("");
console.log(`Use the workspace name (sidebar), not the page title.`);
console.log(`Example: --ownerGroupName "Terrarium"`);
