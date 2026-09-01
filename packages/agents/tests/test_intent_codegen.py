from __future__ import annotations

import os
import unittest

from terrarium_agents import classify_intent, generate
from terrarium_contracts import AgentJob, ConversationTurn, IntentAgentInput


class IntentToCodegenTests(unittest.TestCase):
    def setUp(self) -> None:
        os.environ["TERRARIUM_AGENTS"] = "stub"
        os.environ.pop("NVIDIA_API_KEY", None)
        os.environ.pop("NGC_API_KEY", None)

    def test_ready_new_intent_feeds_codegen(self) -> None:
        classified = classify_intent(
            IntentAgentInput(
                prompt="just build it",
                conversation=[
                    ConversationTurn(role="user", text="build a calculator"),
                    ConversationTurn(role="assistant", text="1. Which operations?"),
                ],
            )
        )
        self.assertEqual(classified.phase, "ready")
        self.assertEqual(classified.kind, "new")
        result = generate(
            AgentJob(
                sessionId="sync-test",
                intent=classified.as_intent(),
                prompt="just build it",
            )
        )
        self.assertIn("index.html", result.files)
        self.assertNotIn("{{TITLE}}", result.files["index.html"])

    def test_greeting_does_not_look_like_codegen_job(self) -> None:
        classified = classify_intent(IntentAgentInput(prompt="hello"))
        self.assertEqual(classified.phase, "greeting")
        self.assertNotEqual(classified.phase, "ready")

    def test_modify_is_not_handed_to_codegen(self) -> None:
        classified = classify_intent(
            IntentAgentInput(
                prompt="Change the button color to blue",
                toolId="tool-abc",
            )
        )
        self.assertEqual(classified.kind, "modify")
        self.assertEqual(classified.phase, "ready")


if __name__ == "__main__":
    unittest.main()
