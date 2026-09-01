Vanilla FileMaps for the sandbox. Not a product-page warehouse. Do not scrape HTML.

- **Shell** — `shell/styles.css` tokens (`--bg`, `--ink`, `--accent`, `--muted`, `--surface`, `--line`, `--radius`) plus shared layout classes.
- **Layouts** — empty runnable shapes under `layouts/`: `board`, `form`, `list`, `split`. HTML + JS only; Code Generator injects the shell CSS. `split` is a multi-page site shape (`index.html` / `about.html` / `contact.html` / `js/nav.js`), not two empty cards.
- **Stacks** — `react` and `fullstack` stay as fallback kits for `load_template(stack)`. First-time generate picks a **layout**, not these folders and not a calculator.html / converter.html file.

The overlay model fills the product into the layout slots. Published tools (P4/P5) are the only growing library.
