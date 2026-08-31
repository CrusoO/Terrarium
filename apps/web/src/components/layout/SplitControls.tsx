import { createContext, useContext } from "react";

export type SplitControls = {
  desktop: boolean;
  expandChat: () => void;
  shrinkChat: () => void;
  resetChat: () => void;
  collapseChat: () => void;
};

export const SplitControlsContext = createContext<SplitControls | null>(null);

export function useSplitControls() {
  return useContext(SplitControlsContext);
}
