"""Three fictional SAP Fiori + CAP projects published to the user's dashboard for Brownie.

Each one is a runnable app built on the same domain scaffold Terrarium uses,
with its own business modules and node:test suites. They carry the problems SAP
teams usually find late: a service with no authorization, a query built from
strings, request payloads in logs, an S/4HANA password in default-env.json, an
@sap/xssec version with a published advisory, and an untested tolerance edge.
Organizations, people, and data are fictional demo content.
"""

from __future__ import annotations

import json

from terrarium_agents.sap_fiori import DOMAINS, cdsrc, fiori_cap_files

FileMap = dict[str, str]

CONTOSO_NAME = "Contoso Manufacturing · Purchase Requisition Approval"
CONTOSO_VERSION = "4.2.0"
FABRIKAM_NAME = "Fabrikam Logistics · Inventory Reconciliation"
FABRIKAM_VERSION = "2.7.3"
TAILSPIN_NAME = "Tailspin Energy · Vendor Invoice Three-Way Match"
TAILSPIN_VERSION = "1.9.0"


def _head(name: str, version: str) -> str:
    return f"// {name} v{version}.\n"


def _test_head(name: str, version: str, meta: str = "") -> str:
    lines = [_head(name, version)]
    if meta:
        lines.append(f"// terrarium: {meta}\n")
    lines.append("const test = require('node:test');\nconst assert = require('node:assert/strict');\n")
    return "".join(lines)


def _formatter(name: str, version: str) -> str:
    return (
        _head(name, version)
        + """sap.ui.define([], function () {
  "use strict";
  // Fiori semantic colours for every status used by the procurement apps.
  var STATES = {
    approved: "Success", matched: "Success", ok: "Success", posted: "Success",
    pending: "Warning", "in review": "Warning", review: "Warning", parked: "Warning",
    rejected: "Error", mismatch: "Error", critical: "Error", blocked: "Error"
  };
  return {
    statusState: function (status) {
      return STATES[String(status || "").toLowerCase()] || "None";
    },
    amount: function (value, currency) {
      var number = Number(value);
      if (!isFinite(number)) { return ""; }
      return number.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + (currency ? " " + currency : "");
    }
  };
});
"""
    )


def _audit(name: str, version: str) -> str:
    return (
        _head(name, version)
        + """// Append-only audit trail. Kept in memory for local runs; production writes to the audit log service.
const LIMIT = 200;
const entries = [];

function record(action, details = {}) {
  if (!action) throw new TypeError('An audit entry needs an action');
  const entry = Object.freeze({
    at: new Date().toISOString(),
    action: String(action),
    actor: String(details.actor || ''),
    detail: String(details.detail || ''),
  });
  entries.push(entry);
  if (entries.length > LIMIT) entries.shift();
  return entry;
}

function list() {
  return entries.slice().reverse();
}

module.exports = { record, list, LIMIT };
"""
    )


_CONTOSO_APPROVAL = _head(CONTOSO_NAME, CONTOSO_VERSION) + """// Approval matrix agreed with Finance in PROC-ADR-007. Amounts are in the requisition currency.
const MATRIX = [
  { max: 1000, level: 1, approverRole: 'TeamLead', label: 'Team lead' },
  { max: 10000, level: 2, approverRole: 'DepartmentHead', label: 'Department head' },
  { max: 50000, level: 3, approverRole: 'FinanceController', label: 'Finance controller' },
  { max: Infinity, level: 4, approverRole: 'Cfo', label: 'CFO' },
];

function approvalRoute(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value < 0) throw new RangeError('Requisition amount must be a positive number');
  return MATRIX.find((entry) => value <= entry.max);
}

function canApprove(requisition, approver) {
  if (!approver || !approver.id) return { allowed: false, reason: 'Sign in to approve.' };
  if (approver.id === requisition.requesterId) {
    return { allowed: false, reason: 'The requester cannot approve their own request.' };
  }
  if (requisition.status !== undefined && !['Pending', 'In Review'].includes(requisition.status)) {
    return { allowed: false, reason: 'Only pending requests can be approved.' };
  }
  const route = approvalRoute(requisition.amount);
  const senior = MATRIX.filter((entry) => entry.level >= route.level).map((entry) => entry.approverRole);
  if (!(approver.roles || []).some((role) => senior.includes(role))) {
    return { allowed: false, reason: 'Needs ' + route.label + ' approval.' };
  }
  return { allowed: true, reason: '' };
}

module.exports = { approvalRoute, canApprove, MATRIX };
"""

