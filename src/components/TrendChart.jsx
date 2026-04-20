import React from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import "./TrendChart.css";

export default function TrendChart({ data }) {
  if (!data || data.length === 0) return (
    <div className="chart-box">Belum ada data grafik</div>
  );

  return (
    <div className="chart-box">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp"
            tickFormatter={(v)=>
              new Date(v).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit"
              })
            }
          />
          <YAxis />
          <Tooltip
            labelFormatter={(v)=>new Date(v).toLocaleString("id-ID")}
          />
          <Line dataKey="temperature" stroke="#ff5252" strokeWidth={2} dot={false} />
          <Line dataKey="humidity" stroke="#5ea0ff" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
