import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET() {
// Explicitly track your custom high-beta watchlist + broad market leaders
const symbols = ['WULF', 'SOUN', 'GME', 'AMC', 'PLTR', 'MARA', 'RIOT', 'HUT', 'TSLA', 'NVDA', 'AAPL'];
const results = [];

try {
for (const symbol of symbols) {
try {
const quote = await yahooFinance.quote(symbol);
if (!quote) continue;

const price = quote.regularMarketPrice || quote.precio || 0;
const prevClose = quote.regularMarketPreviousClose || price;
const change = quote.regularMarketChangePercent || ((price - prevClose) / prevClose) * 100;
const volume = quote.regularMarketVolume || quote.volume || 0;
const avgVolume = quote.averageDailyVolume3Month || volume || 1;

// Calculate relative volume
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
name: quote.longName || quote.shortName || symbol,
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
{ success: false, error: error.message, data: [] },
{ status: 500 }
);
}
}
