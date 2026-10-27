from __future__ import annotations

import json
import unittest

from terrarium_agents.brownie_projects import ASSETS, PROJECTS
from terrarium_agents.brownie_reuse import PublishedProject, resolve_reuse
from terrarium_agents.sap_fiori import detect_domain, fiori_cap_files


def published() -> dict[str, PublishedProject]:
    return {
        key: PublishedProject(tool_id=f"brownie-{key}", tool_name=project.name, version_number=1, files=dict(project.files))
        for key, project in PROJECTS.items()
    }


class SapFioriTests(unittest.TestCase):
    def test_detects_the_business_process(self) -> None:
        self.assertEqual(detect_domain("Purchase requisition approval").key, "requisition")
        self.assertEqual(detect_domain("Cycle count reconciliation for the warehouse").key, "inventory")
        self.assertEqual(detect_domain("Vendor invoice three-way match").key, "invoice")
        self.assertIsNone(detect_domain("A recipe planner"))

    def test_generated_app_is_secure_by_default(self) -> None:
        files = fiori_cap_files("Purchase requisition approval")
        assert files is not None
        cds = files["backend/srv/procurement-service.cds"]
        self.assertTrue(cds.startswith("@requires: 'authenticated-user'"))
        self.assertIn("backend/srv/lib/approval-rules.js", files)
        rc = json.loads(files["backend/.cdsrc.json"])
        self.assertEqual(rc["requires"]["auth"]["[production]"]["kind"], "xsuaa")
        roles = {item["name"] for item in json.loads(files["backend/xs-security.json"])["role-templates"]}
        self.assertIn("FinanceController", roles)
        manifest = json.loads(files["frontend/webapp/manifest.json"])
        self.assertEqual(manifest["sap.app"]["dataSources"]["mainService"]["uri"], "/odata/v4/procurement/")

    def test_reused_modules_replace_generated_ones(self) -> None:
        plan = resolve_reuse(
            ["sap-approval-rules", "sap-audit-trail", "sap-status-formatter"],
            published=published(),
            backend_stack="sap-cap",
        )
        self.assertEqual(sorted(plan.applied_ids), ["sap-approval-rules", "sap-audit-trail", "sap-status-formatter"])
        files = fiori_cap_files("Purchase requisition approval", reused=plan.files)
        assert files is not None
        service = files["backend/srv/procurement-service.js"]
        self.assertIn("./reused/contoso-procurement/lib/approval-rules", service)
        self.assertIn("./reused/contoso-procurement/lib/audit-log", service)
        self.assertNotIn("backend/srv/lib/approval-rules.js", files)
        self.assertIn(
            "terrarium/fiori/reused/contoso-procurement/model/formatter",
            files["frontend/webapp/controller/App.controller.js"],
        )
        source = PROJECTS["contoso-procurement"].files["backend/srv/lib/approval-rules.js"]
        self.assertEqual(files["backend/srv/reused/contoso-procurement/lib/approval-rules.js"], source)

    def test_sap_parts_need_a_cap_backend(self) -> None:
        plan = resolve_reuse(["sap-approval-rules"], published=published(), backend_stack="node-express")
        self.assertEqual(plan.applied_ids, [])
        self.assertIn("SAP CAP", dict(plan.ignored)["sap-approval-rules"])

    def test_trust_blocked_parts_are_refused(self) -> None:
        plan = resolve_reuse(
            ["sap-stock-adjustment"],
            published=published(),
            backend_stack="sap-cap",
            blocked={"sap-stock-adjustment": "Trust card fails."},
        )
        self.assertEqual(plan.applied_ids, [])
        self.assertEqual(dict(plan.ignored)["sap-stock-adjustment"], "Trust card fails.")

    def test_every_sap_asset_points_at_a_real_file(self) -> None:
        for asset in ASSETS.values():
            if asset.stack == "sapui5":
                for path in asset.files:
                    self.assertIn(path, PROJECTS[asset.project_key].files, asset.asset_id)


if __name__ == "__main__":
    unittest.main()
