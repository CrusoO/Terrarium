from __future__ import annotations

import os
import unittest
from pathlib import Path

from terrarium_agents.codegen import CodeGeneratorError, SessionPlan, generate, load_template
from terrarium_contracts import AgentJob, Intent


class CodeGeneratorTests(unittest.TestCase):
    def setUp(self) -> None:
        os.environ["TERRARIUM_AGENTS"] = "stub"
        os.environ.pop("GROQ_API_KEY", None)
        os.environ.pop("TERRARIUM_LLM_API_KEY", None)
        os.environ.pop("GEMINI_API_KEY", None)
        os.environ.pop("GOOGLE_API_KEY", None)
        os.environ.pop("NVIDIA_API_KEY", None)
        os.environ.pop("NGC_API_KEY", None)

    def test_react_template_is_runnable_starter(self) -> None:
        files = load_template("react")
        self.assertIn("index.html", files)
        self.assertIn("<html", files["index.html"].lower())
        self.assertIn("app.js", files)
        self.assertIn("styles.css", files)

    def test_fullstack_template_is_runnable_starter(self) -> None:
        files = load_template("fullstack")
        self.assertIn("index.html", files)
        self.assertIn("localStorage", files["app.js"])

    def test_generate_fills_matching_template(self) -> None:
        result = generate(
            AgentJob(
                sessionId="abc123",
                intent=Intent(kind="new", stack="react", summary="Invoice tracker"),
                prompt="Build an invoice tracker",
            )
        )
        self.assertIn("index.html", result.files)
        self.assertIn("Invoice tracker", result.files["index.html"])
        self.assertNotIn("{{TITLE}}", result.files["index.html"])
        self.assertNotIn("Terrarium ·", result.files["index.html"])
        self.assertTrue(result.commitMessage.startswith("Generate react"))

    def test_fullstack_generate_uses_that_kit(self) -> None:
        result = generate(
            AgentJob(
                sessionId="abc123",
                intent=Intent(kind="new", stack="fullstack", summary="Task list"),
                prompt="fullstack task list",
            )
        )
        self.assertIn("Task list", result.files["index.html"])
        self.assertNotIn("Terrarium ·", result.files["index.html"])
        self.assertNotIn('id="tool-form"', result.files["index.html"])

    def test_draft_files_fills_template_without_llm(self) -> None:
        from terrarium_agents.codegen import draft_files

        files = draft_files(
            AgentJob(
                sessionId="abc123",
                intent=Intent(kind="new", stack="react", summary="Dragon landing page"),
                prompt="make a dragon website",
            )
        )
        self.assertIn("Dragon landing page", files["index.html"])
        self.assertIn('class="site"', files["index.html"])
        self.assertIn('class="split section"', files["index.html"])
        self.assertIn("about.html", files)
        self.assertIn("contact.html", files)
        self.assertIn("js/nav.js", files)
        self.assertIn("site-nav", files["index.html"])
        self.assertNotIn("Terrarium · Page", files["index.html"])
        self.assertNotIn("{{TITLE}}", files["index.html"])

    def test_simple_prompt_stays_on_react_kit(self) -> None:
        from terrarium_agents.codegen import build_session_plan

        job = AgentJob(
            sessionId="abc123",
            intent=Intent(kind="new", stack="react", summary="Pomodoro timer"),
            prompt="Build a simple pomodoro timer",
        )
        plan = build_session_plan(job)
        self.assertEqual(plan.complexity, "basic")
        self.assertEqual(plan.stack, "react")
        result = generate(job, plan)
        self.assertEqual(plan.layout, "form")
        self.assertIn("Pomodoro timer", result.files["index.html"])
        self.assertNotIn("Terrarium · Form", result.files["index.html"])
        self.assertNotIn('id="tool-form"', result.files["index.html"])

    def test_calculator_draft_uses_form_layout_not_a_product_kit(self) -> None:
        from terrarium_agents.codegen import draft_files, pick_layout

        job = AgentJob(
            sessionId="abc123",
            intent=Intent(kind="new", stack="react", summary="Scientific calculator"),
            prompt="build me a calculator",
        )
        self.assertEqual(pick_layout(job), "form")
        files = draft_files(job)
        self.assertIn("Terrarium · Form", files["index.html"])
        self.assertIn('id="tool-form"', files["index.html"])
        self.assertIn('id="result"', files["index.html"])
        self.assertIn("Function(", files["app.js"])
        self.assertNotIn("Save note", files["index.html"])
        self.assertNotIn("Type something", files["index.html"])

    def test_complex_prompt_plans_then_uses_fullstack_kit(self) -> None:
        from terrarium_agents.codegen import build_session_plan

        job = AgentJob(
            sessionId="abc123",
            intent=Intent(kind="new", stack="react", summary="Team dashboard"),
            prompt="Build an admin dashboard with login, roles, and multiple screens",
        )
        plan = build_session_plan(job)
        self.assertEqual(plan.complexity, "complex")
        self.assertEqual(plan.stack, "fullstack")
        self.assertTrue(plan.screens)
        self.assertEqual(plan.layout, "list")
        result = generate(job, plan)
        self.assertIn("Team dashboard", result.files["frontend/index.html"])
        self.assertIn("backend/src/server.js", result.files)
        self.assertNotIn("Terrarium · List", result.files["frontend/index.html"])

    def test_live_without_model_filemap_uses_deterministic_fallback(self) -> None:
        from unittest.mock import patch

        os.environ["TERRARIUM_AGENTS"] = "live"
        job = AgentJob(
            sessionId="abc123",
            intent=Intent(kind="new", stack="react", summary="JSON converter"),
            prompt="modern text to JSON converter",
        )
        with patch("terrarium_agents.llm.complete_json", return_value=None):
            result = generate(job)
        self.assertIn("package.json", result.files)
        self.assertIn("src/App.jsx", result.files)
        self.assertNotIn("Terrarium ·", result.files.get("index.html", ""))

    def test_live_bad_model_filemap_reports_validation_reason(self) -> None:
        from unittest.mock import patch

        os.environ["TERRARIUM_AGENTS"] = "live"
        job = AgentJob(
            sessionId="abc123",
            intent=Intent(kind="new", stack="react", summary="Notepad"),
            prompt="Build a notepad",
        )
        plan = SessionPlan(
            complexity="basic",
            stack="react",
            screens=("main",),
            data=("localStorage notes",),
            files=("index.html", "styles.css", "app.js"),
            notes="Notepad",
        )
        payload = {"files": {"styles.css": "body{}", "app.js": "console.log('x')"}}

        with patch("terrarium_agents.llm.complete_json", return_value=payload):
            with self.assertRaises(CodeGeneratorError) as ctx:
                generate(job, plan)

        message = str(ctx.exception)
        self.assertIn("missing index.html HTML document", message)
        self.assertIn("Not serving a template", message)

    def test_modify_is_rejected(self) -> None:
        with self.assertRaises(CodeGeneratorError) as ctx:
            generate(
                AgentJob(
                    sessionId="abc123",
                    intent=Intent(kind="modify", stack="react", summary="Tweak copy"),
                    prompt="Change the heading",
                    files={"index.html": "<html></html>"},
                )
            )
        self.assertIn("Editor", str(ctx.exception))

    def test_agent_package_does_not_talk_to_docker(self) -> None:
        from terrarium_agents import codegen as codegen_mod

        source = Path(codegen_mod.__file__).read_text(encoding="utf-8")
        self.assertNotIn("import docker", source)
        self.assertNotIn("from docker", source)
        self.assertNotIn("SandboxRunner", source)

    def test_cdn_react_overlay_is_rejected(self) -> None:
        from terrarium_agents.codegen import _is_static_preview

        self.assertTrue(
            _is_static_preview(
                {
                    "index.html": "<html><body><button id='go'>Go</button><script src='app.js'></script></body></html>",
                    "app.js": "document.getElementById('go')",
                }
            )
        )
        self.assertFalse(
            _is_static_preview(
                {
                    "index.html": (
                        "<html><head>"
                        "<script src='https://unpkg.com/react@18/umd/react.development.js'></script>"
                        "</head><body><div id='root'></div></body></html>"
                    )
                }
            )
        )

    def test_board_and_dark_theme_stamp(self) -> None:
        from terrarium_agents.codegen import draft_files, pick_layout, pick_theme

        job = AgentJob(
            sessionId="abc123",
            intent=Intent(kind="new", stack="react", summary="Tic-tac-toe"),
            prompt="build a tic-tac-toe game with a dark theme",
        )
        self.assertEqual(pick_layout(job), "board")
        self.assertEqual(pick_theme(job), "dark")
        files = draft_files(job)
        self.assertIn("Terrarium · Board", files["index.html"])
        self.assertIn('id="board"', files["index.html"])
        self.assertIn("--bg: #161314", files["styles.css"])
        self.assertIn("--accent:", files["styles.css"])
        self.assertNotIn("#6e1429", files["styles.css"].lower())

    def test_website_plan_keeps_multipage_files(self) -> None:
        from terrarium_agents.codegen import build_session_plan, generate

        job = AgentJob(
            sessionId="abc123",
            intent=Intent(kind="new", stack="react", summary="Personal portfolio"),
            prompt="Build a personal modern website with about and contact",
            frontendStack="vanilla",
        )
        plan = build_session_plan(job)
        self.assertEqual(plan.layout, "split")
        self.assertIn("about.html", plan.files)
        result = generate(job, plan)
        self.assertIn("about.html", result.files)
        self.assertIn("contact.html", result.files)
        self.assertIn("js/nav.js", result.files)
        self.assertNotIn("Terrarium ·", result.files["index.html"])
        calc = generate(
            AgentJob(
                sessionId="abc123",
                intent=Intent(kind="new", stack="react", summary="Tip calculator"),
                prompt="build a tip calculator",
            )
        )
        self.assertNotIn("about.html", calc.files)
        self.assertNotIn("Terrarium · Form", calc.files["index.html"])

    def test_look_tag_stamps_modern_theme(self) -> None:
        from terrarium_agents.codegen import draft_files, pick_theme

        job = AgentJob(
            sessionId="abc123",
            intent=Intent(kind="new", stack="react", summary="Tip calculator"),
            prompt="[look=modern] build a tip calculator",
        )
        self.assertEqual(pick_theme(job), "modern")
        files = draft_files(job)
        self.assertIn("--accent: #2563eb", files["styles.css"])
        self.assertIn("Function(", files["app.js"])

    def test_finalize_pins_working_keypad_math(self) -> None:
        from terrarium_agents.codegen import _finalize_files

        files = _finalize_files(
            {
                "index.html": (
                    '<html><body><div class="keypad">'
                    '<button data-action="1">1</button>'
                    "</div></body></html>"
                ),
                "styles.css": "body{}",
                "app.js": (
                    "function evaluateExpression(s) { throw new Error('nope'); }\n"
                    'document.querySelector(".keypad").addEventListener("click", function(){});'
                ),
            }
        )
        self.assertIn('type="button"', files["index.html"])
        self.assertIn("grid-template-columns", files["styles.css"])
        self.assertIn("pointer-events: auto", files["styles.css"])
        self.assertIn("terrariumCompute", files["app.js"])
        self.assertIn("stopImmediatePropagation", files["app.js"])

    def test_product_skeletons_are_gone(self) -> None:
        from terrarium_agents.codegen import templates_root

        root = templates_root()
        self.assertTrue((root / "shell" / "styles.css").is_file())
        self.assertTrue((root / "shell" / "site.css").is_file())
        for name in ("board", "form", "list", "split"):
            self.assertTrue((root / "layouts" / name / "index.html").is_file())
        self.assertTrue((root / "layouts" / "split" / "about.html").is_file())
        self.assertTrue((root / "layouts" / "split" / "contact.html").is_file())
        self.assertTrue((root / "layouts" / "split" / "js" / "nav.js").is_file())
        self.assertFalse((root / "skeletons").exists())

    def test_component_based_structure_generates_multiple_files(self) -> None:
        """Test that new codegen generates 6+ files with component structure."""
        from terrarium_agents.codegen import build_session_plan, generate

        # Test calculator (form layout)
        calc_job = AgentJob(
            sessionId="abc123",
            intent=Intent(kind="new", stack="react", summary="Scientific calculator"),
            prompt="Build a scientific calculator with memory",
        )
        calc_plan = build_session_plan(calc_job)
        self.assertGreaterEqual(len(calc_plan.files), 6, "Should suggest 6+ files")
        self.assertTrue(
            any("components/" in f or "utils/" in f for f in calc_plan.files),
            "Should have component or utils folder structure"
        )

        # Test notepad (list layout)
        notepad_job = AgentJob(
            sessionId="abc456",
            intent=Intent(kind="new", stack="react", summary="Note taking app"),
            prompt="build a notepad with markdown",
        )
        notepad_plan = build_session_plan(notepad_job)
        self.assertGreaterEqual(len(notepad_plan.files), 6, "Should suggest 6+ files")

    def test_theme_selection_is_intelligent(self) -> None:
        """Test that theme selection is context-aware, not hardcoded maroon."""
        from terrarium_agents.codegen import pick_theme

        # Calculator should be light (neutral)
        calc_job = AgentJob(
            sessionId="abc",
            intent=Intent(kind="new", stack="react", summary="Calculator"),
            prompt="build a calculator",
        )
        self.assertEqual(pick_theme(calc_job), "light")

        # Dashboard should be modern
        dash_job = AgentJob(
            sessionId="abc",
            intent=Intent(kind="new", stack="react", summary="Dashboard"),
            prompt="build a dashboard",
        )
        self.assertEqual(pick_theme(dash_job), "modern")

        # Notepad should be light
        note_job = AgentJob(
            sessionId="abc",
            intent=Intent(kind="new", stack="react", summary="Notepad"),
            prompt="build a notepad",
        )
        self.assertEqual(pick_theme(note_job), "light")

        # Game should be modern
        game_job = AgentJob(
            sessionId="abc",
            intent=Intent(kind="new", stack="react", summary="Game"),
            prompt="build a fun game",
        )
        self.assertEqual(pick_theme(game_job), "modern")

        # Dark mode keyword should be dark
        dark_job = AgentJob(
            sessionId="abc",
            intent=Intent(kind="new", stack="react", summary="App"),
            prompt="build an app with dark mode",
        )
        self.assertEqual(pick_theme(dark_job), "dark")

    def test_react_frontend_project_structure_is_default(self) -> None:
        from terrarium_agents.codegen import build_session_plan, generate

        job = AgentJob(
            sessionId="react123",
            intent=Intent(kind="new", stack="react", summary="Notepad"),
            prompt="build a notepad with local save",
            frontendStack="react",
            backendNeed="auto",
            backendStack="none",
        )
        plan = build_session_plan(job)
        result = generate(job, plan)
        self.assertEqual(plan.frontend_stack, "react")
        self.assertEqual(plan.backend_stack, "none")
        self.assertIn("package.json", result.files)
        self.assertIn("src/main.jsx", result.files)
        self.assertIn("src/App.jsx", result.files)
        self.assertIn("src/components/AppShell.jsx", result.files)
        self.assertNotIn("backend/package.json", result.files)

    def test_react_fallback_jsx_modules_import_react(self) -> None:
        from terrarium_agents.codegen import generate

        result = generate(
            AgentJob(
                sessionId="react-imports",
                intent=Intent(kind="new", stack="react", summary="Dragon shop"),
                prompt="Build a dragon shop website",
                frontendStack="react",
                backendStack="none",
            )
        )

        self.assertIn("import React from 'react';", result.files["src/App.jsx"])
        self.assertIn("import React from 'react';", result.files["src/components/AppShell.jsx"])
        self.assertIn("import React from 'react';", result.files["src/components/Toolbar.jsx"])

    def test_react_fallback_includes_visible_interactions(self) -> None:
        from terrarium_agents.codegen import generate

        result = generate(
            AgentJob(
                sessionId="react-interactive",
                intent=Intent(kind="new", stack="react", summary="Portfolio website"),
                prompt="Build a modern portfolio website with projects, contact, and skills",
                frontendStack="react",
                backendStack="none",
            )
        )

        self.assertIn("src/components/DetailPanel.jsx", result.files)
        self.assertIn("src/components/ContactForm.jsx", result.files)
        self.assertIn("useState", result.files["src/components/AppShell.jsx"])
        self.assertIn("onSelect", result.files["src/components/FeatureGrid.jsx"])
        self.assertIn("onSubmit", result.files["src/components/ContactForm.jsx"])
        combined = "\n".join(result.files.values())
        self.assertNotIn("Terrarium build", combined)
        self.assertNotIn("New item", combined)

    def test_backend_prompt_generates_react_node_structure(self) -> None:
        from terrarium_agents.codegen import build_session_plan, generate

        job = AgentJob(
            sessionId="node123",
            intent=Intent(kind="new", stack="fullstack", summary="Team notes"),
            prompt="build shared team notes with login and a database",
            frontendStack="react",
            backendNeed="auto",
        )
        plan = build_session_plan(job)
        result = generate(job, plan)
        self.assertEqual(plan.backend_stack, "node-express")
        self.assertIn("frontend/package.json", result.files)
        self.assertIn("frontend/src/App.jsx", result.files)
        self.assertIn("frontend/vite.config.js", result.files)
        self.assertIn("backend/package.json", result.files)
        self.assertIn("backend/src/server.js", result.files)
        self.assertIn("shared/constants.js", result.files)


if __name__ == "__main__":
    unittest.main()
