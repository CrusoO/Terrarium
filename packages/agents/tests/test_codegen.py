from __future__ import annotations

import os
import unittest
from pathlib import Path

from terrarium_agents.codegen import CodeGeneratorError, generate, load_template
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
        self.assertTrue(result.commitMessage.startswith("Generate react"))

    def test_fullstack_generate_uses_that_kit(self) -> None:
        result = generate(
            AgentJob(
                sessionId="abc123",
                intent=Intent(kind="new", stack="fullstack", summary="Task list"),
                prompt="fullstack task list",
            )
        )
        self.assertIn("Terrarium · List", result.files["index.html"])
        self.assertIn("Store", result.files["index.html"])
        self.assertIn("localStorage", result.files["app.js"])

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
        self.assertIn("Terrarium · Form", result.files["index.html"])
        self.assertIn("Pomodoro timer", result.files["index.html"])
        self.assertIn('id="tool-form"', result.files["index.html"])

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
        self.assertIn("Terrarium · List", result.files["index.html"])
        self.assertIn("Store", result.files["index.html"])
        self.assertIn("localStorage", result.files["app.js"])

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
        )
        plan = build_session_plan(job)
        self.assertEqual(plan.layout, "split")
        self.assertIn("about.html", plan.files)
        result = generate(job, plan)
        self.assertIn("about.html", result.files)
        self.assertIn("contact.html", result.files)
        self.assertIn("js/nav.js", result.files)
        self.assertIn("site-header", result.files["index.html"])
        calc = generate(
            AgentJob(
                sessionId="abc123",
                intent=Intent(kind="new", stack="react", summary="Tip calculator"),
                prompt="build a tip calculator",
            )
        )
        self.assertIn('id="tool-form"', calc.files["index.html"])
        self.assertNotIn("about.html", calc.files)

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


if __name__ == "__main__":
    unittest.main()
