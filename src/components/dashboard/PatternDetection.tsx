import { TrendingUp } from "lucide-react";

import type { DashboardInsights } from "@/lib/dashboard";


interface PatternDetectionProps {
  insights?: DashboardInsights;
}


export default function PatternDetection({ insights }: PatternDetectionProps) {
  const patterns = insights?.patterns ?? [];

  return (
    <div className="chart-card">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-base font-semibold text-foreground">Pattern Detection</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {patterns.map((pattern, index) => (
          <div key={index} className="flex gap-3 p-3 rounded border border-border bg-background">
            <span className="text-xl shrink-0">{pattern.icon}</span>
            <p className="text-sm text-foreground leading-relaxed">{pattern.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
