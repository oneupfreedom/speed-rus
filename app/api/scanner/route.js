import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
// 1. Your core high-beta watchlist
const coreWatchlist = ['WULF', 'SOUN', 'GME', 'AMC', 'PLTR', 'MARA', 'RIOT', 'HUT', 'TSLA', 'NVDA', 'AAPL'];
const dynamicSymbols = new Set(coreWatchlist);

const headers = {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
};

try {
// 2. Pull top market-wide Day Gainers & Most Actives from Yahoo's live screener feed
const screenerUrls = [
'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&lang=en-US&region=US&scrIds=day_gainers&count=15',
'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&lang=en-US&region=US&scrIds=most_actives&count=10',
];

await Promise.all(
screenerUrls.map(async (url) => {
try {
const res = await fetch(url, { headers, cache: 'no-store' });
if (!res.ok) return;
const json = await res.json();
const quotes = json?.finance?.result?.[0]?.quotes || [];
for (const q of quotes) {
// Filter out OTC/pink sheet junk and keep liquid US stocks
if (q?.symbol && !q.symbol.includes('.') && (q.regularMarketVolume || 0) > 250000) {
dynamicSymbols.add(q.symbol.toUpperCase());
}
}
} catch (e) {
console.error('Screener fetch warning:', e);
}
})
);

const symbolsList = Array.from(dynamicSymbols);
const results = [];

// 3. Fetch live + extended hours (pre-market & after-hours) data for all symbols
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

// Grab the very latest extended-hours trade price if available
const closes = result?.indicators?.quote?.[0]?.close || [];
const validCloses = closes.filter((c) => typeof c === 'number' && c > 0);
const latestLivePrice = validCloses.length > 0 ? validCloses[validCloses.length - 1] : regularPrice;

const activePrice = latestLivePrice || regularPrice;
const change = prevClose ? ((activePrice - prevClose) / prevClose) * 100 : 0;

// Calculate Opening Gap %
const dayOpen = meta.regularMarketOpen ?? activePrice;
const gapPercent = prevClose ? ((dayOpen - prevClose) / prevClose) * 100 : 0;

// Volume & Relative Volume
const volume = meta.regularMarketVolume ?? 0;
const quoteVolumes = result?.indicators?.quote?.[0]?.volume || [];
const validVols = quoteVolumes.filter((v) => typeof v === 'number' && v > 0);
const total5dVol = validVols.reduce((sum, v) => sum + v, 0);
const avgDailyVol = total5dVol > 0 ? total5dVol / 5 : volume || 1;
const relVolume = Number((volume / (avgDailyVol || 1)).toFixed(2));

// 4. Tactical Momentum Score (0-100)
let score = 45;
if (change > 0) score += Math.min(30, change * 2.5);
if (gapPercent >= 3) score += 10;
if (relVolume > 1.2) score += Math.min(15, (relVolume - 1) * 8);
score = Math.min(100, Math.max(10, Math.round(score)));

// 5. Setup Classification
let classification = 'MONITOR';
if (gapPercent >= 3 && change >= 5 && relVolume >= 1.5) {
classification = 'EARLY IGNITION';
} else if (change >= 4) {
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
console.error(`Error fetching ${symbol}:`, err);
}
})
);

// Sort highest momentum score to the top
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
