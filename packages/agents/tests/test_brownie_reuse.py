from __future__ import annotations

import os
import unittest
from unittest.mock import patch

from terrarium_agents.brownie_projects import ASSETS, PROJECTS
from terrarium_agents.brownie_reuse import (
    PublishedProject,
    exported_names,
    resolve_reuse,
    reuse_import_error,
    reuse_prompt_section,
    sha256_text,
)
from terrarium_agents.codegen import ProvidersUnavailable, SessionPlan, _overlay_prompt, _static_preview_error, generate
from terrarium_agents.per_file import BlueprintUnavailable, UnsupportedBlueprint, _model_blueprint
from terrarium_contracts import AgentJob, Intent


def _plan() -> SessionPlan:
    return SessionPlan(
        complexity="basic",
        stack="react",
        screens=("requisitions",),
        data=("requisition",),
        files=("index.html", "src/main.jsx", "src/App.jsx"),
        notes="Requisitions",
    )


def _job() -> AgentJob:
    return AgentJob(
        sessionId="brownie1",
        intent=Intent(kind="new", stack="react", summary="Purchase requisitions"),
        prompt="Build a purchase requisition app with an approval workflow",
    )


def _published(**overrides: dict[str, str]) -> dict[str, PublishedProject]:
    return {
        key: PublishedProject(
            tool_id=f"brownie-{key}-owner",
            tool_name=project.name,
            version_number=1,
            files=overrides.get(key, project.files),
        )
        for key, project in PROJECTS.items()
    }


_ENTRY = {
    "package.json": '{"type":"module","scripts":{"dev":"vite"}}',
    "index.html": "<!doctype html><html><body><div id=\"root\"></div><script type=\"module\" src=\"/src/main.jsx\"></script></body></html>",
    "src/main.jsx": "import App from './App.jsx';",
}


class BrownieProjectTests(unittest.TestCase):
    def test_every_asset_points_at_a_real_file_in_its_project(self) -> None:
        for asset in ASSETS.values():
            project = PROJECTS[asset.project_key]
            for path in asset.files:
                self.assertIn(path, project.files, f"{asset.asset_id} -> {path}")
                self.assertTrue(path.startswith(asset.source_root))

    def test_react_projects_are_runnable_on_their_own(self) -> None:
        for key in ("acme-internal-pm", "northstar-commerce"):
            self.assertIsNone(_static_preview_error(PROJECTS[key].files), key)

    def test_project_code_is_labelled_fictional(self) -> None:
        for asset in ASSETS.values():
            body = PROJECTS[asset.project_key].files[asset.files[0]]
            self.assertIn("Fictional Brownie demo project", body)


