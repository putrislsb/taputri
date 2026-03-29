export default function DeviceStats({ suhu, hum, gas, flame }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
      <div className="card">
        <p>Suhu</p>
        <h2>{suhu}°C</h2>
      </div>
      <div className="card">
        <p>Kelembapan</p>
        <h2>{hum}%</h2>
      </div>
      <div className="card">
        <p>Gas (MQ-2)</p>
        <h2>{gas}</h2>
      </div>
      <div className="card">
        <p>Status Flame</p>
        <h2>{flame ? "BAHAYA" : "AMAN"}</h2>
      </div>
    </div>
  );
}
