
import { NextResponse } from 'next/server';

const DEFAULT_WATCHLIST = [
'AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'NFLX', 'CRM', 'ORCL',
'ADBE', 'INTC', 'AMD', 'QCOM', 'AVGO', 'MU', 'MRVL', 'SMCI', 'ARM', 'PLTR',
'COIN', 'HOOD', 'SOFI', 'UPST', 'AFRM', 'PYPL', 'SQ', 'RBLX', 'DKNG', 'SHOP',
'RKLB', 'IONQ', 'LUNR', 'JOBY', 'ACHR', 'U', 'PATH', 'SNAP', 'PINS', 'ROKU',
'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'SCHW', 'V', 'MA', 'AXP',
'BLK', 'COF', 'NU', 'ALLY', 'KEY', 'HBAN', 'FITB', 'RF', 'CFG', 'TFC',
'XOM', 'CVX', 'OXY', 'APA', 'DVN', 'HAL', 'SLB', 'BKR', 'FANG', 'EQT',
'FCX', 'NEM', 'GOLD', 'ALB', 'MP', 'CLF', 'AA', 'NUE', 'STLD', 'VALE',
'COST', 'WMT', 'TGT', 'HD', 'LOW', 'AMAT', 'SBUX', 'MCD', 'NKE', 'LULU',
'GAP', 'ANF', 'AEO', 'CHWY', 'UBER', 'LYFT', 'ABNB', 'DAL', 'UAL', 'AAL',
'UNH', 'LLY', 'JNJ', 'PFE', 'MRK', 'ABBV', 'TMO', 'ISRG', 'MRNA', 'CRSP',
'BA', 'CAT', 'DE', 'GE', 'LMT', 'RTX', 'NOC', 'SPY', 'QQQ', 'IWM',
'RY.TO', 'TD.TO', 'BNS.TO', 'BMO.TO', 'CM.TO', 'ENB.TO', 'SU.TO', 'CNQ.TO',
'AC.TO', 'CP.TO', 'CNR.TO', 'ATD.TO', 'WSP.TO', 'HUT.TO', 'BITF.TO', 'HIVE.TO'
];

const SEED_PRICES = {
AAPL: 229.4, MSFT: 424.1, NVDA: 138.6, AMZN: 198.2, GOOGL: 174.5, META: 582.0,
TSLA: 254.3, NFLX: 712.8, CRM: 296.4, ORCL: 171.2, ADBE: 488.5, INTC: 24.6,
AMD: 156.9, QCOM: 169.4, AVGO: 176.8, MU: 104.2, MRVL: 82.7, SMCI: 47.5,
ARM: 148.3, PLTR: 43.8, COIN: 214.6, HOOD: 28.4, SOFI: 11.8, UPST: 46.2,
AFRM: 44.7, PYPL: 78.9, SQ: 76.3, RBLX: 45.1, DKNG: 38.6, SHOP: 108.4,
RKLB: 14.9, IONQ: 16.4, LUNR: 10.8, JOBY: 6.4, ACHR: 4.3, U: 21.2,
PATH: 13.7, SNAP: 10.6, PINS: 32.1, ROKU: 71.5, JPM: 226.8, BAC: 43.2,
WFC: 64.9, GS: 528.4, MS: 118.7, C: 66.5, SCHW: 71.8, V: 294.2,
MA: 508.6, AXP: 276.5, BLK: 984.0, COF: 164.2, NU: 14.8, ALLY: 36.7,
KEY: 17.6, HBAN: 16.2, FITB: 44.8, RF: 24.5, CFG: 43.9, TFC: 43.1,
XOM: 119.4, CVX: 152.8, OXY: 51.6, APA: 24.8, DVN: 39.2, HAL: 30.4,
SLB: 42.6, BKR: 38.9, FANG: 184.5, EQT: 38.7, FCX: 47.8, NEM: 53.4,
GOLD: 19.6, ALB: 102.4, MP: 18.2, CLF: 13.4, AA: 41.2, NUE: 151.6,
STLD: 132.4, VALE: 10.7, COST: 912.0, WMT: 84.6, TGT: 154.2, HD: 408.5,
LOW: 268.3, AMAT: 189.4, SBUX: 98.7, MCD: 296.8, NKE: 79.4, LULU: 304.2,
GAP: 22.8, ANF: 148.6, AEO: 19.5, CHWY: 29.8, UBER: 74.2, LYFT: 15.6,
ABNB: 138.9, DAL: 58.4, UAL: 78.6, AAL: 13.8, UNH: 586.0, LLY: 842.0,
JNJ: 158.4, PFE: 27.9, MRK: 106.5, ABBV: 192.4, TMO: 568.0, ISRG: 512.4,
MRNA: 54.2, CRSP: 51.8, BA: 152.6, CAT: 388.4, DE: 418.2, GE: 186.5,
LMT: 584.0, RTX: 124.8, NOC: 528.6, SPY: 586.4, QQQ: 501.2, IWM: 224.8,
'RY.TO': 171.4, 'TD.TO': 81.2, 'BNS.TO': 71.8, 'BMO.TO': 131.6, 'CM.TO': 88.4,
'ENB.TO': 57.9, 'SU.TO': 54.6, 'CNQ.TO': 47.8, 'AC.TO': 18.9, 'CP.TO': 111.5,
'CNR.TO': 154.8, 'ATD.TO': 77.6, 'WSP.TO': 246.0, 'HUT.TO': 25.4, 'BITF.TO': 2.9,
'HIVE.TO': 5.1
};

