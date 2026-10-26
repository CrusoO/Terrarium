"""Three fictional Brownie source projects that are published to a user's dashboard.

Each project is a complete, runnable app. Brownie catalog assets point at real
files inside these projects. When the user accepts an asset, the worker copies
those exact files from the user's published dashboard version into the new
build. Organizations, people, and data here are fictional demo content.
"""

from __future__ import annotations

import json
from dataclasses import dataclass

from terrarium_agents.stacks import angular_files

FileMap = dict[str, str]


@dataclass(frozen=True)
class BrownieProject:
    key: str
    slug: str
    name: str
    organization: str
    version: str
    stack: str
    summary: str
    files: FileMap


@dataclass(frozen=True)
class BrownieAsset:
    asset_id: str
    name: str
    version: str
    project_key: str
    source_root: str
    files: tuple[str, ...]
    api: str
    depends_on: tuple[str, ...] = ()
    reusable: bool = True
    gate_reason: str = ""


def _vite_package(name: str, version: str) -> str:
    return json.dumps(
        {
            "name": name,
            "private": True,
            "version": version,
            "type": "module",
            "scripts": {"dev": "vite --host 0.0.0.0", "build": "vite build", "preview": "vite preview --host 0.0.0.0"},
            "dependencies": {
                "@vitejs/plugin-react": "^latest",
                "vite": "^latest",
                "react": "^latest",
                "react-dom": "^latest",
            },
        },
        indent=2,
    )


def _vite_config(proxy: bool) -> str:
    server = (
        "  server: { host: '0.0.0.0', proxy: { '/api': 'http://127.0.0.1:3000' } },\n"
        if proxy
        else "  server: { host: '0.0.0.0' },\n"
    )
    return (
        "import { defineConfig } from 'vite';\n"
        "import react from '@vitejs/plugin-react';\n\n"
        "export default defineConfig({\n"
        "  plugins: [react()],\n"
        f"{server}"
        "});\n"
    )


def _index_html(title: str) -> str:
    return (
        "<!doctype html>\n<html lang=\"en\">\n<head>\n"
        "  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n"
        f"  <title>{title}</title>\n</head>\n<body>\n"
        "  <div id=\"root\"></div>\n  <script type=\"module\" src=\"/src/main.jsx\"></script>\n"
        "</body>\n</html>\n"
    )


def _header(project: str, version: str) -> str:
    return f"// {project} v{version}. Fictional Brownie demo project.\n"


# Project A: Acme Field Operations, Internal PM (React, frontend only)

_A_NAME = "Acme Field Operations · Internal PM"
_A_VERSION = "2.3.1"
_A_HEAD = _header(_A_NAME, _A_VERSION)

_A_AUTH = _A_HEAD + """import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import "./auth.css";

const STORAGE_KEY = "acme.pm.auth.user";
const AuthContext = createContext(null);

function readStoredUser(users) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : null;
    return stored ? users.find((candidate) => candidate.id === stored.id) ?? null : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ users, children }) {
  const [user, setUser] = useState(() => readStoredUser(users));

  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: user.id }));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage can be unavailable in private browsing; the session stays in memory.
    }
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      users,
      signIn: (userId) => setUser(users.find((candidate) => candidate.id === userId) ?? null),
      signOut: () => setUser(null),
      hasRole: (...roles) => Boolean(user && roles.includes(user.role)),
    }),
    [user, users],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>.");
  return value;
}

export function SignInPanel({ title = "Sign in", subtitle = "Choose a demo account." }) {
  const { users, signIn } = useAuth();
  return (
    <section className="auth-signin" aria-label={title}>
      <h1 className="auth-signin__title">{title}</h1>
      <p className="auth-signin__role">{subtitle}</p>
      {users.map((candidate) => (
        <button key={candidate.id} type="button" className="auth-signin__user" onClick={() => signIn(candidate.id)}>
          <span>{candidate.name}</span>
          <span className="auth-signin__role">{candidate.role}</span>
        </button>
      ))}
    </section>
  );
}
"""

_A_AUTH_CSS = """/* Acme Field Operations · Internal PM v2.3.1. Fictional Brownie demo project. */
.auth-signin { max-width: 380px; margin: 12vh auto; background: #ffffff; border: 1px solid #e5e5ea; border-radius: 16px; padding: 24px; display: grid; gap: 10px; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
.auth-signin__title { margin: 0 0 6px; font-size: 18px; }
.auth-signin__user { display: flex; justify-content: space-between; align-items: center; gap: 12px; border: 1px solid #e5e5ea; background: transparent; border-radius: 10px; padding: 10px 12px; font: inherit; cursor: pointer; text-align: left; }
.auth-signin__user:hover { border-color: #6e1429; }
.auth-signin__role { font-size: 12px; color: #6e6e73; }
"""

