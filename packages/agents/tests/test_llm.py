from __future__ import annotations

import unittest

from terrarium_agents.llm import _loads_object


class LlmParseTests(unittest.TestCase):
    def test_loads_json_object(self) -> None:
        parsed = _loads_object('{"files": {"index.html": "<html></html>"}}')
        self.assertEqual(parsed, {"files": {"index.html": "<html></html>"}})

    def test_strips_think_and_fences(self) -> None:
        parsed = _loads_object(
            "<think>planning</think>\n```json\n{\"index.html\": \"<html></html>\"}\n```"
        )
        self.assertEqual(parsed, {"index.html": "<html></html>"})


if __name__ == "__main__":
    unittest.main()
