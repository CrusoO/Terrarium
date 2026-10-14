from __future__ import annotations

from terrarium_sandbox.trust.scanners import preboot_blocks_boot, scan


def test_secret_blocks_preboot() -> None:
    files = {"app.js": 'const k = "sk_live_abcdef1234567890";'}
    findings, secrets, _ = scan(files, tool_id="t1", version_id="v1")
    assert secrets >= 1
    assert preboot_blocks_boot(findings, secrets)


def _sql_finding(source: str) -> list:
    findings, _, _ = scan({"src/db.js": source}, tool_id="t1", version_id="v1")
    return [item for item in findings if item.rule == "string-sql"]


def test_sql_rule_matches_long_template_interpolation() -> None:
    padding = "x" * 180
    source = f"const q = `SELECT id, name FROM orders WHERE note = '{padding}' AND id = ${{id}}`;"
    assert _sql_finding(source)
    assert preboot_blocks_boot(_sql_finding(source), 0)


def test_sql_rule_matches_multiline_template() -> None:
    source = """
const q = `
  INSERT INTO orders (status, owner)
  VALUES (${status}, ${owner})
`;
"""
    assert _sql_finding(source)


def test_sql_rule_matches_update_and_delete_templates() -> None:
    assert _sql_finding("const q = `UPDATE orders SET status = ${status} WHERE id = ${id}`;")
    assert _sql_finding("const q = `DELETE FROM orders WHERE id = ${id}`;")


def test_sql_rule_matches_string_concatenation() -> None:
    assert _sql_finding('const q = "SELECT * FROM orders WHERE id = " + id;')
    assert _sql_finding("const q = 'INSERT INTO orders (name) VALUES (' + name + ')';")
    assert _sql_finding('db.query("UPDATE orders SET paid = " + paid);')
    assert _sql_finding("db.query('DELETE FROM orders WHERE id = ' + id);")


def test_sql_rule_ignores_jsx_and_helper_templates() -> None:
    jsx = """
export default function Card({ active, section, index, onSelect }) {
  return <button className={`card ${active ? "selected" : ""}`} key={`${section.title}-${index}`} onClick={() => onSelect(index)}>{section.title}</button>;
}
"""
    helper = """
export function label(order) {
  return `Order ${order.id} · ${order.status}`;
}
export function money(cents) {
  return `${(cents / 100).toFixed(2)}`;
}
"""
    assert _sql_finding(jsx) == []
    assert _sql_finding(helper) == []
    findings, secrets, code_issues = scan(
        {"src/components/Card.jsx": jsx, "src/utils/format.js": helper},
        tool_id="t1",
        version_id="v1",
    )
    assert code_issues == 0
    assert secrets == 0
    assert preboot_blocks_boot(findings, secrets) is False


def test_per_file_negative_cases() -> None:
    cases = {
        "src/evil.js": 'eval(userCode)\n',
        "src/html.js": "node.innerHTML = userInput\n",
        "src/net.js": 'fetch("https://example.test/collect", { method: "POST" })\n',
        "src/secret.js": 'const key = "sk_live_abcdef1234567890"\n',
    }
    findings, secrets, issues = scan(cases, tool_id="t1", version_id="v1")
    rules = {item.rule for item in findings}
    assert "eval-new-function" in rules
    assert "inner-html-from-input" in rules
    assert "external-fetch" in rules
    assert secrets >= 1
    assert issues >= 3
    assert preboot_blocks_boot(findings, secrets)


def test_osv_advisory_fixture() -> None:
    files = {
        "package.json": '{"dependencies":{"lodash":"4.17.20"}}',
        "package-lock.json": '{"packages":{"node_modules/lodash":{"version":"4.17.20"}}}',
        "src/App.jsx": 'import _ from "lodash"; export default () => null;',
    }
    findings, _, _ = scan(files, tool_id="t1", version_id="v1")
    osv = [f for f in findings if f.source == "osv"]
    assert len(osv) == 1
    assert osv[0].advisoryId
    assert osv[0].fixedVersions
