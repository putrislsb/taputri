/**
 * ============================================================
 *  ALGORITMA C4.5 — Decision Tree Classifier
 *  Implementasi lengkap dalam JavaScript
 * ============================================================
 *
 *  Fitur:
 *  - Mendukung atribut kontinu (suhu, gas, kelembapan, api)
 *  - Menghitung Entropy, Information Gain, dan Gain Ratio
 *  - Membangun pohon keputusan secara rekursif
 *  - Klasifikasi data baru + decision path
 *  - Pencatatan detail perhitungan untuk tampilan UI
 *
 *  Referensi: Quinlan, J.R. (1993). C4.5: Programs for Machine Learning.
 * ============================================================
 */

// ─── Utilitas Matematika ────────────────────────────────────

/**
 * Hitung entropy dari distribusi kelas.
 * H(S) = -Σ p_i * log2(p_i)
 * @param {number[]} classCounts - Jumlah sampel per kelas
 * @returns {number} Nilai entropy
 */
export function entropy(classCounts) {
  const total = classCounts.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  let ent = 0;
  for (const count of classCounts) {
    if (count === 0) continue;
    const p = count / total;
    ent -= p * Math.log2(p);
  }
  return ent;
}

/**
 * Hitung distribusi kelas dari dataset.
 * @param {object[]} data - Array of records
 * @param {string} classAttr - Nama kolom kelas
 * @returns {{ counts: Record<string, number>, total: number }}
 */
function classDistribution(data, classAttr) {
  const counts = {};
  for (const row of data) {
    const cls = row[classAttr];
    counts[cls] = (counts[cls] || 0) + 1;
  }
  return { counts, total: data.length };
}

/**
 * Hitung entropy dari dataset langsung.
 */
function datasetEntropy(data, classAttr) {
  const { counts } = classDistribution(data, classAttr);
  return entropy(Object.values(counts));
}

// ─── Pencarian Split Point Terbaik (Atribut Kontinu) ────────

/**
 * Cari threshold split terbaik untuk atribut kontinu.
 * Menggunakan pendekatan C4.5: sort data, cari titik potong di antara
 * dua kelas yang berbeda, hitung gain ratio untuk setiap kandidat.
 *
 * @param {object[]} data
 * @param {string} attribute
 * @param {string} classAttr
 * @returns {{ threshold: number, gain: number, gainRatio: number, splitInfo: number, infoGain: number, entropyBefore: number, entropyLeft: number, entropyRight: number, leftCount: number, rightCount: number }}
 */
function bestSplitContinuous(data, attribute, classAttr) {
  // Sort data berdasarkan atribut
  const sorted = [...data].sort((a, b) => a[attribute] - b[attribute]);
  const totalEntropy = datasetEntropy(data, classAttr);
  const n = data.length;

  let bestResult = {
    threshold: null,
    gain: -Infinity,
    gainRatio: -Infinity,
    splitInfo: 0,
    infoGain: 0,
    entropyBefore: totalEntropy,
    entropyLeft: 0,
    entropyRight: 0,
    leftCount: 0,
    rightCount: 0,
  };

  // Kumpulkan kandidat threshold (titik tengah antar nilai berbeda kelas)
  const candidates = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i][classAttr] !== sorted[i + 1][classAttr] ||
        sorted[i][attribute] !== sorted[i + 1][attribute]) {
      if (sorted[i][attribute] !== sorted[i + 1][attribute]) {
        candidates.push((sorted[i][attribute] + sorted[i + 1][attribute]) / 2);
      }
    }
  }

  // Jika tidak ada kandidat, gunakan semua titik tengah unik
  if (candidates.length === 0) {
    const uniqueVals = [...new Set(sorted.map(r => r[attribute]))];
    for (let i = 0; i < uniqueVals.length - 1; i++) {
      candidates.push((uniqueVals[i] + uniqueVals[i + 1]) / 2);
    }
  }

  for (const threshold of candidates) {
    const left = data.filter(r => r[attribute] <= threshold);
    const right = data.filter(r => r[attribute] > threshold);

    if (left.length === 0 || right.length === 0) continue;

    const entropyLeft = datasetEntropy(left, classAttr);
    const entropyRight = datasetEntropy(right, classAttr);

    // Information Gain = H(S) - Σ (|Sv|/|S|) * H(Sv)
    const weightedEntropy =
      (left.length / n) * entropyLeft +
      (right.length / n) * entropyRight;
    const infoGain = totalEntropy - weightedEntropy;

    // Split Information (untuk Gain Ratio)
    const splitInfo = entropy([left.length, right.length]);

    // Gain Ratio = Information Gain / Split Information
    const gainRatio = splitInfo === 0 ? 0 : infoGain / splitInfo;

    if (gainRatio > bestResult.gainRatio) {
      bestResult = {
        threshold,
        gain: infoGain,
        gainRatio,
        splitInfo,
        infoGain,
        entropyBefore: totalEntropy,
        entropyLeft,
        entropyRight,
        leftCount: left.length,
        rightCount: right.length,
      };
    }
  }

  return bestResult;
}