_A_ROLE_GUARD = _A_HEAD + """import { useAuth } from "./AuthContext.jsx";

export function RoleGuard({ allow, children, fallback = null }) {
  const { hasRole } = useAuth();
  return hasRole(...allow) ? children : fallback;
}

export function useRoleGuard(allow) {
  const { hasRole } = useAuth();
  return hasRole(...allow);
}
"""

_A_DASHBOARD = _A_HEAD + """import React from "react";
import "./dashboard.css";

export function DashboardShell({ brand, title, subtitle, nav = [], activeNav, onNavigate, actions, children }) {
  return (
    <div className="dash-shell">
      <nav className="dash-shell__nav" aria-label="Main">
        {brand ? <div className="dash-shell__brand">{brand}</div> : null}
        {nav.map((item) => (
          <button
            key={item.id}
            type="button"
            className="dash-shell__navitem"
            aria-current={item.id === activeNav ? "page" : undefined}
            onClick={() => onNavigate?.(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="dash-shell__main">
        <header className="dash-shell__header">
          <div>
            <h1 className="dash-shell__title">{title}</h1>
            {subtitle ? <p className="dash-shell__subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div>{actions}</div> : null}
        </header>
        <main className="dash-shell__content">{children}</main>
      </div>
    </div>
  );
}

export function MetricGrid({ children }) {
  return <div className="dash-metrics">{children}</div>;
}

export function MetricCard({ label, value, hint, tone = "neutral" }) {
  return (
    <div className={`dash-metric dash-metric--${tone}`}>
      <div className="dash-metric__label">{label}</div>
      <div className="dash-metric__value">{value}</div>
      {hint ? <div className="dash-metric__hint">{hint}</div> : null}
    </div>
  );
}
"""

_A_DASHBOARD_CSS = """/* Acme Field Operations · Internal PM v2.3.1. Fictional Brownie demo project. */
.dash-shell { display: grid; grid-template-columns: 220px 1fr; min-height: 100vh; background: #f7f7f8; color: #1d1d1f; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
.dash-shell__nav { display: flex; flex-direction: column; gap: 4px; padding: 20px 12px; background: #ffffff; border-right: 1px solid #e5e5ea; }
.dash-shell__brand { font-weight: 700; font-size: 15px; padding: 4px 10px 16px; }
.dash-shell__navitem { text-align: left; border: 0; background: transparent; padding: 9px 10px; border-radius: 8px; font: inherit; color: inherit; cursor: pointer; }
.dash-shell__navitem:hover { background: #f0f0f3; }
.dash-shell__navitem[aria-current="page"] { background: #f3e6ea; color: #6e1429; font-weight: 600; }
.dash-shell__main { display: flex; flex-direction: column; min-width: 0; }
.dash-shell__header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 28px; border-bottom: 1px solid #e5e5ea; background: #ffffff; }
.dash-shell__title { margin: 0; font-size: 20px; }
.dash-shell__subtitle { margin: 2px 0 0; font-size: 13px; color: #6e6e73; }
.dash-shell__content { padding: 24px 28px; display: grid; gap: 20px; }
.dash-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; }
.dash-metric { background: #ffffff; border: 1px solid #e5e5ea; border-radius: 14px; padding: 14px 16px; }
.dash-metric__label { font-size: 12px; color: #6e6e73; }
.dash-metric__value { font-size: 24px; font-weight: 700; margin-top: 4px; }
.dash-metric__hint { font-size: 12px; margin-top: 2px; color: #6e6e73; }
.dash-metric--good .dash-metric__value { color: #1f7a3a; }
.dash-metric--warn .dash-metric__value { color: #a15c00; }
.dash-metric--bad .dash-metric__value { color: #b3261e; }
@media (max-width: 760px) { .dash-shell { grid-template-columns: 1fr; } .dash-shell__nav { flex-direction: row; overflow-x: auto; border-right: 0; border-bottom: 1px solid #e5e5ea; } }
"""

_A_BANNER = _A_HEAD + """// Deprecated in v2.3.0. Known issue: the polling interval is never cleared on unmount.
import React, { useEffect, useState } from "react";

export function NotificationBannerLegacy({ messages }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    setInterval(() => setIndex((value) => (value + 1) % Math.max(messages.length, 1)), 5000);
  }, [messages.length]);
  if (!messages.length) return null;
  return <div className="legacy-banner" role="status">{messages[index]}</div>;
}
"""

_A_DATA = _A_HEAD + """export const users = [
  { id: "u-maya", name: "Maya Chen", role: "admin" },
  { id: "u-luis", name: "Luis Ortega", role: "manager" },
  { id: "u-ada", name: "Ada Brooks", role: "technician" },
];

export const tasks = [
  { id: "T-101", title: "Inspect pump station 4", owner: "Ada Brooks", status: "In progress", due: "Today" },
  { id: "T-102", title: "Replace valve at site 12", owner: "Luis Ortega", status: "Blocked", due: "Tomorrow" },
  { id: "T-103", title: "Quarterly safety walk", owner: "Maya Chen", status: "Done", due: "Mon" },
  { id: "T-104", title: "Calibrate flow meters", owner: "Ada Brooks", status: "Open", due: "Wed" },
];
"""

