from __future__ import annotations

import unittest
from pathlib import Path

from terrarium_agents.tagged_files import TaggedFileParser, closed_file_prefix, stream_file_status

_LEAKED = (
    Path(__file__).resolve().parents[3] / "docs" / "codegen-metrics" / "per-file-apps" / "monolith"
)


class TaggedFileParserTests(unittest.TestCase):
    def test_incremental_two_files(self) -> None:
        completed: list[tuple[str, str]] = []
        parser = TaggedFileParser(on_file=lambda p, c: completed.append((p, c)))
        parser.feed('<<<FILE path="index.html">>>\n')
        parser.feed("<html>hi</html>\n")
        self.assertEqual(completed, [])
        parser.feed("<<<END FILE>>>\n<<<FILE path=\"src/App.jsx\">>>\nexport default 1\n")
        self.assertEqual(len(completed), 1)
        self.assertEqual(completed[0][0], "index.html")
        parser.feed("<<<END FILE>>>")
        self.assertEqual(len(completed), 2)
        self.assertEqual(completed[1][0], "src/App.jsx")
        self.assertIn("export default 1", completed[1][1])

    def test_cut_file_is_reported(self) -> None:
        text = '<<<FILE path="src/App.jsx">>>\nexport default function App() {\n'
        status = stream_file_status(text, stop_reason="max_tokens", output_tokens=16000)
        self.assertEqual(status["stopReason"], "max_tokens")
        self.assertFalse(status["lastFileClosed"])
        self.assertTrue(status["fileCut"])
        self.assertEqual(status["openPath"], "src/App.jsx")

    def test_closed_prefix_drops_cut_tail(self) -> None:
        text = (
            '<<<FILE path="src/App.jsx">>>\nexport default 1\n<<<END FILE>>>\n'
            '<<<FILE path="src/Cut.jsx">>>\nexport default function Cut() {\n'
        )
        prefix, paths = closed_file_prefix(text)
        self.assertEqual(paths, ["src/App.jsx"])
        self.assertIn("<<<END FILE>>>", prefix)
        self.assertNotIn("src/Cut.jsx", prefix)
        parser = TaggedFileParser()
        parser.feed(text)
        parser.drop_open()
        self.assertIsNone(parser._open_path)
        self.assertEqual(list(parser.files), ["src/App.jsx"])
        self.assertEqual(parser.buffer, "")

    def test_leaked_file_marker_starts_the_next_file(self) -> None:
        text = (
            '<<<FILE path="src/components/DailyTotals.jsx">>>\n'
            "export const first = 1\n"
            '<<<FILE path="src/components/DailyTotals.jsx">>>\n'
            "export const second = 2\n"
            "<<<END FILE>>>"
        )
        parser = TaggedFileParser()
        parser.feed(text)
        body = parser.files["src/components/DailyTotals.jsx"]
        self.assertNotIn("<<<FILE", body)
        self.assertIn("export const second = 2", body)
        self.assertNotIn("export const first = 1", body)

    def test_replay_four_monolith_files_with_leaked_markers(self) -> None:
        paths = [
            _LEAKED / "orders" / "src" / "components" / "DailyTotals.jsx",
            _LEAKED / "catalogue" / "src" / "components" / "CartDrawer.jsx",
            _LEAKED / "inventory" / "src" / "components" / "AddItemModal.jsx",
            _LEAKED / "roster" / "src" / "components" / "AddStudentModal.module.css",
        ]
        for path in paths:
            body = path.read_text(encoding="utf-8")
            self.assertIn("<<<FILE", body)
            stream = f'<<<FILE path="src/replay.txt">>>\n{body}\n<<<END FILE>>>'
            parser = TaggedFileParser()
            parser.feed(stream)
            files = parser.finish()
            self.assertGreaterEqual(len(files), 2)
            for content in files.values():
                self.assertNotIn("<<<FILE", content)
                self.assertNotIn("<<<END FILE>>>", content)


if __name__ == "__main__":
    unittest.main()
