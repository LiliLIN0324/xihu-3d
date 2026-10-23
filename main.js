/**
 * 西湖清趣 · 圆相 3D
 * Modern basemap: NORTH-UP. PlaneGeometry+rot.x=-π/2 ⇒ 纹理北在 −Z，+X=东。
 * 星点：默认收起仅辉光星；点一下/全局展开短名。双位置：morph≈0 钉圆相 Freer/FLOOR_UV；
 * morph 开钉今址 lat/lng。圆相默认 TPS morph 贴今湖。
 * Defaults (2026-10-23 定稿): explode=0, morph ON, wall off, yuan opacity≈55%,
 * places only on active segment, night basemap (default), compare mode 叠合.
 * Timeline + swipe 分割对照保留。脚注：示意对照，非测绘级。
 * 历史层默认已二次配准（1938 GCP→affine+TPS 贴今 basemap；同 warp 应用于各年）。
 * Freer UV (u:南→北, v:东→西) → north-up: nu=(1-v), nv=u
 * Warp 思路参照 Allmaps thinPlateSpline / MapWarper GCP / leaflet-distortableimage。
 * Basemaps: street=OSM HOT；satellite=Esri Imagery；night=Esri Dark Gray（非 CARTO，免 API key 水印）。
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const SEGMENTS = [
  { id: 'a', name: 'A 钱塘门区', color: '#e07a5f', gxMin: 26214, gxMax: 30583 },
  { id: 'b', name: 'B 北山·宝石山', color: '#81b29a', gxMin: 21845, gxMax: 26214 },
  { id: 'c', name: 'C 孤山·西泠·岳坟', color: '#f2cc8f', gxMin: 15291, gxMax: 21845 },
  { id: 'd', name: 'D 苏堤·南山·雷峰', color: '#3d405b', gxMin: 8738, gxMax: 15291 },
  { id: 'e', name: 'E 清波·涌金·钱塘门止', color: '#9b5de5', gxMin: 2184, gxMax: 8738 },
];

/** Curated landmarks from user export 2026-10-23 (gx authoritative for 卷上).
 * lat/lng = 今址 WGS84（可核验公开坐标）；无今址者 lat/lng 缺省，钉点回退画 UV / gx。
 * locConf: 今址置信 0–1；未标则与 conf 同或 null。
 */
const PLACES = [
  { id: 'p002', name: "钱塘门（城楼）", short: '钱塘门', gx: 29370, seg: 'a', conf: 0.9, lat: 30.2518, lng: 120.1605, locConf: 0.55 },
  { id: 'p006', name: "望湖楼", short: '望湖楼', gx: 28685, seg: 'a', conf: 0.35 },
  { id: 'p008', name: "昭庆寺", short: '昭庆寺', gx: 27190, seg: 'a', conf: 0.45, lat: 30.2602, lng: 120.1555, locConf: 0.45 },
  { id: 'p011', name: "石函桥", short: '石函桥', gx: 26706, seg: 'a', conf: 0.4 },
  { id: 'p013', name: "德生堂（含木围放生池）", short: '德生堂', gx: 25818, seg: 'b', conf: 0.6 },
  { id: 'p014', name: "金牛护法院", short: '金牛护法', gx: 25515, seg: 'b', conf: 0.4 },
  { id: 'p028', name: "断桥", short: '断桥', gx: 25409, seg: 'b', conf: 0.65, lat: 30.2609, lng: 120.1470, locConf: 0.95 },
  { id: 'u12', name: "孤山路", short: '孤山路', gx: 25089, seg: 'b', conf: null, userAdded: true, lat: 30.2585, lng: 120.1455, locConf: 0.5 },
  { id: 'p018', name: "大石佛院", short: '大石佛', gx: 24990, seg: 'b', conf: 0.97, lat: 30.2588, lng: 120.1458, locConf: 0.55 },
  { id: 'p023', name: "保叔塔", short: '保叔塔', gx: 24681, seg: 'b', conf: 0.55, lat: 30.2633, lng: 120.1434, locConf: 0.95 },
  { id: 'u10', name: "贾似道府邸", short: '贾似道府', gx: 22910, seg: 'b', conf: null, userAdded: true },
  { id: 'u9', name: "贾氏家庙", short: '贾氏家庙', gx: 22547, seg: 'b', conf: null, userAdded: true },
  { id: 'p030', name: "四面堂（孤山）", short: '孤山', gx: 20600, seg: 'c', conf: 0.2, lat: 30.2538, lng: 120.1415, locConf: 0.85 },
  { id: 'p034', name: "西泠桥", short: '西泠桥', gx: 19717, seg: 'c', conf: 0.25, lat: 30.2540, lng: 120.1339, locConf: 0.9 },
  { id: 'p033', name: "西太乙宫", short: '西太乙宫', gx: 19245, seg: 'c', conf: 0.35 },
  { id: 'u8', name: "苏公堤", short: '苏公堤', gx: 18704, seg: 'c', conf: null, userAdded: true, lat: 30.2484, lng: 120.1365, locConf: 0.7 },
  { id: 'u5', name: "赵公堤", short: '赵公堤', gx: 17882, seg: 'c', conf: null, userAdded: true, lat: 30.2505, lng: 120.1280, locConf: 0.4 },
  { id: 'u4', name: "第五桥", short: '第五桥', gx: 17685, seg: 'c', conf: null, userAdded: true },
  { id: 'p041', name: "岳王坟", short: '岳坟', gx: 17150, seg: 'c', conf: 0.35, lat: 30.2547, lng: 120.1298, locConf: 0.95 },
  { id: 'p043', name: "跨虹桥（第一桥）", short: '跨虹桥', gx: 15315, seg: 'c', conf: 0.45, lat: 30.2518, lng: 120.1368, locConf: 0.75 },
  { id: 'p045', name: "苏堤（长堤主体）", short: '苏堤', gx: 14000, seg: 'd', conf: 0.6, lat: 30.2425, lng: 120.1400, locConf: 0.85 },
  { id: 'p055', name: "雷峰塔", short: '雷峰塔', gx: 11600, seg: 'd', conf: 0.95, lat: 30.2339, lng: 120.1450, locConf: 0.95 },
  { id: 'p053', name: "净慈光孝禅寺", short: '净慈寺', gx: 11950, seg: 'd', conf: 0.7, lat: 30.2311, lng: 120.1443, locConf: 0.9 },
  { id: 'p050', name: "南屏兴教寺", short: '南屏寺', gx: 13315, seg: 'd', conf: 0.4, lat: 30.2298, lng: 120.1475, locConf: 0.45 },
  { id: 'p059', name: "钱湖门", short: '钱湖门', gx: 7650, seg: 'e', conf: 0.85, lat: 30.2368, lng: 120.1608, locConf: 0.5 },
  { id: 'u3', name: "御园", short: '御园', gx: 8688, seg: 'e', conf: null, userAdded: true },
  { id: 'u2', name: "丰乐楼", short: '丰乐楼', gx: 7513, seg: 'e', conf: null, userAdded: true, lat: 30.2455, lng: 120.1585, locConf: 0.35 },
  { id: 'p062', name: "涌金门（水门）", short: '涌金门', gx: 5670, seg: 'e', conf: 0.55, lat: 30.2498, lng: 120.1561, locConf: 0.85 },
  { id: 'u1', name: "养鱼庄", short: '养鱼庄', gx: 6510, seg: 'e', conf: null, userAdded: true },
  { id: 'p072', name: "至钱塘门止", short: '钱塘门止', gx: 2355, seg: 'e', conf: 0.85, lat: 30.2525, lng: 120.1600, locConf: 0.5 },
];

/** 今址未定或置信偏低（仅列清单，不拦渲染） */
const LOC_UNCERTAIN = PLACES.filter((p) => p.lat == null || (p.locConf != null && p.locConf < 0.6));

