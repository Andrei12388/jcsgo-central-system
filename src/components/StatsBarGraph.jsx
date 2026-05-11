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
}) {
  // =========================
  // COUNT VALUES
  // =========================
  const counts = {};

  data.forEach((row) => {
    const value = row[field] || "Unknown";

    counts[value] = (counts[value] || 0) + 1;
  });

  const chartData = Object.entries(counts).map(
    ([name, count]) => ({
      name,
      count,
    })
  );

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
          margin={{
            top: 25,
            right: 20,
            left: 0,
            bottom: 10,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            opacity={0.2}
          />

          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
          />

          <YAxis allowDecimals={false} />

          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: "none",
              boxShadow:
                "0 4px 10px rgba(0,0,0,0.15)",
            }}
          />

          <Bar
            dataKey="count"
            radius={[10, 10, 0, 0]}
            animationDuration={800}
          >
            {/* COUNT LABELS */}
            <LabelList
              dataKey="count"
              position="top"
              style={{
                fontWeight: "bold",
                fontSize: 14,
                fill: "var(--text)",
              }}
            />

            {/* COLORS */}
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  COLORS[index % COLORS.length]
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}