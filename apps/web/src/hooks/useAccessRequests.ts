import { useCallback, useEffect, useRef, useState } from "react";
import { approveRequest, denyRequest, getPendingRequests, type AccessRequest } from "../api/groups";
import { shareTool } from "../api/sessions";

const POLL_MS = 6000;

export function useAccessRequests(ownerId: string) {
  const [pending, setPending] = useState<AccessRequest[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!ownerId) return;
    try { setPending(await getPendingRequests(ownerId)); }
    catch { /* not authed yet */ }
  }, [ownerId]);

  useEffect(() => {
    void refresh();
    timerRef.current = setInterval(() => void refresh(), POLL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [refresh]);

  const approve = useCallback(async (requestId: string) => {
    const req = pending.find((item) => item.id === requestId);
    if (req?.tool_id && req.requester_id) {
      await shareTool(req.tool_id, { emailOrUserId: req.requester_id, role: "editor" });
    }
    await approveRequest(requestId);
    setPending((prev) => prev.filter((r) => r.id !== requestId));
  }, [pending]);

  const deny = useCallback(async (requestId: string) => {
    await denyRequest(requestId);
    setPending((prev) => prev.filter((r) => r.id !== requestId));
  }, []);

  return { pending, approve, deny };
}