const FLOOR_UV = {
  p055: { u: 0.105, v: 0.48 },
  p053: { u: 0.125, v: 0.55 },
  p050: { u: 0.145, v: 0.58 },
  p059: { u: 0.22,  v: 0.10 },
  p062: { u: 0.48,  v: 0.09 },
  p002: { u: 0.78,  v: 0.10 },
  p072: { u: 0.82,  v: 0.11 },
  p023: { u: 0.90,  v: 0.56 },
  p028: { u: 0.74,  v: 0.40 },
  u12:  { u: 0.70,  v: 0.38 },
  p018: { u: 0.72,  v: 0.39 }, // 大石佛 · 近断桥/孤山路
  p030: { u: 0.68,  v: 0.58 },
  p034: { u: 0.60,  v: 0.55 },
  p043: { u: 0.58,  v: 0.50 }, // 跨虹桥 · 同 MORPH_GCP
  p045: { u: 0.42,  v: 0.52 },
  u8:   { u: 0.40,  v: 0.50 },
  u5:   { u: 0.50,  v: 0.62 },
  p041: { u: 0.55,  v: 0.68 },
  u2:   { u: 0.55,  v: 0.10 },
  u1:   { u: 0.62,  v: 0.12 },
  u10:  { u: 0.82,  v: 0.50 },
  u3:   { u: 0.28,  v: 0.12 },
  p008: { u: 0.86,  v: 0.28 }, // 昭庆寺 · 示意画位
};

const GX_PAINT_MAX = 29506;
const GX_PAINT_MIN = 2184;
const MAP_SIZE = 48;
const YUAN_NS = 18;
const YUAN_EW = YUAN_NS / 2.32;
const WALL_R = 11.5;
const WALL_H = 3.0;
const DEFAULT_YUAN_OPACITY = 0.55;
const EXPLODE_MAX = 0.40; // slider 0–40% → 0–0.4

const DEFAULT_HIST_OPACITY = 0.70;

/** Cached Sinica Hangzhou WMTS composites (same bbox as basemap-meta.json). */
const HIST_LAYERS = [
  {
    year: 'now', label: '当代', file: null,
    cite: '当代底图（OSM HOT / Esri Imagery / Esri Dark Gray）· 无历史实测层。',
  },
  {
    year: '1914', label: '1914', file: './hist-1914.jpg',
    layerId: 'Hangzhou_25K_1914', title: '杭縣城',
    cite: '1914 · 杭縣城 · 近代实测图叠合（已二次配准贴今底图）· 出处：中央研究院杭州百年歷史地圖（Hangzhou_25K_1914）',
  },
  {
    year: '1929', label: '1929', file: './hist-1929.jpg',
    layerId: 'Hangzhou_15K_1929', title: '杭州西湖全圖',
    cite: '1929 · 杭州西湖全圖 · 近代实测图叠合（已二次配准贴今底图）· 出处：中央研究院杭州百年歷史地圖（Hangzhou_15K_1929）',
  },
  {
    year: '1932', label: '1932', file: './hist-1932.jpg',
    layerId: 'Hangzhou_10K_1932', title: '杭州市近傍一萬分一地形圖',
    cite: '1932 · 杭州市近傍一萬分一地形圖 · 近代实测图叠合（已二次配准贴今底图）· 出处：中央研究院杭州百年歷史地圖（Hangzhou_10K_1932）',
  },
  {
    year: '1938', label: '1938', file: './hist-1938.jpg',
    layerId: 'Hangzhou_15K_1938', title: '杭州西湖地圖',
    cite: '1938 · 杭州西湖地圖 · 近代实测图叠合（已二次配准贴今底图）· 出处：中央研究院杭州百年歷史地圖（Hangzhou_15K_1938）',
  },
  {
    year: '1947', label: '1947', file: './hist-1947.jpg',
    layerId: 'Hangzhou_40K_1947', title: '浙江省杭州市全圖',
    cite: '1947 · 浙江省杭州市全圖 · 近代实测图叠合（已二次配准贴今底图）· 出处：中央研究院杭州百年歷史地圖（Hangzhou_40K_1947）',
  },
  {
    year: '1964', label: '1964', file: './hist-1964.jpg',
    layerId: 'airphoto_hangzhou_u2', title: '杭州舊航照影像',
    cite: '1964 · 杭州舊航照影像 · 近代实测图叠合（已二次配准贴今底图）· 出处：中央研究院杭州百年歷史地圖（airphoto_hangzhou_u2）',
  },
];
const HIST_PORTAL = 'https://gis.sinica.edu.tw/hangzhou/';

/** Freer UV → north-up UV on 圆相 plane (u:西→东, v:南→北) */
function freerToNU(fu, fv) {
  return { u: 1 - fv, v: fu };
}

function nuToYuanLocal(u, v) {
  // PlaneGeometry local (before rot.x=-π/2): +Y → world −Z after rot
  return {
    x: (u - 0.5) * YUAN_EW,
    y: (v - 0.5) * YUAN_NS,
  };
}

/** World pin on basemap: +X=东, −Z=北（与底图纹理一致） */
function mapUVToWorld(u, v, y = 0) {
  return {
    x: (u - 0.5) * MAP_SIZE,
    y,
    z: -(v - 0.5) * MAP_SIZE,
  };
}

function mapUVToLocal(u, v) {
  return {
    x: (u - 0.5) * MAP_SIZE,
    y: (v - 0.5) * MAP_SIZE,
  };
}

const BASEMAP_BBOX = { lat_n: 30.3, lat_s: 30.2, lon_w: 120.08, lon_e: 120.2 };

function lngLatToMapUV(lng, lat) {
  return {
    u: (lng - BASEMAP_BBOX.lon_w) / (BASEMAP_BBOX.lon_e - BASEMAP_BBOX.lon_w),
    v: (lat - BASEMAP_BBOX.lat_s) / (BASEMAP_BBOX.lat_n - BASEMAP_BBOX.lat_s),
  };
}

function lngLatToWorld(lng, lat, y = 0) {
  const m = lngLatToMapUV(lng, lat);
  return mapUVToWorld(m.u, m.v, y);
}

/** Schematic (unwarped) world for Freer UV — labels only when morph off / no今址 */
function freerToWorld(fu, fv, y = 0) {
  const nu = freerToNU(fu, fv);
  // Match mesh after rot: world z = −localY
  return {
    x: (nu.u - 0.5) * YUAN_EW,
    y,
    z: -(nu.v - 0.5) * YUAN_NS,
  };
}

/** 缺 FLOOR_UV 时：用 gx 角向估圆相环位（示意，标 pending，不瞎猜景点） */
function gxEstimateYuanWorld(gx, y = 0) {
  const a = alphaFromGx(gx);
  const r = Math.min(YUAN_EW, YUAN_NS) * 0.38;
  return { x: r * Math.cos(a), y, z: -r * Math.sin(a) };
}

function gxToU(gx) {
  const g = Math.min(GX_PAINT_MAX, Math.max(GX_PAINT_MIN, gx));
  return (g - GX_PAINT_MIN) / (GX_PAINT_MAX - GX_PAINT_MIN);
}

/** α=0 at 东(+X), CCW toward 北(−Z) when viewed from above (basemap frame) */
function alphaFromGx(gx) {
  return (1 - gxToU(gx)) * Math.PI * 2;
}

function posOnRing(gx, radius) {
  const a = alphaFromGx(gx);
  // +X east, −Z north: α=0 → +X; α=π/2 → −Z
  return { a, x: radius * Math.cos(a), z: -radius * Math.sin(a) };
}

/**
 * GCP: 画上 Freer UV (su,sv) ↔ 今 lat/lng。
 * 角点锚定圆相画幅大致落在西湖盆地；名胜用可核验今址。
 * 变换：Freer UV → map UV，再投影到世界（同 basemap）。
 */
