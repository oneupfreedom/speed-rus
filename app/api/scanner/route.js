
import { NextResponse } from 'next/server';

export async function GET() {
const apiKey = process.env.FMP_API_KEY;

if (!apiKey) {
return NextResponse.json({ success: false, error: 'API Key missing on Vercel' }, { status: 200 });
}

try {
const res = await fetch(`https://financialmodelingprep.com/stable/biggest-gainers?apikey=${apiKey}`);
const gainers = await res.json();

if (!Array.isArray(gainers)) {
const errorMsg = gainers["Error Message"] || gainers.message || "Invalid API response from FMP";
return NextResponse.json({ success: false, error: errorMsg }, { status: 200 });
}

const processed = gainers.map((stock) => {
const price = stock.price || 0;
const change = stock.changesPercentage || stock.changePercentage || stock.change || 0;

const volume = stock.sharesTraded || stock.volume || 0;
const avgVolume = stock.avgVolume || 500000;

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
symbol: stock.symbol || 'UNKNOWN',
name: stock.name || stock.symbol || 'Unknown Company',
price: price,
change: change,
volume: volume,
relVolume: relVolume,
score: score,
classification: classification
};
})
.filter((stock) => stock.price > 0.05 && stock.volume > 10000)
.sort((a, b) => b.score - a.score)
.slice(0, 25);

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
