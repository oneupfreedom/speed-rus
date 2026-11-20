
import { NextResponse } from 'next/server';

export const maxDuration = 60;

const DEFAULT_SYMBOLS = [
// Canadian High-Beta Tech, AI, Crypto & Growth (.TO)
'SHOP.TO', 'CLS.TO', 'BB.TO', 'LSPD.TO', 'NVEI.TO', 'DCBO.TO', 'KXS.TO', 'CSU.TO',
'OTEX.TO', 'GIB-A.TO', 'MDA.TO', 'DND.TO', 'WELL.TO', 'CTS.TO', 'BITF.TO', 'HIVE.TO',
'GLXY.TO', 'HUT.TO', 'DMGI.TO', 'AC.TO', 'CHR.TO', 'BBD-B.TO', 'CAE.TO', 'ATZ.TO',
'GOOS.TO', 'DOO.TO', 'TFII.TO', 'WSP.TO', 'STN.TO', 'BYD.TO', 'NFI.TO', 'MAXR.TO',

// Canadian Gold, Silver, Copper & Critical Minerals (.TO)
'K.TO', 'ABX.TO', 'AEM.TO', 'WPM.TO', 'FNV.TO', 'AGI.TO', 'ELD.TO', 'IMG.TO',
'NGD.TO', 'OR.TO', 'SSRM.TO', 'EQX.TO', 'TXG.TO', 'DPM.TO', 'LUG.TO', 'KNT.TO',
'SKE.TO', 'SEA.TO', 'NG.TO', 'CXB.TO', 'CG.TO', 'OGC.TO', 'PAAS.TO', 'AG.TO',
'MAG.TO', 'SVM.TO', 'AYA.TO', 'EDR.TO', 'SIL.TO', 'FM.TO', 'LUN.TO', 'HBM.TO',
'CS.TO', 'IVN.TO', 'ERO.TO', 'TKO.TO', 'TECK-B.TO', 'FIL.TO', 'NGEX.TO', 'LAC.TO',
'SGML.TO', 'PMET.TO', 'NTR.TO',

// Canadian Uranium & High-Beta Energy (.TO)
'CCO.TO', 'DML.TO', 'NXE.TO', 'FCU.TO', 'U-UN.TO', 'EFR.TO', 'ISO.TO', 'GLO.TO',
'CVE.TO', 'CNQ.TO', 'SU.TO', 'IMO.TO', 'MEG.TO', 'BTE.TO', 'ATH.TO', 'WCP.TO',
'CPG.TO', 'VET.TO', 'ARX.TO', 'TOU.TO', 'BIR.TO', 'POU.TO', 'PEY.TO', 'NVA.TO',
'KEL.TO', 'SDE.TO', 'TVE.TO', 'CJ.TO', 'FRU.TO', 'PSK.TO', 'ESI.TO', 'PD.TO',
'TCW.TO', 'CEU.TO',

// Canadian Leveraged & Sector ETFs (.TO)
'HQU.TO', 'HXU.TO', 'HEU.TO', 'HGU.TO', 'HNU.TO', 'HOU.TO', 'HURA.TO', 'XEG.TO',
'XGD.TO', 'XIT.TO', 'ZEB.TO', 'VFV.TO', 'XQQ.TO', 'XIU.TO',

// US High-Beta Semis, AI & Software
'NVDA', 'AMD', 'SMCI', 'ARM', 'AVGO', 'MU', 'MRVL', 'TSM', 'ASML', 'AMAT',
'LRCX', 'KLAC', 'QCOM', 'INTC', 'ON', 'MPWR', 'CRDO', 'ALAB', 'PLTR', 'AI',
'SOUN', 'BBAI', 'PATH', 'SNOW', 'DDOG', 'NET', 'CRWD', 'PANW', 'ZS', 'MDB',
'APP', 'TTD', 'U', 'RBLX', 'SHOP', 'TWLO', 'DOCN', 'GTLB', 'ESTC', 'IOT',

// US Quantum, Space, Drones, EV & Next-Gen Tech
'IONQ', 'QBTS', 'RGTI', 'QUBT', 'ARQQ', 'RKLB', 'ASTS', 'LUNR', 'RDW', 'PL',
'SPCE', 'ACHR', 'JOBY', 'EVTL', 'AVAV', 'KTOS', 'RCAT', 'ONDS', 'TSLA', 'RIVN',
'LCID', 'NIO', 'XPEV', 'LI', 'QS', 'CHPT', 'BLNK', 'ENVX', 'ENPH', 'SEDG',
'FSLR', 'RUN', 'SMR', 'OKLO', 'NNE', 'LEU', 'CCJ', 'UEC', 'UUUU', 'DNN',

// US Crypto-Linked & High-Beta Fintech
'COIN', 'MSTR', 'MARA', 'RIOT', 'CLSK', 'IREN', 'WULF', 'CIFR', 'CORZ', 'BTBT',
'HUT', 'BITF', 'HOOD', 'SOFI', 'AFRM', 'UPST', 'NU', 'PYPL', 'XYZ', 'MELI',

// US High-Beta Consumer, Biotech, Energy & Leveraged ETFs
'HIMS', 'CELH', 'DKNG', 'PENN', 'UBER', 'LYFT', 'ABNB', 'DASH', 'CVNA', 'SNAP',
'PINS', 'ROKU', 'SPOT', 'NFLX', 'CRSP', 'NTLA', 'BEAM', 'VKTX', 'ALT', 'MRNA',
'BNTX', 'OXY', 'DVN', 'FANG', 'APA', 'HAL', 'SLB', 'FCX', 'SCCO', 'AA',
'CLF', 'X', 'TQQQ', 'SOXL', 'NVDL', 'TSLL', 'CONL', 'MSTU', 'GDXJ', 'SILJ',
'XBI', 'ARKK', 'IWM', 'SMH'
];

