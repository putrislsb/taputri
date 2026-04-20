import React from "react";

function History({ call }) {
  return (
    <div id="view-history" className="hidden flex-1 flex flex-col gap-4 sm:gap-6 overflow-hidden">
      <div className="flex-1 glass-panel flex flex-col min-h-0 relative overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-white/5 flex flex-col lg:flex-row gap-4 sm:gap-6 items-start lg:items-center justify-between">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
              <i className="fas fa-database"></i>
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Archive Logs</h3>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">5000 Active Records</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 glass-panel px-3 sm:px-4 py-2 rounded-xl border-white/5 w-full sm:w-auto">
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Start</span>
                <input type="datetime-local" id="hist-start" className="bg-transparent text-[10px] font-bold text-white outline-none border-none py-0.5" />
              </div>
              <span className="text-white/20 hidden sm:inline">|</span>
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">End</span>
                <input type="datetime-local" id="hist-end" className="bg-transparent text-[10px] font-bold text-white outline-none border-none py-0.5" />
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={() => call("muatLengkapHistori")} className="flex-1 sm:flex-none px-4 sm:px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                Sync Logs
              </button>
              <button onClick={() => call("exportCSV")} className="p-3 glass-panel hover:bg-white/5 text-emerald-400 rounded-xl transition-all border-emerald-500/20">
                <i className="fas fa-file-csv"></i>
              </button>
              <button onClick={() => call("exportPDF")} className="p-3 glass-panel hover:bg-white/5 text-rose-400 rounded-xl transition-all border-rose-500/20">
                <i className="fas fa-file-pdf"></i>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto scrollbar-premium">
          <table className="w-full min-w-[680px] text-left border-collapse">
            <thead className="sticky top-0 z-20 bg-[#0f172a]/80 backdrop-blur-md">
              <tr className="border-b border-white/5">
                <th className="p-3 sm:p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">#</th>
                <th className="p-3 sm:p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Timestamp</th>
                <th className="p-3 sm:p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Thermal</th>
                <th className="p-3 sm:p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Moisture</th>
                <th className="p-3 sm:p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Gas Density</th>
                <th className="p-3 sm:p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ignition</th>
              </tr>
            </thead>
            <tbody id="history-table-body" className="divide-y divide-white/5"></tbody>
          </table>
          <div id="history-empty" className="hidden py-20 text-center">
            <i className="fas fa-folder-open text-4xl text-slate-700 mb-4"></i>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">No logs found in this sector</p>
          </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span id="history-count" className="text-[10px] font-black text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">0 Logs</span>
            <p className="text-[9px] text-slate-500 italic hidden sm:block">Archive sector 5000 maximum capacity</p>
          </div>

          <div id="history-pagination" className="flex items-center gap-1"></div>
        </div>
      </div>
    </div>
  );
}

export default History;
