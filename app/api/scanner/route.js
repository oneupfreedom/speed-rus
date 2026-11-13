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

// Determine Market Mode (EST timezone awareness)
const now = new Date();
const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
const timeNum = estTime.getHours() * 100 + estTime.getMinutes();

let marketMode = 'PRE-MARKET';
if (timeNum >= 930 && timeNum < 1600) {
marketMode = 'LIVE MARKET';
} else if (timeNum >= 1600) {
marketMode = 'AFTER-HOURS';
}

// 1. Pull market-wide Most Active (highest volume) stocks across NYSE & NASDAQ
const activeRes = await fetch(
`https://financialmodelingprep.com/stable/most-actives?apikey=${fmpApiKey}`,
{ cache: 'no-store' }
);
const activeData = await activeRes.json();

if (!Array.isArray(activeData)) {
return NextResponse.json(
{ error: 'Unexpected response from FMP most-actives endpoint', details: activeData },
{ status: 502 }
);
}

// 2. Filter for early-stage movers (+1.5% to +8%) with real liquidity
const setups = activeData
.filter((stock) => {
const price = Number(stock.price) || 0;
const pct = Number(stock.changesPercentage) || 0;
const vol = Number(stock.volume) || 0;
return price >= 1.0 && pct >= 1.5 && pct <= 8.0 && vol >= 500000;
})
.slice(0, 25)
.map((stock) => {
const currentPrice = Number(stock.price) || 0;
const gapPercent = Number((stock.changesPercentage || 0).toFixed(2));
const highPrice = Number(stock.dayHigh) || currentPrice;
const lowPrice = Number(stock.dayLow) || currentPrice;
const volume = Number(stock.volume) || 0;
const avgVolume = Number(stock.avgVolume) || volume;

// Calculate Relative Volume (RVOL) ratio
const rvol = avgVolume > 0 ? Number((volume / avgVolume).toFixed(2)) : 1.0;

// Intraday range position (0-100%)
const rangePosition =
highPrice > lowPrice
? Math.round(((currentPrice - lowPrice) / (highPrice - lowPrice)) * 100)
: 80;

// Early Ignition Score: prioritizes RVOL spikes + tight high-of-day pressure
const rvolPoints = Math.min(rvol * 15, 45); // Up to 45 pts for 3x+ volume
const rangePoints = rangePosition * 0.35; // Up to 35 pts for holding highs
const earlyMovePoints = Math.min(gapPercent * 2.5, 20); // Up to 20 pts for +2% to +8% build

const squeezeScore = Math.min(
100,
Math.max(10, Math.round(rvolPoints + rangePoints + earlyMovePoints))
);

return {
symbol: stock.symbol,
name: `${stock.name || stock.symbol} (${rvol}x Vol)`,
price: currentPrice.toFixed(2),
gapPercent,
rangePosition,
squeezeScore,
verdict: squeezeScore >= 75 ? 'EARLY IGNITION / BREAKOUT' : 'BUILDING PRESSURE',
};
});

// 3. Sort highest Early Ignition Score to the #1 spot
setups.sort((a, b) => b.squeezeScore - a.squeezeScore);

const topContender = setups.length > 0 ? setups[0] : null;
if (topContender) {
topContender.topContender = true;
}

return NextResponse.json({
marketMode,
topContender,
allSetups: setups,
timestamp: new Date().toISOString(),
});
} catch (error) {
console.error('Early Ignition Scanner Error:', error);
return NextResponse.json({ error: 'Failed to scan early setups' }, { status: 500 });
}
}