let scanCache = {
key: '',
expiresAt: 0,
payload: null
};

function getEtClock(now = new Date()) {
const etString = now.toLocaleString('en-US', {
timeZone: 'America/New_York',
hour12: false,
hour: '2-digit',
minute: '2-digit'
});
const [hh, mm] = etString.split(':').map(Number);
return hh * 60 + mm;
}

function getSessionPhase(now = new Date()) {
const mins = getEtClock(now);
if (mins < 9 * 60 + 35) return 'PRE_BELL';
if (mins <= 9 * 60 + 50) return 'BELL_935_WINDOW';
if (mins < 16 * 60) return 'DAY_SESSION';
return 'POST_CLOSE';
}

function isRegularDaytime(sessionPhase) {
return sessionPhase === 'BELL_935_WINDOW' || sessionPhase === 'DAY_SESSION';
}

function buildFallbackRow(symbol, index) {
const basePrice = 25 + ((index * 19) % 180) + 0.35;
return {
symbol,
name: symbol,
price: Number(basePrice.toFixed(2)),
changePercent: 0,
intradayMovePct: 0,
relVol: 1,
score: Number((15 + ((index * 7) % 20)).toFixed(1)),
setup: 'WATCH',
signal: 'MONITOR',
isCoilPop: false,
isCoiling: false,
source: 'fallback'
};
}

async function fetchSingleChart(symbol, index, sessionPhase) {
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 2800);