const MORPH_GCPS = [
  // 画幅角点 → 西湖盆地外包（示意）
  { id: 'corner-se', su: 0.02, sv: 0.02, lat: 30.226, lng: 120.163 },
  { id: 'corner-sw', su: 0.02, sv: 0.98, lat: 30.226, lng: 120.126 },
  { id: 'corner-ne', su: 0.98, sv: 0.02, lat: 30.268, lng: 120.162 },
  { id: 'corner-nw', su: 0.98, sv: 0.98, lat: 30.268, lng: 120.124 },
  // 名胜（FLOOR_UV × 今址）
  { id: 'p055', su: 0.105, sv: 0.48, lat: 30.2339, lng: 120.1450 }, // 雷峰塔
  { id: 'p053', su: 0.125, sv: 0.55, lat: 30.2311, lng: 120.1443 }, // 净慈
  { id: 'p023', su: 0.90, sv: 0.56, lat: 30.2633, lng: 120.1434 }, // 保俶塔
  { id: 'p028', su: 0.74, sv: 0.40, lat: 30.2609, lng: 120.1470 }, // 断桥
  { id: 'p030', su: 0.68, sv: 0.58, lat: 30.2538, lng: 120.1415 }, // 孤山
  { id: 'p034', su: 0.60, sv: 0.55, lat: 30.2540, lng: 120.1339 }, // 西泠桥
  { id: 'p041', su: 0.55, sv: 0.68, lat: 30.2547, lng: 120.1298 }, // 岳坟
  { id: 'p045', su: 0.42, sv: 0.52, lat: 30.2425, lng: 120.1400 }, // 苏堤
  { id: 'p002', su: 0.78, sv: 0.10, lat: 30.2518, lng: 120.1605 }, // 钱塘门
  { id: 'p062', su: 0.48, sv: 0.09, lat: 30.2498, lng: 120.1561 }, // 涌金门
  { id: 'p059', su: 0.22, sv: 0.10, lat: 30.2368, lng: 120.1608 }, // 钱湖门
  { id: 'p043', su: 0.58, sv: 0.50, lat: 30.2518, lng: 120.1368 }, // 跨虹桥
];

function tpsKernel(r2) {
  if (r2 < 1e-12) return 0;
  return r2 * Math.log(r2);
}

/** Fit TPS (affine + radial) Freer UV → map UV. Exact at GCPs. */
function fitTpsFreerToMap(gcps) {
  const n = gcps.length;
  const src = gcps.map((g) => ({ x: g.su, y: g.sv }));
  const dst = gcps.map((g) => {
    const m = lngLatToMapUV(g.lng, g.lat);
    return { x: m.u, y: m.v };
  });
  const m = n + 3;
  // Build L matrix (n+3)×(n+3)
  const L = Array.from({ length: m }, () => new Float64Array(m));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const dx = src[i].x - src[j].x;
      const dy = src[i].y - src[j].y;
      const K = tpsKernel(dx * dx + dy * dy);
      L[i][j] = K;
      L[j][i] = K;
    }
    L[i][n] = 1;
    L[i][n + 1] = src[i].x;
    L[i][n + 2] = src[i].y;
    L[n][i] = 1;
    L[n + 1][i] = src[i].x;
    L[n + 2][i] = src[i].y;
  }
  function solve(rhs) {
    // Gaussian elimination with partial pivot
    const A = L.map((row) => Float64Array.from(row));
    const b = Float64Array.from(rhs);
    for (let col = 0; col < m; col++) {
      let piv = col;
      for (let r = col + 1; r < m; r++) {
        if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
      }
      if (Math.abs(A[piv][col]) < 1e-14) continue;
      if (piv !== col) {
        const tmp = A[col]; A[col] = A[piv]; A[piv] = tmp;
        const tb = b[col]; b[col] = b[piv]; b[piv] = tb;
      }
      const div = A[col][col];
      for (let c = col; c < m; c++) A[col][c] /= div;
      b[col] /= div;
      for (let r = 0; r < m; r++) {
        if (r === col) continue;
        const f = A[r][col];
        if (f === 0) continue;
        for (let c = col; c < m; c++) A[r][c] -= f * A[col][c];
        b[r] -= f * b[col];
      }
    }
    return b;
  }
  const rhsX = new Float64Array(m);
  const rhsY = new Float64Array(m);
  for (let i = 0; i < n; i++) {
    rhsX[i] = dst[i].x;
    rhsY[i] = dst[i].y;
  }
  const wx = solve(rhsX);
  const wy = solve(rhsY);
  const wX = wx.slice(0, n);
  const wY = wy.slice(0, n);
  const aX = [wx[n], wx[n + 1], wx[n + 2]];
  const aY = [wy[n], wy[n + 1], wy[n + 2]];
  return function warp(fu, fv) {
    let x = aX[0] + aX[1] * fu + aX[2] * fv;
    let y = aY[0] + aY[1] * fu + aY[2] * fv;
    for (let i = 0; i < n; i++) {
      const dx = fu - src[i].x;
      const dy = fv - src[i].y;
      const K = tpsKernel(dx * dx + dy * dy);
      x += wX[i] * K;
      y += wY[i] * K;
    }
    return { u: x, v: y };
  };
}

const warpFreerToMapUV = fitTpsFreerToMap(MORPH_GCPS);

const canvas = document.getElementById('c');
const loadingEl = document.getElementById('loading');
const statusEl = document.getElementById('status');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = false;

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
Object.assign(labelRenderer.domElement.style, {
  position: 'absolute', inset: '0', pointerEvents: 'none', zIndex: '5',
});
document.body.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e1014);
scene.fog = new THREE.Fog(0x0e1014, 55, 95);

const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 200);
camera.position.set(-14, 18, -16);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.target.set(0, 1.2, 0);
controls.minDistance = 8;
controls.maxDistance = 70;
controls.minPolarAngle = 0.12;
controls.maxPolarAngle = Math.PI * 0.48;

const amb = new THREE.AmbientLight(0xfff6ea, 0.55);
scene.add(amb);
const sun = new THREE.DirectionalLight(0xffe6c8, 1.05);
sun.position.set(12, 28, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 2;
sun.shadow.camera.far = 80;
sun.shadow.camera.left = -30;
sun.shadow.camera.right = 30;
sun.shadow.camera.top = 30;
sun.shadow.camera.bottom = -30;
scene.add(sun);
const fill = new THREE.DirectionalLight(0x88aadd, 0.35);
fill.position.set(-10, 12, -8);
scene.add(fill);
const hemi = new THREE.HemisphereLight(0x9bb8ff, 0x1a1814, 0.25);
scene.add(hemi);

const placesGroup = new THREE.Group();
scene.add(placesGroup);
const yuanGroup = new THREE.Group();
scene.add(yuanGroup);
const wallGroup = new THREE.Group();
wallGroup.visible = false; // default: 环壁关
scene.add(wallGroup);

let basemapMesh = null;
let histMesh = null;
let yuanxiangMesh = null;
let shadowCatcher = null;
let highlightMesh = null;
let highlightUntil = 0;
let activeLabelEl = null;
let statusTimer = 0;
let placeLabelObjs = []; // { obj, dot, el, seg, fu, fv, baseY }
let morphBasePositions = null;
let morphLocalUV = null;
let morphAmount = 1; // default: 配准开
let morphTarget = 1;
let explodeAmount = 0;
let explodeTarget = 0;
let yuanOpacity = DEFAULT_YUAN_OPACITY;
let yuanxiangVisible = true;
let placesVisible = true;
let namesExpanded = false; // 默认收起：只留星点；全局/单击展开短名
let compareMode = 'overlay'; // overlay | modern | yuanxiang | swipe
let activeSeg = 'c'; // single-select; 'all' = faint legend
const basemapTextures = {};
let currentStyle = 'night';
const histTextures = {};
let currentHistYear = 'now';
let histOpacity = DEFAULT_HIST_OPACITY;
let swipeRatio = 0.5; // 0=all hist, 1=all modern (line at ratio*width from left)
let swipeDragging = false;
let swipeSavedHistOpacity = DEFAULT_HIST_OPACITY;

let wallTintBands = []; // Mesh[] for A–E tint opacity
let wallSegSprites = [];

const STYLE_FILES = {
  street: './basemap-street.jpg',
  satellite: './basemap-satellite.jpg',
  night: './basemap-night.jpg',
};

function showStatus(text) {
  statusEl.textContent = text;
  statusEl.classList.add('show');
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => statusEl.classList.remove('show'), 2600);
}

