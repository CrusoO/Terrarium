"""Runnable multi-stack FileMaps. No CDN. Used when not on the React per-file path."""

from __future__ import annotations

import json
import re
from html import escape

from terrarium_contracts import BackendStack, FileMap, FrontendStack

_ANGULAR_RE = re.compile(r"\bangular\b", re.I)
_SAP_RE = re.compile(r"\b(sapui5|sap\s*ui5|sap\s*fiori|fiori)\b", re.I)
_CAP_RE = re.compile(r"\b(sap\s*cap|odata|cds|cap)\b", re.I)
_FRONTEND_ONLY_RE = re.compile(
    r"\b(frontend[- ]?only|client[- ]?only|browser[- ]?only|no backend|without backend)\b",
    re.I,
)
_BACKEND_PROMPT_RE = re.compile(
    r"\b(auth|logins?|sign[- ]?up|users?|shared|database|db|backend|server|"
    r"api keys?|secrets?|payments?|email|upload|file processing|multi[- ]?user|"
    r"roles?|permissions?|websocket|real[- ]?time|express|node[- ]?express|"
    r"odata|cap|sap\s*cap)\b",
    re.I,
)

FRONTEND_STACKS = frozenset({"vanilla", "react", "angular", "sapui5"})
BACKEND_STACKS = frozenset({"none", "node-express", "sap-cap"})


def infer_frontend_stack(text: str, selected: str | None = None) -> FrontendStack:
    if selected in FRONTEND_STACKS:
        return selected  # type: ignore[return-value]
    if _SAP_RE.search(text):
        return "sapui5"
    if _ANGULAR_RE.search(text):
        return "angular"
    if re.search(r"\b(vanilla|plain html|simple web page)\b", text, re.I):
        return "vanilla"
    if re.search(r"\breact\b", text, re.I):
        return "react"
    return "react"


def infer_backend_stack(
    text: str,
    frontend: FrontendStack,
    selected: str | None = None,
    need: str | None = None,
    default: BackendStack = "none",
) -> BackendStack:
    if need == "no":
        return "none"
    if selected in BACKEND_STACKS:
        return compatible_backend(frontend, selected)  # type: ignore[arg-type]
    if _FRONTEND_ONLY_RE.search(text) or re.search(
        r"\b(just this screen|no server|frontend only)\b", text, re.I
    ):
        return "none"
    if frontend == "sapui5" and _CAP_RE.search(text):
        return "sap-cap"
    if re.search(r"\bsap\s*cap\b", text, re.I):
        return compatible_backend(frontend, "sap-cap")
    if _BACKEND_PROMPT_RE.search(text) or re.search(
        r"\bkeep shared data on a server\b", text, re.I
    ):
        return compatible_backend(frontend, "node-express")
    if need == "yes":
        return compatible_backend(frontend, "node-express")
    return compatible_backend(frontend, default)


def compatible_backend(frontend: FrontendStack, backend: BackendStack) -> BackendStack:
    if backend == "none":
        return "none"
    if frontend == "sapui5":
        return "sap-cap"
    return "node-express"


def uses_react_per_file_path(frontend: FrontendStack, backend: BackendStack) -> bool:
    return frontend in {"vanilla", "react"} and backend == "none"


def prefix_files(files: FileMap, prefix: str) -> FileMap:
    return {f"{prefix}{path}": body for path, body in files.items()}


