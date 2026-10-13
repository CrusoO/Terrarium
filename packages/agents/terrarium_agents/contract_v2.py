"""Contract v2 and the files that are generated from it with no model call.

Each entity has a type and a sample object. Each hook declares whether it
returns an array or a single value. Each component has typed props, one
example call, and an export list. Types, mock data, data hooks, design tokens,
and global CSS are emitted from that contract. List, detail, add, and filter are too. The model writes presentational leaves.
"""

from __future__ import annotations

import json
import posixpath
import re
from dataclasses import dataclass, replace
from pathlib import Path

Language = str  # "jsdoc" | "ts"
SCAFFOLD_VERSION = "3"


@dataclass(frozen=True)
class Field:
    name: str
    type_name: str
    sample: object

    @property
    def cardinality(self) -> str:
        if self.type_name.endswith("[]"):
            return "array"
        return "primitive"


@dataclass(frozen=True)
class Entity:
    name: str
    fields: tuple[Field, ...]

    def sample_object(self) -> dict[str, object]:
        return {field.name: field.sample for field in self.fields}


@dataclass(frozen=True)
class Hook:
    name: str
    return_type: str
    cardinality: str  # array | single
    entity: str


@dataclass(frozen=True)
class Prop:
    name: str
    type_name: str
    cardinality: str  # array | single | primitive | callback


@dataclass(frozen=True)
class Component:
    name: str
    path: str
    kind: str  # leaf | page | scaffold
    props: tuple[Prop, ...]
    example: str
    exports: tuple[str, ...]
    uses: tuple[str, ...] = ()


@dataclass(frozen=True)
class AppSpec:
    slug: str
    title: str
    prompt: str
    entity: str
    fields: tuple[tuple[str, str, object], ...]
    features: tuple[str, ...]
    status_field: str | None = None
    statuses: tuple[str, ...] = ()
    noun: str = "item"
    extra_pages: tuple[str, ...] = ()
    pack: str = "entity"


@dataclass(frozen=True)
class Contract:
    spec: AppSpec
    entity: Entity
    hooks: tuple[Hook, ...]
    components: tuple[Component, ...]
    language: str
    theme: str = "ledger"
    layout: str = "page"

    def exports_for(self, path: str) -> tuple[str, ...]:
        for component in self.components:
            if component.path == path:
                return component.exports
        return ()

    def hook(self, name: str) -> Hook | None:
        for item in self.hooks:
            if item.name == name:
                return item
        return None

    def component(self, name: str) -> Component | None:
        for item in self.components:
            if item.name == name:
                return item
        return None

    def llm_components(self) -> tuple[Component, ...]:
        return tuple(item for item in self.components if item.kind in {"leaf", "page"})


def _ext(language: str, kind: str) -> str:
    if language == "ts":
        return ".tsx" if kind != "logic" else ".ts"
    return ".jsx" if kind != "logic" else ".js"


SPECS: tuple[AppSpec, ...] = (
    AppSpec("orders", "Orders", "Build a customer order tracker. Staff search orders, filter by payment status, create an order, open a detail, and see daily totals.", "Order", (("customer", "string", "Alice Marsh"), ("city", "string", "Portland"), ("paymentStatus", "string", "Paid"), ("pickupDate", "string", "2024-06-10")), ("search", "status-filter", "create", "detail", "totals"), "paymentStatus", ("Paid", "Unpaid", "Partial"), "order"),
    AppSpec("catalogue", "Catalogue", "Build an ecommerce catalogue. Shoppers search products, filter by category, open a product detail, and add it to a cart.", "Product", (("name", "string", "Ceramic Bowl"), ("category", "string", "Kitchen"), ("price", "number", 24), ("stock", "number", 12)), ("search", "status-filter", "detail", "create"), "category", ("Kitchen", "Garden", "Desk"), "product"),
    AppSpec("ops", "Operations", "Build an operations dashboard. Supervisors search jobs, filter by status, create a job, open a detail, and see overdue totals.", "Job", (("title", "string", "Packing"), ("owner", "string", "Mina"), ("status", "string", "Open"), ("dueDate", "string", "2024-06-12")), ("search", "status-filter", "create", "detail", "totals"), "status", ("Open", "Done", "Overdue"), "job"),
    AppSpec("appointments", "Appointments", "Build an appointment book. Staff search visits, filter by status, create a visit, and open its detail.", "Visit", (("client", "string", "Noah Patel"), ("service", "string", "Consult"), ("status", "string", "Booked"), ("when", "string", "2024-06-11 09:00")), ("search", "status-filter", "create", "detail"), "status", ("Booked", "Done", "Cancelled"), "visit"),
    AppSpec("inventory", "Inventory", "Build an inventory counter. Staff search items, filter low stock, add an item, open a detail, and see stock totals.", "Sku", (("name", "string", "Flour"), ("aisle", "string", "Dry goods"), ("status", "string", "Low"), ("onHand", "number", 4)), ("search", "status-filter", "create", "detail", "totals"), "status", ("Ok", "Low", "Out"), "item"),
    AppSpec("roster", "Roster", "Build a class roster. Teachers search students, filter by status, add a student, and open a detail.", "Student", (("name", "string", "Priya Shah"), ("homeroom", "string", "4B"), ("status", "string", "Present"), ("guardian", "string", "Anil Shah")), ("search", "status-filter", "create", "detail"), "status", ("Present", "Absent", "Late"), "student"),
    AppSpec("recipes", "Recipes", "Build a recipe box. Cooks search recipes, filter by course, add a recipe, and open its detail.", "Recipe", (("name", "string", "Lemon pasta"), ("course", "string", "Dinner"), ("minutes", "number", 25), ("serves", "number", 2)), ("search", "status-filter", "create", "detail"), "course", ("Breakfast", "Dinner", "Snack"), "recipe"),
    AppSpec("tickets", "Tickets", "Build a support ticket desk. Agents search tickets, filter by status, create a ticket, and open its detail.", "Ticket", (("subject", "string", "Login loop"), ("requester", "string", "Sam Lee"), ("status", "string", "Open"), ("openedOn", "string", "2024-06-09")), ("search", "status-filter", "create", "detail"), "status", ("Open", "Waiting", "Closed"), "ticket"),
    AppSpec("expenses", "Expenses", "Build an expense log. Staff search expenses, filter by category, add an expense, open its detail, and see totals.", "Expense", (("merchant", "string", "Tram"), ("category", "string", "Travel"), ("amount", "number", 18), ("spentOn", "string", "2024-06-08")), ("search", "status-filter", "create", "detail", "totals"), "category", ("Travel", "Meals", "Supplies"), "expense"),
    AppSpec("guests", "Guests", "Build an event guest list. Hosts search guests, filter by RSVP status, add a guest, and open a detail.", "Guest", (("name", "string", "Imani Cole"), ("party", "string", "Cole"), ("status", "string", "Yes"), ("seats", "number", 2)), ("search", "status-filter", "create", "detail"), "status", ("Yes", "No", "Maybe"), "guest"),
)


THEMES = ("ledger", "harbor", "ink", "moss", "clay", "dusk", "paper", "tide")
LAYOUTS = ("page", "split", "board")
_THEME_TOKENS = {
    "ledger": {"ink": "#1c1917", "paper": "#faf7f2", "line": "#e7e0d6", "accent": "#9a3412", "card": "#fffdf8", "font": "Georgia, serif", "radius": "12px"},
    "harbor": {"ink": "#0f172a", "paper": "#f3f6fb", "line": "#dbe3ef", "accent": "#1d4ed8", "card": "#ffffff", "font": "Segoe UI, sans-serif", "radius": "8px"},
    "ink": {"ink": "#f5f5f4", "paper": "#1c1917", "line": "#44403c", "accent": "#fdba74", "card": "#292524", "font": "Segoe UI, sans-serif", "radius": "16px"},
    "moss": {"ink": "#14221a", "paper": "#f3f7f2", "line": "#d5e3d4", "accent": "#3f6212", "card": "#ffffff", "font": "Segoe UI, sans-serif", "radius": "10px"},
    "clay": {"ink": "#3f2a22", "paper": "#fbf3ec", "line": "#ead9cc", "accent": "#c2410c", "card": "#fffaf5", "font": "Georgia, serif", "radius": "18px"},
    "dusk": {"ink": "#eef2ff", "paper": "#1e1b4b", "line": "#4338ca", "accent": "#a5b4fc", "card": "#312e81", "font": "Segoe UI, sans-serif", "radius": "14px"},
    "paper": {"ink": "#111827", "paper": "#ffffff", "line": "#e5e7eb", "accent": "#0f766e", "card": "#f9fafb", "font": "Segoe UI, sans-serif", "radius": "4px"},
    "tide": {"ink": "#082f49", "paper": "#ecfeff", "line": "#a5f3fc", "accent": "#0e7490", "card": "#ffffff", "font": "Segoe UI, sans-serif", "radius": "20px"},
}


