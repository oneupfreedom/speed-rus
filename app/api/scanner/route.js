
import { NextResponse } from 'next/server';

const DEFAULT_SYMBOLS = [
// Canadian Core & Financials (.TO)
'CNQ.TO', 'TD.TO', 'RY.TO', 'SHOP.TO', 'ENB.TO', 'BMO.TO', 'BNS.TO', 'CM.TO',
'SU.TO', 'IMO.TO', 'CVE.TO', 'TOU.TO', 'ARX.TO', 'CP.TO', 'CNR.TO', 'MFC.TO',
'SLF.TO', 'POW.TO', 'BAM.TO', 'BN.TO', 'ATD.TO', 'DOL.TO', 'L.TO', 'QSR.TO',
'WSP.TO', 'TRI.TO', 'CSU.TO', 'NTR.TO', 'CCO.TO', 'AEM.TO', 'ABX.TO', 'K.TO',
'FNV.TO', 'WPM.TO', 'HBM.TO', 'FM.TO', 'TECK-B.TO', 'FTS.TO', 'EMA.TO', 'TRP.TO',
'PPL.TO', 'KEY.TO', 'BCE.TO', 'T.TO', 'RCI-B.TO', 'GIB-A.TO', 'OTEX.TO', 'BB.TO',
// Canadian ETFs (.TO)
'XIU.TO', 'XIC.TO', 'VFV.TO', 'XEQT.TO', 'VEQT.TO', 'ZSP.TO', 'XQQ.TO', 'XEG.TO',
'XGD.TO', 'XFN.TO', 'XIT.TO', 'HURA.TO',
// US Mega-Cap & Tech
'NVDA', 'AMD', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'AVGO', 'INTC',
'MU', 'SMCI', 'ARM', 'MRVL', 'QCOM', 'TXN', 'AMAT', 'LRCX', 'ASML', 'TSM',
'ORCL', 'CRM', 'NOW', 'SNOW', 'PANW', 'CRWD', 'NET', 'DDOG', 'MDB', 'SHOP',
// US High-Beta, AI, Quantum, Space & Fintech
'PLTR', 'SOFI', 'RBLX', 'IONQ', 'RKLB', 'HOOD', 'COIN', 'MARA', 'RIOT', 'HIMS',
'APP', 'CELH', 'DKNG', 'UBER', 'ABNB', 'DASH', 'MSTR', 'AFRM', 'UPST', 'PATH',
'QBTS', 'RGTI', 'LUNR', 'ASTS', 'JOBY', 'ACHR', 'KTOS', 'AVAV',
// US Healthcare, Industrials, Energy & Consumer
'UNH', 'MRK', 'ABBV', 'LLY', 'JNJ', 'PFE', 'AMGN', 'GILD', 'ISRG', 'TMO',
'JPM', 'BAC', 'GS', 'MS', 'V', 'MA', 'AXP', 'BLK', 'CAT', 'DE',
'GE', 'RTX', 'LMT', 'NOC', 'BA', 'HON', 'XOM', 'CVX', 'OXY', 'SLB',
'COST', 'WMT', 'TGT', 'HD', 'LOW', 'MCD', 'SBUX', 'NKE', 'DIS', 'NFLX',
// US Liquid ETFs
'SPY', 'QQQ', 'IWM', 'DIA', 'XLK', 'XLF', 'XLE', 'XLV', 'XLI', 'XLC',
'SMH', 'SOXX', 'GDX', 'KWEB', 'TLT'
];

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
score: Number((20 + ((index * 7) % 25)).toFixed(1)),
setup: 'WATCH',
signal: 'MONITOR',
isCoilPop: false,
isCoiling: false,
source: 'fallback'
};
}

async function fetchSingleChart(symbol, index, sessionPhase) {
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 3500);

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
const isCoiling = rangePct > 0 && rangePct <= 1.05;
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

const symbols = [...new Set([...extraList, ...DEFAULT_SYMBOLS])].slice(0, 140);
const sessionPhase = getSessionPhase();
const indexed = symbols.map((sym, idx) => ({ sym, idx }));
const rows = await runInBatches(indexed, 20, (sym, idx) =>
fetchSingleChart(sym, idx, sessionPhase)
);

rows.sort((a, b) => {
if (a.isCoilPop !== b.isCoilPop) return a.isCoilPop ? -1 : 1;
return b.score - a.score;
});

return NextResponse.json({
ok: true,
sessionPhase,
updatedAt: new Date().toISOString(),
rows
});
} catch (err) {
return NextResponse.json(
{ ok: false, error: err?.message || 'Scanner failed' },
{ status: 500 }
);
}
}
