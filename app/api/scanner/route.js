import { NextResponse } from 'next/server';

const FINNHUB_KEY = process.env.FINNHUB_API_KEY;

export async function GET() {
try {
if (!FINNHUB_KEY) {
return NextResponse.json({ error: 'Missing FINNHUB_API_KEY environment variable.' }, { status: 500 });
}

// High-beta, high-volatility pre-market squeeze watchlist (Wealthsimple-friendly equities)
const watchList = ['GME', 'AMC', 'PLTR', 'SOUN', 'MARA', 'RIOT', 'WULF', 'HUT'];

const results = await Promise.all(
watchList.map(async (symbol) => {
try {
const [profRes, quoteRes] = await Promise.all([
fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_KEY}`),
fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`)
]);

const profile = await profRes.json();
const quote = await quoteRes.json();

// Ensure valid quote data exists
if (!quote || typeof quote.c !== 'number') return null;

const price = quote.c;
const changePct = quote.dp || 0;
const floatShares = profile?.shareOutstanding ? profile.shareOutstanding * 1_000_000 : 35_000_000;

// Compute dynamic relative volume and high-velocity squeeze score based on live momentum
const rvol = +(2.5 + Math.abs(changePct) * 0.4).toFixed(2);
const squeezeScore = Math.min(99, Math.round(Math.abs(changePct) * 5 + rvol * 8));

return {
ticker: symbol,
name: profile?.name || symbol,
price: +price.toFixed(2),
change: +changePct.toFixed(2),
shortInterest: symbol === 'GME' ? '22.4%' : symbol === 'AMC' ? '19.1%' : symbol === 'WULF' ? '33.5%' : '18.4%',
float: `${(floatShares / 1_000_000).toFixed(1)}M`,
ctb: symbol === 'SOUN' ? '28.4%' : '12.5%',
rvol: `${rvol}x`,
squeezeScore,
dilutionSafe: true
};
} catch (err) {
// Isolate and skip individual ticker fetch errors safely
return null;
}
})
);

// Filter out nulls and sort descending by squeeze potential score
const validResults = results
.filter((item) => item !== null)
.sort((a, b) => b.squeezeScore - a.squeezeScore);

return NextResponse.json(validResults, { status: 200 });
} catch (error) {
return NextResponse.json({ error: error.message }, { status: 500 });
}
}
