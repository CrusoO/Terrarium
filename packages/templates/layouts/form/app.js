const TITLE = {{TITLE_JSON}};
document.title = TITLE;

function compute(value) {
  const expr = value.replaceAll("×", "*").replaceAll("÷", "/").replaceAll(",", "").trim();
  if (!expr) return "Result shows here.";
  // ponytail: math-only Function(), not a parser. Upgrade: real expression parser.
  if (!/^[0-9+\-*/().%\s]+$/.test(expr)) return expr;
  try {
    const result = Function(`"use strict"; return (${expr})`)();
    if (typeof result === "number" && Number.isFinite(result)) return String(result);
  } catch {
    /* keep the raw value */
  }
  return expr;
}

document.getElementById("tool-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = document.getElementById("input")?.value?.trim() ?? "";
  const result = document.getElementById("result");
  if (result) result.textContent = compute(value);
});
