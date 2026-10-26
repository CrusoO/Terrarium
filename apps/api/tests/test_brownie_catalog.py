from __future__ import annotations

import unittest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from terrarium_agents.brownie_projects import PROJECTS
from terrarium_api.brownie_catalog import (
    catalog,
    recommend_from_dashboard,
    reuse_from_dashboard,
    sync_projects,
    tool_id_for,
)
from terrarium_api.db import Base
from terrarium_api.models import ToolRecord, ToolVersionRecord

USER = {"id": "owner-1", "email": "Owner@Example.com"}


class BrownieCatalogTests(unittest.TestCase):
    def setUp(self) -> None:
        engine = create_engine("sqlite://")
        Base.metadata.create_all(engine)
        self.db = sessionmaker(bind=engine, expire_on_commit=False)()
        self.addCleanup(self.db.close)

    def test_sync_publishes_three_private_tools_once(self) -> None:
        sync_projects(self.db, USER)
        sync_projects(self.db, USER)
        tools = self.db.query(ToolRecord).all()
        self.assertEqual(len(tools), 3)
        self.assertTrue(all(tool.owner_id == "owner-1" and tool.visibility == "private" for tool in tools))
        self.assertEqual(self.db.query(ToolVersionRecord).count(), 3)

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
        self.assertIn("commerce-product-card", recommendation["recommendedAssetIds"])
        self.assertIn("commerce-notification-service", recommendation["recommendedAssetIds"])
        self.assertTrue(all("sha256" in file for item in recommendation["recommended"] for file in item["files"]))


if __name__ == "__main__":
    unittest.main()
