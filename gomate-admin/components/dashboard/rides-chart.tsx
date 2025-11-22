"use client"

import { Card } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const data = [
  { day: "Mon", rides: 240, revenue: 2400 },
  { day: "Tue", rides: 320, revenue: 2210 },
  { day: "Wed", rides: 280, revenue: 2290 },
  { day: "Thu", rides: 390, revenue: 2000 },
  { day: "Fri", rides: 450, revenue: 2181 },
  { day: "Sat", rides: 520, revenue: 2500 },
  { day: "Sun", rides: 380, revenue: 2100 },
]

export function RidesChart() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Rides Per Day</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="day" stroke="var(--muted-foreground)" />
          <YAxis stroke="var(--muted-foreground)" />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--card)",
              border: `1px solid var(--border)`,
              borderRadius: "8px",
            }}
            labelStyle={{ color: "var(--foreground)" }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="rides"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={{ fill: "var(--chart-1)", r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--chart-2)"
            strokeWidth={2}
            dot={{ fill: "var(--chart-2)", r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
