import { useQuery } from "@tanstack/react-query";
import { getStyles } from "@/services/styles";

// Layer 2 — Query hooks. The ONLY layer the View talks to.
export const styleKeys = {
  all: ["styles"] as const,
};

export function useStyles() {
  return useQuery({ queryKey: styleKeys.all, queryFn: getStyles });
}
