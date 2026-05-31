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

const palette = [
  "rgba(37, 99, 235, 0.78)",
  "rgba(5, 150, 105, 0.7)",
  "rgba(217, 119, 6, 0.68)",
  "rgba(71, 85, 105, 0.62)",
];

export function DailyUsageChart({ dailyUsageHistory, siteRules }: DailyUsageChartProps) {
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
          color: "rgb(71, 85, 105)",
          boxWidth: 10,
          boxHeight: 10,
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
          color: "rgb(100, 116, 139)",
        },
        grid: {
          color: "rgba(148, 163, 184, 0.18)",
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `${value}min`,
          color: "rgb(100, 116, 139)",
        },
        grid: {
          color: "rgba(148, 163, 184, 0.18)",
        },
      },
    },
  };

  return (
    <Surface variant="elevated" className="p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-content">Usage trend</h3>
        <span className="text-xs text-content-secondary">Avg {average}m/day</span>
      </div>
      {dailyUsageHistory.length === 0 || siteRules.length === 0 ? (
        <div className="py-8 text-center text-content-secondary">No data available</div>
      ) : (
        <div className="h-[220px]">
          <Bar data={chartData} options={options} />
        </div>
      )}
    </Surface>
  );
}
