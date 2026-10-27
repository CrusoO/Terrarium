from __future__ import annotations

import json
import unittest

from terrarium_agents.brownie_projects import PROJECTS
from terrarium_api.trust.app_fix import file_diffs, fix_all
from terrarium_api.trust.app_report import (
    TestCase,
    TestRun,
    blocked_files,
    build_report,
    failed_checks,
    parse_tap,
    score_checks,
)

TAP = """### TERRARIUM FILE backend/test/three-way-match.test.js
TAP version 13
# Subtest: a matched invoice
ok 1 - a matched invoice
  ---
  duration_ms: 0.61
  ...
# Subtest: an invoice exactly at the 2% tolerance is matched
not ok 2 - an invoice exactly at the 2% tolerance is matched
  ---
  duration_ms: 1.2
  location: '/work/backend/test/three-way-match.test.js:11:1'
  failureType: 'testCodeFailure'
  error: |-
    Expected values to be strictly equal:

    'Mismatch' !== 'Matched'
  code: 'ERR_ASSERTION'
  expected: 'Matched'
  actual: 'Mismatch'
  ...
1..2
"""


def runner_from(outcomes: dict[str, bool]):
    def run(files, paths):
        return TestRun(
            status="ran",
            results={path: [TestCase(name=f"{path} rule", ok=outcomes.get(path, True))] for path in paths},
        )

    return run


def report(key: str, files=None, runner=None):
    return build_report(
        files or PROJECTS[key].files,
        tool_id=key,
        version_id="v1",
        version_number=1,
        runner=runner or runner_from({}),
        use_cache=False,
    )


def by_id(result) -> dict[str, dict]:
    return {check["id"]: check for check in result["checks"]}


class TapTests(unittest.TestCase):
    def test_parses_pass_fail_line_and_assertion(self) -> None:
        cases = parse_tap(TAP)["backend/test/three-way-match.test.js"]
        self.assertEqual([case.ok for case in cases], [True, False])
        self.assertEqual(cases[1].line, 11)
        self.assertIn("expected 'Matched', got 'Mismatch'", cases[1].error)


class ReportTests(unittest.TestCase):
    def test_clean_sap_project_is_healthy(self) -> None:
        result = report("contoso-procurement")
        self.assertEqual((result["score"], result["grade"], result["status"]), (100, "A", "healthy"))
        self.assertGreaterEqual(result["security"]["passed"], 8)
        self.assertIn("segregation-of-duties", {root["id"] for root in result["rootProblems"]})

    def test_fabrikam_flaws_are_located_and_scored(self) -> None:
        result = report("fabrikam-inventory")
        checks = by_id(result)
        self.assertEqual(checks["cap-authorization"]["status"], "failed")
        self.assertEqual(checks["cap-authorization"]["evidence"][0]["file"], "backend/srv/inventory-service.cds")
        self.assertEqual(checks["string-queries"]["evidence"][0]["file"], "backend/srv/lib/stock-adjustment.js")
        self.assertIn("UPDATE", checks["string-queries"]["evidence"][0]["snippet"])
        self.assertEqual(checks["payload-logging"]["status"], "failed")
        self.assertEqual((result["score"], result["status"]), (52, "unsafe"))
        self.assertIn("backend/srv/lib/stock-adjustment.js", blocked_files(result))
        self.assertNotIn("backend/srv/lib/variance.js", blocked_files(result))

    def test_tailspin_secret_is_masked_and_advisory_located(self) -> None:
        result = report("tailspin-invoice-match", runner=runner_from({"backend/test/three-way-match.test.js": False}))
        checks = by_id(result)
        secret = checks["secrets"]
        self.assertEqual(secret["severity"], "critical")
        self.assertNotIn("Tsp!nv", json.dumps(secret, ensure_ascii=False))
        self.assertIn("••••••", secret["evidence"][0]["snippet"])
        self.assertIn("backend/srv/lib/s4-client.js", secret["related"])
        self.assertEqual(checks["dependencies"]["evidence"][0]["file"], "backend/package.json")
        self.assertEqual(result["status"], "unsafe")
        self.assertLess(result["score"], 40)

    def test_missing_runner_skips_tests_instead_of_passing_them(self) -> None:
        result = report(
            "contoso-procurement",
            runner=lambda files, paths: TestRun(status="unavailable", detail="Docker is not reachable"),
        )
        self.assertEqual(by_id(result)["unit-tests"]["status"], "skipped")

    def test_score_weights(self) -> None:
        from terrarium_api.trust.app_report import Check

        checks = [
            Check("a", "security", "a", "failed", "critical", "", "static"),
            Check("b", "functional", "b", "failed", "medium", "", "node:test"),
        ]
        self.assertEqual(score_checks(checks), (55, "D", "unsafe"))


