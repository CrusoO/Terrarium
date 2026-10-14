import { useState } from "react";
import { Box } from "@mui/material";

type TerrariumLogoProps = {
  size?: number;
  onReplay?: () => void;
};

const petals = [
  "linear-gradient(135deg, #8F2447, #C23A66)",
  "linear-gradient(135deg, #D6345F, #FF6B8A)",
  "linear-gradient(135deg, #FF8A5C, #FFB38A)",
  "linear-gradient(135deg, #F7B6C8, #E88AA6)",
];

export function TerrariumLogo({ size = 44, onReplay }: TerrariumLogoProps) {
  const [key, setKey] = useState(0);

  function replay() {
    setKey((value) => value + 1);
    onReplay?.();
  }

  return (
    <Box
      key={key}
      component="button"
      type="button"
      aria-label="Replay Terrarium logo animation"
      onClick={replay}
      className="terrarium-logo"
      sx={{
        width: size,
        height: size,
        border: 0,
        p: 0,
        bgcolor: "transparent",
        cursor: "pointer",
        position: "relative",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <Box
        className="terrarium-logo-petals"
        sx={{ position: "absolute", inset: 0, transformOrigin: "50% 50%" }}
      >
        {petals.map((bg, index) => (
          <Box
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className={`terrarium-logo-petal petal-${index}`}
            sx={{
              position: "absolute",
              width: size * 0.49,
              height: size * 0.49,
              bgcolor: bg,
              background: bg,
              transformOrigin: "100% 100%",
              borderRadius:
                index === 0
                  ? "100% 0 0 0"
                  : index === 1
                    ? "0 100% 0 0"
                    : index === 2
                      ? "0 0 100% 0"
                      : "0 0 0 100%",
              left: index === 0 || index === 3 ? 0 : size * 0.51,
              top: index < 2 ? 0 : size * 0.51,
            }}
          />
        ))}
      </Box>
      <Box
        className="terrarium-logo-badge"
        sx={{
          width: size * 0.56,
          height: size * 0.56,
          borderRadius: "50%",
          bgcolor: "var(--tt-accent-fill)",
          border: "3px solid var(--tt-bg)",
          zIndex: 1,
          position: "relative",
        }}
      >
        <Box
          className="terrarium-logo-tbar"
          sx={{
            position: "absolute",
            left: "22%",
            top: "28%",
            width: "56%",
            height: "16%",
            borderRadius: 999,
            bgcolor: "var(--tt-bg)",
          }}
        />
        <Box
          className="terrarium-logo-tstem"
          sx={{
            position: "absolute",
            left: "42%",
            top: "28%",
            width: "16%",
            height: "50%",
            borderRadius: 999,
            bgcolor: "var(--tt-bg)",
          }}
        />
      </Box>
    </Box>
  );
}