def _look(spec: AppSpec) -> tuple[str, str]:
    index = next((i for i, item in enumerate(SPECS) if item.slug == spec.slug), None)
    if index is None:
        index = next((i for i, (_needle, item) in enumerate(DOMAINS) if item.slug == spec.slug), sum(ord(char) for char in spec.slug))
    return THEMES[index % len(THEMES)], LAYOUTS[index % len(LAYOUTS)]


def pack_spec(prompt: str, archetype: str) -> AppSpec:
    """Scaffold spec for a pack archetype. The model still writes only the pages."""
    title = " ".join(prompt.split()[:6]).strip(" .") or "App"
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:32] or "app"
    if archetype == "landing":
        return AppSpec(slug, title, prompt, "Lead", (("name", "string", "Ada"), ("email", "string", "ada@studio.test"), ("plan", "string", "Studio")), ("search", "status-filter", "create", "detail"), "plan", ("Studio", "Workshop", "Private"), "lead", pack="landing")
    if archetype == "charts":
        return AppSpec(slug, title, prompt, "Point", (("label", "string", "March"), ("value", "number", 12), ("series", "string", "Revenue")), ("search", "status-filter", "create", "detail", "totals"), "series", ("Revenue", "Orders"), "point", pack="charts")
    if archetype == "multi-step-form":
        return AppSpec(slug, title, prompt, "Application", (("name", "string", "Ada"), ("detail", "string", "Front room"), ("plan", "string", "Review")), ("search", "status-filter", "create", "detail"), "plan", ("Start", "Details", "Review"), "application", pack="wizard")
    return AppSpec(slug, title, prompt, "Item", (("name", "string", "Sample"), ("status", "string", "Open"), ("note", "string", "Note")), ("search", "status-filter", "create", "detail"), "status", ("Open", "Done"), "item")


def _domain(
    slug: str,
    title: str,
    entity: str,
    fields: tuple[tuple[str, str, object], ...],
    status_field: str,
    statuses: tuple[str, ...],
    noun: str,
    *,
    totals: bool = False,
) -> AppSpec:
    features = ("search", "status-filter", "create", "detail") + (("totals",) if totals else ())
    return AppSpec(slug, title, title, entity, fields, features, status_field, statuses, noun, pack="entity")


# Longer phrases first. These are the prompts the catalogue nouns do not name.
DOMAINS: tuple[tuple[str, AppSpec], ...] = (
    ("library", _domain("library", "Library checkout", "Book", (("title", "string", "Kindred"), ("borrower", "string", "Ada Marsh"), ("status", "string", "Out"), ("due", "string", "2024-07-01")), "status", ("Out", "Shelf", "Hold"), "book")),
    ("kennel", _domain("kennel", "Kennel roster", "Dog", (("name", "string", "Bingo"), ("kennel", "string", "C3"), ("status", "string", "Boarding"), ("owner", "string", "Leah Ortiz")), "status", ("Boarding", "Ready", "Home"), "dog")),
    ("parts bin", _domain("parts-bin", "Parts bin", "Part", (("name", "string", "Brake pad"), ("bin", "string", "A-12"), ("condition", "string", "Worn"), ("qty", "number", 4)), "condition", ("New", "Worn", "Scrap"), "part")),
    ("volunteer", _domain("volunteers", "Volunteer list", "Volunteer", (("name", "string", "Mina Cole"), ("role", "string", "Door"), ("status", "string", "Confirmed"), ("shift", "string", "Morning")), "status", ("Confirmed", "Waitlist", "Declined"), "volunteer")),
    ("farm stand", _domain("farm-stand", "Farm stand", "Produce", (("name", "string", "Peaches"), ("stall", "string", "North"), ("status", "string", "Fresh"), ("price", "number", 4)), "status", ("Fresh", "Sold", "Held"), "produce")),
    ("clinic supply", _domain("clinic", "Clinic supply", "Supply", (("name", "string", "Gauze"), ("cabinet", "string", "B2"), ("status", "string", "Stocked"), ("count", "number", 40)), "status", ("Stocked", "Low", "Ordered"), "supply")),
    ("bakery", _domain("bakery", "Bakery board", "Batch", (("name", "string", "Rye loaves"), ("baker", "string", "Noor"), ("status", "string", "Proofing"), ("due", "string", "2024-07-02")), "status", ("Proofing", "Baked", "Overdue"), "batch", totals=True)),
    ("fleet", _domain("fleet", "Fleet board", "Van", (("name", "string", "Van 12"), ("route", "string", "East"), ("status", "string", "Out"), ("miles", "number", 840)), "status", ("Out", "Yard", "Shop"), "van", totals=True)),
    ("studio dashboard", _domain("sessions", "Studio board", "Session", (("name", "string", "Vocal take"), ("producer", "string", "Jules"), ("status", "string", "Booked"), ("hours", "number", 3)), "status", ("Booked", "Done", "Overdue"), "session", totals=True)),
    ("warehouse", _domain("warehouse", "Warehouse board", "Pallet", (("code", "string", "P-440"), ("aisle", "string", "7"), ("status", "string", "Staged"), ("weight", "number", 320)), "status", ("Staged", "Shipped", "Hold"), "pallet", totals=True)),
    ("cafe", _domain("cafe", "Cafe board", "Shift", (("name", "string", "Open"), ("lead", "string", "Sam"), ("status", "string", "On"), ("tips", "number", 86)), "status", ("On", "Off", "Cover"), "shift", totals=True)),
    ("desk booking", _domain("desks", "Desk booking", "Reservation", (("person", "string", "Imani Cole"), ("desk", "string", "D-4"), ("status", "string", "Booked"), ("day", "string", "2024-07-03")), "status", ("Booked", "Free", "Blocked"), "reservation")),
    ("studio booking", _domain("rooms", "Studio booking", "Room", (("musician", "string", "Noah Patel"), ("room", "string", "Booth B"), ("status", "string", "Booked"), ("when", "string", "2024-07-04 14:00")), "status", ("Booked", "Done", "Cancelled"), "room")),
    ("court booking", _domain("courts", "Court booking", "Booking", (("player", "string", "Priya Shah"), ("court", "string", "Court 2"), ("status", "string", "Booked"), ("when", "string", "2024-07-05 18:00")), "status", ("Booked", "Done", "Cancelled"), "booking")),
    ("tour booking", _domain("tours", "Tour booking", "Tour", (("guide", "string", "Leah Ortiz"), ("route", "string", "River"), ("status", "string", "Booked"), ("when", "string", "2024-07-06 09:00")), "status", ("Booked", "Full", "Cancelled"), "tour")),
    ("greenhouse", _domain("greenhouse", "Greenhouse log", "Plant", (("name", "string", "Basil"), ("bed", "string", "South"), ("status", "string", "Growing"), ("watered", "string", "2024-07-01")), "status", ("Growing", "Harvest", "Resting"), "plant")),
    ("tool crib", _domain("tool-crib", "Tool crib", "Tool", (("name", "string", "Torque wrench"), ("hook", "string", "H-8"), ("status", "string", "Out"), ("borrower", "string", "Mina Cole")), "status", ("Out", "In", "Repair"), "tool")),
    ("lost and found", _domain("lost-found", "Lost and found", "Find", (("item", "string", "Blue scarf"), ("place", "string", "Lobby"), ("status", "string", "Held"), ("foundOn", "string", "2024-07-02")), "status", ("Held", "Claimed", "Donated"), "find")),
    ("wine cellar", _domain("cellar", "Wine cellar", "Bottle", (("name", "string", "River pinot"), ("bin", "string", "C-19"), ("status", "string", "Resting"), ("vintage", "number", 2019)), "status", ("Resting", "Ready", "Sold"), "bottle")),
    ("museum", _domain("museum", "Museum loans", "Artifact", (("name", "string", "Clay lamp"), ("lender", "string", "City archive"), ("status", "string", "On loan"), ("due", "string", "2024-08-01")), "status", ("On loan", "Returned", "Due"), "artifact")),
)


