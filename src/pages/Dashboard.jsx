import React from "react";

function Dashboard() {
  return (
    <div id="view-live" className="flex-1 flex flex-col gap-6 min-h-0">
      <div className="shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 glass-panel rounded-xl flex items-center justify-center text-indigo-400">
            <i className="fas fa-tower-broadcast"></i>
          </div>
          <h2 className="text-lg font-black text-white uppercase tracking-[0.2em]">Live Telemetry</h2>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 glass-panel rounded-full border-emerald-500/20 bg-emerald-500/5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active Link</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 min-h-0 auto-rows-fr">
        <div className="glass-card p-6 flex flex-col group transition-all hover:border-blue-500/30">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Thermal Analysis</p>
            <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
          </div>
          <div className="flex-1 chart-wrapper relative">
            <canvas id="chartLiveSuhu"></canvas>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col group transition-all hover:border-cyan-500/30">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em]">Moisture Matrix</p>
            <div className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"></div>
          </div>
          <div className="flex-1 chart-wrapper relative">
            <canvas id="chartLiveHum"></canvas>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col group transition-all hover:border-emerald-500/30">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Particle Density</p>
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          </div>
          <div className="flex-1 chart-wrapper relative">
            <canvas id="chartLiveGas"></canvas>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col group transition-all hover:border-amber-500/30">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em]">Ignition Logic</p>
            <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
          </div>
          <div className="flex-1 chart-wrapper relative">
            <canvas id="chartLiveFlame"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
