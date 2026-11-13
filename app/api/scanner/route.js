import { NextResponse } from 'next/server';

export async function GET() {
const apiKey = process.env.FMP_API_KEY;

if (!apiKey) {
return NextResponse.json({ success: false, error: 'API Key missing on Vercel' }, { status: 500 });
}

try {
const res = await fetch(`https://financialmodelingprep.com/api/v3/stock_market/gainers?apikey=${apiKey}`);
const gainers = await res.json();

if (!Array.isArray(gainers)) {
const errorMsg = gainers["Error Message"] || gainers.message || "Invalid API response from FMP";
return NextResponse.json({ success: false, error: errorMsg }, { status: 200 });
}

const processed = gainers.map((stock) => {
const price = stock.price || 0;
const change = stock.changesPercentage || stock.changePercentage || 0;
const volume = stock.volume || 0;
const avgVolume = stock.avgVolume || volume || 1;

const relVolume = avgVolume > 0 ? (volume / avgVolume) : 1;

let score = 50;
if (change >= 0.5 && change <= 50) score += 25;
if (relVolume > 1.1) score += 20;
if (price > 0.1 && price < 200) score += 5;

if (score > 100) score = 100;

let verdict = 'WATCHING';
if (change >= 2 && relVolume > 1.0) {
verdict = 'EARLY IGNITION';
} else if (change >= 6) {
verdict = 'BREAKOUT RUN';
} else {
verdict = 'BUILDING BASE';
}

return {
ticker: stock.symbol || 'N/A',
company: stock.name || stock.symbol || 'N/A',
price: price,
change: change,
volume: volume,
score: score,
verdict: verdict
};
});

processed.sort((a, b) => b.score - a.score);

return NextResponse.json({
success: true,
marketMode: 'EARLY IGNITION',
data: processed.slice(0, 25)
});

} catch (error) {
console.error('Scanner API Error:', error);
return NextResponse.json({ success: false, error: error.message }, { status: 500 });
}
}
