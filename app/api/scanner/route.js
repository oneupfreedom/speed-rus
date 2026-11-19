import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const YAHOO_HEADERS = {
'User-Agent':
'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
Accept: 'application/json',
};

const FALLBACK_MOMENTUM_BASKET = [
'PANW', 'NVDA', 'TSLA', 'PLTR', 'AMD', 'META', 'AMZN', 'AAPL', 'MSFT', 'GOOGL',
'COIN', 'MSTR', 'SMCI', 'ARM', 'AVGO', 'NFLX', 'NU', 'BILL', 'SOFI', 'HOOD',
'RKLB', 'IONQ', 'AFRM', 'UPST', 'CVNA', 'MARA', 'RIOT', 'WULF', 'HUT', 'SOUN',
'GME', 'AMC', 'SEAT', 'MXL', 'OUST', 'PDD', 'BABA', 'WMT', 'SNOW', 'CRWD',
'NET', 'DDOG', 'MDB', 'SHOP', 'XYZ', 'UBER', 'DASH', 'ABNB', 'DELL', 'MRVL',
'MU', 'QCOM', 'INTC', 'UNH', 'AI', 'LUNR', 'ASTS', 'ACHR', 'JOBY', 'OKLO',
'PSTG', 'VVV', 'BWA', 'OKTA', 'FUTU', 'NTRA', 'COHR', 'NTSK', 'YMM', 'TUSK'
];

async function fetchScreenerTickers(scrId, count = 45) {
try {
const url = `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&lang=en-US&region=US&scrIds=${scrId}&count=${count}`;
const res = await fetch(url, { headers: YAHOO_HEADERS, cache: 'no-store' });
if (!res.ok) return [];
const data = await res.json();
const quotes = data?.finance?.result?.[0]?.quotes || [];
return quotes.map((q) => q.symbol).filter(Boolean);
} catch (err) {
console.error(`Error fetching screener ${scrId}:`, err);
return [];
}
}