def modern_css(accent: str = "#2563eb") -> str:
    return (
        ":root { color-scheme: light; --bg: #f4f1ea; --ink: #14151a; --muted: #5c5a55; "
        f"--accent: {accent}; --card: #fffdf8; --line: rgba(20,21,26,.08); "
        "--shadow: 0 18px 50px rgba(20,21,26,.08); --radius: 20px; }\n"
        "* { box-sizing: border-box; }\n"
        "html, body { margin: 0; min-height: 100%; font-family: 'Segoe UI', system-ui, sans-serif; "
        "background: radial-gradient(1200px 600px at 10% -10%, #fff7e6, transparent), "
        "linear-gradient(180deg, #fbf7f0, var(--bg)); color: var(--ink); }\n"
        ".shell { min-height: 100vh; padding: clamp(20px, 4vw, 48px); }\n"
        ".hero, .card, .panel { background: var(--card); border: 1px solid var(--line); "
        "border-radius: var(--radius); box-shadow: var(--shadow); }\n"
        ".hero { padding: clamp(24px, 5vw, 48px); margin-bottom: 22px; }\n"
        ".hero p { margin: 0 0 8px; color: var(--accent); font-weight: 800; letter-spacing: .12em; "
        "text-transform: uppercase; font-size: 12px; }\n"
        ".hero h1 { margin: 0 0 10px; font-size: clamp(32px, 6vw, 56px); letter-spacing: -.04em; }\n"
        ".grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }\n"
        ".card { padding: 20px; min-height: 160px; }\n"
        "button, .btn { border: 0; border-radius: 999px; background: var(--ink); color: #fff; "
        "padding: 12px 18px; font-weight: 700; cursor: pointer; }\n"
        "input, textarea { width: 100%; border: 1px solid var(--line); border-radius: 12px; "
        "padding: 12px 14px; font: inherit; }\n"
        "@media (max-width: 720px) { .shell { padding: 16px; } }\n"
    )


def _title(summary: str, prompt: str) -> str:
    return (summary or prompt or "New tool").strip().split("\n")[0][:80] or "New tool"


