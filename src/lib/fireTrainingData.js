/**
 * ============================================================
 *  DATASET TRAINING UNTUK KLASIFIKASI KEBAKARAN
 *  Digunakan oleh algoritma C4.5
 * ============================================================
 *
 *  Atribut:
 *  - temp   : Suhu ruangan dalam °C
 *  - hum    : Kelembapan relatif dalam %
 *  - gas    : Konsentrasi gas dalam PPM
 *  - flame  : Nilai ADC sensor api (0-4095; rendah = ada api, tinggi = tidak ada api)
 *
 *  Kelas:
 *  - AMAN    : Kondisi normal, tidak ada indikasi kebakaran
 *  - WASPADA : Ada indikasi awal potensi bahaya, perlu perhatian
 *  - BAHAYA  : Kondisi berbahaya, kemungkinan besar terjadi kebakaran
 *
 *  Sumber data: simulasi berdasarkan standar keselamatan dan
 *  karakteristik umum sensor DHT22, MQ-2/MQ-135, dan Flame Sensor.
 * ============================================================
 */

const TRAINING_DATA = [
  // ═══════════════════════════════════════════════════════
  //  KELAS: AMAN — Kondisi normal sehari-hari
  // ═══════════════════════════════════════════════════════
  { temp: 22, hum: 65, gas: 120, flame: 4000, class: "AMAN" },
  { temp: 24, hum: 60, gas: 150, flame: 3900, class: "AMAN" },
  { temp: 25, hum: 55, gas: 100, flame: 4050, class: "AMAN" },
  { temp: 26, hum: 58, gas: 180, flame: 3850, class: "AMAN" },
  { temp: 23, hum: 70, gas: 90, flame: 4080, class: "AMAN" },
  { temp: 27, hum: 50, gas: 200, flame: 3800, class: "AMAN" },
  { temp: 28, hum: 52, gas: 220, flame: 3750, class: "AMAN" },
  { temp: 21, hum: 68, gas: 80, flame: 4090, class: "AMAN" },
  { temp: 29, hum: 48, gas: 250, flame: 3700, class: "AMAN" },
  { temp: 30, hum: 45, gas: 280, flame: 3650, class: "AMAN" },
  { temp: 20, hum: 72, gas: 70, flame: 4095, class: "AMAN" },
  { temp: 24, hum: 63, gas: 130, flame: 3950, class: "AMAN" },
  { temp: 26, hum: 57, gas: 160, flame: 3880, class: "AMAN" },
  { temp: 31, hum: 44, gas: 300, flame: 3600, class: "AMAN" },
  { temp: 22, hum: 66, gas: 110, flame: 4010, class: "AMAN" },
  { temp: 25, hum: 59, gas: 140, flame: 3920, class: "AMAN" },
  { temp: 27, hum: 53, gas: 190, flame: 3830, class: "AMAN" },
  { temp: 23, hum: 62, gas: 105, flame: 4020, class: "AMAN" },
  { temp: 28, hum: 50, gas: 210, flame: 3780, class: "AMAN" },
  { temp: 32, hum: 42, gas: 320, flame: 3550, class: "AMAN" },
  { temp: 19, hum: 75, gas: 60, flame: 4095, class: "AMAN" },
  { temp: 33, hum: 40, gas: 350, flame: 3500, class: "AMAN" },
  { temp: 30, hum: 47, gas: 270, flame: 3680, class: "AMAN" },
  { temp: 21, hum: 69, gas: 85, flame: 4070, class: "AMAN" },
  { temp: 25, hum: 56, gas: 145, flame: 3910, class: "AMAN" },

  // ═══════════════════════════════════════════════════════
  //  KELAS: WASPADA — Potensi bahaya awal
  // ═══════════════════════════════════════════════════════
  // Suhu mulai tinggi
  { temp: 38, hum: 40, gas: 350, flame: 3400, class: "WASPADA" },
  { temp: 40, hum: 38, gas: 400, flame: 3300, class: "WASPADA" },
  { temp: 42, hum: 35, gas: 450, flame: 3200, class: "WASPADA" },
  { temp: 36, hum: 42, gas: 380, flame: 3450, class: "WASPADA" },
  { temp: 39, hum: 37, gas: 420, flame: 3350, class: "WASPADA" },
  // Gas mulai tinggi dengan suhu normal-ish
  { temp: 33, hum: 45, gas: 500, flame: 3500, class: "WASPADA" },
  { temp: 34, hum: 43, gas: 550, flame: 3400, class: "WASPADA" },
  { temp: 35, hum: 40, gas: 600, flame: 3300, class: "WASPADA" },
  { temp: 32, hum: 47, gas: 480, flame: 3550, class: "WASPADA" },
  { temp: 34, hum: 41, gas: 520, flame: 3380, class: "WASPADA" },
  // Flame sensor mulai menurun
  { temp: 35, hum: 44, gas: 300, flame: 2800, class: "WASPADA" },
  { temp: 37, hum: 39, gas: 350, flame: 2600, class: "WASPADA" },
  { temp: 36, hum: 41, gas: 330, flame: 2700, class: "WASPADA" },
  { temp: 38, hum: 36, gas: 400, flame: 2500, class: "WASPADA" },
  { temp: 34, hum: 43, gas: 310, flame: 2900, class: "WASPADA" },
  // Kombinasi campuran
  { temp: 41, hum: 33, gas: 480, flame: 2800, class: "WASPADA" },
  { temp: 37, hum: 38, gas: 550, flame: 3100, class: "WASPADA" },
  { temp: 43, hum: 30, gas: 420, flame: 3000, class: "WASPADA" },
  { temp: 39, hum: 36, gas: 460, flame: 2900, class: "WASPADA" },
  { temp: 44, hum: 32, gas: 380, flame: 2700, class: "WASPADA" },
  { temp: 35, hum: 39, gas: 650, flame: 3200, class: "WASPADA" },
  { temp: 40, hum: 34, gas: 500, flame: 2600, class: "WASPADA" },
  { temp: 36, hum: 40, gas: 580, flame: 3100, class: "WASPADA" },
  { temp: 42, hum: 31, gas: 440, flame: 2500, class: "WASPADA" },
  { temp: 38, hum: 37, gas: 530, flame: 2800, class: "WASPADA" },

  // ═══════════════════════════════════════════════════════
  //  KELAS: BAHAYA — Kondisi kebakaran / kritis
  // ═══════════════════════════════════════════════════════
  // Suhu sangat tinggi + gas tinggi + api terdeteksi
  { temp: 55, hum: 15, gas: 900, flame: 800, class: "BAHAYA" },
  { temp: 60, hum: 12, gas: 1000, flame: 500, class: "BAHAYA" },
  { temp: 65, hum: 10, gas: 1200, flame: 300, class: "BAHAYA" },
  { temp: 58, hum: 14, gas: 950, flame: 600, class: "BAHAYA" },
  { temp: 70, hum: 8, gas: 1500, flame: 200, class: "BAHAYA" },
  // Suhu sangat tinggi saja
  { temp: 52, hum: 20, gas: 700, flame: 1500, class: "BAHAYA" },
  { temp: 56, hum: 18, gas: 750, flame: 1200, class: "BAHAYA" },
  { temp: 54, hum: 19, gas: 680, flame: 1400, class: "BAHAYA" },
  { temp: 50, hum: 22, gas: 650, flame: 1600, class: "BAHAYA" },
  { temp: 53, hum: 17, gas: 720, flame: 1300, class: "BAHAYA" },
  // Gas sangat tinggi
  { temp: 45, hum: 25, gas: 850, flame: 2000, class: "BAHAYA" },
  { temp: 48, hum: 23, gas: 900, flame: 1800, class: "BAHAYA" },
  { temp: 46, hum: 24, gas: 870, flame: 1900, class: "BAHAYA" },
  { temp: 47, hum: 22, gas: 920, flame: 1700, class: "BAHAYA" },
  { temp: 49, hum: 20, gas: 950, flame: 1500, class: "BAHAYA" },
  // Api terdeteksi kuat (flame ADC sangat rendah)
  { temp: 42, hum: 28, gas: 600, flame: 400, class: "BAHAYA" },
  { temp: 40, hum: 30, gas: 550, flame: 350, class: "BAHAYA" },
  { temp: 44, hum: 26, gas: 650, flame: 500, class: "BAHAYA" },
  { temp: 43, hum: 27, gas: 620, flame: 450, class: "BAHAYA" },
  { temp: 41, hum: 29, gas: 580, flame: 380, class: "BAHAYA" },
  // Kombinasi ekstrem
  { temp: 75, hum: 5, gas: 2000, flame: 100, class: "BAHAYA" },
  { temp: 68, hum: 7, gas: 1800, flame: 150, class: "BAHAYA" },
  { temp: 62, hum: 9, gas: 1400, flame: 250, class: "BAHAYA" },
  { temp: 57, hum: 16, gas: 1100, flame: 700, class: "BAHAYA" },
  { temp: 51, hum: 21, gas: 800, flame: 1000, class: "BAHAYA" },
];

export default TRAINING_DATA;

/**
 * Mendapatkan ringkasan statistik dataset.
 */
export function getDatasetStats() {
  const stats = {
    total: TRAINING_DATA.length,
    perClass: {},
    attrRanges: {},
  };

  // Hitung per kelas
  for (const row of TRAINING_DATA) {
    stats.perClass[row.class] = (stats.perClass[row.class] || 0) + 1;
  }

  // Hitung range per atribut
  const attrs = ["temp", "hum", "gas", "flame"];
  for (const attr of attrs) {
    const values = TRAINING_DATA.map((r) => r[attr]);
    stats.attrRanges[attr] = {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1),
    };
  }

  return stats;
}
