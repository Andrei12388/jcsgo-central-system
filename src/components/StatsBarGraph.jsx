import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

const COLORS = [
  "#4F46E5",
  "#06B6D4",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#84CC16",
];

export default function StatsBarGraph({
  data,
  field,
  title,
  orientation = "horizontal",
  displayMode = "count", // "count" | "percentage"
}) {
  // =========================
  // COUNT VALUES
  // =========================
  const counts = {};

  data.forEach((row) => {
    const value = row[field] || "Unknown";
    counts[value] = (counts[value] || 0) + 1;
  });

  const total = data.length;

  const chartData = Object.entries(counts).map(([name, count]) => ({
    name,
    count,
    percentage: Number(((count / total) * 100).toFixed(1)),
  }));

  const isPercentage = displayMode === "percentage";
  const valueKey = isPercentage ? "percentage" : "count";

  const isVertical = orientation === "vertical";

  return (
    <div
      style={{
        width: "100%",
        height: 380,
        background: "var(--card)",
        padding: 20,
        borderRadius: 18,
        border: "1px solid var(--border)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
      }}
    >
      <h3
        style={{
          marginBottom: 20,
          textAlign: "center",
          fontSize: 20,
        }}
      >
        {title}
      </h3>

      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          data={chartData}
          layout={isVertical ? "vertical" : "horizontal"}
          margin={{
            top: 25,
            right: 40,
            left: isVertical ? -35 : 0,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />

          {isVertical ? (
            <>
              <XAxis
                type="number"
                allowDecimals={false}
                tickFormatter={(v) =>
                  isPercentage ? `${v}%` : v
                }
              />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fontSize: 12 }}
              />
            </>
          ) : (
            <>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                allowDecimals={false}
                tickFormatter={(v) =>
                  isPercentage ? `${v}%` : v
                }
              />
            </>
          )}

          <Tooltip
            formatter={(value, name, props) => [
              isPercentage
                ? `${props.payload.count} records (${props.payload.percentage}%)`
                : `${props.payload.count} records`,
              "Value",
            ]}
            contentStyle={{
              color: "var(--text)",
              background: "var(--card)",
              borderRadius: 10,
              border: "none",
              boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
            }}
            labelStyle={{
            color: "var(--text)", // title (category name)
            fontWeight: 600,
          }}
          itemStyle={{
            color: "var(--sidebar-active)", // value text color
          }}
          />

          <Bar
            dataKey={valueKey}
            radius={
              isVertical ? [0, 10, 10, 0] : [10, 10, 0, 0]
            }
            animationDuration={800}
          >
            <LabelList
              dataKey={valueKey}
              formatter={(v) =>
                isPercentage ? `${v}%` : v
              }
              position={isVertical ? "right" : "top"}
              style={{
                fontWeight: "bold",
                fontSize: 14,
                fill: "var(--text)",
              }}
            />
          
            {chartData.map((_, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}