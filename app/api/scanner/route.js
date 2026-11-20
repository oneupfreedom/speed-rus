
import { NextResponse } from 'next/server';

const DEFAULT_WATCHLIST = [
// Core Tech, AI & Semis
'AAPL', 'MSFT', 'NVDA', 'AMD', 'TSLA', 'META', 'AMZN', 'GOOGL',
'PLTR', 'SMCI', 'MU', 'INTC', 'AVGO', 'QCOM', 'ARM', 'MRVL',
'ON', 'SOXL', 'HOOD', 'COIN', 'SOFI', 'UPST', 'AFRM', 'PATH',
'U', 'RBLX', 'DKNG', 'PENN', 'DraftKings' === undefined ? 'DKNG' : 'RKLB',
'IONQ', 'LUNR', 'JOBY', 'ACHR', 'MARA', 'RIOT', 'CLSK', 'CIFR',

// Mid-Cap & Active Consumer / Retail / Auto
'AAP', 'F', 'GM', 'RIVN', 'LCID', 'CHWY', 'W', 'ETSY',
'SNAP', 'PINS', 'LYFT', 'UBER', 'DASH', 'BABA', 'JD', 'NIO',
'XPEV', 'LI', 'GAP', 'ANF', 'URBN', 'KSS', 'M', 'BBY',
'FIVE', 'DLTR', 'DG', 'WEN', 'SHAK', 'CAVA', 'BROS', 'CELH',

// Industrials, Energy, Materials & Financials
'XOM', 'CVX', 'OXY', 'HAL', 'SLB', 'DVN', 'APA', 'RIG',
'KMI', 'WMB', 'FCX', 'AA', 'MP', 'ALB', 'UAL', 'DAL',
'AAL', 'LUV', 'JBLU', 'BAC', 'C', 'WFC', 'SCHW', 'ALLY',

// Healthcare, Biotech & Broad Movers
'MRNA', 'NVAX', 'BIIB', 'VRTX', 'ILMN', 'DXCM', 'TDOC', 'HIMS',
'ROKU', 'TTD', 'ZM', 'DOCU', 'SHOP', 'SQ', 'PYPL', 'DIS',
];

