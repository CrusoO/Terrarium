const TITLE = {{TITLE_JSON}};
const KEY = "terrarium-list-items";

document.title = TITLE;

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function render() {
  const list = document.getElementById("list");
  if (!list) return;
  const items = load();
  list.innerHTML = items.length
    ? items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
    : "<li>No items yet.</li>";
}

document.getElementById("form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.getElementById("title");
  const value = input?.value?.trim();
  if (!value) return;
  const items = load();
  items.push(value);
  localStorage.setItem(KEY, JSON.stringify(items));
  if (input) input.value = "";
  render();
});

render();