UNSEEN_PROMPTS: tuple[str, ...] = (
    "Build a library checkout desk. Librarians search books, filter by status, add a book, and open its detail.",
    "Build a kennel roster. Staff search dogs, filter by status, add a dog, and open its detail.",
    "Build a parts bin. Mechanics search parts, filter by condition, add a part, and open its detail.",
    "Build a volunteer list. Coordinators search volunteers, filter by status, add a volunteer, and open a detail.",
    "Build a farm stand price list. Staff search produce, filter by status, add an item, and open its detail.",
    "Build a clinic supply list. Nurses search supplies, filter by status, add a supply, and open its detail.",
    "Build a bakery dashboard. Bakers search orders, filter by status, and see overdue totals.",
    "Build a fleet dashboard. Dispatchers search vans, filter by status, and see mileage totals.",
    "Build a studio dashboard. Producers search sessions, filter by status, and see hour totals.",
    "Build a warehouse dashboard. Leads search pallets, filter by status, and see weight totals.",
    "Build a cafe dashboard. Managers search shifts, filter by status, and see tip totals.",
    "Build a desk booking board. People book a desk, search reservations, filter by status, and open a reservation.",
    "Build a studio booking board. Musicians book a room, search appointments, and open a reservation.",
    "Build a court booking board. Players book a court, filter reservations, and open a booking.",
    "Build a tour booking board. Guides book a tour, search reservations, and open a booking.",
    "Build a greenhouse log. Gardeners search plants, filter by status, add a plant, and open its detail.",
    "Build a tool crib. Techs search tools, filter by status, add a tool, and open its detail.",
    "Build a lost and found desk. Staff search finds, filter by status, add a find, and open its detail.",
    "Build a wine cellar list. Stewards search bottles, filter by status, add a bottle, and open its detail.",
    "Build a museum loan desk. Curators search artifacts, filter by status, add an artifact, and open its detail.",
)


def map_prompt(prompt: str) -> AppSpec | None:
    """Deterministic noun map. A short title, a real entity, and example rows that are not Sample/Note."""
    text = prompt.lower()
    for needle, spec in DOMAINS:
        if needle in text:
            return replace(spec, prompt=prompt)
    return None


def spec_for_prompt(prompt: str) -> AppSpec:
    mapped = map_prompt(prompt)
    if mapped is not None:
        return mapped
    text = prompt.lower()
    for spec in SPECS:
        if spec.slug in text or spec.title.lower() in text or re.search(rf"\b{re.escape(spec.noun)}\b", text):
            return spec
    from terrarium_agents.canary import classify

    decision = classify(prompt)
    if decision.archetype in {"landing", "charts", "multi-step-form", "crud", "dashboard", "booking"} and not decision.low_confidence:
        spec = pack_spec(prompt, decision.archetype)
        if decision.archetype == "dashboard" and "totals" not in spec.features:
            return replace(spec, features=spec.features + ("totals",), pack="entity")
        if decision.archetype == "booking":
            return replace(spec, pack="entity")
        if decision.archetype == "crud":
            return replace(spec, pack="entity")
        return spec
    return SPECS[0]


def ui_is_relevant(rendered: str, spec: AppSpec) -> bool:
    """The first screen must show the blueprint, not a generic Item placeholder."""
    text = rendered.lower()
    if spec.entity == "Item":
        return False
    if "sample 1" in text or "note 1" in text:
        return False
    prompt_title = " ".join(spec.prompt.split()[:6]).strip(" .").lower()
    if spec.title.lower() == prompt_title or spec.title.lower() not in text:
        return False
    if spec.entity.lower() not in text:
        return False
    if not all(name.lower() in text for name, _type_name, _sample in spec.fields):
        return False
    return any(str(sample).lower() in text for _name, _type_name, sample in spec.fields)


def visual_signature(files: dict[str, str]) -> tuple[str, str, str, str]:
    app = next((body for path, body in files.items() if path.endswith("App.tsx") or path.endswith("App.jsx")), "")
    css = files.get("src/styles/tokens.css", "")
    hero = files.get("src/components/PageHero.tsx") or files.get("src/components/PageHero.jsx") or ""
    theme = re.search(r"theme-(\w+)", app)
    layout = re.search(r"layout-(\w+)", app)
    accent = re.search(r"--accent:\s*([^;]+)", css)
    icon = re.search(r"import \{ (\w+) \}", hero)
    return (
        theme.group(1) if theme else "",
        layout.group(1) if layout else "",
        accent.group(1).strip() if accent else "",
        icon.group(1) if icon else "",
    )


def _with_behaviour(spec: AppSpec) -> AppSpec:
    """Every app gets search, filter, add, and detail, even if the prompt omitted them."""
    features = tuple(dict.fromkeys((*spec.features, "search", "status-filter", "create", "detail")))
    statuses = spec.statuses or ("Open", "Done")
    status_field = spec.status_field or "status"
    fields = list(spec.fields)
    if not any(name == status_field for name, _type_name, _sample in fields):
        fields.append((status_field, "string", statuses[0]))
    return replace(spec, features=features, statuses=statuses, status_field=status_field, fields=tuple(fields))


def build_contract(spec: AppSpec, language: str = "jsdoc") -> Contract:
    spec = _with_behaviour(spec)
    fields = [Field("id", "string", f"{spec.entity[:3].upper()}-1001"), *[Field(*item) for item in spec.fields]]
    entity = Entity(spec.entity, tuple(fields))
    view = _ext(language, "view")
    hooks = [
        Hook(f"use{spec.entity}s", f"{spec.entity}[]", "array", spec.entity),
        Hook(f"useSelected{spec.entity}", f"{spec.entity} | null", "single", spec.entity),
        Hook(f"use{spec.entity}Actions", "{ addItem: (draft) => void, select: (id) => void }", "single", spec.entity),
    ]
    if "totals" in spec.features:
        hooks.append(Hook("useTotals", "DailyTotal[]", "array", "DailyTotal"))
    components: list[Component] = [
        Component("AppShell", f"src/components/AppShell{view}", "scaffold", (Prop("children", "ReactNode", "single"),), "<AppShell>{children}</AppShell>", ("default",)),
        Component("Navbar", f"src/components/Navbar{view}", "scaffold", (Prop("title", "string", "primitive"),), f'<Navbar title="{spec.title}" />', ("default",)),
        Component("SearchBar", f"src/components/SearchBar{view}", "scaffold", (Prop("value", "string", "primitive"), Prop("onChange", "(value: string) => void", "callback"), Prop("placeholder", "string", "primitive")), "<SearchBar value={query} onChange={setQuery} />", ("default",)),
    ]
    if spec.statuses:
        components.append(Component("StatusBadge", f"src/components/StatusBadge{view}", "leaf", (Prop("status", "string", "primitive"),), '<StatusBadge status="Paid" />', ("default",)))
        components.append(Component("FilterTabs", f"src/components/FilterTabs{view}", "scaffold", (Prop("statuses", "string[]", "array"), Prop("active", "string", "primitive"), Prop("onChange", "(value: string) => void", "callback")), "<FilterTabs statuses={STATUSES} active={active} onChange={setActive} />", ("default",)))
    components.append(Component(f"{spec.entity}Card", f"src/components/{spec.entity}Card{view}", "leaf", (Prop("item", spec.entity, "single"), Prop("onSelect", "(id: string) => void", "callback")), f'<{spec.entity}Card item={{item}} onSelect={{setSelectedId}} />', ("default",)))
    components.append(Component("PageHero", f"src/components/PageHero{view}", "leaf", (), "<PageHero />", ("default",)))
    components.append(Component("EmptyState", f"src/components/EmptyState{view}", "leaf", (), "<EmptyState />", ("default",)))
    if "totals" in spec.features:
        components.append(Component("TotalsCard", f"src/components/TotalsCard{view}", "leaf", (Prop("totals", "DailyTotal[]", "array"),), "<TotalsCard totals={totals} />", ("default",)))
    # List, detail, add, and filter are scaffold for every pack. The model writes leaves only.
    components.append(Component("ListPage", f"src/views/ListPage{view}", "scaffold", (), "<ListPage />", ("default",), ("SearchBar", "FilterTabs", f"{spec.entity}Card", f"use{spec.entity}s")))
    components.append(Component("DetailPage", f"src/views/DetailPage{view}", "scaffold", (), "<DetailPage />", ("default",), (f"useSelected{spec.entity}",)))
    components.append(Component("FormPage", f"src/views/FormPage{view}", "scaffold", (), "<FormPage />", ("default",), (f"use{spec.entity}Actions",)))
    if "totals" in spec.features:
        components.append(Component("DashboardPage", f"src/views/DashboardPage{view}", "scaffold", (), "<DashboardPage />", ("default",), ("TotalsCard", "useTotals", f"use{spec.entity}s")))
    for extra in spec.extra_pages:
        components.append(Component(f"{extra}Page", f"src/views/{extra}Page{view}", "page", (), f"<{extra}Page />", ("default",), (f"use{spec.entity}s",)))
    theme, layout = _look(spec)
    return Contract(spec, entity, tuple(hooks), tuple(components), language, theme, layout)