_A_APP = _A_HEAD + """import React, { useState } from "react";
import { AuthProvider, SignInPanel, useAuth } from "./auth/AuthContext.jsx";
import { RoleGuard } from "./auth/RoleGuard.jsx";
import { DashboardShell, MetricCard, MetricGrid } from "./dashboard/ProjectDashboardShell.jsx";
import { NotificationBannerLegacy } from "./notifications/NotificationBannerLegacy.jsx";
import { tasks, users } from "./data/tasks.js";

const NAV = [
  { id: "board", label: "Work orders" },
  { id: "team", label: "Team" },
];

function Workspace() {
  const { user, users: people, signOut } = useAuth();
  const [view, setView] = useState("board");
  const [items, setItems] = useState(tasks);
  if (!user) return <SignInPanel title="Acme Internal PM" subtitle="Demo accounts only." />;
  const open = items.filter((item) => item.status !== "Done").length;
  const blocked = items.filter((item) => item.status === "Blocked").length;
  return (
    <DashboardShell
      brand="Acme Field Ops"
      title={view === "board" ? "Work orders" : "Team"}
      subtitle={`Signed in as ${user.name} (${user.role})`}
      nav={NAV}
      activeNav={view}
      onNavigate={setView}
      actions={<button type="button" className="pm-button" onClick={signOut}>Sign out</button>}
    >
      <NotificationBannerLegacy messages={["Site 12 access window moved to 9:00."]} />
      <MetricGrid>
        <MetricCard label="Open" value={open} />
        <MetricCard label="Blocked" value={blocked} tone={blocked ? "bad" : "good"} />
        <MetricCard label="Done" value={items.length - open} tone="good" />
      </MetricGrid>
      {view === "board" ? (
        <ul className="pm-list">
          {items.map((item) => (
            <li key={item.id} className="pm-row">
              <span>{item.id} · {item.title}</span>
              <span>{item.owner} · {item.status}</span>
              <RoleGuard allow={["admin", "manager"]}>
                <button
                  type="button"
                  className="pm-button"
                  onClick={() => setItems((all) => all.map((row) => (row.id === item.id ? { ...row, status: "Done" } : row)))}
                >
                  Close
                </button>
              </RoleGuard>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="pm-list">
          {people.map((person) => (
            <li key={person.id} className="pm-row"><span>{person.name}</span><span>{person.role}</span></li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}

export default function App() {
  return (
    <AuthProvider users={users}>
      <Workspace />
    </AuthProvider>
  );
}
"""

_A_MAIN = """import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(<App />);
"""

_A_STYLES = """body { margin: 0; }
.pm-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.pm-row { display: grid; grid-template-columns: 1fr auto auto; gap: 16px; align-items: center; background: #ffffff; border: 1px solid #e5e5ea; border-radius: 12px; padding: 12px 14px; font-size: 14px; }
.pm-button { border: 1px solid #e5e5ea; background: #ffffff; border-radius: 8px; padding: 6px 12px; font: inherit; cursor: pointer; }
.legacy-banner { background: #fff4e5; border: 1px solid #f5c98a; border-radius: 10px; padding: 10px 14px; font-size: 13px; }
"""

PROJECT_A = BrownieProject(
    key="acme-internal-pm",
    slug="acme-internal-pm",
    name=_A_NAME,
    organization="Acme Field Operations",
    version=_A_VERSION,
    stack="React · Vite",
    summary="Fictional Brownie source project. Internal work order tracker with demo sign-in, role checks, and a dashboard shell.",
    files={
        "package.json": _vite_package("acme-internal-pm", _A_VERSION),
        "vite.config.js": _vite_config(proxy=False),
        "index.html": _index_html("Acme Internal PM"),
        "src/main.jsx": _A_MAIN,
        "src/App.jsx": _A_APP,
        "src/styles.css": _A_STYLES,
        "src/data/tasks.js": _A_DATA,
        "src/auth/AuthContext.jsx": _A_AUTH,
        "src/auth/auth.css": _A_AUTH_CSS,
        "src/auth/RoleGuard.jsx": _A_ROLE_GUARD,
        "src/dashboard/ProjectDashboardShell.jsx": _A_DASHBOARD,
        "src/dashboard/dashboard.css": _A_DASHBOARD_CSS,
        "src/notifications/NotificationBannerLegacy.jsx": _A_BANNER,
        "README.md": f"# {_A_NAME}\n\nFictional Brownie demo project. Demo accounts and data only.\n",
    },
)


# Project B: Northstar Retail Labs, Commerce (React + Express, full stack)

_B_NAME = "Northstar Retail Labs · Commerce"
_B_VERSION = "3.4.2"
_B_HEAD = _header(_B_NAME, _B_VERSION)