_CONTOSO_TESTS = {
    "backend/test/approval-rules.test.js": _test_head(CONTOSO_NAME, CONTOSO_VERSION, "kind=functional root=untested-business-rules")
    + """const { approvalRoute } = require('../srv/lib/approval-rules');

test('requisitions up to 1,000 go to the team lead', () => {
  assert.equal(approvalRoute(1000).approverRole, 'TeamLead');
});

test('a 7,450 requisition goes to the department head', () => {
  assert.equal(approvalRoute(7450).approverRole, 'DepartmentHead');
});

test('a 28,800 requisition goes to the finance controller', () => {
  assert.equal(approvalRoute(28800).approverRole, 'FinanceController');
});

test('a negative amount is refused', () => {
  assert.throws(() => approvalRoute(-5), RangeError);
});
""",
    "backend/test/approval.security.test.js": _test_head(CONTOSO_NAME, CONTOSO_VERSION, "kind=security root=segregation-of-duties severity=high")
    + """const { canApprove } = require('../srv/lib/approval-rules');

const request = { requesterId: 'u-ravi', amount: 7450, status: 'Pending' };

test('a requester cannot approve their own requisition', () => {
  const result = canApprove(request, { id: 'u-ravi', roles: ['DepartmentHead'] });
  assert.equal(result.allowed, false);
});

test('a team lead cannot approve a requisition that needs the department head', () => {
  const result = canApprove(request, { id: 'u-karin', roles: ['TeamLead'] });
  assert.equal(result.allowed, false);
});

test('a finance controller can approve a department-head requisition', () => {
  const result = canApprove(request, { id: 'u-jonas', roles: ['FinanceController'] });
  assert.equal(result.allowed, true);
});

test('an approved requisition cannot be approved again', () => {
  const result = canApprove({ ...request, status: 'Approved' }, { id: 'u-jonas', roles: ['FinanceController'] });
  assert.equal(result.allowed, false);
});
""",
    "backend/test/audit-log.test.js": _test_head(CONTOSO_NAME, CONTOSO_VERSION, "kind=functional root=untested-business-rules")
    + """const audit = require('../srv/lib/audit-log');

test('newest audit entries come first', () => {
  audit.record('first', { actor: 'a' });
  audit.record('second', { actor: 'b' });
  assert.equal(audit.list()[0].action, 'second');
});

test('the audit trail keeps the last 200 entries', () => {
  for (let index = 0; index < 250; index += 1) audit.record('bulk ' + index);
  assert.equal(audit.list().length, audit.LIMIT);
});

test('audit entries cannot be edited after they are written', () => {
  const entry = audit.record('locked');
  assert.throws(() => { 'use strict'; entry.action = 'changed'; }, TypeError);
});
""",
}


def contoso_files() -> FileMap:
    name, version = CONTOSO_NAME, CONTOSO_VERSION
    sources = {
        "backend/srv/lib/approval-rules.js": _CONTOSO_APPROVAL,
        "backend/srv/lib/audit-log.js": _audit(name, version),
        "frontend/webapp/model/formatter.js": _formatter(name, version),
    }
    files = fiori_cap_files("Purchase Requisition Approval", reused=sources, domain=DOMAINS["requisition"]) or {}
    files.update(_CONTOSO_TESTS)
    files["backend/package.json"] = _backend_package("contoso-procurement-srv", version, {"@sap/xssec": "^4.2.0"})
    files["README.md"] = (
        f"# {name}\n\nPurchase requisitions routed by amount through the "
        "approval matrix in PROC-ADR-007, with segregation of duties and an append-only audit trail.\n\n"
        "Run the tests with `node --test backend/test`.\n"
    )
    return files