def angular_files(title: str, *, with_api: bool = False) -> FileMap:
    safe = escape(title)
    api_bit = (
        "this.http.get<{ items: { id: string; title: string }[] }>('/api/items')"
        ".subscribe((res) => { this.items = res.items; });"
        if with_api
        else "this.items = [{ id: '1', title: 'Ready to customize' }, { id: '2', title: 'Responsive layout' }];"
    )
    http_import = "import { HttpClient } from '@angular/common/http';\n" if with_api else ""
    http_inject = "private http: HttpClient" if with_api else ""
    ng_dev = "ng serve --host 0.0.0.0 --port 5173 --disable-host-check"
    if with_api:
        ng_dev += " --proxy-config proxy.conf.json"
    serve_options: dict[str, object] = {"port": 5173, "host": "0.0.0.0"}
    if with_api:
        serve_options["proxyConfig"] = "proxy.conf.json"
    files: FileMap = {
        "package.json": json.dumps(
            {
                "name": "terrarium-angular-app",
                "private": True,
                "version": "0.0.0",
                "scripts": {"dev": ng_dev},
                "dependencies": {
                    "@angular/common": "19.2.14",
                    "@angular/compiler": "19.2.14",
                    "@angular/core": "19.2.14",
                    "@angular/forms": "19.2.14",
                    "@angular/platform-browser": "19.2.14",
                    "@angular/platform-browser-dynamic": "19.2.14",
                    "@angular/router": "19.2.14",
                    "rxjs": "7.8.2",
                    "tslib": "2.8.1",
                    "zone.js": "0.15.1",
                },
                "devDependencies": {
                    "@angular/build": "19.2.14",
                    "@angular/cli": "19.2.14",
                    "@angular/compiler-cli": "19.2.14",
                    "typescript": "5.6.3",
                },
            },
            indent=2,
        ),
        "angular.json": json.dumps(
            {
                "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
                "version": 1,
                "newProjectRoot": "projects",
                "projects": {
                    "app": {
                        "projectType": "application",
                        "root": "",
                        "sourceRoot": "src",
                        "prefix": "app",
                        "architect": {
                            "build": {
                                "builder": "@angular/build:application",
                                "options": {
                                    "browser": "src/main.ts",
                                    "tsConfig": "tsconfig.app.json",
                                    "assets": ["src/favicon.ico"],
                                    "styles": ["src/styles.css"],
                                },
                            },
                            "serve": {
                                "builder": "@angular/build:dev-server",
                                "options": serve_options,
                            },
                        },
                    }
                },
            },
            indent=2,
        ),
        "tsconfig.json": json.dumps(
            {
                "compilerOptions": {
                    "strict": True,
                    "target": "ES2022",
                    "module": "ES2022",
                    "moduleResolution": "bundler",
                    "experimentalDecorators": True,
                    "skipLibCheck": True,
                }
            },
            indent=2,
        ),
        "tsconfig.app.json": json.dumps(
            {"extends": "./tsconfig.json", "files": ["src/main.ts"], "include": ["src/**/*.ts"]},
            indent=2,
        ),
        "src/index.html": (
            "<!doctype html>\n<html lang=\"en\">\n<head>\n"
            "  <meta charset=\"utf-8\"/>\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>\n"
            f"  <title>{safe}</title>\n</head>\n<body>\n  <app-root></app-root>\n</body>\n</html>\n"
        ),
        "src/main.ts": (
            "import { bootstrapApplication } from '@angular/platform-browser';\n"
            "import { provideHttpClient } from '@angular/common/http';\n"
            "import { AppComponent } from './app/app.component';\n"
            "bootstrapApplication(AppComponent, { providers: [provideHttpClient()] });\n"
        ),
        "src/app/app.component.ts": (
            "import { Component, OnInit } from '@angular/core';\n"
            "import { CommonModule } from '@angular/common';\n"
            f"{http_import}"
            "@Component({ standalone: true, imports: [CommonModule], selector: 'app-root', templateUrl: './app.component.html', styleUrl: './app.component.css' })\n"
            "export class AppComponent implements OnInit {\n"
            f"  title = {json.dumps(title)};\n"
            "  items: { id: string; title: string }[] = [];\n"
            f"  constructor({http_inject}) {{}}\n"
            "  ngOnInit() {\n"
            f"    {api_bit}\n"
            "  }\n"
            "}\n"
        ),
        "src/app/app.component.html": (
            "<main class=\"shell\">\n"
            "  <section class=\"hero\">\n"
            "    <p>Angular</p>\n"
            "    <h1>{{ title }}</h1>\n"
            "    <span>A local Angular scaffold. Framework code is installed in the workspace.</span>\n"
            "  </section>\n"
            "  <section class=\"grid\">\n"
            "    <article class=\"card\" *ngFor=\"let item of items\">\n"
            "      <h2>{{ item.title }}</h2>\n"
            "    </article>\n"
            "  </section>\n"
            "</main>\n"
        ),
        "src/app/app.component.css": "",
        "src/styles.css": modern_css("#c2410c"),
        "README.md": f"# {title}\n\nGenerated Angular frontend. Framework packages are installed locally.\n",
    }
    if with_api:
        files["proxy.conf.json"] = json.dumps(
            {"/api": {"target": "http://127.0.0.1:3000", "secure": False, "changeOrigin": True}},
            indent=2,
        )
    return files


