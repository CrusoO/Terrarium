import { useEffect, useMemo, useState } from "react";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import { Box, Stack, Typography } from "@mui/material";
import type { FileMap } from "@terrarium/contracts";

const PRIORITY = ["index.html", "README.md", "styles.css", "app.js"];

type TreeNode = {
  name: string;
  path: string;
  children: Map<string, TreeNode>;
};

function fileNames(files: FileMap): string[] {
  const names = Object.keys(files);
  return [
    ...PRIORITY.filter((name) => names.includes(name)),
    ...names.filter((name) => !PRIORITY.includes(name)).sort(),
  ];
}

function sortNames(a: string, b: string): number {
  const aPriority = PRIORITY.indexOf(a);
  const bPriority = PRIORITY.indexOf(b);
  if (aPriority !== -1 || bPriority !== -1) {
    return (aPriority === -1 ? 99 : aPriority) - (bPriority === -1 ? 99 : bPriority);
  }
  return a.localeCompare(b);
}

function buildTree(paths: string[]): TreeNode {
  const root: TreeNode = { name: "", path: "", children: new Map() };
  for (const path of paths) {
    const parts = path.split("/").filter(Boolean);
    let current = root;
    parts.forEach((part, index) => {
      const childPath = parts.slice(0, index + 1).join("/");
      let child = current.children.get(part);
      if (!child) {
        child = { name: part, path: childPath, children: new Map() };
        current.children.set(part, child);
      }
      current = child;
    });
  }
  return root;
}

function orderedChildren(node: TreeNode): TreeNode[] {
  return Array.from(node.children.values()).sort((a, b) => {
    const aFolder = a.children.size > 0;
    const bFolder = b.children.size > 0;
    if (aFolder !== bFolder) {
      return aFolder ? -1 : 1;
    }
    return sortNames(a.name, b.name);
  });
}

function FileTree({
  node,
  selected,
  onSelect,
  depth = 0,
}: {
  node: TreeNode;
  selected: string | undefined;
  onSelect: (path: string) => void;
  depth?: number;
}) {
  return (
    <>
      {orderedChildren(node).map((child) => {
        const isFolder = child.children.size > 0;
        const active = child.path === selected;
        return (
          <Box key={child.path}>
            <Box
              component="button"
              type="button"
              onClick={() => {
                if (!isFolder) onSelect(child.path);
              }}
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                minHeight: 30,
                pl: 1 + depth * 1.5,
                pr: 1,
                border: 0,
                borderRadius: 1,
                bgcolor: active ? "primary.light" : "transparent",
                color: active ? "primary.dark" : "text.secondary",
                cursor: isFolder ? "default" : "pointer",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                textAlign: "left",
                "&:hover": {
                  bgcolor: isFolder ? "transparent" : active ? "primary.light" : "action.hover",
                },
              }}
            >
              {isFolder ? (
                <FolderRoundedIcon sx={{ fontSize: 16, color: "primary.main" }} />
              ) : (
                <InsertDriveFileRoundedIcon sx={{ fontSize: 15 }} />
              )}
              <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {child.name}
              </Box>
            </Box>
            {isFolder ? (
              <FileTree node={child} selected={selected} onSelect={onSelect} depth={depth + 1} />
            ) : null}
          </Box>
        );
      })}
    </>
  );
}

export function CodePanel({ files }: { files: FileMap | null }) {
  const names = useMemo(() => (files ? fileNames(files) : []), [files]);
  const [active, setActive] = useState(names[0] ?? "index.html");
  const selected = names.includes(active) ? active : names[0];
  const body = selected && files ? files[selected] : "";
  const tree = useMemo(() => buildTree(names), [names]);

  useEffect(() => {
    if (selected && active !== selected) {
      setActive(selected);
    }
  }, [active, selected]);

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
    <Box sx={{ display: "grid", gridTemplateColumns: "260px minmax(0, 1fr)", flex: 1, minHeight: 0 }}>
      <Box
        sx={{
          minHeight: 0,
          overflow: "auto",
          borderRight: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          px: 1,
          py: 1.25,
        }}
      >
        <Stack spacing={0.25}>
          <Typography
            variant="overline"
            sx={{ px: 1, color: "text.secondary", fontWeight: 700, fontSize: "0.68rem" }}
          >
            Project files ({names.length})
          </Typography>
          <FileTree node={tree} selected={selected} onSelect={setActive} />
        </Stack>
      </Box>
      <Box sx={{ display: "flex", minWidth: 0, minHeight: 0, flexDirection: "column" }}>
        <Box
          sx={{
            px: 2,
            py: 1,
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>
            {selected}
          </Typography>
        </Box>
        <Box
          component="pre"
          className="code-viewer"
          sx={{
            flex: 1,
            minHeight: 0,
            m: 0,
            px: 2,
            py: 1.5,
            overflow: "auto",
            whiteSpace: "pre",
            tabSize: 2,
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            lineHeight: 1.6,
            bgcolor: "background.default",
          }}
        >
          {body}
        </Box>
      </Box>
    </Box>
  );
}