_FABRIKAM_VARIANCE = _head(FABRIKAM_NAME, FABRIKAM_VERSION) + """// Book-versus-counted variance used by the cycle count screens and the nightly reconciliation job.
function variance(bookQty, countedQty, tolerancePct = 2) {
  const book = Number(bookQty) || 0;
  const counted = Number(countedQty) || 0;
  const delta = counted - book;
  const percent = book === 0 ? (counted === 0 ? 0 : 100) : Math.round((delta / book) * 1000) / 10;
  const size = Math.abs(percent);
  const severity = size === 0 ? 'OK' : size <= tolerancePct ? 'Review' : 'Critical';
  return { delta, percent, severity, label: (delta > 0 ? '+' : '') + delta + ' (' + percent + '%)' };
}

module.exports = { variance };
"""

_FABRIKAM_ADJUSTMENT = _head(FABRIKAM_NAME, FABRIKAM_VERSION) + """const cds = require('@sap/cds');

// Posts a counted quantity back to the stock table after a supervisor accepts the count.
async function postAdjustment(bin, countedQty) {
  return cds.run(`UPDATE fabrikam_inventory_StockCounts SET countedQty = ${countedQty} WHERE bin = '${bin}'`);
}

module.exports = { postAdjustment };
"""

_FABRIKAM_TESTS = {
    "backend/test/variance.test.js": _test_head(FABRIKAM_NAME, FABRIKAM_VERSION, "kind=functional root=untested-business-rules")
    + """const { variance } = require('../srv/lib/variance');

test('an exact count has no variance', () => {
  assert.equal(variance(120, 120).severity, 'OK');
});

test('a 2% shortfall needs a supervisor review', () => {
  assert.equal(variance(50, 49).severity, 'Review');
});

test('a 12 of 64 shortfall is critical', () => {
  const result = variance(64, 52);
  assert.equal(result.percent, -18.7);
  assert.equal(result.severity, 'Critical');
});

test('stock counted in a bin that is booked empty is critical', () => {
  assert.equal(variance(0, 4).severity, 'Critical');
});
""",
}


def fabrikam_files() -> FileMap:
    name, version = FABRIKAM_NAME, FABRIKAM_VERSION
    sources = {
        "backend/srv/lib/variance.js": _FABRIKAM_VARIANCE,
        "backend/srv/lib/stock-adjustment.js": _FABRIKAM_ADJUSTMENT,
        "backend/srv/lib/audit-log.js": _audit(name, version),
        "frontend/webapp/model/formatter.js": _formatter(name, version),
    }
    files = fiori_cap_files("Inventory Reconciliation", reused=sources, domain=DOMAINS["inventory"]) or {}
    cds_path = "backend/srv/inventory-service.cds"
    files[cds_path] = files[cds_path].replace("@requires: 'authenticated-user'\n", "")
    files["backend/.cdsrc.json"] = cdsrc(auth=False)
    service = "backend/srv/inventory-service.js"
    files[service] = files[service].replace(
        "    const row = counts.find((entry) => entry.bin === req.data.bin);\n",
        "    console.log('postAdjustment payload', req.data);\n"
        "    const row = counts.find((entry) => entry.bin === req.data.bin);\n",
    )
    files.update(_FABRIKAM_TESTS)
    files["backend/package.json"] = _backend_package("fabrikam-inventory-srv", version, {"@sap/xssec": "^4.2.0"})
    files["README.md"] = (
        f"# {name}\n\nCycle counts for warehouse WH-01: book versus counted "
        "stock, variance severity, and supervisor adjustment posting.\n\n"
        "Run the tests with `node --test backend/test`.\n"
    )
    return files


