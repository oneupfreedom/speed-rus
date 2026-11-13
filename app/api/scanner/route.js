mport { NextResponse } from 'next/server';

export async function GET() {
const apiKey = process.env.FMP_API_KEY;

if (!apiKey) {
return NextResponse.json({ success: false, error: 'API Key missing' }, { status: 500 });
}

try {
// Fetching biggest gainers from Financial Modeling Prep
const res = await fetch(`https://financialmodelingprep.com/api/v3/stock_market/gainers?apikey=${apiKey}`);
const gainers = await res.json();

if (!Array.isArray(gainers)) {
return NextResponse.json({ success: true, data: [], marketMode: 'LIVE MARKET' });
}

// Process and score stocks to find early ignition / momentum candidates
const processed = gainers.map((stock) => {
const price = stock.price || 0;
const change = stock.changesPercentage || stock.changePercentage || 0;
const volume = stock.volume || 0;
const avgVolume = stock.avgVolume || volume || 1;

// Calculate a relative volume surge indicator
const relVolume = avgVolume > 0 ? (volume / avgVolume) : 1;

// Early Ignition Scoring Algorithm (0-100)
// Rewards moderate-to-high gainers with surging volume
let score = 50;
if (change >= 1 && change <= 25) score += 20;
if (relVolume > 1.5) score += 20;
if (price > 1 && price < 50) score += 10; // Prefers accessible momentum stocks

if (score > 100) score = 100;

// Determine early-ignition verdict
let verdict = 'WATCHING';
if (change >= 3 && relVolume > 1.2) {
verdict = 'EARLY IGNITION';
} else if (change >= 8) {
verdict = 'BREAKOUT RUN';
} else {
verdict = 'BUILDING BASE';
}

return {
ticker: stock.symbol,
company: stock.name || stock.symbol,
price: price,
change: change,
volume: volume,
score: score,
verdict: verdict
};
});

// Sort by momentum score / change to surface top setups first
processed.sort((a, b) => b.score - a.score);

return NextResponse.json({
success: true,
marketMode: 'EARLY IGNITION',
data: processed.slice(0, 20) // Top 20 filtered candidates
});

} catch (error) {
console.error('Scanner API Error:', error);
return NextResponse.json({ success: false, error: error.message }, { status: 500 });
}
}
