from __future__ import annotations

import unittest

from terrarium_agents.brownie_knowledge import (
    MockConfluenceConnector,
    MockJiraConnector,
    MockMailConnector,
    SCENARIOS,
    company_reading,
    match_scenario,
    search_steps,
)


class BrownieKnowledgeTests(unittest.TestCase):
    def test_prompts_pick_the_four_demo_scenarios(self) -> None:
        self.assertEqual(match_scenario("Build an SAP purchase requisition approval app").key, "sap-purchase-requisition")
        self.assertEqual(match_scenario("Build an SAP inventory reconciliation console").key, "sap-inventory-reconciliation")
        self.assertEqual(match_scenario("Build a commerce storefront with a cart").key, "commerce-operations")
        self.assertEqual(match_scenario("Build a field service work order tracker").key, "field-service-work-orders")
        self.assertIsNone(match_scenario("Build a recipe notebook"))

    def test_responses_use_the_real_service_shapes(self) -> None:
        scenario = SCENARIOS["sap-purchase-requisition"]
        call, search = MockConfluenceConnector(scenario).search(scenario.cql)
        self.assertEqual(call["tool"], "searchConfluenceUsingCql")
        self.assertEqual(search["cqlQuery"], scenario.cql)
        self.assertEqual(search["results"][0]["content"]["type"], "page")
        _call, page = MockConfluenceConnector(scenario).get_page(search["results"][0]["content"]["id"])
        self.assertEqual(page["body"]["storage"]["representation"], "storage")
        call, jira = MockJiraConnector(scenario).search(scenario.jql)
        self.assertEqual(call["tool"], "searchJiraIssuesUsingJql")
        self.assertEqual(jira["issues"][0]["fields"]["description"]["type"], "doc")
        call, mail = MockMailConnector(scenario).search(scenario.mail_search)
        self.assertEqual(call["tool"], "list-mail-messages")
        self.assertIn("@odata.context", mail)
        self.assertEqual(mail["value"][0]["body"]["contentType"], "text")

    def test_steps_extract_requirements_in_order(self) -> None:
        steps = list(search_steps("Build an SAP purchase requisition approval app"))
        self.assertEqual(
            [(stage, payload.get("source")) for stage, payload in steps],
            [
                ("query", "confluence"), ("results", "confluence"), ("extracted", "confluence"),
                ("query", "jira"), ("results", "jira"), ("extracted", "jira"),
                ("query", "mail"), ("results", "mail"), ("extracted", "mail"),
                ("done", None),
            ],
        )
        done = steps[-1][1]
        texts = [fact["text"] for fact in done["facts"]]
        self.assertIn("Requests above 25,000 EUR are approved last by the CFO.", texts)
        self.assertIn("Pending requests are sorted with the oldest first.", texts)
        self.assertIn("reference data", done["context"])

    def test_instruction_like_mail_lines_are_skipped(self) -> None:
        done = list(search_steps("Build a commerce storefront"))[-1][1]
        self.assertTrue(done["skipped"])
        self.assertNotIn("password", done["context"].lower())

    def test_reading_answers_secure_past_use_and_habits(self) -> None:
        done = list(search_steps("Build an SAP purchase requisition approval app"))[-1][1]
        reading = done["reading"]
        self.assertEqual(reading["secure"]["verdict"], "fits")
        self.assertEqual(reading["seenBefore"]["verdict"], "yes")
        self.assertIn("PR-142", reading["seenBefore"]["detail"])
        self.assertGreaterEqual(len(reading["practices"]), 3)
        self.assertEqual(
            [item["place"] for item in reading["whereKept"]],
            ["Confluence", "Jira", "Mail", "Project repos"],
        )
        commerce = company_reading(SCENARIOS["commerce-operations"], ["skipped"])
        self.assertEqual(commerce["secure"]["verdict"], "check")

    def test_unknown_prompt_searches_and_finds_nothing(self) -> None:
        steps = list(search_steps("Build a recipe notebook"))
        self.assertEqual(steps[1][1]["total"], 0)
        self.assertEqual(steps[-1][1]["factCount"], 0)
        self.assertEqual(steps[-1][1]["context"], "")
        self.assertEqual(steps[-1][1]["reading"]["secure"]["verdict"], "unknown")
        self.assertEqual(steps[-1][1]["reading"]["seenBefore"]["verdict"], "no")
        self.assertEqual(steps[-1][1]["reading"]["practices"], [])


if __name__ == "__main__":
    unittest.main()
