import WeekdayComparisonGrid from "@/components/dashboard/WeekdayComparisonGrid";
import type { DashboardFilters, FilterOptions } from "@/lib/dashboard";


interface TimeAnalysisProps {
  filters: DashboardFilters;
  options?: FilterOptions;
}


export default function TimeAnalysis({ filters, options }: TimeAnalysisProps) {
  return <WeekdayComparisonGrid filters={filters} options={options} />;
}
