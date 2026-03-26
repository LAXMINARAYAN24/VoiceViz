import { useState, useRef, useCallback, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, BarChart3, TrendingUp, PieChartIcon, AreaChartIcon, TableIcon } from "lucide-react";
import { toast } from "sonner";

type ChartType = "bar" | "line" | "pie" | "area" | "table";

const PALETTE = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 220 70% 50%))",
  "hsl(var(--chart-3, 340 75% 55%))",
  "hsl(var(--chart-4, 160 60% 45%))",
  "hsl(var(--chart-5, 30 80% 55%))",
  "hsl(43 74% 49%)",
  "hsl(280 65% 55%)",
  "hsl(200 70% 50%)",
];

const CHART_ICONS: Record<ChartType, React.ReactNode> = {
  bar: <BarChart3 className="h-3.5 w-3.5" />,
  line: <TrendingUp className="h-3.5 w-3.5" />,
  pie: <PieChartIcon className="h-3.5 w-3.5" />,
  area: <AreaChartIcon className="h-3.5 w-3.5" />,
  table: <TableIcon className="h-3.5 w-3.5" />,
};

interface ResultsChartProps {
  data: Record<string, unknown>[];
  columns: string[];
}

function detectChartType(data: Record<string, unknown>[], columns: string[]): ChartType {
  if (data.length === 0 || columns.length < 2) return "table";

  const numericCols = columns.filter((col) =>
    data.every((row) => row[col] === null || !isNaN(Number(row[col])))
  );
  const nonNumericCols = columns.filter((c) => !numericCols.includes(c));

  if (numericCols.length === 0) return "table";

  // If there's exactly 1 numeric col and a label col, and few rows → pie
  if (numericCols.length === 1 && nonNumericCols.length >= 1 && data.length <= 8) {
    return "pie";
  }

  // Time-series-like: if label column looks like dates → line
  if (nonNumericCols.length >= 1) {
    const firstVal = String(data[0][nonNumericCols[0]] ?? "");
    if (/^\d{4}[-/]/.test(firstVal) || /^\d{1,2}[-/]\d{1,2}/.test(firstVal)) {
      return "line";
    }
  }

  // Many rows → area for smoother look
  if (data.length > 20) return "area";

  return "bar";
}

function getAxes(columns: string[], data: Record<string, unknown>[]) {
  const numericCols = columns.filter((col) =>
    data.every((row) => row[col] === null || !isNaN(Number(row[col])))
  );
  const nonNumericCols = columns.filter((c) => !numericCols.includes(c));
  const labelKey = nonNumericCols[0] || columns[0];
  const valueKeys = numericCols.length > 0 ? numericCols : columns.filter((c) => c !== labelKey);
  return { labelKey, valueKeys };
}

export default function ResultsChart({ data, columns }: ResultsChartProps) {
  const autoType = useMemo(() => detectChartType(data, columns), [data, columns]);
  const [chartType, setChartType] = useState<ChartType>(autoType);
  const chartRef = useRef<HTMLDivElement>(null);

  const { labelKey, valueKeys } = useMemo(() => getAxes(columns, data), [columns, data]);

  // Prepare numeric data for recharts
  const chartData = useMemo(
    () =>
      data.map((row) => {
        const entry: Record<string, unknown> = { [labelKey]: row[labelKey] };
        valueKeys.forEach((k) => {
          entry[k] = row[k] === null ? 0 : Number(row[k]);
        });
        return entry;
      }),
    [data, labelKey, valueKeys]
  );

  const handleExport = useCallback(async () => {
    if (!chartRef.current) return;
    try {
      const svg = chartRef.current.querySelector("svg");
      if (!svg) {
        toast.error("No chart to export");
        return;
      }

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();

      const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          canvas.width = img.width * 2;
          canvas.height = img.height * 2;
          ctx.scale(2, 2);
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, img.width, img.height);
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          resolve();
        };
        img.onerror = reject;
        img.src = url;
      });

      canvas.toBlob((b) => {
        if (!b) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = "chart.png";
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success("Chart exported as PNG");
      }, "image/png");
    } catch {
      toast.error("Failed to export chart");
    }
  }, []);

  if (data.length === 0 || columns.length < 2 || valueKeys.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/30">
        <p className="text-xs font-medium text-muted-foreground mr-auto">Visualization</p>

        <Select value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["bar", "line", "pie", "area"] as ChartType[]).map((t) => (
              <SelectItem key={t} value={t}>
                <span className="flex items-center gap-1.5">
                  {CHART_ICONS[t]}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleExport}>
          <Download className="h-3.5 w-3.5" />
          PNG
        </Button>
      </div>

      {/* Chart */}
      <div ref={chartRef} className="p-4">
        <ResponsiveContainer width="100%" height={320}>
          {chartType === "bar" ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey={labelKey} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {valueKeys.map((k, i) => (
                <Bar key={k} dataKey={k} fill={PALETTE[i % PALETTE.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          ) : chartType === "line" ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey={labelKey} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {valueKeys.map((k, i) => (
                <Line
                  key={k}
                  type="monotone"
                  dataKey={k}
                  stroke={PALETTE[i % PALETTE.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          ) : chartType === "area" ? (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey={labelKey} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {valueKeys.map((k, i) => (
                <Area
                  key={k}
                  type="monotone"
                  dataKey={k}
                  fill={PALETTE[i % PALETTE.length]}
                  fillOpacity={0.15}
                  stroke={PALETTE[i % PALETTE.length]}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          ) : (
            <PieChart>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Pie
                data={chartData}
                dataKey={valueKeys[0]}
                nameKey={labelKey}
                cx="50%"
                cy="50%"
                outerRadius={120}
                innerRadius={50}
                paddingAngle={2}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                labelLine={{ strokeWidth: 1 }}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
