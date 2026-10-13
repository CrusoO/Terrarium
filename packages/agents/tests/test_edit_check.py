from terrarium_agents.edit_check import edit_matches_request


def test_status_filter_in_jsx_passes() -> None:
    files = {
        "src/views/OrderList.jsx": """
export default function OrderList() {
  const [statusFilter, setStatusFilter] = useState("all");
  const visible = orders.filter((order) => statusFilter === "all" || order.status === statusFilter);
  return <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} />;
}
"""
    }
    result = edit_matches_request("Add a status filter to the main list.", files)
    assert result["ok"] is True
    assert result["evidenceFiles"] == ["src/views/OrderList.jsx"]


def test_status_filter_css_only_fails() -> None:
    files = {"src/styles/global.css": ".filter-tab { color: blue; } .status-badge { }"}
    result = edit_matches_request("Add a status filter to the main list. Go ahead and build it.", files)
    assert result["ok"] is False
    assert result["cssOnly"] is True


def test_status_filter_not_already_in_the_list_fails() -> None:
    """A list that only searches by text does not already contain the requested filter."""
    files = {
        "src/views/OrderList.jsx": """
export default function OrderList({ orders }) {
  const [query, setQuery] = useState("");
  const visible = orders.filter((order) => order.customer.toLowerCase().includes(query.toLowerCase()));
  return <input value={query} onChange={(event) => setQuery(event.target.value)} />;
}
"""
    }
    result = edit_matches_request("Add a status filter to the main list.", files)
    assert result["ok"] is False
    assert result["cssOnly"] is False
    assert result["evidenceFiles"] == []
