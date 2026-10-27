from __future__ import annotations

import unittest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from terrarium_agents.brownie_projects import PROJECTS
from terrarium_api import brownie_catalog
from terrarium_api.brownie_catalog import (
    DEMO_PROMPT,
    catalog,
    recommend_from_dashboard,
    restore_project,
    reuse_from_dashboard,
    sync_projects,
    tool_id_for,
)
from terrarium_api.db import Base
from terrarium_api.models import ToolRecord, ToolVersionRecord
from terrarium_api.trust.app_report import TestCase, TestRun

USER = {"id": "owner-1", "email": "Owner@Example.com"}


def fake_runner(files, paths):
    """Stands in for node --test: the three-way match tolerance test fails, as it does in the real run."""
    strict = "< tolerancePct" in files.get("backend/srv/lib/three-way-match.js", "")
    return TestRun(
        status="ran",
        results={path: [TestCase(name="rule holds", ok=not (strict and "three-way-match" in path))] for path in paths},
    )


class BrownieCatalogTests(unittest.TestCase):
    def setUp(self) -> None:
        engine = create_engine("sqlite://")
        Base.metadata.create_all(engine)
        self.db = sessionmaker(bind=engine, expire_on_commit=False)()
        self.addCleanup(self.db.close)
        brownie_catalog.trust_runner = fake_runner
        self.addCleanup(setattr, brownie_catalog, "trust_runner", None)

    def test_sync_publishes_every_private_tool_once(self) -> None:
        sync_projects(self.db, USER)
        sync_projects(self.db, USER)
        tools = self.db.query(ToolRecord).all()
        self.assertEqual(len(tools), len(PROJECTS))
        self.assertTrue(all(tool.owner_id == "owner-1" and tool.visibility == "private" for tool in tools))
        self.assertEqual(self.db.query(ToolVersionRecord).count(), len(PROJECTS))

    def test_sync_does_not_revert_a_trust_fix(self) -> None:
        sync_projects(self.db, USER)
        tool = self.db.get(ToolRecord, tool_id_for("owner-1", "fabrikam-inventory"))
        assert tool is not None
        fixed = dict(tool.versions[-1].files, **{"README.md": "fixed"})
        self.db.add(ToolVersionRecord(id="fix", tool_id=tool.id, version_number=2, prompt="Terrarium trust fix: 3", files=fixed))
        self.db.commit()
        sync_projects(self.db, USER)
        self.db.refresh(tool)
        self.assertEqual(tool.versions[-1].files["README.md"], "fixed")
        restored = restore_project(self.db, tool)
        assert restored is not None
        self.assertEqual(restored.version_number, 3)
        self.assertEqual(restored.prompt, DEMO_PROMPT)
        self.assertEqual(restored.files, PROJECTS["fabrikam-inventory"].files)

    def test_failing_trust_checks_block_reuse_of_the_parts_they_touch(self) -> None:
        sync_projects(self.db, USER)
        assets = {asset["id"]: asset for asset in catalog(self.db, "owner-1")["assets"]}
        self.assertTrue(assets["sap-approval-rules"]["reusable"])
        self.assertTrue(assets["sap-stock-variance"]["reusable"])
        for blocked in ("sap-stock-adjustment", "sap-three-way-match", "sap-s4-destination-client"):
            self.assertFalse(assets[blocked]["reusable"], blocked)
            self.assertTrue(assets[blocked]["trustBlocked"])
            self.assertIn("Fix it from Published apps", assets[blocked]["gateReason"])
        plan = reuse_from_dashboard(self.db, "owner-1", ["sap-stock-adjustment", "sap-stock-variance"], "sap-cap")
        self.assertEqual(plan.applied_ids, ["sap-stock-variance"])
        self.assertIn("trust card", dict(plan.ignored)["sap-stock-adjustment"])

    def test_sap_recommendation_picks_trusted_modules_for_the_process(self) -> None:
        sync_projects(self.db, USER)
        recommendation = recommend_from_dashboard(
            self.db,
            "owner-1",
            "Build a vendor invoice three-way match app for accounts payable",
            frontend_stack="sapui5",
        )
        self.assertEqual(recommendation["domain"], "Vendor invoice three-way match")
        self.assertTrue(all("SAP" in project["stack"] for project in recommendation["checkedProjects"]))
        self.assertNotIn("sap-three-way-match", recommendation["recommendedAssetIds"])
        self.assertIn("sap-audit-trail", recommendation["recommendedAssetIds"])
        self.assertNotIn("sap-approval-rules", recommendation["recommendedAssetIds"])
        held = {entry["assetId"]: entry for entry in recommendation["heldBack"]}
        self.assertTrue(held["sap-three-way-match"]["trustBlocked"])
        react = recommend_from_dashboard(self.db, "owner-1", "an approval app", frontend_stack="react")
        self.assertFalse(any(asset_id.startswith("sap-") for asset_id in react["recommendedAssetIds"]))

    def test_changed_project_files_add_a_new_live_version(self) -> None:
        sync_projects(self.db, USER)
        tool = self.db.get(ToolRecord, tool_id_for("owner-1", "acme-internal-pm"))
        assert tool is not None
        tool.versions[-1].files = {"README.md": "old"}
        self.db.commit()
        sync_projects(self.db, USER)
        self.db.refresh(tool)
        self.assertEqual([v.version_number for v in tool.versions], [1, 2])
        self.assertEqual([v.is_live for v in tool.versions], [False, True])

    def test_catalog_reports_reusable_assets_with_source_hashes(self) -> None:
        sync_projects(self.db, USER)
        data = catalog(self.db, "owner-1")
        assets = {asset["id"]: asset for asset in data["assets"]}
        self.assertTrue(assets["pm-auth-context"]["reusable"])
        self.assertEqual(assets["pm-auth-context"]["files"][0]["path"], "src/auth/AuthContext.jsx")
        self.assertTrue(assets["pm-auth-context"]["files"][0]["sha256"])
        self.assertFalse(assets["support-ticket-workflow"]["reusable"])
        self.assertEqual(catalog(self.db, "someone-else")["projects"][0]["published"], False)

    def test_reuse_reads_the_stored_dashboard_bytes(self) -> None:
        sync_projects(self.db, USER)
        tool = self.db.get(ToolRecord, tool_id_for("owner-1", "northstar-commerce"))
        assert tool is not None
        files = dict(tool.versions[-1].files)
        files["frontend/src/catalog/ProductCard.jsx"] += "\n// owner edit\n"
        tool.versions[-1].files = files
        self.db.commit()
        plan = reuse_from_dashboard(self.db, "owner-1", ["commerce-product-card"], "none")
        body = plan.files["src/reused/northstar-commerce/catalog/ProductCard.jsx"]
        self.assertIn("owner edit", body)
        self.assertNotEqual(body, PROJECTS["northstar-commerce"].files["frontend/src/catalog/ProductCard.jsx"])

    def test_other_users_cannot_reuse_my_projects(self) -> None:
        sync_projects(self.db, USER)
        plan = reuse_from_dashboard(self.db, "intruder", ["pm-auth-context"], "none")
        self.assertEqual(plan.applied_ids, [])
        self.assertIn("not published", dict(plan.ignored)["pm-auth-context"])

    def test_recommendation_uses_published_dashboard_catalog(self) -> None:
        sync_projects(self.db, USER)
        recommendation = recommend_from_dashboard(
            self.db,
            "owner-1",
            "Build a commerce storefront with a product catalog, cart, checkout, and order notifications.",
            frontend_stack="react",
        )
        self.assertEqual(recommendation["source"], "dashboard-catalog")
        self.assertEqual(len(recommendation["checkedProjects"]), 3)
        self.assertFalse(any(asset_id.startswith("sap-") for asset_id in recommendation["recommendedAssetIds"]))
        self.assertIn("commerce-product-card", recommendation["recommendedAssetIds"])
        self.assertIn("commerce-notification-service", recommendation["recommendedAssetIds"])
        self.assertTrue(all("sha256" in file for item in recommendation["recommended"] for file in item["files"]))


if __name__ == "__main__":
    unittest.main()
