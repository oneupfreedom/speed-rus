import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const YAHOO_HEADERS = {
'User-Agent':
'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
Accept: 'application/json',
};

/**
* Fetch live market-wide movers from Yahoo Finance pre-defined screeners
* (day_gainers and most_actives) to capture all surging equities without a static watchlist.
*/
async function fetchScreenerTickers(scrId, count = 40) {
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
* Fetch detailed regular-session & intraday range metrics for each candidate ticker
* using Yahoo v8 chart endpoint (includePrePost=true).
*/
async function fetchTickerMetrics(symbol) {
try {
const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
symbol
)}?interval=5m&range=1d&includePrePost=true`;
const res = await fetch(url, { headers: YAHOO_HEADERS, cache: 'no-store' });
if (!res.ok) return null;

const data = await res.json();
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
const avgVolume =
meta.averageDailyVolume3Month ||
meta.averageDailyVolume10Day ||
0;

// Approximate institutional VWAP from intraday typical price weighted by bar volume
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
avgVolume,
vwap,
};
} catch (err) {
return null;
}
}

/**
* Tuned Mid-Session VWAP & Relative Volume Breakout Scoring Engine
* Captures first-mover institutional rotations (1.25x+ Rel Vol, Score 72+ Top Leader)
* while maintaining $3.00+ and 250k+ volume quality gates.
*/
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

// Liquidity & penny-stock noise gate
if (!price || price < 3.0 || !volume || volume < 250000) {
return null;
}

const relVol = avgVolume > 0 ? volume / avgVolume : 0;
const totalChangePct =
prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;
const intradayMovePct = open > 0 ? ((price - open) / open) * 100 : 0;
const offLowPct = dayLow > 0 ? ((price - dayLow) / dayLow) * 100 : 0;

const rangeSpan = dayHigh - dayLow;
const rangePosition = rangeSpan > 0 ? (price - dayLow) / rangeSpan : 0.5;

// Must be net positive on the day or actively breaking out intraday
if (totalChangePct < 2.0 && intradayMovePct < 2.0) {
return null;
}

let score = 0;

// 1. Relative Volume Fuel (Max 35 pts) - Tuned to catch 1.25x+ first-mover ignitions
if (relVol >= 2.5) score += 35;
else if (relVol >= 1.75) score += 28;
else if (relVol >= 1.25) score += 22;
else if (relVol >= 0.9) score += 10;
else score -= 12;

// 2. High-of-Day Range Position (Max 35 pts)
if (rangePosition >= 0.88) score += 35; // Pressing right at High of Day
else if (rangePosition >= 0.75) score += 26; // Upper 25% breakout zone
else if (rangePosition >= 0.60) score += 14;
else score -= 15; // Stuck or fading in lower half of daily range

// 3. Intraday Ignition Surge (Max 30 pts) - Rewards red-to-green & midday breakouts
const activeSurge = Math.max(intradayMovePct, offLowPct * 0.75);
if (activeSurge >= 7.0) score += 30;
else if (activeSurge >= 3.5) score += 22;
else if (activeSurge >= 1.8) score += 14;

// 4. VWAP Confirmation & Fading Overnight Gap Penalty
const aboveVwap = price > vwap;
if (aboveVwap) {
score += 10; // Institutional buyers in control above VWAP
} else {
score -= 12; // Weak / below VWAP
}

// Penalize exhausted overnight gaps (>40%) trading below regular session open
const isFadingGap = totalChangePct > 40 && price < open;
if (isFadingGap) {
score -= 30;
}

const finalScore = Math.max(0, Math.min(100, Math.round(score)));

// Assign tactical Setup & Signal badges aligned with frontend columns
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
relVol: Number(relVol.toFixed(2)),
vwap: Number(vwap.toFixed(2)),
rangePosition: Number((rangePosition * 100).toFixed(0)),
score: finalScore,
setup,
};
}

export async function GET() {
try {
// 1. Sweep market-wide gainers & most active equities
const [gainers, actives] = await Promise.all([
fetchScreenerTickers('day_gainers', 45),
fetchScreenerTickers('most_actives', 45),
]);

// Deduplicate tickers (exclude indices/ETFs with ^ or =)
const uniqueTickers = Array.from(new Set([...gainers, ...actives])).filter(
(sym) => !sym.includes('^') && !sym.includes('=') && !sym.includes('.')
);

// 2. Fetch live metrics in parallel
const metricsList = await Promise.all(
uniqueTickers.slice(0, 65).map((sym) => fetchTickerMetrics(sym))
);

// 3. Score, filter, and rank top momentum setups (Display floor: 30, Top Leader: 72+)
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
