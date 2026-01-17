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

// Minimal tech palette: clean, vibrant colors
const palette = [
  "rgba(0, 122, 255, 0.75)", // iOS blue
  "rgba(52, 199, 89, 0.75)", // iOS green
  "rgba(255, 149, 0, 0.75)", // iOS orange
  "rgba(175, 82, 222, 0.75)", // iOS purple
  "rgba(255, 59, 48, 0.75)", // iOS red
  "rgba(90, 200, 250, 0.75)", // iOS cyan
  "rgba(255, 204, 0, 0.75)", // iOS yellow
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
    borderRadius: 3,
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
          color: "rgb(100, 105, 120)", // text-secondary
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
          color: "rgb(100, 105, 120)",
        },
        grid: {
          color: "rgba(235, 239, 242, 0.8)", // base-muted
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `${value}min`,
          color: "rgb(100, 105, 120)",
        },
        grid: {
          color: "rgba(235, 239, 242, 0.8)",
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
