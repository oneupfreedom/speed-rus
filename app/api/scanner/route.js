import { NextResponse } from 'next/server';

const FALLBACK_TICKERS = [
'NVDA', 'AMD', 'TSLA', 'AAPL', 'META', 'AMZN', 'MSFT', 'GOOGL', 'PLTR', 'SOFI',
'COIN', 'MARA', 'RIOT', 'HOOD', 'SMCI', 'ARM', 'AVGO', 'MU', 'INTC', 'QCOM',
'BABA', 'PDD', 'JD', 'NIO', 'XPEV', 'LI', 'RIVN', 'LCID', 'F', 'GM',
'UBER', 'LYFT', 'DASH', 'ABNB', 'SHOP', 'SQ', 'PYPL', 'AFRM', 'UPST', 'NET',
'CRWD', 'PANW', 'ZS', 'DDOG', 'SNOW', 'MDB', 'PATH', 'AI', 'SOUN', 'IONQ',
'RKLB', 'LUNR', 'ASTS', 'ACHR', 'JOBY', 'IREN', 'CLSK', 'WULF', 'HUT', 'BITF'
];

async function fetchScreenerSymbols(scrId, count = 50) {
try {
const url = `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&lang=en-US&region=US&scrIds=${scrId}&count=${count}`;
const res = await fetch(url, {
headers: { 'User-Agent': 'Mozilla/5.0' },
cache: 'no-store',
});
if (!res.ok) return [];
const data = await res.json();
const quotes = data?.finance?.result?.[0]?.quotes || [];
return quotes.map((q) => q.symbol).filter(Boolean);
} catch {
return [];
}
}

async function analyzeTicker(symbol) {
try {
const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
symbol
)}?interval=5m&range=5d`;
const res = await fetch(url, {
headers: { 'User-Agent': 'Mozilla/5.0' },
cache: 'no-store',
});
if (!res.ok) return null;

const json = await res.json();
const result = json?.chart?.result?.[0];
if (!result) return null;

const meta = result.meta || {};
const price = Number(meta.regularMarketPrice || 0);
const prevClose = Number(meta.chartPreviousClose || meta.previousClose || 0);
const dayHigh = Number(meta.regularMarketDayHigh || price);
const dayLow = Number(meta.regularMarketDayLow || price);
const volume = Number(meta.regularMarketVolume || 0);

if (price < 3 || volume < 250000 || prevClose <= 0) return null;

const changePercent = ((price - prevClose) / prevClose) * 100;
const dayRange = Math.max(dayHigh - dayLow, 0.01);
const rangePosition = (price - dayLow) / dayRange;
const spreadPercent = (dayRange / price) * 100;

const timestamps = result.timestamp || [];
const volumes = result.indicators?.quote?.[0]?.volume || [];
const closes = result.indicators?.quote?.[0]?.close || [];

let todayVol = 0;
let priorVolTotal = 0;
let priorBars = 0;
const nowDay = new Date().toDateString();

for (let i = 0; i < timestamps.length; i++) {
const v = Number(volumes[i] || 0);
if (v <= 0) continue;
const barDay = new Date(timestamps[i] * 1000).toDateString();
if (barDay === nowDay) {
todayVol += v;
} else {
priorVolTotal += v;
priorBars++;
}
}

const avgBarVol = priorBars > 0 ? priorVolTotal / priorBars : 0;
const todayBars = timestamps.filter(
(t) => new Date(t * 1000).toDateString() === nowDay
).length;
const expectedVol = avgBarVol * Math.max(todayBars, 1);
const relVol =
expectedVol > 0 ? Number((todayVol / expectedVol).toFixed(2)) : 1.0;

const recentCloses = closes.slice(-6).filter((c) => typeof c === 'number');
let recentTightness = 1;
if (recentCloses.length >= 4) {
const rMax = Math.max(...recentCloses);
const rMin = Math.min(...recentCloses);
recentTightness = (rMax - rMin) / Math.max(price, 1);
}

const pctPoints = Math.min(Math.max(changePercent * 3.2, 0), 34);
const rvolPoints = Math.min(relVol * 18, 32);
const rangePoints = Math.round(rangePosition * 24);
const coilBonus =
changePercent >= 1.5 &&
changePercent <= 9.5 &&
rangePosition >= 0.65 &&
recentTightness <= 0.018
? 12
: 0;

const score = Math.min(
99,
Math.round(pctPoints + rvolPoints + rangePoints + coilBonus)
);

if (score < 30) return null;

let setup = 'BREAKOUT RUN';
if (
changePercent >= 1.5 &&
changePercent <= 9.5 &&
rangePosition >= 0.65 &&
relVol >= 1.15 &&
recentTightness <= 0.02
) {
setup = 'COIL POP';
} else if (rangePosition < 0.55 && changePercent > 2) {
setup = 'PULLBACK / DIP';
}

let signal = 'MONITOR';
if (score >= 72 && relVol >= 1.25) {
signal = 'TOP LEADER';
} else if (score >= 60) {
signal = 'CHALLENGER';
}

return {
ticker: symbol,
name: meta.shortName || meta.symbol || symbol,
price: Number(price.toFixed(2)),
changePercent: Number(changePercent.toFixed(2)),
relVol,
rangePosition: Number(rangePosition.toFixed(2)),
spreadPercent: Number(spreadPercent.toFixed(2)),
score,
setup,
signal,
};
} catch {
return null;
}
}

async function analyzeInBatches(symbols, batchSize = 30) {
const allResults = [];
for (let i = 0; i < symbols.length; i += batchSize) {
const batch = symbols.slice(i, i + batchSize);
const batchResults = await Promise.all(batch.map(analyzeTicker));
allResults.push(...batchResults);
}
return allResults;
}

export async function GET() {
try {
const [gainers, actives, smallCaps] = await Promise.all([
fetchScreenerSymbols('day_gainers', 50),
fetchScreenerSymbols('most_actives', 50),
fetchScreenerSymbols('aggressive_small_caps', 50),
]);

const uniqueSymbols = Array.from(
new Set([...gainers, ...actives, ...smallCaps, ...FALLBACK_TICKERS])
)
.filter((s) => !s.includes('.') && !s.includes('-'))
.slice(0, 120);

const results = await analyzeInBatches(uniqueSymbols, 30);
const stocks = results
.filter(Boolean)
.sort((a, b) => b.score - a.score)
.slice(0, 20);

return NextResponse.json({
success: true,
scannedCount: uniqueSymbols.length,
count: stocks.length,
timestamp: new Date().toISOString(),
stocks,
});
} catch (err) {
return NextResponse.json(
{ success: false, error: err.message || 'Scanner failed', stocks: [] },
{ status: 500 }
);
}
}