function loadTextureFromUrl(url) {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(url, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      resolve(tex);
    }, undefined, reject);
  });
}

async function loadTex(url, b64Name, b64Url) {
  try {
    return await loadTextureFromUrl(url);
  } catch (e) {
    if (!b64Name) throw e;
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = b64Url; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const tex = new THREE.Texture(img);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        resolve(tex);
      };
      img.onerror = reject;
      img.src = 'data:image/jpeg;base64,' + window[b64Name];
    });
  }
}

function makeTextSprite(text, x, y, z, color, scale = 1) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.font = 'bold 36px "Songti SC","Noto Serif SC",serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,.7)';
  ctx.shadowBlur = 6;
  ctx.fillText(text, 64, 32);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.85 }));
  spr.position.set(x, y, z);
  spr.scale.set(1.1 * scale, 0.55 * scale, 1);
  return spr;
}

function buildBasemap(tex) {
  if (basemapMesh) {
    basemapMesh.material.map = tex;
    basemapMesh.material.needsUpdate = true;
    return;
  }
  const geo = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE);
  // Unlit so dark/night basemaps stay readable (Standard + low amb crushed CARTO/Esri dark)
  const mat = new THREE.MeshBasicMaterial({ map: tex });
  basemapMesh = new THREE.Mesh(geo, mat);
  basemapMesh.rotation.x = -Math.PI / 2;
  basemapMesh.receiveShadow = true;
  scene.add(basemapMesh);

  shadowCatcher = new THREE.Mesh(
    new THREE.CircleGeometry(MAP_SIZE * 0.55, 64),
    new THREE.ShadowMaterial({ opacity: 0.35 })
  );
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = -0.02;
  shadowCatcher.receiveShadow = true;
  scene.add(shadowCatcher);
}


function buildHistLayer(tex) {
  if (histMesh) {
    histMesh.material.map = tex;
    histMesh.material.opacity = histOpacity;
    histMesh.material.needsUpdate = true;
    histMesh.visible = true;
    return;
  }
  const geo = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: histOpacity,
    depthWrite: false,
  });
  histMesh = new THREE.Mesh(geo, mat);
  histMesh.rotation.x = -Math.PI / 2;
  histMesh.position.y = 0.03;
  histMesh.receiveShadow = true;
  histMesh.renderOrder = 1;
  scene.add(histMesh);
}

function setHistOpacity(op) {
  histOpacity = op;
  if (histMesh) histMesh.material.opacity = op;
  const el = document.getElementById('hist-opacity-val');
  if (el) el.textContent = `${Math.round(op * 100)}%`;
}

function updateHistCite(layer) {
  const el = document.getElementById('hist-cite');
  const foot = document.getElementById('footnote');
  if (!el) return;
  if (!layer || layer.year === 'now') {
    el.classList.add('idle');
    el.innerHTML = '选年份叠合近代实测图（<a href="' + HIST_PORTAL + '" target="_blank" rel="noopener">中研院杭州百年歷史地圖</a>）；与圆相绘画区分。';
    if (foot) foot.textContent = '示意对照，非测绘级 · 星·收起/展开；不扭曲时钉圆相，扭曲时钉今址；历史层未启用。';
  } else {
    el.classList.remove('idle');
    el.innerHTML = layer.cite + ' · <a href="' + HIST_PORTAL + '" target="_blank" rel="noopener">出处门户</a> · 已二次配准贴今湖（示意，非测绘级）。';
    if (foot) foot.textContent = `近代实测图叠合（${layer.year} · ${layer.title} · 中研院）+ 圆相绘画 · 已二次配准贴今湖（示意，非测绘级）。`;
  }
}

async function setHistYear(year) {
  const layer = HIST_LAYERS.find((l) => l.year === year) || HIST_LAYERS[0];
  currentHistYear = layer.year;
  document.querySelectorAll('#tl-years .yr').forEach((b) => {
    b.classList.toggle('on', b.dataset.year === layer.year);
  });
  const opWrap = document.getElementById('hist-opacity-wrap');
  updateHistCite(layer);

  if (layer.year === 'now' || !layer.file) {
    if (histMesh) histMesh.visible = false;
    if (opWrap) opWrap.classList.remove('show');
    if (compareMode === 'swipe') applyCompareMode('overlay');
    else syncSwipeUi();
    showStatus('当代底图');
    return;
  }

  if (opWrap) opWrap.classList.add('show');
  // Keep modern basemap under hist (except pure yuanxiang mode)
  if (compareMode === 'yuanxiang') {
    // still load but hide until user leaves yuanxiang-only
    if (histMesh) histMesh.visible = false;
  }
  try {
    if (!histTextures[layer.year]) {
      showStatus(`加载 ${layer.year} 历史图…`);
      histTextures[layer.year] = await loadTextureFromUrl(layer.file);
    }
    buildHistLayer(histTextures[layer.year]);
    if (compareMode === 'yuanxiang') histMesh.visible = false;
    else histMesh.visible = true;
    if (compareMode === 'swipe') {
      if (opWrap) opWrap.classList.remove('show');
    }
    syncSwipeUi();
    showStatus(`${layer.year} · ${layer.title}`);
  } catch (e) {
    console.warn('hist', e);
    showStatus(`${layer.year} 历史图加载失败`);
    if (histMesh) histMesh.visible = false;
  }
}

function buildYuanxiang(floorTex) {
  const geo = new THREE.PlaneGeometry(YUAN_EW, YUAN_NS, 48, 64);
  floorTex.wrapS = floorTex.wrapT = THREE.ClampToEdgeWrapping;
  floorTex.center.set(0.5, 0.5);
  floorTex.rotation = Math.PI / 2;
  const mat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.88,
    metalness: 0.04,
    transparent: true,
    opacity: yuanOpacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  yuanxiangMesh = new THREE.Mesh(geo, mat);
  yuanxiangMesh.rotation.x = -Math.PI / 2;
  yuanxiangMesh.position.y = 0.06;
  yuanxiangMesh.castShadow = false;
  yuanxiangMesh.receiveShadow = true;
  yuanGroup.add(yuanxiangMesh);

  morphBasePositions = Float32Array.from(geo.attributes.position.array);
  const uv = geo.attributes.uv;
  morphLocalUV = new Float32Array(uv.count * 2);
  for (let i = 0; i < uv.count; i++) {
    morphLocalUV[i * 2] = uv.getX(i);
    morphLocalUV[i * 2 + 1] = uv.getY(i);
  }
  // No large NESW thr sprites — corner compass HUD only
}

function setYuanOpacity(op) {
  yuanOpacity = op;
  if (yuanxiangMesh) {
    // Morph slightly darkens; base is user slider
    const morphDim = 0.25 * morphAmount;
    yuanxiangMesh.material.opacity = Math.max(0.08, op * (1 - morphDim));
  }
  const el = document.getElementById('yuan-opacity-val');
  if (el) el.textContent = `${Math.round(op * 100)}%`;
}

function applyMorph(amount) {
  if (!yuanxiangMesh || !morphBasePositions || !morphLocalUV) return;
  morphAmount = amount;
  const pos = yuanxiangMesh.geometry.attributes.position;
  const arr = pos.array;
  for (let i = 0, vi = 0; i < arr.length; i += 3, vi += 2) {
    const lu = morphLocalUV[vi];
    const lv = morphLocalUV[vi + 1];
    // Plane UV → Freer UV (inverse of freerToNU with texture north-up)
    const fu0 = lv;
    const fv0 = 1 - lu;
    const base = nuToYuanLocal(lu, lv); // schematic local
    const mapped = warpFreerToMapUV(fu0, fv0);
    const tgt = mapUVToLocal(mapped.u, mapped.v);
    arr[i] = base.x + (tgt.x - base.x) * amount;
    arr[i + 1] = base.y + (tgt.y - base.y) * amount;
    arr[i + 2] = morphBasePositions[i + 2];
  }
  pos.needsUpdate = true;
  yuanxiangMesh.geometry.computeVertexNormals();
  setYuanOpacity(yuanOpacity);
  layoutPlacePins(amount);
}

