import React from "react";

function Settings({ call }) {
  return (
    <div id="view-settings" className="hidden flex-1 flex flex-col gap-6 overflow-hidden">
      <div className="shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 glass-panel rounded-xl flex items-center justify-center text-indigo-400">
            <i className="fas fa-shield-halved"></i>
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">System Config</h3>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0 pr-2 overflow-y-auto scrollbar-premium">
        <div className="glass-card p-6 flex flex-col">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Feature Thresholds</p>
          <div className="space-y-8 flex-1">
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-[11px] font-black text-white uppercase tracking-widest mb-1">Thermal Limit</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Celsius Matrix</p>
              </div>
              <input id="cfg-temp-threshold" type="number" min="0" max="120" className="w-24 bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-white text-xs font-bold text-right outline-none focus:ring-2 focus:ring-indigo-500/50" />
            </div>
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-[11px] font-black text-white uppercase tracking-widest mb-1">Gas Threshold</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Parts Per Million</p>
              </div>
              <input id="cfg-gas-threshold" type="number" min="0" max="5000" className="w-24 bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-white text-xs font-bold text-right outline-none focus:ring-2 focus:ring-indigo-500/50" />
            </div>
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-[11px] font-black text-white uppercase tracking-widest mb-1">Ignition Logic</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Photodiode Sensitivity</p>
              </div>
              <input id="cfg-flame-threshold" type="number" min="0" max="4095" className="w-24 bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-white text-xs font-bold text-right outline-none focus:ring-2 focus:ring-indigo-500/50" />
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
            <button onClick={() => call("resetSensorConfig")} className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Default Protocol</button>
            <button onClick={() => call("saveSensorConfig")} className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">Write Config</button>
          </div>
          <p id="cfg-status" className="mt-4 text-center text-[10px] font-black text-emerald-400 uppercase tracking-widest hidden">Success • Node Synced</p>
        </div>

        <div className="glass-card p-6 flex flex-col">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Utility Parameters</p>
          <div className="space-y-8 flex-1">
            <div className="flex items-center justify-between group">
              <div>
                <p className="text-[11px] font-black text-white uppercase tracking-widest mb-1">Audio Warning</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Alarm Sytem Logic</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input id="cfg-alarm-enabled" type="checkbox" className="sr-only peer" />
                <div className="w-12 h-6 bg-white/5 rounded-full border border-white/10 peer-checked:bg-emerald-500/50 peer-checked:border-emerald-500/50 transition-all"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-slate-400 rounded-full transition-all peer-checked:translate-x-6 peer-checked:bg-white shadow-lg"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black text-white uppercase tracking-widest mb-1">Sync Interval</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Display Refresh Cycle</p>
              </div>
              <input id="cfg-sync-interval" type="number" min="5" max="60" className="w-16 bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-white text-xs font-bold text-right outline-none focus:ring-2 focus:ring-indigo-500/50" />
            </div>
          </div>
          <div className="mt-10 p-6 glass-panel border-indigo-500/10 rounded-2xl">
            <p className="text-[9px] text-slate-500 leading-relaxed font-bold uppercase tracking-widest">
              Configuration is synchronized with the <span className="text-indigo-400">Edge Node</span> and <span className="text-white">Cloud Infrastructure</span>. Threshold adjustments impact inference logic instantly.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 border-rose-500/20 bg-rose-500/5 flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="h-10 w-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400">
            <i className="fas fa-power-off"></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">Session Termination</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Clear Local Authentication Tokens</p>
          </div>
        </div>
        <button onClick={() => call("handleLogout")} className="w-full sm:w-auto px-10 py-3 bg-rose-600/20 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
          Force Logout
        </button>
      </div>
    </div>
  );
}

export default Settings;