async function fetchSingleChart(symbol) {
const encoded = encodeURIComponent(symbol);
const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=1mo`;

const response = await fetch(url, {
headers: {
'User-Agent':
'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
Accept: 'application/json,text/plain,*/*',
},
cache: 'no-store',
});

if (!response.ok) {
throw new Error(`Chart status ${response.status} for ${symbol}`);
}

const data = await response.json();
const result = data?.chart?.result?.[0];
const meta = result?.meta;
if (!meta) return null;

const quote = result?.indicators?.quote?.[0] || {};
const closes = Array.isArray(quote.close)
? quote.close.filter((c) => typeof c === 'number' && Number.isFinite(c) && c > 0)
: [];
const highs = Array.isArray(quote.high) ? quote.high : [];
const lows = Array.isArray(quote.low) ? quote.low : [];

const volumes = Array.isArray(quote.volume)
? quote.volume.filter((v) => typeof v === 'number' && Number.isFinite(v) && v > 0)
: [];

const latestBarVol = volumes.length > 0 ? volumes[volumes.length - 1] : 0;
const priorBars = volumes.length > 1 ? volumes.slice(0, -1) : volumes;
const computedAvgVol =
priorBars.length > 0
? priorBars.reduce((sum, v) => sum + v, 0) / priorBars.length
: 0;

const ranges = [];
const len = Math.min(highs.length, lows.length, quote.close?.length || 0);
for (let i = 0; i < len; i++) {
const h = highs[i];
const l = lows[i];
const c = quote.close?.[i];
if (
typeof h === 'number' &&
typeof l === 'number' &&
typeof c === 'number' &&
Number.isFinite(h) &&
Number.isFinite(l) &&
Number.isFinite(c) &&
c > 0 &&
h >= l
) {
ranges.push(((h - l) / c) * 100);
}
}

let isCoiling = false;
if (ranges.length >= 4) {
const recentSlice = ranges.slice(-3);
const priorSlice = ranges.slice(-8, -3);
const avgRecentRange =
recentSlice.reduce((sum, r) => sum + r, 0) / recentSlice.length;
const avgPriorRange =
priorSlice.length > 0
? priorSlice.reduce((sum, r) => sum + r, 0) / priorSlice.length
: avgRecentRange;

const compressedVsPrior = avgPriorRange > 0 && avgRecentRange <= avgPriorRange * 0.98;
const tightBase = avgRecentRange <= 3.8;
isCoiling = compressedVsPrior || tightBase;
}

const priorDailyClose =
closes.length >= 2
? closes[closes.length - 2]
: Number(meta.regularMarketPreviousClose ?? meta.previousClose ?? meta.chartPreviousClose ?? 0);

const price = Number(
meta.regularMarketPrice ??
(closes.length > 0 ? closes[closes.length - 1] : 0) ??
0
);

const volume = Number(meta.regularMarketVolume ?? latestBarVol ?? 0);
const avgVol = Number(
meta.averageDailyVolume3Month ??
meta.averageDailyVolume10Day ??
computedAvgVol ??
0
);
const marketCap = Number(meta.marketCap ?? 0);

if (!price || price <= 0) return null;

const changePercent =
priorDailyClose > 0 ? ((price - priorDailyClose) / priorDailyClose) * 100 : 0;
const relVol = avgVol > 0 && volume > 0 ? volume / avgVol : 1;

return {
symbol: meta.symbol || symbol,
name: meta.shortName || meta.longName || symbol,
price,
prevClose: priorDailyClose,
changePercent,
relVol,
marketCap,
isCoiling,
};
}

async function fetchQuotes(symbols) {
const uniqueSymbols = [...new Set(symbols)];
const results = await Promise.allSettled(
uniqueSymbols.map((sym) => fetchSingleChart(sym))
);

const quotes = results
.filter((r) => r.status === 'fulfilled' && r.value)
.map((r) => r.value);

if (quotes.length === 0) {
throw new Error('Quote provider returned status 401 or blocked requests');
}

return quotes;
}

function evaluateRow(q) {
const passPctBand = q.changePercent >= 1.5 && q.changePercent <= 2.35;
const passTorqueCap =
q.price >= 5 &&
q.price <= 85 &&
(q.marketCap === 0 || (q.marketCap >= 5e8 && q.marketCap <= 3.5e10));
const passRelVol = q.relVol >= 1.5;

const passedCount =
(passPctBand ? 1 : 0) + (passTorqueCap ? 1 : 0) + (passRelVol ? 1 : 0);

const isPrimeEarlyCoil = Boolean(q.isCoiling) && passPctBand && passTorqueCap && passRelVol;

let setup = 'WATCH';
let signal = 'WAIT';

if (isPrimeEarlyCoil) {
setup = 'COIL POP';
signal = 'PRIME ENTRY';
} else if (
q.isCoiling &&
q.changePercent >= 1.0 &&
q.changePercent <= 3.2 &&
q.relVol >= 1.0
) {
setup = 'COIL POP';
signal = 'WATCH IGNITION';
} else if (q.changePercent > 3.2) {
setup = 'EXTENDED';
signal = 'NO CHASE';
} else if (q.changePercent < -1.0) {
setup = 'PULLBACK';
signal = 'CAUTION';
}

let score = 40;
score += Math.max(-15, Math.min(25, q.changePercent * 8));
score += Math.max(0, Math.min(20, (q.relVol - 1) * 12));
if (q.isCoiling) score += 12;
if (passPctBand) score += 10;
if (passTorqueCap) score += 5;
if (isPrimeEarlyCoil) score += 10;

return {
symbol: q.symbol,
name: q.name,
price: q.price,
changePercent: q.changePercent,
relVol: q.relVol,
score: Math.round(score),
setup,
signal,
isPrimeEarlyCoil,
threePoint: {
passedCount,
passPctBand,
passTorqueCap,
passRelVol,
},
};
}

export async function GET() {
try {
const quotes = await fetchQuotes(DEFAULT_WATCHLIST);
const rows = quotes
.map(evaluateRow)
.sort((a, b) => b.score - a.score);

return NextResponse.json({
ok: true,
updatedAt: new Date().toISOString(),
rows,
});
} catch (err) {
const message =
err instanceof Error ? err.message : 'Unable to fetch market data';
return NextResponse.json({ error: message, rows: [] }, { status: 500 });
}
}