function layoutPlacePins(amount) {
  const a = amount == null ? morphAmount : amount;
  for (const L of placeLabelObjs) {
    // morph≈0 → 圆相 Freer/FLOOR_UV（画上正确位置）；morph 开 → 今址
    let sx, sz, tx, tz;
    if (L.fu != null) {
      const sw = freerToWorld(L.fu, L.fv, L.baseY);
      sx = sw.x; sz = sw.z;
    } else if (L.estX != null) {
      sx = L.estX; sz = L.estZ;
    } else {
      sx = null; sz = null;
    }
    if (L.lat != null && L.lng != null) {
      const w = lngLatToWorld(L.lng, L.lat, L.baseY);
      tx = w.x; tz = w.z;
    } else if (L.fu != null) {
      const mapped = warpFreerToMapUV(L.fu, L.fv);
      const tw = mapUVToWorld(mapped.u, mapped.v, L.baseY);
      tx = tw.x; tz = tw.z;
    } else if (L.estX != null) {
      tx = L.estX; tz = L.estZ;
    } else {
      continue;
    }
    if (sx == null) { sx = tx; sz = tz; }
    const x = sx + (tx - sx) * a;
    const z = sz + (tz - sz) * a;
    L.obj.position.set(x, L.baseY, z);
    if (L.dot) L.dot.position.set(x, 0.06, z);
    if (L.glow) L.glow.position.set(x, 0.06, z);
    L._wx = x; L._wz = z;
  }
}

function applyExplode(t) {
  explodeAmount = t;
  if (basemapMesh) basemapMesh.position.y = 0;
  // Hist sits between basemap and yuan; rises a little when explaining
  if (histMesh) {
    histMesh.position.y = 0.03 + t * 1.1;
    histMesh.scale.setScalar(1 + t * 0.015);
  }
  // Labels stick to yuan layer when explode≈0; rise together when explaining
  yuanGroup.position.y = t * 2.4;
  yuanGroup.scale.setScalar(1 + t * 0.03);
  placesGroup.position.y = t * 2.4; // same as yuan → stick to active layer
  wallGroup.position.y = t * 1.2;
  wallGroup.scale.setScalar(1 + t * 0.04);
  if (shadowCatcher) shadowCatcher.material.opacity = 0.35 * (1 - t * 0.5);
}

function buildWall(scrollTex) {
  scrollTex.wrapS = THREE.RepeatWrapping;
  scrollTex.wrapT = THREE.ClampToEdgeWrapping;
  scrollTex.repeat.x = -1;
  scrollTex.offset.x = 1;
  const geo = new THREE.CylinderGeometry(WALL_R, WALL_R, WALL_H, 96, 1, true);
  const mat = new THREE.MeshStandardMaterial({
    map: scrollTex, side: THREE.BackSide, roughness: 0.85, metalness: 0,
    transparent: true, opacity: 0.92,
  });
  const wall = new THREE.Mesh(geo, mat);
  wall.position.y = WALL_H * 0.5 + 0.05;
  wall.rotation.y = -Math.PI / 2;
  wallGroup.add(wall);

  wallTintBands = [];
  wallSegSprites = [];
  for (const seg of SEGMENTS) {
    const a0 = alphaFromGx(Math.min(seg.gxMax, GX_PAINT_MAX));
    const a1 = alphaFromGx(Math.max(seg.gxMin, GX_PAINT_MIN));
    const band = makeTintBand(a0, a1, seg.color);
    band.userData.segId = seg.id;
    wallGroup.add(band);
    wallTintBands.push(band);
    const amid = (a0 + a1) / 2;
    const sr = WALL_R * 0.9;
    const spr = makeTextSprite(
      seg.id.toUpperCase(),
      sr * Math.cos(amid), WALL_H * 0.95, -sr * Math.sin(amid),
      seg.color, 0.85
    );
    spr.userData.segId = seg.id;
    wallGroup.add(spr);
    wallSegSprites.push(spr);
  }

  const hGeo = new THREE.PlaneGeometry(0.5, WALL_H * 0.9);
  highlightMesh = new THREE.Mesh(hGeo, new THREE.MeshBasicMaterial({
    color: 0xfff1a8, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false,
  }));
  highlightMesh.visible = false;
  wallGroup.add(highlightMesh);
}

function makeTintBand(a0, a1, color) {
  const r = WALL_R - 0.05;
  const segs = Math.max(8, Math.ceil(Math.abs(a1 - a0) / (Math.PI / 48)));
  const positions = [], indices = [];
  for (let i = 0; i <= segs; i++) {
    const a = a0 + (a1 - a0) * (i / segs);
    const x = r * Math.cos(a), z = -r * Math.sin(a);
    positions.push(x, 0.08, z, x, WALL_H + 0.08, z);
  }
  for (let i = 0; i < segs; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false,
  }));
}

function flashHighlight(gx, colorHex) {
  if (!highlightMesh || !wallGroup.visible) return;
  const p = posOnRing(gx, WALL_R - 0.1);
  highlightMesh.position.set(p.x, WALL_H * 0.5, p.z);
  highlightMesh.lookAt(0, highlightMesh.position.y, 0);
  highlightMesh.material.color.set(colorHex || '#fff1a8');
  highlightMesh.material.opacity = 0.85;
  highlightMesh.visible = true;
  highlightUntil = performance.now() + 2200;
}

function makePlaceLabels() {
  placeLabelObjs = [];
  while (placesGroup.children.length) placesGroup.remove(placesGroup.children[0]);
  const bySeg = {};
  for (const pl of PLACES) {
    (bySeg[pl.seg] = bySeg[pl.seg] || []).push(pl);
  }
  for (const pl of PLACES) {
    const sibs = bySeg[pl.seg];
    const idx = sibs.indexOf(pl);
    const n = sibs.length;
    let fu = null, fv = null;
    let estX = null, estZ = null;
    const hasNow = pl.lat != null && pl.lng != null;
    const hasPaintUV = !!FLOOR_UV[pl.id];
    if (hasPaintUV) {
      fu = FLOOR_UV[pl.id].u;
      fv = FLOOR_UV[pl.id].v;
    } else {
      // 缺画 UV：gx 环估圆相位（待定），卷上 gx 仍权威
      const ew = gxEstimateYuanWorld(pl.gx, 0.2);
      estX = ew.x; estZ = ew.z;
    }
    const segColor = SEGMENTS.find((s) => s.id === pl.seg).color;
    const pinNote = hasNow
      ? `今址 ${pl.lat.toFixed(4)},${pl.lng.toFixed(4)}`
      : (hasPaintUV ? '画UV' : 'gx环估·待定画位');
    const paintNote = hasPaintUV ? ' · 圆相位有 UV' : ' · 圆相位待定(gx估)';
    const lc = pl.locConf != null ? ` · loc ${pl.locConf}` : '';

    const el = document.createElement('div');
    el.className = 'place-label' + (hasPaintUV ? '' : ' pending-uv');
    el.dataset.seg = pl.seg;
    el.dataset.id = pl.id;
    el.title = `${pl.name} · ${pl.seg.toUpperCase()} · gx ${pl.gx} · ${pinNote}${paintNote}${lc}`;
    el.innerHTML =
      `<span class="star" aria-hidden="true"></span>` +
      `<span class="nm">${pl.short}</span>` +
      `<span class="badge">${pl.seg.toUpperCase()}</span>`;
    el.addEventListener('pointerdown', (ev) => {
      ev.stopPropagation(); ev.preventDefault();
      // 单击：展开该星名（若全局已展开则保持），并聚焦
      if (!namesExpanded) {
        el.classList.toggle('expanded');
      } else {
        el.classList.add('expanded');
      }
      focusPlace(pl, el);
    });
    const obj = new CSS2DObject(el);
    obj.position.set(0, 0.2, 0);
    placesGroup.add(obj);

    // 3D 星核 + 外晕（辉光）
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 12, 12),
      new THREE.MeshBasicMaterial({
        color: segColor,
        transparent: true,
        opacity: 1,
        depthWrite: false,
      })
    );
    placesGroup.add(dot);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 12, 12),
      new THREE.MeshBasicMaterial({
        color: segColor,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    placesGroup.add(glow);

    placeLabelObjs.push({
      obj, dot, glow, el, seg: pl.seg, pl,
      fu, fv,
      estX, estZ,
      lat: hasNow ? pl.lat : null,
      lng: hasNow ? pl.lng : null,
      hasPaintUV,
      baseY: 0.22,
    });
  }
  applyNamesExpanded(namesExpanded);
  layoutPlacePins(morphAmount);
  applySegmentFilter();
}

