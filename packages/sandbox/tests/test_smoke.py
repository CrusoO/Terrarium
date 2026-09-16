from __future__ import annotations

import unittest

from terrarium_sandbox.runner import (
    _smoke_report_from_output,
    _smoke_report_from_result,
    project_runtime,
)


class SmokeReportTests(unittest.TestCase):
    def test_display_only_page_can_pass(self) -> None:
        report = _smoke_report_from_result(
            {
                "ok": True,
                "checks": ["display-only page"],
                "title": "Landing page",
            }
        )

        self.assertEqual(report.status, "running")
        self.assertIn("display-only page", report.logs)

    def test_console_error_fails_with_healer_readable_logs(self) -> None:
        report = _smoke_report_from_result(
            {
                "ok": False,
                "failures": ["console.error: ReferenceError: total is not defined"],
                "checks": ["filled input", "submitted form"],
            }
        )

        self.assertEqual(report.status, "unhealthy")
        self.assertIn("ReferenceError", report.logs)
        self.assertIn("submitted form", report.logs)

    def test_prefixed_container_output_is_parsed(self) -> None:
        report = _smoke_report_from_output(
            1,
            "\n".join(
                [
                    "browser booting",
                    'TERRARIUM_SMOKE_RESULT {"ok":false,"failures":["page loaded with an empty body"],"checks":[]}',
                ]
            ),
        )

        self.assertEqual(report.status, "unhealthy")
        self.assertIn("empty body", report.logs)

    def test_missing_result_uses_container_logs(self) -> None:
        report = _smoke_report_from_output(1, "chromium crashed")

        self.assertEqual(report.status, "unhealthy")
        self.assertIn("chromium crashed", report.logs)

    def test_project_runtime_detects_static_react_and_fullstack(self) -> None:
        self.assertEqual(project_runtime({"index.html": "<html></html>"}), "static")
        self.assertEqual(
            project_runtime({"package.json": "{}", "src/main.jsx": ""}),
            "react",
        )
        self.assertEqual(
            project_runtime(
                {
                    "frontend/package.json": "{}",
                    "backend/package.json": "{}",
                    "frontend/src/main.jsx": "",
                }
            ),
            "react-node",
        )


if __name__ == "__main__":
    unittest.main()
