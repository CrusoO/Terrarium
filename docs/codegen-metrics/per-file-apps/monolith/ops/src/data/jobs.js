import { subDays, addDays, subHours } from "date-fns";

const now = new Date();

export const STATUSES = ["Pending", "In Progress", "On Hold", "Completed", "Cancelled"];

export const PRIORITIES = ["Low", "Medium", "High", "Critical"];

export const CATEGORIES = ["Maintenance", "Installation", "Inspection", "Repair", "Delivery", "Audit"];

export const ASSIGNEES = [
  "Alice Morgan",
  "Bob Chen",
  "Carlos Rivera",
  "Diana Patel",
  "Ethan Brooks",
  "Fiona Walsh",
];

let idCounter = 100;
const uid = () => `JOB-${++idCounter}`;

export const seedJobs = () => [
  {
    id: uid(), title: "HVAC Filter Replacement", category: "Maintenance",
    status: "Completed", priority: "Low", assignee: "Alice Morgan",
    created: subDays(now, 10).toISOString(), due: subDays(now, 3).toISOString(),
    description: "Replace all HVAC filters on floors 2–5 of Building A.",
    notes: "Completed ahead of schedule. All filters replaced with MERV-13.",
  },
  {
    id: uid(), title: "Server Room Inspection", category: "Inspection",
    status: "In Progress", priority: "High", assignee: "Bob Chen",
    created: subDays(now, 5).toISOString(), due: addDays(now, 1).toISOString(),
    description: "Quarterly inspection of server room cooling and power systems.",
    notes: "Found minor cable management issues. Documenting for follow-up.",
  },
  {
    id: uid(), title: "Elevator Safety Audit", category: "Audit",
    status: "Pending", priority: "Critical", assignee: "Carlos Rivera",
    created: subDays(now, 2).toISOString(), due: subDays(now, 1).toISOString(),
    description: "Annual elevator safety compliance audit required by regulation.",
    notes: "",
  },
  {
    id: uid(), title: "Parking Lot Lighting Repair", category: "Repair",
    status: "On Hold", priority: "Medium", assignee: "Diana Patel",
    created: subDays(now, 8).toISOString(), due: subDays(now, 2).toISOString(),
    description: "Three lighting poles in Lot C are non-functional.",
    notes: "Waiting on parts delivery from vendor.",
  },
  {
    id: uid(), title: "Fire Suppression System Test", category: "Inspection",
    status: "Pending", priority: "Critical", assignee: "Ethan Brooks",
    created: subDays(now, 1).toISOString(), due: subDays(now, 0).toISOString(),
    description: "Monthly test of fire suppression system across all zones.",
    notes: "",
  },
  {
    id: uid(), title: "Office Furniture Delivery", category: "Delivery",
    status: "In Progress", priority: "Low", assignee: "Fiona Walsh",
    created: subDays(now, 3).toISOString(), due: addDays(now, 2).toISOString(),
    description: "Deliver and assemble 20 standing desks for Floor 3.",
    notes: "12 desks assembled. 8 remaining.",
  },
  {
    id: uid(), title: "Network Switch Installation", category: "Installation",
    status: "Pending", priority: "High", assignee: "Bob Chen",
    created: subDays(now, 4).toISOString(), due: addDays(now, 3).toISOString(),
    description: "Install new 48-port managed switch in IDF closet B2.",
    notes: "",
  },
  {
    id: uid(), title: "Roof Leak Repair", category: "Repair",
    status: "In Progress", priority: "Critical", assignee: "Carlos Rivera",
    created: subDays(now, 6).toISOString(), due: subDays(now, 4).toISOString(),
    description: "Active leak detected in roof section near HVAC unit 7.",
    notes: "Temporary patch applied. Permanent repair scheduled.",
  },
  {
    id: uid(), title: "Security Camera Upgrade", category: "Installation",
    status: "Cancelled", priority: "Medium", assignee: "Alice Morgan",
    created: subDays(now, 15).toISOString(), due: subDays(now, 7).toISOString(),
    description: "Replace analog cameras with IP cameras in lobby and parking.",
    notes: "Project cancelled due to budget freeze.",
  },
  {
    id: uid(), title: "Plumbing Inspection – B Wing", category: "Inspection",
    status: "Completed", priority: "Medium", assignee: "Diana Patel",
    created: subDays(now, 12).toISOString(), due: subDays(now, 5).toISOString(),
    description: "Inspect all plumbing fixtures and pipes in B Wing.",
    notes: "No issues found. All fixtures operational.",
  },
  {
    id: uid(), title: "Generator Maintenance", category: "Maintenance",
    status: "Pending", priority: "High", assignee: "Ethan Brooks",
    created: subHours(now, 6).toISOString(), due: addDays(now, 5).toISOString(),
    description: "Scheduled maintenance on backup generator unit G-02.",
    notes: "",
  },
  {
    id: uid(), title: "Chemical Storage Audit", category: "Audit",
    status: "On Hold", priority: "High", assignee: "Fiona Walsh",
    created: subDays(now, 9).toISOString(), due: subDays(now, 3).toISOString(),
    description: "Audit chemical storage compliance per OSHA standards.",
    notes: "Waiting on updated OSHA guidelines before proceeding.",
  },
];