function applyNamesExpanded(on) {
  namesExpanded = !!on;
  labelRenderer.domElement.classList.toggle('labels-expanded', namesExpanded);
  for (const L of placeLabelObjs) {
    if (namesExpanded) L.el.classList.add('expanded');
    else L.el.classList.remove('expanded');
  }
  const btn = document.getElementById('btn-names');
  if (btn) {
    btn.classList.toggle('on', namesExpanded);
    btn.textContent = '星名';
    btn.title = namesExpanded ? '星名已展开（再点收起）' : '全局展开/收起短名（默认收起）';
  }
}

function applySegmentFilter() {
  const allFaint = activeSeg === 'all';
  for (const L of placeLabelObjs) {
    const active = allFaint || L.seg === activeSeg;
    if (allFaint) {
      L.el.classList.add('dim');
      L.el.style.display = '';
      if (L.dot) { L.dot.visible = true; L.dot.material.opacity = 0.22; }
      if (L.glow) { L.glow.visible = true; L.glow.material.opacity = 0.12; }
    } else if (active) {
      L.el.classList.remove('dim');
      L.el.style.display = '';
      if (L.dot) { L.dot.visible = true; L.dot.material.opacity = 1; }
      if (L.glow) { L.glow.visible = true; L.glow.material.opacity = 0.35; }
    } else {
      L.el.classList.remove('dim');
      L.el.style.display = 'none';
      if (L.dot) L.dot.visible = false;
      if (L.glow) L.glow.visible = false;
    }
  }
  for (const band of wallTintBands) {
    const id = band.userData.segId;
    if (allFaint) {
      band.material.opacity = 0.06;
      band.visible = true;
    } else {
      band.visible = id === activeSeg;
      band.material.opacity = id === activeSeg ? 0.22 : 0;
    }
  }
  for (const spr of wallSegSprites) {
    const id = spr.userData.segId;
    if (allFaint) {
      spr.visible = true;
      spr.material.opacity = 0.35;
    } else {
      spr.visible = id === activeSeg;
      spr.material.opacity = id === activeSeg ? 0.9 : 0;
    }
  }
}


function syncSwipeUi() {
  const ui = document.getElementById('swipe-ui');
  const line = document.getElementById('swipe-line');
  const btn = document.getElementById('btn-swipe');
  const histReady = currentHistYear !== 'now';
  if (btn) {
    btn.disabled = !histReady;
    btn.title = histReady ? '左右分割：左今右古（示意）' : '先选历史年份';
  }
  const on = compareMode === 'swipe' && histReady;
  if (ui) {
    ui.classList.toggle('on', on);
    ui.setAttribute('aria-hidden', on ? 'false' : 'true');
  }
  if (line) line.style.left = `${swipeRatio * 100}%`;
}

function setSwipeRatio(r) {
  swipeRatio = Math.min(0.92, Math.max(0.08, r));
  const line = document.getElementById('swipe-line');
  if (line) line.style.left = `${swipeRatio * 100}%`;
}

function bindSwipeHandle() {
  const handle = document.getElementById('swipe-handle');
  if (!handle || handle.dataset.bound) return;
  handle.dataset.bound = '1';
  const onMove = (clientX) => {
    if (!swipeDragging) return;
    setSwipeRatio(clientX / Math.max(1, innerWidth));
  };
  const stop = () => {
    if (!swipeDragging) return;
    swipeDragging = false;
    controls.enabled = true;
  };
  handle.addEventListener('pointerdown', (ev) => {
    if (compareMode !== 'swipe') return;
    ev.preventDefault();
    ev.stopPropagation();
    swipeDragging = true;
    controls.enabled = false;
    try { handle.setPointerCapture(ev.pointerId); } catch (_) {}
    onMove(ev.clientX);
  });
  handle.addEventListener('pointermove', (ev) => {
    if (!swipeDragging) return;
    ev.preventDefault();
    onMove(ev.clientX);
  });
  handle.addEventListener('pointerup', stop);
  handle.addEventListener('pointercancel', stop);
  // Also allow dragging from the line area via document when captured
  window.addEventListener('pointerup', stop);
}

function renderSwipeFrame() {
  const w = innerWidth;
  const h = innerHeight;
  const split = Math.round(w * swipeRatio);
  const histOn = currentHistYear !== 'now' && !!histMesh;

  // Both sides keep yuanxiang / places / wall as currently set.
  // Left = modern basemap; right = historical (full opacity).
  const prevHistOp = histMesh ? histMesh.material.opacity : 1;
  const prevHistVis = histMesh ? histMesh.visible : false;
  const prevBaseVis = basemapMesh ? basemapMesh.visible : false;

  renderer.setScissorTest(true);
  renderer.setViewport(0, 0, w, h);

  // Left: modern
  if (basemapMesh) basemapMesh.visible = true;
  if (histMesh) histMesh.visible = false;
  renderer.setScissor(0, 0, Math.max(1, split), h);
  renderer.render(scene, camera);

  // Right: hist
  if (basemapMesh) basemapMesh.visible = false;
  if (histMesh && histOn) {
    histMesh.visible = true;
    histMesh.material.opacity = 1;
  }
  renderer.setScissor(split, 0, Math.max(1, w - split), h);
  renderer.render(scene, camera);

  renderer.setScissorTest(false);

  // restore for next state queries / non-swipe path
  if (basemapMesh) basemapMesh.visible = prevBaseVis;
  if (histMesh) {
    histMesh.visible = prevHistVis;
    histMesh.material.opacity = prevHistOp;
  }
}