try {
const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
symbol
)}?interval=5m&range=1d`;
const res = await fetch(url, {
signal: controller.signal,
headers: { 'User-Agent': 'Mozilla/5.0' },
cache: 'no-store'
});

if (!res.ok) {
return buildFallbackRow(symbol, index);
}

const json = await res.json();
const result = json?.chart?.result?.[0];
const meta = result?.meta;
const quote = result?.indicators?.quote?.[0];

const closes = Array.isArray(quote?.close) ? quote.close : [];
const rawPrice =
typeof meta?.regularMarketPrice === 'number'
? meta.regularMarketPrice
: [...closes].reverse().find((v) => typeof v === 'number' && v > 0) ?? null;

const prevClose =
typeof meta?.chartPreviousClose === 'number'
? meta.chartPreviousClose
: typeof meta?.previousClose === 'number'
? meta.previousClose
: null;

if (typeof rawPrice !== 'number' || !Number.isFinite(rawPrice) || rawPrice <= 0) {
return buildFallbackRow(symbol, index);
}

const firstValidClose = closes.find((v) => typeof v === 'number' && v > 0);
const referenceBase =
typeof prevClose === 'number' && prevClose > 0 ? prevClose : firstValidClose;

const changePercent =
typeof referenceBase === 'number' && referenceBase > 0
? Number((((rawPrice - referenceBase) / referenceBase) * 100).toFixed(2))
: 0;

const intradayMovePct =
typeof firstValidClose === 'number' && firstValidClose > 0
? Number((((rawPrice - firstValidClose) / firstValidClose) * 100).toFixed(2))
: changePercent;

const highs = Array.isArray(quote?.high) ? quote.high.filter((n) => typeof n === 'number') : [];
const lows = Array.isArray(quote?.low) ? quote.low.filter((n) => typeof n === 'number') : [];
const vols = Array.isArray(quote?.volume) ? quote.volume.filter((n) => typeof n === 'number') : [];

const recentHigh = highs.length ? Math.max(...highs.slice(-6)) : rawPrice;
const recentLow = lows.length ? Math.min(...lows.slice(-6)) : rawPrice;
const rangePct = rawPrice > 0 ? ((recentHigh - recentLow) / rawPrice) * 100 : 2;

const avgVol =
vols.length > 1
? vols.slice(0, -1).reduce((a, b) => a + b, 0) / Math.max(1, vols.length - 1)
: 1;
const lastVol = vols.length ? vols[vols.length - 1] : avgVol;
const relVol = avgVol > 0 ? Number(Math.max(0.2, Math.min(8, lastVol / avgVol)).toFixed(2)) : 1;

const daytimeActive = isRegularDaytime(sessionPhase);
const inActiveRange =
changePercent >= 0 &&
changePercent <= 3.0 &&
intradayMovePct >= 0 &&
intradayMovePct <= 3.0;
const isCoiling = inActiveRange && rangePct > 0 && rangePct <= 1.05;

const inDaytimePopBand =
(changePercent >= 1.0 && changePercent <= 2.75) ||
(intradayMovePct >= 1.0 && intradayMovePct <= 2.75);

const isCoilPop =
daytimeActive &&
inDaytimePopBand &&
isCoiling &&
relVol >= 1.3 &&
intradayMovePct > 0.35;

const rawScore =
(isCoilPop ? 72 : isCoiling && intradayMovePct >= 0.8 ? 50 : 22) +
Math.min(18, Math.max(0, relVol * 6.5)) +
(isCoiling ? 9 : 0);

return {
symbol,
name: meta?.shortName || meta?.longName || symbol,
price: Number(rawPrice.toFixed(2)),
changePercent,
intradayMovePct,
relVol,
score: Number(Math.min(99.9, rawScore).toFixed(1)),
setup: isCoilPop ? 'COIL POP' : isCoiling ? 'COILING' : 'WATCH',
signal: isCoilPop ? 'EARLY POP' : 'MONITOR',
isCoilPop,
isCoiling,
source: 'live'
};
} catch {
return buildFallbackRow(symbol, index);
} finally {
clearTimeout(timer);
}
}

async function runInBatches(items, batchSize, worker) {
const results = [];
for (let i = 0; i < items.length; i += batchSize) {
const chunk = items.slice(i, i + batchSize);
const chunkRes = await Promise.all(chunk.map((item) => worker(item.sym, item.idx)));
results.push(...chunkRes);
}
return results;
}

export async function GET(request) {
try {
const { searchParams } = new URL(request.url);
const extraParam = searchParams.get('symbols') || '';
const extraList = extraParam
.split(',')
.map((s) => s.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, ''))
.filter(Boolean);

const symbols = [...new Set([...extraList, ...DEFAULT_SYMBOLS])].slice(0, 280);
const cacheKey = symbols.join(',');

if (scanCache.payload && scanCache.key === cacheKey && Date.now() < scanCache.expiresAt) {
return NextResponse.json(scanCache.payload);
}

const sessionPhase = getSessionPhase();
const indexed = symbols.map((sym, idx) => ({ sym, idx }));
const rows = await runInBatches(indexed, 35, (sym, idx) =>
fetchSingleChart(sym, idx, sessionPhase)
);

rows.sort((a, b) => {
if (a.isCoilPop !== b.isCoilPop) return a.isCoilPop ? -1 : 1;
return b.score - a.score;
});

const payload = {
ok: true,
sessionPhase,
totalScanned: rows.length,
updatedAt: new Date().toISOString(),
rows
};

scanCache = {
key: cacheKey,
expiresAt: Date.now() + 20_000,
payload
};

return NextResponse.json(payload);
} catch (err) {
return NextResponse.json(
{ ok: false, error: err?.message || 'Scanner failed' },
{ status: 500 }
);
}
}
