from __future__ import annotations

import os
import unittest

from terrarium_agents.heal import (
    MAX_HEAL_ATTEMPTS,
    HealAgentError,
    next_heal_attempt,
    run_heal,
)
from terrarium_contracts import AgentJob, ErrorContext, Intent


def _job(*, files: dict[str, str] | None, attempt: int = 1) -> AgentJob:
    return AgentJob(
        sessionId="heal-1",
        intent=Intent(kind="new", stack="react", summary="A timer"),
        prompt="Build a timer",
        files=files,
        errorContext=ErrorContext(
            logs="nginx: [emerg] unexpected end of file",
            health="unhealthy",
            healAttempt=attempt,
        ),
    )


class HealAgentTests(unittest.TestCase):
    def setUp(self) -> None:
        os.environ["TERRARIUM_AGENTS"] = "stub"

    def test_next_attempt_caps_at_three(self) -> None:
        self.assertEqual(next_heal_attempt(0), 1)
        self.assertEqual(next_heal_attempt(1), 2)
        self.assertEqual(next_heal_attempt(2), 3)
        self.assertIsNone(next_heal_attempt(3))
        self.assertEqual(MAX_HEAL_ATTEMPTS, 3)

    def test_files_route_to_editor(self) -> None:
        decision = run_heal(_job(files={"index.html": "<html></html>"}))
        self.assertEqual(decision.route, "editor")

    def test_no_files_route_to_codegen(self) -> None:
        decision = run_heal(_job(files=None))
        self.assertEqual(decision.route, "codegen")

    def test_missing_error_context_raises(self) -> None:
        job = AgentJob(
            sessionId="heal-1",
            intent=Intent(kind="new", stack="react", summary="A timer"),
            prompt="Build a timer",
        )
        with self.assertRaises(HealAgentError):
            run_heal(job)

    def test_attempt_zero_raises(self) -> None:
        with self.assertRaises(HealAgentError):
            run_heal(_job(files=None, attempt=0))

    def test_contract_rejects_attempt_above_three(self) -> None:
        from pydantic import ValidationError

        with self.assertRaises(ValidationError):
            ErrorContext(logs="x", health="unhealthy", healAttempt=4)

    def test_agent_does_not_import_docker(self) -> None:
        from pathlib import Path

        source = Path(__file__).resolve().parents[1] / "terrarium_agents" / "heal.py"
        text = source.read_text(encoding="utf-8")
        self.assertNotIn("SandboxRunner", text)
        self.assertNotIn("import docker", text)
