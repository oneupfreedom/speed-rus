import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET() {
try {
const queryOptions = { count: 25, region: 'US' };
const results = await yahooFinance.trendingSymbols(queryOptions.region);

const quotes = [];
if (results && results.quotes) {
for (const item of results.quotes) {
const symbol = item.symbol;
try {
const quote = await yahooFinance.quote(symbol);
if (quote) {
quotes.push({
symbol: quote.symbol,
name: quote.longName || quote.shortName || quote.symbol,
price: quote.regularMarketPrice || 0,
change: quote.regularMarketChangePercent || 0,
volume: quote.regularMarketVolume || 0,
avgVolume: quote.averageDailyVolume3Month || quote.regularMarketVolume || 1,
});
}
} catch (e) {
// Skip individual quote errors if any symbol fails
}
}
}

const processed = quotes.map((stock) => {
const price = stock.price;
const change = stock.change;
const volume = stock.volume;
const avgVolume = stock.avgVolume;

const relVolume = avgVolume > 0 ? Number((volume / avgVolume).toFixed(2)) : 1;

let score = 40;
if (change > 30) score += 25;
else if (change > 15) score += 15;
else if (change > 5) score += 5;

if (volume > 2000000) score += 25;
else if (volume > 500000) score += 15;
else if (volume > 100000) score += 5;

if (price > 0.5 && price < 25) score += 15;
if (score > 98) score = 98;

let classification = "BUILDING BASE";
if (score >= 75) classification = "EARLY IGNITION";
else if (score >= 60) classification = "BREAKOUT RUN";

return {
symbol: stock.symbol,
name: stock.name,
price: price,
change: change,
volume: volume,
relVolume: relVolume,
score: score,
classification: classification
};
})
.sort((a, b) => b.score - a.score);

return NextResponse.json({
success: true,
data: processed,
count: processed.length,
timestamp: new Date().toISOString()
});

} catch (err) {
return NextResponse.json({ success: false, error: err.message }, { status: 200 });
}
}