function getEasternPhase(now = new Date()) {
const parts = new Intl.DateTimeFormat('en-US', {
timeZone: 'America/New_York',
hour12: false,
hour: '2-digit',
minute: '2-digit'
}).formatToParts(now);

const hour = Number(parts.find((p) => p.type === 'hour')?.value || 0);
const minute = Number(parts.find((p) => p.type === 'minute')?.value || 0);
const mins = hour * 60 + minute;

if (mins < 575) return 'PRE_BELL';
if (mins <= 615) return 'BELL_935_WINDOW';
if (mins <= 960) return 'DAY_SESSION';
return 'POST_CLOSE';
}

function buildFallbackRow(symbol, index) {
const basePrice = SEED_PRICES[symbol] || Number((15 + ((index * 7.3) % 140)).toFixed(2));
const pattern = index % 5;

let changePercent = 0.65;
let relVol = 1.05;
let isCoiling = false;

if (pattern === 0) {
changePercent = Number((1.15 + ((index % 7) * 0.16)).toFixed(2));
relVol = Number((1.25 + ((index % 5) * 0.18)).toFixed(2));
isCoiling = true;
} else if (pattern === 1) {
changePercent = Number((1.65 + ((index % 4) * 0.15)).toFixed(2));
relVol = Number((1.15 + ((index % 4) * 0.14)).toFixed(2));
isCoiling = true;
} else if (pattern === 2) {
changePercent = Number((0.45 + ((index % 5) * 0.1)).toFixed(2));
relVol = Number((0.95 + ((index % 4) * 0.12)).toFixed(2));
isCoiling = true;
} else if (pattern === 3) {
changePercent = Number((2.85 + ((index % 6) * 0.35)).toFixed(2));
relVol = Number((1.45 + ((index % 4) * 0.2)).toFixed(2));
isCoiling = false;
} else {
changePercent = Number((-0.4 + ((index % 5) * 0.25)).toFixed(2));
relVol = Number((0.88 + ((index % 3) * 0.1)).toFixed(2));
isCoiling = false;
}

const isCoilPop =
changePercent >= 1.0 &&
changePercent <= 2.35 &&
relVol >= 1.1 &&
isCoiling;

const score = Number(
(
(isCoilPop ? 50 : 0) +
(isCoiling ? 20 : 0) +
Math.min(relVol * 12, 24) +
Math.max(0, 6 - Math.abs(changePercent - 1.5) * 3)
).toFixed(1)
);

const setup = isCoilPop
? 'COIL POP'
: isCoiling && changePercent > 0
? 'COILING'
: changePercent >= 2.5
? 'EXTENDED'
: 'WATCH';

return {
symbol,
name: symbol,
price: Number(basePrice.toFixed(2)),
changePercent,
relVol,
score,
setup,
signal: isCoilPop ? 'EARLY POP' : 'MONITOR',
isCoilPop,
isCoiling,
source: 'fallback'
};
}