_B_PRODUCT_CARD = _B_HEAD + """import React from "react";
import "./productCard.css";

export function formatPrice(amount, currency = "USD") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
}

export function ProductCard({ product, selected = false, onSelect, onAdd }) {
  const outOfStock = typeof product.stock === "number" && product.stock <= 0;
  return (
    <article className="product-card" aria-pressed={selected} onClick={() => onSelect?.(product)}>
      <div className="product-card__image">
        {product.image ? <img src={product.image} alt="" /> : <span aria-hidden="true">{product.emoji ?? "🛍️"}</span>}
      </div>
      <div className="product-card__name">{product.name}</div>
      <div className="product-card__meta">
        <strong>{formatPrice(product.price, product.currency)}</strong>
        {product.badge ? <span className="product-card__badge">{product.badge}</span> : null}
      </div>
      {onAdd ? (
        <button
          type="button"
          className="product-card__add"
          disabled={outOfStock}
          onClick={(event) => {
            event.stopPropagation();
            onAdd(product);
          }}
        >
          {outOfStock ? "Out of stock" : "Add to cart"}
        </button>
      ) : null}
    </article>
  );
}
"""

_B_PRODUCT_CARD_CSS = """/* Northstar Retail Labs · Commerce v3.4.2. Fictional Brownie demo project. */
.product-card { display: grid; gap: 8px; background: #ffffff; border: 1px solid #e5e5ea; border-radius: 14px; padding: 14px; cursor: pointer; text-align: left; font: inherit; color: inherit; }
.product-card[aria-pressed="true"] { border-color: #0f4c81; box-shadow: 0 0 0 2px #dbe8f5; }
.product-card__image { aspect-ratio: 4 / 3; border-radius: 10px; background: #f0f0f3; display: grid; place-items: center; font-size: 28px; overflow: hidden; }
.product-card__image img { width: 100%; height: 100%; object-fit: cover; }
.product-card__name { font-weight: 600; }
.product-card__meta { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
.product-card__badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #dbe8f5; color: #0f4c81; }
.product-card__add { border: 0; border-radius: 8px; padding: 8px 10px; background: #0f4c81; color: #ffffff; font: inherit; cursor: pointer; }
.product-card__add:disabled { opacity: 0.5; cursor: not-allowed; }
"""

_B_NOTIFICATIONS = _B_HEAD + """import { useSyncExternalStore } from "react";

export function createNotificationService() {
  let items = [];
  let audit = [];
  const listeners = new Set();
  const emit = () => listeners.forEach((listener) => listener());

  return {
    notify({ title, body = "", level = "info", channel = "in-app" }) {
      const id = `ntf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      const at = new Date().toISOString();
      items = [{ id, title, body, level, channel, at, read: false }, ...items];
      audit = [{ id, at, action: "delivered", channel, detail: `${title} (simulated delivery)` }, ...audit];
      emit();
      return id;
    },
    markRead(id) {
      items = items.map((item) => (item.id === id ? { ...item, read: true } : item));
      emit();
    },
    dismiss(id) {
      items = items.filter((item) => item.id !== id);
      audit = [{ id, at: new Date().toISOString(), action: "dismissed", channel: "in-app", detail: "Dismissed by user" }, ...audit];
      emit();
    },
    list: () => items,
    auditLog: () => audit,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const notificationService = createNotificationService();

export function useNotifications(service = notificationService) {
  const items = useSyncExternalStore(service.subscribe, service.list, service.list);
  const audit = useSyncExternalStore(service.subscribe, service.auditLog, service.auditLog);
  return {
    items,
    audit,
    unread: items.filter((item) => !item.read).length,
    notify: service.notify,
    markRead: service.markRead,
    dismiss: service.dismiss,
  };
}
"""

_B_APP = _B_HEAD + """import React, { useEffect, useState } from "react";
import { ProductCard, formatPrice } from "./catalog/ProductCard.jsx";
import { useNotifications } from "./services/notificationService.js";

export default function App() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [cart, setCart] = useState([]);
  const { items, unread, notify, markRead } = useNotifications();

  useEffect(() => {
    fetch("/api/products")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then((body) => setProducts(body.products))
      .catch((reason) => setError(String(reason.message || reason)));
  }, []);

  const add = (product) => {
    setCart((all) => [...all, product]);
    notify({ title: `${product.name} added`, level: "success" });
  };
  const total = cart.reduce((sum, product) => sum + product.price, 0);

  return (
    <div className="shop">
      <header className="shop__header">
        <strong>Northstar Commerce</strong>
        <span>{cart.length} in cart · {formatPrice(total)} · {unread} new</span>
      </header>
      {error ? <p className="shop__error">Could not load products: {error}</p> : null}
      <section className="shop__grid">
        {products.map((product) => <ProductCard key={product.id} product={product} onAdd={add} />)}
      </section>
      <aside className="shop__notes">
        {items.slice(0, 4).map((item) => (
          <button key={item.id} type="button" className="shop__note" data-read={item.read} onClick={() => markRead(item.id)}>
            {item.title}
          </button>
        ))}
      </aside>
    </div>
  );
}
"""

