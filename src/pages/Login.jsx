import React from "react";

function Login({ call }) {
  return (
    <div
      id="login-screen"
      className="fixed inset-0 z-[999] h-dvh flex items-center justify-center bg-slate-950/40 backdrop-blur-xl p-2 sm:p-4 transition-all duration-700 overflow-hidden"
    >
      <div className="glass-panel rounded-[1.75rem] sm:rounded-[2.25rem] w-full max-w-md p-4 sm:p-7 md:p-8 space-y-4 sm:space-y-6 relative overflow-hidden group">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-rose-600/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-[0_0_40px_rgba(79,70,229,0.3)] transform group-hover:scale-110 transition-transform duration-500">
            <i className="fas fa-fire-pulse text-xl sm:text-2xl"></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-1">Security Core</p>
            <h1 className="text-[1.75rem] sm:text-3xl font-black text-white uppercase tracking-tighter leading-none">
              SMART<span className="text-indigo-500">FIRE</span>
            </h1>
          </div>
        </div>
        <p className="text-[10px] sm:text-[11px] text-slate-500">Masuk untuk mengakses dashboard monitoring kebakaran secara real-time.</p>

        <form id="form-login" onSubmit={(e) => call("handleLogin", e)} className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Identity</label>
              <input id="login-email" type="email" autoComplete="email" className="w-full bg-white/5 border border-white/10 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all" placeholder="Email Address" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Access Key</label>
              <input id="login-password" type="password" autoComplete="current-password" className="w-full bg-white/5 border border-white/10 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all" placeholder="••••••••" />
            </div>
          </div>
          <p id="login-error" className="text-[10px] text-rose-500 font-bold bg-rose-500/10 p-3 rounded-xl hidden"></p>
          <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 sm:py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.22em] sm:tracking-[0.3em] hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] active:scale-[0.98] transition-all">
            Initialize Session
          </button>
        </form>

        <p className="text-[9px] text-slate-400 text-center">
          Gunakan email dan password akun yang sudah terdaftar.
        </p>
      </div>
    </div>
  );
}

export default Login;
