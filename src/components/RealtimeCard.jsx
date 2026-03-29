import React from "react";
import "./RealtimeCard.css";

export default function RealtimeCard({ data }) {
  if (!data) return (
    <div className="loading">
      Menunggu data sensor...
    </div>
  );

  return (
    <div className="realtime-wrapper">
      <div className="card">
        <p className="label">Suhu</p>
        <h3 className="value">{data.temperature} °C</h3>
      </div>

      <div className="card">
        <p className="label">Kelembaban</p>
        <h3 className="value">{data.humidity} %</h3>
      </div>

      <div className="card">
        <p className="label">Gas MQ2</p>
        <h3 className="value">{data.mq2}</h3>
      </div>

      <div className={`card status ${data.flame === "fire" && "alert"}`}>
        <p className="label">Status Api</p>
        <h3 className="value">
          {data.flame === "fire" ? "Bahaya🔥" : "Normal"}
        </h3>
      </div>
    </div>
  );
}