// ─── Pembuatan Pohon Keputusan ──────────────────────────────

/**
 * Buat node decision tree secara rekursif menggunakan C4.5.
 *
 * @param {object[]} data - Dataset training
 * @param {string[]} attributes - Atribut yang tersedia
 * @param {string} classAttr - Nama kolom kelas
 * @param {number} depth - Kedalaman saat ini
 * @param {number} maxDepth - Kedalaman maksimum
 * @param {number} minSamples - Minimum jumlah sampel per node
 * @returns {object} Node pohon keputusan
 */
function buildTree(data, attributes, classAttr, depth = 0, maxDepth = 10, minSamples = 2) {
  const { counts, total } = classDistribution(data, classAttr);
  const classes = Object.keys(counts);

  // Basis: semua data satu kelas
  if (classes.length === 1) {
    return {
      type: "leaf",
      class: classes[0],
      count: total,
      distribution: counts,
      depth,
    };
  }

  // Basis: kedalaman maksimal atau terlalu sedikit data
  if (depth >= maxDepth || total < minSamples || attributes.length === 0) {
    const majorityClass = classes.reduce((a, b) =>
      counts[a] >= counts[b] ? a : b
    );
    return {
      type: "leaf",
      class: majorityClass,
      count: total,
      distribution: counts,
      depth,
    };
  }

  // Cari atribut terbaik berdasarkan Gain Ratio
  let bestAttr = null;
  let bestSplit = null;
  let bestGainRatio = -Infinity;

  const splitDetails = {};

  for (const attr of attributes) {
    const split = bestSplitContinuous(data, attr, classAttr);
    splitDetails[attr] = split;

    if (split.threshold !== null && split.gainRatio > bestGainRatio) {
      bestGainRatio = split.gainRatio;
      bestAttr = attr;
      bestSplit = split;
    }
  }

  // Tidak bisa split
  if (!bestAttr || bestSplit.threshold === null) {
    const majorityClass = classes.reduce((a, b) =>
      counts[a] >= counts[b] ? a : b
    );
    return {
      type: "leaf",
      class: majorityClass,
      count: total,
      distribution: counts,
      depth,
    };
  }

  // Split data
  const leftData = data.filter(r => r[bestAttr] <= bestSplit.threshold);
  const rightData = data.filter(r => r[bestAttr] > bestSplit.threshold);

  // Bangun sub-tree secara rekursif
  const leftChild = buildTree(leftData, attributes, classAttr, depth + 1, maxDepth, minSamples);
  const rightChild = buildTree(rightData, attributes, classAttr, depth + 1, maxDepth, minSamples);

  return {
    type: "node",
    attribute: bestAttr,
    threshold: bestSplit.threshold,
    gainRatio: bestSplit.gainRatio,
    infoGain: bestSplit.infoGain,
    splitInfo: bestSplit.splitInfo,
    entropyBefore: bestSplit.entropyBefore,
    entropyLeft: bestSplit.entropyLeft,
    entropyRight: bestSplit.entropyRight,
    leftCount: bestSplit.leftCount,
    rightCount: bestSplit.rightCount,
    depth,
    distribution: counts,
    total,
    splitDetails,
    left: leftChild,   // <= threshold
    right: rightChild,  // > threshold
  };
}

// ─── Klasifikasi ────────────────────────────────────────────

/**
 * Klasifikasikan sebuah record baru dengan pohon keputusan.
 * Mengembalikan kelas dan decision path.
 *
 * @param {object} tree - Pohon keputusan
 * @param {object} record - Data baru { temp, hum, gas, flame }
 * @returns {{ class: string, path: object[], confidence: number }}
 */
export function classify(tree, record) {
  const path = [];
  let node = tree;

  while (node.type === "node") {
    const value = record[node.attribute];
    const goLeft = value <= node.threshold;

    path.push({
      attribute: node.attribute,
      threshold: node.threshold,
      value: value,
      direction: goLeft ? "≤" : ">",
      gainRatio: node.gainRatio,
      infoGain: node.infoGain,
      entropyBefore: node.entropyBefore,
    });

    node = goLeft ? node.left : node.right;
  }

  // Hitung confidence dari leaf node
  const total = Object.values(node.distribution).reduce((a, b) => a + b, 0);
  const confidence = total > 0 ? (node.distribution[node.class] / total) : 1;

  return {
    class: node.class,
    path,
    confidence,
    distribution: node.distribution,
  };
}