def sapui5_files(title: str, *, with_odata: bool = False) -> FileMap:
    safe = escape(title)
    data_source = (
        """
        "dataSources": {
          "mainService": {
            "uri": "/odata/v4/catalog/",
            "type": "OData",
            "settings": { "odataVersion": "4.0" }
          }
        },
"""
        if with_odata
        else ""
    )
    models = (
        """
        "models": {
          "": { "dataSource": "mainService" }
        },
"""
        if with_odata
        else ""
    )
    catalog_intro = (
        "Items and status from the local SAP CAP OData mock."
        if with_odata
        else "Local SAPUI5 / Fiori catalog. OpenUI5 is served from the sandbox."
    )
    catalog_path = "/Items" if with_odata else "/items"
    ui5_dev = "node odata-proxy.mjs" if with_odata else "ui5 serve --port 5173 --accept-remote-connections"
    files: FileMap = {
        "package.json": json.dumps(
            {
                "name": "terrarium-sapui5-app",
                "private": True,
                "version": "0.0.0",
                "scripts": {"dev": ui5_dev},
                "devDependencies": {"@ui5/cli": "4.0.25"},
            },
            indent=2,
        ),
        "ui5.yaml": (
            "specVersion: \"4.0\"\nmetadata:\n  name: terrarium.fiori\ntype: application\n"
            "framework:\n  name: OpenUI5\n  version: \"1.136.1\"\n  libraries:\n"
            "    - name: sap.m\n    - name: sap.ui.core\n    - name: themelib_sap_horizon\n"
            "server:\n  settings:\n    httpPort: 5173\n"
        ),
        "webapp/index.html": (
            "<!doctype html>\n<html lang=\"en\">\n<head>\n"
            "  <meta charset=\"utf-8\"/>\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>\n"
            f"  <title>{safe}</title>\n"
            "  <script id=\"sap-ui-bootstrap\" src=\"resources/sap-ui-core.js\"\n"
            "    data-sap-ui-theme=\"sap_horizon\" data-sap-ui-libs=\"sap.m\"\n"
            "    data-sap-ui-compatVersion=\"edge\" data-sap-ui-async=\"true\"\n"
            "    data-sap-ui-oninit=\"module:sap/ui/core/ComponentSupport\"\n"
            "    data-sap-ui-resourceroots='{\"terrarium.fiori\": \"./\"}'></script>\n"
            "</head>\n<body class=\"sapUiBody\">\n"
            "  <div data-sap-ui-component data-name=\"terrarium.fiori\" data-id=\"container\" data-settings='{\"id\":\"app\"}'></div>\n"
            "</body>\n</html>\n"
        ),
        "webapp/manifest.json": (
            "{\n"
            '  "_version": "1.65.0",\n'
            '  "sap.app": {\n'
            '    "id": "terrarium.fiori",\n'
            '    "type": "application",\n'
            f'    "title": {json.dumps(title)}{"," if data_source else ""}\n'
            f"{data_source}"
            "  },\n"
            '  "sap.ui5": {\n'
            '    "rootView": { "viewName": "terrarium.fiori.view.App", "type": "XML", "async": true, "id": "app" },\n'
            f"{models}"
            '    "resources": { "css": [{ "uri": "css/style.css" }] }\n'
            "  }\n"
            "}\n"
        ),
        "webapp/Component.js": (
            "sap.ui.define([\"sap/ui/core/UIComponent\"], function (UIComponent) {\n"
            "  \"use strict\";\n"
            "  return UIComponent.extend(\"terrarium.fiori.Component\", {\n"
            "    metadata: { manifest: \"json\" }\n"
            "  });\n"
            "});\n"
        ),
        "webapp/view/App.view.xml": (
            '<mvc:View controllerName="terrarium.fiori.controller.App" xmlns:mvc="sap.ui.core.mvc" xmlns="sap.m" displayBlock="true">\n'
            '  <App>\n    <Page title="{= ${/title} || \'Catalog\' }" class="sapUiResponsiveContentPadding">\n'
            "      <content>\n"
            '        <VBox class="sapUiSmallMargin">\n'
            f'          <Title level="H1" text="{escape(title, quote=True)}" />\n'
            f'          <Text text="{escape(catalog_intro, quote=True)}" />\n'
            f'          <List items="{{{catalog_path}}}" headerText="Products">\n'
            '            <StandardListItem title="{title}" description="{price}" info="{status}" type="Active" press=".onItemPress" />\n'
            "          </List>\n"
            + (
                '          <Panel id="detailPanel" headerText="Product details" class="sapUiSmallMarginTop">\n'
                '            <VBox class="sapUiSmallMargin">\n'
                '              <Title id="detailTitle" text="Select a product" />\n'
                '              <Text id="detailPrice" text="" />\n'
                '              <Text id="detailStatus" text="" />\n'
                "            </VBox>\n"
                "          </Panel>\n"
                '          <List items="{/Orders}" headerText="Today\'s orders" class="sapUiSmallMarginTop">\n'
                '            <StandardListItem title="{title}" info="{status}" />\n'
                "          </List>\n"
                if with_odata
                else ""
            )
            + "        </VBox>\n"
            "      </content>\n"
            "    </Page>\n  </App>\n</mvc:View>\n"
        ),
        "webapp/controller/App.controller.js": (
            "sap.ui.define([\"sap/ui/core/mvc/Controller\", \"sap/ui/model/json/JSONModel\"], function (Controller, JSONModel) {\n"
            "  \"use strict\";\n"
            "  return Controller.extend(\"terrarium.fiori.controller.App\", {\n"
            "    onInit: function () {\n"
            "      if (this.getOwnerComponent().getModel()) { return; }\n"
            f"      this.getView().setModel(new JSONModel({{ title: {json.dumps(title)}, items: ["
            "{ title: 'Whole milk', price: '$2.40', status: 'Ready' }, "
            "{ title: 'Sourdough loaf', price: '$4.10', status: 'Open' }] }));\n"
            "    },\n"
            "    onItemPress: function (event) {\n"
            "      var item = event.getSource().getBindingContext().getObject();\n"
            "      this.byId('detailTitle') && this.byId('detailTitle').setText(item.title || '');\n"
            "      this.byId('detailPrice') && this.byId('detailPrice').setText(item.price ? 'Price: ' + item.price : '');\n"
            "      this.byId('detailStatus') && this.byId('detailStatus').setText(item.status ? 'Status: ' + item.status : '');\n"
            "    }\n"
            "  });\n"
            "});\n"
        ),
        "webapp/css/style.css": modern_css("#0f828f"),
        "README.md": f"# {title}\n\nGenerated SAPUI5/Fiori frontend. OpenUI5 is resolved locally.\n",
    }
    if with_odata:
        files["odata-proxy.mjs"] = (
            "import { createServer, request } from 'node:http';\n"
            "import { spawn } from 'node:child_process';\n"
            "const ui5Port = 5174;\n"
            "const capPort = 4004;\n"
            "const listenPort = Number(process.env.PORT || 5173);\n"
            "const child = spawn('ui5', ['serve', '--port', String(ui5Port), '--accept-remote-connections'], "
            "{ stdio: 'inherit', env: process.env });\n"
            "child.on('exit', (code) => process.exit(code ?? 1));\n"
            "function forward(req, res, port) {\n"
            "  const headers = { ...req.headers, host: `127.0.0.1:${port}` };\n"
            "  const upstream = request({ hostname: '127.0.0.1', port, path: req.url, method: req.method, headers }, (incoming) => {\n"
            "    res.writeHead(incoming.statusCode ?? 502, incoming.headers);\n"
            "    incoming.pipe(res);\n"
            "  });\n"
            "  upstream.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end('Upstream is not ready'); });\n"
            "  req.pipe(upstream);\n"
            "}\n"
            "createServer((req, res) => {\n"
            "  const url = req.url || '/';\n"
            "  if (url === '/odata' || url.startsWith('/odata/')) { forward(req, res, capPort); return; }\n"
            "  forward(req, res, ui5Port);\n"
            "}).listen(listenPort, '0.0.0.0');\n"
        )
    return files


