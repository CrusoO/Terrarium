import { useEffect, useState } from "react";
import type { ToolHealth } from "@terrarium/contracts";
import { fetchToolHealth } from "../../api/trust";
import { HealthBadge } from "./HealthBadge";

export function ToolCardHealth({ toolId }: { toolId: string }) {
  const [health, setHealth] = useState<ToolHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchToolHealth(toolId)
      .then((res) => setHealth(res.live ?? res.draft ?? null))
      .catch(() => setHealth(null))
      .finally(() => setLoading(false));
  }, [toolId]);

  return <HealthBadge health={health} loading={loading} />;
}
