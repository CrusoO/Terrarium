from __future__ import annotations

import os
import unittest

from terrarium_api.events import make_event
from terrarium_api.worker import classify_session_intent


class SessionIntentPipelineTests(unittest.TestCase):
    def setUp(self) -> None:
        os.environ["TERRARIUM_AGENTS"] = "stub"

    def test_worker_classifies_and_builds_sse_payload(self) -> None:
        intent = classify_session_intent("abc123", "Build me an Excel to JSON converter")
        event = make_event(
            "intent.classified",
            "abc123",
            intent.model_dump(exclude_none=True),
        )
        self.assertEqual(event.name, "intent.classified")
        self.assertEqual(event.sessionId, "abc123")
        assert event.payload is not None
        self.assertEqual(event.payload["kind"], "new")
        self.assertEqual(event.payload["stack"], "react")
        self.assertEqual(event.payload["phase"], "clarify")
        self.assertIn("Excel", event.payload["summary"])
        self.assertGreaterEqual(len(event.payload.get("questions") or []), 2)
        self.assertNotIn("toolId", event.payload)

    def test_hello_is_greeting(self) -> None:
        intent = classify_session_intent("abc123", "hi")
        self.assertEqual(intent.phase, "greeting")
        self.assertTrue(intent.reply)

    def test_modify_with_tool_id_is_classified(self) -> None:
        intent = classify_session_intent(
            "abc123",
            "Change the title",
            tool_id="tool-1",
        )
        self.assertEqual(intent.kind, "modify")
        self.assertEqual(intent.toolId, "tool-1")
        self.assertEqual(intent.phase, "ready")
