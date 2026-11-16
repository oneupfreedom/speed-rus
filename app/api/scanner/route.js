import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

export const dynamic = 'force-dynamic';

export async function GET() {
const symbols = ['WULF', 'SOUN', 'GME', 'AMC', 'PLTR', 'MARA', 'RIOT', 'HUT', 'TSLA', 'NVDA', 'AAPL'];
const results = [];

try {
// Instantiate YahooFinance properly for v3/v4+
const yahooFinance = new YahooFinance();

// Fetch all symbols in a single batch call (much faster & avoids throttling)
const quotes = await yahooFinance.quote(symbols);

for (const quote of quotes) {
if (!quote || !quote.symbol) continue;

const price = quote.regularMarketPrice ?? 0;
const prevClose = quote.regularMarketPreviousClose ?? price;
const change = quote.regularMarketChangePercent ?? (prevClose ? ((price - prevClose) / prevClose) * 100 : 0);
const volume = quote.regularMarketVolume ?? 0;
const avgVolume = quote.averageDailyVolume3Month ?? volume ?? 1;

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
symbol: quote.symbol.toUpperCase(),
name: quote.longName || quote.shortName || quote.symbol,
price: Number(price.toFixed(2)),
change: Number(change.toFixed(2)),
volume: volume,
relVolume: relVolume > 0 ? relVolume : 1.0,
score: score,
classification: classification,
});
}

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