/**
* Compute average daily volume from recent completed daily bars via v8/finance/chart
* (avoids v7/finance/quote cookie/crumb blocks).
*/
async function fetchDailyAvgVolume(symbol) {
try {
const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
symbol
)}?interval=1d&range=1mo`;
const res = await fetch(url, { headers: YAHOO_HEADERS, cache: 'no-store' });
if (!res.ok) return 0;

const data = await res.json();
const result = data?.chart?.result?.[0];
if (!result) return 0;

const metaAvg =
result.meta?.averageDailyVolume3Month ||
result.meta?.averageDailyVolume10Day ||
0;
if (metaAvg > 0) return metaAvg;

const dailyVols = (result.indicators?.quote?.[0]?.volume || []).filter(
(v) => typeof v === 'number' && v > 0
);
// Exclude the last element if it is the partial current trading session
const completedSessions =
dailyVols.length > 1 ? dailyVols.slice(0, -1) : dailyVols;
if (completedSessions.length === 0) return 0;

const sum = completedSessions.reduce((acc, v) => acc + v, 0);
return Math.round(sum / completedSessions.length);
} catch (err) {
return 0;
}
}

async function fetchTickerMetrics(symbol) {
try {
const [chartRes, avgVolume] = await Promise.all([
fetch(
`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
symbol
)}?interval=5m&range=1d&includePrePost=true`,
{ headers: YAHOO_HEADERS, cache: 'no-store' }
),
fetchDailyAvgVolume(symbol),
]);

if (!chartRes.ok) return null;
const data = await chartRes.json();
const result = data?.chart?.result?.[0];
if (!result) return null;

const meta = result.meta || {};
const quote = result.indicators?.quote?.[0] || {};
const closes = (quote.close || []).filter((v) => v != null);
const volumes = (quote.volume || []).filter((v) => v != null);

const price =
meta.regularMarketPrice ||
(closes.length > 0 ? closes[closes.length - 1] : 0);
const prevClose = meta.chartPreviousClose || meta.previousClose || 0;
const open = meta.regularMarketOpen || (closes.length > 0 ? closes[0] : price);
const dayHigh = meta.regularMarketDayHigh || Math.max(...closes, price);
const dayLow = meta.regularMarketDayLow || Math.min(...closes, price);
const volume =
meta.regularMarketVolume ||
volumes.reduce((sum, v) => sum + v, 0);

const resolvedAvgVolume =
avgVolume ||
meta.averageDailyVolume3Month ||
meta.averageDailyVolume10Day ||
0;

let pvSum = 0;
let volSum = 0;
const highs = quote.high || [];
const lows = quote.low || [];
const barCloses = quote.close || [];
const barVols = quote.volume || [];

for (let i = 0; i < barCloses.length; i++) {
if (
highs[i] != null &&
lows[i] != null &&
barCloses[i] != null &&
barVols[i] != null &&
barVols[i] > 0
) {
const typicalPrice = (highs[i] + lows[i] + barCloses[i]) / 3;
pvSum += typicalPrice * barVols[i];
volSum += barVols[i];
}
}

const vwap = volSum > 0 ? pvSum / volSum : (dayHigh + dayLow + price) / 3;

return {
symbol,
name: meta.shortName || meta.longName || symbol,
price,
prevClose,
open,
dayHigh,
dayLow,
volume,
avgVolume: resolvedAvgVolume,
vwap,
};
} catch (err) {
return null;
}
}

function evaluateIntradaySetup(stock) {
const {
price,
prevClose,
open,
dayHigh,
dayLow,
volume,
avgVolume,
vwap,
} = stock;

if (!price || price < 3.0 || !volume || volume < 250000) {
return null;
}

const relVol = avgVolume > 0 ? Number((volume / avgVolume).toFixed(2)) : 0;
const totalChangePct =
prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;
const intradayMovePct = open > 0 ? ((price - open) / open) * 100 : 0;
const offLowPct = dayLow > 0 ? ((price - dayLow) / dayLow) * 100 : 0;

const rangeSpan = dayHigh - dayLow;
const rangePosition = rangeSpan > 0 ? (price - dayLow) / rangeSpan : 0.5;

if (totalChangePct < 2.0 && intradayMovePct < 2.0) {
return null;
}

let score = 0;

// 1. Relative Volume Fuel (Max 35 pts)
if (relVol >= 2.5) score += 35;
else if (relVol >= 1.75) score += 28;
else if (relVol >= 1.25) score += 22;
else if (relVol >= 0.9) score += 10;
else if (avgVolume > 0) score -= 12;

// 2. High-of-Day Range Position (Max 35 pts)
if (rangePosition >= 0.88) score += 35;
else if (rangePosition >= 0.75) score += 26;
else if (rangePosition >= 0.60) score += 14;
else score -= 15;

// 3. Intraday Ignition Surge (Max 30 pts)
const activeSurge = Math.max(intradayMovePct, offLowPct * 0.75);
if (activeSurge >= 7.0) score += 30;
else if (activeSurge >= 3.5) score += 22;
else if (activeSurge >= 1.8) score += 14;

// 4. VWAP Confirmation & Fading Overnight Gap Penalty
const aboveVwap = price > vwap;
if (aboveVwap) {
score += 10;
} else {
score -= 12;
}

const isFadingGap = totalChangePct > 40 && price < open;
if (isFadingGap) {
score -= 30;
}

const finalScore = Math.max(0, Math.min(100, Math.round(score)));

let setup = 'PRE/GAP WATCH';
if (isFadingGap || !aboveVwap) {
setup = 'PULLBACK / DIP';
} else if (finalScore >= 72 && relVol >= 1.25 && rangePosition >= 0.75) {
setup = 'EARLY IGNITION';
} else if (aboveVwap && rangePosition >= 0.60) {
setup = 'BREAKOUT RUN';
}

return {
ticker: stock.symbol,
name: stock.name,
price: Number(price.toFixed(2)),
changePercent: Number(totalChangePct.toFixed(2)),
intradayChangePercent: Number(intradayMovePct.toFixed(2)),
relVol,
vwap: Number(vwap.toFixed(2)),
rangePosition: Number((rangePosition * 100).toFixed(0)),
score: finalScore,
setup,
};
}

export async function GET() {
try {
const [gainers, actives] = await Promise.all([
fetchScreenerTickers('day_gainers', 45),
fetchScreenerTickers('most_actives', 45),
]);

const screenerSource =
gainers.length > 0 || actives.length > 0
? 'LIVE_SCREENER_PLUS_BASKET'
: 'FALLBACK_MOMENTUM_BASKET';

const uniqueTickers = Array.from(
new Set([...gainers, ...actives, ...FALLBACK_MOMENTUM_BASKET])
)
.filter((sym) => !sym.includes('^') && !sym.includes('=') && !sym.includes('.'))
.slice(0, 75);

const metricsList = await Promise.all(
uniqueTickers.map((sym) => fetchTickerMetrics(sym))
);

const ranked = metricsList
.filter(Boolean)
.map((stock) => evaluateIntradaySetup(stock))
.filter((item) => item && item.score >= 30)
.sort((a, b) => b.score - a.score || b.relVol - a.relVol)
.slice(0, 15)
.map((item, idx) => {
let signal = 'MONITOR';
if (idx === 0 && item.score >= 72 && item.relVol >= 1.25) {
signal = 'TOP LEADER';
} else if (idx <= 2 && item.score >= 60) {
signal = 'CHALLENGER';
}
return {
...item,
signal,
};
});

return NextResponse.json({
success: true,
timestamp: new Date().toISOString(),
mode: 'INTRADAY_FIRST_MOVER_ROTATION',
source: screenerSource,
count: ranked.length,
stocks: ranked,
});
} catch (error) {
console.error('Scanner API Error:', error);
return NextResponse.json(
{ success: false, error: 'Failed to run market-wide intraday scan' },
{ status: 500 }
);
}
}