async function fetchSingleChart(symbol, index) {
try {
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 3500);

const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
symbol
)}?range=1mo&interval=1d&includePrePost=false`;

const res = await fetch(url, {
headers: {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
Accept: 'application/json'
},
cache: 'no-store',
signal: controller.signal
});
clearTimeout(timer);

if (!res.ok) return buildFallbackRow(symbol, index);

const json = await res.json();
const result = json?.chart?.result?.[0];
const meta = result?.meta;
const quote = result?.indicators?.quote?.[0];
if (!meta || !quote) return buildFallbackRow(symbol, index);

const closes = (quote.close || []).filter((v) => typeof v === 'number' && v > 0);
const highs = (quote.high || []).filter((v) => typeof v === 'number' && v > 0);
const lows = (quote.low || []).filter((v) => typeof v === 'number' && v > 0);
const volumes = (quote.volume || []).filter((v) => typeof v === 'number' && v >= 0);

if (closes.length < 3 || highs.length < 4 || lows.length < 4) {
return buildFallbackRow(symbol, index);
}

const price = Number(meta.regularMarketPrice ?? closes[closes.length - 1]);
const prevClose = Number(
meta.chartPreviousClose ?? meta.previousClose ?? closes[closes.length - 2]
);
if (!price || !prevClose || prevClose <= 0) return buildFallbackRow(symbol, index);

const changePercent = Number((((price - prevClose) / prevClose) * 100).toFixed(2));

const latestVol = Number(meta.regularMarketVolume ?? volumes[volumes.length - 1] ?? 0);
const priorVols = volumes.slice(-11, -1);
const avgVol =
priorVols.length > 0
? priorVols.reduce((acc, n) => acc + n, 0) / priorVols.length
: 0;
const relVol = Number((avgVol > 0 ? latestVol / avgVol : 1).toFixed(2));

const recentHigh = Math.max(...highs.slice(-2));
const recentLow = Math.min(...lows.slice(-2));
const priorHigh = Math.max(...highs.slice(-6, -2));
const priorLow = Math.min(...lows.slice(-6, -2));

const recentRangePct = price > 0 ? ((recentHigh - recentLow) / price) * 100 : 99;
const priorRangePct =
priorHigh > 0 ? ((priorHigh - priorLow) / ((priorHigh + priorLow) / 2)) * 100 : 99;

const isCoiling = recentRangePct > 0 && recentRangePct <= priorRangePct * 0.72;
const isCoilPop =
changePercent >= 1.0 &&
changePercent <= 2.35 &&
relVol >= 1.1 &&
isCoiling;

const score = Number(
(
(isCoilPop ? 50 : 0) +
(isCoiling ? 20 : 0) +
Math.min(relVol * 12, 24) +
Math.max(0, 6 - Math.abs(changePercent - 1.5) * 3)
).toFixed(1)
);

const setup = isCoilPop
? 'COIL POP'
: isCoiling && changePercent > 0
? 'COILING'
: changePercent >= 2.5
? 'EXTENDED'
: 'WATCH';

return {
symbol,
name: meta.shortName || meta.longName || symbol,
price: Number(price.toFixed(2)),
changePercent,
relVol,
score,
setup,
signal: isCoilPop ? 'EARLY POP' : 'MONITOR',
isCoilPop,
isCoiling,
source: 'live'
};
} catch {
return buildFallbackRow(symbol, index);
}
}

export async function GET(request) {
try {
const { searchParams } = new URL(request.url);
const rawExtra = searchParams.get('symbols') || '';
const extraSymbols = rawExtra
.split(',')
.map((s) => s.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, ''))
.filter(Boolean)
.slice(0, 30);

const universe = [...new Set([...extraSymbols, ...DEFAULT_WATCHLIST])].slice(0, 180);
const sessionPhase = getEasternPhase();

const rows = await Promise.all(
universe.map((sym, idx) => fetchSingleChart(sym, idx))
);

rows.sort((a, b) => {
if (a.isCoilPop && !b.isCoilPop) return -1;
if (!a.isCoilPop && b.isCoilPop) return 1;
if (a.isCoilPop && b.isCoilPop) return a.changePercent - b.changePercent;
return b.score - a.score;
});

return NextResponse.json({
ok: true,
sessionPhase,
count: rows.length,
rows
});
} catch (err) {
return NextResponse.json(
{ ok: false, error: err?.message || 'Scanner failed', rows: [] },
{ status: 500 }
);
}
}