def shared_prefix(contract: Contract) -> str:
    entity = contract.entity
    lines = [
        "Shared contract. Follow it exactly. Do not redefine scaffold files, types, hooks, or CSS.",
        f"App: {contract.spec.title}. Language: {contract.language}.",
        f"Entity {entity.name} type fields: " + ", ".join(f"{field.name}: {field.type_name}" for field in entity.fields),
        f"Sample {entity.name}: {json.dumps(entity.sample_object())}",
    ]
    if contract.spec.statuses:
        lines.append(f"Status field {contract.spec.status_field} is one of {', '.join(contract.spec.statuses)}.")
    lines.append("Hooks and the shape they return:")
    for hook in contract.hooks:
        lines.append(f"- {hook.name}(): {hook.return_type} ({hook.cardinality})")
    lines.append("Components, props, example call, exports:")
    for component in contract.components:
        props = ", ".join(f"{prop.name}: {prop.type_name} [{prop.cardinality}]" for prop in component.props) or "none"
        lines.append(f"- {component.name} file {component.path} kind {component.kind} props ({props}) example {component.example} exports {', '.join(component.exports)}")
    lines.append("SearchBar onChange receives the string value, never an event. TotalsCard totals is DailyTotal[] from useTotals(), never one row. A selected hook returns one object or null, and has no .map. FilterTabs statuses is string[].")
    lines.append("Write one file. No markdown fence. No extra files. Close every brace.")
    classes = (
        "app-shell", "navbar", "page", "entity-card", "filter-row", "totals-grid",
        "status-paid", "status-open", "status-unpaid", "status-overdue",
    )
    for index, name in enumerate(classes * 20, start=1):
        lines.append(
            f"Prefix rule {index}: .{name} is owned by the scaffold stylesheet. "
            "Generated files may use it as a className and must not emit a style block."
        )
    return "\n".join(lines) + "\n"


def _js_value(value: object) -> str:
    return json.dumps(value)


def _samples(contract: Contract, count: int = 4) -> list[dict[str, object]]:
    base = contract.entity.sample_object()
    rows = []
    statuses = contract.spec.statuses or ("Open",)
    for index in range(count):
        row = dict(base)
        row["id"] = f"{contract.entity.name[:3].upper()}-{1001 + index}"
        if contract.spec.status_field:
            row[contract.spec.status_field] = statuses[index % len(statuses)]
        for field in contract.entity.fields:
            if field.type_name == "string" and field.name != "id" and field.name != contract.spec.status_field:
                row[field.name] = f"{field.sample} {index + 1}"
        rows.append(row)
    return rows


def _owned_views(contract: Contract) -> dict[str, str]:
    """List, detail, form, and dashboard. The model does not write these."""
    entity = contract.entity.name
    view = _ext(contract.language, "view")
    logic = _ext(contract.language, "logic")
    status = contract.spec.status_field or "status"
    statuses = ["All", *contract.spec.statuses] if contract.spec.statuses else ["All"]
    label = next((field.name for field in contract.entity.fields if field.name != "id"), "id")
    tabs = ", ".join(json.dumps(item) for item in statuses)
    fields = [field for field in contract.entity.fields if field.name != "id"]
    files: dict[str, str] = {}
    filter_import = f"import FilterTabs from '../components/FilterTabs{view}'\n" if contract.component("FilterTabs") else ""
    filter_node = "      <FilterTabs statuses={STATUSES} active={active} onChange={setActive} />\n" if contract.component("FilterTabs") else ""
    list_params = "{ onOpen }: { onOpen?: (id: string) => void }" if contract.language == "ts" else "{ onOpen }"
    form_params = "{ onDone }: { onDone?: () => void }" if contract.language == "ts" else "{ onDone }"
    files[f"src/views/ListPage{view}"] = (
        "import { useState } from 'react'\n"
        f"import SearchBar from '../components/SearchBar{view}'\n"
        f"import PageHero from '../components/PageHero{view}'\n"
        f"import EmptyState from '../components/EmptyState{view}'\n"
        f"{filter_import}"
        f"import {entity}Card from '../components/{entity}Card{view}'\n"
        f"import {{ use{entity}s, use{entity}Actions }} from '../hooks/useData{logic}'\n"
        f"const STATUSES = [{tabs}]\n"
        f"export default function ListPage({list_params}) {{\n"
        f"  const items = use{entity}s()\n"
        f"  const {{ select }} = use{entity}Actions()\n"
        "  const [query, setQuery] = useState('')\n"
        "  const [active, setActive] = useState('All')\n"
        "  const visible = items.filter((item) => {\n"
        f"    const statusOk = active === 'All' || String(item.{status} ?? '') === active\n"
        "    const haystack = Object.values(item).map((value) => String(value ?? '')).join(' ').toLowerCase()\n"
        "    return statusOk && haystack.includes(query.trim().toLowerCase())\n"
        "  })\n"
        "  return (\n"
        "    <section className=\"page\">\n"
        "      <PageHero />\n"
        "      <SearchBar value={query} onChange={setQuery} />\n"
        f"{filter_node}"
        "      {visible.length === 0 ? <EmptyState /> : null}\n"
        f"      {{visible.map((item) => <{entity}Card key={{item.id}} item={{item}} onSelect={{(id) => {{ select(id); onOpen && onOpen(id) }}}} />)}}\n"
        "    </section>\n"
        "  )\n"
        "}\n"
    )
    rows = "\n".join(
        f"        <p><strong>{field.name}</strong> {{String(item.{field.name} ?? '')}}</p>"
        for field in contract.entity.fields
    )
    files[f"src/views/DetailPage{view}"] = (
        f"import {{ useSelected{entity} }} from '../hooks/useData{logic}'\n"
        "export default function DetailPage() {\n"
        f"  const item = useSelected{entity}()\n"
        "  if (!item) return <p>Select an item.</p>\n"
        "  return (\n"
        f"    <article className=\"page\"><p>{entity}</p><h2>{{item.{label} || item.id}}</h2>\n"
        f"{rows}\n"
        "    </article>\n"
        "  )\n"
        "}\n"
    )
    inputs = []
    for field in fields:
        if field.name == status and contract.spec.statuses:
            options = "\n".join(f'          <option value="{item}">{item}</option>' for item in contract.spec.statuses)
            inputs.append(
                f"      <label>{field.name}<select value={{values.{field.name}}} onChange={{(event) => setValues({{ ...values, {field.name}: event.target.value }})}}>\n{options}\n        </select></label>"
            )
        else:
            kind = "number" if field.type_name == "number" else "date" if "date" in field.name.lower() or field.name in {"when", "spentOn", "openedOn"} else "text"
            inputs.append(
                f"      <label>{field.name}<input type=\"{kind}\" value={{values.{field.name}}} onChange={{(event) => setValues({{ ...values, {field.name}: event.target.value }})}} /></label>"
            )
    initial = ", ".join(
        f"{field.name}: {json.dumps(contract.spec.statuses[0] if field.name == status and contract.spec.statuses else '')}"
        for field in fields
    )
    files[f"src/views/FormPage{view}"] = (
        "import { useState } from 'react'\n"
        f"import {{ use{entity}Actions }} from '../hooks/useData{logic}'\n"
        f"export default function FormPage({form_params}) {{\n"
        f"  const {{ addItem }} = use{entity}Actions()\n"
        f"  const [values, setValues] = useState({{ {initial} }})\n"
        "  return (\n"
        "    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>\n"
        + "\n".join(inputs)
        + "\n      <button type=\"submit\">Add</button>\n"
        "    </form>\n"
        "  )\n"
        "}\n"
    )
    if "totals" in contract.spec.features:
        files[f"src/views/DashboardPage{view}"] = (
            f"import {{ use{entity}s, useTotals }} from '../hooks/useData{logic}'\n"
            f"import TotalsCard from '../components/TotalsCard{view}'\n"
            "export default function DashboardPage() {\n"
            f"  const items = use{entity}s()\n"
            "  const totals = useTotals(items)\n"
            "  return <section className=\"page\"><h2>Totals</h2><TotalsCard totals={totals} /></section>\n"
            "}\n"
        )
    return files