_B_MAIN = _A_MAIN

_B_STYLES = """body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background: #f6f8fb; color: #14213d; }
.shop { max-width: 1040px; margin: 0 auto; padding: 24px; display: grid; gap: 18px; }
.shop__header { display: flex; justify-content: space-between; align-items: center; }
.shop__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
.shop__error { color: #b3261e; }
.shop__notes { display: flex; flex-wrap: wrap; gap: 8px; }
.shop__note { border: 1px solid #dbe8f5; background: #ffffff; border-radius: 999px; padding: 6px 12px; font: inherit; font-size: 13px; cursor: pointer; }
.shop__note[data-read="true"] { opacity: 0.55; }
"""

_B_SERVER = _B_HEAD + """import express from "express";
import cors from "cors";
import { productsRouter } from "./routes/products.js";
import { webhooksRouter } from "./routes/webhooks.js";
import { paymentsRouter } from "./routes/payments.draft.js";

const app = express();
app.use(cors());
app.use(express.json({ verify: (req, _res, buffer) => { req.rawBody = buffer.toString("utf8"); } }));
app.use("/api/products", productsRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/payments", paymentsRouter);
app.use((error, _req, res, _next) => {
  console.error("API error", error);
  res.status(500).json({ error: "Internal server error" });
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => console.log(`Northstar API on ${port}`));
"""

_B_PRODUCTS_DATA = _B_HEAD + """export const products = [
  { id: "p-100", name: "Trail Runner Shoe", price: 89, badge: "New", stock: 12, emoji: "👟" },
  { id: "p-101", name: "Insulated Bottle", price: 24, stock: 40, emoji: "🧴" },
  { id: "p-102", name: "Weekender Pack", price: 129, badge: "Best seller", stock: 3, emoji: "🎒" },
  { id: "p-103", name: "Rain Shell", price: 149, stock: 0, emoji: "🧥" },
];
"""

_B_PRODUCTS_ROUTE = _B_HEAD + """import { Router } from "express";
import { products } from "../data/products.js";

export const productsRouter = Router();
productsRouter.get("/", (_req, res) => res.json({ products }));
productsRouter.get("/:id", (req, res) => {
  const product = products.find((item) => item.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  return res.json({ product });
});
"""

_B_VERIFIER = _B_HEAD + """import crypto from "node:crypto";

export function verifySignature(secret = process.env.DEMO_WEBHOOK_SECRET || "demo-secret") {
  return (req, res, next) => {
    const signature = String(req.get("x-northstar-signature") || "");
    const expected = crypto.createHmac("sha256", secret).update(req.rawBody || "").digest("hex");
    const valid =
      signature.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    if (!valid) return res.status(401).json({ error: "Invalid signature" });
    return next();
  };
}
"""

_B_WEBHOOKS_ROUTE = _B_HEAD + """import { Router } from "express";
import { verifySignature } from "../middleware/verifySignature.js";

export const webhooksRouter = Router();
webhooksRouter.post("/orders", verifySignature(), (req, res) => {
  res.status(202).json({ received: true, event: req.body?.type || "unknown" });
});
"""

_B_PAYMENTS_DRAFT = _B_HEAD + """// Draft: pending security review. Charges are simulated and never leave this process.
import { Router } from "express";

export const paymentsRouter = Router();
paymentsRouter.post("/intents", (req, res) => {
  const amount = Number(req.body?.amount || 0);
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: "amount must be positive" });
  return res.status(201).json({ id: `pi_demo_${Date.now()}`, amount, status: "simulated" });
});
"""

PROJECT_B = BrownieProject(
    key="northstar-commerce",
    slug="northstar-commerce",
    name=_B_NAME,
    organization="Northstar Retail Labs",
    version=_B_VERSION,
    stack="React · Vite + Node · Express",
    summary="Fictional Brownie source project. Full-stack storefront with a product API, product cards, notifications, and signed webhooks.",
    files={
        "package.json": json.dumps(
            {
                "name": "northstar-commerce",
                "private": True,
                "version": _B_VERSION,
                "type": "module",
                "scripts": {"dev": "concurrently \"npm --prefix backend run dev\" \"npm --prefix frontend run dev\""},
                "dependencies": {"concurrently": "^latest"},
            },
            indent=2,
        ),
        "frontend/package.json": _vite_package("northstar-commerce-web", _B_VERSION),
        "frontend/vite.config.js": _vite_config(proxy=True),
        "frontend/index.html": _index_html("Northstar Commerce"),
        "frontend/src/main.jsx": _B_MAIN,
        "frontend/src/App.jsx": _B_APP,
        "frontend/src/styles.css": _B_STYLES,
        "frontend/src/catalog/ProductCard.jsx": _B_PRODUCT_CARD,
        "frontend/src/catalog/productCard.css": _B_PRODUCT_CARD_CSS,
        "frontend/src/services/notificationService.js": _B_NOTIFICATIONS,
        "backend/package.json": json.dumps(
            {
                "name": "northstar-commerce-api",
                "private": True,
                "version": _B_VERSION,
                "type": "module",
                "scripts": {"dev": "node src/server.js"},
                "dependencies": {"express": "^latest", "cors": "^latest"},
            },
            indent=2,
        ),
        "backend/src/server.js": _B_SERVER,
        "backend/src/data/products.js": _B_PRODUCTS_DATA,
        "backend/src/routes/products.js": _B_PRODUCTS_ROUTE,
        "backend/src/routes/webhooks.js": _B_WEBHOOKS_ROUTE,
        "backend/src/routes/payments.draft.js": _B_PAYMENTS_DRAFT,
        "backend/src/middleware/verifySignature.js": _B_VERIFIER,
        "backend/.env.example": "PORT=3000\nDEMO_WEBHOOK_SECRET=demo-secret\n",
        "README.md": f"# {_B_NAME}\n\nFictional Brownie demo project. Products and payments are simulated.\n",
    },
)