class BrownieReuseTests(unittest.TestCase):
    def test_empty_selection_reuses_nothing(self) -> None:
        self.assertEqual(resolve_reuse(None, published=_published()).files, {})
        self.assertEqual(resolve_reuse([], published=_published()).files, {})

    def test_role_guard_pulls_in_auth_and_keeps_relative_imports(self) -> None:
        plan = resolve_reuse(["pm-role-guard"], published=_published())
        self.assertEqual(plan.applied_ids, ["pm-auth-context", "pm-role-guard"])
        base = "src/reused/acme-internal-pm/auth"
        self.assertEqual(
            set(plan.files),
            {f"{base}/AuthContext.jsx", f"{base}/auth.css", f"{base}/RoleGuard.jsx"},
        )
        app = {"src/App.jsx": "export default function App(){ return null; }"}
        self.assertIsNone(_static_preview_error({**_ENTRY, **app, **plan.files}))

    def test_copied_bytes_come_from_the_published_version(self) -> None:
        edited = dict(PROJECTS["acme-internal-pm"].files)
        edited["src/dashboard/ProjectDashboardShell.jsx"] += "\n// edited in dashboard v2\n"
        plan = resolve_reuse(["pm-dashboard-shell"], published=_published(**{"acme-internal-pm": edited}))
        target = "src/reused/acme-internal-pm/dashboard/ProjectDashboardShell.jsx"
        self.assertIn("edited in dashboard v2", plan.files[target])
        record = plan.provenance()[0]
        self.assertEqual(record["toolId"], "brownie-acme-internal-pm-owner")
        self.assertEqual(record["files"][0]["source"], "src/dashboard/ProjectDashboardShell.jsx")
        self.assertEqual(record["files"][0]["sha256"], sha256_text(plan.files[target]))

    def test_gated_unknown_and_unpublished_assets_are_refused_with_reasons(self) -> None:
        published = _published()
        del published["northstar-commerce"]
        plan = resolve_reuse(
            ["support-ticket-workflow", "commerce-product-card", "nope", "pm-auth-context"],
            published=published,
        )
        self.assertEqual(plan.applied_ids, ["pm-auth-context"])
        reasons = dict(plan.ignored)
        self.assertIn("private", reasons["support-ticket-workflow"])
        self.assertIn("not published", reasons["commerce-product-card"])
        self.assertIn("Not in the Brownie catalog", reasons["nope"])

    def test_missing_dependency_refuses_the_dependent(self) -> None:
        edited = {k: v for k, v in PROJECTS["acme-internal-pm"].files.items() if k != "src/auth/AuthContext.jsx"}
        plan = resolve_reuse(["pm-role-guard"], published=_published(**{"acme-internal-pm": edited}))
        self.assertEqual(plan.applied_ids, [])
        self.assertIn("Needs AuthContext", dict(plan.ignored)["pm-role-guard"])

    def test_fullstack_builds_place_reuse_under_frontend(self) -> None:
        plan = resolve_reuse(["commerce-product-card"], published=_published(), backend_stack="node-express")
        self.assertIn("frontend/src/reused/northstar-commerce/catalog/ProductCard.jsx", plan.files)
        self.assertIn("frontend/src/reused/northstar-commerce/catalog/productCard.css", plan.files)

    def test_prompt_section_maps_provided_files_and_exact_imports(self) -> None:
        plan = resolve_reuse(["pm-auth-context"], published=_published())
        section = reuse_prompt_section(plan)
        self.assertIn("Do NOT output a file at any of these paths", section)
        self.assertIn(
            "import { AuthProvider, SignInPanel, useAuth } from './reused/acme-internal-pm/auth/AuthContext.jsx';",
            section,
        )
        _system, user = _overlay_prompt(_job(), _plan(), plan)
        self.assertIn("Generate only the files that are not provided above", user)

    def test_import_check_catches_names_the_reused_file_does_not_export(self) -> None:
        plan = resolve_reuse(["pm-dashboard-shell"], published=_published())
        good = {"src/App.jsx": "import { DashboardShell, MetricCard } from './reused/acme-internal-pm/dashboard/ProjectDashboardShell.jsx';"}
        bad = {"src/App.jsx": "import { Sidebar } from './reused/acme-internal-pm/dashboard/ProjectDashboardShell.jsx';"}
        default = {"src/App.jsx": "import Shell from './reused/acme-internal-pm/dashboard/ProjectDashboardShell.jsx';"}
        self.assertIsNone(reuse_import_error(good, plan))
        self.assertIn("Sidebar", reuse_import_error(bad, plan) or "")
        self.assertIn("no default export", reuse_import_error(default, plan) or "")

    def test_exported_names(self) -> None:
        self.assertEqual(
            exported_names("export function A(){}\nexport const b = 1;\nexport { c as d };\nexport default A;"),
            {"A", "b", "d", "default"},
        )


