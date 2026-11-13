import { NextResponse } from 'next/server';

export async function GET() {
try {
const fmpApiKey = process.env.STOCK_API_KEY || process.env.FMP_API_KEY;
const finnhubApiKey = process.env.FINNHUB_API_KEY;

// Watchlist & market movers to scan
const symbols = ['WULF', 'SOUN', 'GME', 'AMC', 'PLTR', 'MARA', 'RIOT', 'HUT'];

// Determine Market Mode (EST timezone awareness)
const now = new Date();
const estTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
const hours = estTime.getHours();
const minutes = estTime.getMinutes();
const timeNum = hours * 100 + minutes;

let marketMode = 'PRE-MARKET';
if (timeNum >= 930 && timeNum < 1600) {
marketMode = 'LIVE MARKET';
} else if (timeNum >= 1600) {
marketMode = 'AFTER-HOURS';
}

const setups = [];

// Fetch quote data for watchlist symbols
for (const symbol of symbols) {
try {
// Fetch from Finnhub or FMP
const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubApiKey}`);
const quote = await res.json();

if (quote && quote.c) {
const currentPrice = quote.c;
const prevClose = quote.pc || currentPrice;
const openPrice = quote.o || currentPrice;
const highPrice = quote.h || currentPrice;
const lowPrice = quote.l || currentPrice;

const gapPercent = Number((((openPrice - prevClose) / prevClose) * 100).toFixed(2));
const rangePosition = highPrice > lowPrice
? Math.round(((currentPrice - lowPrice) / (highPrice - lowPrice)) * 100)
: 50;

// Calculate Squeeze Score (0-100)
let squeezeScore = Math.min(100, Math.max(10, Math.round(
(gapPercent > 0 ? gapPercent * 5 : 10) + (rangePosition * 0.4)
)));

setups.push({
symbol,
name: `${symbol} Inc.`,
price: currentPrice.toFixed(2),
gapPercent,
rangePosition,
squeezeScore,
verdict: squeezeScore > 75 ? 'HIGH SQUEEZE POTENTIAL' : 'MONITOR MOMENTUM'
});
}
} catch (err) {
console.error(`Error fetching ${symbol}:`, err);
}
}

// Sort by Squeeze Score descending
setups.sort((a, b) => b.squeezeScore - a.squeezeScore);

const topContender = setups.length > 0 ? setups[0] : null;
if (topContender) {
topContender.topContender = true;
}

return NextResponse.json({
marketMode,
topContender,
allSetups: setups,
timestamp: new Date().toISOString()
});

} catch (error) {
console.error('Scanner API Error:', error);
return NextResponse.json({ error: 'Failed to scan market data' }, { status: 500 });
}
}
