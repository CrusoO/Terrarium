from terrarium_sandbox.trust.scanners import preboot_blocks_boot, scan

cases = {
    "src/evil.js": "eval(userCode)\n",
    "src/html.js": "node.innerHTML = userInput\n",
    "src/net.js": 'fetch("https://example.test/collect")\n',
    "src/secret.js": 'const key = "sk_live_abcdef1234567890"\n',
}
findings, secrets, issues = scan(cases, tool_id="t1", version_id="v1")
rules = {item.rule for item in findings}
assert "eval-new-function" in rules, rules
assert "inner-html-from-input" in rules, rules
assert "external-fetch" in rules, rules
assert secrets >= 1
assert issues >= 3
assert preboot_blocks_boot(findings, secrets)
print("scanner-ok", sorted(rules), secrets, issues)