# Project C: Helio Support Systems, Support Desk (Angular, frontend only)

_C_NAME = "Helio Support Systems · Support Desk"
_C_VERSION = "1.6.0"
_C_HEAD = _header(_C_NAME, _C_VERSION)

_C_TYPES = _C_HEAD + """export type TicketState = 'new' | 'triaged' | 'in_progress' | 'resolved';
export type Priority = 'low' | 'normal' | 'urgent';

export interface Ticket {
  id: string;
  subject: string;
  customer: string;
  priority: Priority;
  state: TicketState;
  skill: string;
  assignee?: string;
}

export interface Agent {
  id: string;
  name: string;
  skills: string[];
  openTickets: number;
}
"""

_C_WORKFLOW = _C_HEAD + """import { Ticket, TicketState } from './ticket';

export const TRANSITIONS: Record<TicketState, TicketState[]> = {
  new: ['triaged'],
  triaged: ['in_progress', 'resolved'],
  in_progress: ['resolved'],
  resolved: [],
};

export function nextStates(state: TicketState): TicketState[] {
  return TRANSITIONS[state];
}

export function advance(ticket: Ticket, to: TicketState): Ticket {
  if (!TRANSITIONS[ticket.state].includes(to)) {
    throw new Error(`Cannot move ${ticket.id} from ${ticket.state} to ${to}`);
  }
  return { ...ticket, state: to };
}
"""

_C_ASSIGNMENT = _C_HEAD + """import { Agent, Ticket } from '../tickets/ticket';

export function assignAgent(ticket: Ticket, agents: Agent[]): Agent | undefined {
  const skilled = agents.filter((agent) => agent.skills.includes(ticket.skill));
  const pool = skilled.length ? skilled : agents;
  return [...pool].sort((a, b) => a.openTickets - b.openTickets)[0];
}
"""

_C_TICKET_CARD = _C_HEAD + """import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ticket, TicketState } from './ticket';
import { nextStates } from './workflow';

@Component({
  standalone: true,
  selector: 'helio-ticket-card',
  imports: [CommonModule],
  template: `
    <article class="ticket" [class.urgent]="ticket.priority === 'urgent'">
      <header><strong>{{ ticket.id }}</strong> · {{ ticket.subject }}</header>
      <p>{{ ticket.customer }} · {{ ticket.state }} · {{ ticket.assignee || 'unassigned' }}</p>
      <button type="button" *ngFor="let state of moves()" (click)="move.emit(state)">{{ state }}</button>
    </article>
  `,
  styles: [`
    .ticket { background: #fff; border: 1px solid #e5e5ea; border-radius: 12px; padding: 12px 14px; display: grid; gap: 6px; }
    .ticket.urgent { border-color: #c2410c; }
    p { margin: 0; font-size: 13px; color: #6e6e73; }
    button { justify-self: start; margin-right: 6px; border: 1px solid #e5e5ea; background: #fff; border-radius: 8px; padding: 4px 10px; cursor: pointer; }
  `],
})
export class TicketCardComponent {
  @Input({ required: true }) ticket!: Ticket;
  @Output() move = new EventEmitter<TicketState>();

  moves(): TicketState[] {
    return nextStates(this.ticket.state);
  }
}
"""

_C_DASHBOARD = _C_HEAD + """import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ticket } from '../tickets/ticket';

@Component({
  standalone: true,
  selector: 'helio-support-dashboard',
  imports: [CommonModule],
  template: `
    <section class="queues">
      <div class="queue" *ngFor="let queue of queues()">
        <span>{{ queue.label }}</span><strong>{{ queue.count }}</strong>
      </div>
    </section>
  `,
  styles: [`
    .queues { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .queue { background: #fff; border: 1px solid #e5e5ea; border-radius: 12px; padding: 12px; display: grid; gap: 4px; font-size: 13px; }
    strong { font-size: 22px; }
  `],
})
export class SupportDashboardComponent {
  @Input() tickets: Ticket[] = [];

  queues(): { label: string; count: number }[] {
    const count = (state: Ticket['state']) => this.tickets.filter((ticket) => ticket.state === state).length;
    return [
      { label: 'New', count: count('new') },
      { label: 'Triaged', count: count('triaged') },
      { label: 'In progress', count: count('in_progress') },
      { label: 'Resolved', count: count('resolved') },
    ];
  }
}
"""