def deterministic_files(contract: Contract) -> dict[str, str]:
    language = contract.language
    logic = _ext(language, "logic")
    view = _ext(language, "view")
    samples = _samples(contract)
    files: dict[str, str] = {}
    files["package.json"] = json.dumps({"name": contract.spec.slug, "private": True, "type": "module", "scripts": {"dev": "vite --host 0.0.0.0 --port 5173", "build": "vite build", "preview": "vite preview --host 0.0.0.0 --port 4173"}}, indent=2) + "\n"
    files["vite.config.js"] = "import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nexport default defineConfig({ plugins: [react()] })\n"
    files["public/favicon.svg"] = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">'
        '<rect width="16" height="16" rx="3" fill="#9a3412"/></svg>\n'
    )
    files["index.html"] = (
        "<!doctype html><html><head><meta charset=\"UTF-8\" />"
        f"<title>{contract.spec.title}</title>"
        f'<meta name="blueprint-title" content="{contract.spec.title}" />'
        f'<meta name="blueprint-entity" content="{contract.entity.name}" />'
        f'<meta name="blueprint-fields" content="{",".join(field.name for field in contract.entity.fields if field.name != "id")}" />'
        '<link rel="icon" href="/favicon.svg" />'
        f'</head><body><div id="root"></div><script type="module" src="/src/main{view}"></script></body></html>\n'
    )
    tokens = _THEME_TOKENS[contract.theme]
    files["src/styles/tokens.css"] = (
        ":root { "
        f"--ink: {tokens['ink']}; --paper: {tokens['paper']}; --line: {tokens['line']}; "
        f"--accent: {tokens['accent']}; --card: {tokens['card']}; --font: {tokens['font']}; "
        f"--radius: {tokens['radius']}; --ok: #3f6212; --warn: #a16207; --bad: #9f1239; }}\n"
    )
    files["src/styles/global.css"] = (
        "@import './tokens.css';\n"
        "body { margin: 0; font-family: var(--font); background: var(--paper); color: var(--ink); }\n"
        ".app-shell { max-width: 960px; margin: 0 auto; padding: 24px; }\n"
        ".navbar { border-bottom: 1px solid var(--line); margin-bottom: 12px; }\n"
        ".navbar h1 { font-size: 1.6rem; margin: 0 0 8px; }\n"
        ".route-nav, .filter-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }\n"
        ".page { display: grid; gap: 12px; }\n"
        ".layout-board .page { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }\n"
        ".layout-split .split { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 16px; }\n"
        ".order-card, .entity-card { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); padding: 12px 14px; color: inherit; text-align: left; }\n"
        ".filter-row button, .route-nav button, button { border: 1px solid var(--line); background: var(--card); color: var(--ink); border-radius: 999px; padding: 6px 12px; }\n"
        ".status-paid, .status-yes, .status-ok, .status-present, .status-done, .status-booked { color: var(--ok); }\n"
        ".status-unpaid, .status-open, .status-low, .status-waiting { color: var(--warn); }\n"
        ".status-partial, .status-overdue, .status-out, .status-no, .status-cancelled { color: var(--bad); }\n"
        "input, select { border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; background: var(--card); color: var(--ink); }\n"
        ".totals-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }\n"
        ".hero { padding: 28px 20px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--card); margin-bottom: 16px; }\n"
        ".hero h2 { margin: 0 0 8px; font-size: 2rem; }\n"
        ".chart-bars { display: flex; align-items: flex-end; gap: 8px; height: 120px; margin-bottom: 16px; }\n"
        ".chart-bars span { flex: 1; background: var(--accent); border-radius: 8px 8px 0 0; min-height: 8px; }\n"
        ".wizard-steps { display: flex; gap: 12px; list-style: none; padding: 0; margin: 0 0 16px; }\n"
        ".wizard-steps li { border-bottom: 2px solid var(--accent); padding-bottom: 4px; }\n"
    )
    files[f"src/types{logic}"] = _types_source(contract, samples[0])
    files[f"src/data/seed{logic}"] = _seed_source(contract, samples)
    files[f"src/hooks/useData{logic}"] = _hooks_source(contract)
    files[f"src/components/AppShell{view}"] = _scaffold_shell(language)
    files[f"src/components/Navbar{view}"] = _scaffold_navbar(language)
    files[f"src/components/SearchBar{view}"] = _scaffold_search(language)
    files[f"src/App{view}"] = _app_source(contract)
    files[f"src/main{view}"] = _main_source(contract)
    if contract.language == "ts":
        files["tsconfig.json"] = (
            '{"compilerOptions":{"target":"ES2022","module":"ESNext","moduleResolution":"Bundler",'
            '"jsx":"react-jsx","strict":true,"noEmit":true,"allowImportingTsExtensions":true,"skipLibCheck":true},'
            '"include":["src"]}\n'
        )
        package = json.loads(files["package.json"])
        package["scripts"]["tsc"] = "tsc --noEmit"
        package["devDependencies"] = {"typescript": "5.6.3"}
        files["package.json"] = json.dumps(package, indent=2) + "\n"
    files[f"src/components/FilterTabs{view}"] = _scaffold_filter(language)
    files.update(_owned_views(contract))
    return files


def _types_source(contract: Contract, sample: dict[str, object]) -> str:
    entity = contract.entity
    if contract.language == "ts":
        fields = "\n".join(f"  {field.name}: { _ts_type(field.type_name) };" for field in entity.fields)
        body = f"export interface {entity.name} {{\n{fields}\n}}\n\nexport interface DailyTotal {{ date: string; count: number; total: number }}\n\nexport const SAMPLE_{entity.name.upper()}: {entity.name} = {json.dumps(sample, indent=2)}\n"
        return body
    props = "\n".join(f" * @property {{{_jsdoc_type(field.type_name)}}} {field.name}" for field in entity.fields)
    return (
        f"/**\n * @typedef {{Object}} {entity.name}\n{props}\n */\n\n"
        "/**\n * @typedef {Object} DailyTotal\n * @property {string} date\n * @property {number} count\n * @property {number} total\n */\n\n"
        f"export const SAMPLE_{entity.name.upper()} = {json.dumps(sample, indent=2)}\n"
    )


def _ts_type(type_name: str) -> str:
    return {"string": "string", "number": "number"}.get(type_name, type_name)


def _jsdoc_type(type_name: str) -> str:
    return {"string": "string", "number": "number"}.get(type_name, type_name)


def _seed_source(contract: Contract, samples: list[dict[str, object]]) -> str:
    name = f"SEED_{contract.entity.name.upper()}S"
    if contract.language == "ts":
        return f"import type {{ {contract.entity.name} }} from '../types.ts'\nexport const {name}: {contract.entity.name}[] = {json.dumps(samples, indent=2)}\n"
    return f"/** @type {{import('../types.js').{contract.entity.name}[]}} */\nexport const {name} = {json.dumps(samples, indent=2)}\n"