_TAILSPIN_MATCH = _head(TAILSPIN_NAME, TAILSPIN_VERSION) + """// Three-way match: the invoice is compared with the lower of the PO value and the goods received.
// Tolerance agreed with Accounts Payable: an invoice up to 2% over is matched automatically.
function match({ poAmount, grAmount, invoiceAmount }, tolerancePct = 2) {
  const po = Number(poAmount) || 0;
  const gr = Number(grAmount) || 0;
  const invoice = Number(invoiceAmount) || 0;
  if (gr === 0) return { status: 'Blocked', deltaPct: 100, label: 'Goods not received yet' };
  const base = Math.min(po, gr);
  const deltaPct = Math.round(((invoice - base) / base) * 1000) / 10;
  if (Math.abs(deltaPct) < tolerancePct) return { status: 'Matched', deltaPct, label: 'Within ' + tolerancePct + '% tolerance' };
  return { status: 'Mismatch', deltaPct, label: 'Invoice is off by ' + deltaPct + '%' };
}

module.exports = { match };
"""

_TAILSPIN_S4 = _head(TAILSPIN_NAME, TAILSPIN_VERSION) + """// Reads the S/4HANA destination used to look up purchase orders and goods receipts.
const config = require('../../default-env.json');

function destination(name = 'S4H_PROD') {
  return (config.destinations || []).find((entry) => entry.name === name) || null;
}

function describe() {
  const target = destination();
  return target ? 'S/4HANA ' + target.name : 'S/4HANA';
}

module.exports = { destination, describe };
"""

_TAILSPIN_ENV = json.dumps(
    {
        "destinations": [
            {
                "name": "S4H_PROD",
                "url": "https://s4h-prod.tailspin-demo.example:44300",
                "user": "RFC_AP_INVOICE",
                "password": "Tsp!nv-AP-2026-prod",
            }
        ]
    },
    indent=2,
) + "\n"

_TAILSPIN_TESTS = {
    "backend/test/three-way-match.test.js": _test_head(TAILSPIN_NAME, TAILSPIN_VERSION, "kind=functional root=untested-business-rules")
    + """const { match } = require('../srv/lib/three-way-match');

test('an invoice equal to the purchase order is matched', () => {
  assert.equal(match({ poAmount: 12400, grAmount: 12400, invoiceAmount: 12400 }).status, 'Matched');
});

test('an invoice exactly at the 2% tolerance is matched', () => {
  assert.equal(match({ poAmount: 3800, grAmount: 3800, invoiceAmount: 3876 }).status, 'Matched');
});

test('an invoice 6.5% over the order is a mismatch', () => {
  assert.equal(match({ poAmount: 2150, grAmount: 2150, invoiceAmount: 2290 }).status, 'Mismatch');
});

test('an invoice without a goods receipt is blocked', () => {
  assert.equal(match({ poAmount: 9600, grAmount: 0, invoiceAmount: 9600 }).status, 'Blocked');
});
""",
}


def tailspin_files() -> FileMap:
    name, version = TAILSPIN_NAME, TAILSPIN_VERSION
    sources = {
        "backend/srv/lib/three-way-match.js": _TAILSPIN_MATCH,
        "backend/srv/lib/s4-client.js": _TAILSPIN_S4,
        "backend/srv/lib/audit-log.js": _audit(name, version),
        "frontend/webapp/model/formatter.js": _formatter(name, version),
    }
    files = fiori_cap_files("Vendor Invoice Three-Way Match", reused=sources, domain=DOMAINS["invoice"]) or {}
    files["backend/default-env.json"] = _TAILSPIN_ENV
    files.update(_TAILSPIN_TESTS)
    files["backend/package.json"] = _backend_package("tailspin-ap-match-srv", version, {"@sap/xssec": "3.3.5"})
    files["README.md"] = (
        f"# {name}\n\nVendor invoices matched against purchase orders and "
        "goods receipts from S/4HANA, with a 2% tolerance agreed with Accounts Payable.\n\n"
        "Local runs read the S/4HANA destination from backend/default-env.json.\n"
    )
    return files


def _backend_package(name: str, version: str, extra: dict[str, str]) -> str:
    return json.dumps(
        {
            "name": name,
            "private": True,
            "version": version,
            "scripts": {"dev": "cds-serve --port 4004", "test": "node --test test"},
            "dependencies": {"@sap/cds": "^8.6.1", "express": "^5.1.0", **extra},
        },
        indent=2,
    ) + "\n"