_C_DATA = _C_HEAD + """import { Agent, Ticket } from '../tickets/ticket';

export const AGENTS: Agent[] = [
  { id: 'a-1', name: 'Priya N.', skills: ['billing'], openTickets: 3 },
  { id: 'a-2', name: 'Tom R.', skills: ['hardware', 'billing'], openTickets: 1 },
  { id: 'a-3', name: 'Sara K.', skills: ['accounts'], openTickets: 2 },
];

export const TICKETS: Ticket[] = [
  { id: 'HS-2001', subject: 'Invoice shows wrong tax', customer: 'Blue Fern Cafe', priority: 'urgent', state: 'new', skill: 'billing' },
  { id: 'HS-2002', subject: 'Scanner will not pair', customer: 'Mill Street Books', priority: 'normal', state: 'triaged', skill: 'hardware' },
  { id: 'HS-2003', subject: 'Reset owner password', customer: 'Orchard Dental', priority: 'low', state: 'in_progress', skill: 'accounts' },
];
"""

_C_APP_TS = _C_HEAD + """import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ticket, TicketState } from './tickets/ticket';
import { advance } from './tickets/workflow';
import { TicketCardComponent } from './tickets/ticket-card.component';
import { SupportDashboardComponent } from './dashboards/support-dashboard.component';
import { assignAgent } from './assignment/agent-assignment-rules';
import { AGENTS, TICKETS } from './data/tickets';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [CommonModule, TicketCardComponent, SupportDashboardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'Helio Support Desk';
  tickets: Ticket[] = TICKETS.map((ticket) => ({ ...ticket, assignee: assignAgent(ticket, AGENTS)?.name }));

  move(ticket: Ticket, to: TicketState): void {
    this.tickets = this.tickets.map((item) => (item.id === ticket.id ? advance(item, to) : item));
  }
}
"""

_C_APP_HTML = """<main class="desk">
  <h1>{{ title }}</h1>
  <helio-support-dashboard [tickets]="tickets"></helio-support-dashboard>
  <section class="list">
    <helio-ticket-card *ngFor="let ticket of tickets" [ticket]="ticket" (move)="move(ticket, $event)"></helio-ticket-card>
  </section>
</main>
"""

_C_APP_CSS = """.desk { max-width: 920px; margin: 0 auto; padding: 24px; display: grid; gap: 18px; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
.list { display: grid; gap: 10px; }
"""


def _project_c_files() -> FileMap:
    files = angular_files("Helio Support Desk")
    files["package.json"] = files["package.json"].replace('"terrarium-angular-app"', '"helio-support-desk"').replace(
        '"version": "0.0.0"', f'"version": "{_C_VERSION}"'
    )
    files.update(
        {
            "src/app/app.component.ts": _C_APP_TS,
            "src/app/app.component.html": _C_APP_HTML,
            "src/app/app.component.css": _C_APP_CSS,
            "src/app/tickets/ticket.ts": _C_TYPES,
            "src/app/tickets/workflow.ts": _C_WORKFLOW,
            "src/app/tickets/ticket-card.component.ts": _C_TICKET_CARD,
            "src/app/assignment/agent-assignment-rules.ts": _C_ASSIGNMENT,
            "src/app/dashboards/support-dashboard.component.ts": _C_DASHBOARD,
            "src/app/data/tickets.ts": _C_DATA,
            "README.md": f"# {_C_NAME}\n\nFictional Brownie demo project. Marked private by its owner: Brownie lists it but never copies from it.\n",
        }
    )
    return files


PROJECT_C = BrownieProject(
    key="helio-support-desk",
    slug="helio-support-desk",
    name=_C_NAME,
    organization="Helio Support Systems",
    version=_C_VERSION,
    stack="Angular",
    summary="Fictional Brownie source project. Support ticket desk with a ticket workflow and assignment rules. Marked private: not reusable.",
    files=_project_c_files(),
)


PROJECTS: dict[str, BrownieProject] = {project.key: project for project in (PROJECT_A, PROJECT_B, PROJECT_C)}

_PRIVATE = "Owner marked Helio Support Desk private. Listed for search only; never copied."

