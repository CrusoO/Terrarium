const TITLE = {{TITLE_JSON}};
if (!document.title || document.title === "Document") document.title = TITLE;

document.getElementById("contact-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const status = document.getElementById("contact-status");
  if (status) {
    status.hidden = false;
    status.textContent = "Thanks — message captured in this preview.";
  }
});