function applyCompareMode(mode) {
  if (mode === 'swipe' && currentHistYear === 'now') {
    showStatus('请先选历史年份再分割对照');
    syncSwipeUi();
    return;
  }
  // Leaving swipe: restore hist opacity slider value
  if (compareMode === 'swipe' && mode !== 'swipe' && histMesh) {
    histMesh.material.opacity = histOpacity;
  }
  compareMode = mode;
  document.querySelectorAll('#compare-modes .mode').forEach((b) => {
    b.classList.toggle('on', b.dataset.mode === mode);
  });
  const swipeBtn = document.getElementById('btn-swipe');
  if (swipeBtn) swipeBtn.classList.toggle('on', mode === 'swipe');
  const opacityWrap = document.getElementById('opacity-wrap');
  const histOpWrap = document.getElementById('hist-opacity-wrap');
  const histOn = currentHistYear !== 'now' && !!histMesh;
  if (mode === 'overlay') {
    if (basemapMesh) basemapMesh.visible = true;
    if (histMesh) {
      histMesh.visible = histOn;
      histMesh.material.opacity = histOpacity;
    }
    yuanxiangVisible = true;
    yuanGroup.visible = true;
    document.getElementById('btn-yuanxiang').classList.add('on');
    document.getElementById('btn-yuanxiang').textContent = '圆相';
    document.getElementById('btn-yuanxiang').title = '显示/隐藏圆相层';
    setYuanOpacity(yuanOpacity);
    if (opacityWrap) opacityWrap.style.display = '';
    if (histOpWrap && histOn) histOpWrap.classList.add('show');
  } else if (mode === 'modern') {
    if (basemapMesh) basemapMesh.visible = true;
    if (histMesh) {
      histMesh.visible = histOn;
      histMesh.material.opacity = histOpacity;
    }
    yuanxiangVisible = false;
    yuanGroup.visible = false;
    document.getElementById('btn-yuanxiang').classList.remove('on');
    document.getElementById('btn-yuanxiang').textContent = '圆相';
    document.getElementById('btn-yuanxiang').title = '圆相已隐（点此或回叠合）';
    if (opacityWrap) opacityWrap.style.display = 'none';
    if (histOpWrap && histOn) histOpWrap.classList.add('show');
  } else if (mode === 'yuanxiang') {
    if (basemapMesh) basemapMesh.visible = false;
    if (histMesh) histMesh.visible = false;
    yuanxiangVisible = true;
    yuanGroup.visible = true;
    document.getElementById('btn-yuanxiang').classList.add('on');
    document.getElementById('btn-yuanxiang').textContent = '圆相';
    setYuanOpacity(Math.max(yuanOpacity, 0.85));
    if (opacityWrap) opacityWrap.style.display = 'none';
  } else if (mode === 'swipe') {
    if (basemapMesh) basemapMesh.visible = true;
    if (histMesh) histMesh.visible = histOn; // actual per-half visibility handled in render
    // Keep yuanxiang as user left it (半透可关)
    if (opacityWrap) opacityWrap.style.display = yuanxiangVisible ? '' : 'none';
    if (histOpWrap) histOpWrap.classList.remove('show'); // sides are opaque
    setSwipeRatio(swipeRatio);
  }
  syncSwipeUi();
  const labels = {
    overlay: '叠合对照',
    modern: '仅今图',
    yuanxiang: '仅圆相',
    swipe: '分割对照（示意）· 左今右古',
  };
  showStatus(labels[mode] || mode);
}

function cameraForGx(gx, mode = 'place') {
  const a = alphaFromGx(gx);
  if (mode === 'segment') {
    const r = YUAN_NS * 0.55;
    return {
      cam: new THREE.Vector3(r * Math.cos(a) * 0.7, 12, -r * Math.sin(a) * 0.7),
      target: new THREE.Vector3(0, 0.4, 0),
    };
  }
  const r = WALL_R * 0.5;
  return {
    cam: new THREE.Vector3(r * Math.cos(a), 3.2, -r * Math.sin(a)),
    target: new THREE.Vector3(WALL_R * 0.9 * Math.cos(a), WALL_H * 0.4, -WALL_R * 0.9 * Math.sin(a)),
  };
}

function animateCamera(camTo, targetTo, dur = 750) {
  const from = camera.position.clone();
  const tFrom = controls.target.clone();
  const t0 = performance.now();
  (function step(now) {
    const u = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - u, 3);
    camera.position.lerpVectors(from, camTo, e);
    controls.target.lerpVectors(tFrom, targetTo, e);
    controls.update();
    if (u < 1) requestAnimationFrame(step);
  })(t0);
}

function focusPlace(pl, el) {
  if (activeLabelEl) activeLabelEl.classList.remove('active');
  activeLabelEl = el;
  if (el) el.classList.add('active');
  if (pl.seg !== activeSeg) setActiveSegment(pl.seg, false);
  const seg = SEGMENTS.find((s) => s.id === pl.seg);
  const L = placeLabelObjs.find((o) => o.pl === pl || o.pl.id === pl.id);
  let wx = null, wz = null;
  if (L && L._wx != null) {
    wx = L._wx; wz = L._wz;
  } else if (morphAmount > 0.5 && pl.lat != null && pl.lng != null) {
    const w = lngLatToWorld(pl.lng, pl.lat, 0.2);
    wx = w.x; wz = w.z;
  } else if (!wallGroup.visible && FLOOR_UV[pl.id]) {
    const sw = freerToWorld(FLOOR_UV[pl.id].u, FLOOR_UV[pl.id].v, 0.2);
    wx = sw.x; wz = sw.z;
  }
  if (wx != null && !wallGroup.visible) {
    animateCamera(
      new THREE.Vector3(wx - 4, 8, wz - 5),
      new THREE.Vector3(wx, 0.2, wz),
      800
    );
  } else {
    const { cam, target } = cameraForGx(pl.gx, 'place');
    animateCamera(cam, target, 800);
    flashHighlight(pl.gx, seg ? seg.color : '#fff1a8');
  }
  const modeNote = morphAmount < 0.35 ? '圆相位' : (morphAmount > 0.65 ? '今址' : '过渡');
  const loc = (pl.lat != null)
    ? ` · 今 ${pl.lat.toFixed(4)},${pl.lng.toFixed(4)}`
    : '';
  const uvNote = FLOOR_UV[pl.id] ? '' : ' · 画位待定';
  showStatus(`${pl.short} · ${seg ? seg.name : pl.seg} · ${modeNote} · gx ${pl.gx}${loc}${uvNote}`);
}

function setActiveSegment(id, jump = true) {
  activeSeg = id;
  document.querySelectorAll('#legend .seg').forEach((b) => {
    b.classList.toggle('on', b.dataset.id === id);
  });
  const segNameEl = document.getElementById('seg-name');
  if (segNameEl) {
    if (id === 'all') segNameEl.textContent = '全部 · 淡';
    else {
      const seg = SEGMENTS.find((s) => s.id === id);
      segNameEl.textContent = seg ? seg.name : id;
    }
  }
  applySegmentFilter();
  if (jump && id !== 'all') {
    const seg = SEGMENTS.find((s) => s.id === id);
    if (!seg) return;
    const mid = (Math.max(seg.gxMin, GX_PAINT_MIN) + Math.min(seg.gxMax, GX_PAINT_MAX)) / 2;
    const { cam, target } = cameraForGx(mid, 'segment');
    animateCamera(cam, target, 700);
    flashHighlight(mid, seg.color);
    showStatus(seg.name);
  } else if (id === 'all') {
    showStatus('全部扇区 · 淡色图例');
  }
}

function zeroExplodeUI() {
  explodeTarget = 0;
  const slider = document.getElementById('explode');
  if (slider) {
    slider.value = '0';
    document.getElementById('explode-val').textContent = '0%';
  }
}

function clearMorphUI() {
  morphTarget = 0;
  const b = document.getElementById('btn-morph');
  if (b) b.classList.remove('on');
}

function setMorphUI(on) {
  morphTarget = on ? 1 : 0;
  const b = document.getElementById('btn-morph');
  if (b) b.classList.toggle('on', on);
}

document.getElementById('legend').addEventListener('click', (ev) => {
  const btn = ev.target.closest('.seg');
  if (!btn) return;
  setActiveSegment(btn.dataset.id, true);
});

document.getElementById('compare-modes').addEventListener('click', (ev) => {
  const btn = ev.target.closest('.mode');
  if (!btn) return;
  applyCompareMode(btn.dataset.mode);
});

const btnSwipe = document.getElementById('btn-swipe');
if (btnSwipe) {
  btnSwipe.addEventListener('click', () => {
    if (btnSwipe.disabled) return;
    applyCompareMode('swipe');
  });
}

(function bindDrawer() {
  const btn = document.getElementById('btn-drawer');
  const drawer = document.getElementById('drawer');
  const mask = document.getElementById('drawer-mask');
  if (!btn || !drawer) return;
  const setOpen = (open) => {
    document.body.classList.toggle('drawer-open', open);
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.title = open ? '收起控件' : '展开更多控件';
    btn.textContent = open ? '›' : '☰';
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (mask) mask.setAttribute('aria-hidden', open ? 'false' : 'true');
  };
  btn.addEventListener('click', () => setOpen(!document.body.classList.contains('drawer-open')));
  if (mask) mask.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && document.body.classList.contains('drawer-open')) setOpen(false);
  });
})();