// ─── Konversi Tree ke Teks (untuk visualisasi) ──────────────

/**
 * Format human-readable label atribut.
 */
const ATTR_LABELS = {
  temp: "Suhu (°C)",
  hum: "Kelembapan (%)",
  gas: "Gas (PPM)",
  flame: "Api (ADC)",
};

const CLASS_LABELS = {
  AMAN: "🟢 AMAN",
  WASPADA: "🟡 WASPADA",
  BAHAYA: "🔴 BAHAYA",
};

/**
 * Konversi tree ke string teks berjenjang.
 */
export function treeToText(node, indent = 0) {
  const pad = "│  ".repeat(indent);
  const label = ATTR_LABELS[node.attribute] || node.attribute;

  if (node.type === "leaf") {
    const clsLabel = CLASS_LABELS[node.class] || node.class;
    return `${pad}└─ Kelas: ${clsLabel} (${node.count} data, ${JSON.stringify(node.distribution)})\n`;
  }

  let text = "";
  text += `${pad}┌─ ${label} ≤ ${node.threshold.toFixed(2)} ?\n`;
  text += `${pad}│  Gain Ratio: ${node.gainRatio.toFixed(4)} | Info Gain: ${node.infoGain.toFixed(4)}\n`;
  text += `${pad}├─ YA (${node.leftCount} data):\n`;
  text += treeToText(node.left, indent + 1);
  text += `${pad}├─ TIDAK (${node.rightCount} data):\n`;
  text += treeToText(node.right, indent + 1);

  return text;
}

/**
 * Konversi tree ke struktur flat untuk rendering tabel.
 */
export function treeToRules(node, conditions = []) {
  if (node.type === "leaf") {
    return [{
      conditions: [...conditions],
      class: node.class,
      count: node.count,
      distribution: node.distribution,
    }];
  }

  const label = ATTR_LABELS[node.attribute] || node.attribute;
  const leftRules = treeToRules(node.left, [
    ...conditions,
    `${label} ≤ ${node.threshold.toFixed(2)}`
  ]);
  const rightRules = treeToRules(node.right, [
    ...conditions,
    `${label} > ${node.threshold.toFixed(2)}`
  ]);

  return [...leftRules, ...rightRules];
}

// ─── API Utama ──────────────────────────────────────────────

/**
 * Inisialisasi dan train model C4.5 dari dataset.
 *
 * @param {object[]} trainingData - Array of { temp, hum, gas, flame, class }
 * @param {object} [options]
 * @param {number} [options.maxDepth=8] - Kedalaman maksimum tree
 * @param {number} [options.minSamples=2] - Minimum sampel per node
 * @returns {object} Model { tree, classify, stats, treeText, rules }
 */
export function trainC45(trainingData, options = {}) {
  const { maxDepth = 8, minSamples = 2 } = options;
  const classAttr = "class";
  const attributes = ["temp", "hum", "gas", "flame"];

  // Validasi
  if (!trainingData || trainingData.length === 0) {
    throw new Error("Dataset training kosong!");
  }

  // Hitung statistik dataset
  const { counts } = classDistribution(trainingData, classAttr);
  const totalEntropy = datasetEntropy(trainingData, classAttr);

  // Bangun pohon keputusan
  const tree = buildTree(trainingData, attributes, classAttr, 0, maxDepth, minSamples);

  // Hitung akurasi training
  let correct = 0;
  for (const row of trainingData) {
    const result = classify(tree, row);
    if (result.class === row[classAttr]) correct++;
  }
  const accuracy = correct / trainingData.length;

  // Generate teks dan rules
  const treeText = treeToText(tree);
  const rules = treeToRules(tree);

  return {
    tree,
    treeText,
    rules,
    stats: {
      totalData: trainingData.length,
      classDistribution: counts,
      totalEntropy,
      accuracy,
      maxDepth,
      treeDepth: getTreeDepth(tree),
      nodeCount: countNodes(tree),
      leafCount: countLeaves(tree),
    },
    classify: (record) => classify(tree, record),
  };
}

// ─── Utilitas Tree ──────────────────────────────────────────

function getTreeDepth(node) {
  if (node.type === "leaf") return node.depth;
  return Math.max(getTreeDepth(node.left), getTreeDepth(node.right));
}

function countNodes(node) {
  if (node.type === "leaf") return 1;
  return 1 + countNodes(node.left) + countNodes(node.right);
}

function countLeaves(node) {
  if (node.type === "leaf") return 1;
  return countLeaves(node.left) + countLeaves(node.right);
}