def express_backend_files() -> FileMap:
    return {
        "backend/package.json": json.dumps(
            {
                "name": "terrarium-api",
                "private": True,
                "version": "0.0.0",
                "type": "module",
                "scripts": {"dev": "node src/server.js"},
                "dependencies": {"cors": "^2.8.5", "dotenv": "^17.2.2", "express": "^5.1.0"},
            },
            indent=2,
        ),
        "backend/src/server.js": (
            "import express from 'express';\nimport cors from 'cors';\n"
            "import { itemsRouter } from './routes/items.js';\n"
            "const app = express();\napp.use(cors());\napp.use(express.json());\n"
            "app.get('/api/health', (_req, res) => res.json({ ok: true }));\n"
            "app.use('/api/items', itemsRouter);\n"
            "const port = process.env.PORT || 3000;\n"
            "app.listen(port, '0.0.0.0', () => console.log(`API running on ${port}`));\n"
        ),
        "backend/src/routes/items.js": (
            "import { Router } from 'express';\n"
            "const items = [{ id: '1', title: 'First record' }];\n"
            "export const itemsRouter = Router();\n"
            "itemsRouter.get('/', (_req, res) => res.json({ items }));\n"
            "itemsRouter.post('/', (req, res) => {\n"
            "  const item = { id: String(items.length + 1), title: String(req.body?.title || 'Untitled') };\n"
            "  items.push(item);\n  res.status(201).json({ item });\n"
            "});\n"
        ),
        "backend/.env.example": "PORT=3000\n",
    }


