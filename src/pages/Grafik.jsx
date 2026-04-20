import React from "react";

function Grafik() {
  return (
    <div id="view-c45" className="hidden flex-1 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-premium">
      <div className="shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 glass-panel rounded-xl flex items-center justify-center text-indigo-400">
            <i className="fas fa-brain"></i>
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">C4.5 Engine</h3>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Advanced Decision Matrix</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 border-indigo-500/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <i className="fas fa-bolt text-4xl text-indigo-400"></i>
          </div>
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-6">Real-Time Inference</p>
          <div id="c45-input-values" className="mb-6 flex flex-wrap gap-2">
            <p className="text-[10px] text-slate-500 italic">Awakening node sensor stream...</p>
          </div>
          <div className="flex items-center gap-10 mb-8">
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Classification</p>
              <p id="c45-result-class" className="text-3xl font-black text-white tracking-tighter">--</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Confidence</p>
              <p id="c45-result-confidence" className="text-3xl font-black text-indigo-400 tracking-tighter">--%</p>
            </div>
          </div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Decision Sequence</p>
          <div id="c45-decision-path" className="glass-panel p-4 rounded-xl text-[10px] text-white/70 font-mono italic">
            Awaiting node data...
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
            <i className="fas fa-project-diagram text-indigo-400"></i>
            Logical Hierarchy
          </p>
          <div className="flex-1 bg-slate-950/50 rounded-2xl p-4 border border-white/5 overflow-x-auto">
            <pre id="c45-tree-text" className="text-[10px] text-indigo-300 font-mono leading-relaxed">Booting logic tree...</pre>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 lg:col-span-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Model Entropy</p>
          <div id="c45-model-stats" className="space-y-4">
            <p className="text-[10px] text-slate-500 italic">Calculating split info...</p>
          </div>
        </div>
        <div className="glass-card p-6 lg:col-span-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Gain Ratio Optimization</p>
          <div id="c45-entropy-detail" className="overflow-x-auto">
            <p className="text-[10px] text-slate-500 italic">Processing feature weights...</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Execution Rules</p>
        <div id="c45-rules-table" className="overflow-x-auto">
          <p className="text-[10px] text-slate-500 italic">Parsing decision rules...</p>
        </div>
      </div>

      <div className="glass-panel p-8 border-indigo-500/20 bg-indigo-500/5">
        <div className="flex items-center gap-3 mb-6">
          <i className="fas fa-shield-halved text-indigo-400"></i>
          <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">C4.5 Protocol Documentation</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px] text-slate-400 leading-relaxed">
          <div className="space-y-4">
            <p><strong className="text-white">C4.5 Logic:</strong> Unlike simple thresholds, our multi-factor decision tree analyzes the interaction between Thermal, Moisture, and Gas density simultaneously.</p>
            <p>Derived using <span className="text-indigo-400 font-bold">Information Gain Ratio</span> to prevent bias toward attributes with many values.</p>
          </div>
          <div className="space-y-3">
            <p className="text-white font-bold uppercase tracking-widest text-[9px]">Decision Flow:</p>
            <div className="flex flex-col gap-2 font-mono text-[10px]">
              <div className="flex items-center gap-3"><span className="h-1.5 w-1.5 bg-indigo-500 rounded-full"></span> Entropy Analysis</div>
              <div className="flex items-center gap-3"><span className="h-1.5 w-1.5 bg-purple-500 rounded-full"></span> Gain Ratio Split</div>
              <div className="flex items-center gap-3"><span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span> Rule Classification</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Grafik;