def _hooks_source(contract: Contract) -> str:
    entity = contract.entity.name
    seed = f"SEED_{entity.upper()}S"
    logic = _ext(contract.language, "logic")
    selected = f"useSelected{entity}"
    collection = f"use{entity}s"
    actions = f"use{entity}Actions"
    prefix = contract.entity.name[:3].upper()
    lines = [
        "import { useMemo, useSyncExternalStore } from 'react'",
        f"import {{ {seed} }} from '../data/seed{logic}'",
    ]
    if contract.language == "ts":
        daily = ", DailyTotal" if any(hook.name == "useTotals" for hook in contract.hooks) else ""
        lines.append(f"import type {{ {entity}{daily} }} from '../types.ts'")
        lines.append(f"let items: {entity}[] = {seed}.slice()")
    else:
        lines.append(f"let items = {seed}.slice()")
    lines.extend([
        "let selectedId = null",
        "const listeners = new Set()",
        "function emit() { listeners.forEach((fn) => fn()) }",
        "function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }",
        "function snapshot() { return items }",
        f"export function {collection}() {{",
        "  return useSyncExternalStore(subscribe, snapshot, snapshot)",
        "}",
        f"export function {actions}() {{",
        "  return {",
        "    addItem(draft) {",
        "      const row = draft && typeof draft === 'object' ? { ...draft } : {}",
        "      if (typeof draft === 'function') draft(row)",
        f"      const id = row.id ? String(row.id) : '{prefix}-' + String(1000 + items.length + 1)",
        "      items = items.concat([{ ...row, id }])",
        "      selectedId = id",
        "      emit()",
        "    },",
        "    select(id) { selectedId = id; emit() },",
        "  }",
        "}",
    ])
    if contract.language == "ts":
        lines.append(f"export function {selected}(id: string | null = null): {entity} | null {{")
        lines.append(f"  const rows = {collection}()")
        lines.append("  const chosen = id ?? selectedId")
        lines.append("  return rows.find((item) => item.id === chosen) ?? null")
        lines.append("}")
    else:
        lines.append(f"/** @returns {{{entity}[]}} */")
        lines.append(f"/** @returns {{{entity} | null}} */")
        lines.append(f"export function {selected}(id) {{")
        lines.append(f"  const rows = {collection}()")
        lines.append("  const chosen = id ?? selectedId")
        lines.append("  return rows.find((item) => item.id === chosen) || null")
        lines.append("}")
    if contract.language == "ts":
        typed = {
            "let selectedId = null": "let selectedId: string | null = null",
            "const listeners = new Set()": "const listeners = new Set<() => void>()",
            "function emit() { listeners.forEach((fn) => fn()) }": "function emit() { listeners.forEach((fn: () => void) => fn()) }",
            "function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }": "function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) }",
            "function snapshot() { return items }": f"function snapshot(): {entity}[] {{ return items }}",
            "    addItem(draft) {": "    addItem(draft: { [key: string]: string | number | undefined } | ((row: { [key: string]: string | number | undefined }) => void)) {",
            "      const row = draft && typeof draft === 'object' ? { ...draft } : {}": "      const row: { [key: string]: string | number | undefined } = draft && typeof draft === 'object' ? { ...draft } : {}",
            "      items = items.concat([{ ...row, id }])": f"      items = items.concat([{{ ...row, id }} as {entity}])",
            "    select(id) { selectedId = id; emit() },": "    select(id: string) { selectedId = id; emit() },",
            "  const source = passed === undefined ? rows : passed": f"  const source: {entity}[] = passed === undefined ? rows : passed",
        }
        lines = [typed.get(line, line) for line in lines]
    # The collection JSDoc has to sit on the collection function. Re-insert it for the checker.
    if contract.language != "ts":
        rendered = "\n".join(lines)
        rendered = rendered.replace(
            f"export function {collection}()",
            f"/** @returns {{{entity}[]}} */\nexport function {collection}()",
            1,
        )
        lines = rendered.split("\n")
    if any(hook.name == "useTotals" for hook in contract.hooks):
        date_field = next((field.name for field in contract.entity.fields if "date" in field.name.lower() or field.name in {"when", "spentOn", "openedOn"}), contract.entity.fields[-1].name)
        amount = next((field.name for field in contract.entity.fields if field.type_name == "number"), None)
        if contract.language == "ts":
            lines.append(f"export function useTotals(passed?: {entity}[]): DailyTotal[] {{")
        else:
            lines.append("/** @returns {DailyTotal[]} */")
            lines.append("export function useTotals(passed) {")
        lines.append(f"  const rows = {collection}()")
        if contract.language == "ts":
            lines.append(f"  const source: {entity}[] = passed === undefined ? rows : passed")
        else:
            lines.append("  const source = passed === undefined ? rows : passed")
        lines.append("  return useMemo(() => {")
        if contract.language == "ts":
            lines.append("    const groups: Record<string, DailyTotal> = {}")
        else:
            lines.append("    const groups = {}")
        lines.append("    for (const item of source || []) {")
        lines.append(f"      const date = String(item.{date_field} || 'undated')")
        if amount:
            lines.append(f"      const amount = Number(item.{amount} || 0)")
        else:
            lines.append("      const amount = 1")
        lines.append("      if (!groups[date]) groups[date] = { date, count: 0, total: 0 }")
        lines.append("      groups[date].count += 1")
        lines.append("      groups[date].total += amount")
        lines.append("    }")
        lines.append("    return Object.values(groups)")
        lines.append("  }, [source])")
        lines.append("}")
    return "\n".join(lines) + "\n"


def _scaffold_shell(language: str) -> str:
    if language == "ts":
        return "import type { ReactNode } from 'react'\nexport default function AppShell({ children }: { children: ReactNode }) {\n  return <div className=\"app-shell\">{children}</div>\n}\n"
    return "/** @param {{ children: import('react').ReactNode }} props */\nexport default function AppShell({ children }) {\n  return <div className=\"app-shell\">{children}</div>\n}\n"


def _scaffold_navbar(language: str) -> str:
    if language == "ts":
        return "export default function Navbar({ title }: { title: string }) {\n  return <header className=\"navbar\"><h1>{title}</h1></header>\n}\n"
    return "/** @param {{ title: string }} props */\nexport default function Navbar({ title }) {\n  return <header className=\"navbar\"><h1>{title}</h1></header>\n}\n"


def _scaffold_filter(language: str) -> str:
    if language == "ts":
        return (
            "export default function FilterTabs({ statuses, active, onChange }: { statuses: string[], active: string, onChange: (value: string) => void }) {\n"
            "  return <div className=\"filter-row\">{statuses.map((status) => <button type=\"button\" key={status} onClick={() => onChange(status)}>{status}</button>)}</div>\n"
            "}\n"
        )
    return (
        "/** @param {{ statuses: string[], active: string, onChange: (value: string) => void }} props */\n"
        "export default function FilterTabs({ statuses, active, onChange }) {\n"
        "  return <div className=\"filter-row\">{(statuses || []).map((status) => <button type=\"button\" key={status} onClick={() => onChange(status)}>{status}</button>)}</div>\n"
        "}\n"
    )


def _scaffold_search(language: str) -> str:
    if language == "ts":
        return "export default function SearchBar({ value, onChange, placeholder }: { value: string, onChange: (value: string) => void, placeholder?: string }) {\n  return <input value={value} placeholder={placeholder || 'Search'} onChange={(event) => onChange(event.target.value)} />\n}\n"
    return "/** @param {{ value: string, onChange: (value: string) => void, placeholder?: string }} props */\nexport default function SearchBar({ value, onChange, placeholder }) {\n  return <input value={value} placeholder={placeholder || 'Search'} onChange={(event) => onChange(event.target.value)} />\n}\n"


def _routes(contract: Contract) -> list[tuple[str, str, str]]:
    """route id, button label, element. One route is visible at a time."""
    routes = [
        ("list", "List", "<ListPage onOpen={() => setRoute('detail')} />"),
        ("detail", "Detail", "<DetailPage />"),
        ("form", "New", "<FormPage onDone={() => setRoute('list')} />"),
    ]
    if "totals" in contract.spec.features:
        routes.append(("dashboard", "Totals", "<DashboardPage />"))
    for extra in contract.spec.extra_pages:
        routes.append((extra.lower(), extra, f"<{extra}Page />"))
    return routes


