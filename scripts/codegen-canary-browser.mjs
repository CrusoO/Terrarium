// Loaded: every route paints and the Vite overlay stays hidden.
// Interaction-validated: filter, open detail, add a row, and no uncaught or console error.
import puppeteer from "../docs/codegen-metrics/browser-cache/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";

const folder = process.argv[2];
const port = Number(process.argv[3] || 4173);
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const shot = process.argv[4] || "";

function ignorable(text, url) {
  const blob = `${text} ${url}`;
  return /favicon/i.test(blob);
}

process.on("unhandledRejection", (error) => {
  console.log(JSON.stringify({ loaded: false, interactionValidated: false, error: String(error) }));
  process.exit(1);
});

const launchStarted = Date.now();
const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"],
});
const browserLaunchMs = Date.now() - launchStarted;
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
page.on("console", (message) => {
  if (message.type() !== "error") return;
  const url = message.location()?.url || "";
  if (!ignorable(message.text(), url)) errors.push(message.text());
});
page.on("response", (response) => {
  if (response.status() < 400) return;
  if (!ignorable("", response.url())) errors.push(`${response.status()} ${response.url()}`);
});

const gotoStarted = Date.now();
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "domcontentloaded", timeout: 20000 });
await page.waitForSelector("[data-route]", { timeout: 15000 });
const firstPaintMs = Date.now() - gotoStarted;
const routes = await page.$$eval("[data-route]", (nodes) => nodes.map((node) => node.getAttribute("data-route")));
const seen = [];
const routeStarted = Date.now();
for (const route of routes) {
  const one = Date.now();
  await page.click(`[data-route="${route}"]`);
  await page.waitForSelector(`[data-route="${route}"]`);
  const overlay = await page.$("vite-error-overlay");
  const text = await page.evaluate(() => document.body.innerText.slice(0, 240));
  seen.push({ route, overlay: Boolean(overlay), text, ms: Date.now() - one });
}
const routesMs = Date.now() - routeStarted;

