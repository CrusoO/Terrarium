from __future__ import annotations

import ast
import os
from pathlib import Path
import unittest

from terrarium_agents.editor import EditorAgentError, run_editor
from terrarium_contracts import AgentJob, Intent


_MODIFY_INTENT = Intent(kind="modify", stack="react", summary="Change heading colour")
_EXISTING_FILES: dict[str, str] = {
    "src/App.tsx": "export default function App() { return <h1>Hello</h1>; }",
    "index.html": "<!doctype html><html></html>",
}


class EditorAgentTests(unittest.TestCase):
    def setUp(self) -> None:
        os.environ["TERRARIUM_AGENTS"] = "stub"

    # --- acceptance: kind=new rejected ---

    def test_new_intent_raises(self) -> None:
        job = AgentJob(
            sessionId="s1",
            intent=Intent(kind="new", stack="react", summary="Build a timer"),
            prompt="Build a timer widget",
            files=_EXISTING_FILES,
        )
        with self.assertRaises(EditorAgentError) as ctx:
            run_editor(job)
        self.assertIn("modify", str(ctx.exception).lower())

    # --- acceptance: files required ---

    def test_missing_files_raises(self) -> None:
        job = AgentJob(
            sessionId="s1",
            intent=_MODIFY_INTENT,
            prompt="Change heading to blue",
        )
        with self.assertRaises(EditorAgentError) as ctx:
            run_editor(job)
        self.assertIn("files", str(ctx.exception).lower())

    def test_empty_files_raises(self) -> None:
        job = AgentJob(
            sessionId="s1",
            intent=_MODIFY_INTENT,
            prompt="Change heading to blue",
            files={},
        )
        with self.assertRaises(EditorAgentError) as ctx:
            run_editor(job)
        self.assertIn("files", str(ctx.exception).lower())

    # --- acceptance: output FileMap ---

    def test_stub_returns_edit_marker(self) -> None:
        job = AgentJob(
            sessionId="s1",
            intent=_MODIFY_INTENT,
            prompt="Change the heading to blue",
            files=_EXISTING_FILES,
        )
        result = run_editor(job)
        self.assertIn("EDIT.md", result.files)
        self.assertIn("Change the heading to blue", result.files["EDIT.md"])

    def test_stub_commit_message_is_set(self) -> None:
        job = AgentJob(
            sessionId="s1",
            intent=_MODIFY_INTENT,
            prompt="Change the heading to blue",
            files=_EXISTING_FILES,
        )
        result = run_editor(job)
        self.assertTrue(result.commitMessage)
        self.assertLessEqual(len(result.commitMessage), 72)

    def test_stub_returns_only_changed_files(self) -> None:
        """Stub returns only EDIT.md; unchanged source files are not echoed back."""
        job = AgentJob(
            sessionId="s1",
            intent=_MODIFY_INTENT,
            prompt="Change heading to blue",
            files=_EXISTING_FILES,
        )
        result = run_editor(job)
        for path in _EXISTING_FILES:
            self.assertNotIn(path, result.files)

    # --- acceptance: does not call Docker ---

    def test_does_not_import_docker_or_sandbox(self) -> None:
        path = Path(__file__).resolve().parents[1] / "terrarium_agents" / "editor.py"
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
