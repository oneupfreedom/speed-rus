import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
const symbols = ['WULF', 'SOUN', 'GME', 'AMC', 'PLTR', 'MARA', 'RIOT', 'HUT', 'TSLA', 'NVDA', 'AAPL'];
const results = [];

try {
await Promise.all(
symbols.map(async (symbol) => {
try {
const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
const res = await fetch(url, {
headers: {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
},
cache: 'no-store',
});

if (!res.ok) return;

const json = await res.json();
const result = json?.chart?.result?.[0];
const meta = result?.meta;
if (!meta) return;

const price = meta.regularMarketPrice ?? 0;
const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
const change = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
const volume = meta.regularMarketVolume ?? 0;

// Calculate 5-day average volume from historical bars for accurate Rel Vol
const quoteVolumes = result?.indicators?.quote?.[0]?.volume || [];
const validVols = quoteVolumes.filter((v) => typeof v === 'number' && v > 0);
const avgVolume =
validVols.length > 0
? validVols.reduce((sum, v) => sum + v, 0) / validVols.length
: volume || 1;

const relVolume = Number((volume / (avgVolume || 1)).toFixed(2));

// Custom momentum score calculation (0-100 scale)
let score = 50;
if (change > 0) score += Math.min(30, change * 3);
if (relVolume > 1.0) score += Math.min(20, (relVolume - 1) * 10);
score = Math.min(100, Math.max(10, Math.round(score)));

// Classification based on momentum characteristics
let classification = 'MONITOR';
if (change >= 5 && relVolume >= 1.5) {
classification = 'EARLY IGNITION';
} else if (change >= 3) {
classification = 'BREAKOUT RUN';
} else if (change < 0) {
classification = 'PULLBACK / DIP';
}

results.push({
symbol: symbol.toUpperCase(),
name: meta.longName || meta.shortName || symbol,
price: Number(price.toFixed(2)),
change: Number(change.toFixed(2)),
volume: volume,
relVolume: relVolume > 0 ? relVolume : 1.0,
score: score,
classification: classification,
});
} catch (err) {
console.error(`Error fetching ${symbol}:`, err);
}
})
);

// Sort results by score descending so the top momentum stock is always #1
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