class BrownieCodegenTests(unittest.TestCase):
    def setUp(self) -> None:
        env = patch.dict(
            os.environ,
            {"TERRARIUM_CODEGEN_FORMAT": "json", "TERRARIUM_AGENTS": "live", "TERRARIUM_PER_FILE_CODEGEN": "1"},
        )
        env.start()
        self.addCleanup(env.stop)

    def test_reused_files_win_over_model_output(self) -> None:
        reuse = resolve_reuse(["pm-role-guard"], published=_published())
        target = "src/reused/acme-internal-pm/auth/AuthContext.jsx"
        payload = {
            "files": {
                **_ENTRY,
                "src/App.jsx": (
                    "import { AuthProvider } from './reused/acme-internal-pm/auth/AuthContext.jsx';\n"
                    "import { RoleGuard } from './reused/acme-internal-pm/auth/RoleGuard.jsx';\n"
                    "export default function App(){ return <AuthProvider users={[]}><RoleGuard allow={['approver']}><main>Approvals</main></RoleGuard></AuthProvider>; }"
                ),
                target: "export const overwritten = true;",
            }
        }
        with (
            patch("terrarium_agents.llm.complete_json", return_value=payload),
            patch("terrarium_agents.per_file.generate_per_file") as per_file,
        ):
            result = generate(_job(), _plan(), reuse=reuse)

        per_file.assert_not_called()
        self.assertEqual(result.files[target], PROJECTS["acme-internal-pm"].files["src/auth/AuthContext.jsx"])
        self.assertIn("src/App.jsx", result.files)

    def test_wrong_import_from_reused_file_is_rejected_not_served(self) -> None:
        reuse = resolve_reuse(["pm-dashboard-shell"], published=_published())
        payload = {
            "files": {
                **_ENTRY,
                "src/App.jsx": "import { Sidebar } from './reused/acme-internal-pm/dashboard/ProjectDashboardShell.jsx';\nexport default function App(){ return <Sidebar/>; }",
            }
        }
        with patch("terrarium_agents.llm.complete_json", return_value=payload):
            with self.assertRaisesRegex(Exception, "Sidebar"):
                generate(_job(), _plan(), reuse=reuse)

    def test_live_provider_outage_raises_a_readable_reason_instead_of_a_template(self) -> None:
        from terrarium_agents.codegen import _record_overlay_failure

        def outage(*_args, **_kwargs):
            _record_overlay_failure("bedrock", "ClientError: UnrecognizedClientException: The security token included in the request is invalid.")
            _record_overlay_failure("gemini", "ClientError:429 RESOURCE_EXHAUSTED. {'error': {'code': 429}}")
            return {}

        with (
            patch("terrarium_agents.per_file.generate_per_file", side_effect=BlueprintUnavailable("UnrecognizedClientException")),
            patch("terrarium_agents.codegen._maybe_llm_overlay", side_effect=outage),
        ):
            with self.assertRaises(ProvidersUnavailable) as raised:
                generate(_job(), _plan())
        message = str(raised.exception)
        self.assertIn("bedrock: AWS keys rejected (invalid security token)", message)
        self.assertIn("gemini: quota exhausted (429)", message)
        self.assertIn("Not serving a template", message)
        self.assertNotIn("{'error'", message)

    def test_stub_mode_still_uses_the_deterministic_files(self) -> None:
        with (
            patch.dict(os.environ, {"TERRARIUM_AGENTS": "stub", "TERRARIUM_PER_FILE_CODEGEN": "0"}),
            patch("terrarium_agents.codegen._maybe_llm_overlay", return_value={}),
        ):
            result = generate(_job(), _plan())
        self.assertIn("src/App.jsx", result.files)

    def test_failed_blueprint_call_is_not_an_unsupported_app(self) -> None:
        failed = {"ok": False, "text": "", "failReason": "ClientError:UnrecognizedClientException: token"}
        with patch("terrarium_agents.llm.invoke_bedrock_text", return_value=failed):
            with self.assertRaises(BlueprintUnavailable):
                _model_blueprint("Build an SAP purchase requisition workspace", "dashboard")

    def test_explicit_unsupported_blueprint_is_unchanged(self) -> None:
        answered = {
            "ok": True,
            "text": '{"supported": false, "archetype": "game", "confidence": 0.9, "title": "Game", "entity": "Player", "fields": [], "statuses": []}',
            "failReason": None,
        }
        with patch("terrarium_agents.llm.invoke_bedrock_text", return_value=answered):
            with self.assertRaises(UnsupportedBlueprint) as raised:
                _model_blueprint("Build a game", "unknown")
        self.assertIn("game", str(raised.exception))

    def test_blueprint_provider_failure_falls_through_to_monolith(self) -> None:
        overlay = {**_ENTRY, "src/App.jsx": "export default function App(){ return <main>Approvals</main>; }"}
        with (
            patch("terrarium_agents.per_file.generate_per_file", side_effect=BlueprintUnavailable("UnrecognizedClientException")),
            patch("terrarium_agents.codegen._maybe_llm_overlay", return_value=overlay),
        ):
            result = generate(
                AgentJob(
                    sessionId="dash1",
                    intent=Intent(kind="new", stack="react", summary="Requisition dashboard"),
                    prompt="Build a status dashboard for purchase requisitions",
                ),
                _plan(),
            )
        self.assertIn("src/App.jsx", result.files)


if __name__ == "__main__":
    unittest.main()
