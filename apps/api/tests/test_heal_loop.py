from __future__ import annotations

import os
import unittest
from unittest.mock import MagicMock, patch

from terrarium_agents.heal import HealDecision
from terrarium_contracts import AgentResult, HealthReport, Intent
from terrarium_api.worker import _heal_loop, _skeleton_html


class FakeLog:
    def __init__(self) -> None:
        self.events: list[object] = []
        self.files: dict[str, str] | None = None

    async def append(self, event: object) -> str:
        self.events.append(event)
        return "1-0"

    async def save_files(self, _session_id: str, files: dict[str, str]) -> None:
        self.files = files


class HealLoopTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        os.environ["TERRARIUM_AGENTS"] = "stub"

    async def test_three_failed_retries_emit_exhausted(self) -> None:
        log = FakeLog()
        intent = Intent(kind="new", stack="react", summary="timer")
        result = AgentResult(
            files={
                "index.html": "<!doctype html><html><body><main>Timer</main><script src=\"app.js\"></script></body></html>",
                "app.js": "console.log('timer')",
            },
            commitMessage="heal",
        )
        with (
            patch("terrarium_api.worker.run_heal", return_value=HealDecision("codegen", "test")),
            patch("terrarium_api.worker.generate", return_value=result),
            patch("terrarium_api.worker.SandboxRunner") as runner_cls,
        ):
            runner_cls.return_value.start.side_effect = RuntimeError("docker down")
            await _heal_loop(log, "s1", "Build a timer", None, "boom", intent=intent)
        names = [event.name for event in log.events]  # type: ignore[attr-defined]
        self.assertEqual(names.count("heal.attempt"), 3)
        self.assertEqual(names[-1], "heal.exhausted")
        attempts = [
            event.payload["attempt"]
            for event in log.events
            if event.name == "heal.attempt"  # type: ignore[attr-defined]
        ]
        self.assertEqual(attempts, [1, 2, 3])

    async def test_successful_retry_reaches_preview(self) -> None:
        log = FakeLog()
        intent = Intent(kind="new", stack="react", summary="timer")
        result = AgentResult(
            files={
                "index.html": "<!doctype html><html><body><main>Timer</main><script src=\"app.js\"></script></body></html>",
                "app.js": "console.log('timer')",
            },
            commitMessage="heal",
        )
        handle = MagicMock(previewUrl="/preview/s1/", containerId="c1")
        with (
            patch(
                "terrarium_api.worker.run_heal",
                return_value=HealDecision("codegen", "test"),
            ),
            patch("terrarium_api.worker.generate", return_value=result),
            patch("terrarium_api.worker.SandboxRunner") as runner_cls,
        ):
            runner = runner_cls.return_value
            runner.start.return_value = handle
            runner.wait_until_healthy.return_value = HealthReport(
                status="running", logs=""
            )
            runner.smoke.return_value = HealthReport(
                status="running", logs="DOM smoke passed"
            )
            await _heal_loop(log, "s1", "Build a timer", None, "boom", intent=intent)
        names = [event.name for event in log.events]  # type: ignore[attr-defined]
        self.assertEqual(names.count("heal.attempt"), 1)
        self.assertIn("preview.stream.file", names)
        self.assertIn("preview.stream.completed", names)
        self.assertIn("preview.ready", names)
        self.assertNotIn("heal.exhausted", names)

    async def test_smoke_failure_retries_before_preview(self) -> None:
        log = FakeLog()
        intent = Intent(kind="new", stack="react", summary="calculator")
        result = AgentResult(
            files={
                "index.html": "<!doctype html><html><body><main>Calculator</main><script src=\"app.js\"></script></body></html>",
                "app.js": "console.log('calculator')",
            },
            commitMessage="heal",
        )
        handle = MagicMock(previewUrl="/preview/s1/", containerId="c1")
        with (
            patch(
                "terrarium_api.worker.run_heal",
                return_value=HealDecision("codegen", "test"),
            ),
            patch("terrarium_api.worker.generate", return_value=result),
            patch("terrarium_api.worker.SandboxRunner") as runner_cls,
        ):
            runner = runner_cls.return_value
            runner.start.return_value = handle
            runner.wait_until_healthy.return_value = HealthReport(
                status="running", logs=""
            )
            runner.smoke.side_effect = [
                HealthReport(
                    status="unhealthy",
                    logs="DOM smoke failed: keypad click did not change visible output",
                ),
                HealthReport(status="running", logs="DOM smoke passed"),
            ]
            await _heal_loop(
                log, "s1", "Build a calculator", None, "boom", intent=intent
            )
        names = [event.name for event in log.events]  # type: ignore[attr-defined]
        self.assertEqual(names.count("heal.attempt"), 1)
        self.assertIn("preview.stream.file", names)
        self.assertIn("preview.stream.completed", names)
        self.assertNotIn("sandbox.unhealthy", names)
        self.assertIn("preview.ready", names)

    def test_plan_preview_uses_request_specific_layout(self) -> None:
        calculator = _skeleton_html(
            {
                "layout": "form",
                "theme": "light",
                "screens": ["Calculator"],
                "structure": ["src/components/Keypad.jsx — calculator keypad"],
                "notes": "React calculator for: Scientific calculator",
            }
        )
        website = _skeleton_html(
            {
                "layout": "split",
                "theme": "dark",
                "screens": ["Home", "About", "Contact"],
                "structure": ["src/pages/Home.jsx — portfolio home page"],
                "notes": "Portfolio website for: Personal portfolio",
            }
        )

        self.assertIn("calculator-preview", calculator)
        self.assertIn("calc-keys", calculator)
        self.assertIn("Calculator layout", calculator)
        self.assertIn("list-preview", website)
        self.assertIn('aria-hidden="true"', website)
        self.assertNotIn("Contact", website)
        self.assertNotEqual(calculator, website)

    def test_plan_preview_builds_in_visible_stages(self) -> None:
        plan = {
            "layout": "form",
            "theme": "light",
            "screens": ["Calculator", "History"],
            "structure": ["src/components/Keypad.jsx — calculator keypad"],
            "notes": "React calculator for: Scientific calculator",
        }

        shell = _skeleton_html(plan, stage=0)
        rough_controls = _skeleton_html(plan, stage=2)
        detailed_wireframe = _skeleton_html(plan, stage=3)

        self.assertIn('data-build-stage="0"', shell)
        self.assertIn("wireframe-preview", shell)
        self.assertNotIn("123.45", shell)
        self.assertIn("calc-keys ghost", rough_controls)
        self.assertNotIn(">7</button>", rough_controls)
        self.assertIn("calc-keys ghost detailed", detailed_wireframe)
        self.assertNotIn("123.45", detailed_wireframe)
        self.assertNotIn(">7</button>", detailed_wireframe)
