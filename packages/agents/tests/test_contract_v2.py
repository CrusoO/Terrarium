from __future__ import annotations

import os
import unittest

from terrarium_agents.contract_v2 import (
    build_contract,
    css_problems,
    deterministic_files,
    file_is_closed,
    find_mismatches,
    spec_for_prompt,
)
from terrarium_agents.llm import sampling_fields
from terrarium_agents.parked import note_parked, parked_reason
from terrarium_agents.per_file import apply_patches, per_file_enabled, run_per_file


class ContractV2Tests(unittest.TestCase):
    def test_types_sample_and_hook_cardinality_are_deterministic(self) -> None:
        contract = build_contract(spec_for_prompt("customer order tracker"), "jsdoc")
        files = deterministic_files(contract)
        types = files["src/types.js"]
        hooks = files["src/hooks/useData.js"]
        self.assertIn("SAMPLE_ORDER", types)
        self.assertIn("Alice Marsh", types)
        self.assertIn("@returns {Order[]}", hooks)
        self.assertIn("@returns {Order | null}", hooks)
        self.assertIn("@returns {DailyTotal[]}", hooks)
        self.assertIn(":root", files["src/styles/tokens.css"])
        self.assertEqual(css_problems(files["src/styles/global.css"]), [])
        self.assertTrue(all(file_is_closed(body) for path, body in files.items() if path.endswith((".js", ".jsx", ".css"))))

    def test_array_prop_rejects_a_single_row(self) -> None:
        contract = build_contract(spec_for_prompt("orders"), "jsdoc")
        files = deterministic_files(contract)
        files["src/views/DashboardPage.jsx"] = (
            "import { useTotals, useOrders } from '../hooks/useData.js'\n"
            "import TotalsCard from '../components/TotalsCard.jsx'\n"
            "export default function DashboardPage() {\n"
            "  const items = useOrders()\n"
            "  const totals = useTotals(items)\n"
            "  return totals.map((row) => <TotalsCard totals={row} />)\n"
            "}\n"
        )
        mismatches = find_mismatches(files, contract)
        self.assertTrue(any(item.prop == "totals" and "map item" in item.detail for item in mismatches))
        self.assertEqual(mismatches[0].implicated[0], "src/views/DashboardPage.jsx")

    def test_search_callback_rejects_event_target(self) -> None:
        contract = build_contract(spec_for_prompt("orders"), "jsdoc")
        files = {"src/views/ListPage.jsx": '<SearchBar value={query} onChange={(event) => setQuery(event.target.value)} />'}
        mismatches = find_mismatches(files, contract)
        self.assertTrue(any(".target" in item.detail for item in mismatches))

    def test_hook_import_is_rewritten_to_the_contract_module(self) -> None:
        from terrarium_agents.contract_v2 import normalize_imports

        contract = build_contract(spec_for_prompt("orders"), "jsdoc")
        files = deterministic_files(contract)
        files["src/views/DetailPage.jsx"] = "import { useSelectedOrder } from '../hooks/useSelectedOrder'\nexport default function DetailPage() { return null }\n"
        changed = normalize_imports(files, contract)
        self.assertEqual(changed, 1)
        self.assertIn("../hooks/useData.js", files["src/views/DetailPage.jsx"])
        files["src/views/DashboardPage.jsx"] = "import useTotals from '../hooks/useData.js'\nexport default function DashboardPage() { return null }\n"
        normalize_imports(files, contract)
        self.assertIn("import { useTotals }", files["src/views/DashboardPage.jsx"])

    def test_unclosed_css_fails(self) -> None:
        self.assertTrue(css_problems(".empty-state { color: red;"))
        self.assertFalse(file_is_closed("export default function Cut() {"))

    def test_stub_pipeline_has_no_mismatches(self) -> None:
        outcome = run_per_file("Build an operations dashboard with overdue totals.", language="ts", live=False)
        self.assertTrue(outcome.static_ok)
        self.assertEqual(outcome.repairs, 0)
        self.assertIn("src/types.ts", outcome.files)
        self.assertTrue(outcome.public()["features"]["totals"])

    def test_patches_and_sampling_and_parked_flag(self) -> None:
        files = {"src/App.jsx": "const totals = row\n"}
        applied = apply_patches(files, [{"path": "src/App.jsx", "search": "row", "replace": "totals"}])
        self.assertEqual(applied, ["src/App.jsx"])
        self.assertNotIn("temperature", sampling_fields("eu.anthropic.claude-haiku-5-5"))
        self.assertIn("temperature", sampling_fields("eu.anthropic.claude-haiku-4-5-20251001-v1:0"))
        self.assertFalse(per_file_enabled())
        from terrarium_agents.canary import HOLDOUT, archetype_of, canary_per_file

        from terrarium_agents.canary import classify, set_canary_actor

        self.assertEqual(len(HOLDOUT), 40)
        self.assertTrue(all(archetype_of(prompt) == expected for expected, prompt in HOLDOUT))
        self.assertTrue(all(classify(prompt).confidence >= 0.6 for _expected, prompt in HOLDOUT))
        self.assertFalse(canary_per_file("customer-session", "Build a customer order tracker"))
        self.assertFalse(canary_per_file("canary-1", "Build a customer order tracker"))
        set_canary_actor("codegen.step0.terrarium@gmail.com")
        strong = "Build a tool crib. Supervisors search tools, filter by status, add a tool, and open its detail."
        self.assertTrue(canary_per_file("customer-session", strong))
        set_canary_actor("")
        self.assertFalse(canary_per_file("canary-1", strong))
        self.assertFalse(canary_per_file("canary-1", "Build a memory puzzle game. The player flips cards."))
        set_canary_actor("person@terrarium.test")
        self.assertFalse(canary_per_file("sess", "Build something nice"))
        set_canary_actor("")
        contract = build_contract(spec_for_prompt("orders"), "jsdoc")
        task = __import__("terrarium_agents.contract_v2", fromlist=["file_task"]).file_task(contract, contract.component("ListPage"))
        self.assertIn("from '../hooks/useData.js'", task)
        self.assertIn("package.json", task)
        edited = __import__("terrarium_agents.contract_v2", fromlist=["apply_blueprint_edit"]).apply_blueprint_edit(
            contract.spec, "add-field", name="note", type_name="string", sample="Leave at door"
        )
        regenerated = deterministic_files(build_contract(edited, "jsdoc"))
        self.assertIn("note", regenerated["src/types.js"])
        regenerated["package.json"] = '{"name":"hacked"}\n'
        __import__("terrarium_agents.contract_v2", fromlist=["lock_scaffold"]).lock_scaffold(
            regenerated, build_contract(edited, "jsdoc")
        )
        self.assertNotIn("hacked", regenerated["package.json"])
        app = regenerated["src/App.jsx"]
        self.assertIn("data-route", app)
        self.assertNotIn("<ListPage />\n      <DetailPage />", app)
        self.assertIn("/favicon.svg", regenerated["index.html"])
        self.assertIn("public/favicon.svg", regenerated)
        self.assertIn("typeof draft === 'function'", regenerated["src/hooks/useData.js"])
        landing = deterministic_files(build_contract(spec_for_prompt("Build a landing page for a pottery studio with a hero section and a pricing section."), "jsdoc"))
        self.assertIn('className="hero"', landing["src/App.jsx"])
        from terrarium_agents.per_file import affected_pages

        only_list = affected_pages(contract, "new-filter", regenerated)
        self.assertEqual(only_list, [])
        self.assertIn("All", regenerated["src/views/ListPage.jsx"])
        os.environ["TERRARIUM_SPECULATIVE_SANDBOX"] = "1"
        notes = note_parked()
        self.assertIn("speculative_sandbox", notes[0])
        self.assertEqual(os.environ["TERRARIUM_SPECULATIVE_SANDBOX"], "0")
        self.assertIn("90%", parked_reason("diffusion"))


if __name__ == "__main__":
    unittest.main()
