import { m365Json, runM365 } from "./m365.mjs";

async function hasAppId() {
  try {
    const value = await m365Json(["cli", "config", "get", "--key", "clientId"]);
    if (typeof value === "string" && value.trim()) return true;
    if (value && typeof value === "object") {
      const inner = value.clientId ?? value.value ?? value.Value;
      return Boolean(inner && String(inner).trim());
    }
  } catch {
    // not configured
  }
  return Boolean(process.env.CLIMICROSOFT365_ENTRAAPPID);
}

console.log("");
console.log("You do not type an App ID from Loop.");
console.log("App ID = Application (client) ID of a Microsoft Entra app that this CLI uses to sign in.");
console.log("Tenant  = Directory (tenant) ID of your company Microsoft 365.");
console.log("");

if (!(await hasAppId())) {
  console.log("No Entra app is configured yet. Starting `m365 setup`.");
  console.log("When it asks to create or use an app: choose CREATE A NEW APP.");
  console.log("When it asks permissions: choose the FULL set (needed for Planner/Loop).");
  console.log("Sign in with the same work/school account that can open the Loop board.");
  console.log("An admin may need to click Accept / Consent.");
  console.log("");
  await runM365(["setup"], { inherit: true });
}

console.log("");
console.log("Starting login. A device-code or browser prompt will appear.");
console.log("If it still asks for App ID, press Ctrl+C and run: node scripts\\m365-login.mjs");
console.log("");
await runM365(["login"], { inherit: true });
console.log("");
console.log('Logged in. Next: node scripts\\push-stories-to-loop.mjs --planName "JIRA BOARD" --bucketName "To do"');