document.getElementById('styles').addEventListener('click', async (ev) => {
  const btn = ev.target.closest('.pill');
  if (!btn) return;
  const style = btn.dataset.style;
  document.querySelectorAll('#styles .pill').forEach((b) => b.classList.toggle('on', b === btn));
  currentStyle = style;
  scene.background = new THREE.Color(style === 'night' ? 0x06080e : 0x0e1014);
  scene.fog.color.set(style === 'night' ? 0x06080e : 0x0e1014);
  // Basemap is MeshBasic (unlit); lights mainly affect 圆相/壁
  amb.intensity = style === 'night' ? 0.42 : 0.55;
  sun.intensity = style === 'night' ? 0.55 : 1.05;
  fill.intensity = style === 'night' ? 0.25 : 0.35;
  if (!basemapTextures[style]) {
    showStatus('加载底图…');
    basemapTextures[style] = await loadTextureFromUrl(STYLE_FILES[style]);
  }
  buildBasemap(basemapTextures[style]);
  showStatus({ street: '街道底图', satellite: '卫星底图', night: '夜间底图' }[style]);
});

document.getElementById('btn-places').addEventListener('click', (ev) => {
  const on = ev.currentTarget.classList.toggle('on');
  placesVisible = on;
  labelRenderer.domElement.classList.toggle('labels-hidden', !on);
  placesGroup.visible = on;
  ev.currentTarget.textContent = '星点';
  ev.currentTarget.title = on ? '显示/隐藏星点' : '星点已隐（再点显示）';
});

const btnNames = document.getElementById('btn-names');
if (btnNames) {
  btnNames.addEventListener('click', () => {
    applyNamesExpanded(!namesExpanded);
    showStatus(namesExpanded ? '星名已展开' : '星名已收起（仅星点）');
  });
}

document.getElementById('btn-yuanxiang').addEventListener('click', (ev) => {
  if (compareMode === 'modern' || compareMode === 'yuanxiang') {
    applyCompareMode('overlay');
  }
  const on = ev.currentTarget.classList.toggle('on');
  yuanxiangVisible = on;
  yuanGroup.visible = on;
  ev.currentTarget.textContent = '圆相';
  ev.currentTarget.title = on ? '显示/隐藏圆相层' : '圆相已隐（再点显示）';
  const opacityWrap = document.getElementById('opacity-wrap');
  if (opacityWrap && (compareMode === 'overlay' || compareMode === 'swipe')) {
    opacityWrap.style.display = on ? '' : 'none';
  }
});

document.getElementById('yuan-opacity').addEventListener('input', (ev) => {
  const v = Number(ev.target.value) / 100;
  setYuanOpacity(v);
  if (compareMode !== 'overlay') applyCompareMode('overlay');
});

document.getElementById('btn-wall').addEventListener('click', (ev) => {
  const on = ev.currentTarget.classList.toggle('on');
  wallGroup.visible = on;
  showStatus(on ? '环壁已开（试验）' : '环壁已关');
});

document.getElementById('btn-morph').addEventListener('click', (ev) => {
  const on = ev.currentTarget.classList.toggle('on');
  if (on) {
    zeroExplodeUI();
    morphTarget = 1;
    showStatus('圆相扭曲对齐今图 · 星钉今址 · 炸开归零');
  } else {
    morphTarget = 0;
    showStatus('圆相未扭曲 · 星移到画上圆相位');
  }
});

document.getElementById('explode').addEventListener('input', (ev) => {
  const pct = Number(ev.target.value); // 0–40
  const v = pct / 100; // 0–0.40
  // 开炸开 → 关变形
  if (v > 0.01 && morphTarget > 0) {
    clearMorphUI();
    showStatus('炸开已开 · 变形已关');
  }
  explodeTarget = v;
  document.getElementById('explode-val').textContent = `${pct}%`;
});


document.getElementById('tl-years').addEventListener('click', (ev) => {
  const btn = ev.target.closest('.yr');
  if (!btn) return;
  setHistYear(btn.dataset.year);
});

document.getElementById('hist-opacity').addEventListener('input', (ev) => {
  const v = Number(ev.target.value) / 100;
  setHistOpacity(v);
  if (compareMode === 'yuanxiang') applyCompareMode('overlay');
});

async function main() {
  let floorTex, scrollTex;
  try {
    floorTex = await loadTex('./yuanxiang-floor.jpg', 'YUANXIANG_FLOOR_B64', './yuanxiang-floor.b64.js');
  } catch (e) {
    loadingEl.textContent = '圆相加载失败';
    return;
  }
  try {
    scrollTex = await loadTex('./scroll-cyl-8k.jpg', 'SCROLL_CYL_8K_B64', './scroll-cyl-8k.b64.js');
  } catch (e) {
    try {
      scrollTex = await loadTex('./scroll-cyl-4k.jpg', 'SCROLL_CYL_4K_B64', './scroll-cyl-4k.b64.js');
    } catch (e2) {
      loadingEl.textContent = '画卷加载失败';
      return;
    }
  }

  try {
    basemapTextures.night = await loadTextureFromUrl(STYLE_FILES.night);
    buildBasemap(basemapTextures.night);
    currentStyle = 'night';
    scene.background = new THREE.Color(0x06080e);
    scene.fog.color.set(0x06080e);
    amb.intensity = 0.42;
    sun.intensity = 0.55;
    fill.intensity = 0.25;
  } catch (e) {
    console.warn('basemap night', e);
    try {
      basemapTextures.street = await loadTextureFromUrl(STYLE_FILES.street);
      buildBasemap(basemapTextures.street);
      currentStyle = 'street';
    } catch (e2) {
      console.warn('basemap street', e2);
    }
  }

  buildYuanxiang(floorTex);
  buildWall(scrollTex);
  makePlaceLabels();
  setYuanOpacity(DEFAULT_YUAN_OPACITY);
  applyMorph(1); // default 配准
  applyExplode(0);
  applySegmentFilter();
  setHistOpacity(DEFAULT_HIST_OPACITY);
  updateHistCite(HIST_LAYERS[0]);
  const nowN = PLACES.filter((p) => p.lat != null).length;
  const uvN = PLACES.filter((p) => FLOOR_UV[p.id]).length;
  console.info(
    `[yuanxiang-3d] 今址 ${nowN}/${PLACES.length} · 画UV ${uvN} · GCP ${MORPH_GCPS.length} · 星默认收起`,
    LOC_UNCERTAIN.map((p) => `${p.short}:${p.locConf ?? '无'}`)
  );

  loadingEl.classList.add('hide');
  setTimeout(() => loadingEl.remove(), 500);
  bindSwipeHandle();
  syncSwipeUi();

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    labelRenderer.setSize(innerWidth, innerHeight);
    if (compareMode === 'swipe') setSwipeRatio(swipeRatio);
  });

  function tick(now) {
    controls.update();
    if (Math.abs(morphAmount - morphTarget) > 0.001) {
      morphAmount += (morphTarget - morphAmount) * 0.08;
      if (Math.abs(morphAmount - morphTarget) < 0.002) morphAmount = morphTarget;
      applyMorph(morphAmount);
    }
    if (Math.abs(explodeAmount - explodeTarget) > 0.001) {
      explodeAmount += (explodeTarget - explodeAmount) * 0.1;
      if (Math.abs(explodeAmount - explodeTarget) < 0.002) explodeAmount = explodeTarget;
      applyExplode(explodeAmount);
    }
    if (highlightMesh && highlightMesh.visible) {
      const left = highlightUntil - now;
      if (left <= 0) {
        highlightMesh.visible = false;
        highlightMesh.material.opacity = 0;
      } else if (left < 600) {
        highlightMesh.material.opacity = 0.85 * (left / 600);
      }
    }
    if (compareMode === 'swipe' && currentHistYear !== 'now' && histMesh) {
      renderSwipeFrame();
    } else {
      renderer.render(scene, camera);
    }
    labelRenderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

main();
