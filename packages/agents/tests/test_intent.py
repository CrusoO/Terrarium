from __future__ import annotations

import ast
from pathlib import Path
import os
import re
import unittest

from terrarium_agents.intent import _enforce_rules, build_clarify_question_items, classify_intent
from terrarium_contracts import ConversationTurn, Intent, IntentAgentInput, IntentAgentOutput


class IntentAgentTests(unittest.TestCase):
    def setUp(self) -> None:
        os.environ["TERRARIUM_AGENTS"] = "stub"

    def assert_six_everyday(self, questions: list[str] | None) -> None:
        self.assertEqual(len(questions or []), 6)
        blob = " ".join(questions or []).lower()
        for banned in (
            "frontend",
            "backend",
            "fullstack",
            " api",
            "database",
            "vite",
            "jwt",
            "localstorage",
        ):
            self.assertNotIn(banned, blob)

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
        self.assert_six_everyday(intent.questions)

    def test_greeting_plus_typo_build_request_is_not_greeting(self) -> None:
        intent = classify_intent(
            IntentAgentInput(prompt="hi buid me a websit like amazon")
        )
        self.assertEqual(intent.phase, "clarify")
        self.assert_six_everyday(intent.questions)
        self.assertFalse(re.search(r"what should we build", intent.reply or "", re.I))

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
        self.assert_six_everyday(intent.questions)
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
        self.assert_six_everyday(intent.questions)
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
        self.assert_six_everyday(intent.questions)
        self.assertFalse(re.search(r"how can i help you today", intent.reply or "", re.I))

    def test_build_request_asks_questions(self) -> None:
        intent = classify_intent(
            IntentAgentInput(prompt="can you build a json converter")
        )
        self.assertEqual(intent.kind, "new")
        self.assertEqual(intent.phase, "clarify")
        self.assert_six_everyday(intent.questions)
        self.assertNotIn("1.", intent.reply or "")

    def test_build_website_asks_questions(self) -> None:
        intent = classify_intent(IntentAgentInput(prompt="can you build a website"))
        self.assertEqual(intent.phase, "clarify")
        self.assert_six_everyday(intent.questions)
        self.assertNotRegex(intent.reply or "", r"how can i help you today")

    def test_clarify_includes_quick_pick_options(self) -> None:
        intent = classify_intent(IntentAgentInput(prompt="can you build a website"))
        self.assertEqual(intent.phase, "clarify")
        self.assertIsNotNone(intent.questionItems)
        items = intent.questionItems or []
        self.assertEqual(len(items), 6)
        # The 6th (last) item is the dedicated stack selector
        stack_item = items[-1]
        self.assertTrue(stack_item.isStackSelector)
        choice_values = [c.value for c in (stack_item.choices or [])]
        self.assertIn("react", choice_values)
        self.assertIn("angular", choice_values)
        self.assertIn("sapui5", choice_values)
        for item in items:
            self.assertGreaterEqual(len(item.options or []), 3)

    def test_business_questions_offer_plain_answer_chips(self) -> None:
        items = build_clarify_question_items(
            ["What will people start with — a spreadsheet or copied text?"],
            "excel to json converter",
        )
        self.assertEqual(len(items), 6)
        sell = next(item for item in items if item.text == "What does your business sell?")
        self.assertTrue(sell.acceptsFiles)
        self.assertTrue(sell.allowMultiple)
        choices = sell.choices or []
        self.assertEqual(len(choices), 5)
        titles = " ".join(c.title for c in choices).lower()
        self.assertIn("clothing", titles)
        self.assertNotIn("upload", titles)

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
        self.assert_six_everyday(intent.questions)
        self.assertFalse(re.search(r"what should we build", intent.reply or "", re.I))

    def test_typo_built_calculator_asks_questions(self) -> None:
        intent = classify_intent(
            IntentAgentInput(prompt="can you built a calculator")
        )
        self.assertEqual(intent.phase, "clarify")
        self.assert_six_everyday(intent.questions)

    def test_answers_make_ready(self) -> None:
        intent = classify_intent(
            IntentAgentInput(
                prompt="React. Excel in, JSON file out, no extra mapping",
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
        self.assert_six_everyday(intent.questions)

    def test_just_build_it_is_ready(self) -> None:
        intent = classify_intent(
            IntentAgentInput(
                prompt="React — just build it",
                conversation=[
                    ConversationTurn(role="user", text="build a calculator"),
                    ConversationTurn(role="assistant", text="1. Which operations?"),
                ],
            )
        )
        self.assertEqual(intent.phase, "ready")
        self.assertEqual(intent.backendStack, "node-express")
        self.assertEqual(intent.stack, "fullstack")

    def test_frontend_only_answer_overrides_fullstack_default(self) -> None:
        intent = classify_intent(
            IntentAgentInput(
                prompt="React, just this screen — no server. Just build it",
                conversation=[
                    ConversationTurn(role="user", text="build a calculator"),
                    ConversationTurn(role="assistant", text="1. Which operations?"),
                ],
            )
        )
        self.assertEqual(intent.phase, "ready")
        self.assertEqual(intent.backendStack, "none")

    def test_fullstack_prompt(self) -> None:
        intent = classify_intent(
            IntentAgentInput(prompt="Create a support bot with a FastAPI backend")
        )
        self.assertEqual(intent.kind, "new")
        self.assertEqual(intent.phase, "clarify")
        self.assertEqual(intent.frontendStack, "react")
        self.assertEqual(intent.backendStack, "none")

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
        self.assertEqual(
            set(frozen.model_dump(exclude_none=True)),
            {"kind", "stack", "summary", "frontendStack", "backendStack"},
        )

    def test_first_prompt_does_not_guess_stack(self) -> None:
        angular = classify_intent(IntentAgentInput(prompt="build an angular movie poster site"))
        self.assertEqual(angular.phase, "clarify")
        self.assertEqual(angular.frontendStack, "react")
        catalog = classify_intent(
            IntentAgentInput(
                prompt="Build a Fiori catalog app with SAP CAP OData mock data. Show items from the service and their status."
            )
        )
        self.assertEqual(catalog.phase, "clarify")
        self.assertEqual(catalog.frontendStack, "react")
        self.assertEqual(catalog.backendStack, "none")

    def test_clarify_stack_pick_selects_frontend(self) -> None:
        angular = classify_intent(
            IntentAgentInput(
                prompt="Angular",
                conversation=[
                    ConversationTurn(role="user", text="build a movie poster site"),
                    ConversationTurn(role="assistant", text="Which kind of app should we build?"),
                ],
            )
        )
        self.assertEqual(angular.frontendStack, "angular")
        fiori = classify_intent(
            IntentAgentInput(
                prompt="SAP Fiori\nYes — SAP CAP OData",
                conversation=[
                    ConversationTurn(role="user", text="build a catalog app"),
                    ConversationTurn(role="assistant", text="Which kind of app should we build?"),
                ],
            )
        )
        self.assertEqual(fiori.frontendStack, "sapui5")
        self.assertEqual(fiori.backendStack, "sap-cap")
        llm_said_ready = _enforce_rules(
            IntentAgentOutput(
                kind="new",
                stack="react",
                summary="Fiori catalog",
                phase="ready",
                reply="Building it.",
                frontendStack="sapui5",
                backendStack="none",
            ),
            IntentAgentInput(
                prompt="Build a Fiori catalog app with SAP CAP OData mock data.",
            ),
        )
        self.assertEqual(llm_said_ready.phase, "clarify")
        self.assertEqual(llm_said_ready.frontendStack, "react")

    def test_backend_need_selection_overrides_auto_heuristic(self) -> None:
        auto = classify_intent(
            IntentAgentInput(
                prompt="Build shared team notes with login",
                frontendStack="react",
                backendNeed="auto",
            )
        )
        self.assertEqual(auto.stack, "fullstack")
        self.assertEqual(auto.backendStack, "node-express")

        no_backend = classify_intent(
            IntentAgentInput(
                prompt="Build shared team notes with login",
                frontendStack="react",
                backendNeed="no",
            )
        )
        self.assertEqual(no_backend.stack, "react")
        self.assertEqual(no_backend.backendStack, "none")

    def test_backend_need_is_inferred_from_clarification_answer(self) -> None:
        with_backend = classify_intent(
            IntentAgentInput(
                prompt="React. It needs login and shared database",
                conversation=[
                    ConversationTurn(role="user", text="build a team notes app"),
                    ConversationTurn(
                        role="assistant",
                        text="Should this be frontend-only, or should I include a backend?",
                    ),
                ],
            )
        )
        self.assertEqual(with_backend.phase, "ready")
        self.assertEqual(with_backend.backendStack, "node-express")

        frontend_only = classify_intent(
            IntentAgentInput(
                prompt="React, frontend-only with localStorage",
                conversation=[
                    ConversationTurn(role="user", text="build a team notes app"),
                    ConversationTurn(
                        role="assistant",
                        text="Should this be frontend-only, or should I include a backend?",
                    ),
                ],
            )
        )
        self.assertEqual(frontend_only.phase, "ready")
        self.assertEqual(frontend_only.backendStack, "none")

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

    def test_live_mode_keeps_llm_questions_and_does_not_inject_stub_bank(self) -> None:
        os.environ["TERRARIUM_AGENTS"] = "live"
        try:
            fake = IntentAgentOutput(
                kind="new",
                stack="react",
                summary="Library app",
                phase="clarify",
                reply="A library app is doable. I need a few details.",
                questions=[
                    "Should patrons search by title, author, or ISBN?",
                    "Do you need checkout and due dates?",
                    "Who can add new books — staff only, or anyone?",
                ],
            )
            intent = _enforce_rules(fake, IntentAgentInput(prompt="can you build a library app"))
            self.assertEqual(intent.phase, "clarify")
            self.assertEqual(
                intent.questions,
                [
                    "Should patrons search by title, author, or ISBN?",
                    "Do you need checkout and due dates?",
                    "Who can add new books — staff only, or anyone?",
                ],
            )
            self.assertFalse(
                any("landing page" in (item or "").lower() for item in (intent.questions or []))
            )
        finally:
            os.environ["TERRARIUM_AGENTS"] = "stub"

    def test_live_clarify_without_questions_gets_safety_questions(self) -> None:
        os.environ["TERRARIUM_AGENTS"] = "live"
        try:
            fake = IntentAgentOutput(
                kind="new",
                stack="react",
                summary="Markdown notepad",
                phase="clarify",
                reply="I can build that. A few details so the first preview matches.",
                questions=[],
            )
            intent = _enforce_rules(
                fake,
                IntentAgentInput(prompt="Build a simple markdown notepad"),
            )
            self.assertEqual(intent.phase, "clarify")
            self.assertEqual(len(intent.questions or []), 6)
        finally:
            os.environ["TERRARIUM_AGENTS"] = "stub"

    def test_long_answer_to_questions_becomes_ready(self) -> None:
        intent = classify_intent(
            IntentAgentInput(
                prompt=(
                    "React. Use a split markdown editor with localStorage autosave, "
                    "live preview, and export markdown. Keep it modern."
                ),
                conversation=[
                    ConversationTurn(role="user", text="build a notepad"),
                    ConversationTurn(
                        role="assistant",
                        text=(
                            "I can build that.\n"
                            "1. What is the main job this tool should do in one sentence?\n"
                            "2. What does the user type or upload?\n"
                            "3. What should they get back on screen?"
                        ),
                    ),
                ],
            )
        )
        self.assertEqual(intent.phase, "ready")
        self.assertFalse(intent.questions)

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
