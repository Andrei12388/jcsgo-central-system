"use client"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface StatsChartProps {
  type?: "bar" | "pie"
  title: string
  labels: string[]
  data: number[]
  onBarClick?: (index: number, label: string, value: number) => void
}

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#9333ea",
  "#0891b2",
  "#ea580c",
]

export default function StatsChart({
  type = "bar",
  title,
  labels,
  data,
  onBarClick,
}: StatsChartProps) {
  const chartData = labels.map((label, index) => ({
    name: label,
    value: data[index] ?? 0,
  }))

  console.log(onBarClick);

  return (
    <div className="w-full rounded-xl border bg-background p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-semibold">{title}</h2>

      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          {type === "pie" ? (
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                outerRadius={120}
                label
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip />
              <Legend />
            </PieChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="name" />

              <YAxis allowDecimals={false} />

              <Tooltip />

              <Legend />

             <Bar
  dataKey="value"
  onClick={(data, index) => {
    console.log("clicked");
    console.log(data);
    console.log(index);

    onBarClick?.(
      index,
      data.payload.name,
      data.payload.value
    );
  }}
>
  {chartData.map((_, index) => (
    <Cell
      key={index}
      fill={COLORS[index % COLORS.length]}
      cursor="pointer"
    />
  ))}
</Bar>
            </BarChart>
          )}
          
        </ResponsiveContainer>
        <BarChart data={chartData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Legend />

  <Bar dataKey="onsite" stackId="a" fill="#2563eb" />
  <Bar dataKey="online" stackId="a" fill="#16a34a" />
</BarChart>
      </div>
    </div>
  )
}