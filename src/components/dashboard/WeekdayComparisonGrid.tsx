import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { dashboardApi, type DashboardFilters, type FilterOptions } from "@/lib/dashboard";


const WASTE_TYPE_OPTIONS = ["Plate Waste", "Production Waste", "Preparation Waste", "Spoilage", "Other"];


interface WeekdayComparisonGridProps {
  filters: DashboardFilters;
  options?: FilterOptions;
}


export default function WeekdayComparisonGrid({ filters, options }: WeekdayComparisonGridProps) {
  const defaultWeeks = useMemo(() => options?.weeks.slice(-3).map((week) => week.value) ?? [], [options]);
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>(defaultWeeks);
  const [selectedWasteTypes, setSelectedWasteTypes] = useState<string[]>([]);

  useEffect(() => {
    if (!defaultWeeks.length) return;
    setSelectedWeeks((current) => (current.length ? current : defaultWeeks));
  }, [defaultWeeks]);

  const { data } = useQuery({
    queryKey: ["weekday-comparison-grid", filters, selectedWeeks, selectedWasteTypes],
    queryFn: () => dashboardApi.getWeekdayComparisonGrid(filters, selectedWeeks, selectedWasteTypes),
    enabled: selectedWeeks.length > 0,
  });

  const weeks = data?.weeks ?? [];
  const rows = data?.rows ?? [];

  const toggleWeek = (value: string) => {
    setSelectedWeeks((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const toggleWasteType = (value: string) => {
    setSelectedWasteTypes((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  return (
    <div className="chart-card space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Weekday Waste Comparison Grid</h3>
          <p className="text-xs text-muted-foreground mt-1">Compare weekday waste across selected weeks and waste types.</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Waste Type</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedWasteTypes([])}
              className={`rounded-full border px-3 py-1.5 text-xs ${selectedWasteTypes.length === 0 ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`}
            >
              All Waste
            </button>
            {WASTE_TYPE_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => toggleWasteType(option)}
                className={`rounded-full border px-3 py-1.5 text-xs ${selectedWasteTypes.includes(option) ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Weeks</p>
          <div className="flex flex-wrap gap-2">
            {(options?.weeks ?? []).map((week) => (
              <button
                key={week.value}
                onClick={() => toggleWeek(week.value)}
                className={`rounded-full border px-3 py-1.5 text-xs ${selectedWeeks.includes(week.value) ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`}
              >
                {week.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.day} className="rounded-xl bg-background border border-border px-4 py-3">
            <div className="grid gap-3" style={{ gridTemplateColumns: `120px repeat(${Math.max(weeks.length, 1)}, minmax(0, 1fr))` }}>
              <div className="text-sm font-semibold text-foreground flex items-center">{row.day}</div>
              {weeks.map((week, index) => {
                const value = row.values[week.value] ?? 0;
                const isLatest = index === weeks.length - 1;
                return (
                  <div key={week.value} className={`rounded-lg px-3 py-2 ${isLatest ? "bg-primary/10" : "bg-card"}`}>
                    <p className="text-[11px] text-muted-foreground leading-tight">{week.label}</p>
                    <p className="text-sm font-bold text-foreground mt-1">{value.toFixed(2)} kg</p>
                    {isLatest && row.latest_change_pct !== null ? (
                      <p className={`text-xs mt-1 font-medium ${row.latest_change_pct > 0 ? "text-destructive" : row.latest_change_pct < 0 ? "text-green-600" : "text-muted-foreground"}`}>
                        {row.latest_change_pct > 0 ? "up" : row.latest_change_pct < 0 ? "down" : "flat"} {Math.abs(row.latest_change_pct).toFixed(1)}%
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
