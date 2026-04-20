import React, { useState } from "react";

export default function DateRangeControls({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
}) {
  const [preset, setPreset] = useState("15m");

  const formatDateInput = (d) => d.toISOString().slice(0, 10);

  const handlePresetChange = (e) => {
    const value = e.target.value;
    setPreset(value);

    const now = new Date();
    let start = new Date(now);

    if (value === "15m") {
      start = new Date(now.getTime() - 15 * 60 * 1000);
    } else if (value === "30m") {
      start = new Date(now.getTime() - 30 * 60 * 1000);
    } else if (value === "1h") {
      start = new Date(now.getTime() - 60 * 60 * 1000);
    } else if (value === "1d") {
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    setStartDate(start);
    setEndDate(now);
  };

  const handleStartChange = (e) => {
    setStartDate(new Date(e.target.value));
  };

  const handleEndChange = (e) => {
    setEndDate(new Date(e.target.value));
  };

  return (
    <div className="dr-layout">
      {/* BARIS 1 */}
      <div className="dr-row">
        <div className="dr-field">
          <p className="dr-label">Rentang Waktu</p>
          <select
            className="dr-input"
            value={preset}
            onChange={handlePresetChange}
          >
            <option value="15m">15 menit</option>
            <option value="30m">30 menit</option>
            <option value="1h">1 jam</option>
            <option value="1d">1 hari</option>
          </select>
        </div>

        <div className="dr-field">
          <p className="dr-label">Pilih Device</p>
          <select className="dr-input">
            <option>RIM-ROOM-01</option>
          </select>
        </div>

        <button className="dr-add-btn">+</button>
      </div>

      {/* BARIS 2 */}
      <div className="dr-row">
        <div className="dr-field dr-field-wide">
          <p className="dr-label">Custom Date Range</p>
          <div className="dr-range-display">
            <input
              type="date"
              value={formatDateInput(startDate)}
              onChange={handleStartChange}
            />
            <span>–</span>
            <input
              type="date"
              value={formatDateInput(endDate)}
              onChange={handleEndChange}
            />
            <span className="dr-range-icon">📅</span>
          </div>
        </div>
      </div>
    </div>
  );
}
