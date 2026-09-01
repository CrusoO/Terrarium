import { useMemo, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import type { FileMap } from "@terrarium/contracts";

const PRIORITY = ["index.html", "app.js", "styles.css"];

function fileNames(files: FileMap): string[] {
  const names = Object.keys(files);
  return [
    ...PRIORITY.filter((name) => names.includes(name)),
    ...names.filter((name) => !PRIORITY.includes(name)).sort(),
  ];
}

export function CodePanel({ files }: { files: FileMap | null }) {
  const names = useMemo(() => (files ? fileNames(files) : []), [files]);
  const [active, setActive] = useState(names[0] ?? "index.html");
  const selected = names.includes(active) ? active : names[0];
  const body = selected && files ? files[selected] : "";

  if (!files || names.length === 0) {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", maxWidth: 280 }}>
          Generated files show up here after the draft sandbox boots. The live tool stays on the Preview tab.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flex: 1, minHeight: 0, flexDirection: "column" }}>
      <Stack
        direction="row"
        spacing={0.75}
        sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: "divider", flexWrap: "wrap", rowGap: 0.75 }}
      >
        {names.map((name) => (
          <Chip
            key={name}
            label={name}
            size="small"
            variant={name === selected ? "filled" : "outlined"}
            color={name === selected ? "primary" : "default"}
            onClick={() => setActive(name)}
          />
        ))}
      </Stack>
      <Box
        component="pre"
        sx={{
          flex: 1,
          minHeight: 0,
          m: 0,
          px: 2,
          py: 1.5,
          overflow: "auto",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          fontSize: 12,
          lineHeight: 1.5,
          bgcolor: "background.default",
        }}
      >
        {body}
      </Box>
    </Box>
  );
}
