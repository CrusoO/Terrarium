from __future__ import annotations

import asyncio
import os
import unittest
from unittest.mock import AsyncMock, patch

from terrarium_agents.brownie_projects import PROJECTS
from terrarium_agents.brownie_reuse import PublishedProject
from terrarium_api import worker


class FakeLog:
    def __init__(self) -> None:
        self.events: list[tuple[str, dict]] = []
        self.conversation: list[dict] = []
        self.plan: dict | None = None
        self.intent: dict | None = None

    async def append(self, event) -> None:
        self.events.append((event.name, dict(event.payload or {})))

    async def load_conversation(self, _session_id):
        return list(self.conversation)

    async def save_conversation(self, _session_id, turns) -> None:
        self.conversation = list(turns)

    async def load_files(self, _session_id):
        return None

    async def load_tool_id(self, _session_id):
        return None

    async def save_tool_id(self, _session_id, _tool_id) -> None:
        return None

    async def load_actor_email(self, _session_id):
        return ""

    async def load_actor_id(self, _session_id):
        return "owner-1"

    async def save_acceptance_checks(self, _session_id, _checks) -> None:
        return None

    async def load_session_plan(self, _session_id):
        return self.plan

    async def save_session_plan(self, _session_id, plan) -> None:
        self.plan = plan

    async def clear_session_plan(self, _session_id) -> None:
        self.plan = None

    async def load_intent(self, _session_id):
        return self.intent

    async def save_intent(self, _session_id, intent) -> None:
        self.intent = intent

    def names(self) -> list[str]:
        return [name for name, _payload in self.events]


class BrownieFlowTests(unittest.TestCase):
    def setUp(self) -> None:
        env = patch.dict(os.environ, {"TERRARIUM_AGENTS": "stub", "TERRARIUM_KNOWLEDGE_STEP_DELAY_S": "0"})
        env.start()
        self.addCleanup(env.stop)
        self.log = FakeLog()
        log_patch = patch.object(worker, "SessionEventLog", return_value=self.log)
        log_patch.start()
        self.addCleanup(log_patch.stop)
        self.codegen = AsyncMock()
        codegen_patch = patch.object(worker, "_codegen_and_preview", self.codegen)
        codegen_patch.start()
        self.addCleanup(codegen_patch.stop)
        self.dashboard_owner: list[str] = []

        def published(_db, owner_id):
            self.dashboard_owner.append(owner_id)
            return {
                key: PublishedProject(f"brownie-{key}-x", project.name, 2, project.files)
                for key, project in PROJECTS.items()
            }

        dashboard_patch = patch("terrarium_api.brownie_catalog.published_projects", side_effect=published)
        dashboard_patch.start()
        self.addCleanup(dashboard_patch.stop)

    def run_session(self, prompt: str, asset_ids: list[str] | None = None) -> None:
        asyncio.run(
            worker._run_stub_session_locked(object(), "flow1", prompt, brownie_asset_ids=asset_ids)
        )

    def test_questions_then_architecture_then_brownie_review_then_gap_codegen(self) -> None:
        self.run_session("Build me an Excel to JSON converter")
        names = self.log.names()
        self.assertEqual(names, ["intent.classified"])
        classified = dict(self.log.events)["intent.classified"]
        self.assertEqual(classified["phase"], "clarify")
        self.assertTrue(classified["questions"])
        self.assertIsNone(self.log.plan)
        self.codegen.assert_not_called()

        self.log.events.clear()
        self.run_session("1. Which kind of app?\nReact\n\n2. Output?\nJSON download")
        names = self.log.names()
        self.assertEqual(names[0], "intent.classified")
        self.assertEqual(names[1], "brownie.knowledge")
        self.assertEqual(names[-2:], ["architecture.planned", "brownie.review"])
        self.assertLess(names.index("brownie.knowledge"), names.index("architecture.planned"))
        self.assertEqual(dict(self.log.events)["intent.classified"]["phase"], "ready")
        self.assertIn("your answers", dict(self.log.events)["architecture.planned"]["message"])
        review = dict(self.log.events)["brownie.review"]
        self.assertEqual(review["backendStack"], "node-express")
        self.codegen.assert_not_called()

        self.log.events.clear()
        self.run_session("Continue with the selected Brownie assets.", ["pm-role-guard", "support-ticket-workflow"])
        self.assertEqual(self.log.names(), ["brownie.applied"])
        applied = self.log.events[0][1]
        self.assertEqual(self.dashboard_owner, ["owner-1", "owner-1"])
        self.assertEqual(applied["appliedAssetIds"], ["pm-auth-context", "pm-role-guard"])
        self.assertEqual(applied["ignoredAssetIds"], ["support-ticket-workflow"])
        self.assertIn("private", applied["ignored"][0]["reason"])
        guard = applied["provenance"][1]
        self.assertEqual(guard["toolId"], "brownie-acme-internal-pm-x")
        self.assertEqual(guard["toolVersion"], 2)
        self.assertEqual(
            guard["files"][0],
            {
                "source": "src/auth/RoleGuard.jsx",
                "target": "frontend/src/reused/acme-internal-pm/auth/RoleGuard.jsx",
                "sha256": guard["files"][0]["sha256"],
            },
        )
        self.assertIsNone(self.log.plan)
        self.codegen.assert_awaited_once()
        reuse = self.codegen.await_args.args[-1]
        self.assertEqual(
            reuse.files["frontend/src/reused/acme-internal-pm/auth/RoleGuard.jsx"],
            PROJECTS["acme-internal-pm"].files["src/auth/RoleGuard.jsx"],
        )
        generation_prompt = self.codegen.await_args.args[2]
        self.assertIn("Excel", generation_prompt)
        self.assertNotIn("Continue with the selected", generation_prompt)

    def test_resume_without_saved_review_stops_instead_of_guessing(self) -> None:
        self.run_session("Continue with the selected Brownie assets.", ["pm-auth-context"])
        name, payload = self.log.events[-1]
        self.assertEqual(name, "sandbox.unhealthy")
        self.assertTrue(payload["terminal"])
        self.codegen.assert_not_called()


if __name__ == "__main__":
    unittest.main()
