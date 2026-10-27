import { Stack, Typography } from "@mui/material";
import { ToolCardHealth } from "../trust/ToolCardHealth";
import { WhatsAppConnect } from "../trust/WhatsAppConnect";
import type { ToolSummary } from "@terrarium/contracts";

type Props = { tools: ToolSummary[] };

export function SecurityPage({ tools }: Props) {
  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Typography variant="h5">Security</Typography>
      <WhatsAppConnect />
      <Typography variant="body2" color="text.secondary">
        Campaigns, ledger entries, and pending approvals appear here as nightly scans run.
      </Typography>
      {tools.map((tool) => (
        <Stack key={tool.id} direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography variant="body1">{tool.name}</Typography>
          <ToolCardHealth toolId={tool.id} />
        </Stack>
      ))}
    </Stack>
  );
}