async function fillControl(input) {
  const kind = await input.evaluate((node) => ({ tag: node.tagName, type: node.type || "text" }));
  if (kind.tag === "SELECT") return;
  const value = kind.type === "number" ? "7"
    : kind.type === "date" ? "2024-07-01"
    : kind.type === "datetime-local" ? "2024-07-01T09:00"
    : kind.type === "time" ? "09:00"
    : kind.type === "month" ? "2024-07"
    : kind.type === "email" ? "canary@terrarium.test"
    : "Canary Row";
  await input.evaluate((node, next) => {
    const proto = node.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
    if (node._valueTracker) node._valueTracker.setValue("");
    setter.call(node, next);
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

let behaviour = {};
let relevance = null;
const interactionStarted = Date.now();
const errorsBefore = errors.length;
try {
  if (routes.includes("list")) await page.click('[data-route="list"]');
  if (shot) await page.screenshot({ path: shot.replace(/\.png$/, "-first.png"), fullPage: false });
  const countCards = () => page.$$eval(".entity-card", (nodes) => nodes.filter((node) => !node.querySelector(".entity-card")).length);
  const before = await countCards();
  const statusButtons = await page.$$(".filter-row button");
  if (statusButtons.length > 1) await statusButtons[1].click();
  await new Promise((resolve) => setTimeout(resolve, 150));
  const filtered = await countCards();
  if (routes.includes("form")) await page.click('[data-route="form"]');
  const inputs = await page.$$("form input, form select, form textarea");
  for (const input of inputs) await fillControl(input);
  const formState = await page.evaluate(() => {
    const form = document.querySelector("form");
    if (!form) return { missing: true };
    const fields = [...form.querySelectorAll("input, select, textarea")].map((node) => ({
      id: node.id,
      type: node.type,
      value: node.value,
      valid: node.checkValidity(),
    }));
    return { valid: form.checkValidity(), fields };
  });
  await page.evaluate(() => {
    const form = document.querySelector("form");
    if (form && form.requestSubmit) form.requestSubmit();
    else if (form) form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (routes.includes("list")) await page.click('[data-route="list"]');
  const reset = await page.$$(".filter-row button");
  if (reset[0]) await reset[0].click();
  const after = await countCards();
  const cards = await page.$$(".entity-card");
  const leaves = [];
  for (const card of cards) {
    if (await card.$(".entity-card")) continue;
    const button = await card.$("button");
    leaves.push(button || card);
  }
  let picked = leaves[leaves.length - 1];
  for (const card of leaves) {
    const text = await card.evaluate((node) => node.innerText);
    if (/Canary Row|canary@terrarium\.test/i.test(text)) picked = card;
  }
  if (picked) await picked.click();
  // Split layouts render the detail pane on the list route. The detail button
  // unmounts that pane, so go back to the list and read the pane itself.
  const split = await page.$(".layout-split");
  if (split && routes.includes("list")) await page.click('[data-route="list"]');
  else if (routes.includes("detail")) await page.click('[data-route="detail"]');
  await new Promise((resolve) => setTimeout(resolve, 150));
  const detail = await page.evaluate(() => {
    const pane = document.querySelector(".split");
    if (pane && pane.lastElementChild && pane.children.length > 1) return pane.lastElementChild.innerText.slice(0, 500);
    return document.body.innerText.slice(0, 500);
  });
  relevance = await page.evaluate(() => {
    const meta = (name) => document.querySelector(`meta[name="${name}"]`)?.content || "";
    const title = meta("blueprint-title");
    const entity = meta("blueprint-entity");
    const fields = meta("blueprint-fields").split(",").map((item) => item.trim()).filter(Boolean);
    const text = document.body.innerText;
    if (!title) return null;
    const generic = /Sample 1|Note 1/i.test(text);
    const titleOk = title.length < 48 && text.includes(title);
    const entityOk = !entity || text.includes(entity);
    const fieldsOk = fields.every((field) => text.toLowerCase().includes(field.toLowerCase()));
    return { titleOk, entityOk, fieldsOk, generic, ok: titleOk && entityOk && fieldsOk && !generic };
  });
  if (shot) await page.screenshot({ path: shot, fullPage: true });
  let totalsChanged = null;
  if (routes.includes("dashboard")) {
    await page.click('[data-route="dashboard"]');
    const totals = await page.evaluate(() => document.body.innerText);
    totalsChanged = totals.includes("Canary") || /\b[1-9]\d*\b/.test(totals);
  }
  behaviour = {
    before,
    filtered,
    filterNarrowed: statusButtons.length > 1 ? filtered < before : null,
    added: after > before,
    after,
    formState,
    detailHasText: /Canary Row|canary@terrarium\.test/i.test(detail),
    totalsChanged,
  };
} catch (error) {
  behaviour = { error: String(error) };
}
const interactionMs = Date.now() - interactionStarted;
const overlay = await page.$("vite-error-overlay");
await browser.close();
const freshErrors = errors.slice(errorsBefore);
const loaded = !overlay && seen.length > 0 && seen.every((item) => !item.overlay) && !errors.some((item) => item.startsWith("TypeError") || item.startsWith("Error"));
const interactionOk = loaded && !behaviour.error && behaviour.added === true && behaviour.detailHasText === true && freshErrors.length === 0 && (behaviour.filterNarrowed === null || behaviour.filterNarrowed === true);
const relevanceOk = relevance === null ? null : relevance.ok === true;
const payload = {
  folder,
  firstPaintMs,
  timing: { browserLaunchMs, firstPaintMs, routesMs, interactionMs },
  routes: seen,
  errors,
  overlay: Boolean(overlay),
  behaviour,
  loaded,
  interactionValidated: interactionOk,
  relevanceOk,
  validated: interactionOk && relevanceOk !== false,
};
console.log(JSON.stringify(payload));
process.exit(loaded ? 0 : 1);
