import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from "chart.js";
import { Bar } from "react-chartjs-2";
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
  "rgba(59, 130, 246, 0.6)",
  "rgba(16, 185, 129, 0.6)",
  "rgba(249, 115, 22, 0.6)",
  "rgba(139, 92, 246, 0.6)",
  "rgba(234, 179, 8, 0.6)",
  "rgba(236, 72, 153, 0.6)",
  "rgba(20, 184, 166, 0.6)",
];

export function DailyUsageChart({ dailyUsageHistory, siteRules }: DailyUsageChartProps) {
  if (dailyUsageHistory.length === 0 || siteRules.length === 0) {
    return <div className="text-center text-gray-500 py-8">データがありません</div>;
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
    allValues.length > 0 ? Math.round(allValues.reduce((sum, value) => sum + value, 0) / allValues.length) : 0;

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
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${context.parsed.y}分`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `${value}分`,
        },
      },
    },
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">日別利用時間グラフ（直近30日）</h3>
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="h-[220px]">
          <Bar data={chartData} options={options} />
        </div>
        <div className="mt-3 text-xs text-gray-500 text-right">平均: {average}分/日</div>
      </div>
    </div>
  );
}
