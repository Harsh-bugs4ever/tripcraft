import React from "react";
import { Info } from "lucide-react";
export function DemoModeBanner({
  mode,
}: {
  mode: "DEMO" | "LIVE";
  hasGroq?: boolean;
  onExploreDemo?: () => void;
}) {
  return (
    <div className="mode-strip">
      <Info size={13} />
      {mode === "DEMO"
        ? "You’re exploring the demo. Sample plans, not live prices or availability."
        : "Live search mode · facts show source details; unknown costs remain unquoted."}
    </div>
  );
}
