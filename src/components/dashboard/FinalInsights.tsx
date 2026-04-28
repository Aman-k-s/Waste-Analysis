import { CheckCircle2, Lightbulb } from "lucide-react";

import type { DashboardInsights } from "@/lib/dashboard";


interface FinalInsightsProps {
  insights?: DashboardInsights;
}


export default function FinalInsights({ insights }: FinalInsightsProps) {
  const keyInsights = insights?.key_insights ?? [];
  const recommendedActions = insights?.recommended_actions ?? [];

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="chart-card">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-accent" />
          <h3 className="text-base font-semibold text-foreground">Key Insights</h3>
        </div>
        <ul className="space-y-2.5">
          {keyInsights.map((insight, index) => (
            <li key={index} className="flex gap-2 text-sm text-foreground leading-relaxed">
              <span className="text-primary mt-0.5 shrink-0">•</span>
              {insight}
            </li>
          ))}
        </ul>
      </div>

      <div className="chart-card">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Recommended Actions</h3>
        </div>
        <ul className="space-y-2.5">
          {recommendedActions.map((action, index) => (
            <li key={index} className="flex gap-2 text-sm text-foreground leading-relaxed">
              <span className="text-accent mt-0.5 shrink-0">→</span>
              {action}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