class FixTests(unittest.TestCase):
    def test_codemods_fix_fabrikam_and_keep_tests_untouched(self) -> None:
        files = PROJECTS["fabrikam-inventory"].files
        before = report("fabrikam-inventory")
        outcome = fix_all(files, failed_checks(before), editor=lambda current, checks: self.fail("editor not needed"))
        after = report("fabrikam-inventory", files=outcome.files)
        self.assertEqual((after["score"], after["status"]), (100, "healthy"))
        self.assertEqual({change.how for change in outcome.changes}, {"codemod"})
        adjustment = outcome.files["backend/srv/lib/stock-adjustment.js"]
        self.assertIn("UPDATE.entity('fabrikam.inventory.StockCounts')", adjustment)
        self.assertNotIn("${", adjustment)
        self.assertIn("@requires: 'authenticated-user'", outcome.files["backend/srv/inventory-service.cds"])
        rc = json.loads(outcome.files["backend/.cdsrc.json"])
        self.assertEqual(rc["requires"]["auth"]["[production]"]["kind"], "xsuaa")
        self.assertEqual(
            {path for path in files if "/test/" in path},
            {path for path in outcome.files if "/test/" in path and outcome.files[path] == files[path]},
        )

    def test_tailspin_uses_codemods_then_the_editor_for_the_failing_rule(self) -> None:
        files = PROJECTS["tailspin-invoice-match"].files
        failing = runner_from({"backend/test/three-way-match.test.js": False})
        before = report("tailspin-invoice-match", runner=failing)
        sent: list[str] = []

        def editor(current, checks):
            sent.extend(str(check["id"]) for check in checks)
            path = "backend/srv/lib/three-way-match.js"
            return {path: current[path].replace("< tolerancePct", "<= tolerancePct"), "backend/test/x.test.js": "hack"}, {
                "used": True,
                "model": "gemini-test",
            }

        outcome = fix_all(files, failed_checks(before), advisories={"@sap/xssec": "3.6.0"}, editor=editor)
        self.assertEqual(len(sent), 1)
        self.assertTrue(sent[0].startswith("test:"))
        self.assertNotIn("backend/default-env.json", outcome.files)
        self.assertIn("process.env.destinations", outcome.files["backend/srv/lib/s4-client.js"])
        self.assertIn("backend/default-env.json", outcome.files[".gitignore"])
        self.assertEqual(json.loads(outcome.files["backend/package.json"])["dependencies"]["@sap/xssec"], "^3.6.0")
        self.assertIn("<= tolerancePct", outcome.files["backend/srv/lib/three-way-match.js"])
        after = report("tailspin-invoice-match", files=outcome.files)
        self.assertEqual(after["status"], "healthy")
        diffs = {diff["path"]: diff for diff in file_diffs(files, outcome.files)}
        self.assertEqual(diffs["backend/default-env.json"]["status"], "deleted")
        self.assertIn("+  if (Math.abs(deltaPct) <= tolerancePct)", diffs["backend/srv/lib/three-way-match.js"]["diff"])


if __name__ == "__main__":
    unittest.main()
