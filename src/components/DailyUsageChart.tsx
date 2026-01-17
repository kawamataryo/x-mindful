import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Surface } from "~components/ui";
import type { DailyUsage, SiteRule } from "~lib/types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface DailyUsageChartProps {
  dailyUsageHistory: DailyUsage[];
  siteRules: SiteRule[];
}

const formatDate = (dateStr: string): string => {
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
};

// Liquid Glass palette: purple to cyan gradient spectrum
const palette = [
  "rgba(139, 92, 246, 0.75)", // violet
  "rgba(6, 182, 212, 0.7)", // cyan
  "rgba(236, 72, 153, 0.7)", // pink
  "rgba(59, 130, 246, 0.7)", // blue
  "rgba(168, 85, 247, 0.7)", // purple
  "rgba(20, 184, 166, 0.7)", // teal
  "rgba(244, 114, 182, 0.65)", // rose
];

export function DailyUsageChart({ dailyUsageHistory, siteRules }: DailyUsageChartProps) {
  if (dailyUsageHistory.length === 0 || siteRules.length === 0) {
    return <div className="text-center text-content-secondary py-8">No data available</div>;
  }

  const reversed = [...dailyUsageHistory].reverse();
  const labels = reversed.map((item) => formatDate(item.date));

  const datasets = siteRules.map((rule, index) => ({
    type: "bar" as const,
    label: rule.label,
    data: reversed.map((usage) => usage.siteUsage[rule.id]?.totalUsedMinutes || 0),
    backgroundColor: palette[index % palette.length],
    borderRadius: 6,
  }));

  const allValues = datasets.flatMap((dataset) => dataset.data as number[]);
  const average =
    allValues.length > 0
      ? Math.round(allValues.reduce((sum, value) => sum + value, 0) / allValues.length)
      : 0;

  const chartData = {
    labels,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "rgb(79, 70, 129)", // text-secondary
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${context.parsed.y}min`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "rgb(79, 70, 129)",
        },
        grid: {
          color: "rgba(139, 92, 246, 0.1)", // subtle purple grid
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `${value}min`,
          color: "rgb(79, 70, 129)",
        },
        grid: {
          color: "rgba(139, 92, 246, 0.1)",
        },
      },
    },
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-content mb-4">Daily Usage (Last 30 Days)</h3>
      <Surface variant="inset" className="p-4">
        <div className="h-[220px]">
          <Bar data={chartData} options={options} />
        </div>
        <div className="mt-3 text-xs text-content-secondary text-right">Avg: {average}min/day</div>
      </Surface>
    </div>
  );
}
