import React, { useEffect, useRef } from "react";
import { db } from "./firebase";
import { ref, onValue, get, set, push } from "firebase/database";
import { trainC45, treeToText, treeToRules } from "./lib/c45";
import TRAINING_DATA, { getDatasetStats } from "./lib/fireTrainingData";

function App() {
  const handlersRef = useRef({});

  useEffect(() => {
    // Porting logika dari public/index.html ke dalam React.
    const Chart = window.Chart;

    let myCharts = {};
    let buffer = null;
    let sisa = 10;
    let currentView = "live";
    let historyLogs = [];
    let lastUp = Date.now();
    let lastLoggedTs = 0;
    let lastPushToLogs = 0;
    let historyPage = 1;
    let lastChartMinute = ""; // untuk grafik per menit

    // ─── C4.5 Decision Tree Model ───────────────────
    let c45Model = null;
    let lastC45Result = null;
    try {
      c45Model = trainC45(TRAINING_DATA, { maxDepth: 8, minSamples: 2 });
      console.log("[C4.5] Model berhasil di-train.", c45Model.stats);
    } catch (err) {
      console.error("[C4.5] Gagal melatih model:", err);
    }
    const HISTORY_PAGE_SIZE = 10;

    let sensorConfig = {
      tempDanger: 50,
      gasDanger: 800,
      flameAnalog: 500,
      flameDangerPct: 10,
      alarmEnabled: true,
      syncInterval: 10,
    };

    function mkChart(id, label, color, isStep = false) {
      if (!Chart) return null;
      const el = document.getElementById(id);
      if (!el) return null;
      const existing = Chart.getChart(el);
      if (existing) existing.destroy();
      return new Chart(el, {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label,
              data: [],
              borderColor: color,
              backgroundColor: color + "15",
              fill: true,
              tension: isStep ? 0 : 0.4,
              borderWidth: 3,
              pointRadius: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              display: true,
              ticks: { font: { size: 7, weight: "bold" } },
              grid: { display: false },
            },
            y: {
              ticks: { font: { size: 8 } },
              grid: { color: "#f1f5f9" },
            },
          },
        },
      });
    }

    function applySensorConfigToUI() {
      const t = document.getElementById("cfg-temp-threshold");
      const g = document.getElementById("cfg-gas-threshold");
      const f = document.getElementById("cfg-flame-threshold");
      const a = document.getElementById("cfg-alarm-enabled");
      const si = document.getElementById("cfg-sync-interval");
      if (t) t.value = sensorConfig.tempDanger;
      if (g) g.value = sensorConfig.gasDanger;
      if (f) f.value = sensorConfig.flameAnalog;
      if (a) a.checked = !!sensorConfig.alarmEnabled;
      if (si) si.value = sensorConfig.syncInterval;
    }

    async function loadSensorConfig() {
      const localCfg = localStorage.getItem("smartfireSensorConfig");
      if (localCfg) {
        try {
          sensorConfig = { ...sensorConfig, ...JSON.parse(localCfg) };
        } catch (e) {
          // ignore
        }
      }

      try {
        const snap = await get(ref(db, "device/RIM_ROOM-01/config"));
        const cfg = snap.val();
        if (cfg) {
          sensorConfig = { ...sensorConfig, ...cfg };
        }
      } catch (e) {
        console.error("Gagal load config sensor:", e);
      }
      applySensorConfigToUI();
    }

    function saveSensorConfig() {
      const t =
        parseFloat(
          document.getElementById("cfg-temp-threshold")?.value || ""
        ) || sensorConfig.tempDanger;
      const g =
        parseFloat(
          document.getElementById("cfg-gas-threshold")?.value || ""
        ) || sensorConfig.gasDanger;
      const f =
        parseFloat(
          document.getElementById("cfg-flame-threshold")?.value || ""
        ) || sensorConfig.flameAnalog;
      const a = !!document.getElementById("cfg-alarm-enabled")?.checked;
      const si =
        parseInt(
          document.getElementById("cfg-sync-interval")?.value || "",
          10
        ) || sensorConfig.syncInterval;

      sensorConfig = {
        tempDanger: t,
        gasDanger: g,
        flameAnalog: f,
        alarmEnabled: a,
        syncInterval: si,
      };
      localStorage.setItem(
        "smartfireSensorConfig",
        JSON.stringify(sensorConfig)
      );
      set(ref(db, "device/RIM_ROOM-01/config"), sensorConfig);

      const info = document.getElementById("cfg-status");
      if (info) {
        info.classList.remove("hidden");
        setTimeout(() => info.classList.add("hidden"), 2500);
      }
    }

    function resetSensorConfig() {
      sensorConfig = {
        tempDanger: 50,
        gasDanger: 800,
        flameAnalog: 500,
        flameDangerPct: 10,
        alarmEnabled: true,
        syncInterval: 10,
      };
      applySensorConfigToUI();
    }

    const FLAME_KEYS = [
      "flame_raw", "flame_pct", "flame", "api", "API", "Api", "adc", "ADC", "Adc",
      "flameSensor", "flame_adc", "flameValue", "fire", "Flame", "FLAME",
      "flame_sensor", "analog_flame", "sensor4", "value4", "a0", "adc0", "ADC0"
    ];

    const NON_SENSOR_KEYS = ["temp", "temperature", "suhu", "hum", "humidity", "kelembapan", "gas", "gasPPM", "ts", "timestamp", "status", "alarm", "active", "online", "error", "mode"];

    function getFlameValue(raw) {
      if (!raw || typeof raw !== "object") return undefined;
      if (raw.flame_raw != null && !Number.isNaN(Number(raw.flame_raw))) return raw.flame_raw;
      let zeroOne = undefined;
      for (const key of FLAME_KEYS) {
        if (key === "flame_raw") continue;
        const v = raw[key];
        if (v == null || v === "" || Number.isNaN(Number(v))) continue;
        const n = Number(v);
        if (n >= 2 && n <= 4096) return v;
        if (n === 0 || n === 1) zeroOne = v;
      }
      let fallback = undefined;
      for (const [k, v] of Object.entries(raw)) {
        if (k.startsWith("-") || NON_SENSOR_KEYS.includes(k)) continue;
        const n = Number(v);
        if (Number.isNaN(n) || n < 0 || n > 4096) continue;
        const keyLower = k.toLowerCase();
        if ((keyLower.includes("flame") || keyLower.includes("api") || keyLower.includes("adc") || keyLower.includes("fire") || keyLower.includes("sensor")) && n >= 2) return v;
        if (fallback === undefined && n >= 2) fallback = v;
      }
      return fallback ?? zeroOne;
    }

    function normalizeTelemetry(d) {
      if (!d || typeof d !== "object") return d;
      if (d.sensors && typeof d.sensors === "object") return { ...d, ...d.sensors };
      if (d.data && typeof d.data === "object") return { ...d, ...d.data };
      const keys = Object.keys(d).filter((k) => k.startsWith("-N"));
      if (keys.length > 0 && keys.every((k) => d[k] && typeof d[k] === "object")) {
        const last = keys.sort().pop();
        return d[last];
      }
      return d;
    }

    function updateLiveCharts(d) {
      const raw = normalizeTelemetry(d);
      if (!raw || typeof raw !== "object") return;
      const charts = [myCharts.liveSuhu, myCharts.liveHum, myCharts.liveGas, myCharts.liveFlame];
      const hasCharts = charts.some(Boolean);
      if (!hasCharts) return;

      const temp = raw.temp ?? raw.temperature ?? raw.suhu;
      const hum = raw.hum ?? raw.humidity ?? raw.kelembapan;
      const gas = raw.gas ?? raw.gasPPM;
      const flame = getFlameValue(raw);
      const vTemp = temp != null && temp !== "" ? Number(temp) : null;
      const vHum = hum != null && hum !== "" ? Number(hum) : null;
      const vGas = gas != null && gas !== "" ? Math.round(Number(gas)) : null;
      const vFlame = flame != null && flame !== "" ? Number(flame) : null;

      const now = new Date();
      const minuteKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const tStamp = [
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        now.toLocaleDateString([], { day: "2-digit", month: "2-digit" }),
      ];

      const sameMinute = minuteKey === lastChartMinute;
      if (sameMinute) {
        const len = myCharts.liveSuhu?.data?.labels?.length ?? 0;
        if (len > 0) {
          const idx = len - 1;
          if (myCharts.liveSuhu) myCharts.liveSuhu.data.datasets[0].data[idx] = vTemp != null ? vTemp : 0;
          if (myCharts.liveHum) myCharts.liveHum.data.datasets[0].data[idx] = vHum != null ? vHum : 0;
          if (myCharts.liveGas) myCharts.liveGas.data.datasets[0].data[idx] = vGas != null ? vGas : 0;
          if (myCharts.liveFlame) myCharts.liveFlame.data.datasets[0].data[idx] = vFlame != null ? vFlame : 0;
          charts.filter(Boolean).forEach((c) => { try { c.update("none"); } catch (e) {} });
        }
        return;
      }
      lastChartMinute = minuteKey;

      const maxPoints = 60;
      charts.filter(Boolean).forEach((c) => {
        if (c.data.labels.length >= maxPoints) {
          c.data.labels.shift();
          c.data.datasets[0].data.shift();
        }
        c.data.labels.push(tStamp);
      });

      if (myCharts.liveSuhu)
        myCharts.liveSuhu.data.datasets[0].data.push(vTemp != null ? vTemp : 0);
      if (myCharts.liveHum)
        myCharts.liveHum.data.datasets[0].data.push(vHum != null ? vHum : 0);
      if (myCharts.liveGas)
        myCharts.liveGas.data.datasets[0].data.push(vGas != null ? vGas : 0);
      if (myCharts.liveFlame)
        myCharts.liveFlame.data.datasets[0].data.push(vFlame != null ? vFlame : 0);

      charts.filter(Boolean).forEach((c) => {
        try {
          if (c.update) c.update("none");
        } catch (e) {
          console.warn("Chart update skip:", e);
        }
      });
      sisa = 10;
    }

    function updateLiveInterface(d) {
      const raw = normalizeTelemetry(d);
      if (!raw) return;
      const sideTemp = document.getElementById("side-temp");
      const sideHum = document.getElementById("side-hum");
      const sideGas = document.getElementById("side-gas");
      const sideFlameAdc = document.getElementById("side-flame-adc");
      const temp = raw.temp ?? raw.temperature ?? raw.suhu;
      const hum = raw.hum ?? raw.humidity ?? raw.kelembapan;
      const gas = raw.gas ?? raw.gasPPM;
      const flame = getFlameValue(raw);

      if (sideTemp) sideTemp.textContent = temp != null && temp !== "" ? temp : "--";
      if (sideHum) sideHum.textContent = hum != null && hum !== "" ? hum : "--";
      if (sideGas) sideGas.textContent = gas != null && gas !== "" ? Math.round(Number(gas)) : "--";
      if (sideFlameAdc) sideFlameAdc.textContent = flame != null && flame !== "" ? flame : "--";

      const tempNum = Number(temp);
      const gasNum = Number(gas);
      const flameRaw = Number(flame);
      const flamePctRaw = raw.flame_pct != null && !Number.isNaN(Number(raw.flame_pct)) ? Number(raw.flame_pct) : null;
      const flamePct = flamePctRaw != null ? flamePctRaw : (!Number.isNaN(flameRaw) && flameRaw >= 0 && flameRaw <= 4095 ? ((4095 - flameRaw) / 4095) * 100 : 0);

      // ═══════════════════════════════════════════════════
      //  KLASIFIKASI MENGGUNAKAN ALGORITMA C4.5
      // ═══════════════════════════════════════════════════
      let statusMode = "AMAN";

      if (raw.status === "DANGER" || raw.status === "SAFE" || raw.status === "WARNING") {
        // Jika device sudah mengirim status langsung
        statusMode = raw.status === "DANGER" ? "BAHAYA" : raw.status === "WARNING" ? "WASPADA" : "AMAN";
      } else if (c45Model) {
        // Klasifikasi C4.5 — menggantikan logika if-else sederhana
        const sensorInput = {
          temp: !Number.isNaN(tempNum) ? tempNum : 25,
          hum: !Number.isNaN(Number(hum)) ? Number(hum) : 60,
          gas: !Number.isNaN(gasNum) ? gasNum : 100,
          flame: !Number.isNaN(flameRaw) ? flameRaw : 4000,
        };
        try {
          lastC45Result = c45Model.classify(sensorInput);
          statusMode = lastC45Result.class;
          updateC45Panel(sensorInput, lastC45Result);
        } catch (e) {
          console.warn("[C4.5] Klasifikasi gagal, fallback ke threshold:", e);
          statusMode = fallbackClassify(tempNum, gasNum, flamePct);
        }
      } else {
        // Fallback jika model C4.5 gagal di-train
        statusMode = fallbackClassify(tempNum, gasNum, flamePct);
      }

      const statusEl = document.getElementById("side-status");
      const statusCard = document.getElementById("card-status");

      if (!statusEl || !statusCard) return;

      if (statusMode === "BAHAYA") {
        statusEl.innerText = "BAHAYA";
        statusEl.className = "text-[9px] font-black text-red-600 animate-pulse uppercase mt-0.5";
        statusCard.classList.add("danger-pulse");
        if (sensorConfig.alarmEnabled) {
          document.getElementById("alarmSound")?.play();
        }
      } else {
        statusCard.classList.remove("danger-pulse");
        document.getElementById("alarmSound")?.pause();
        statusEl.innerText = statusMode === "WASPADA" ? "WASPADA" : "AMAN";
        statusEl.className =
          "text-[11px] font-black " +
          (statusMode === "WASPADA" ? "text-amber-500" : "text-emerald-600") +
          " uppercase mt-0.5";
      }
    }

    // Fallback klasifikasi sederhana jika C4.5 gagal
    function fallbackClassify(tempNum, gasNum, flamePct) {
      const flameDangerPct = sensorConfig.flameDangerPct ?? 10;
      const warnTemp = (sensorConfig.tempDanger ?? 50) * 0.85;
      const warnGas = (sensorConfig.gasDanger ?? 800) * 0.85;
      const warnFlamePct = flameDangerPct * 0.85;
      const bahaya = (!Number.isNaN(tempNum) && tempNum >= (sensorConfig.tempDanger ?? 50)) ||
        (!Number.isNaN(gasNum) && gasNum >= (sensorConfig.gasDanger ?? 800)) ||
        (flamePct >= flameDangerPct);
      const waspada = (!Number.isNaN(tempNum) && tempNum >= warnTemp) ||
        (!Number.isNaN(gasNum) && gasNum >= warnGas) ||
        (flamePct >= warnFlamePct);
      if (bahaya) return "BAHAYA";
      if (waspada) return "WASPADA";
      return "AMAN";
    }

    // Update panel Analisis C4.5 di UI
    function updateC45Panel(sensorInput, result) {
      // Update hasil klasifikasi
      const classEl = document.getElementById("c45-result-class");
      const confEl = document.getElementById("c45-result-confidence");
      const pathEl = document.getElementById("c45-decision-path");
      const inputEl = document.getElementById("c45-input-values");

      if (classEl) {
        const colors = { AMAN: "text-emerald-600", WASPADA: "text-amber-500", BAHAYA: "text-red-600" };
        const icons = { AMAN: "🟢", WASPADA: "🟡", BAHAYA: "🔴" };
        classEl.innerHTML = `<span class="${colors[result.class] || ''}">${icons[result.class] || ''} ${result.class}</span>`;
      }
      if (confEl) {
        confEl.textContent = `${(result.confidence * 100).toFixed(1)}%`;
      }

      // Tampilkan input sensor
      if (inputEl) {
        inputEl.innerHTML = `
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div class="bg-blue-50 rounded-xl p-2 text-center">
              <p class="text-[8px] text-blue-400 font-bold uppercase">Suhu</p>
              <p class="text-sm font-black text-blue-600">${sensorInput.temp}°C</p>
            </div>
            <div class="bg-cyan-50 rounded-xl p-2 text-center">
              <p class="text-[8px] text-cyan-400 font-bold uppercase">Kelembapan</p>
              <p class="text-sm font-black text-cyan-600">${sensorInput.hum}%</p>
            </div>
            <div class="bg-emerald-50 rounded-xl p-2 text-center">
              <p class="text-[8px] text-emerald-400 font-bold uppercase">Gas</p>
              <p class="text-sm font-black text-emerald-600">${sensorInput.gas} PPM</p>
            </div>
            <div class="bg-amber-50 rounded-xl p-2 text-center">
              <p class="text-[8px] text-amber-400 font-bold uppercase">Api</p>
              <p class="text-sm font-black text-amber-600">${sensorInput.flame} ADC</p>
            </div>
          </div>
        `;
      }

      // Tampilkan decision path
      if (pathEl) {
        const attrLabels = { temp: "Suhu (°C)", hum: "Kelembapan (%)", gas: "Gas (PPM)", flame: "Api (ADC)" };
        let pathHTML = '<div class="space-y-1.5">';
        result.path.forEach((step, i) => {
          const attrLabel = attrLabels[step.attribute] || step.attribute;
          const isTrue = step.direction === "≤";
          pathHTML += `
            <div class="flex items-center gap-2 text-[10px]">
              <span class="w-5 h-5 rounded-full ${isTrue ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'} flex items-center justify-center font-black text-[9px]">${i + 1}</span>
              <span class="font-semibold text-slate-600">${attrLabel}</span>
              <span class="text-slate-400">${step.direction}</span>
              <span class="font-bold text-indigo-600">${step.threshold.toFixed(2)}</span>
              <span class="text-slate-300">|</span>
              <span class="text-slate-500">Nilai:</span>
              <span class="font-bold text-slate-700">${step.value}</span>
              <span class="text-[8px] text-slate-400 ml-auto">GR: ${step.gainRatio.toFixed(4)}</span>
            </div>
          `;
        });
        const colors = { AMAN: "bg-emerald-100 text-emerald-700", WASPADA: "bg-amber-100 text-amber-700", BAHAYA: "bg-red-100 text-red-700" };
        pathHTML += `
          <div class="flex items-center gap-2 text-[10px] mt-2 pt-2 border-t border-slate-100">
            <span class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-[9px]">✓</span>
            <span class="font-bold text-slate-600">Hasil Klasifikasi:</span>
            <span class="px-2 py-0.5 rounded-full ${colors[result.class] || ''} font-black text-[9px] uppercase">${result.class}</span>
            <span class="text-[8px] text-slate-400">(Confidence: ${(result.confidence * 100).toFixed(1)}%)</span>
          </div>
        `;
        pathHTML += '</div>';
        pathEl.innerHTML = pathHTML;
      }
    }

    // Inisialisasi panel C4.5 dengan data model statis
    function initC45Panel() {
      if (!c45Model) return;

      const statsEl = document.getElementById("c45-model-stats");
      const treeEl = document.getElementById("c45-tree-text");
      const rulesEl = document.getElementById("c45-rules-table");
      const entropyEl = document.getElementById("c45-entropy-detail");

      if (statsEl) {
        const s = c45Model.stats;
        statsEl.innerHTML = `
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div class="bg-slate-50 rounded-xl p-3 text-center">
              <p class="text-[8px] text-slate-400 font-bold uppercase">Total Data Training</p>
              <p class="text-lg font-black text-slate-700">${s.totalData}</p>
            </div>
            <div class="bg-slate-50 rounded-xl p-3 text-center">
              <p class="text-[8px] text-slate-400 font-bold uppercase">Akurasi Training</p>
              <p class="text-lg font-black text-indigo-600">${(s.accuracy * 100).toFixed(1)}%</p>
            </div>
            <div class="bg-slate-50 rounded-xl p-3 text-center">
              <p class="text-[8px] text-slate-400 font-bold uppercase">Jumlah Node</p>
              <p class="text-lg font-black text-slate-700">${s.nodeCount}</p>
            </div>
            <div class="bg-slate-50 rounded-xl p-3 text-center">
              <p class="text-[8px] text-slate-400 font-bold uppercase">Jumlah Leaf</p>
              <p class="text-lg font-black text-slate-700">${s.leafCount}</p>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2 mt-2">
            <div class="bg-emerald-50 rounded-xl p-2 text-center">
              <p class="text-[8px] text-emerald-400 font-bold uppercase">AMAN</p>
              <p class="text-sm font-black text-emerald-600">${s.classDistribution.AMAN || 0} data</p>
            </div>
            <div class="bg-amber-50 rounded-xl p-2 text-center">
              <p class="text-[8px] text-amber-400 font-bold uppercase">WASPADA</p>
              <p class="text-sm font-black text-amber-600">${s.classDistribution.WASPADA || 0} data</p>
            </div>
            <div class="bg-red-50 rounded-xl p-2 text-center">
              <p class="text-[8px] text-red-400 font-bold uppercase">BAHAYA</p>
              <p class="text-sm font-black text-red-600">${s.classDistribution.BAHAYA || 0} data</p>
            </div>
          </div>
        `;
      }

      // Entropy detail
      if (entropyEl) {
        const s = c45Model.stats;
        const tree = c45Model.tree;
        let html = `
          <div class="space-y-3">
            <div class="bg-indigo-50 rounded-xl p-3">
              <p class="text-[9px] font-bold text-indigo-500 uppercase mb-1">Entropy Total Dataset (H(S))</p>
              <p class="text-xl font-black text-indigo-700">${s.totalEntropy.toFixed(4)} bit</p>
              <p class="text-[8px] text-indigo-400 mt-1">H(S) = -Σ p<sub>i</sub> × log<sub>2</sub>(p<sub>i</sub>)</p>
            </div>
        `;

        // Tampilkan detail split root node
        if (tree.type === "node" && tree.splitDetails) {
          html += `
            <div class="bg-white border border-slate-100 rounded-xl p-3">
              <p class="text-[9px] font-bold text-slate-500 uppercase mb-2">Perbandingan Gain Ratio — Root Node</p>
              <table class="w-full text-[9px]">
                <thead>
                  <tr class="border-b border-slate-100">
                    <th class="text-left py-1 text-slate-400 font-bold">Atribut</th>
                    <th class="text-right py-1 text-slate-400 font-bold">Threshold</th>
                    <th class="text-right py-1 text-slate-400 font-bold">Info Gain</th>
                    <th class="text-right py-1 text-slate-400 font-bold">Split Info</th>
                    <th class="text-right py-1 text-slate-400 font-bold">Gain Ratio</th>
                  </tr>
                </thead>
                <tbody>
          `;
          const attrLabels = { temp: "Suhu (°C)", hum: "Kelembapan (%)", gas: "Gas (PPM)", flame: "Api (ADC)" };
          const entries = Object.entries(tree.splitDetails)
            .sort((a, b) => b[1].gainRatio - a[1].gainRatio);
          entries.forEach(([attr, detail], idx) => {
            const isBest = attr === tree.attribute;
            html += `
              <tr class="${isBest ? 'bg-indigo-50 font-bold' : ''} border-b border-slate-50">
                <td class="py-1.5 ${isBest ? 'text-indigo-700' : 'text-slate-600'}">${isBest ? '★ ' : ''}${attrLabels[attr] || attr}</td>
                <td class="py-1.5 text-right text-slate-500">${detail.threshold != null ? detail.threshold.toFixed(2) : '-'}</td>
                <td class="py-1.5 text-right ${isBest ? 'text-indigo-600' : 'text-slate-500'}">${detail.infoGain.toFixed(4)}</td>
                <td class="py-1.5 text-right text-slate-500">${detail.splitInfo.toFixed(4)}</td>
                <td class="py-1.5 text-right ${isBest ? 'text-indigo-600' : 'text-slate-500'}">${detail.gainRatio.toFixed(4)}</td>
              </tr>
            `;
          });
          html += `</tbody></table>
            <p class="text-[8px] text-slate-400 mt-2">★ = Atribut terpilih (Gain Ratio tertinggi)</p>
            </div>
          `;
        }
        html += '</div>';
        entropyEl.innerHTML = html;
      }

      // Pohon keputusan (text)
      if (treeEl) {
        treeEl.textContent = c45Model.treeText;
      }

      // Rules table
      if (rulesEl) {
        const rules = c45Model.rules;
        let html = '<table class="w-full text-[9px]">';
        html += '<thead><tr class="border-b border-slate-200">';
        html += '<th class="text-left py-2 text-slate-400 font-bold">No</th>';
        html += '<th class="text-left py-2 text-slate-400 font-bold">Aturan (Conditions)</th>';
        html += '<th class="text-left py-2 text-slate-400 font-bold">Kelas</th>';
        html += '<th class="text-right py-2 text-slate-400 font-bold">Data</th>';
        html += '</tr></thead><tbody>';
        const colors = { AMAN: "bg-emerald-100 text-emerald-700", WASPADA: "bg-amber-100 text-amber-700", BAHAYA: "bg-red-100 text-red-700" };
        rules.forEach((rule, i) => {
          html += `<tr class="border-b border-slate-50">`;
          html += `<td class="py-1.5 text-slate-400">${i + 1}</td>`;
          html += `<td class="py-1.5 text-slate-600">${rule.conditions.join(' <span class="text-indigo-400 font-bold">DAN</span> ')}</td>`;
          html += `<td class="py-1.5"><span class="px-2 py-0.5 rounded-full ${colors[rule.class] || ''} font-bold text-[8px] uppercase">${rule.class}</span></td>`;
          html += `<td class="py-1.5 text-right text-slate-500">${rule.count}</td>`;
          html += `</tr>`;
        });
        html += '</tbody></table>';
        rulesEl.innerHTML = html;
      }
    }

    function renderHistoryTable() {
      const tbody = document.getElementById("history-table-body");
      if (!tbody) return;
      tbody.innerHTML = "";

      const total = historyLogs.length;
      const totalPages = Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE));
      if (historyPage > totalPages) historyPage = totalPages;
      const startIdx = (historyPage - 1) * HISTORY_PAGE_SIZE;
      const pageData = historyLogs.slice(
        startIdx,
        startIdx + HISTORY_PAGE_SIZE
      );

      pageData.forEach((it) => {
        const tr = document.createElement("tr");
        const ts = it.ts ?? it.timestamp;
        const dt = ts != null ? new Date(ts) : new Date();
        const tanggal = dt.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
        const waktu = dt.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const temp = it.temp ?? it.temperature ?? it.suhu ?? "--";
        const hum = it.hum ?? it.humidity ?? it.kelembapan ?? "--";
        const gas = it.gas != null ? Math.round(Number(it.gas)) : "--";
        const flame = it.flame ?? it.api ?? it.API ?? it.flameSensor ?? it.flame_adc ?? it.adc ?? "--";
        tr.innerHTML = `
          <td class="py-2 pr-4">${tanggal}</td>
          <td class="py-2 pr-4">${waktu}</td>
          <td class="py-2 pr-4">${temp}</td>
          <td class="py-2 pr-4">${hum}</td>
          <td class="py-2 pr-4">${gas}</td>
          <td class="py-2 pr-4">${flame}</td>
        `;
        tbody.appendChild(tr);
      });

      const pageInput = document.getElementById("history-page-input");
      const pageTotalSpan = document.getElementById("history-page-total");
      const count = document.getElementById("history-count");
      const prevBtn = document.getElementById("btn-history-prev");
      const nextBtn = document.getElementById("btn-history-next");

      if (pageInput) {
        pageInput.value = total === 0 ? 0 : historyPage;
        pageInput.onblur = applyHistoryPageFromInput;
        pageInput.onkeydown = (e) => { if (e.key === "Enter") applyHistoryPageFromInput(); };
      }
      if (pageTotalSpan) pageTotalSpan.textContent = ` / ${totalPages}`;
      if (count) count.innerText = `${total} data`;
      if (prevBtn) prevBtn.disabled = historyPage <= 1;
      if (nextBtn) nextBtn.disabled = historyPage >= totalPages || total === 0;
    }

    function applyHistoryPageFromInput() {
      const inp = document.getElementById("history-page-input");
      if (!inp) return;
      const num = parseInt(inp.value, 10);
      const totalPages = Math.max(1, Math.ceil(historyLogs.length / HISTORY_PAGE_SIZE));
      const clamped = Number.isNaN(num) || num < 1 ? 1 : Math.min(num, totalPages);
      historyPage = clamped;
      inp.value = historyPage;
      renderHistoryTable();
    }

    async function muatLengkapHistori() {
      const s = document.getElementById("hist-start")?.value;
      const e = document.getElementById("hist-end")?.value;
      const logsRef = ref(db, "device/RIM_ROOM-01/logs");

      try {
        const snap = await get(logsRef);
        let l = snap.val();
        if (!l || typeof l !== "object") {
          historyLogs = [];
          historyPage = 1;
          renderHistoryTable();
          return;
        }
        const rawList = Array.isArray(l) ? l : Object.values(l);
        let arr = rawList
          .filter((item) => item && (item.ts != null || item.timestamp != null))
          .map((item) => ({
            temp: item.temp ?? item.temperature ?? item.suhu,
            hum: item.hum ?? item.humidity ?? item.kelembapan,
            gas: item.gas ?? item.gasPPM,
            flame: item.flame ?? item.flame_raw ?? item.api ?? item.API ?? item.flameSensor ?? item.flame_adc ?? item.adc,
            ts: item.ts ?? item.timestamp ?? Date.now(),
          }))
          .sort((a, b) => a.ts - b.ts);
        if (s && e) {
          const startTs = new Date(s).getTime();
          const endTs = new Date(e).getTime();
          arr = arr.filter((item) => item.ts >= startTs && item.ts <= endTs);
        }
        historyLogs = arr;
        historyPage = 1;
        renderHistoryTable();
      } catch (err) {
        console.error("Gagal memuat histori:", err);
        alert("Gagal memuat histori: " + (err.message || String(err)) + ". Cek koneksi Firebase dan aturan read di Realtime Database.");
      }
    }

    function changeHistoryPage(step) {
      historyPage += step;
      if (historyPage < 1) historyPage = 1;
      renderHistoryTable();
    }

    async function simpanKeHistoriSekarang() {
      if (!buffer) {
        alert("Belum ada data dari alat. Pastikan device mengirim ke Firebase telemetry dan sidebar menampilkan nilai.");
        return;
      }
      const normalized = normalizeTelemetry(buffer);
      const norm = normalized || buffer;
      const ts = norm.ts ?? norm.timestamp ?? Date.now();
      const tsNum = typeof ts === "number" ? ts : Number(ts) || Date.now();
      const flameVal = getFlameValue(normalized) ?? getFlameValue(buffer);
      const logPayload = {
        temp: norm.temp ?? norm.temperature ?? norm.suhu,
        hum: norm.hum ?? norm.humidity ?? norm.kelembapan,
        gas: norm.gas ?? norm.gasPPM,
        flame: flameVal,
        ts: tsNum,
      };
      try {
        await push(ref(db, "device/RIM_ROOM-01/logs"), logPayload);
        alert("Data berhasil disimpan ke histori.");
        muatLengkapHistori();
      } catch (err) {
        console.error(err);
        alert("Gagal menyimpan: " + (err?.message || String(err)) + "\n\nDeploy rules: firebase deploy --only database");
      }
    }

    function exportCSV() {
      if (!historyLogs.length)
        return alert("Muat rekapitulasi data terlebih dahulu!");
      let csv = "Waktu,Suhu (C),Lembap (%),Gas (PPM),Api\n";
      historyLogs.forEach((r) => {
        csv += `${new Date(r.ts).toLocaleString()},${r.temp},${r.hum},${r.gas},${r.flame}\n`;
      });
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
      a.download = `Laporan_SmartFire_${Date.now()}.csv`;
    a.click();
      window.URL.revokeObjectURL(url);
    }

    function exportPDF() {
      if (!historyLogs.length)
        return alert("Muat rekapitulasi data terlebih dahulu!");
      const jsPDFLib = window.jspdf;
      if (!jsPDFLib) return;
      const { jsPDF } = jsPDFLib;
      const doc = new jsPDF();
      doc.text("Laporan SmartFire Monitor Professional", 14, 15);
      const rows = historyLogs.map((it) => [
        new Date(it.ts).toLocaleString(),
        `${it.temp} C`,
        `${it.hum} %`,
        `${it.gas} PPM`,
        it.flame > sensorConfig.flameAnalog ? "YA" : "TDK",
      ]);
      doc.autoTable({
        head: [["Waktu", "Suhu", "Lembap", "Gas", "Api (Terdeteksi)"]],
        body: rows,
        startY: 25,
      });
      doc.save(`Laporan_Histori_SmartFire.pdf`);
    }

    function switchView(v) {
      currentView = v;
      ["view-live", "view-history", "view-settings", "view-c45"].forEach(
        (el) => {
          const node = document.getElementById(el);
          if (node) node.classList.add("hidden");
        }
      );
      ["btn-live", "btn-history", "btn-settings", "btn-c45"].forEach(
        (btn) => {
          const node = document.getElementById(btn);
          if (node) node.classList.remove("active-tab");
        }
      );
      document.getElementById("view-" + v)?.classList.remove("hidden");
      document.getElementById("btn-" + v)?.classList.add("active-tab");
      if (v === "history") {
        muatLengkapHistori();
      }
      if (v === "c45") {
        initC45Panel();
      }
      // Kembali ke Monitoring: resize & refresh grafik agar tampil benar setelah lama di dashboard lain
      if (v === "live") {
        requestAnimationFrame(() => {
          [myCharts.liveSuhu, myCharts.liveHum, myCharts.liveGas, myCharts.liveFlame]
            .filter(Boolean)
            .forEach((c) => { try { c.resize(); c.update("none"); } catch (_) {} });
        });
        if (buffer) updateLiveCharts(buffer);
      }
    }

    function handleLogin(event) {
      event.preventDefault();
      const emailInput = document.getElementById("login-email");
      const passInput = document.getElementById("login-password");
      const err = document.getElementById("login-error");
      if (!emailInput || !passInput || !err) return;

      const email = (emailInput.value || "").trim().toLowerCase();
      const pass = (passInput.value || "").trim();

      if (!email || !pass) {
        err.innerText = "Email dan kata sandi wajib diisi.";
        err.classList.remove("hidden");
        return;
      }

      let users = [];
      try {
        const raw = localStorage.getItem("smartfireUsers");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) users = parsed;
        }
      } catch {
        // ignore
      }

      const user = users.find((u) => u.email === email && u.password === pass);
      if (!user) {
        err.innerText = "Email atau kata sandi salah.";
        err.classList.remove("hidden");
        return;
      }

      localStorage.setItem("smartfireLogged", "1");
      document.getElementById("login-screen")?.classList.add("hidden");
      err.classList.add("hidden");
      emailInput.value = "";
      passInput.value = "";
    }

    function handleRegister(event) {
      event.preventDefault();
      const nameInput = document.getElementById("register-name");
      const emailInput = document.getElementById("register-email");
      const passInput = document.getElementById("register-password");
      const confirmInput = document.getElementById(
        "register-password-confirm"
      );
      const err = document.getElementById("register-error");

      if (!emailInput || !passInput || !confirmInput || !err) return;

      const name = (nameInput?.value || "").trim();
      const email = (emailInput.value || "").trim().toLowerCase();
      const pass = (passInput.value || "").trim();
      const confirm = (confirmInput.value || "").trim();

      if (!email || !pass || !confirm) {
        err.innerText = "Lengkapi semua data yang wajib diisi.";
        err.classList.remove("hidden");
        return;
      }

      if (pass.length < 6) {
        err.innerText = "Kata sandi minimal 6 karakter.";
        err.classList.remove("hidden");
        return;
      }

      if (pass !== confirm) {
        err.innerText = "Kata sandi dan konfirmasi tidak sama.";
        err.classList.remove("hidden");
        return;
      }

      let users = [];
      try {
        const raw = localStorage.getItem("smartfireUsers");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) users = parsed;
        }
      } catch {
        // ignore
      }

      if (users.some((u) => u.email === email)) {
        err.innerText = "Email sudah terdaftar. Silakan masuk.";
        err.classList.remove("hidden");
        return;
      }

      users.push({ email, password: pass, name });
      localStorage.setItem("smartfireUsers", JSON.stringify(users));

      localStorage.setItem("smartfireLogged", "1");
      document.getElementById("login-screen")?.classList.add("hidden");
      err.classList.add("hidden");

      emailInput.value = "";
      passInput.value = "";
      confirmInput.value = "";
      if (nameInput) nameInput.value = "";
    }

    function switchAuthTab(tab) {
      const loginForm = document.getElementById("form-login");
      const registerForm = document.getElementById("form-register");
      const tabLogin = document.getElementById("tab-login");
      const tabRegister = document.getElementById("tab-register");
      const loginError = document.getElementById("login-error");
      const registerError = document.getElementById("register-error");

      if (!loginForm || !registerForm || !tabLogin || !tabRegister) return;

      if (tab === "register") {
        registerForm.classList.remove("hidden");
        loginForm.classList.add("hidden");
        tabRegister.className =
          "flex-1 py-1.5 rounded-full bg-white shadow text-slate-800 transition-all";
        tabLogin.className =
          "flex-1 py-1.5 rounded-full text-slate-500 transition-all";
      } else {
        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");
        tabLogin.className =
          "flex-1 py-1.5 rounded-full bg-white shadow text-slate-800 transition-all";
        tabRegister.className =
          "flex-1 py-1.5 rounded-full text-slate-500 transition-all";
      }

      if (loginError) {
        loginError.classList.add("hidden");
        loginError.innerText = "";
      }
      if (registerError) {
        registerError.classList.add("hidden");
        registerError.innerText = "";
      }
    }

    function initChartsOnly() {
      if (!window.Chart) return false;
      const el = document.getElementById("chartLiveSuhu");
      if (!el || !el.parentElement) return false;
      const existing = window.Chart.getChart(el);
      if (existing) existing.destroy();
      myCharts.liveSuhu = mkChart("chartLiveSuhu", "Suhu (°C)", "#3b82f6");
      myCharts.liveHum = mkChart("chartLiveHum", "Lembap (%)", "#06b6d4");
      myCharts.liveGas = mkChart("chartLiveGas", "Gas (PPM)", "#10b981");
      myCharts.liveFlame = mkChart(
        "chartLiveFlame",
        "Api",
        "#f59e0b",
        false
      );
      if (!myCharts.liveSuhu) return false;
      if (buffer) {
        for (let i = 0; i < 8; i++) updateLiveCharts(buffer);
      }
      requestAnimationFrame(() => {
        [myCharts.liveSuhu, myCharts.liveHum, myCharts.liveGas, myCharts.liveFlame]
          .filter(Boolean)
          .forEach((c) => { try { c.resize(); c.update("none"); } catch (_) {} });
      });
      return true;
    }

    let unsubscribe = () => {};
    let intervalId = null;

    // Jalankan listener Firebase + timer + login SEKALI, tidak tunggu Chart
    function startListenerAndTimer() {
      const api = {
        handleLogin,
        handleRegister,
        switchAuthTab,
        saveSensorConfig,
        resetSensorConfig,
        switchView,
        muatLengkapHistori,
        simpanKeHistoriSekarang,
        exportCSV,
        exportPDF,
        changeHistoryPage,
      };
      window.smartfire = api;
      handlersRef.current = api;
      loadSensorConfig();
      try {
        const telemetryRef = ref(db, "device/RIM_ROOM-01/telemetry");
        unsubscribe = onValue(telemetryRef, (snap) => {
      buffer = snap.val();
      lastUp = Date.now();
      updateLiveInterface(buffer);

      // Simpan otomatis ke histori setiap 1 menit (60 detik)
      // Interval 1 menit = ~1.440 data/hari — cukup detail tanpa membebani Firebase
      if (buffer) {
        const normalized = normalizeTelemetry(buffer);
        const norm = normalized || buffer;
        const ts = norm.ts ?? norm.timestamp ?? Date.now();
        const tsNum = typeof ts === "number" ? ts : Number(ts) || Date.now();
        const flameVal = getFlameValue(normalized) ?? getFlameValue(buffer);
        const now = Date.now();
        const throttleMs = 60000;
        if (now - lastPushToLogs >= throttleMs) {
          lastPushToLogs = now;
          lastLoggedTs = tsNum;
          const logPayload = {
            temp: norm.temp ?? norm.temperature ?? norm.suhu,
            hum: norm.hum ?? norm.humidity ?? norm.kelembapan,
            gas: norm.gas ?? norm.gasPPM,
            flame: flameVal,
            ts: tsNum,
          };
          push(ref(db, "device/RIM_ROOM-01/logs"), logPayload)
            .then(() => { window.__lastLogOk = Date.now(); })
            .catch((err) => {
              console.error("[Histori] Gagal simpan ke Firebase logs:", err);
              if (window.__showLogError !== false) {
                alert("Gagal menyimpan ke histori: " + (err?.message || String(err)) + "\n\nCek: Firebase Console → Realtime Database → Rules. Jalankan: firebase deploy --only database");
                window.__showLogError = false;
              }
            });
        }
      }

      // Grafik realtime tetap di-update meskipun user sedang di dashboard Histori/Pengaturan
      if (buffer) {
        updateLiveCharts(buffer);
      }
    });

      intervalId = setInterval(() => {
      const isOff = (Date.now() - lastUp) / 1000 > 30;
      const statusDot = document.getElementById("status-dot");
      const statusText = document.getElementById("status-text");
      if (statusDot) {
        statusDot.className = isOff
          ? "h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"
          : "h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-md";
      }
      if (statusText) {
        statusText.innerText = isOff ? "OFFLINE" : "ALAT ONLINE";
      }

      if (currentView === "live" && buffer) {
        sisa--;
        if (sisa < 0) sisa = 10;
        const syncVal = document.getElementById("sync-val");
        if (syncVal) syncVal.innerText = sisa;
      }
    }, 1000);

      if (localStorage.getItem("smartfireLogged") === "1") {
        document.getElementById("login-screen")?.classList.add("hidden");
      } else {
        let users = [];
        try {
          const raw = localStorage.getItem("smartfireUsers");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) users = parsed;
          }
        } catch {
          // ignore
        }
        if (!users.length) {
          switchAuthTab("register");
        } else {
          switchAuthTab("login");
        }
      }
      } catch (e) {
        console.error("Firebase telemetry listener error:", e);
      }
    }

    // Listener & UI jalan dulu supaya nilai API/sidebar bisa update dari Firebase
    startListenerAndTimer();

    // Saat user kembali ke tab (dari tab lain / minimize): segarkan tampilan dengan data terbaru
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && buffer) {
        updateLiveInterface(buffer);
        if (currentView === "live") {
          updateLiveCharts(buffer);
          [myCharts.liveSuhu, myCharts.liveHum, myCharts.liveGas, myCharts.liveFlame]
            .filter(Boolean)
            .forEach((c) => { try { c.resize(); c.update("none"); } catch (_) {} });
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Muat histori otomatis di background agar data siap saat user buka tab Histori (tanpa perlu pilih tanggal)
    setTimeout(() => muatLengkapHistori(), 800);

    // Grafik: retry sampai Chart.js & canvas siap (delay lebih lama agar DOM & data siap)
    function tryCharts() {
      if (initChartsOnly()) return;
      chartReadyTimer = setTimeout(tryCharts, 200);
    }
    let chartReadyTimer = setTimeout(tryCharts, 500);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearTimeout(chartReadyTimer);
      Object.values(myCharts).forEach((c) => {
        if (c && typeof c.destroy === "function") {
          c.destroy();
        }
      });
      unsubscribe();
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const call = (fnName, ...args) => {
    const api = handlersRef.current || window.smartfire;
    if (api && typeof api[fnName] === "function") {
      api[fnName](...args);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col md:flex-row overflow-x-hidden bg-slate-100">
      <audio id="alarmSound" loop>
        <source
          src="https://www.soundjay.com/buttons/beep-01a.mp3"
          type="audio/mpeg"
        />
      </audio>

      {/* HALAMAN LOGIN / REGISTER */}
      <div
        id="login-screen"
        className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md"
      >
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-[92%] max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-8 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-orange-500 via-red-500 to-sky-500 flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-fire text-lg"></i>
          </div>
          <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.25em]">
                Smart Fire
              </p>
              <h1 className="text-lg font-extrabold text-slate-800 uppercase tracking-[0.2em]">
                Monitoring
              </h1>
          </div>
        </div>
          <p className="text-[11px] text-slate-500">
            Masuk atau daftar akun baru untuk mengakses dashboard monitoring
            kebakaran secara real-time.
          </p>

          <div className="flex justify-center gap-2 bg-slate-100 p-1 rounded-full text-[10px] font-bold uppercase tracking-[0.25em]">
            <button
              type="button"
              id="tab-login"
              className="flex-1 py-1.5 rounded-full bg-white shadow text-slate-800 transition-all"
              onClick={() => call("switchAuthTab", "login")}
            >
              Masuk
            </button>
            <button
              type="button"
              id="tab-register"
              className="flex-1 py-1.5 rounded-full text-slate-500 transition-all"
              onClick={() => call("switchAuthTab", "register")}
            >
              Daftar
            </button>
          </div>

          {/* FORM LOGIN */}
          <form
            id="form-login"
            onSubmit={(e) => call("handleLogin", e)}
            className="space-y-4 mt-4"
          >
            <div className="space-y-2">
              <div className="space-y-1">
                <label
                  htmlFor="login-email"
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]"
                >
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Masukkan email"
                />
        </div>
              <div className="space-y-1">
                <label
                  htmlFor="login-password"
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]"
                >
                  Kata Sandi
                </label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Masukkan kata sandi"
                />
              </div>
            </div>
            <p id="login-error" className="text-[10px] text-red-500 hidden"></p>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-700 active:scale-95 transition-all shadow-lg"
            >
              Masuk Dashboard
            </button>
          </form>

          {/* FORM REGISTER */}
          <form
            id="form-register"
            onSubmit={(e) => call("handleRegister", e)}
            className="space-y-4 mt-4 hidden"
          >
            <div className="space-y-2">
              <div className="space-y-1">
                <label
                  htmlFor="register-name"
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]"
                >
                  Nama Lengkap (opsional)
                </label>
                <input
                  id="register-name"
                  type="text"
                  autoComplete="name"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Masukkan nama"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="register-email"
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]"
                >
                  Email
                </label>
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Masukkan email aktif"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="register-password"
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]"
                >
                  Kata Sandi
                </label>
                <input
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="register-password-confirm"
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]"
                >
                  Ulangi Kata Sandi
                </label>
                <input
                  id="register-password-confirm"
                  type="password"
                  autoComplete="new-password"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ulangi kata sandi"
                />
              </div>
            </div>
            <p
              id="register-error"
              className="text-[10px] text-red-500 hidden"
            ></p>
            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-700 active:scale-95 transition-all shadow-lg"
            >
              Daftar &amp; Masuk
            </button>
          </form>

          <p className="text-[9px] text-slate-400 text-center">
            Akun login disimpan secara lokal di browser ini. Hapus data browser
            untuk mereset akun.
          </p>
        </div>
            </div>

      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col p-3 sm:p-4 shrink-0 shadow-sm z-50 safe-area-inset">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 md:mb-6 px-1">
          <div className="h-10 w-10 rounded-full bg-slate-900/5 flex items-center justify-center overflow-hidden">
            <img
              src="smart-fire-logo.jpeg"
              alt="Smart Fire"
              className="h-full w-full object-contain select-none pointer-events-none"
            />
          </div>
          <div className="leading-tight">
            <h1 className="text-[13px] font-extrabold uppercase tracking-[0.25em] text-slate-900">
              Smart Fire
            </h1>
            <p className="text-[9px] font-black uppercase tracking-[0.28em] text-orange-500">
              Monitoring
            </p>
          </div>
        </div>

        <nav className="flex flex-row md:flex-col gap-1 md:gap-2 mb-4 md:mb-6">
          <button
            onClick={() => call("switchView", "live")}
            id="btn-live"
            className="flex-1 md:flex-none min-w-0 py-2 md:py-2.5 px-2 md:px-4 rounded-full text-[9px] sm:text-[10px] font-semibold text-slate-500 hover:bg-slate-50 uppercase tracking-[0.15em] md:tracking-[0.2em] flex items-center justify-start gap-1 md:gap-2 transition-all active-tab text-left"
          >
            <i className="fas fa-satellite-dish text-[10px] md:text-xs shrink-0"></i>
            <span className="md:hidden">Live</span>
            <span className="hidden md:inline">Monitoring Real-time</span>
          </button>
          <button
            onClick={() => call("switchView", "history")}
            id="btn-history"
            className="flex-1 md:flex-none min-w-0 py-2 md:py-2.5 px-2 md:px-4 rounded-full text-[9px] sm:text-[10px] font-semibold text-slate-500 hover:bg-slate-50 uppercase tracking-[0.15em] md:tracking-[0.2em] flex items-center justify-start gap-1 md:gap-2 transition-all text-left"
          >
            <i className="fas fa-history text-[10px] md:text-xs shrink-0"></i>
            <span className="md:hidden">Histori</span>
            <span className="hidden md:inline">Histori Data</span>
          </button>
          <button
            onClick={() => call("switchView", "c45")}
            id="btn-c45"
            className="flex-1 md:flex-none min-w-0 py-2 md:py-2.5 px-2 md:px-4 rounded-full text-[9px] sm:text-[10px] font-semibold text-slate-500 hover:bg-slate-50 uppercase tracking-[0.15em] md:tracking-[0.2em] flex items-center justify-start gap-1 md:gap-2 transition-all text-left"
          >
            <i className="fas fa-brain text-[10px] md:text-xs shrink-0"></i>
            <span className="md:hidden">C4.5</span>
            <span className="hidden md:inline">Analisis C4.5</span>
          </button>
          <button
            onClick={() => call("switchView", "settings")}
            id="btn-settings"
            className="flex-1 md:flex-none min-w-0 py-2 md:py-2.5 px-2 md:px-4 rounded-full text-[9px] sm:text-[10px] font-semibold text-slate-500 hover:bg-slate-50 uppercase tracking-[0.15em] md:tracking-[0.2em] flex items-center justify-start gap-1 md:gap-2 transition-all text-left"
          >
            <i className="fas fa-cog text-[10px] md:text-xs shrink-0"></i>
            <span className="md:hidden">Setting</span>
            <span className="hidden md:inline">Pengaturan</span>
          </button>
        </nav>

        {/* Metrik sidebar */}
        <div className="grid grid-cols-2 md:flex md:flex-col gap-2 md:gap-3 flex-1 md:overflow-hidden min-h-0">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic px-1 mb-1 md:mb-2 col-span-2 md:col-span-1">
            Metrik Sensor Utama
          </p>
          <div
            id="card-suhu"
            className="p-3 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-blue-500 shadow">
                <i className="fas fa-temperature-high text-sm"></i>
                  </div>
              <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">
                Suhu
              </span>
            </div>
            <div className="text-right leading-none">
              <p className="text-xl font-black text-slate-800 mt-0.5">
                <span id="side-temp">--</span>°C
                    </p>
                  </div>
                </div>
          <div
            id="card-hum"
            className="p-3 bg-cyan-50 border border-cyan-100 rounded-2xl flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-cyan-500 shadow">
                <i className="fas fa-tint text-sm"></i>
              </div>
              <span className="text-[9px] font-bold text-cyan-500 uppercase tracking-widest">
                Kelembapan
              </span>
                  </div>
            <div className="text-right leading-none">
              <p className="text-xl font-black text-slate-800 mt-0.5">
                <span id="side-hum">--</span>%
                    </p>
                  </div>
                </div>
          <div
            id="card-gas"
            className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-emerald-500 shadow">
                <i className="fas fa-wind text-sm"></i>
              </div>
              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                Gas
              </span>
                  </div>
            <div className="text-right leading-none">
              <p className="text-xl font-black text-slate-800 mt-0.5">
                <span id="side-gas">--</span>
                <span className="text-[10px] font-bold uppercase ml-1">
                  PPM
                </span>
              </p>
                  </div>
                </div>
          <div
            id="card-flame"
            className="p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-amber-500 shadow">
                <i className="fas fa-fire text-sm"></i>
              </div>
              <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">
                Api
              </span>
            </div>
            <div className="text-right leading-none">
              <p
                id="side-flame-adc"
                className="text-xl font-black text-slate-800"
              >
                --
              </p>
            </div>
          </div>
          <div
            id="card-status"
            className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between shadow-sm transition-all"
          >
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-rose-500 shadow">
                <i className="fas fa-circle-exclamation text-sm"></i>
              </div>
              <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">
                Status
              </span>
            </div>
            <div className="text-right leading-none">
              <p
                id="side-status"
                className="text-[11px] font-black text-rose-600 uppercase mt-0.5"
              >
                Aman
                    </p>
                  </div>
                </div>
              </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col items-center">
          <p className="text-[8px] font-bold uppercase text-slate-400 tracking-[0.25em] mb-1">
            Pembaruan Sistem :{" "}
            <span id="sync-val" className="text-indigo-600">
              10
            </span>{" "}
            Detik
          </p>
          <div className="flex items-center gap-2">
            <span
              id="status-dot"
              className="h-1.5 w-1.5 rounded-full bg-slate-400"
            ></span>
            <span
              id="status-text"
              className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.25em]"
            >
              Status Alat : Online
            </span>
                  </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-h-0 min-h-[50vh] p-3 sm:p-4 md:p-6 gap-3 md:gap-4 overflow-y-auto overflow-x-hidden bg-slate-100">
        {/* LIVE VIEW */}
        <div
          id="view-live"
          className="flex-1 flex flex-col gap-4 min-h-0"
        >
          <div className="shrink-0">
            <div className="bg-white px-4 sm:px-8 py-3 sm:py-4 rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center">
              <h2 className="text-xs sm:text-sm md:text-base font-medium text-slate-700 uppercase tracking-normal">
                Monitoring Real-Time
              </h2>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 min-h-0 auto-rows-fr">
            <div className="bg-white p-3 sm:p-4 rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col text-center min-h-[140px] sm:min-h-0">
              <p className="text-[8px] sm:text-[9px] font-bold text-blue-500 uppercase mb-1 sm:mb-2 tracking-[0.25em] border-b pb-1">
                Analisis Suhu (°C)
              </p>
              <div className="chart-wrapper">
                <canvas id="chartLiveSuhu"></canvas>
              </div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col text-center min-h-[140px] sm:min-h-0">
              <p className="text-[8px] sm:text-[9px] font-bold text-cyan-500 uppercase mb-1 sm:mb-2 tracking-[0.25em] border-b pb-1">
                Analisis Kelembapan (%)
              </p>
              <div className="chart-wrapper">
                <canvas id="chartLiveHum"></canvas>
              </div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col text-center min-h-[140px] sm:min-h-0">
              <p className="text-[8px] sm:text-[9px] font-bold text-emerald-500 uppercase mb-1 sm:mb-2 tracking-[0.25em] border-b pb-1">
                Analisis Gas (PPM)
              </p>
              <div className="chart-wrapper">
                <canvas id="chartLiveGas"></canvas>
              </div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col text-center min-h-[140px] sm:min-h-0">
              <p className="text-[8px] sm:text-[9px] font-bold text-amber-500 uppercase mb-1 sm:mb-2 tracking-[0.25em] border-b pb-1">
                Grafik Api
              </p>
              <div className="chart-wrapper">
                <canvas id="chartLiveFlame"></canvas>
              </div>
            </div>
          </div>
        </div>

        {/* HISTORY VIEW */}
        <div
          id="view-history"
          className="hidden flex-1 flex flex-col gap-4 overflow-hidden"
        >
          <div className="flex-1 bg-white p-6 rounded-[3rem] border border-slate-200 flex flex-col min-h-0 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase italic mb-1 tracking-widest border-b pb-1 text-center">
              Histori Data
            </p>
            <div className="mb-3 md:mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <i className="fas fa-history text-indigo-500 shrink-0"></i>
                <div className="flex gap-1 sm:gap-2 items-center bg-slate-50 px-2 sm:px-3 py-1.5 rounded-xl border min-w-0">
                  <input
                    type="datetime-local"
                    id="hist-start"
                    className="bg-transparent text-[9px] sm:text-[10px] font-bold outline-none text-slate-600 min-w-0 max-w-[45%] sm:max-w-none"
                  />
                  <span className="text-slate-300 shrink-0">→</span>
                  <input
                    type="datetime-local"
                    id="hist-end"
                    className="bg-transparent text-[9px] sm:text-[10px] font-bold outline-none text-slate-600 min-w-0 max-w-[45%] sm:max-w-none"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => call("muatLengkapHistori")}
                  className="bg-indigo-600 text-white px-4 sm:px-8 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase shadow-lg hover:scale-95 transition-all min-h-[40px] touch-manipulation"
                >
                  Muat Histori
                </button>
                <button
                  onClick={() => call("exportCSV")}
                  className="bg-emerald-600 text-white px-4 sm:px-6 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase hover:bg-emerald-700 min-h-[40px] touch-manipulation"
                >
                  Ekspor .CSV
                </button>
                <button
                  onClick={() => call("exportPDF")}
                  className="bg-red-600 text-white px-4 sm:px-6 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase hover:bg-red-700 min-h-[40px] touch-manipulation"
                >
                  Unduh PDF
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto overflow-x-auto scroll-touch">
              <table className="min-w-full text-[9px] sm:text-[10px] text-left">
                <thead className="text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2 pr-4 font-bold">Tanggal</th>
                    <th className="py-2 pr-4 font-bold">Waktu</th>
                    <th className="py-2 pr-4 font-bold">Suhu (°C)</th>
                    <th className="py-2 pr-4 font-bold">Kelembapan (%)</th>
                    <th className="py-2 pr-4 font-bold">Gas (PPM)</th>
                    <th className="py-2 pr-4 font-bold">Api</th>
                  </tr>
                </thead>
                <tbody
                  id="history-table-body"
                  className="divide-y divide-slate-100 text-slate-600"
                ></tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between text-[9px] text-slate-500">
              <span id="history-count">0 data</span>
              <div className="flex items-center gap-2">
                  <button
                  id="btn-history-prev"
                  onClick={() => call("changeHistoryPage", -1)}
                  className="px-3 py-2 min-h-[36px] rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed text-[9px] sm:text-[10px] font-semibold touch-manipulation"
                >
                  Sebelumnya
                  </button>
                <input
                  id="history-page-input"
                  type="number"
                  min={1}
                  className="w-10 px-1 py-1.5 text-center border border-slate-200 rounded text-[10px] text-slate-600 bg-white"
                  defaultValue={1}
                />
                <span id="history-page-total" className="text-[9px] sm:text-[10px]"> / 1</span>
                  <button
                  id="btn-history-next"
                  onClick={() => call("changeHistoryPage", 1)}
                  className="px-3 py-2 min-h-[36px] rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed text-[9px] sm:text-[10px] font-semibold touch-manipulation"
                >
                  Berikutnya
                  </button>
                </div>
              </div>
            </div>
            </div>

        {/* C4.5 ANALYSIS VIEW */}
        <div
          id="view-c45"
          className="hidden flex-1 flex flex-col gap-4 overflow-y-auto"
        >
          <div className="shrink-0">
            <div className="bg-white px-4 sm:px-8 py-3 sm:py-4 rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow">
                <i className="fas fa-brain text-xs"></i>
              </div>
              <div>
                <h2 className="text-xs sm:text-sm md:text-base font-medium text-slate-700 uppercase tracking-normal">
                  Analisis Algoritma C4.5
                </h2>
                <p className="text-[8px] text-slate-400">Decision Tree Classifier untuk Deteksi Kebakaran</p>
              </div>
            </div>
          </div>

          {/* Hasil Klasifikasi Real-Time */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.25em] mb-3 flex items-center gap-2">
              <i className="fas fa-bolt"></i>
              Klasifikasi Real-Time (C4.5)
            </p>
            <div className="mb-3" id="c45-input-values">
              <p className="text-[9px] text-slate-400 italic">Menunggu data sensor...</p>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div>
                <p className="text-[8px] text-slate-400 uppercase font-bold">Hasil Klasifikasi</p>
                <p id="c45-result-class" className="text-2xl font-black text-slate-700">--</p>
              </div>
              <div>
                <p className="text-[8px] text-slate-400 uppercase font-bold">Confidence</p>
                <p id="c45-result-confidence" className="text-2xl font-black text-indigo-600">--%</p>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase mb-2">Jalur Keputusan (Decision Path)</p>
              <div id="c45-decision-path" className="bg-slate-50 rounded-xl p-3">
                <p className="text-[9px] text-slate-400 italic">Belum ada klasifikasi...</p>
              </div>
            </div>
          </div>

          {/* Statistik Model */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em] mb-3 flex items-center gap-2">
              <i className="fas fa-chart-bar"></i>
              Statistik Model C4.5
            </p>
            <div id="c45-model-stats">
              <p className="text-[9px] text-slate-400 italic">Memuat statistik model...</p>
            </div>
          </div>

          {/* Detail Entropy & Gain Ratio */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.25em] mb-3 flex items-center gap-2">
              <i className="fas fa-calculator"></i>
              Perhitungan Entropy & Gain Ratio
            </p>
            <div id="c45-entropy-detail">
              <p className="text-[9px] text-slate-400 italic">Memuat perhitungan...</p>
            </div>
          </div>

          {/* Pohon Keputusan (Teks) */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em] mb-3 flex items-center gap-2">
              <i className="fas fa-project-diagram"></i>
              Struktur Pohon Keputusan
            </p>
            <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
              <pre id="c45-tree-text" className="text-[9px] sm:text-[10px] text-emerald-400 font-mono leading-relaxed whitespace-pre">Memuat pohon keputusan...</pre>
            </div>
          </div>

          {/* Tabel Aturan (Rules) */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em] mb-3 flex items-center gap-2">
              <i className="fas fa-list-check"></i>
              Aturan Klasifikasi (Rules)
            </p>
            <div className="overflow-x-auto" id="c45-rules-table">
              <p className="text-[9px] text-slate-400 italic">Memuat aturan...</p>
            </div>
          </div>

          {/* Penjelasan Metode */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 sm:p-6 rounded-2xl md:rounded-[2.5rem] border border-indigo-100 shadow-sm">
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.25em] mb-3 flex items-center gap-2">
              <i className="fas fa-info-circle"></i>
              Tentang Algoritma C4.5
            </p>
            <div className="space-y-2 text-[9px] sm:text-[10px] text-slate-600 leading-relaxed">
              <p>
                <strong>Algoritma C4.5</strong> (Quinlan, 1993) adalah algoritma decision tree yang membangun pohon keputusan dari dataset training berlabel. Algoritma ini merupakan pengembangan dari ID3 yang menambahkan <strong>Gain Ratio</strong> sebagai ukuran pemilihan atribut.
              </p>
              <p>
                <strong>Cara Kerja:</strong>
              </p>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Hitung <strong>Entropy</strong> total dataset: H(S) = -Σ p<sub>i</sub> × log<sub>2</sub>(p<sub>i</sub>)</li>
                <li>Untuk setiap atribut, cari <strong>threshold</strong> terbaik dan hitung <strong>Information Gain</strong></li>
                <li>Hitung <strong>Split Information</strong> untuk normalisasi: SI = -Σ (|S<sub>v</sub>|/|S|) × log<sub>2</sub>(|S<sub>v</sub>|/|S|)</li>
                <li>Pilih atribut dengan <strong>Gain Ratio</strong> tertinggi: GR = Information Gain / Split Information</li>
                <li>Buat node keputusan, bagi data, dan ulangi secara rekursif</li>
              </ol>
              <p>
                <strong>Keunggulan C4.5 vs IF-ELSE sederhana:</strong> C4.5 mempertimbangkan <em>kombinasi seluruh faktor sensor</em> secara simultan, bukan memeriksa setiap sensor satu per satu. Ini menghasilkan klasifikasi yang lebih akurat dan nuanced.
              </p>
              <p className="text-[8px] text-slate-400 mt-2">
                Threshold pada C4.5 bersifat <strong>statis</strong> (tidak berubah setiap hari) — ditentukan sekali saat training berdasarkan dataset berlabel yang cukup besar. Ini menjamin konsistensi dan keandalan sistem deteksi kebakaran.
              </p>
            </div>
          </div>
        </div>

        {/* SETTINGS VIEW */}
        <div
          id="view-settings"
          className="hidden flex-1 flex flex-col gap-4 overflow-hidden"
        >
          <div className="bg-white px-8 py-4 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center shrink-0">
            <h2 className="text-sm md:text-base font-medium text-slate-700 uppercase tracking-normal">
              Pengaturan
            </h2>
                </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 flex-1 min-h-0">
            <div className="bg-white p-4 sm:p-6 rounded-2xl md:rounded-[3rem] border border-slate-200 shadow-sm flex flex-col">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em] mb-4">
                Pengaturan Sensor &amp; Threshold
              </p>
              <div className="space-y-4 text-[10px] text-slate-600">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold uppercase tracking-[0.2em] text-slate-500 mb-1">
                      Suhu (°C)
                    </p>
                    <p className="text-slate-400">
                      Ambang bahaya suhu ruangan.
                    </p>
                </div>
                  <input
                    id="cfg-temp-threshold"
                    type="number"
                    min="0"
                    max="120"
                    className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-right text-[10px]"
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold uppercase tracking-[0.2em] text-slate-500 mb-1">
                      Gas (PPM)
                    </p>
                    <p className="text-slate-400">
                      Ambang bahaya konsentrasi gas.
                    </p>
                  </div>
                  <input
                    id="cfg-gas-threshold"
                    type="number"
                    min="0"
                    max="5000"
                    className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-right text-[10px]"
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold uppercase tracking-[0.2em] text-slate-500 mb-1">
                      Api
                    </p>
                    <p className="text-slate-400">
                      Nilai minimal terdeteksi api.
                    </p>
                  </div>
                  <input
                    id="cfg-flame-threshold"
                    type="number"
                    min="0"
                    max="4095"
                    className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-right text-[10px]"
                  />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => call("resetSensorConfig")}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-[10px] font-bold uppercase text-slate-500 hover:bg-slate-50"
                >
                  Reset Default
                </button>
                <button
                  onClick={() => call("saveSensorConfig")}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  Simpan Pengaturan
                </button>
              </div>
              <p
                id="cfg-status"
                className="mt-3 text-[9px] text-emerald-600 hidden"
              >
                Pengaturan berhasil disimpan.
              </p>
                </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl md:rounded-[3rem] border border-slate-200 shadow-sm flex flex-col">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em] mb-4">
                Pengaturan Sistem
              </p>
              <div className="space-y-4 text-[10px] text-slate-600">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold uppercase tracking-[0.2em] text-slate-500 mb-1">
                      Suara Alarm
                    </p>
                    <p className="text-slate-400">
                      Aktifkan / nonaktifkan bunyi alarm saat kondisi kritis.
                    </p>
                </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      id="cfg-alarm-enabled"
                      type="checkbox"
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 rounded-full peer-checked:bg-emerald-500 relative transition-colors">
                      <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
              </div>
                  </label>
        </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold uppercase tracking-[0.2em] text-slate-500 mb-1">
                      Interval Tampilan Sinkron
                    </p>
                    <p className="text-slate-400">
                      Mengatur tampilan hitung mundur pembaruan (detik).
                    </p>
      </div>
                  <input
                    id="cfg-sync-interval"
                    type="number"
                    min="5"
                    max="60"
                    className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-right text-[10px]"
                  />
                </div>
              </div>
              <p className="mt-6 text-[9px] text-slate-400 leading-relaxed">
                Semua pengaturan disimpan di cloud (Firebase) dan browser,
                sehingga perubahan threshold sensor bisa dilakukan tanpa perlu
                mengubah atau meng-compile ulang program mikrokontroler.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;