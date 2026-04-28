import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import WeekdayComparisonGrid from "@/components/dashboard/WeekdayComparisonGrid";
import type { DashboardFilters, FilterOptions, WeekPoint } from "@/lib/dashboard";


interface TimeAnalysisProps {
  filters: DashboardFilters;
  options?: FilterOptions;
  weeklyWaste: WeekPoint[];
}


export default function TimeAnalysis({ filters, options, weeklyWaste }: TimeAnalysisProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="chart-card">
        <h3 className="section-title">Weekly Waste Analysis</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={weeklyWaste} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,90%)" />
            <XAxis dataKey="week" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4 }} />
            <Bar dataKey="value" fill="hsl(155,43%,21%)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <WeekdayComparisonGrid filters={filters} options={options} />
    </div>
  );
}
