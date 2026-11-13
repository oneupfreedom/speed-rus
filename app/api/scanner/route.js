import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
const fmpKey = process.env.STOCK_API_KEY;
const finnhubKey = process.env.FINNHUB_API_KEY;

if (!fmpKey || !finnhubKey) {
return NextResponse.json(
{ error: 'Missing STOCK_API_KEY or FINNHUB_API_KEY in Vercel environment variables.' },
{ status: 500 }
);
}

try {
// 1. Fetch top market gainers
const gainersRes = await fetch(
`https://financialmodelingprep.com/stable/biggest-gainers?apikey=${fmpKey}`,
{ cache: 'no-store' }
);
const marketGainers = await gainersRes.json();

if (!Array.isArray(marketGainers)) {
return NextResponse.json({ error: 'Invalid response from market screener', raw: marketGainers }, { status: 502 });
}

// 2. Filter for actionable stocks ($1.00+ price, +3.0% minimum momentum)
const candidates = marketGainers
.filter((item) => item.price >= 1.0 && (item.changesPercentage || item.change) >= 3.0)
.slice(0, 15);

// Determine if regular market hours have started (9:30 AM EST)
const now = new Date();
const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
const hours = estTime.getHours();
const minutes = estTime.getMinutes();
const isMarketOpen = hours > 9 || (hours === 9 && minutes >= 30);

// 3. Enrich & score candidates with market-hours weighting
const results = await Promise.all(
candidates.map(async (stock) => {
try {
const quoteRes = await fetch(
`https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${finnhubKey}`,
{ cache: 'no-store' }
);
const quote = await quoteRes.json();

const currentPrice = quote.c || stock.price;
const changePct = stock.changesPercentage || stock.change || 0;
const prevClose = quote.pc || (currentPrice / (1 + changePct / 100));
const gapPercent = prevClose > 0 ? ((currentPrice - prevClose) / prevClose) * 100 : changePct;

const dayHigh = quote.h || currentPrice;
const dayLow = quote.l || currentPrice;
const rangePosition = dayHigh > dayLow ? ((currentPrice - dayLow) / (dayHigh - dayLow)) * 100 : 100;

// If market is open, heavily factor in range dominance and active volume momentum
const marketMultiplier = isMarketOpen ? 1.25 : 1.0;
const squeezeScore = Number((gapPercent * (rangePosition / 100) * marketMultiplier).toFixed(2));

return {
symbol: stock.symbol,
name: stock.name || stock.symbol,
price: Number(currentPrice.toFixed(2)),
gapPercent: Number(gapPercent.toFixed(2)),
rangePosition: Math.round(rangePosition),
squeezeScore,
verdict: squeezeScore > 80 ? '🔥 High Squeeze Potential' : '⚡ Moderate Momentum',
};
} catch {
return null;
}
})
);

// 4. Sort and designate the #1 Top Contender at the very top
const rankedSetups = results
.filter((item) => item !== null && item.gapPercent >= 3.0)
.sort((a, b) => b.squeezeScore - a.squeezeScore);

if (rankedSetups.length > 0) {
rankedSetups[0].topContender = true; // Clearly marks the #1 play for your strategy
}

return NextResponse.json({
marketMode: isMarketOpen ? 'LIVE_MARKET_HOURS' : 'PRE_MARKET_PREPARATION',
topContender: rankedSetups[0] || null,
allSetups: rankedSetups,
});
} catch (error) {
return NextResponse.json({ error: 'Scanner execution failed', details: error.message }, { status: 500 });
}
}
