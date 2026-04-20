import React from "react";

function Sidebar({ call }) {
  return (
    <aside className="w-full md:w-72 glass-panel border-r-0 md:border-r border-b md:border-b-0 flex flex-col p-4 sm:p-6 shrink-0 z-50 overflow-y-auto">
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-10 px-1 sm:px-2">
        <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-inner">
          <img src="smart-fire-logo.jpeg" alt="Logo" className="h-full w-full object-contain filter brightness-110" />
        </div>
        <div className="leading-tight">
          <h1 className="text-sm font-black uppercase tracking-[0.3em] text-white">
            Smart<span className="text-indigo-400">Fire</span>
          </h1>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-orange-500/80">Command Center</p>
        </div>
      </div>

      <nav className="grid grid-cols-2 md:flex md:flex-col gap-2 mb-6 sm:mb-10">
        <button onClick={() => call("switchView", "live")} id="btn-live" className="w-full py-3 px-3 sm:px-5 rounded-2xl text-[10px] font-bold text-slate-400 hover:bg-white/5 uppercase tracking-[0.1em] sm:tracking-[0.2em] flex items-center justify-center md:justify-start gap-2 sm:gap-3 transition-all active-tab">
          <i className="fas fa-microchip text-xs"></i>
          <span>Live</span>
        </button>
        <button onClick={() => call("switchView", "history")} id="btn-history" className="w-full py-3 px-3 sm:px-5 rounded-2xl text-[10px] font-bold text-slate-400 hover:bg-white/5 uppercase tracking-[0.1em] sm:tracking-[0.2em] flex items-center justify-center md:justify-start gap-2 sm:gap-3 transition-all">
          <i className="fas fa-database text-xs"></i>
          <span>History</span>
        </button>
        <button onClick={() => call("switchView", "c45")} id="btn-c45" className="w-full py-3 px-3 sm:px-5 rounded-2xl text-[10px] font-bold text-slate-400 hover:bg-white/5 uppercase tracking-[0.1em] sm:tracking-[0.2em] flex items-center justify-center md:justify-start gap-2 sm:gap-3 transition-all">
          <i className="fas fa-brain text-xs"></i>
          <span>C4.5</span>
        </button>
        <button onClick={() => call("switchView", "settings")} id="btn-settings" className="w-full py-3 px-3 sm:px-5 rounded-2xl text-[10px] font-bold text-slate-400 hover:bg-white/5 uppercase tracking-[0.1em] sm:tracking-[0.2em] flex items-center justify-center md:justify-start gap-2 sm:gap-3 transition-all">
          <i className="fas fa-shield-halved text-xs"></i>
          <span>Settings</span>
        </button>
      </nav>

      <div className="space-y-3 flex-1">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2 mb-4">Core Metrics</p>
        <div id="card-suhu" className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center justify-between group transition-all hover:bg-blue-500/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shadow-lg group-hover:scale-110 transition-transform">
              <i className="fas fa-temperature-empty"></i>
            </div>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Suhu</span>
          </div>
          <p className="text-xl font-black text-white tracking-tighter"><span id="side-temp">--</span>°</p>
        </div>

        <div id="card-hum" className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl flex items-center justify-between group transition-all hover:bg-cyan-500/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 shadow-lg group-hover:scale-110 transition-transform">
              <i className="fas fa-droplet"></i>
            </div>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Kelembapan</span>
          </div>
          <p className="text-xl font-black text-white tracking-tighter"><span id="side-hum">--</span>%</p>
        </div>

        <div id="card-gas" className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center justify-between group transition-all hover:bg-emerald-500/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-lg group-hover:scale-110 transition-transform">
              <i className="fas fa-smog"></i>
            </div>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Gas</span>
          </div>
          <p className="text-xl font-black text-white tracking-tighter"><span id="side-gas">--</span><span className="text-[9px] ml-1">PPM</span></p>
        </div>

        <div id="card-flame" className="p-4 bg-amber-500/5 border border-amber-100 rounded-2xl flex items-center justify-between group transition-all hover:bg-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shadow-lg group-hover:scale-110 transition-transform">
              <i className="fas fa-fire"></i>
            </div>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Api</span>
          </div>
          <p className="text-xl font-black text-white tracking-tighter" id="side-flame-adc">--</p>
        </div>

        <div id="card-status" className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-center justify-between group transition-all hover:bg-rose-500/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 shadow-lg group-hover:scale-110 transition-transform">
              <i className="fas fa-satellite-dish"></i>
            </div>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Status</span>
          </div>
          <p id="side-status" className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.1em]">Wait..</p>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-2">
        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">Node Protocol v4.0</p>
        <div className="flex gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col items-center">
        <p className="text-[8px] font-bold uppercase text-slate-400 tracking-[0.25em] mb-1">
          Pembaruan Sistem : <span id="sync-val" className="text-indigo-600">10</span> Detik
        </p>
        <div className="flex items-center gap-2">
          <span id="status-dot" className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
          <span id="status-text" className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.25em]">
            Status Alat : Online
          </span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
