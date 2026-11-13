import { NextResponse } from 'next/server';

export async function GET() {
try {
const fmpApiKey = process.env.STOCK_API_KEY || process.env.FMP_API_KEY;

if (!fmpApiKey) {
return NextResponse.json(
{ error: 'Missing FMP_API_KEY or STOCK_API_KEY in Vercel Environment Variables' },
{ status: 500 }
);
}

// Determine Market Mode
const now = new Date();
const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
const estHour = estTime.getHours();
const estMin = estTime.getMinutes();
const timeNum = estHour * 100 + estMin;

let marketMode = 'PRE-MARKET';
if (timeNum >= 930 && timeNum < 1600) {
marketMode = 'LIVE MARKET';
} else if (timeNum >= 1600) {
marketMode = 'AFTER-HOURS';
}

// 1. Pull market-wide most active (highest volume) stocks across NYSE & NASDAQ
const activeRes = await fetch(
`https://financialmodelingprep.com/stable/most-actives?apikey=${fmpApiKey}`,
{ cache: 'no-store' }
);
const activeData = await activeRes.json();

let matchedSetups = [];

if (Array.isArray(activeData)) {
for (const stock of activeData) {
const price = stock.price || 0;
const changesPercentage = stock.changesPercentage || 0;

// Filter criteria: Price >= $1.00, Change between +1.0% and +12.0% (widen window to catch early ignition)
if (price >= 1.00 && changesPercentage >= 1.0 && changesPercentage <= 12.0) {

// Calculate a basic Squeeze Score based on relative movement
let score = Math.round(changesPercentage * 8 + (stock.volume ? Math.log10(stock.volume) * 2 : 10));

matchedSetups.push({
ticker: stock.symbol,
company: stock.companyName || stock.symbol,
price: price,
change: changesPercentage,
volume: stock.volume || 0,
score: score,
verdict: changesPercentage >= 4.0 ? 'EARLY IGNITION' : 'DEVELOPING SETUP'
});
}
}
}

// Sort by highest score/momentum
matchedSetups.sort((a, b) => b.score - a.score);

return NextResponse.json({
success: true,
marketMode: marketMode,
count: matchedSetups.length,
data: matchedSetups
});

} catch (error) {
return NextResponse.json(
{ success: false, error: error.message },
{ status: 500 }
);
}
}