def sap_cap_backend_files(title: str) -> FileMap:
    return {
        "backend/package.json": json.dumps(
            {
                "name": "terrarium-cap",
                "private": True,
                "version": "0.0.0",
                "scripts": {"dev": "cds-serve --port 4004"},
                "dependencies": {"@sap/cds": "^8.6.1", "express": "^5.1.0"},
            },
            indent=2,
        ),
        "backend/srv/catalog-service.cds": (
            "service CatalogService {\n"
            "  @readonly entity Items {\n"
            "    key ID : UUID;\n"
            "    title  : String;\n"
            "    price  : String;\n"
            "    status : String;\n"
            "  }\n"
            "  @readonly entity Orders {\n"
            "    key ID : UUID;\n"
            "    title  : String;\n"
            "    status : String;\n"
            "  }\n"
            "}\n"
        ),
        "backend/srv/catalog-service.js": (
            "module.exports = (srv) => {\n"
            "  srv.on('READ', 'Items', () => ([\n"
            "    { ID: '11111111-1111-1111-1111-111111111111', title: 'Whole milk', price: '$2.40', status: 'Ready' },\n"
            "    { ID: '22222222-2222-2222-2222-222222222222', title: 'Sourdough loaf', price: '$4.10', status: 'Open' },\n"
            "    { ID: '33333333-3333-3333-3333-333333333333', title: 'Seasonal apples', price: '$3.20', status: 'In Progress' },\n"
            "  ]));\n"
            "  srv.on('READ', 'Orders', () => ([\n"
            "    { ID: '44444444-4444-4444-4444-444444444444', title: 'Morning bakery run', status: 'Open' },\n"
            "    { ID: '55555555-5555-5555-5555-555555555555', title: 'School-lunch box', status: 'Ready' },\n"
            "  ]));\n"
            "};\n"
        ),
        "backend/.cdsrc.json": json.dumps({"server": {"port": 4004}}, indent=2),
    }


def workspace_package(name: str, frontend_script: str = "npm --prefix frontend run dev") -> FileMap:
    return {
        "package.json": json.dumps(
            {
                "name": name,
                "private": True,
                "version": "0.0.0",
                "scripts": {
                    "dev": f"node -e \"console.log('start frontend and backend via sandbox')\"",
                    "frontend": frontend_script,
                    "backend": "npm --prefix backend run dev",
                },
            },
            indent=2,
        )
    }


def build_stack_files(
    *,
    title: str,
    prompt: str,
    frontend: FrontendStack,
    backend: BackendStack,
    react_files: FileMap | None = None,
) -> FileMap:
    heading = _title(title, prompt)
    backend = compatible_backend(frontend, backend)
    if frontend == "angular":
        app = angular_files(heading, with_api=backend == "node-express")
        if backend == "none":
            return app
        files = workspace_package("terrarium-angular-node")
        files.update(prefix_files(app, "frontend/"))
        files.update(express_backend_files())
        files["frontend/proxy.conf.json"] = json.dumps({"/api": {"target": "http://127.0.0.1:3000", "secure": False}}, indent=2)
        files["README.md"] = f"# {heading}\n\nAngular frontend plus Node/Express backend.\n"
        return files
    if frontend == "sapui5":
        app = sapui5_files(heading, with_odata=backend == "sap-cap")
        if backend == "none":
            return app
        files = workspace_package("terrarium-fiori-cap")
        files.update(prefix_files(app, "frontend/"))
        files.update(sap_cap_backend_files(heading))
        files["README.md"] = f"# {heading}\n\nSAPUI5/Fiori frontend plus SAP CAP OData mock.\n"
        return files
    if react_files is None:
        raise ValueError("react_files required for react/vanilla stacks")
    if backend == "none":
        return react_files
    return react_files