def _app_source(contract: Contract) -> str:
    view = _ext(contract.language, "view")
    pages = [component for component in contract.components if "/views/" in component.path]
    imports = [
        "import { useState } from 'react'",
        "import AppShell from './components/AppShell" + view + "'",
        "import Navbar from './components/Navbar" + view + "'",
    ]
    imports.extend(f"import {component.name} from './views/{component.name}{view}'" for component in pages)
    routes = _routes(contract)
    titles = {route: contract.spec.title for route, _label, _element in routes}
    buttons = "\n        ".join(
        f"<button type=\"button\" data-route=\"{route}\" onClick={{() => setRoute('{route}')}}>{label}</button>"
        for route, label, _element in routes
    )
    branches = []
    for route, _label, element in routes:
        if contract.layout == "split" and route == "list" and "detail" in contract.spec.features:
            branches.append(
                "route === 'list' ? (\n"
                "        <div className=\"split\"><ListPage onOpen={() => setRoute('detail')} /><DetailPage /></div>\n"
                "      )"
            )
            continue
        if contract.layout == "split" and route == "detail":
            branches.append("route === 'detail' ? (\n        <DetailPage />\n      )")
            continue
        branches.append(f"route === '{route}' ? (\n        {element}\n      )")
    chain = " : ".join(branches) + " : null"
    title_pairs = ", ".join(f"{route}: {json.dumps(title)}" for route, title in titles.items())
    pack = contract.spec.pack
    if pack == "landing":
        banner = f'<section className="hero"><p>Landing</p><h2>{contract.spec.title}</h2><p>Plans, a short pitch, and a way to leave a name.</p></section>'
    elif pack == "charts":
        bars = "".join(f'<span style={{{{height: "{20 + index * 18}px"}}}} />' for index in range(4))
        banner = f'<div className="chart-bars" aria-label="chart">{bars}</div>'
    elif pack == "wizard":
        banner = '<ol className="wizard-steps"><li>Start</li><li>Details</li><li>Review</li></ol>'
    else:
        banner = ""
    return (
        "\n".join(imports)
        + "\n\nexport default function App() {\n"
        + (
            "  const [route, setRoute] = useState<" + " | ".join(f"'{route}'" for route, _label, _element in routes) + ">('list')\n"
            f"  const titles: Record<string, string> = {{ {title_pairs} }}\n"
            if contract.language == "ts"
            else "  const [route, setRoute] = useState('list')\n" + f"  const titles = {{ {title_pairs} }}\n"
        )
        + "  return (\n"
        + f"    <AppShell>\n      <div className=\"layout-{contract.layout} theme-{contract.theme}\">\n"
        + f"      {banner}\n      <Navbar title={{titles[route] || titles.list}} />\n"
        + f"      <nav className=\"route-nav\">{buttons}</nav>\n"
        + "      { " + chain + " }\n"
        + "      </div>\n    </AppShell>\n  )\n}\n"
    )


def _main_source(contract: Contract) -> str:
    view = _ext(contract.language, "view")
    return (
        f"import React from 'react'\nimport {{ createRoot }} from 'react-dom/client'\n"
        f"import './styles/global.css'\nimport App from './App{view}'\n"
        "const root = document.getElementById('root')\n"
        "if (root) createRoot(root).render(<React.StrictMode><App /></React.StrictMode>)\n"
    )


def _relative(source: str, target: str) -> str:
    rel = posixpath.relpath(target, posixpath.dirname(source))
    if not rel.startswith("."):
        rel = "./" + rel
    return rel


def import_map(contract: Contract, component: Component) -> str:
    """Exact import lines for one file. The model is told not to invent paths."""
    logic = _ext(contract.language, "logic")
    hooks = ", ".join(hook.name for hook in contract.hooks)
    lines = [
        "Import map. Copy these lines. Do not invent another path.",
        f"import {{ {hooks} }} from '{_relative(component.path, 'src/hooks/useData' + logic)}'",
    ]
    for other in contract.components:
        if other.path == component.path:
            continue
        if other.name not in component.uses and other.kind != "scaffold":
            continue
        if other.name not in component.uses:
            continue
        lines.append(f"import {other.name} from '{_relative(component.path, other.path)}'")
    lines.append("package.json, vite.config.js, index.html, tokens.css, global.css, types, seed, and hooks are scaffold files. Do not write them.")
    return "\n".join(lines)


def file_task(contract: Contract, component: Component) -> str:
    props = ", ".join(f"{prop.name}: {prop.type_name}" for prop in component.props) or "none"
    uses = ", ".join(component.uses) or "scaffold only"
    fields = ", ".join(field.name for field in contract.entity.fields)
    statuses = ", ".join(contract.spec.statuses)
    return (
        f"Write the complete file {component.path} and nothing else.\n"
        f"Export: {', '.join(component.exports)}.\n"
        f"Props: {props}. Optional page props: onOpen(id), onDone().\n"
        f"Example call, which callers already use: {component.example}\n"
        f"You may use: {uses}.\n"
        f"{import_map(contract, component)}\n"
        f"Entity fields: {fields}. Statuses: {statuses or 'none'}. Status field: {contract.spec.status_field or 'none'}.\n"
        f"Features to show if this is a page: {', '.join(contract.spec.features)}.\n"
        "Do not render AppShell, Navbar, or an h1. The shell already shows the single title.\n"
        "If this is ListPage, keep query in useState, filter the array from the collection hook, and on card select call select(id) from the actions hook and then onOpen(id).\n"
        "When filtering, coerce every field with String(value ?? '') before toLowerCase. A missing field must not throw.\n"
        "If this is DashboardPage, call useTotals(items) with the collection array and pass that array to TotalsCard as totals.\n"
        "If this is FormPage, one controlled input per entity field except id. Call addItem with one plain object and no id, for example addItem({ name: value }). Never pass a function. Then call onDone().\n"
        "If this is DetailPage, call the selected hook with no arguments and render that one object, not a list.\n"
        f"If this is PageHero, the heading is exactly {json.dumps(contract.spec.title)} and the visible text includes the entity name {json.dumps(contract.entity.name)}. Import one icon from 'lucide-react'. Do not use the raw prompt as the heading.\n"
        f"If this is EmptyState, write one sentence that names the noun {json.dumps(contract.spec.noun)}.\n"
        "If this is a card, keep className entity-card, call onSelect(item.id), and show every field name as a visible label beside its value.\n"
        "Do not import CSS. Do not invent hooks. Do not write package.json."
    )


_CALL_RE = re.compile(r"<([A-Z][A-Za-z0-9]*)\b([^<>]*)>")
_PROP_RE = re.compile(r"([A-Za-z_][A-Za-z0-9_]*)=\{([^}]+)\}")
_HOOK_BIND_RE = re.compile(r"(?:const|let)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(use[A-Za-z0-9_]*)\s*\(")
_MAP_PARAM_RE = re.compile(r"\.map\(\s*\(?\s*([A-Za-z_][A-Za-z0-9_]*)")


def brace_balance(text: str) -> dict[str, int]:
    stripped = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    stripped = re.sub(r"//.*?$", "", stripped, flags=re.M)
    stripped = re.sub(r"'(?:\\.|[^'])*'|\"(?:\\.|[^\"])*\"|`(?:\\.|[^`])*`", "''", stripped)
    return {
        "curly": stripped.count("{") - stripped.count("}"),
        "round": stripped.count("(") - stripped.count(")"),
        "square": stripped.count("[") - stripped.count("]"),
    }


def file_is_closed(text: str) -> bool:
    balance = brace_balance(text)
    return all(value == 0 for value in balance.values()) and bool(text.strip())


def css_problems(text: str) -> list[str]:
    problems = []
    balance = brace_balance(text)
    if balance["curly"] != 0:
        problems.append(f"unclosed CSS braces ({balance['curly']})")
    if re.search(r"@[a-z-]+\s*\{[^}]*$", text, re.S):
        problems.append("unclosed at-rule")
    return problems


@dataclass(frozen=True)
class Mismatch:
    path: str
    callee: str
    caller: str
    prop: str
    detail: str

    @property
    def implicated(self) -> tuple[str, str]:
        return (self.caller, self.callee)


