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

// Paper & ink palette: muted, cohesive colors
const palette = [
  "rgba(59, 100, 140, 0.75)",  // accent blue
  "rgba(60, 120, 80, 0.75)",   // muted green
  "rgba(175, 100, 60, 0.75)",  // warm terracotta
  "rgba(120, 90, 140, 0.75)",  // muted purple
  "rgba(160, 130, 60, 0.75)",  // olive/mustard
  "rgba(140, 80, 100, 0.75)",  // dusty rose
  "rgba(80, 130, 130, 0.75)",  // teal
];

export function DailyUsageChart({ dailyUsageHistory, siteRules }: DailyUsageChartProps) {
  if (dailyUsageHistory.length === 0 || siteRules.length === 0) {
    return <div className="text-center text-ink-muted py-8">データがありません</div>;
  }

  const reversed = [...dailyUsageHistory].reverse();
  const labels = reversed.map((item) => formatDate(item.date));

  const datasets = siteRules.map((rule, index) => ({
    type: "bar" as const,
    label: rule.label,
    data: reversed.map((usage) => usage.siteUsage[rule.id]?.totalUsedMinutes || 0),
    backgroundColor: palette[index % palette.length],
    borderRadius: 4,
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
          color: "rgb(120, 115, 105)", // ink-muted
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${context.parsed.y}分`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "rgb(120, 115, 105)",
        },
        grid: {
          color: "rgba(237, 233, 224, 0.8)", // paper-3
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `${value}分`,
          color: "rgb(120, 115, 105)",
        },
        grid: {
          color: "rgba(237, 233, 224, 0.8)",
        },
      },
    },
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-ink mb-4">日別利用時間グラフ（直近30日）</h3>
      <Surface variant="inset" className="p-4">
        <div className="h-[220px]">
          <Bar data={chartData} options={options} />
        </div>
        <div className="mt-3 text-xs text-ink-muted text-right">平均: {average}分/日</div>
      </Surface>
    </div>
  );
}
