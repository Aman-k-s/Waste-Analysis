import { format, parseISO } from "date-fns";
import { CartesianGrid, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { TrendPoint } from "@/lib/dashboard";


interface TrendAnalysisProps {
  trend: TrendPoint[];
}


export default function TrendAnalysis({ trend }: TrendAnalysisProps) {
  const chartData = trend.map((point) => ({
    ...point,
    label: format(parseISO(point.date), "MMM d"),
  }));
  const spikes = chartData.filter((point) => point.spike);

  return (
    <div className="chart-card">
      <h3 className="section-title">Daily Waste Trend</h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,90%)" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={1} angle={-30} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4 }} />
          <Line type="monotone" dataKey="value" stroke="hsl(155,43%,21%)" strokeWidth={2} dot={false} />
          {spikes.map((point) => (
            <ReferenceDot key={point.date} x={point.label} y={point.value} r={5} fill="hsl(0,84%,60%)" stroke="none" />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-primary" /> Normal</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-destructive" /> Spike / Anomaly</span>
      </div>
    </div>
  );
}
