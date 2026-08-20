from __future__ import annotations

import ast
from pathlib import Path
import os
import re
import unittest

from terrarium_agents.intent import _enforce_rules, classify_intent
from terrarium_contracts import ConversationTurn, Intent, IntentAgentInput, IntentAgentOutput


class IntentAgentTests(unittest.TestCase):
    def setUp(self) -> None:
        os.environ["TERRARIUM_AGENTS"] = "stub"

    def test_greeting_does_not_build(self) -> None:
        intent = classify_intent(IntentAgentInput(prompt="hello"))
        self.assertEqual(intent.phase, "greeting")
        self.assertEqual(intent.summary, "Chat greeting")
        self.assertTrue(intent.reply)
        self.assertIn("build", (intent.reply or "").lower())
        self.assertFalse(intent.questions)

    def test_small_talk_is_greeting(self) -> None:
        intent = classify_intent(IntentAgentInput(prompt="hi how are you"))
        self.assertEqual(intent.phase, "greeting")
        self.assertFalse(intent.questions)

    def test_hello_plus_build_asks_questions(self) -> None:
        intent = classify_intent(
            IntentAgentInput(prompt="hi can you build a calculator")
        )
        self.assertEqual(intent.phase, "clarify")
        self.assertGreaterEqual(len(intent.questions or []), 2)
        self.assertLessEqual(len(intent.questions or []), 4)

    def test_build_website_after_hey_asks_questions(self) -> None:
        intent = classify_intent(
            IntentAgentInput(
                prompt="can you build a website",
                conversation=[
                    ConversationTurn(role="user", text="hey"),
                    ConversationTurn(
                        role="assistant",
                        text="Hey — what should we build?",
                    ),
                ],
            )
        )
        self.assertEqual(intent.phase, "clarify")
        self.assertGreaterEqual(len(intent.questions or []), 2)
        self.assertFalse(re.search(r"what should we build", intent.reply or "", re.I))

    def test_gemini_greeting_on_first_build_is_forced_to_clarify(self) -> None:
        fake = IntentAgentOutput(
            kind="new",
            stack="react",
            summary="Chat greeting",
            phase="greeting",
            reply="Hey — what should we build?",
            questions=[],
        )
        intent = _enforce_rules(
            fake,
            IntentAgentInput(
                prompt="can you build a website",
                conversation=[
                    ConversationTurn(role="user", text="hey"),
                    ConversationTurn(
                        role="assistant",
                        text="Hey — what should we build?",
                    ),
                ],
            ),
        )
        self.assertEqual(intent.phase, "clarify")
        self.assertGreaterEqual(len(intent.questions or []), 2)
        self.assertFalse(re.search(r"what should we build", intent.reply or "", re.I))

    def test_build_website_after_hi_asks_questions(self) -> None:
        intent = classify_intent(
            IntentAgentInput(
                prompt="can you build a website",
                conversation=[
                    ConversationTurn(role="user", text="hi"),
                    ConversationTurn(
                        role="assistant",
                        text="Hi — how can I help you today? Tell me what you'd like to build.",
                    ),
                ],
            )
        )
        self.assertEqual(intent.phase, "clarify")
        self.assertGreaterEqual(len(intent.questions or []), 2)
        self.assertFalse(re.search(r"how can i help you today", intent.reply or "", re.I))

    def test_build_request_asks_questions(self) -> None:
        intent = classify_intent(
            IntentAgentInput(prompt="can you build a json converter")
        )
        self.assertEqual(intent.kind, "new")
        self.assertEqual(intent.phase, "clarify")
        self.assertGreaterEqual(len(intent.questions or []), 2)
        self.assertLessEqual(len(intent.questions or []), 4)
        self.assertNotIn("1.", intent.reply or "")

    def test_build_website_asks_questions(self) -> None:
        intent = classify_intent(IntentAgentInput(prompt="can you build a website"))
        self.assertEqual(intent.phase, "clarify")
        self.assertGreaterEqual(len(intent.questions or []), 2)
        self.assertNotRegex(intent.reply or "", r"how can i help you today")

    def test_library_app_after_hey_asks_questions(self) -> None:
        intent = classify_intent(
            IntentAgentInput(
                prompt="can you build an library app",
                conversation=[
                    ConversationTurn(role="user", text="hey"),
                    ConversationTurn(role="assistant", text="Hey — what should we build?"),
                ],
            )
        )
        self.assertEqual(intent.phase, "clarify")
        self.assertGreaterEqual(len(intent.questions or []), 2)
        self.assertFalse(re.search(r"what should we build", intent.reply or "", re.I))

    def test_typo_built_calculator_asks_questions(self) -> None:
        intent = classify_intent(
            IntentAgentInput(prompt="can you built a calculator")
        )
        self.assertEqual(intent.phase, "clarify")
        self.assertGreaterEqual(len(intent.questions or []), 2)

    def test_answers_make_ready(self) -> None:
        intent = classify_intent(
            IntentAgentInput(
                prompt="Excel in, JSON file out, no extra mapping",
                conversation=[
                    ConversationTurn(role="user", text="build a json converter"),
                    ConversationTurn(
                        role="assistant",
                        text=(
                            "A converter is doable.\n"
                            "1. What is the input format (Excel, CSV, JSON, text)?\n"
                            "2. What should the output look like, and should they download a file?\n"
                            "3. Any mapping rules or sample rows I should follow?"
                        ),
                    ),
                ],
            )
        )
        self.assertEqual(intent.phase, "ready")
        self.assertFalse(intent.questions)

    def test_short_answer_keeps_asking(self) -> None:
        intent = classify_intent(
            IntentAgentInput(
                prompt="excel",
                conversation=[
                    ConversationTurn(role="user", text="build a json converter"),
                    ConversationTurn(
                        role="assistant",
                        text=(
                            "A converter is doable.\n"
                            "1. What is the input format (Excel, CSV, JSON, text)?\n"
                            "2. What should the output look like, and should they download a file?\n"
                            "3. Any mapping rules or sample rows I should follow?"
                        ),
                    ),
                ],
            )
        )
        self.assertEqual(intent.phase, "clarify")
        self.assertGreaterEqual(len(intent.questions or []), 2)

    def test_just_build_it_is_ready(self) -> None:
        intent = classify_intent(
            IntentAgentInput(
                prompt="just build it",
                conversation=[
                    ConversationTurn(role="user", text="build a calculator"),
                    ConversationTurn(role="assistant", text="1. Which operations?"),
                ],
            )
        )
        self.assertEqual(intent.phase, "ready")

    def test_fullstack_prompt(self) -> None:
        intent = classify_intent(
            IntentAgentInput(prompt="Create a support bot with a FastAPI backend")
        )
        self.assertEqual(intent.kind, "new")
        self.assertEqual(intent.stack, "fullstack")
        self.assertEqual(intent.phase, "clarify")

    def test_modify_without_files_or_tool_id_is_new(self) -> None:
        intent = classify_intent(
            IntentAgentInput(prompt="Change the button color to blue")
        )
        self.assertEqual(intent.kind, "new")
        self.assertIsNone(intent.toolId)

    def test_modify_requires_tool_id(self) -> None:
        intent = classify_intent(
            IntentAgentInput(
                prompt="Change the button color to blue",
                toolId="tool-abc",
            )
        )
        self.assertEqual(intent.kind, "modify")
        self.assertEqual(intent.phase, "ready")
        self.assertEqual(intent.toolId, "tool-abc")
        self.assertEqual(intent.stack, "react")

    def test_modify_requires_filemap(self) -> None:
        intent = classify_intent(
            IntentAgentInput(
                prompt="Tweak the heading copy",
                files={"src/App.tsx": "export default function App() { return <h1/> }"},
            )
        )
        self.assertEqual(intent.kind, "modify")
        self.assertEqual(intent.phase, "ready")

    def test_output_is_intent_shape(self) -> None:
        output = classify_intent(IntentAgentInput(prompt="Make a timer widget"))
        self.assertIsInstance(output, IntentAgentOutput)
        dumped = output.model_dump(exclude_none=True)
        self.assertTrue({"kind", "stack", "summary", "phase", "reply"} <= set(dumped))
        frozen = output.as_intent()
        self.assertIsInstance(frozen, Intent)
        self.assertEqual(set(frozen.model_dump(exclude_none=True)), {"kind", "stack", "summary"})

    def test_frozen_intent_rejects_chat_fields(self) -> None:
        from pydantic import ValidationError

        with self.assertRaises(ValidationError):
            Intent.model_validate(
                {
                    "kind": "new",
                    "stack": "react",
                    "summary": "Timer",
                    "phase": "ready",
                }
            )

    def test_does_not_import_docker_or_sandbox(self) -> None:
        path = Path(__file__).resolve().parents[1] / "terrarium_agents" / "intent.py"
        tree = ast.parse(path.read_text(encoding="utf-8"))
        imported: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imported.update(alias.name.split(".")[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                imported.add(node.module.split(".")[0])
        self.assertNotIn("docker", imported)
        self.assertNotIn("terrarium_sandbox", imported)


if __name__ == "__main__":
    unittest.main()