ASSETS: dict[str, BrownieAsset] = {
    asset.asset_id: asset
    for asset in (
        BrownieAsset(
            "pm-auth-context",
            "AuthContext",
            "2.3.1",
            PROJECT_A.key,
            "src/",
            ("src/auth/AuthContext.jsx", "src/auth/auth.css"),
            "AuthProvider({ users, children }) where users is [{ id, name, role }]; "
            "useAuth() returns { user, users, signIn(userId), signOut(), hasRole(...roles) }; "
            "SignInPanel({ title, subtitle }) renders demo account buttons.",
        ),
        BrownieAsset(
            "pm-role-guard",
            "RoleGuard",
            "2.1.0",
            PROJECT_A.key,
            "src/",
            ("src/auth/RoleGuard.jsx",),
            "RoleGuard({ allow: string[], children, fallback }) renders children only for those roles; "
            "useRoleGuard(allow) returns a boolean. Requires AuthProvider.",
            depends_on=("pm-auth-context",),
        ),
        BrownieAsset(
            "pm-dashboard-shell",
            "ProjectDashboardShell",
            "1.8.4",
            PROJECT_A.key,
            "src/",
            ("src/dashboard/ProjectDashboardShell.jsx", "src/dashboard/dashboard.css"),
            "DashboardShell({ brand, title, subtitle, nav: [{ id, label }], activeNav, onNavigate(id), actions, children }) "
            "is the page frame with side navigation; MetricGrid({ children }) and "
            "MetricCard({ label, value, hint, tone: 'neutral'|'good'|'warn'|'bad' }) render KPI cards.",
        ),
        BrownieAsset(
            "pm-notification-banner-legacy",
            "NotificationBannerLegacy",
            "0.9.2",
            PROJECT_A.key,
            "src/",
            ("src/notifications/NotificationBannerLegacy.jsx",),
            "NotificationBannerLegacy({ messages }).",
            reusable=False,
            gate_reason="Deprecated: interval is never cleared on unmount.",
        ),
        BrownieAsset(
            "commerce-product-card",
            "ProductCard",
            "3.4.2",
            PROJECT_B.key,
            "frontend/src/",
            ("frontend/src/catalog/ProductCard.jsx", "frontend/src/catalog/productCard.css"),
            "ProductCard({ product: { id, name, price, currency?, badge?, stock?, image?, emoji? }, selected, onSelect(product), onAdd(product) }); "
            "formatPrice(amount, currency).",
        ),
        BrownieAsset(
            "commerce-notification-service",
            "NotificationService",
            "2.5.0",
            PROJECT_B.key,
            "frontend/src/",
            ("frontend/src/services/notificationService.js",),
            "notificationService.notify({ title, body, level: 'info'|'success'|'warning'|'error', channel }) returns an id; "
            "useNotifications() returns { items, audit, unread, notify, markRead(id), dismiss(id) }. "
            "Delivery is simulated in memory.",
        ),
        BrownieAsset(
            "commerce-webhook-verifier",
            "WebhookVerifier",
            "1.2.0",
            PROJECT_B.key,
            "backend/src/",
            ("backend/src/middleware/verifySignature.js",),
            "verifySignature(secret) Express middleware.",
            reusable=False,
            gate_reason="Express middleware; Brownie reuse covers React frontend files only.",
        ),
        BrownieAsset(
            "commerce-payment-api-draft",
            "PaymentAPI",
            "0.4.0-draft",
            PROJECT_B.key,
            "backend/src/",
            ("backend/src/routes/payments.draft.js",),
            "paymentsRouter Express router.",
            reusable=False,
            gate_reason="Draft pending security review.",
        ),
        BrownieAsset(
            "support-ticket-workflow",
            "TicketWorkflow",
            "1.6.0",
            PROJECT_C.key,
            "src/app/",
            ("src/app/tickets/workflow.ts", "src/app/tickets/ticket.ts"),
            "nextStates(state), advance(ticket, to).",
            reusable=False,
            gate_reason=_PRIVATE,
        ),
        BrownieAsset(
            "support-agent-assignment",
            "AgentAssignmentRules",
            "1.3.1",
            PROJECT_C.key,
            "src/app/",
            ("src/app/assignment/agent-assignment-rules.ts",),
            "assignAgent(ticket, agents).",
            reusable=False,
            gate_reason=_PRIVATE,
        ),
        BrownieAsset(
            "support-dashboard-angular",
            "SupportDashboardAngular",
            "1.6.0",
            PROJECT_C.key,
            "src/app/",
            ("src/app/dashboards/support-dashboard.component.ts",),
            "<helio-support-dashboard [tickets]>.",
            reusable=False,
            gate_reason=_PRIVATE,
        ),
        BrownieAsset(
            "support-ticket-card",
            "TicketCard",
            "0.8.0",
            PROJECT_C.key,
            "src/app/",
            ("src/app/tickets/ticket-card.component.ts",),
            "<helio-ticket-card [ticket] (move)>.",
            reusable=False,
            gate_reason=_PRIVATE,
        ),
    )
}


def target_path(asset: BrownieAsset, source: str, backend_stack: str) -> str:
    """Where a reused source file lands in the new build. Relative imports between files of one project keep working."""
    base = "frontend/src" if backend_stack and backend_stack != "none" else "src"
    project = PROJECTS[asset.project_key]
    return f"{base}/reused/{project.slug}/{source[len(asset.source_root):]}"
