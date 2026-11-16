import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
const dynamicSymbols = new Set();

const headers = {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
};

try {
// 1. 100% Market-Wide Sweep via Yahoo live pre-defined screener feeds (Gainers & Most Actives)
const screenerUrls = [
'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&lang=en-US&region=US&scrIds=day_gainers&count=25',
'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&lang=en-US&region=US&scrIds=most_actives&count=25',
];

await Promise.all(
screenerUrls.map(async (url) => {
try {
const res = await fetch(url, { headers, cache: 'no-store' });
if (!res.ok) return;
const json = await res.json();
const quotes = json?.finance?.result?.[0]?.quotes || [];
for (const q of quotes) {
// Filter out OTC/pink sheet junk and keep liquid US stocks with volume > 250k
if (q?.symbol && !q.symbol.includes('.') && (q.regularMarketVolume || 0) > 250000) {
dynamicSymbols.add(q.symbol.toUpperCase());
}
}
} catch (e) {
console.error('Market-wide screener fetch warning:', e);
}
})
);

const symbolsList = Array.from(dynamicSymbols);
const results = [];

// 2. Fetch live + extended hours data for every symbol found in the market sweep
await Promise.all(
symbolsList.map(async (symbol) => {
try {
const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=5m&range=5d&includePrePost=true`;
const res = await fetch(chartUrl, { headers, cache: 'no-store' });
if (!res.ok) return;

const json = await res.json();
const result = json?.chart?.result?.[0];
const meta = result?.meta;
if (!meta) return;

const regularPrice = meta.regularMarketPrice ?? 0;
const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? regularPrice;

// Grab the latest price print
const closes = result?.indicators?.quote?.[0]?.close || [];
const validCloses = closes.filter((c) => typeof c === 'number' && c > 0);
const latestLivePrice = validCloses.length > 0 ? validCloses[validCloses.length - 1] : regularPrice;

const activePrice = latestLivePrice || regularPrice;
const change = prevClose ? ((activePrice - prevClose) / prevClose) * 100 : 0;

// Opening Gap %
const dayOpen = meta.regularMarketOpen ?? activePrice;
const gapPercent = prevClose ? ((dayOpen - prevClose) / prevClose) * 100 : 0;

// Volume & Relative Volume
const volume = meta.regularMarketVolume ?? 0;
const quoteVolumes = result?.indicators?.quote?.[0]?.volume || [];
const validVols = quoteVolumes.filter((v) => typeof v === 'number' && v > 0);
const total5dVol = validVols.reduce((sum, v) => sum + v, 0);
const avgDailyVol = total5dVol > 0 ? total5dVol / 5 : volume || 1;
const relVolume = Number((volume / (avgDailyVol || 1)).toFixed(2));

// 3. Tactical Momentum Score (0-100)
let score = 40;
if (change > 0) score += Math.min(35, change * 2.2);
if (gapPercent >= 3) score += 12;
if (relVolume > 1.2) score += Math.min(15, (relVolume - 1) * 8);
score = Math.min(100, Math.max(10, Math.round(score)));

// 4. Setup Classification (Isolating EARLY IGNITION leaders)[span_1](start_span)[span_1](end_span)
let classification = 'MONITOR';
if (gapPercent >= 3 && change >= 4 && relVolume >= 1.5) {
classification = 'EARLY IGNITION';
} else if (change >= 5) {
classification = 'BREAKOUT RUN';
} else if (gapPercent >= 3) {
classification = 'PRE/GAP WATCH';
} else if (change < -1) {
classification = 'PULLBACK / DIP';
}

results.push({
symbol,
name: meta.longName || meta.shortName || symbol,
price: Number(activePrice.toFixed(2)),
change: Number(change.toFixed(2)),
volume,
relVolume: relVolume > 0 ? relVolume : 1.0,
score,
classification,
});
} catch (err) {
console.error(`Error processing ${symbol}:`, err);
}
})
);

// Sort highest tactical score to the top of the board
results.sort((a, b) => b.score - a.score);

return NextResponse.json({
success: true,
count: results.length,
data: results,
timestamp: new Date().toISOString(),
});
} catch (error) {
return NextResponse.json(
{ success: false, error: error instanceof Error ? error.message : String(error), data: [] },
{ status: 500 }
);
}
}
