import React, { useState } from "react";
import Dashboard from "./pages/Dashboard";
import JobDetail from "./pages/JobDetail";

export default function App() {
  const [page, setPage] = useState({ name: "dashboard" });

  const navigate = (name, params = {}) => setPage({ name, ...params });

  if (page.name === "detail") {
    return <JobDetail jobId={page.jobId} navigate={navigate} />;
  }

  return <Dashboard navigate={navigate} />;
}