def normalize_imports(files: dict[str, str], contract: Contract) -> int:
    """Point hook and component imports at the files the contract actually emits."""
    logic = _ext(contract.language, "logic")
    view = _ext(contract.language, "view")
    targets = {hook.name: f"src/hooks/useData{logic}" for hook in contract.hooks}
    targets.update({component.name: component.path for component in contract.components})
    pattern = re.compile(r"""(from\s+['"])(\.\.?/[^'"]+)(['"])""")
    changed = 0

    def _resolves(source: str, spec: str) -> bool:
        source_dir = posixpath.dirname(source)
        target = posixpath.normpath(posixpath.join(source_dir, spec))
        if target in files:
            return True
        stem = target if Path(target).suffix else target
        suffixes = ("",) if Path(target).suffix else (".js", ".jsx", ".ts", ".tsx")
        return any(f"{stem}{suffix}" in files for suffix in suffixes)

    def _relative(source: str, target: str) -> str:
        rel = posixpath.relpath(target, posixpath.dirname(source))
        if not rel.startswith("."):
            rel = "./" + rel
        return rel

    for path, content in list(files.items()):
        def _replace(match: re.Match[str], source: str = path) -> str:
            nonlocal changed
            spec = match.group(2)
            if _resolves(source, spec):
                return match.group(0)
            base = Path(spec).name
            base = re.sub(r"\.(jsx|tsx|js|ts)$", "", base)
            target = targets.get(base)
            if target is None or target not in files:
                return match.group(0)
            changed += 1
            return match.group(1) + _relative(source, target) + match.group(3)

        files[path] = pattern.sub(_replace, content)
    default_hook = re.compile(r"""import\s+(\w+)\s+from\s+(['"])(\.\./hooks/useData[^'"]*)\2""")
    hook_names = set(targets)
    for path, content in list(files.items()):
        def _named(match: re.Match[str]) -> str:
            nonlocal changed
            name = match.group(1)
            if name not in hook_names:
                return match.group(0)
            changed += 1
            quote = match.group(2)
            return f"import {{ {name} }} from {quote}{match.group(3)}{quote}"

        files[path] = default_hook.sub(_named, content)
    return changed


def strip_page_chrome(text: str) -> str:
    """The shell owns the title. Drop a page-level shell or navbar if the model adds one."""
    text = re.sub(r"import\s+AppShell\s+from\s+['\"][^'\"]+['\"];?\n", "", text)
    text = re.sub(r"import\s+Navbar\s+from\s+['\"][^'\"]+['\"];?\n", "", text)
    text = re.sub(r"<Navbar\b[^>]*/>", "", text)
    text = re.sub(r"</?AppShell>", "", text)
    return text


def apply_blueprint_edit(spec: AppSpec, kind: str, **kwargs: object) -> AppSpec:
    """Regenerate the contract from a blueprint edit. The model does not rewrite types or hooks."""
    fields = list(spec.fields)
    if kind == "add-field":
        fields.append((str(kwargs["name"]), str(kwargs.get("type_name", "string")), kwargs.get("sample", "Sample")))
        return replace(spec, fields=tuple(fields))
    if kind == "rename":
        old, new = str(kwargs["old"]), str(kwargs["new"])
        renamed = tuple((new, type_name, sample) if name == old else (name, type_name, sample) for name, type_name, sample in fields)
        status = new if spec.status_field == old else spec.status_field
        return replace(spec, fields=renamed, status_field=status)
    if kind == "new-filter":
        statuses = tuple(dict.fromkeys((*spec.statuses, str(kwargs["status"]))))
        return replace(spec, statuses=statuses)
    if kind == "new-page":
        pages = tuple(dict.fromkeys((*spec.extra_pages, str(kwargs["name"]))))
        return replace(spec, extra_pages=pages)
    if kind == "change-label":
        return replace(spec, title=str(kwargs["title"])[:40])
    raise ValueError(kind)


def overlay_behaviour(files: dict[str, str], spec: AppSpec) -> bool:
    """Replace behaviour files when the saved entity matches the spec. Cards stay."""
    hook = files.get("src/hooks/useData.js") or files.get("src/hooks/useData.ts") or ""
    match = re.search(r"export function use([A-Z][A-Za-z]*)s\(", hook)
    if not match or match.group(1) != spec.entity:
        return False
    fresh = deterministic_files(build_contract(spec, "jsdoc"))
    for path, body in fresh.items():
        if path.startswith("src/components/") and path.split("/")[-1] not in {"AppShell.jsx", "Navbar.jsx", "SearchBar.jsx"}:
            continue
        if path.startswith("src/views/") or path.startswith("src/hooks/") or path.endswith("App.jsx"):
            files[path] = body
    return True


def lock_scaffold(files: dict[str, str], contract: Contract) -> None:
    """package.json and the other deterministic files always come from the scaffold."""
    fresh = deterministic_files(contract)
    model_paths = {component.path for component in contract.llm_components()}
    for path, body in fresh.items():
        if path not in model_paths:
            files[path] = body


def _import_resolves(source: str, spec: str, files: dict[str, str]) -> bool:
    target = posixpath.normpath(posixpath.join(posixpath.dirname(source), spec))
    if target in files:
        return True
    suffixes = ("",) if Path(target).suffix else (".js", ".jsx", ".ts", ".tsx")
    stem = target if Path(target).suffix else target
    return any(f"{stem}{suffix}" in files for suffix in suffixes)


def missing_imports(files: dict[str, str], contract: Contract) -> list[str]:
    _ = contract
    pattern = re.compile(r"""from\s+['"](\.\.?/[^'"]+)['"]""")
    missing = []
    for path, content in files.items():
        for spec in pattern.findall(content):
            if not _import_resolves(path, spec, files):
                missing.append(f"{path} -> {spec}")
    return missing


def find_mismatches(files: dict[str, str], contract: Contract) -> list[Mismatch]:
    found: list[Mismatch] = []
    hooks = {hook.name: hook for hook in contract.hooks}
    for path, content in files.items():
        if not path.endswith((".js", ".jsx", ".ts", ".tsx")):
            continue
        bindings = {name: hooks[hook] for name, hook in _HOOK_BIND_RE.findall(content) if hook in hooks}
        map_params = set(_MAP_PARAM_RE.findall(content))
        shielded = content.replace("=>", "\x00")
        for match in _CALL_RE.finditer(shielded):
            callee_name = match.group(1)
            component = contract.component(callee_name)
            if component is None:
                continue
            callee_path = component.path
            for prop_name, expr in _PROP_RE.findall(match.group(2).replace("\x00", "=>")):
                prop = next((item for item in component.props if item.name == prop_name), None)
                if prop is None:
                    continue
                problem = _prop_problem(prop, expr.strip(), bindings, map_params, hooks)
                if problem:
                    found.append(Mismatch(callee_path, callee_name, path, prop_name, problem))
        for name, hook in bindings.items():
            if hook.cardinality == "single" and re.search(rf"\b{name}\s*\.map\s*\(", content):
                found.append(Mismatch(path, hook.name, path, name, f"{hook.name} returns a single value and is mapped as an array"))
    return found


def _prop_problem(prop: Prop, expr: str, bindings: dict[str, Hook], map_params: set[str], hooks: dict[str, Hook]) -> str | None:
    if prop.cardinality == "callback" and ".target" in expr:
        return f"{prop.name} receives a string, but the call passes an event via .target"
    if prop.cardinality == "array":
        if expr in map_params:
            return f"{prop.name} expects {prop.type_name}, but the call passes one map item"
        hook = bindings.get(expr)
        if hook and hook.cardinality == "single":
            return f"{prop.name} expects an array, but {hook.name} returns a single value"
        called = re.match(r"(use[A-Za-z0-9_]*)\s*\(", expr)
        if called and called.group(1) in hooks and hooks[called.group(1)].cardinality == "single":
            return f"{prop.name} expects an array, but {called.group(1)} returns a single value"
    if prop.cardinality == "single":
        hook = bindings.get(expr)
        if hook and hook.cardinality == "array":
            return f"{prop.name} expects one {prop.type_name}, but {hook.name} returns an array"
    return None


def mismatch_rate(files: dict[str, str], contract: Contract) -> float:
    calls = 0
    for content in files.values():
        calls += len(_CALL_RE.findall(content))
    mismatches = find_mismatches(files, contract)
    if calls == 0:
        return 0.0
    return len(mismatches) / calls


def token_cap(kind: str) -> int:
    return {"leaf": 1600, "page": 1800, "scaffold": 0}.get(kind, 1200)
